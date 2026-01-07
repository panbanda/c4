use crate::model::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModFile {
    pub version: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub schema: Option<String>,
    #[serde(default)]
    pub include: Vec<String>,
    #[serde(default)]
    pub imports: HashMap<String, Import>,
    #[serde(default)]
    pub options: Options,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Import {
    pub source: String,
    #[serde(skip_serializing_if = "Option::is_none", rename = "ref")]
    pub ref_: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct DataFile {
    #[serde(default)]
    pub persons: Vec<Person>,
    #[serde(default)]
    pub systems: Vec<SoftwareSystem>,
    #[serde(default)]
    pub containers: Vec<Container>,
    #[serde(default)]
    pub components: Vec<Component>,
    #[serde(default)]
    pub relationships: Vec<Relationship>,
    #[serde(default)]
    pub flows: Vec<Flow>,
    #[serde(default)]
    pub deployments: Vec<Deployment>,
}

#[derive(Debug, Clone, Default)]
pub struct FileContext {
    pub file_path: String,
    pub system_id: String,
    pub container: String,
}

impl FileContext {
    pub fn new(file_path: String) -> Self {
        Self {
            file_path,
            system_id: String::new(),
            container: String::new(),
        }
    }

    pub fn with_system_id(mut self, system_id: String) -> Self {
        self.system_id = system_id;
        self
    }

    pub fn with_container(mut self, container: String) -> Self {
        self.container = container;
        self
    }
}

#[cfg(test)]
mod tests {
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
  showMinimap: true
"#;

        let mod_file: ModFile = serde_yaml::from_str(yaml).unwrap();
        assert_eq!(mod_file.version, "1.0");
        assert_eq!(mod_file.name, "test-model");
        assert_eq!(
            mod_file.schema,
            Some("https://example.com/schema".to_string())
        );
        assert_eq!(mod_file.include.len(), 2);
        assert_eq!(mod_file.include[0], "data/*.yaml");
        assert!(mod_file.imports.contains_key("external"));

        let import = &mod_file.imports["external"];
        assert_eq!(import.source, "git");
        assert_eq!(import.ref_, Some("main".to_string()));
        assert_eq!(import.path, Some("/models/shared".to_string()));
    }

    #[test]
    fn test_mod_file_minimal() {
        let yaml = r#"
version: "1.0"
name: "minimal-model"
"#;

        let mod_file: ModFile = serde_yaml::from_str(yaml).unwrap();
        assert_eq!(mod_file.version, "1.0");
        assert_eq!(mod_file.name, "minimal-model");
        assert!(mod_file.schema.is_none());
        assert!(mod_file.include.is_empty());
        assert!(mod_file.imports.is_empty());
    }

    #[test]
    fn test_import_deserialization() {
        let yaml = r#"
source: "git"
ref: "v1.2.3"
path: "/models/shared"
"#;

        let import: Import = serde_yaml::from_str(yaml).unwrap();
        assert_eq!(import.source, "git");
        assert_eq!(import.ref_, Some("v1.2.3".to_string()));
        assert_eq!(import.path, Some("/models/shared".to_string()));
    }

    #[test]
    fn test_import_minimal() {
        let yaml = r#"
source: "local"
"#;

        let import: Import = serde_yaml::from_str(yaml).unwrap();
        assert_eq!(import.source, "local");
        assert!(import.ref_.is_none());
        assert!(import.path.is_none());
    }

    #[test]
    fn test_data_file_with_persons() {
        let yaml = r#"
persons:
  - id: "user"
    name: "End User"
    description: "A user of the system"
    tags: ["external"]
    type: "person"
"#;

        let data: DataFile = serde_yaml::from_str(yaml).unwrap();
        assert_eq!(data.persons.len(), 1);
        assert_eq!(data.persons[0].base.id, "user");
        assert_eq!(data.persons[0].base.name, "End User");
    }

    #[test]
    fn test_data_file_with_systems() {
        let yaml = r#"
systems:
  - id: "api"
    name: "API System"
    description: "REST API"
    type: "system"
"#;

        let data: DataFile = serde_yaml::from_str(yaml).unwrap();
        assert_eq!(data.systems.len(), 1);
        assert_eq!(data.systems[0].base.id, "api");
    }

    #[test]
    fn test_data_file_with_containers() {
        let yaml = r#"
containers:
  - id: "web"
    name: "Web Application"
    systemId: "api"
    technology: "React"
    type: "container"
"#;

        let data: DataFile = serde_yaml::from_str(yaml).unwrap();
        assert_eq!(data.containers.len(), 1);
        assert_eq!(data.containers[0].base.id, "web");
        assert_eq!(data.containers[0].system_id, "api");
    }

    #[test]
    fn test_data_file_with_components() {
        let yaml = r#"
components:
  - id: "auth"
    name: "Authentication"
    systemId: "api"
    containerId: "backend"
    technology: "JWT"
    type: "component"
"#;

        let data: DataFile = serde_yaml::from_str(yaml).unwrap();
        assert_eq!(data.components.len(), 1);
        assert_eq!(data.components[0].base.id, "auth");
        assert_eq!(data.components[0].container_id, "backend");
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

        let data: DataFile = serde_yaml::from_str(yaml).unwrap();
        assert_eq!(data.relationships.len(), 1);
        assert_eq!(data.relationships[0].from, "user");
        assert_eq!(data.relationships[0].to, "api");
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

        let data: DataFile = serde_yaml::from_str(yaml).unwrap();
        assert_eq!(data.flows.len(), 1);
        assert_eq!(data.flows[0].id, "login");
        assert_eq!(data.flows[0].steps.len(), 1);
    }

    #[test]
    fn test_data_file_with_deployments() {
        let yaml = r#"
deployments:
  - id: "prod"
    name: "Production"
    nodes:
      - id: "aws"
        name: "AWS Cloud"
"#;

        let data: DataFile = serde_yaml::from_str(yaml).unwrap();
        assert_eq!(data.deployments.len(), 1);
        assert_eq!(data.deployments[0].id, "prod");
    }

    #[test]
    fn test_file_context_creation() {
        let ctx = FileContext::new("/path/to/file.yaml".to_string());
        assert_eq!(ctx.file_path, "/path/to/file.yaml");
        assert_eq!(ctx.system_id, "");
        assert_eq!(ctx.container, "");
    }

    #[test]
    fn test_file_context_with_system_id() {
        let ctx =
            FileContext::new("/path/to/file.yaml".to_string()).with_system_id("api".to_string());
        assert_eq!(ctx.system_id, "api");
    }

    #[test]
    fn test_file_context_with_container() {
        let ctx = FileContext::new("/path/to/file.yaml".to_string())
            .with_system_id("api".to_string())
            .with_container("backend".to_string());
        assert_eq!(ctx.system_id, "api");
        assert_eq!(ctx.container, "backend");
    }
}
