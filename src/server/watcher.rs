use notify::RecursiveMode;
use notify_debouncer_mini::{new_debouncer, DebouncedEventKind};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::mpsc;
use tokio::task::JoinHandle;

pub struct Watcher {
    root: PathBuf,
    stop_tx: mpsc::UnboundedSender<()>,
    handle: Option<JoinHandle<()>>,
}

impl Watcher {
    pub fn new<F>(root: impl AsRef<Path>, callback: F) -> Result<Self, Box<dyn std::error::Error>>
    where
        F: Fn(String) + Send + Sync + 'static,
    {
        let root = root.as_ref().to_path_buf();
        let (stop_tx, mut stop_rx) = mpsc::unbounded_channel();
        let (event_tx, mut event_rx) = mpsc::unbounded_channel();

        let callback = Arc::new(callback);
        let root_clone = root.clone();

        let mut debouncer = new_debouncer(
            Duration::from_millis(100),
            move |res: Result<Vec<notify_debouncer_mini::DebouncedEvent>, _>| {
                if let Ok(events) = res {
                    for event in events {
                        if let DebouncedEventKind::Any = event.kind {
                            if is_yaml(&event.path) {
                                let _ = event_tx.send(event.path.clone());
                            }
                        }
                    }
                }
            },
        )?;

        debouncer
            .watcher()
            .watch(&root_clone, RecursiveMode::Recursive)?;

        let handle = tokio::spawn(async move {
            let _debouncer = debouncer;
            loop {
                tokio::select! {
                    Some(path) = event_rx.recv() => {
                        callback(path.display().to_string());
                    }
                    Some(_) = stop_rx.recv() => {
                        break;
                    }
                }
            }
        });

        Ok(Self {
            root,
            stop_tx,
            handle: Some(handle),
        })
    }

    pub async fn close(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        let _ = self.stop_tx.send(());

        if let Some(handle) = self.handle.take() {
            handle.await?;
        }

        Ok(())
    }

    pub fn root(&self) -> &Path {
        &self.root
    }
}

fn is_yaml(path: &Path) -> bool {
    if let Some(ext) = path.extension() {
        let ext_str = ext.to_string_lossy().to_lowercase();
        ext_str == "yaml" || ext_str == "yml"
    } else {
        false
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::sync::{Arc, Mutex};
    use tempfile::TempDir;
    use tokio::time::{sleep, Duration};

    #[tokio::test]
    async fn test_watcher_creation() {
        let temp_dir = TempDir::new().unwrap();
        let changes = Arc::new(Mutex::new(Vec::new()));
        let changes_clone = changes.clone();

        let watcher = Watcher::new(temp_dir.path(), move |path| {
            changes_clone.lock().unwrap().push(path);
        });

        assert!(watcher.is_ok());
        let mut watcher = watcher.unwrap();
        assert_eq!(watcher.root(), temp_dir.path());

        watcher.close().await.unwrap();
    }

    #[tokio::test]
    async fn test_watcher_yaml_file_change() {
        let temp_dir = TempDir::new().unwrap();
        let changes = Arc::new(Mutex::new(Vec::new()));
        let changes_clone = changes.clone();

        let mut watcher = Watcher::new(temp_dir.path(), move |path| {
            changes_clone.lock().unwrap().push(path);
        })
        .unwrap();

        let yaml_file = temp_dir.path().join("test.yaml");
        fs::write(&yaml_file, "test: value").unwrap();

        sleep(Duration::from_millis(500)).await;

        {
            let captured = changes.lock().unwrap();
            assert!(!captured.is_empty());
            assert!(captured.iter().any(|p| p.contains("test.yaml")));
        }

        watcher.close().await.unwrap();
    }

    #[tokio::test]
    async fn test_watcher_yml_extension() {
        let temp_dir = TempDir::new().unwrap();
        let changes = Arc::new(Mutex::new(Vec::new()));
        let changes_clone = changes.clone();

        let mut watcher = Watcher::new(temp_dir.path(), move |path| {
            changes_clone.lock().unwrap().push(path);
        })
        .unwrap();

        let yml_file = temp_dir.path().join("config.yml");
        fs::write(&yml_file, "key: value").unwrap();

        sleep(Duration::from_millis(500)).await;

        {
            let captured = changes.lock().unwrap();
            assert!(!captured.is_empty());
            assert!(captured.iter().any(|p| p.contains("config.yml")));
        }

        watcher.close().await.unwrap();
    }

    #[tokio::test]
    async fn test_watcher_ignores_non_yaml() {
        let temp_dir = TempDir::new().unwrap();
        let changes = Arc::new(Mutex::new(Vec::new()));
        let changes_clone = changes.clone();

        let mut watcher = Watcher::new(temp_dir.path(), move |path| {
            changes_clone.lock().unwrap().push(path);
        })
        .unwrap();

        let txt_file = temp_dir.path().join("readme.txt");
        fs::write(&txt_file, "not yaml").unwrap();

        sleep(Duration::from_millis(500)).await;

        {
            let captured = changes.lock().unwrap();
            assert!(captured.is_empty() || !captured.iter().any(|p| p.contains("readme.txt")));
        }

        watcher.close().await.unwrap();
    }

    #[tokio::test]
    async fn test_watcher_debouncing() {
        let temp_dir = TempDir::new().unwrap();
        let changes = Arc::new(Mutex::new(Vec::new()));
        let changes_clone = changes.clone();

        let mut watcher = Watcher::new(temp_dir.path(), move |path| {
            changes_clone.lock().unwrap().push(path);
        })
        .unwrap();

        let yaml_file = temp_dir.path().join("debounce.yaml");

        for i in 0..5 {
            fs::write(&yaml_file, format!("iteration: {}", i)).unwrap();
            sleep(Duration::from_millis(20)).await;
        }

        sleep(Duration::from_millis(500)).await;

        {
            let captured = changes.lock().unwrap();
            assert!(!captured.is_empty());
            assert!(captured.len() < 5);
        }

        watcher.close().await.unwrap();
    }

    #[tokio::test]
    async fn test_watcher_close() {
        let temp_dir = TempDir::new().unwrap();
        let changes = Arc::new(Mutex::new(Vec::new()));
        let changes_clone = changes.clone();

        let mut watcher = Watcher::new(temp_dir.path(), move |path| {
            changes_clone.lock().unwrap().push(path);
        })
        .unwrap();

        watcher.close().await.unwrap();

        let yaml_file = temp_dir.path().join("after_close.yaml");
        fs::write(&yaml_file, "test: after close").unwrap();

        sleep(Duration::from_millis(500)).await;

        {
            let captured = changes.lock().unwrap();
            assert!(
                captured.is_empty() || !captured.iter().any(|p| p.contains("after_close.yaml"))
            );
        }
    }

    #[test]
    fn test_is_yaml() {
        assert!(is_yaml(Path::new("test.yaml")));
        assert!(is_yaml(Path::new("test.yml")));
        assert!(is_yaml(Path::new("test.YAML")));
        assert!(is_yaml(Path::new("test.YML")));
        assert!(!is_yaml(Path::new("test.txt")));
        assert!(!is_yaml(Path::new("test.json")));
        assert!(!is_yaml(Path::new("test")));
    }
}
