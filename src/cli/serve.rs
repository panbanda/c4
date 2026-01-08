use super::{CliError, Result};
use crate::parser::Parser;
use crate::server::{Config, Server};
use clap::Args;
use std::path::Path;
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

pub fn run_serve(args: ServeArgs, work_dir: &Path, verbose: bool) -> Result<()> {
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

    // Parse the model
    let mut parser = Parser::new(work_dir);
    let model = parser
        .parse()
        .map_err(|e| CliError::Server(format!("Failed to parse model: {}", e)))?;

    // Convert model to JSON for the server
    let model_json = serde_json::to_value(&model)
        .map_err(|e| CliError::Server(format!("Failed to serialize model: {}", e)))?;

    // Create server config
    let config = Config {
        host: args.host.clone(),
        port: args.port,
        work_dir: work_dir.to_path_buf(),
        no_reload: args.no_reload,
        verbose,
    };

    println!(
        "Starting development server at http://{}:{}",
        args.host, args.port
    );
    println!("Press Ctrl+C to stop");

    // Open browser if requested
    if !args.no_open {
        let url = format!("http://{}:{}", args.host, args.port);
        if verbose {
            println!("Opening browser at {}", url);
        }
        let _ = open_browser(&url);
    }

    // Create runtime first, then Server inside it.
    // Server::new() uses tokio::spawn internally (via Watcher), so it must be
    // called within a tokio runtime context.
    let runtime = tokio::runtime::Runtime::new()
        .map_err(|e| CliError::Server(format!("Failed to create runtime: {}", e)))?;

    runtime.block_on(async {
        let server = Server::new(config)
            .map_err(|e| CliError::Server(format!("Failed to create server: {}", e)))?;
        server.set_model(model_json).await;
        server
            .run()
            .await
            .map_err(|e| CliError::Server(format!("Server error: {}", e)))
    })
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
    use crate::server::{Config, Server};
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

        let result = run_serve(args, dir.path(), false);
        assert!(result.is_err());
        assert!(result
            .unwrap_err()
            .to_string()
            .contains("c4.mod.yaml not found"));
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

    /// Test that Server can be created from synchronous code by first creating a runtime.
    /// This reproduces the bug where Server::new() was called outside a tokio runtime,
    /// causing a panic in Watcher which uses tokio::spawn.
    #[test]
    fn test_server_creation_from_sync_context() {
        let temp_dir = TempDir::new().unwrap();
        let config = Config {
            host: "localhost".to_string(),
            port: 4400,
            work_dir: temp_dir.path().to_path_buf(),
            no_reload: false, // Enable watcher to exercise the tokio::spawn path
            verbose: false,
        };

        // Server::new() uses tokio::spawn internally (via Watcher), so it must be
        // called within a tokio runtime context. This test verifies that creating
        // the runtime first, then the server inside it, works correctly.
        let runtime = tokio::runtime::Runtime::new().unwrap();
        let result = runtime.block_on(async { Server::new(config) });

        assert!(result.is_ok());
    }
}
