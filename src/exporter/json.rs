use crate::exporter::{ExporterError, Model, Result};
use std::fs;
use std::path::Path;

pub fn export_json(model: &Model, output_dir: &str) -> Result<()> {
    let json_data = serde_json::to_string_pretty(model)
        .map_err(|e| ExporterError::JsonExport(format!("Failed to serialize model: {}", e)))?;

    let json_path = Path::new(output_dir).join("model.json");
    fs::write(&json_path, json_data.as_bytes())
        .map_err(|e| ExporterError::JsonExport(format!("Failed to write JSON file: {}", e)))?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::exporter::{Options, Person, SoftwareSystem};
    use tempfile::TempDir;

    fn create_test_model() -> Model {
        Model {
            persons: vec![Person {
                id: "user".to_string(),
                name: "User".to_string(),
                description: Some("Test user".to_string()),
            }],
            systems: vec![SoftwareSystem {
                id: "app".to_string(),
                name: "Application".to_string(),
                description: Some("Test app".to_string()),
            }],
            containers: vec![],
            components: vec![],
            relationships: vec![],
            flows: vec![],
            deployments: vec![],
            options: Options {
                title: Some("Test".to_string()),
                theme: None,
            },
        }
    }

    #[test]
    fn test_export_json_creates_file() {
        let model = create_test_model();
        let temp_dir = TempDir::new().unwrap();
        let output_dir = temp_dir.path().to_str().unwrap();

        export_json(&model, output_dir).unwrap();

        let json_path = temp_dir.path().join("model.json");
        assert!(json_path.exists());
    }

    #[test]
    fn test_export_json_valid_format() {
        let model = create_test_model();
        let temp_dir = TempDir::new().unwrap();
        let output_dir = temp_dir.path().to_str().unwrap();

        export_json(&model, output_dir).unwrap();

        let json_path = temp_dir.path().join("model.json");
        let json_content = fs::read_to_string(json_path).unwrap();

        let parsed: serde_json::Value = serde_json::from_str(&json_content).unwrap();
        assert!(parsed.is_object());
    }

    #[test]
    fn test_export_json_pretty_formatted() {
        let model = create_test_model();
        let temp_dir = TempDir::new().unwrap();
        let output_dir = temp_dir.path().to_str().unwrap();

        export_json(&model, output_dir).unwrap();

        let json_path = temp_dir.path().join("model.json");
        let json_content = fs::read_to_string(json_path).unwrap();

        assert!(json_content.contains("  "));
        assert!(json_content.contains("\n"));
        assert!(!json_content.starts_with("{\"persons\":["));
    }

    #[test]
    fn test_export_json_contains_all_fields() {
        let model = create_test_model();
        let temp_dir = TempDir::new().unwrap();
        let output_dir = temp_dir.path().to_str().unwrap();

        export_json(&model, output_dir).unwrap();

        let json_path = temp_dir.path().join("model.json");
        let json_content = fs::read_to_string(json_path).unwrap();

        assert!(json_content.contains("\"persons\""));
        assert!(json_content.contains("\"systems\""));
        assert!(json_content.contains("\"containers\""));
        assert!(json_content.contains("\"components\""));
        assert!(json_content.contains("\"relationships\""));
        assert!(json_content.contains("\"flows\""));
        assert!(json_content.contains("\"deployments\""));
        assert!(json_content.contains("\"options\""));
    }

    #[test]
    fn test_export_json_roundtrip() {
        let model = create_test_model();
        let temp_dir = TempDir::new().unwrap();
        let output_dir = temp_dir.path().to_str().unwrap();

        export_json(&model, output_dir).unwrap();

        let json_path = temp_dir.path().join("model.json");
        let json_content = fs::read_to_string(json_path).unwrap();

        let deserialized: Model = serde_json::from_str(&json_content).unwrap();
        assert_eq!(deserialized, model);
    }

    #[test]
    fn test_export_json_empty_arrays() {
        let model = Model {
            persons: vec![],
            systems: vec![],
            containers: vec![],
            components: vec![],
            relationships: vec![],
            flows: vec![],
            deployments: vec![],
            options: Options {
                title: None,
                theme: None,
            },
        };

        let temp_dir = TempDir::new().unwrap();
        let output_dir = temp_dir.path().to_str().unwrap();

        export_json(&model, output_dir).unwrap();

        let json_path = temp_dir.path().join("model.json");
        let json_content = fs::read_to_string(json_path).unwrap();

        assert!(json_content.contains("\"persons\": []"));
        assert!(json_content.contains("\"systems\": []"));
    }

    #[test]
    fn test_export_json_special_characters() {
        let model = Model {
            persons: vec![],
            systems: vec![SoftwareSystem {
                id: "test".to_string(),
                name: "Test with \"quotes\" and \n newlines".to_string(),
                description: Some("Unicode: 日本語 émojis: 🚀".to_string()),
            }],
            containers: vec![],
            components: vec![],
            relationships: vec![],
            flows: vec![],
            deployments: vec![],
            options: Options {
                title: None,
                theme: None,
            },
        };

        let temp_dir = TempDir::new().unwrap();
        let output_dir = temp_dir.path().to_str().unwrap();

        export_json(&model, output_dir).unwrap();

        let json_path = temp_dir.path().join("model.json");
        let json_content = fs::read_to_string(json_path).unwrap();

        assert!(json_content.contains(r#"\"quotes\""#));
        assert!(json_content.contains(r#"\n"#));
        assert!(json_content.contains("日本語"));
        assert!(json_content.contains("🚀"));
    }

    #[test]
    fn test_export_json_overwrites_existing() {
        let model = create_test_model();
        let temp_dir = TempDir::new().unwrap();
        let output_dir = temp_dir.path().to_str().unwrap();
        let json_path = temp_dir.path().join("model.json");

        fs::write(&json_path, b"old content").unwrap();

        export_json(&model, output_dir).unwrap();

        let json_content = fs::read_to_string(json_path).unwrap();
        assert!(!json_content.contains("old content"));
        assert!(json_content.contains("\"persons\""));
    }
}
