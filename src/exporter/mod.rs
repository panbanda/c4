pub mod html;
pub mod images;
pub mod json;

use crate::model;
use std::fs;
use std::path::Path;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ExporterError {
    #[error("Failed to create output directory: {0}")]
    CreateDirectory(#[from] std::io::Error),

    #[error("HTML export error: {0}")]
    HtmlExport(String),

    #[error("JSON export error: {0}")]
    JsonExport(String),

    #[error("Image export error: {0}")]
    ImageExport(String),
}

pub type Result<T> = std::result::Result<T, ExporterError>;

pub struct Exporter<'a> {
    model: &'a model::Model,
    output_dir: String,
}

impl<'a> Exporter<'a> {
    pub fn new(model: &'a model::Model, output_dir: &str) -> Self {
        Self {
            model,
            output_dir: output_dir.to_string(),
        }
    }

    pub fn export_html(&self) -> Result<()> {
        self.ensure_output_dir()?;
        html::export_html(self.model, &self.output_dir)
    }

    pub fn export_json(&self) -> Result<()> {
        self.ensure_output_dir()?;
        json::export_json(self.model, &self.output_dir)
    }

    pub fn export_images(&self) -> Result<()> {
        self.ensure_output_dir()?;
        images::export_images(self.model, &self.output_dir)
    }

    fn ensure_output_dir(&self) -> Result<()> {
        let path = Path::new(&self.output_dir);
        if !path.exists() {
            fs::create_dir_all(path)?;
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn create_sample_model() -> model::Model {
        let mut m = model::Model::new();
        m.persons.push(model::Person {
            base: model::BaseElement {
                id: "user".to_string(),
                name: "User".to_string(),
                description: Some("A user".to_string()),
                tags: None,
                properties: None,
            },
            element_type: model::ElementType::Person,
        });
        m.systems.push(model::SoftwareSystem {
            base: model::BaseElement {
                id: "app".to_string(),
                name: "Application".to_string(),
                description: Some("The app".to_string()),
                tags: None,
                properties: None,
            },
            element_type: model::ElementType::System,
            external: None,
        });
        m
    }

    #[test]
    fn test_exporter_new() {
        let model = create_sample_model();
        let exporter = Exporter::new(&model, "/tmp/test");
        assert_eq!(exporter.output_dir, "/tmp/test");
    }

    #[test]
    fn test_ensure_output_dir_creates_directory() {
        let model = create_sample_model();
        let temp_dir = TempDir::new().unwrap();
        let nested_path = temp_dir.path().join("nested").join("dir");
        let exporter = Exporter::new(&model, nested_path.to_str().unwrap());

        assert!(!nested_path.exists());
        exporter.ensure_output_dir().unwrap();
        assert!(nested_path.exists());
    }

    #[test]
    fn test_ensure_output_dir_existing_directory() {
        let model = create_sample_model();
        let temp_dir = TempDir::new().unwrap();
        let exporter = Exporter::new(&model, temp_dir.path().to_str().unwrap());

        let result = exporter.ensure_output_dir();
        assert!(result.is_ok());
    }

    #[test]
    fn test_export_html_integration() {
        let model = create_sample_model();
        let temp_dir = TempDir::new().unwrap();
        let exporter = Exporter::new(&model, temp_dir.path().to_str().unwrap());

        let result = exporter.export_html();
        assert!(result.is_ok());

        let index_path = temp_dir.path().join("index.html");
        assert!(index_path.exists());
    }

    #[test]
    fn test_export_json_integration() {
        let model = create_sample_model();
        let temp_dir = TempDir::new().unwrap();
        let exporter = Exporter::new(&model, temp_dir.path().to_str().unwrap());

        let result = exporter.export_json();
        assert!(result.is_ok());

        let json_path = temp_dir.path().join("model.json");
        assert!(json_path.exists());
    }

    #[test]
    fn test_export_images_integration() {
        let model = create_sample_model();
        let temp_dir = TempDir::new().unwrap();
        let exporter = Exporter::new(&model, temp_dir.path().to_str().unwrap());

        let result = exporter.export_images();
        assert!(result.is_ok());
    }

    #[test]
    fn test_export_html_creates_directory() {
        let model = create_sample_model();
        let temp_dir = TempDir::new().unwrap();
        let nested_dir = temp_dir.path().join("nested");
        let exporter = Exporter::new(&model, nested_dir.to_str().unwrap());

        assert!(!nested_dir.exists());
        exporter.export_html().unwrap();
        assert!(nested_dir.exists());
    }

    #[test]
    fn test_export_json_creates_directory() {
        let model = create_sample_model();
        let temp_dir = TempDir::new().unwrap();
        let nested_dir = temp_dir.path().join("nested");
        let exporter = Exporter::new(&model, nested_dir.to_str().unwrap());

        assert!(!nested_dir.exists());
        exporter.export_json().unwrap();
        assert!(nested_dir.exists());
    }

    #[test]
    fn test_export_images_creates_directory() {
        let model = create_sample_model();
        let temp_dir = TempDir::new().unwrap();
        let nested_dir = temp_dir.path().join("nested");
        let exporter = Exporter::new(&model, nested_dir.to_str().unwrap());

        assert!(!nested_dir.exists());
        exporter.export_images().unwrap();
        assert!(nested_dir.exists());
    }
}
