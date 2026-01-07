use super::{CliError, Result};
use clap::Args;
use std::fs;
use std::path::PathBuf;

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

pub fn run_build(args: BuildArgs, work_dir: &PathBuf, verbose: bool) -> Result<()> {
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

    // Export HTML
    if args.html {
        println!("Exporting HTML to {}...", abs_output.display());
        export_html(&abs_output, verbose)?;
        println!("  index.html");
        println!("  assets/");
    }

    // Export JSON
    if args.json {
        println!("Exporting JSON...");
        export_json(&abs_output, verbose)?;
        println!("  model.json");
    }

    // Export images
    if args.images {
        println!("Exporting images ({})...", args.format);
        export_images(&abs_output, &args.format, verbose)?;
    }

    println!();
    println!("Build complete: {}", abs_output.display());

    Ok(())
}

fn export_html(output_dir: &PathBuf, verbose: bool) -> Result<()> {
    if verbose {
        println!("Creating HTML export in {}", output_dir.display());
    }

    // TODO: Implement actual HTML export when exporter module is available
    // For now, create placeholder files
    let index_path = output_dir.join("index.html");
    fs::write(
        &index_path,
        "<!DOCTYPE html><html><body>C4 Visualization</body></html>",
    )
    .map_err(|e| CliError::Build(format!("failed to write index.html: {}", e)))?;

    let assets_dir = output_dir.join("assets");
    fs::create_dir_all(&assets_dir)
        .map_err(|e| CliError::Build(format!("failed to create assets directory: {}", e)))?;

    Ok(())
}

fn export_json(output_dir: &PathBuf, verbose: bool) -> Result<()> {
    if verbose {
        println!("Creating JSON export in {}", output_dir.display());
    }

    // TODO: Implement actual JSON export when exporter module is available
    let json_path = output_dir.join("model.json");
    fs::write(&json_path, "{}")
        .map_err(|e| CliError::Build(format!("failed to write model.json: {}", e)))?;

    Ok(())
}

fn export_images(output_dir: &PathBuf, format: &str, verbose: bool) -> Result<()> {
    if verbose {
        println!(
            "Creating image export ({}) in {}",
            format,
            output_dir.display()
        );
    }

    // TODO: Implement actual image export when exporter module is available
    let images_dir = output_dir.join("images");
    fs::create_dir_all(&images_dir)
        .map_err(|e| CliError::Build(format!("failed to create images directory: {}", e)))?;

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

        let result = run_build(args, &dir.path().to_path_buf(), false);
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

        run_build(args, &dir.path().to_path_buf(), false).unwrap();
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

        run_build(args, &dir.path().to_path_buf(), false).unwrap();

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

        run_build(args, &dir.path().to_path_buf(), false).unwrap();

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

        run_build(args, &dir.path().to_path_buf(), false).unwrap();

        assert!(output_dir.join("images").exists());
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

        let result = run_build(args, &dir.path().to_path_buf(), false);
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

        run_build(args, &dir.path().to_path_buf(), false).unwrap();
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

        run_build(args, &dir.path().to_path_buf(), false).unwrap();

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

        run_build(args, &dir.path().to_path_buf(), false).unwrap();

        assert!(output_dir.join("index.html").exists());
        assert!(output_dir.join("model.json").exists());
        assert!(output_dir.join("images").exists());
    }
}
