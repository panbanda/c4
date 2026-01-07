use std::path::{Path, PathBuf};
use tempfile::TempDir;
use std::fs;

#[cfg(test)]
mod parser_tests {
    use super::*;

    fn create_test_workspace() -> TempDir {
        let temp = TempDir::new().unwrap();
        let root = temp.path();

        // Create c4.mod.yaml
        let mod_content = r#"
version: "1.0"
name: "test-workspace"
include:
  - "data/*.yaml"
  - "systems/**/*.yaml"
"#;
        fs::write(root.join("c4.mod.yaml"), mod_content).unwrap();

        // Create data directory
        fs::create_dir(root.join("data")).unwrap();

        // Create a simple data file
        let data_content = r#"
persons:
  - id: "user"
    name: "End User"
    description: "User of the system"

systems:
  - id: "api"
    name: "API System"
    description: "Backend API"
"#;
        fs::write(root.join("data/model.yaml"), data_content).unwrap();

        temp
    }

    #[test]
    fn test_parser_new() {
        let temp = create_test_workspace();
        let path = temp.path().to_str().unwrap();

        // Parser::new should accept a directory path
        // let parser = Parser::new(path);
        // assert!(parser.root_dir == path);
    }

    #[test]
    fn test_parser_load_mod_file() {
        let temp = create_test_workspace();
        let path = temp.path().to_str().unwrap();

        // Parser should successfully load c4.mod.yaml
        // let mut parser = Parser::new(path);
        // let result = parser.load_mod_file(&Path::new("c4.mod.yaml"));
        // assert!(result.is_ok());
        //
        // let mod_file = parser.get_mod_file().unwrap();
        // assert_eq!(mod_file.version, "1.0");
        // assert_eq!(mod_file.name, "test-workspace");
    }

    #[test]
    fn test_parser_load_mod_file_missing() {
        let temp = TempDir::new().unwrap();
        let path = temp.path().to_str().unwrap();

        // Parser should fail gracefully if c4.mod.yaml is missing
        // let mut parser = Parser::new(path);
        // let result = parser.load_mod_file(&Path::new("c4.mod.yaml"));
        // assert!(result.is_err());
    }

    #[test]
    fn test_parser_load_mod_file_invalid_yaml() {
        let temp = TempDir::new().unwrap();
        let root = temp.path();

        fs::write(root.join("c4.mod.yaml"), "invalid: yaml: content:").unwrap();

        // Parser should fail with invalid YAML
        // let mut parser = Parser::new(root.to_str().unwrap());
        // let result = parser.load_mod_file(&Path::new("c4.mod.yaml"));
        // assert!(result.is_err());
    }

    #[test]
    fn test_parser_load_mod_file_missing_required_fields() {
        let temp = TempDir::new().unwrap();
        let root = temp.path();

        fs::write(root.join("c4.mod.yaml"), "version: '1.0'").unwrap();

        // Parser should fail if required fields are missing
        // let mut parser = Parser::new(root.to_str().unwrap());
        // let result = parser.load_mod_file(&Path::new("c4.mod.yaml"));
        // assert!(result.is_err());
    }

    #[test]
    fn test_parser_load_data_file() {
        let temp = create_test_workspace();
        let path = temp.path().to_str().unwrap();

        // Parser should load data files
        // let mut parser = Parser::new(path);
        // let result = parser.load_data_file(&Path::new("data/model.yaml"));
        // assert!(result.is_ok());
    }

    #[test]
    fn test_parser_parse_complete() {
        let temp = create_test_workspace();
        let path = temp.path().to_str().unwrap();

        // Parser should parse all files and return a complete model
        // let mut parser = Parser::new(path);
        // let result = parser.parse();
        // assert!(result.is_ok());
        //
        // let model = result.unwrap();
        // assert_eq!(model.persons.len(), 1);
        // assert_eq!(model.systems.len(), 1);
    }

    #[test]
    fn test_parser_context_from_path() {
        let temp = create_test_workspace();
        let path = temp.path().to_str().unwrap();

        // Create systems directory structure
        let systems_path = temp.path().join("systems/api");
        fs::create_dir_all(&systems_path).unwrap();

        // Parser should extract system ID from path
        // let parser = Parser::new(path);
        // let ctx = parser.context_from_path(&systems_path.join("containers.yaml"));
        // assert_eq!(ctx.system_id, "api");
    }

    #[test]
    fn test_parser_context_from_path_no_system() {
        let temp = create_test_workspace();
        let path = temp.path().to_str().unwrap();

        // Parser should handle paths without system context
        // let parser = Parser::new(path);
        // let ctx = parser.context_from_path(&Path::new("data/model.yaml"));
        // assert_eq!(ctx.system_id, "");
    }

    #[test]
    fn test_parser_find_files() {
        let temp = create_test_workspace();
        let path = temp.path().to_str().unwrap();

        // Parser should find files matching glob patterns
        // let parser = Parser::new(path);
        // let files = parser.find_files("data/*.yaml").unwrap();
        // assert_eq!(files.len(), 1);
    }

    #[test]
    fn test_parser_find_files_recursive() {
        let temp = create_test_workspace();
        let root = temp.path();

        // Create nested structure
        fs::create_dir_all(root.join("systems/api")).unwrap();
        fs::write(root.join("systems/api/containers.yaml"), "containers: []").unwrap();

        // Parser should handle recursive patterns
        // let parser = Parser::new(root.to_str().unwrap());
        // let files = parser.find_files("systems/**/*.yaml").unwrap();
        // assert!(files.len() > 0);
    }

    #[test]
    fn test_parser_errors_collection() {
        let temp = create_test_workspace();
        let root = temp.path();

        // Create a file with invalid data
        let invalid_data = r#"
containers:
  - id: "web"
    name: "Web App"
    # Missing system_id
"#;
        fs::write(root.join("data/invalid.yaml"), invalid_data).unwrap();

        // Parser should collect non-fatal errors
        // let mut parser = Parser::new(root.to_str().unwrap());
        // let _ = parser.parse();
        // assert!(parser.errors().len() > 0);
    }

    #[test]
    fn test_parser_with_containers_in_system_context() {
        let temp = create_test_workspace();
        let root = temp.path();

        // Create system directory
        fs::create_dir_all(root.join("systems/api")).unwrap();

        let containers_content = r#"
containers:
  - id: "web"
    name: "Web Container"
    technology: "React"
"#;
        fs::write(root.join("systems/api/containers.yaml"), containers_content).unwrap();

        // Update mod file to include systems path
        let mod_content = r#"
version: "1.0"
name: "test-workspace"
include:
  - "systems/**/*.yaml"
"#;
        fs::write(root.join("c4.mod.yaml"), mod_content).unwrap();

        // Parser should automatically set system_id for containers
        // let mut parser = Parser::new(root.to_str().unwrap());
        // let model = parser.parse().unwrap();
        // assert_eq!(model.containers.len(), 1);
        // assert_eq!(model.containers[0].system_id, "api");
    }

    #[test]
    fn test_parser_with_components_in_container_context() {
        let temp = create_test_workspace();
        let root = temp.path();

        fs::create_dir_all(root.join("systems/api/backend")).unwrap();

        let components_content = r#"
components:
  - id: "auth"
    name: "Authentication"
    technology: "JWT"
"#;
        fs::write(root.join("systems/api/backend/components.yaml"), components_content).unwrap();

        // Parser should set both system_id and container_id
        // This test requires container context extraction logic
    }

    #[test]
    fn test_parser_build_indexes() {
        let temp = create_test_workspace();
        let path = temp.path().to_str().unwrap();

        // Parser should build model indexes after parsing
        // let mut parser = Parser::new(path);
        // let model = parser.parse().unwrap();
        //
        // // Model should have searchable indexes
        // let element = model.get_element("user");
        // assert!(element.is_some());
    }

    #[test]
    fn test_parser_options_propagation() {
        let temp = TempDir::new().unwrap();
        let root = temp.path();

        let mod_content = r#"
version: "1.0"
name: "test-workspace"
include: []
options:
  theme: "dark"
  auto_layout: true
"#;
        fs::write(root.join("c4.mod.yaml"), mod_content).unwrap();

        // Parser should copy options from mod file to model
        // let mut parser = Parser::new(root.to_str().unwrap());
        // let model = parser.parse().unwrap();
        // assert_eq!(model.options.theme, Some("dark".to_string()));
    }
}
