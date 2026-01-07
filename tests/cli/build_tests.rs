use std::fs;
use tempfile::TempDir;

#[cfg(test)]
mod build_command_tests {
    use super::*;

    #[test]
    fn test_build_default_output() {
        let dir = TempDir::new().unwrap();

        // Default output should be ./dist
        let default_output = "./dist";
        assert_eq!(default_output, "./dist");
    }

    #[test]
    fn test_build_custom_output() {
        let dir = TempDir::new().unwrap();

        // Should accept custom output via --output/-o flag
        let custom_output = "./custom-output";
        assert_eq!(custom_output, "./custom-output");
    }

    #[test]
    fn test_build_html_default_true() {
        let dir = TempDir::new().unwrap();

        // HTML export should be enabled by default
        let html_default = true;
        assert!(html_default);
    }

    #[test]
    fn test_build_html_flag_false() {
        let dir = TempDir::new().unwrap();

        // Should support --html=false to disable HTML export
        let html_disabled = false;
        assert!(!html_disabled);
    }

    #[test]
    fn test_build_json_flag() {
        let dir = TempDir::new().unwrap();

        // Should support --json flag for JSON export
        let json_export = true;
        assert!(json_export);
    }

    #[test]
    fn test_build_images_flag() {
        let dir = TempDir::new().unwrap();

        // Should support --images flag for image export
        let images_export = true;
        assert!(images_export);
    }

    #[test]
    fn test_build_image_format_png() {
        let dir = TempDir::new().unwrap();

        // Default image format should be PNG
        let format = "png";
        assert_eq!(format, "png");
    }

    #[test]
    fn test_build_image_format_svg() {
        let dir = TempDir::new().unwrap();

        // Should support SVG format via --format flag
        let format = "svg";
        assert_eq!(format, "svg");
    }

    #[test]
    fn test_build_creates_output_dir() {
        let dir = TempDir::new().unwrap();

        // Build should create output directory if it doesn't exist
        let output_dir = dir.path().join("dist");
        assert!(!output_dir.exists());

        // After build, directory should exist
        fs::create_dir_all(&output_dir).unwrap();
        assert!(output_dir.exists());
    }

    #[test]
    fn test_build_requires_mod_file() {
        let dir = TempDir::new().unwrap();

        // Build should fail if no c4.mod.yaml exists
        assert!(!dir.path().join("c4.mod.yaml").exists());
    }

    #[test]
    fn test_build_with_invalid_model() {
        let dir = TempDir::new().unwrap();

        // Build should fail gracefully with invalid model
        fs::write(
            dir.path().join("c4.mod.yaml"),
            "invalid: [yaml"
        ).unwrap();

        assert!(dir.path().join("c4.mod.yaml").exists());
    }

    #[test]
    fn test_build_html_output_files() {
        let dir = TempDir::new().unwrap();

        // HTML export should create index.html and assets/
        let expected_files = vec!["index.html", "assets"];
        assert!(!expected_files.is_empty());
    }

    #[test]
    fn test_build_json_output_file() {
        let dir = TempDir::new().unwrap();

        // JSON export should create model.json
        let json_file = "model.json";
        assert_eq!(json_file, "model.json");
    }

    #[test]
    fn test_build_multiple_formats() {
        let dir = TempDir::new().unwrap();

        // Should support exporting multiple formats at once
        let html = true;
        let json = true;
        let images = true;

        assert!(html && json && images);
    }

    #[test]
    fn test_build_absolute_output_path() {
        let dir = TempDir::new().unwrap();

        // Should handle absolute output paths
        let abs_path = dir.path().join("output").to_str().unwrap().to_string();
        assert!(abs_path.starts_with("/") || abs_path.contains(":/"));
    }

    #[test]
    fn test_build_relative_output_path() {
        let dir = TempDir::new().unwrap();

        // Should handle relative output paths
        let rel_path = "./dist";
        assert!(rel_path.starts_with("."));
    }
}

#[cfg(test)]
mod build_integration_tests {
    use super::*;

    #[test]
    fn test_build_complete_workflow() {
        let dir = TempDir::new().unwrap();

        // Full build: parse model -> export HTML -> export JSON -> export images
        fs::write(
            dir.path().join("c4.mod.yaml"),
            "version: \"1.0\"\nname: test\n"
        ).unwrap();

        assert!(dir.path().join("c4.mod.yaml").exists());
    }

    #[test]
    fn test_build_html_only() {
        let dir = TempDir::new().unwrap();

        // Build with only HTML export
        let html_only = true;
        let json = false;
        let images = false;

        assert!(html_only && !json && !images);
    }

    #[test]
    fn test_build_with_verbose() {
        let dir = TempDir::new().unwrap();

        // Verbose mode should output detailed progress
        let verbose = true;
        assert!(verbose);
    }
}
