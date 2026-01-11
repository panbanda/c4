use crate::model::ElementType;
use crate::parser::file::DataFile;
use crate::parser::parser::Parser;
use anyhow::{Context, Result};
use serde_yaml::Value;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

pub struct Writer<'a> {
    parser: &'a Parser,
}

impl<'a> Writer<'a> {
    pub fn new(parser: &'a Parser) -> Self {
        Self { parser }
    }

    pub fn update_element(
        &self,
        element_id: &str,
        element_type: ElementType,
        updates: HashMap<String, Value>,
    ) -> Result<()> {
        let file_path = self.find_element_file(element_id, element_type)?;

        let data = fs::read_to_string(&file_path)
            .with_context(|| format!("Failed to read file {:?}", file_path))?;

        let mut root: Value = serde_yaml::from_str(&data).context("Failed to parse YAML")?;

        self.update_in_ast(&mut root, element_id, element_type, &updates)?;

        let output = serde_yaml::to_string(&root).context("Failed to serialize YAML")?;

        fs::write(&file_path, output)
            .with_context(|| format!("Failed to write file {:?}", file_path))?;

        Ok(())
    }

    pub fn find_element_file(
        &self,
        element_id: &str,
        element_type: ElementType,
    ) -> Result<PathBuf> {
        let mod_file = self
            .parser
            .get_mod_file()
            .ok_or_else(|| anyhow::anyhow!("parser not initialized"))?;

        let collection_key = match element_type {
            ElementType::Person => "persons",
            ElementType::System => "systems",
            ElementType::Container => "containers",
            ElementType::Component => "components",
        };

        for pattern in &mod_file.include {
            let matches = self.parser.find_files(pattern)?;

            for file_path in matches {
                let data = fs::read_to_string(&file_path)?;
                let df: DataFile = serde_yaml::from_str(&data)?;

                if self.contains_element(&df, element_id, collection_key) {
                    return Ok(file_path);
                }
            }
        }

        Err(anyhow::anyhow!(
            "element {} not found in any file",
            element_id
        ))
    }

    fn contains_element(&self, df: &DataFile, element_id: &str, collection_key: &str) -> bool {
        match collection_key {
            "persons" => df.persons.iter().any(|p| p.base.id == element_id),
            "systems" => df.systems.iter().any(|s| s.base.id == element_id),
            "containers" => df.containers.iter().any(|c| c.base.id == element_id),
            "components" => df.components.iter().any(|c| c.base.id == element_id),
            _ => false,
        }
    }

    fn update_in_ast(
        &self,
        root: &mut Value,
        element_id: &str,
        element_type: ElementType,
        updates: &HashMap<String, Value>,
    ) -> Result<()> {
        let collection_key = match element_type {
            ElementType::Person => "persons",
            ElementType::System => "systems",
            ElementType::Container => "containers",
            ElementType::Component => "components",
        };

        let mapping = root
            .as_mapping_mut()
            .ok_or_else(|| anyhow::anyhow!("expected mapping at root"))?;

        let collection = mapping
            .get_mut(collection_key)
            .and_then(|v| v.as_sequence_mut())
            .ok_or_else(|| anyhow::anyhow!("collection {} not found", collection_key))?;

        for item in collection {
            if let Some(item_map) = item.as_mapping_mut() {
                if self.is_target_element(item_map, element_id) {
                    self.update_element_node(item_map, updates)?;
                    return Ok(());
                }
            }
        }

        Err(anyhow::anyhow!("element {} not found in AST", element_id))
    }

    fn is_target_element(&self, node: &serde_yaml::Mapping, element_id: &str) -> bool {
        if let Some(Value::String(id)) = node.get(Value::String("id".to_string())) {
            return id == element_id;
        }
        false
    }

    fn update_element_node(
        &self,
        node: &mut serde_yaml::Mapping,
        updates: &HashMap<String, Value>,
    ) -> Result<()> {
        for (field, value) in updates {
            node.insert(Value::String(field.clone()), value.clone());
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    fn create_test_workspace() -> TempDir {
        let temp = TempDir::new().unwrap();
        let root = temp.path();

        let mod_content = r#"
version: "1.0"
name: "test-workspace"
include:
  - "data/*.yaml"
"#;
        fs::write(root.join("c4.mod.yaml"), mod_content).unwrap();

        fs::create_dir(root.join("data")).unwrap();

        let data_content = r#"
persons:
  - id: "user"
    name: "End User"
    description: "User of the system"
    type: "person"
    tags:
      - "external"

systems:
  - id: "api"
    name: "API System"
    description: "Backend API"
    technology: "Node.js"
    type: "system"
"#;
        fs::write(root.join("data/model.yaml"), data_content).unwrap();

        temp
    }

    #[test]
    fn test_writer_find_element_file() {
        let temp = create_test_workspace();
        let mut parser = Parser::new(temp.path());
        parser.parse().unwrap();

        let writer = Writer::new(&parser);
        let file_path = writer
            .find_element_file("user", ElementType::Person)
            .unwrap();
        assert!(file_path.ends_with("data/model.yaml"));
    }

    #[test]
    fn test_writer_find_element_file_not_found() {
        let temp = create_test_workspace();
        let mut parser = Parser::new(temp.path());
        parser.parse().unwrap();

        let writer = Writer::new(&parser);
        let result = writer.find_element_file("nonexistent", ElementType::Person);
        assert!(result.is_err());
    }

    #[test]
    fn test_writer_update_element_simple_field() {
        let temp = create_test_workspace();
        let mut parser = Parser::new(temp.path());
        parser.parse().unwrap();

        let writer = Writer::new(&parser);
        let mut updates = HashMap::new();
        updates.insert(
            "description".to_string(),
            Value::String("Updated description".to_string()),
        );

        let result = writer.update_element("user", ElementType::Person, updates);
        assert!(result.is_ok());

        let content = fs::read_to_string(temp.path().join("data/model.yaml")).unwrap();
        assert!(content.contains("Updated description"));
    }

    #[test]
    fn test_writer_update_element_add_new_field() {
        let temp = create_test_workspace();
        let mut parser = Parser::new(temp.path());
        parser.parse().unwrap();

        let writer = Writer::new(&parser);
        let mut updates = HashMap::new();
        updates.insert(
            "url".to_string(),
            Value::String("https://example.com".to_string()),
        );

        let result = writer.update_element("api", ElementType::System, updates);
        assert!(result.is_ok());

        let content = fs::read_to_string(temp.path().join("data/model.yaml")).unwrap();
        assert!(content.contains("url"));
        assert!(content.contains("https://example.com"));
    }

    #[test]
    fn test_writer_update_preserves_structure() {
        let temp = create_test_workspace();
        let mut parser = Parser::new(temp.path());
        parser.parse().unwrap();

        let writer = Writer::new(&parser);
        let mut updates = HashMap::new();
        updates.insert(
            "name".to_string(),
            Value::String("Updated Name".to_string()),
        );

        writer
            .update_element("user", ElementType::Person, updates)
            .unwrap();

        let updated = fs::read_to_string(temp.path().join("data/model.yaml")).unwrap();

        assert!(updated.contains("persons:"));
        assert!(updated.contains("systems:"));
        assert!(updated.contains("Updated Name"));
    }

    #[test]
    fn test_writer_update_invalid_yaml_after_update() {
        let temp = create_test_workspace();
        let mut parser = Parser::new(temp.path());
        parser.parse().unwrap();

        let writer = Writer::new(&parser);
        let mut updates = HashMap::new();
        updates.insert("name".to_string(), Value::String("Updated".to_string()));

        writer
            .update_element("user", ElementType::Person, updates)
            .unwrap();

        let content = fs::read_to_string(temp.path().join("data/model.yaml")).unwrap();
        let _: Value = serde_yaml::from_str(&content).unwrap();
    }

    #[test]
    fn test_writer_find_container_element() {
        let temp = TempDir::new().unwrap();
        let root = temp.path();

        let mod_content = r#"
version: "1.0"
name: "test"
include:
  - "data/*.yaml"
"#;
        fs::write(root.join("c4.mod.yaml"), mod_content).unwrap();
        fs::create_dir(root.join("data")).unwrap();

        let data_content = r#"
systems:
  - id: "api"
    name: "API System"
    type: "system"

containers:
  - id: "web"
    name: "Web App"
    type: "container"
    systemId: "api"
"#;
        fs::write(root.join("data/containers.yaml"), data_content).unwrap();

        let mut parser = Parser::new(root);
        parser.parse().unwrap();

        let writer = Writer::new(&parser);
        let file = writer
            .find_element_file("web", ElementType::Container)
            .unwrap();
        assert!(file.ends_with("containers.yaml"));
    }

    #[test]
    fn test_writer_find_component_element() {
        let temp = TempDir::new().unwrap();
        let root = temp.path();

        let mod_content = r#"
version: "1.0"
name: "test"
include:
  - "data/*.yaml"
"#;
        fs::write(root.join("c4.mod.yaml"), mod_content).unwrap();
        fs::create_dir(root.join("data")).unwrap();

        let data_content = r#"
systems:
  - id: "api"
    name: "API System"
    type: "system"

containers:
  - id: "backend"
    name: "Backend"
    type: "container"
    systemId: "api"

components:
  - id: "handler"
    name: "Handler"
    type: "component"
    systemId: "api"
    containerId: "backend"
"#;
        fs::write(root.join("data/components.yaml"), data_content).unwrap();

        let mut parser = Parser::new(root);
        parser.parse().unwrap();

        let writer = Writer::new(&parser);
        let file = writer
            .find_element_file("handler", ElementType::Component)
            .unwrap();
        assert!(file.ends_with("components.yaml"));
    }

    #[test]
    fn test_writer_update_container() {
        let temp = TempDir::new().unwrap();
        let root = temp.path();

        let mod_content = r#"
version: "1.0"
name: "test"
include:
  - "data/*.yaml"
"#;
        fs::write(root.join("c4.mod.yaml"), mod_content).unwrap();
        fs::create_dir(root.join("data")).unwrap();

        let data_content = r#"
systems:
  - id: "api"
    name: "API System"
    type: "system"

containers:
  - id: "web"
    name: "Web App"
    type: "container"
    systemId: "api"
"#;
        fs::write(root.join("data/containers.yaml"), data_content).unwrap();

        let mut parser = Parser::new(root);
        parser.parse().unwrap();

        let writer = Writer::new(&parser);
        let mut updates = HashMap::new();
        updates.insert(
            "name".to_string(),
            Value::String("Updated Web App".to_string()),
        );

        let result = writer.update_element("web", ElementType::Container, updates);
        assert!(result.is_ok());

        let content = fs::read_to_string(root.join("data/containers.yaml")).unwrap();
        assert!(content.contains("Updated Web App"));
    }

    #[test]
    fn test_writer_update_component() {
        let temp = TempDir::new().unwrap();
        let root = temp.path();

        let mod_content = r#"
version: "1.0"
name: "test"
include:
  - "data/*.yaml"
"#;
        fs::write(root.join("c4.mod.yaml"), mod_content).unwrap();
        fs::create_dir(root.join("data")).unwrap();

        let data_content = r#"
systems:
  - id: "api"
    name: "API System"
    type: "system"

containers:
  - id: "backend"
    name: "Backend"
    type: "container"
    systemId: "api"

components:
  - id: "handler"
    name: "Handler"
    type: "component"
    systemId: "api"
    containerId: "backend"
"#;
        fs::write(root.join("data/components.yaml"), data_content).unwrap();

        let mut parser = Parser::new(root);
        parser.parse().unwrap();

        let writer = Writer::new(&parser);
        let mut updates = HashMap::new();
        updates.insert(
            "name".to_string(),
            Value::String("Updated Handler".to_string()),
        );

        let result = writer.update_element("handler", ElementType::Component, updates);
        assert!(result.is_ok());

        let content = fs::read_to_string(root.join("data/components.yaml")).unwrap();
        assert!(content.contains("Updated Handler"));
    }

    #[test]
    fn test_writer_update_element_not_in_ast() {
        let temp = TempDir::new().unwrap();
        let root = temp.path();

        let mod_content = r#"
version: "1.0"
name: "test"
include:
  - "data/*.yaml"
"#;
        fs::write(root.join("c4.mod.yaml"), mod_content).unwrap();
        fs::create_dir(root.join("data")).unwrap();

        // Create a file that parses as containing a person but the AST doesn't have it
        let data_content = r#"
persons:
  - id: "user"
    name: "User"
    type: "person"
"#;
        fs::write(root.join("data/model.yaml"), data_content).unwrap();

        let mut parser = Parser::new(root);
        parser.parse().unwrap();

        let writer = Writer::new(&parser);
        let mut updates = HashMap::new();
        updates.insert("name".to_string(), Value::String("Updated".to_string()));

        // Try to update an element that exists in the file but with wrong ID
        let result = writer.update_element("nonexistent", ElementType::Person, updates);
        assert!(result.is_err());
    }

    #[test]
    fn test_contains_element_unknown_collection() {
        let temp = TempDir::new().unwrap();
        let parser = Parser::new(temp.path());

        let writer = Writer::new(&parser);

        let df = DataFile::default();
        // Using an internal check - "unknown" collection key should return false
        assert!(!writer.contains_element(&df, "any_id", "unknown"));
    }
}
