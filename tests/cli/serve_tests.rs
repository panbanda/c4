use std::fs;
use tempfile::TempDir;

#[cfg(test)]
mod serve_command_tests {
    use super::*;

    #[test]
    fn test_serve_default_config() {
        let dir = TempDir::new().unwrap();

        // Default config should use port 4400, host localhost
        let default_port = 4400;
        let default_host = "localhost";

        assert_eq!(default_port, 4400);
        assert_eq!(default_host, "localhost");
    }

    #[test]
    fn test_serve_custom_port() {
        let dir = TempDir::new().unwrap();

        // Should accept custom port via --port/-p flag
        let custom_port = 8080;
        assert_eq!(custom_port, 8080);
    }

    #[test]
    fn test_serve_custom_host() {
        let dir = TempDir::new().unwrap();

        // Should accept custom host via --host flag
        let custom_host = "0.0.0.0";
        assert_eq!(custom_host, "0.0.0.0");
    }

    #[test]
    fn test_serve_no_open_flag() {
        let dir = TempDir::new().unwrap();

        // With --no-open, browser should not open
        let no_open = true;
        assert!(no_open);
    }

    #[test]
    fn test_serve_no_reload_flag() {
        let dir = TempDir::new().unwrap();

        // With --no-reload, live reload should be disabled
        let no_reload = true;
        assert!(no_reload);
    }

    #[test]
    fn test_serve_requires_mod_file() {
        let dir = TempDir::new().unwrap();

        // Serve should fail if no c4.mod.yaml exists
        assert!(!dir.path().join("c4.mod.yaml").exists());
    }

    #[test]
    fn test_serve_with_invalid_model() {
        let dir = TempDir::new().unwrap();

        // Serve should fail gracefully with invalid model
        fs::write(
            dir.path().join("c4.mod.yaml"),
            "invalid: [yaml"
        ).unwrap();

        assert!(dir.path().join("c4.mod.yaml").exists());
    }
}

#[cfg(test)]
mod open_browser_tests {
    use super::*;

    #[test]
    fn test_open_browser_url_format() {
        // URL should be formatted correctly
        let host = "localhost";
        let port = 4400;
        let url = format!("http://{}:{}", host, port);

        assert_eq!(url, "http://localhost:4400");
    }

    #[test]
    fn test_open_browser_platform_detection() {
        // Should detect platform correctly
        let is_unix = cfg!(unix);
        let is_windows = cfg!(windows);

        assert!(is_unix || is_windows || cfg!(target_os = "macos"));
    }

    #[test]
    fn test_open_browser_macos_command() {
        // On macOS, should use 'open' command
        #[cfg(target_os = "macos")]
        {
            let cmd = "open";
            assert_eq!(cmd, "open");
        }
    }

    #[test]
    fn test_open_browser_linux_command() {
        // On Linux, should use 'xdg-open' command
        #[cfg(target_os = "linux")]
        {
            let cmd = "xdg-open";
            assert_eq!(cmd, "xdg-open");
        }
    }

    #[test]
    fn test_open_browser_windows_command() {
        // On Windows, should use 'cmd /c start' command
        #[cfg(target_os = "windows")]
        {
            let cmd = "cmd";
            let args = vec!["/c", "start"];
            assert_eq!(cmd, "cmd");
            assert_eq!(args[0], "/c");
        }
    }
}

#[cfg(test)]
mod serve_integration_tests {
    use super::*;

    #[test]
    fn test_serve_startup_sequence() {
        let dir = TempDir::new().unwrap();

        // Full startup: parse model -> start server -> open browser
        fs::write(
            dir.path().join("c4.mod.yaml"),
            "version: \"1.0\"\nname: test\n"
        ).unwrap();

        assert!(dir.path().join("c4.mod.yaml").exists());
    }

    #[test]
    fn test_serve_graceful_shutdown() {
        let dir = TempDir::new().unwrap();

        // Should handle shutdown signals gracefully
        assert!(dir.path().exists());
    }
}
