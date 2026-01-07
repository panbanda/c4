use crate::model::{self, ElementType};
use crate::parser::file::{DataFile, FileContext, ModFile};
use anyhow::{Context, Result};
use glob::glob;
use std::fs;
use std::path::{Path, PathBuf};

pub struct Parser {
    root_dir: PathBuf,
    mod_file: Option<ModFile>,
    model: model::Model,
    errors: Vec<anyhow::Error>,
}

impl Parser {
    pub fn new<P: AsRef<Path>>(dir: P) -> Self {
        Self {
            root_dir: dir.as_ref().to_path_buf(),
            mod_file: None,
            model: model::Model::new(),
            errors: Vec::new(),
        }
    }

    pub fn parse(&mut self) -> Result<model::Model> {
        let mod_path = self.root_dir.join("c4.mod.yaml");
        self.load_mod_file(&mod_path)?;

        let patterns: Vec<String> = self.mod_file.as_ref().unwrap().include.clone();

        for pattern in &patterns {
            let matches = self.find_files(pattern)?;

            for path in matches {
                if let Err(e) = self.load_data_file(&path) {
                    self.errors.push(e);
                }
            }
        }

        if !self.errors.is_empty() {
            return Err(anyhow::anyhow!("Parse errors: {} errors encountered", self.errors.len()));
        }

        let options = self.mod_file.as_ref().unwrap().options.clone();
        self.model.options = options;
        self.model.build_indexes().map_err(|e| anyhow::anyhow!("{}", e))?;

        let mut parsed_model = model::Model::new();
        std::mem::swap(&mut self.model, &mut parsed_model);
        Ok(parsed_model)
    }

    pub fn load_mod_file(&mut self, path: &Path) -> Result<()> {
        let data = fs::read_to_string(path)
            .with_context(|| format!("Failed to read mod file: {:?}", path))?;

        let mod_file: ModFile = serde_yaml::from_str(&data)
            .context("Invalid YAML in mod file")?;

        if mod_file.version.is_empty() {
            return Err(anyhow::anyhow!("Missing version field in mod file"));
        }
        if mod_file.name.is_empty() {
            return Err(anyhow::anyhow!("Missing name field in mod file"));
        }

        self.mod_file = Some(mod_file);
        Ok(())
    }

    pub fn load_data_file(&mut self, path: &Path) -> Result<()> {
        let data = fs::read_to_string(path)
            .with_context(|| format!("Failed to read data file: {:?}", path))?;

        let df: DataFile = serde_yaml::from_str(&data)
            .with_context(|| format!("Invalid YAML in data file: {:?}", path))?;

        let ctx = self.context_from_path(path);

        // Add persons
        for mut person in df.persons {
            person.element_type = ElementType::Person;
            self.model.persons.push(person);
        }

        // Add systems
        for mut system in df.systems {
            system.element_type = ElementType::System;
            self.model.systems.push(system);
        }

        // Add containers with system context
        for mut container in df.containers {
            container.element_type = ElementType::Container;
            if container.system_id.is_empty() {
                container.system_id = ctx.system_id.clone();
            }
            if container.system_id.is_empty() {
                self.errors.push(anyhow::anyhow!(
                    "{:?}: container {:?} has no system context",
                    path, container.base.id
                ));
                continue;
            }
            self.model.containers.push(container);
        }

        // Add components with container context
        for mut component in df.components {
            component.element_type = ElementType::Component;
            if component.system_id.is_empty() {
                component.system_id = ctx.system_id.clone();
            }
            if component.container_id.is_empty() {
                component.container_id = ctx.container.clone();
            }
            if component.system_id.is_empty() || component.container_id.is_empty() {
                self.errors.push(anyhow::anyhow!(
                    "{:?}: component {:?} missing system/container context",
                    path, component.base.id
                ));
                continue;
            }
            self.model.components.push(component);
        }

        // Add relationships
        self.model.relationships.extend(df.relationships);

        // Add flows
        self.model.flows.extend(df.flows);

        // Add deployments
        self.model.deployments.extend(df.deployments);

        Ok(())
    }

    pub fn context_from_path(&self, path: &Path) -> FileContext {
        let mut ctx = FileContext::new(path.display().to_string());

        let rel_path = match path.strip_prefix(&self.root_dir) {
            Ok(p) => p,
            Err(_) => return ctx,
        };

        let components: Vec<_> = rel_path.components().collect();

        for (i, component) in components.iter().enumerate() {
            if let Some(name) = component.as_os_str().to_str() {
                if name == "systems" && i + 1 < components.len() {
                    if let Some(system_id) = components[i + 1].as_os_str().to_str() {
                        ctx.system_id = system_id.to_string();
                        break;
                    }
                }
            }
        }

        ctx
    }

    pub fn get_mod_file(&self) -> Option<&ModFile> {
        self.mod_file.as_ref()
    }

    pub fn errors(&self) -> &[anyhow::Error] {
        &self.errors
    }

    pub fn find_files(&self, pattern: &str) -> Result<Vec<PathBuf>> {
        let full_pattern = self.root_dir.join(pattern);
        let pattern_str = full_pattern.to_string_lossy();

        let mut paths = Vec::new();
        for entry in glob(&pattern_str)? {
            paths.push(entry?);
        }

        Ok(paths)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn create_test_workspace() -> TempDir {
        let temp = TempDir::new().unwrap();
        let root = temp.path();

        let mod_content = r#"
version: "1.0"
name: "test-workspace"
include:
  - "data/*.yaml"
  - "systems/**/*.yaml"
"#;
        fs::write(root.join("c4.mod.yaml"), mod_content).unwrap();

        fs::create_dir(root.join("data")).unwrap();

        let data_content = r#"
persons:
  - id: "user"
    name: "End User"
    description: "User of the system"
    type: "person"

systems:
  - id: "api"
    name: "API System"
    description: "Backend API"
    type: "system"
"#;
        fs::write(root.join("data/model.yaml"), data_content).unwrap();

        temp
    }

    #[test]
    fn test_parser_new() {
        let temp = create_test_workspace();
        let path = temp.path();

        let parser = Parser::new(path);
        assert_eq!(parser.root_dir, path);
    }

    #[test]
    fn test_parser_load_mod_file() {
        let temp = create_test_workspace();
        let path = temp.path();

        let mut parser = Parser::new(path);
        let result = parser.load_mod_file(&path.join("c4.mod.yaml"));
        assert!(result.is_ok());

        let mod_file = parser.get_mod_file().unwrap();
        assert_eq!(mod_file.version, "1.0");
        assert_eq!(mod_file.name, "test-workspace");
    }

    #[test]
    fn test_parser_load_mod_file_missing() {
        let temp = TempDir::new().unwrap();
        let path = temp.path();

        let mut parser = Parser::new(path);
        let result = parser.load_mod_file(&path.join("c4.mod.yaml"));
        assert!(result.is_err());
    }

    #[test]
    fn test_parser_load_mod_file_invalid_yaml() {
        let temp = TempDir::new().unwrap();
        let root = temp.path();

        fs::write(root.join("c4.mod.yaml"), "invalid: yaml: content:").unwrap();

        let mut parser = Parser::new(root);
        let result = parser.load_mod_file(&root.join("c4.mod.yaml"));
        assert!(result.is_err());
    }

    #[test]
    fn test_parser_load_mod_file_missing_required_fields() {
        let temp = TempDir::new().unwrap();
        let root = temp.path();

        fs::write(root.join("c4.mod.yaml"), "version: '1.0'").unwrap();

        let mut parser = Parser::new(root);
        let result = parser.load_mod_file(&root.join("c4.mod.yaml"));
        assert!(result.is_err());
    }

    #[test]
    fn test_parser_parse_complete() {
        let temp = create_test_workspace();
        let path = temp.path();

        let mut parser = Parser::new(path);
        let result = parser.parse();
        assert!(result.is_ok());

        let model = result.unwrap();
        assert_eq!(model.persons.len(), 1);
        assert_eq!(model.systems.len(), 1);
    }

    #[test]
    fn test_parser_context_from_path() {
        let temp = create_test_workspace();
        let path = temp.path();

        let systems_path = path.join("systems/api");
        fs::create_dir_all(&systems_path).unwrap();

        let parser = Parser::new(path);
        let ctx = parser.context_from_path(&systems_path.join("containers.yaml"));
        assert_eq!(ctx.system_id, "api");
    }

    #[test]
    fn test_parser_context_from_path_no_system() {
        let temp = create_test_workspace();
        let path = temp.path();

        let parser = Parser::new(path);
        let ctx = parser.context_from_path(&path.join("data/model.yaml"));
        assert_eq!(ctx.system_id, "");
    }

    #[test]
    fn test_parser_find_files() {
        let temp = create_test_workspace();
        let path = temp.path();

        let parser = Parser::new(path);
        let files = parser.find_files("data/*.yaml").unwrap();
        assert_eq!(files.len(), 1);
    }
}
