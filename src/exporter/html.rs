use crate::exporter::{ExporterError, Result};
use crate::model;
use rust_embed::RustEmbed;
use std::fs;
use std::io;
use std::path::Path;

#[derive(RustEmbed)]
#[folder = "src/exporter/static/dist"]
struct StaticAssets;

pub fn export_html(model: &model::Model, output_dir: &str) -> Result<()> {
    let template = StaticAssets::get("index.html")
        .ok_or_else(|| ExporterError::HtmlExport("Template index.html not found".to_string()))?;

    let template_str = std::str::from_utf8(template.data.as_ref())
        .map_err(|e| ExporterError::HtmlExport(format!("Invalid UTF-8 in template: {}", e)))?;

    let model_json = serde_json::to_string(model)
        .map_err(|e| ExporterError::HtmlExport(format!("Failed to serialize model: {}", e)))?;

    let model_script = format!("<script>window.C4_MODEL = {};</script>", model_json);

    let head_index = template_str
        .find("</head>")
        .ok_or_else(|| ExporterError::HtmlExport("No </head> tag found in template".to_string()))?;

    let html = format!(
        "{}{}\n  {}",
        &template_str[..head_index],
        model_script,
        &template_str[head_index..]
    );

    let html_path = Path::new(output_dir).join("index.html");
    fs::write(&html_path, html.as_bytes())
        .map_err(|e| ExporterError::HtmlExport(format!("Failed to write HTML: {}", e)))?;

    copy_static_assets(output_dir)?;

    Ok(())
}

fn copy_static_assets(output_dir: &str) -> Result<()> {
    if let Some(vite_svg) = StaticAssets::get("vite.svg") {
        let vite_path = Path::new(output_dir).join("vite.svg");
        fs::write(&vite_path, vite_svg.data.as_ref())
            .map_err(|e| ExporterError::HtmlExport(format!("Failed to write vite.svg: {}", e)))?;
    }

    let assets_dir = Path::new(output_dir).join("assets");
    fs::create_dir_all(&assets_dir)
        .map_err(|e| ExporterError::HtmlExport(format!("Failed to create assets dir: {}", e)))?;

    for file_path in StaticAssets::iter() {
        let path_str = file_path.as_ref();
        if path_str.starts_with("assets/") {
            if let Some(file_data) = StaticAssets::get(path_str) {
                let rel_path = path_str.strip_prefix("assets/").unwrap();
                let dest_path = assets_dir.join(rel_path);

                if let Some(parent) = dest_path.parent() {
                    fs::create_dir_all(parent).map_err(|e| {
                        ExporterError::HtmlExport(format!(
                            "Failed to create parent dir for {}: {}",
                            path_str, e
                        ))
                    })?;
                }

                fs::write(&dest_path, file_data.data.as_ref()).map_err(|e| {
                    ExporterError::HtmlExport(format!("Failed to write asset {}: {}", path_str, e))
                })?;
            }
        }
    }

    Ok(())
}

pub fn copy_file(src: &str, dst: &str) -> io::Result<()> {
    let src_path = Path::new(src);
    let dst_path = Path::new(dst);

    if let Some(parent) = dst_path.parent() {
        fs::create_dir_all(parent)?;
    }

    let content = fs::read(src_path)?;
    fs::write(dst_path, content)?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn create_test_model() -> model::Model {
        let mut m = model::Model::new();
        m.persons.push(model::Person {
            base: model::BaseElement {
                id: "user".to_string(),
                name: "User".to_string(),
                description: Some("Test user".to_string()),
                tags: None,
                properties: None,
            },
            element_type: model::ElementType::Person,
        });
        m.systems.push(model::SoftwareSystem {
            base: model::BaseElement {
                id: "app".to_string(),
                name: "Application".to_string(),
                description: Some("Test app".to_string()),
                tags: None,
                properties: None,
            },
            element_type: model::ElementType::System,
            external: None,
        });
        m
    }

    #[test]
    fn test_export_html_creates_index_file() {
        let model = create_test_model();
        let temp_dir = TempDir::new().unwrap();
        let output_dir = temp_dir.path().to_str().unwrap();

        export_html(&model, output_dir).unwrap();

        let index_path = temp_dir.path().join("index.html");
        assert!(index_path.exists());
    }

    #[test]
    fn test_export_html_injects_model() {
        let model = create_test_model();
        let temp_dir = TempDir::new().unwrap();
        let output_dir = temp_dir.path().to_str().unwrap();

        export_html(&model, output_dir).unwrap();

        let index_path = temp_dir.path().join("index.html");
        let html_content = fs::read_to_string(index_path).unwrap();

        assert!(html_content.contains("window.C4_MODEL = "));
        assert!(html_content.contains("\"persons\""));
        assert!(html_content.contains("\"User\""));
    }

    #[test]
    fn test_export_html_preserves_structure() {
        let model = create_test_model();
        let temp_dir = TempDir::new().unwrap();
        let output_dir = temp_dir.path().to_str().unwrap();

        export_html(&model, output_dir).unwrap();

        let index_path = temp_dir.path().join("index.html");
        let html_content = fs::read_to_string(index_path).unwrap();

        assert!(html_content.contains("<!doctype html>"));
        assert!(html_content.contains("<html"));
        assert!(html_content.contains("<head>"));
        assert!(html_content.contains("</head>"));
        assert!(html_content.contains("<body>"));
        assert!(html_content.contains("</body>"));
    }

    #[test]
    fn test_export_html_copies_assets() {
        let model = create_test_model();
        let temp_dir = TempDir::new().unwrap();
        let output_dir = temp_dir.path().to_str().unwrap();

        export_html(&model, output_dir).unwrap();

        let vite_svg = temp_dir.path().join("vite.svg");
        assert!(vite_svg.exists());

        let assets_dir = temp_dir.path().join("assets");
        assert!(assets_dir.exists());
        assert!(assets_dir.is_dir());
    }

    #[test]
    fn test_export_html_asset_files() {
        // Check if frontend assets are available (only present after `make build`)
        let has_embedded_assets = StaticAssets::iter().any(|f| f.starts_with("assets/"));
        if !has_embedded_assets {
            // Skip test when frontend hasn't been built - this is expected during
            // development with `cargo test`. Use `make test` to run with full assets.
            return;
        }

        let model = create_test_model();
        let temp_dir = TempDir::new().unwrap();
        let output_dir = temp_dir.path().to_str().unwrap();

        export_html(&model, output_dir).unwrap();

        let assets_dir = temp_dir.path().join("assets");
        let entries: Vec<_> = fs::read_dir(&assets_dir).unwrap().collect();

        let has_css = entries.iter().any(|e| {
            e.as_ref()
                .unwrap()
                .path()
                .extension()
                .is_some_and(|ext| ext == "css")
        });
        let has_js = entries.iter().any(|e| {
            e.as_ref()
                .unwrap()
                .path()
                .extension()
                .is_some_and(|ext| ext == "js")
        });

        assert!(has_css, "Expected at least one CSS file in assets/");
        assert!(has_js, "Expected at least one JS file in assets/");
    }

    #[test]
    fn test_copy_file_success() {
        let temp_dir = TempDir::new().unwrap();
        let src_path = temp_dir.path().join("source.txt");
        let dst_path = temp_dir.path().join("dest.txt");

        fs::write(&src_path, b"test content").unwrap();

        copy_file(src_path.to_str().unwrap(), dst_path.to_str().unwrap()).unwrap();

        assert!(dst_path.exists());
        let content = fs::read_to_string(dst_path).unwrap();
        assert_eq!(content, "test content");
    }

    #[test]
    fn test_copy_file_nonexistent_source() {
        let temp_dir = TempDir::new().unwrap();
        let src_path = temp_dir.path().join("nonexistent.txt");
        let dst_path = temp_dir.path().join("dest.txt");

        let result = copy_file(src_path.to_str().unwrap(), dst_path.to_str().unwrap());
        assert!(result.is_err());
    }

    #[test]
    fn test_copy_file_creates_parent_dirs() {
        let temp_dir = TempDir::new().unwrap();
        let src_path = temp_dir.path().join("source.txt");
        let dst_path = temp_dir.path().join("nested").join("dirs").join("dest.txt");

        fs::write(&src_path, b"test content").unwrap();

        copy_file(src_path.to_str().unwrap(), dst_path.to_str().unwrap()).unwrap();

        assert!(dst_path.exists());
    }
}
