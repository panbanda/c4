use clap::Args;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use super::{CliError, Result};

#[derive(Args, Debug)]
pub struct ValidateArgs {
    /// Specific files to validate
    pub files: Vec<String>,

    /// Treat warnings as errors
    #[arg(long)]
    pub strict: bool,

    /// Output results as JSON
    #[arg(long)]
    pub json: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ValidationResult {
    pub valid: bool,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub errors: Vec<ValidationError>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub warnings: Vec<ValidationError>,
    pub stats: ValidationStats,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ValidationError {
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub line: Option<usize>,
}

impl std::fmt::Display for ValidationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        if let Some(file) = &self.file {
            if let Some(line) = self.line {
                write!(f, "{}:{}: {}", file, line, self.message)
            } else {
                write!(f, "{}: {}", file, self.message)
            }
        } else {
            write!(f, "{}", self.message)
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationStats {
    pub persons: usize,
    pub systems: usize,
    pub containers: usize,
    pub components: usize,
    pub relationships: usize,
    pub flows: usize,
    pub deployments: usize,
}

pub fn run_validate(args: ValidateArgs, work_dir: &PathBuf, verbose: bool) -> Result<()> {
    if verbose {
        println!("Validating workspace in {}", work_dir.display());
    }

    // Check if mod file exists
    let mod_path = work_dir.join("c4.mod.yaml");
    if !mod_path.exists() {
        return Err(CliError::Validation(
            "c4.mod.yaml not found. Run 'c4 init' to initialize a workspace.".to_string()
        ));
    }

    let result = validate_workspace(work_dir, &args)?;

    if args.json {
        let json = serde_json::to_string_pretty(&result)
            .map_err(|e| CliError::Validation(format!("JSON serialization failed: {}", e)))?;
        println!("{}", json);
    } else {
        print_human_readable(&result);
    }

    if !result.valid {
        return Err(CliError::Validation(
            format!("validation failed with {} errors", result.errors.len())
        ));
    }

    if args.strict && !result.warnings.is_empty() {
        return Err(CliError::Validation(
            format!("strict mode: validation failed with {} warnings", result.warnings.len())
        ));
    }

    Ok(())
}

fn validate_workspace(_work_dir: &PathBuf, _args: &ValidateArgs) -> Result<ValidationResult> {
    // TODO: Implement actual validation when parser module is available
    // For now, return a basic successful result
    Ok(ValidationResult {
        valid: true,
        errors: vec![],
        warnings: vec![],
        stats: ValidationStats::default(),
    })
}

fn print_human_readable(result: &ValidationResult) {
    if result.valid && result.warnings.is_empty() {
        println!("Validation passed");
        println!();
        println!("Model statistics:");
        println!("  Persons:       {}", result.stats.persons);
        println!("  Systems:       {}", result.stats.systems);
        println!("  Containers:    {}", result.stats.containers);
        println!("  Components:    {}", result.stats.components);
        println!("  Relationships: {}", result.stats.relationships);
        println!("  Flows:         {}", result.stats.flows);
        println!("  Deployments:   {}", result.stats.deployments);
    } else {
        println!("Validation failed");
        println!();

        if !result.errors.is_empty() {
            for error in &result.errors {
                println!("  ERROR: {}", error);
            }
        }

        if !result.warnings.is_empty() {
            for warning in &result.warnings {
                println!("  WARN:  {}", warning);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    #[test]
    fn test_validation_result_serialization() {
        let result = ValidationResult {
            valid: true,
            errors: vec![],
            warnings: vec![],
            stats: ValidationStats {
                persons: 1,
                systems: 2,
                containers: 3,
                components: 4,
                relationships: 5,
                flows: 6,
                deployments: 7,
            },
        };

        let json = serde_json::to_string(&result).unwrap();
        assert!(json.contains("\"valid\":true"));
        assert!(json.contains("\"persons\":1"));
    }

    #[test]
    fn test_validation_error_display() {
        let error = ValidationError {
            message: "test error".to_string(),
            file: Some("test.yaml".to_string()),
            line: Some(42),
        };

        let display = format!("{}", error);
        assert_eq!(display, "test.yaml:42: test error");
    }

    #[test]
    fn test_validation_error_display_no_line() {
        let error = ValidationError {
            message: "test error".to_string(),
            file: Some("test.yaml".to_string()),
            line: None,
        };

        let display = format!("{}", error);
        assert_eq!(display, "test.yaml: test error");
    }

    #[test]
    fn test_validation_error_display_no_file() {
        let error = ValidationError {
            message: "test error".to_string(),
            file: None,
            line: None,
        };

        let display = format!("{}", error);
        assert_eq!(display, "test error");
    }

    #[test]
    fn test_validate_no_mod_file() {
        let dir = TempDir::new().unwrap();
        let args = ValidateArgs {
            files: vec![],
            strict: false,
            json: false,
        };

        let result = run_validate(args, &dir.path().to_path_buf(), false);
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("c4.mod.yaml not found"));
    }

    #[test]
    fn test_validate_with_mod_file() {
        let dir = TempDir::new().unwrap();
        fs::write(dir.path().join("c4.mod.yaml"), "version: \"1.0\"\nname: test\n").unwrap();

        let args = ValidateArgs {
            files: vec![],
            strict: false,
            json: false,
        };

        let result = run_validate(args, &dir.path().to_path_buf(), false);
        assert!(result.is_ok());
    }

    #[test]
    fn test_validate_json_output() {
        let dir = TempDir::new().unwrap();
        fs::write(dir.path().join("c4.mod.yaml"), "version: \"1.0\"\nname: test\n").unwrap();

        let args = ValidateArgs {
            files: vec![],
            strict: false,
            json: true,
        };

        let result = run_validate(args, &dir.path().to_path_buf(), false);
        assert!(result.is_ok());
    }
}
