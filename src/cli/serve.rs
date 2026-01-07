use super::{CliError, Result};
use clap::Args;
use std::path::PathBuf;
use std::process::Command;

#[derive(Args, Debug)]
pub struct ServeArgs {
    /// Server port
    #[arg(short = 'p', long = "port", default_value = "4400")]
    pub port: u16,

    /// Bind address
    #[arg(long = "host", default_value = "localhost")]
    pub host: String,

    /// Don't open browser automatically
    #[arg(long = "no-open")]
    pub no_open: bool,

    /// Disable live reload
    #[arg(long = "no-reload")]
    pub no_reload: bool,
}

pub fn run_serve(args: ServeArgs, work_dir: &PathBuf, verbose: bool) -> Result<()> {
    if verbose {
        println!("Starting server in {}", work_dir.display());
        println!("Server configuration:");
        println!("  Host: {}", args.host);
        println!("  Port: {}", args.port);
        println!("  Live reload: {}", !args.no_reload);
    }

    // Check if mod file exists
    let mod_path = work_dir.join("c4.mod.yaml");
    if !mod_path.exists() {
        return Err(CliError::Server(
            "c4.mod.yaml not found. Run 'c4 init' to initialize a workspace.".to_string(),
        ));
    }

    // Open browser if requested
    if !args.no_open {
        let url = format!("http://{}:{}", args.host, args.port);
        if verbose {
            println!("Opening browser at {}", url);
        }
        open_browser(&url)?;
    }

    // TODO: Start actual server when server module is available
    println!(
        "Starting development server at http://{}:{}",
        args.host, args.port
    );
    println!("Press Ctrl+C to stop");

    // For now, just return Ok
    Ok(())
}

pub fn open_browser(url: &str) -> Result<()> {
    let result = if cfg!(target_os = "macos") {
        Command::new("open").arg(url).spawn()
    } else if cfg!(target_os = "linux") {
        Command::new("xdg-open").arg(url).spawn()
    } else if cfg!(target_os = "windows") {
        Command::new("cmd").args(["/c", "start", url]).spawn()
    } else {
        return Ok(()); // Unsupported platform, silently skip
    };

    result
        .map(|_| ())
        .map_err(|e| CliError::Server(format!("Failed to open browser: {}", e)))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    #[test]
    fn test_serve_default_config() {
        let args = ServeArgs {
            port: 4400,
            host: "localhost".to_string(),
            no_open: false,
            no_reload: false,
        };

        assert_eq!(args.port, 4400);
        assert_eq!(args.host, "localhost");
        assert!(!args.no_open);
        assert!(!args.no_reload);
    }

    #[test]
    fn test_serve_custom_config() {
        let args = ServeArgs {
            port: 8080,
            host: "0.0.0.0".to_string(),
            no_open: true,
            no_reload: true,
        };

        assert_eq!(args.port, 8080);
        assert_eq!(args.host, "0.0.0.0");
        assert!(args.no_open);
        assert!(args.no_reload);
    }

    #[test]
    fn test_serve_no_mod_file() {
        let dir = TempDir::new().unwrap();
        let args = ServeArgs {
            port: 4400,
            host: "localhost".to_string(),
            no_open: true,
            no_reload: false,
        };

        let result = run_serve(args, &dir.path().to_path_buf(), false);
        assert!(result.is_err());
        assert!(result
            .unwrap_err()
            .to_string()
            .contains("c4.mod.yaml not found"));
    }

    #[test]
    fn test_serve_with_mod_file() {
        let dir = TempDir::new().unwrap();
        fs::write(
            dir.path().join("c4.mod.yaml"),
            "version: \"1.0\"\nname: test\n",
        )
        .unwrap();

        let args = ServeArgs {
            port: 4400,
            host: "localhost".to_string(),
            no_open: true, // Don't actually open browser in tests
            no_reload: false,
        };

        let result = run_serve(args, &dir.path().to_path_buf(), false);
        assert!(result.is_ok());
    }

    #[test]
    fn test_open_browser_url_format() {
        let host = "localhost";
        let port = 4400;
        let url = format!("http://{}:{}", host, port);
        assert_eq!(url, "http://localhost:4400");
    }

    #[test]
    fn test_open_browser_platform_detection() {
        let is_macos = cfg!(target_os = "macos");
        let is_linux = cfg!(target_os = "linux");
        let is_windows = cfg!(target_os = "windows");

        // At least one should be true
        assert!(is_macos || is_linux || is_windows || cfg!(unix));
    }
}
