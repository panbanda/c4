use super::{CliError, Result};
use clap::Args;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Args, Debug)]
pub struct InitArgs {
    /// Project name
    pub name: Option<String>,

    /// Create minimal structure (mod file only)
    #[arg(long)]
    pub minimal: bool,

    /// Include example content
    #[arg(long, default_value = "true")]
    pub example: bool,
}

pub fn run_init(args: InitArgs, work_dir: &PathBuf) -> Result<()> {
    let name = args.name.unwrap_or_else(|| "my-architecture".to_string());

    let mod_path = work_dir.join("c4.mod.yaml");
    if mod_path.exists() {
        return Err(CliError::Init(
            "workspace already initialized (c4.mod.yaml exists)".to_string(),
        ));
    }

    println!(
        "Initializing C4 workspace \"{}\" in {}",
        name,
        work_dir.display()
    );

    create_directories(work_dir, args.minimal)?;
    create_mod_file(work_dir, &name)?;

    if !args.minimal && args.example {
        create_example_files(work_dir)?;
    }

    print_success_message(args.minimal);

    Ok(())
}

fn create_directories(work_dir: &Path, minimal: bool) -> Result<()> {
    let mut dirs = vec!["_schema", "shared"];

    if !minimal {
        dirs.extend_from_slice(&["systems/example", "deployments"]);
    }

    for dir in dirs {
        let path = work_dir.join(dir);
        fs::create_dir_all(path)
            .map_err(|e| CliError::Init(format!("failed to create directory {}: {}", dir, e)))?;
    }

    Ok(())
}

fn create_mod_file(work_dir: &Path, name: &str) -> Result<()> {
    let content = format!(
        r#"version: "1.0"
name: {}

include:
  - shared/*.yaml
  - systems/*/system.yaml
  - systems/*/containers.yaml
  - systems/*/relationships.yaml
  - systems/*/flows/*.yaml
  - deployments/*.yaml
"#,
        name
    );

    let mod_path = work_dir.join("c4.mod.yaml");
    fs::write(mod_path, content)
        .map_err(|e| CliError::Init(format!("failed to create c4.mod.yaml: {}", e)))?;

    Ok(())
}

fn create_example_files(work_dir: &Path) -> Result<()> {
    let files = [
        (
            "shared/personas.yaml",
            r#"# User types that interact with your systems
persons:
  - id: user
    name: User
    description: A generic user of the system
    tags:
      - external
"#,
        ),
        (
            "shared/external-systems.yaml",
            r#"# External systems your architecture depends on
systems:
  - id: email-service
    name: Email Service
    description: Third-party email delivery service
    external: true
"#,
        ),
        (
            "systems/example/system.yaml",
            r#"systems:
  - id: example
    name: Example System
    description: An example system to get you started
    external: false
    tags:
      - example
"#,
        ),
        (
            "systems/example/containers.yaml",
            r#"containers:
  - id: web-app
    name: Web Application
    description: The main web interface
    technology: React, TypeScript

  - id: api
    name: API Server
    description: Backend REST API
    technology: Go, Chi

  - id: database
    name: Database
    description: Primary data store
    technology: PostgreSQL 15
"#,
        ),
        (
            "systems/example/relationships.yaml",
            r#"relationships:
  - from: user
    to: example.web-app
    description: Uses the web interface

  - from: example.web-app
    to: example.api
    description: Makes API calls
    technology: HTTPS, JSON

  - from: example.api
    to: example.database
    description: Reads and writes data
    technology: SQL
"#,
        ),
        (
            "deployments/production.yaml",
            r#"deployments:
  - id: production
    name: Production
    description: Production deployment environment
    nodes:
      - id: cloud
        name: Cloud Provider
        technology: AWS
        children:
          - id: web-tier
            name: Web Tier
            instances:
              - container: example.web-app
                replicas: 2
          - id: api-tier
            name: API Tier
            instances:
              - container: example.api
                replicas: 3
          - id: data-tier
            name: Data Tier
            instances:
              - container: example.database
                replicas: 1
"#,
        ),
    ];

    for (path, content) in &files {
        let full_path = work_dir.join(path);
        if let Some(parent) = full_path.parent() {
            fs::create_dir_all(parent).map_err(|e| {
                CliError::Init(format!("failed to create directory for {}: {}", path, e))
            })?;
        }
        fs::write(&full_path, content)
            .map_err(|e| CliError::Init(format!("failed to create {}: {}", path, e)))?;
    }

    Ok(())
}

fn print_success_message(minimal: bool) {
    if minimal {
        println!("Created minimal workspace structure");
    } else {
        println!("Created workspace structure:");
        println!("  c4.mod.yaml");
        println!("  shared/");
        println!("  systems/example/");
        println!("  deployments/");
        println!();
        println!("Next steps:");
        println!("  1. Edit shared/personas.yaml to define users");
        println!("  2. Edit systems/example/system.yaml to define your system");
        println!("  3. Run 'c4 validate' to check your model");
        println!("  4. Run 'c4 serve' to start the visualization server");
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_init_creates_mod_file() {
        let dir = TempDir::new().unwrap();
        let args = InitArgs {
            name: Some("test-project".to_string()),
            minimal: false,
            example: false,
        };

        run_init(args, &dir.path().to_path_buf()).unwrap();

        let mod_path = dir.path().join("c4.mod.yaml");
        assert!(mod_path.exists());

        let content = fs::read_to_string(mod_path).unwrap();
        assert!(content.contains("name: test-project"));
        assert!(content.contains("version: \"1.0\""));
    }

    #[test]
    fn test_init_creates_directories() {
        let dir = TempDir::new().unwrap();
        let args = InitArgs {
            name: None,
            minimal: false,
            example: false,
        };

        run_init(args, &dir.path().to_path_buf()).unwrap();

        assert!(dir.path().join("_schema").exists());
        assert!(dir.path().join("shared").exists());
        assert!(dir.path().join("systems/example").exists());
        assert!(dir.path().join("deployments").exists());
    }

    #[test]
    fn test_init_minimal() {
        let dir = TempDir::new().unwrap();
        let args = InitArgs {
            name: None,
            minimal: true,
            example: false,
        };

        run_init(args, &dir.path().to_path_buf()).unwrap();

        assert!(dir.path().join("_schema").exists());
        assert!(dir.path().join("shared").exists());
        assert!(!dir.path().join("systems/example").exists());
        assert!(!dir.path().join("deployments").exists());
    }

    #[test]
    fn test_init_with_examples() {
        let dir = TempDir::new().unwrap();
        let args = InitArgs {
            name: None,
            minimal: false,
            example: true,
        };

        run_init(args, &dir.path().to_path_buf()).unwrap();

        assert!(dir.path().join("shared/personas.yaml").exists());
        assert!(dir.path().join("shared/external-systems.yaml").exists());
        assert!(dir.path().join("systems/example/system.yaml").exists());
        assert!(dir.path().join("systems/example/containers.yaml").exists());
        assert!(dir
            .path()
            .join("systems/example/relationships.yaml")
            .exists());
        assert!(dir.path().join("deployments/production.yaml").exists());
    }

    #[test]
    fn test_init_already_initialized() {
        let dir = TempDir::new().unwrap();
        let mod_path = dir.path().join("c4.mod.yaml");
        fs::write(&mod_path, "existing").unwrap();

        let args = InitArgs {
            name: None,
            minimal: false,
            example: false,
        };

        let result = run_init(args, &dir.path().to_path_buf());
        assert!(result.is_err());
        assert!(result
            .unwrap_err()
            .to_string()
            .contains("already initialized"));
    }
}
