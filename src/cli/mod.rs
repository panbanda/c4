pub mod build;
pub mod init;
pub mod serve;
pub mod validate;

use clap::{Parser, Subcommand};
use std::path::PathBuf;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum CliError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Initialization error: {0}")]
    Init(String),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Server error: {0}")]
    Server(String),

    #[error("Build error: {0}")]
    Build(String),
}

pub type Result<T> = std::result::Result<T, CliError>;

#[derive(Parser, Debug)]
#[command(name = "c4")]
#[command(author, version, about = "C4 architecture visualization tool", long_about = None)]
#[command(
    long_about = "c4 is a CLI tool for parsing, visualizing, and exporting\n\
                         C4 architecture models defined in YAML.\n\n\
                         It provides an interactive web-based visualization with drill-down\n\
                         navigation, flow animations, and export to static HTML and images."
)]
pub struct Cli {
    /// Working directory
    #[arg(short = 'C', long = "dir", default_value = ".", global = true)]
    pub work_dir: PathBuf,

    /// Verbose output
    #[arg(short = 'v', long = "verbose", global = true)]
    pub verbose: bool,

    #[command(subcommand)]
    pub command: Commands,
}

#[derive(Subcommand, Debug)]
pub enum Commands {
    /// Initialize a new C4 workspace
    Init(init::InitArgs),

    /// Validate YAML files against schema
    Validate(validate::ValidateArgs),

    /// Start dev server with live reload
    Serve(serve::ServeArgs),

    /// Export C4 model to static artifacts
    Build(build::BuildArgs),

    /// Print version information
    Version,
}

pub fn run() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Init(args) => init::run_init(args, &get_work_dir(&cli.work_dir)?),
        Commands::Validate(args) => {
            validate::run_validate(args, &get_work_dir(&cli.work_dir)?, cli.verbose)
        }
        Commands::Serve(args) => serve::run_serve(args, &get_work_dir(&cli.work_dir)?, cli.verbose),
        Commands::Build(args) => build::run_build(args, &get_work_dir(&cli.work_dir)?, cli.verbose),
        Commands::Version => {
            println!(
                "c4 version {} ({})",
                env!("CARGO_PKG_VERSION"),
                env!("CARGO_PKG_VERSION")
            );
            Ok(())
        }
    }
}

pub fn get_work_dir(path: &PathBuf) -> Result<PathBuf> {
    if path.to_str() == Some(".") {
        std::env::current_dir().map_err(CliError::Io)
    } else if path.is_absolute() {
        Ok(path.clone())
    } else {
        let current = std::env::current_dir().map_err(CliError::Io)?;
        Ok(current.join(path))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;
    use tempfile::TempDir;

    #[test]
    fn test_get_work_dir_absolute_path() {
        let dir = TempDir::new().unwrap();
        let path = dir.path().to_path_buf();
        let result = get_work_dir(&path).unwrap();
        assert_eq!(result, path);
    }

    #[test]
    fn test_get_work_dir_current_dir() {
        let current = env::current_dir().unwrap();
        let path = PathBuf::from(".");
        let result = get_work_dir(&path).unwrap();
        assert_eq!(result, current);
    }

    #[test]
    fn test_get_work_dir_relative_path() {
        let current = env::current_dir().unwrap();
        let path = PathBuf::from("subdir");
        let result = get_work_dir(&path).unwrap();
        assert_eq!(result, current.join("subdir"));
    }
}
