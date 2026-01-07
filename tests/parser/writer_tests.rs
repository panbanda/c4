use std::fs;
use std::collections::HashMap;
use tempfile::TempDir;

#[cfg(test)]
mod writer_tests {
    use super::*;

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
    tags:
      - "external"

systems:
  - id: "api"
    name: "API System"
    description: "Backend API"
    technology: "Node.js"
"#;
        fs::write(root.join("data/model.yaml"), data_content).unwrap();

        temp
    }

    #[test]
    fn test_writer_new() {
        // Writer should be created with parser reference
        // let parser = create_test_parser();
        // let writer = Writer::new(&parser);
    }

    #[test]
    fn test_writer_find_element_file() {
        // Writer should locate file containing element
        // let temp = create_test_workspace();
        // let parser = Parser::new(temp.path().to_str().unwrap());
        // parser.parse().unwrap();
        //
        // let writer = Writer::new(&parser);
        // let file_path = writer.find_element_file("user", ElementType::Person).unwrap();
        // assert!(file_path.ends_with("data/model.yaml"));
    }

    #[test]
    fn test_writer_find_element_file_not_found() {
        // Writer should return error if element not found
        // let temp = create_test_workspace();
        // let parser = Parser::new(temp.path().to_str().unwrap());
        // parser.parse().unwrap();
        //
        // let writer = Writer::new(&parser);
        // let result = writer.find_element_file("nonexistent", ElementType::Person);
        // assert!(result.is_err());
    }

    #[test]
    fn test_writer_update_element_simple_field() {
        // Update a simple string field
        // let temp = create_test_workspace();
        // let parser = Parser::new(temp.path().to_str().unwrap());
        // parser.parse().unwrap();
        //
        // let mut writer = Writer::new(&parser);
        // let mut updates = HashMap::new();
        // updates.insert("description".to_string(), "Updated description");
        //
        // let result = writer.update_element("user", ElementType::Person, updates);
        // assert!(result.is_ok());
        //
        // // Verify the file was updated
        // let content = fs::read_to_string(temp.path().join("data/model.yaml")).unwrap();
        // assert!(content.contains("Updated description"));
    }

    #[test]
    fn test_writer_update_element_array_field() {
        // Update an array field (tags)
        // let temp = create_test_workspace();
        // let parser = Parser::new(temp.path().to_str().unwrap());
        // parser.parse().unwrap();
        //
        // let mut writer = Writer::new(&parser);
        // let mut updates = HashMap::new();
        // updates.insert("tags".to_string(), vec!["external", "verified"]);
        //
        // let result = writer.update_element("user", ElementType::Person, updates);
        // assert!(result.is_ok());
    }

    #[test]
    fn test_writer_update_element_add_new_field() {
        // Add a field that doesn't exist
        // let temp = create_test_workspace();
        // let parser = Parser::new(temp.path().to_str().unwrap());
        // parser.parse().unwrap();
        //
        // let mut writer = Writer::new(&parser);
        // let mut updates = HashMap::new();
        // updates.insert("url".to_string(), "https://example.com");
        //
        // let result = writer.update_element("api", ElementType::System, updates);
        // assert!(result.is_ok());
        //
        // // Verify the field was added
        // let content = fs::read_to_string(temp.path().join("data/model.yaml")).unwrap();
        // assert!(content.contains("url"));
        // assert!(content.contains("https://example.com"));
    }

    #[test]
    fn test_writer_update_element_multiple_fields() {
        // Update multiple fields at once
        // let temp = create_test_workspace();
        // let parser = Parser::new(temp.path().to_str().unwrap());
        // parser.parse().unwrap();
        //
        // let mut writer = Writer::new(&parser);
        // let mut updates = HashMap::new();
        // updates.insert("name".to_string(), "New Name");
        // updates.insert("description".to_string(), "New Description");
        // updates.insert("technology".to_string(), "Rust");
        //
        // let result = writer.update_element("api", ElementType::System, updates);
        // assert!(result.is_ok());
    }

    #[test]
    fn test_writer_update_preserves_structure() {
        // Ensure YAML structure is preserved
        // let temp = create_test_workspace();
        // let parser = Parser::new(temp.path().to_str().unwrap());
        // parser.parse().unwrap();
        //
        // let original = fs::read_to_string(temp.path().join("data/model.yaml")).unwrap();
        //
        // let mut writer = Writer::new(&parser);
        // let mut updates = HashMap::new();
        // updates.insert("name".to_string(), "Updated Name");
        //
        // writer.update_element("user", ElementType::Person, updates).unwrap();
        //
        // let updated = fs::read_to_string(temp.path().join("data/model.yaml")).unwrap();
        //
        // // Structure should be similar (check for key sections)
        // assert!(updated.contains("persons:"));
        // assert!(updated.contains("systems:"));
    }

    #[test]
    fn test_writer_update_preserves_comments() {
        // YAML comments should be preserved
        // This is a nice-to-have feature
    }

    #[test]
    fn test_writer_update_invalid_element_type() {
        // Update with unsupported element type
        // let temp = create_test_workspace();
        // let parser = Parser::new(temp.path().to_str().unwrap());
        // parser.parse().unwrap();
        //
        // let writer = Writer::new(&parser);
        // let result = writer.update_element("user", ElementType::Relationship, HashMap::new());
        // assert!(result.is_err());
    }

    #[test]
    fn test_writer_update_file_not_writable() {
        // Handle permission errors gracefully
        // let temp = create_test_workspace();
        // let file_path = temp.path().join("data/model.yaml");
        //
        // // Make file read-only
        // let mut perms = fs::metadata(&file_path).unwrap().permissions();
        // perms.set_readonly(true);
        // fs::set_permissions(&file_path, perms).unwrap();
        //
        // let parser = Parser::new(temp.path().to_str().unwrap());
        // parser.parse().unwrap();
        //
        // let mut writer = Writer::new(&parser);
        // let result = writer.update_element("user", ElementType::Person, HashMap::new());
        // assert!(result.is_err());
    }

    #[test]
    fn test_writer_update_invalid_yaml_after_update() {
        // Ensure updated YAML is still valid
        // let temp = create_test_workspace();
        // let parser = Parser::new(temp.path().to_str().unwrap());
        // parser.parse().unwrap();
        //
        // let mut writer = Writer::new(&parser);
        // let mut updates = HashMap::new();
        // updates.insert("name".to_string(), "Updated");
        //
        // writer.update_element("user", ElementType::Person, updates).unwrap();
        //
        // // Try to parse the updated file
        // let content = fs::read_to_string(temp.path().join("data/model.yaml")).unwrap();
        // let _: serde_yaml::Value = serde_yaml::from_str(&content).unwrap();
    }

    #[test]
    fn test_writer_contains_element() {
        // Test internal containsElement helper
        // Should check if DataFile contains element by ID
    }

    #[test]
    fn test_writer_update_in_ast() {
        // Test AST navigation and update logic
        // Should find element in YAML tree and update fields
    }

    #[test]
    fn test_writer_is_target_element() {
        // Test element identification in AST
        // Should match element by ID field
    }

    #[test]
    fn test_writer_update_element_node() {
        // Test updating fields in YAML node
        // Should handle both existing and new fields
    }

    #[test]
    fn test_writer_set_node_value_string() {
        // Test setting string values
    }

    #[test]
    fn test_writer_set_node_value_array() {
        // Test setting array values
    }

    #[test]
    fn test_writer_set_node_value_nested_array() {
        // Test setting nested array values
    }

    #[test]
    fn test_writer_update_container() {
        // Update container element
        // let temp = create_test_workspace();
        // fs::create_dir_all(temp.path().join("systems/api")).unwrap();
        //
        // let containers = r#"
        // containers:
        //   - id: "web"
        //     name: "Web Container"
        // "#;
        // fs::write(temp.path().join("systems/api/containers.yaml"), containers).unwrap();
        //
        // // Update and verify
    }

    #[test]
    fn test_writer_update_component() {
        // Update component element
    }

    #[test]
    fn test_writer_parser_not_initialized() {
        // Writer should fail if parser has no mod file
        // let parser = Parser::new("/nonexistent");
        // let writer = Writer::new(&parser);
        // let result = writer.find_element_file("user", ElementType::Person);
        // assert!(result.is_err());
        // assert!(result.unwrap_err().to_string().contains("not initialized"));
    }
}
