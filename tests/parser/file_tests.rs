use serde_yaml;
use std::collections::HashMap;

// Import from the parser module once implemented
// use c4::parser::{ModFile, Import, DataFile, FileContext};

#[cfg(test)]
mod file_tests {
    use super::*;

    #[test]
    fn test_mod_file_deserialization() {
        let yaml = r#"
version: "1.0"
name: "test-model"
schema: "https://example.com/schema"
include:
  - "data/*.yaml"
  - "systems/**/*.yaml"
imports:
  external:
    source: "git"
    ref: "main"
    path: "/models/shared"
options:
  theme: "default"
"#;

        let mod_file: serde_yaml::Value = serde_yaml::from_str(yaml).unwrap();
        assert_eq!(mod_file["version"], "1.0");
        assert_eq!(mod_file["name"], "test-model");
        assert_eq!(mod_file["schema"], "https://example.com/schema");

        let include = mod_file["include"].as_sequence().unwrap();
        assert_eq!(include.len(), 2);
        assert_eq!(include[0].as_str().unwrap(), "data/*.yaml");

        let imports = mod_file["imports"].as_mapping().unwrap();
        assert!(imports.contains_key(&serde_yaml::Value::String("external".to_string())));
    }

    #[test]
    fn test_mod_file_minimal() {
        let yaml = r#"
version: "1.0"
name: "minimal-model"
"#;

        let mod_file: serde_yaml::Value = serde_yaml::from_str(yaml).unwrap();
        assert_eq!(mod_file["version"], "1.0");
        assert_eq!(mod_file["name"], "minimal-model");
        assert!(mod_file["schema"].is_null());
        assert!(mod_file["include"].is_null());
    }

    #[test]
    fn test_import_deserialization() {
        let yaml = r#"
source: "git"
ref: "v1.2.3"
path: "/models/shared"
"#;

        let import: serde_yaml::Value = serde_yaml::from_str(yaml).unwrap();
        assert_eq!(import["source"], "git");
        assert_eq!(import["ref"], "v1.2.3");
        assert_eq!(import["path"], "/models/shared");
    }

    #[test]
    fn test_import_minimal() {
        let yaml = r#"
source: "local"
"#;

        let import: serde_yaml::Value = serde_yaml::from_str(yaml).unwrap();
        assert_eq!(import["source"], "local");
        assert!(import["ref"].is_null());
        assert!(import["path"].is_null());
    }

    #[test]
    fn test_data_file_with_persons() {
        let yaml = r#"
persons:
  - id: "user"
    name: "End User"
    description: "A user of the system"
    tags: ["external"]
"#;

        let data: serde_yaml::Value = serde_yaml::from_str(yaml).unwrap();
        let persons = data["persons"].as_sequence().unwrap();
        assert_eq!(persons.len(), 1);
        assert_eq!(persons[0]["id"], "user");
        assert_eq!(persons[0]["name"], "End User");
    }

    #[test]
    fn test_data_file_with_systems() {
        let yaml = r#"
systems:
  - id: "api"
    name: "API System"
    description: "REST API"
    technology: "Node.js"
"#;

        let data: serde_yaml::Value = serde_yaml::from_str(yaml).unwrap();
        let systems = data["systems"].as_sequence().unwrap();
        assert_eq!(systems.len(), 1);
        assert_eq!(systems[0]["id"], "api");
        assert_eq!(systems[0]["technology"], "Node.js");
    }

    #[test]
    fn test_data_file_with_containers() {
        let yaml = r#"
containers:
  - id: "web"
    name: "Web Application"
    system_id: "api"
    technology: "React"
"#;

        let data: serde_yaml::Value = serde_yaml::from_str(yaml).unwrap();
        let containers = data["containers"].as_sequence().unwrap();
        assert_eq!(containers.len(), 1);
        assert_eq!(containers[0]["id"], "web");
        assert_eq!(containers[0]["system_id"], "api");
    }

    #[test]
    fn test_data_file_with_components() {
        let yaml = r#"
components:
  - id: "auth"
    name: "Authentication"
    system_id: "api"
    container_id: "backend"
    technology: "JWT"
"#;

        let data: serde_yaml::Value = serde_yaml::from_str(yaml).unwrap();
        let components = data["components"].as_sequence().unwrap();
        assert_eq!(components.len(), 1);
        assert_eq!(components[0]["id"], "auth");
        assert_eq!(components[0]["container_id"], "backend");
    }

    #[test]
    fn test_data_file_with_relationships() {
        let yaml = r#"
relationships:
  - from: "user"
    to: "api"
    description: "Uses"
    technology: "HTTPS"
"#;

        let data: serde_yaml::Value = serde_yaml::from_str(yaml).unwrap();
        let relationships = data["relationships"].as_sequence().unwrap();
        assert_eq!(relationships.len(), 1);
        assert_eq!(relationships[0]["from"], "user");
        assert_eq!(relationships[0]["to"], "api");
    }

    #[test]
    fn test_data_file_with_flows() {
        let yaml = r#"
flows:
  - id: "login"
    name: "User Login"
    steps:
      - seq: 1
        from: "user"
        to: "api"
        description: "Authenticate"
"#;

        let data: serde_yaml::Value = serde_yaml::from_str(yaml).unwrap();
        let flows = data["flows"].as_sequence().unwrap();
        assert_eq!(flows.len(), 1);
        assert_eq!(flows[0]["id"], "login");
    }

    #[test]
    fn test_data_file_with_deployments() {
        let yaml = r#"
deployments:
  - id: "prod"
    name: "Production"
    environment: "production"
    nodes:
      - id: "aws"
        name: "AWS Cloud"
"#;

        let data: serde_yaml::Value = serde_yaml::from_str(yaml).unwrap();
        let deployments = data["deployments"].as_sequence().unwrap();
        assert_eq!(deployments.len(), 1);
        assert_eq!(deployments[0]["id"], "prod");
        assert_eq!(deployments[0]["environment"], "production");
    }

    #[test]
    fn test_file_context_creation() {
        // Test will verify FileContext struct can be created
        // and properly tracks file path, system ID, and container
    }

    #[test]
    fn test_file_context_from_systems_path() {
        // Test extracting system ID from paths like "systems/api/containers.yaml"
    }

    #[test]
    fn test_file_context_no_system() {
        // Test paths without system context
    }
}
