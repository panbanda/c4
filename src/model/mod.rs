pub mod types;

pub use types::*;

use serde::Serialize;
use std::collections::HashMap;
use std::error::Error as StdError;
use std::fmt;

#[derive(Debug)]
pub enum ModelError {
    DuplicateElement(String),
}

impl fmt::Display for ModelError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ModelError::DuplicateElement(path) => write!(f, "duplicate element ID: {}", path),
        }
    }
}

impl StdError for ModelError {}

/// Model represents the complete C4 architecture model
#[derive(Debug, Default, Serialize)]
pub struct Model {
    // Primary storage
    pub persons: Vec<Person>,
    pub systems: Vec<SoftwareSystem>,
    pub containers: Vec<Container>,
    pub components: Vec<Component>,
    pub relationships: Vec<Relationship>,
    pub flows: Vec<Flow>,
    pub deployments: Vec<Deployment>,
    pub options: Options,

    // Indexes for fast lookup (not serialized)
    // Stores (ElementType, index) for O(1) lookup by path
    #[serde(skip)]
    elements_by_id: HashMap<String, (ElementType, usize)>,
    #[serde(skip)]
    elements_by_type: HashMap<ElementType, Vec<String>>,
    #[serde(skip)]
    elements_by_tag: HashMap<String, Vec<String>>,
    #[serde(skip)]
    children_by_id: HashMap<String, Vec<String>>,
    #[serde(skip)]
    outgoing_rels: HashMap<String, Vec<usize>>,
    #[serde(skip)]
    incoming_rels: HashMap<String, Vec<usize>>,
}

impl Model {
    /// Creates an empty model with initialized indexes
    pub fn new() -> Self {
        Model {
            persons: Vec::new(),
            systems: Vec::new(),
            containers: Vec::new(),
            components: Vec::new(),
            relationships: Vec::new(),
            flows: Vec::new(),
            deployments: Vec::new(),
            options: Options {
                show_minimap: false,
            },
            elements_by_id: HashMap::new(),
            elements_by_type: HashMap::new(),
            elements_by_tag: HashMap::new(),
            children_by_id: HashMap::new(),
            outgoing_rels: HashMap::new(),
            incoming_rels: HashMap::new(),
        }
    }

    /// Rebuilds all indexes from the element slices
    pub fn build_indexes(&mut self) -> Result<(), ModelError> {
        // Clear existing indexes
        self.elements_by_id.clear();
        self.elements_by_type.clear();
        self.elements_by_tag.clear();
        self.children_by_id.clear();
        self.outgoing_rels.clear();
        self.incoming_rels.clear();

        // Index persons
        for (idx, p) in self.persons.iter().enumerate() {
            let path = p.get_full_path();
            if self.elements_by_id.contains_key(&path) {
                return Err(ModelError::DuplicateElement(path));
            }
            self.elements_by_id
                .insert(path.clone(), (ElementType::Person, idx));
            self.elements_by_type
                .entry(ElementType::Person)
                .or_default()
                .push(path.clone());

            for tag in p.get_tags() {
                self.elements_by_tag
                    .entry(tag.clone())
                    .or_default()
                    .push(path.clone());
            }
        }

        // Index systems
        for (idx, s) in self.systems.iter().enumerate() {
            let path = s.get_full_path();
            if self.elements_by_id.contains_key(&path) {
                return Err(ModelError::DuplicateElement(path));
            }
            self.elements_by_id
                .insert(path.clone(), (ElementType::System, idx));
            self.elements_by_type
                .entry(ElementType::System)
                .or_default()
                .push(path.clone());

            for tag in s.get_tags() {
                self.elements_by_tag
                    .entry(tag.clone())
                    .or_default()
                    .push(path.clone());
            }
        }

        // Index containers
        for (idx, c) in self.containers.iter().enumerate() {
            let path = c.get_full_path();
            if self.elements_by_id.contains_key(&path) {
                return Err(ModelError::DuplicateElement(path));
            }
            self.elements_by_id
                .insert(path.clone(), (ElementType::Container, idx));
            self.elements_by_type
                .entry(ElementType::Container)
                .or_default()
                .push(path.clone());

            for tag in c.get_tags() {
                self.elements_by_tag
                    .entry(tag.clone())
                    .or_default()
                    .push(path.clone());
            }

            self.children_by_id
                .entry(c.system_id.clone())
                .or_default()
                .push(path);
        }

        // Index components
        for (idx, c) in self.components.iter().enumerate() {
            let path = c.get_full_path();
            if self.elements_by_id.contains_key(&path) {
                return Err(ModelError::DuplicateElement(path));
            }
            self.elements_by_id
                .insert(path.clone(), (ElementType::Component, idx));
            self.elements_by_type
                .entry(ElementType::Component)
                .or_default()
                .push(path.clone());

            for tag in c.get_tags() {
                self.elements_by_tag
                    .entry(tag.clone())
                    .or_default()
                    .push(path.clone());
            }

            let parent_path = format!("{}.{}", c.system_id, c.container_id);
            self.children_by_id
                .entry(parent_path)
                .or_default()
                .push(path);
        }

        // Index relationships
        for (idx, r) in self.relationships.iter().enumerate() {
            self.outgoing_rels
                .entry(r.from.clone())
                .or_default()
                .push(idx);
            self.incoming_rels
                .entry(r.to.clone())
                .or_default()
                .push(idx);
        }

        Ok(())
    }

    /// Returns an element by its full path using O(1) indexed lookup
    pub fn get_element(&self, path: &str) -> Option<&dyn Element> {
        let (element_type, idx) = self.elements_by_id.get(path)?;

        match element_type {
            ElementType::Person => self.persons.get(*idx).map(|p| p as &dyn Element),
            ElementType::System => self.systems.get(*idx).map(|s| s as &dyn Element),
            ElementType::Container => self.containers.get(*idx).map(|c| c as &dyn Element),
            ElementType::Component => self.components.get(*idx).map(|c| c as &dyn Element),
        }
    }

    /// Returns all elements of a given type
    pub fn get_elements_by_type(&self, t: ElementType) -> Vec<&dyn Element> {
        self.elements_by_type
            .get(&t)
            .map(|paths| {
                paths
                    .iter()
                    .filter_map(|path| self.get_element(path))
                    .collect()
            })
            .unwrap_or_default()
    }

    /// Returns all elements with a given tag
    pub fn get_elements_by_tag(&self, tag: &str) -> Vec<&dyn Element> {
        self.elements_by_tag
            .get(tag)
            .map(|paths| {
                paths
                    .iter()
                    .filter_map(|path| self.get_element(path))
                    .collect()
            })
            .unwrap_or_default()
    }

    /// Returns child elements of a given element
    pub fn get_children(&self, path: &str) -> Vec<&dyn Element> {
        self.children_by_id
            .get(path)
            .map(|paths| paths.iter().filter_map(|p| self.get_element(p)).collect())
            .unwrap_or_default()
    }

    /// Returns relationships from an element
    pub fn get_outgoing_relationships(&self, path: &str) -> Vec<&Relationship> {
        self.outgoing_rels
            .get(path)
            .map(|indices| {
                indices
                    .iter()
                    .filter_map(|&idx| self.relationships.get(idx))
                    .collect()
            })
            .unwrap_or_default()
    }

    /// Returns relationships to an element
    pub fn get_incoming_relationships(&self, path: &str) -> Vec<&Relationship> {
        self.incoming_rels
            .get(path)
            .map(|indices| {
                indices
                    .iter()
                    .filter_map(|&idx| self.relationships.get(idx))
                    .collect()
            })
            .unwrap_or_default()
    }

    /// Ensures all slices are non-nil for proper JSON encoding
    pub fn ensure_non_nil_slices(&mut self) {
        // Vecs in Rust are never nil, this is a no-op for compatibility
        // Included for API compatibility with Go version
    }

    /// Returns all elements in the model
    pub fn all_elements(&self) -> Vec<&dyn Element> {
        self.persons
            .iter()
            .map(|p| p as &dyn Element)
            .chain(self.systems.iter().map(|s| s as &dyn Element))
            .chain(self.containers.iter().map(|c| c as &dyn Element))
            .chain(self.components.iter().map(|c| c as &dyn Element))
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_person(id: &str) -> Person {
        Person {
            base: BaseElement {
                id: id.to_string(),
                name: format!("{} Name", id),
                description: Some(format!("{} Description", id)),
                tags: Some(vec!["tag1".to_string(), "tag2".to_string()]),
                properties: None,
            },
            element_type: ElementType::Person,
        }
    }

    fn create_test_system(id: &str) -> SoftwareSystem {
        SoftwareSystem {
            base: BaseElement {
                id: id.to_string(),
                name: format!("{} System", id),
                description: Some(format!("{} Description", id)),
                tags: Some(vec!["system".to_string()]),
                properties: None,
            },
            element_type: ElementType::System,
            external: None,
        }
    }

    fn create_test_container(system_id: &str, id: &str) -> Container {
        Container {
            base: BaseElement {
                id: id.to_string(),
                name: format!("{} Container", id),
                description: Some(format!("{} Description", id)),
                tags: Some(vec!["container".to_string()]),
                properties: None,
            },
            element_type: ElementType::Container,
            technology: Some(Technology::new(vec!["Rust".to_string()])),
            system_id: system_id.to_string(),
        }
    }

    fn create_test_component(system_id: &str, container_id: &str, id: &str) -> Component {
        Component {
            base: BaseElement {
                id: id.to_string(),
                name: format!("{} Component", id),
                description: Some(format!("{} Description", id)),
                tags: Some(vec!["component".to_string()]),
                properties: None,
            },
            element_type: ElementType::Component,
            technology: Some(Technology::new(vec!["Rust".to_string()])),
            system_id: system_id.to_string(),
            container_id: container_id.to_string(),
        }
    }

    #[test]
    fn test_new_model_creates_empty_model() {
        let model = Model::new();

        assert_eq!(model.persons.len(), 0);
        assert_eq!(model.systems.len(), 0);
        assert_eq!(model.containers.len(), 0);
        assert_eq!(model.components.len(), 0);
        assert_eq!(model.relationships.len(), 0);
        assert_eq!(model.flows.len(), 0);
        assert_eq!(model.deployments.len(), 0);
    }

    #[test]
    fn test_build_indexes_with_persons() {
        let mut model = Model::new();
        model.persons.push(create_test_person("user1"));
        model.persons.push(create_test_person("user2"));

        let result = model.build_indexes();
        assert!(result.is_ok());

        assert_eq!(model.elements_by_id.len(), 2);
        assert!(model.elements_by_id.contains_key("user1"));
        assert!(model.elements_by_id.contains_key("user2"));
    }

    #[test]
    fn test_build_indexes_with_systems() {
        let mut model = Model::new();
        model.systems.push(create_test_system("sys1"));
        model.systems.push(create_test_system("sys2"));

        let result = model.build_indexes();
        assert!(result.is_ok());

        assert_eq!(model.elements_by_id.len(), 2);
        assert!(model.elements_by_id.contains_key("sys1"));
        assert!(model.elements_by_id.contains_key("sys2"));
    }

    #[test]
    fn test_build_indexes_with_containers() {
        let mut model = Model::new();
        model.systems.push(create_test_system("sys1"));
        model.containers.push(create_test_container("sys1", "web"));
        model.containers.push(create_test_container("sys1", "api"));

        let result = model.build_indexes();
        assert!(result.is_ok());

        assert!(model.elements_by_id.contains_key("sys1.web"));
        assert!(model.elements_by_id.contains_key("sys1.api"));

        let children = model.children_by_id.get("sys1");
        assert!(children.is_some());
        assert_eq!(children.unwrap().len(), 2);
    }

    #[test]
    fn test_build_indexes_with_components() {
        let mut model = Model::new();
        model.systems.push(create_test_system("sys1"));
        model.containers.push(create_test_container("sys1", "web"));
        model
            .components
            .push(create_test_component("sys1", "web", "controller"));
        model
            .components
            .push(create_test_component("sys1", "web", "service"));

        let result = model.build_indexes();
        assert!(result.is_ok());

        assert!(model.elements_by_id.contains_key("sys1.web.controller"));
        assert!(model.elements_by_id.contains_key("sys1.web.service"));

        let children = model.children_by_id.get("sys1.web");
        assert!(children.is_some());
        assert_eq!(children.unwrap().len(), 2);
    }

    #[test]
    fn test_build_indexes_detects_duplicates() {
        let mut model = Model::new();
        model.persons.push(create_test_person("user1"));
        model.persons.push(create_test_person("user1"));

        let result = model.build_indexes();
        assert!(result.is_err());

        match result {
            Err(ModelError::DuplicateElement(path)) => {
                assert_eq!(path, "user1");
            }
            _ => panic!("Expected DuplicateElement error"),
        }
    }

    #[test]
    fn test_build_indexes_with_tags() {
        let mut model = Model::new();
        let mut person = create_test_person("user1");
        person.base.tags = Some(vec!["external".to_string(), "customer".to_string()]);
        model.persons.push(person);

        let result = model.build_indexes();
        assert!(result.is_ok());

        assert!(model.elements_by_tag.contains_key("external"));
        assert!(model.elements_by_tag.contains_key("customer"));

        let external_elements = model.elements_by_tag.get("external").unwrap();
        assert_eq!(external_elements.len(), 1);
        assert_eq!(external_elements[0], "user1");
    }

    #[test]
    fn test_build_indexes_with_relationships() {
        let mut model = Model::new();
        model.persons.push(create_test_person("user1"));
        model.systems.push(create_test_system("sys1"));

        let rel = Relationship {
            from: "user1".to_string(),
            to: "sys1".to_string(),
            description: Some("Uses".to_string()),
            technology: None,
            tags: None,
            properties: None,
        };
        model.relationships.push(rel);

        let result = model.build_indexes();
        assert!(result.is_ok());

        assert!(model.outgoing_rels.contains_key("user1"));
        assert!(model.incoming_rels.contains_key("sys1"));

        let outgoing = model.outgoing_rels.get("user1").unwrap();
        assert_eq!(outgoing.len(), 1);

        let incoming = model.incoming_rels.get("sys1").unwrap();
        assert_eq!(incoming.len(), 1);
    }

    #[test]
    fn test_get_element_returns_person() {
        let mut model = Model::new();
        model.persons.push(create_test_person("user1"));
        model.build_indexes().unwrap();

        let element = model.get_element("user1");
        assert!(element.is_some());

        let elem = element.unwrap();
        assert_eq!(elem.get_id(), "user1");
        assert_eq!(elem.get_type(), ElementType::Person);
    }

    #[test]
    fn test_get_element_returns_system() {
        let mut model = Model::new();
        model.systems.push(create_test_system("sys1"));
        model.build_indexes().unwrap();

        let element = model.get_element("sys1");
        assert!(element.is_some());

        let elem = element.unwrap();
        assert_eq!(elem.get_id(), "sys1");
        assert_eq!(elem.get_type(), ElementType::System);
    }

    #[test]
    fn test_get_element_returns_container() {
        let mut model = Model::new();
        model.systems.push(create_test_system("sys1"));
        model.containers.push(create_test_container("sys1", "web"));
        model.build_indexes().unwrap();

        let element = model.get_element("sys1.web");
        assert!(element.is_some());

        let elem = element.unwrap();
        assert_eq!(elem.get_id(), "web");
        assert_eq!(elem.get_type(), ElementType::Container);
    }

    #[test]
    fn test_get_element_returns_component() {
        let mut model = Model::new();
        model.systems.push(create_test_system("sys1"));
        model.containers.push(create_test_container("sys1", "web"));
        model
            .components
            .push(create_test_component("sys1", "web", "controller"));
        model.build_indexes().unwrap();

        let element = model.get_element("sys1.web.controller");
        assert!(element.is_some());

        let elem = element.unwrap();
        assert_eq!(elem.get_id(), "controller");
        assert_eq!(elem.get_type(), ElementType::Component);
    }

    #[test]
    fn test_get_element_returns_none_for_missing() {
        let model = Model::new();
        let element = model.get_element("nonexistent");
        assert!(element.is_none());
    }

    #[test]
    fn test_get_elements_by_type_persons() {
        let mut model = Model::new();
        model.persons.push(create_test_person("user1"));
        model.persons.push(create_test_person("user2"));
        model.systems.push(create_test_system("sys1"));
        model.build_indexes().unwrap();

        let elements = model.get_elements_by_type(ElementType::Person);
        assert_eq!(elements.len(), 2);
    }

    #[test]
    fn test_get_elements_by_type_systems() {
        let mut model = Model::new();
        model.systems.push(create_test_system("sys1"));
        model.systems.push(create_test_system("sys2"));
        model.persons.push(create_test_person("user1"));
        model.build_indexes().unwrap();

        let elements = model.get_elements_by_type(ElementType::System);
        assert_eq!(elements.len(), 2);
    }

    #[test]
    fn test_get_elements_by_type_empty() {
        let model = Model::new();
        let elements = model.get_elements_by_type(ElementType::Container);
        assert_eq!(elements.len(), 0);
    }

    #[test]
    fn test_get_elements_by_tag() {
        let mut model = Model::new();
        let mut person1 = create_test_person("user1");
        person1.base.tags = Some(vec!["external".to_string()]);
        model.persons.push(person1);

        let mut person2 = create_test_person("user2");
        person2.base.tags = Some(vec!["external".to_string()]);
        model.persons.push(person2);

        let mut system = create_test_system("sys1");
        system.base.tags = Some(vec!["internal".to_string()]);
        model.systems.push(system);

        model.build_indexes().unwrap();

        let external = model.get_elements_by_tag("external");
        assert_eq!(external.len(), 2);

        let internal = model.get_elements_by_tag("internal");
        assert_eq!(internal.len(), 1);
    }

    #[test]
    fn test_get_elements_by_tag_empty() {
        let model = Model::new();
        let elements = model.get_elements_by_tag("nonexistent");
        assert_eq!(elements.len(), 0);
    }

    #[test]
    fn test_get_children_of_system() {
        let mut model = Model::new();
        model.systems.push(create_test_system("sys1"));
        model.containers.push(create_test_container("sys1", "web"));
        model.containers.push(create_test_container("sys1", "api"));
        model.build_indexes().unwrap();

        let children = model.get_children("sys1");
        assert_eq!(children.len(), 2);
    }

    #[test]
    fn test_get_children_of_container() {
        let mut model = Model::new();
        model.systems.push(create_test_system("sys1"));
        model.containers.push(create_test_container("sys1", "web"));
        model
            .components
            .push(create_test_component("sys1", "web", "controller"));
        model
            .components
            .push(create_test_component("sys1", "web", "service"));
        model.build_indexes().unwrap();

        let children = model.get_children("sys1.web");
        assert_eq!(children.len(), 2);
    }

    #[test]
    fn test_get_children_empty() {
        let mut model = Model::new();
        model.systems.push(create_test_system("sys1"));
        model.build_indexes().unwrap();

        let children = model.get_children("sys1");
        assert_eq!(children.len(), 0);
    }

    #[test]
    fn test_get_outgoing_relationships() {
        let mut model = Model::new();
        model.persons.push(create_test_person("user1"));
        model.systems.push(create_test_system("sys1"));
        model.systems.push(create_test_system("sys2"));

        let rel1 = Relationship {
            from: "user1".to_string(),
            to: "sys1".to_string(),
            description: Some("Uses sys1".to_string()),
            technology: None,
            tags: None,
            properties: None,
        };
        let rel2 = Relationship {
            from: "user1".to_string(),
            to: "sys2".to_string(),
            description: Some("Uses sys2".to_string()),
            technology: None,
            tags: None,
            properties: None,
        };
        model.relationships.push(rel1);
        model.relationships.push(rel2);

        model.build_indexes().unwrap();

        let rels = model.get_outgoing_relationships("user1");
        assert_eq!(rels.len(), 2);
    }

    #[test]
    fn test_get_incoming_relationships() {
        let mut model = Model::new();
        model.persons.push(create_test_person("user1"));
        model.persons.push(create_test_person("user2"));
        model.systems.push(create_test_system("sys1"));

        let rel1 = Relationship {
            from: "user1".to_string(),
            to: "sys1".to_string(),
            description: Some("Uses".to_string()),
            technology: None,
            tags: None,
            properties: None,
        };
        let rel2 = Relationship {
            from: "user2".to_string(),
            to: "sys1".to_string(),
            description: Some("Uses".to_string()),
            technology: None,
            tags: None,
            properties: None,
        };
        model.relationships.push(rel1);
        model.relationships.push(rel2);

        model.build_indexes().unwrap();

        let rels = model.get_incoming_relationships("sys1");
        assert_eq!(rels.len(), 2);
    }

    #[test]
    fn test_get_relationships_empty() {
        let mut model = Model::new();
        model.persons.push(create_test_person("user1"));
        model.build_indexes().unwrap();

        let outgoing = model.get_outgoing_relationships("user1");
        assert_eq!(outgoing.len(), 0);

        let incoming = model.get_incoming_relationships("user1");
        assert_eq!(incoming.len(), 0);
    }

    #[test]
    fn test_all_elements() {
        let mut model = Model::new();
        model.persons.push(create_test_person("user1"));
        model.systems.push(create_test_system("sys1"));
        model.containers.push(create_test_container("sys1", "web"));
        model
            .components
            .push(create_test_component("sys1", "web", "controller"));
        model.build_indexes().unwrap();

        let all = model.all_elements();
        assert_eq!(all.len(), 4);
    }

    #[test]
    fn test_all_elements_empty() {
        let model = Model::new();
        let all = model.all_elements();
        assert_eq!(all.len(), 0);
    }

    #[test]
    fn test_element_full_paths() {
        let person = create_test_person("user1");
        assert_eq!(person.get_full_path(), "user1");

        let system = create_test_system("sys1");
        assert_eq!(system.get_full_path(), "sys1");

        let container = create_test_container("sys1", "web");
        assert_eq!(container.get_full_path(), "sys1.web");

        let component = create_test_component("sys1", "web", "controller");
        assert_eq!(component.get_full_path(), "sys1.web.controller");
    }

    #[test]
    fn test_ensure_non_nil_slices() {
        let mut model = Model::new();
        model.ensure_non_nil_slices();

        // In Rust, Vecs are never nil, so this is a no-op
        // Just verify the model is still valid
        assert_eq!(model.persons.len(), 0);
        assert_eq!(model.systems.len(), 0);
    }

    #[test]
    fn test_multiple_tags_indexing() {
        let mut model = Model::new();
        let mut person = create_test_person("user1");
        person.base.tags = Some(vec![
            "tag1".to_string(),
            "tag2".to_string(),
            "tag3".to_string(),
        ]);
        model.persons.push(person);
        model.build_indexes().unwrap();

        assert_eq!(model.get_elements_by_tag("tag1").len(), 1);
        assert_eq!(model.get_elements_by_tag("tag2").len(), 1);
        assert_eq!(model.get_elements_by_tag("tag3").len(), 1);
    }

    #[test]
    fn test_complex_hierarchy() {
        let mut model = Model::new();

        // Create a complex hierarchy
        model.systems.push(create_test_system("sys1"));
        model.containers.push(create_test_container("sys1", "web"));
        model.containers.push(create_test_container("sys1", "api"));
        model
            .components
            .push(create_test_component("sys1", "web", "controller"));
        model
            .components
            .push(create_test_component("sys1", "web", "view"));
        model
            .components
            .push(create_test_component("sys1", "api", "handler"));

        model.build_indexes().unwrap();

        // Verify system has 2 containers
        let sys_children = model.get_children("sys1");
        assert_eq!(sys_children.len(), 2);

        // Verify web container has 2 components
        let web_children = model.get_children("sys1.web");
        assert_eq!(web_children.len(), 2);

        // Verify api container has 1 component
        let api_children = model.get_children("sys1.api");
        assert_eq!(api_children.len(), 1);
    }

    #[test]
    fn test_rebuild_indexes() {
        let mut model = Model::new();
        model.persons.push(create_test_person("user1"));
        model.build_indexes().unwrap();

        assert_eq!(model.elements_by_id.len(), 1);

        // Add more elements and rebuild
        model.persons.push(create_test_person("user2"));
        model.systems.push(create_test_system("sys1"));
        model.build_indexes().unwrap();

        assert_eq!(model.elements_by_id.len(), 3);
        assert!(model.get_element("user1").is_some());
        assert!(model.get_element("user2").is_some());
        assert!(model.get_element("sys1").is_some());
    }

    #[test]
    fn test_model_error_display() {
        let err = ModelError::DuplicateElement("sys1.web".to_string());
        let msg = format!("{}", err);
        assert_eq!(msg, "duplicate element ID: sys1.web");
    }

    #[test]
    fn test_build_indexes_detects_duplicate_systems() {
        let mut model = Model::new();
        model.systems.push(create_test_system("sys1"));
        model.systems.push(create_test_system("sys1"));

        let result = model.build_indexes();
        assert!(result.is_err());
        match result {
            Err(ModelError::DuplicateElement(path)) => {
                assert_eq!(path, "sys1");
            }
            _ => panic!("Expected DuplicateElement error"),
        }
    }

    #[test]
    fn test_build_indexes_detects_duplicate_containers() {
        let mut model = Model::new();
        model.systems.push(create_test_system("sys1"));
        model.containers.push(create_test_container("sys1", "web"));
        model.containers.push(create_test_container("sys1", "web"));

        let result = model.build_indexes();
        assert!(result.is_err());
        match result {
            Err(ModelError::DuplicateElement(path)) => {
                assert_eq!(path, "sys1.web");
            }
            _ => panic!("Expected DuplicateElement error"),
        }
    }

    #[test]
    fn test_build_indexes_detects_duplicate_components() {
        let mut model = Model::new();
        model.systems.push(create_test_system("sys1"));
        model.containers.push(create_test_container("sys1", "web"));
        model
            .components
            .push(create_test_component("sys1", "web", "ctrl"));
        model
            .components
            .push(create_test_component("sys1", "web", "ctrl"));

        let result = model.build_indexes();
        assert!(result.is_err());
        match result {
            Err(ModelError::DuplicateElement(path)) => {
                assert_eq!(path, "sys1.web.ctrl");
            }
            _ => panic!("Expected DuplicateElement error"),
        }
    }

    #[test]
    fn test_get_element_invalid_path_depth() {
        let mut model = Model::new();
        model.systems.push(create_test_system("sys1"));
        model.build_indexes().unwrap();

        // Path with 4+ segments doesn't match any element type
        let element = model.get_element("a.b.c.d");
        assert!(element.is_none());
    }
}
