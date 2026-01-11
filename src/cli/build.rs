use super::{CliError, Result};
use crate::exporter::Exporter;
use crate::parser::Parser;
use clap::Args;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Args, Debug)]
pub struct BuildArgs {
    /// Output directory
    #[arg(short = 'o', long = "output", default_value = "./dist")]
    pub output: PathBuf,

    /// Export static HTML
    #[arg(long = "html", default_value = "true")]
    pub html: bool,

    /// Export JSON model
    #[arg(long = "json")]
    pub json: bool,

    /// Export PNG/SVG images
    #[arg(long = "images")]
    pub images: bool,

    /// Image format: png, svg
    #[arg(long = "format", default_value = "png")]
    pub format: String,
}

pub fn run_build(args: BuildArgs, work_dir: &Path, verbose: bool) -> Result<()> {
    if verbose {
        println!("Working directory: {}", work_dir.display());
        println!("Output directory: {}", args.output.display());
    }

    // Check if mod file exists
    let mod_path = work_dir.join("c4.mod.yaml");
    if !mod_path.exists() {
        return Err(CliError::Build(
            "c4.mod.yaml not found. Run 'c4 init' to initialize a workspace.".to_string(),
        ));
    }

    // Validate image format
    if args.images && args.format != "png" && args.format != "svg" {
        return Err(CliError::Build(format!(
            "invalid image format '{}'. Must be 'png' or 'svg'",
            args.format
        )));
    }

    // Create output directory
    let abs_output = if args.output.is_absolute() {
        args.output.clone()
    } else {
        work_dir.join(&args.output)
    };

    fs::create_dir_all(&abs_output)
        .map_err(|e| CliError::Build(format!("failed to create output directory: {}", e)))?;

    if verbose {
        println!("Absolute output path: {}", abs_output.display());
    }

    // Parse the model
    let mut parser = Parser::new(work_dir);
    let model = parser
        .parse()
        .map_err(|e| CliError::Build(format!("failed to parse model: {}", e)))?;

    if verbose {
        println!("Model parsed successfully");
        println!(
            "  {} persons, {} systems, {} containers, {} components",
            model.persons.len(),
            model.systems.len(),
            model.containers.len(),
            model.components.len()
        );
    }

    let output_str = abs_output
        .to_str()
        .ok_or_else(|| CliError::Build("output path contains invalid UTF-8".to_string()))?;
    let exporter = Exporter::new(&model, output_str);

    // Export HTML
    if args.html {
        println!("Exporting HTML to {}...", abs_output.display());
        exporter
            .export_html()
            .map_err(|e| CliError::Build(format!("HTML export failed: {}", e)))?;
        println!("  index.html");
        println!("  assets/");
    }

    // Export JSON
    if args.json {
        println!("Exporting JSON...");
        exporter
            .export_json()
            .map_err(|e| CliError::Build(format!("JSON export failed: {}", e)))?;
        println!("  model.json");
    }

    // Export images
    if args.images {
        println!("Exporting images ({})...", args.format);
        exporter
            .export_images()
            .map_err(|e| CliError::Build(format!("image export failed: {}", e)))?;
    }

    println!();
    println!("Build complete: {}", abs_output.display());

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    #[test]
    fn test_build_default_config() {
        let args = BuildArgs {
            output: PathBuf::from("./dist"),
            html: true,
            json: false,
            images: false,
            format: "png".to_string(),
        };

        assert_eq!(args.output, PathBuf::from("./dist"));
        assert!(args.html);
        assert!(!args.json);
        assert!(!args.images);
        assert_eq!(args.format, "png");
    }

    #[test]
    fn test_build_custom_config() {
        let args = BuildArgs {
            output: PathBuf::from("./output"),
            html: false,
            json: true,
            images: true,
            format: "svg".to_string(),
        };

        assert_eq!(args.output, PathBuf::from("./output"));
        assert!(!args.html);
        assert!(args.json);
        assert!(args.images);
        assert_eq!(args.format, "svg");
    }

    #[test]
    fn test_build_no_mod_file() {
        let dir = TempDir::new().unwrap();
        let args = BuildArgs {
            output: PathBuf::from("./dist"),
            html: true,
            json: false,
            images: false,
            format: "png".to_string(),
        };

        let result = run_build(args, dir.path(), false);
        assert!(result.is_err());
        assert!(result
            .unwrap_err()
            .to_string()
            .contains("c4.mod.yaml not found"));
    }

    #[test]
    fn test_build_creates_output_dir() {
        let dir = TempDir::new().unwrap();
        fs::write(
            dir.path().join("c4.mod.yaml"),
            "version: \"1.0\"\nname: test\n",
        )
        .unwrap();

        let output_dir = dir.path().join("dist");
        let args = BuildArgs {
            output: output_dir.clone(),
            html: true,
            json: false,
            images: false,
            format: "png".to_string(),
        };

        run_build(args, dir.path(), false).unwrap();
        assert!(output_dir.exists());
    }

    #[test]
    fn test_build_html_output() {
        let dir = TempDir::new().unwrap();
        fs::write(
            dir.path().join("c4.mod.yaml"),
            "version: \"1.0\"\nname: test\n",
        )
        .unwrap();

        let output_dir = dir.path().join("dist");
        let args = BuildArgs {
            output: output_dir.clone(),
            html: true,
            json: false,
            images: false,
            format: "png".to_string(),
        };

        run_build(args, dir.path(), false).unwrap();

        assert!(output_dir.join("index.html").exists());
        assert!(output_dir.join("assets").exists());
    }

    #[test]
    fn test_build_json_output() {
        let dir = TempDir::new().unwrap();
        fs::write(
            dir.path().join("c4.mod.yaml"),
            "version: \"1.0\"\nname: test\n",
        )
        .unwrap();

        let output_dir = dir.path().join("dist");
        let args = BuildArgs {
            output: output_dir.clone(),
            html: false,
            json: true,
            images: false,
            format: "png".to_string(),
        };

        run_build(args, dir.path(), false).unwrap();

        assert!(output_dir.join("model.json").exists());
    }

    #[test]
    fn test_build_images_output() {
        let dir = TempDir::new().unwrap();
        fs::write(
            dir.path().join("c4.mod.yaml"),
            "version: \"1.0\"\nname: test\n",
        )
        .unwrap();

        let output_dir = dir.path().join("dist");
        let args = BuildArgs {
            output: output_dir.clone(),
            html: false,
            json: false,
            images: true,
            format: "png".to_string(),
        };

        // Image export is not yet implemented but should not error
        let result = run_build(args, dir.path(), false);
        assert!(result.is_ok());
    }

    #[test]
    fn test_build_invalid_image_format() {
        let dir = TempDir::new().unwrap();
        fs::write(
            dir.path().join("c4.mod.yaml"),
            "version: \"1.0\"\nname: test\n",
        )
        .unwrap();

        let args = BuildArgs {
            output: PathBuf::from("./dist"),
            html: false,
            json: false,
            images: true,
            format: "invalid".to_string(),
        };

        let result = run_build(args, dir.path(), false);
        assert!(result.is_err());
        assert!(result
            .unwrap_err()
            .to_string()
            .contains("invalid image format"));
    }

    #[test]
    fn test_build_absolute_path() {
        let dir = TempDir::new().unwrap();
        fs::write(
            dir.path().join("c4.mod.yaml"),
            "version: \"1.0\"\nname: test\n",
        )
        .unwrap();

        let output_dir = dir.path().join("output");
        let args = BuildArgs {
            output: output_dir.clone(),
            html: true,
            json: false,
            images: false,
            format: "png".to_string(),
        };

        run_build(args, dir.path(), false).unwrap();
        assert!(output_dir.exists());
    }

    #[test]
    fn test_build_relative_path() {
        let dir = TempDir::new().unwrap();
        fs::write(
            dir.path().join("c4.mod.yaml"),
            "version: \"1.0\"\nname: test\n",
        )
        .unwrap();

        let args = BuildArgs {
            output: PathBuf::from("./dist"),
            html: true,
            json: false,
            images: false,
            format: "png".to_string(),
        };

        run_build(args, dir.path(), false).unwrap();

        let output_dir = dir.path().join("dist");
        assert!(output_dir.exists());
    }

    #[test]
    fn test_build_multiple_formats() {
        let dir = TempDir::new().unwrap();
        fs::write(
            dir.path().join("c4.mod.yaml"),
            "version: \"1.0\"\nname: test\n",
        )
        .unwrap();

        let output_dir = dir.path().join("dist");
        let args = BuildArgs {
            output: output_dir.clone(),
            html: true,
            json: true,
            images: true,
            format: "svg".to_string(),
        };

        run_build(args, dir.path(), false).unwrap();

        assert!(output_dir.join("index.html").exists());
        assert!(output_dir.join("model.json").exists());
        // Note: images/ directory is not created since image export is not yet implemented
    }
}
