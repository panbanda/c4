use serde::{Deserialize, Deserializer, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ElementType {
    Person,
    System,
    Container,
    Component,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Technology(Vec<String>);

impl Technology {
    pub fn new(values: Vec<String>) -> Self {
        Technology(values)
    }

    pub fn as_slice(&self) -> &[String] {
        &self.0
    }

    pub fn is_empty(&self) -> bool {
        self.0.is_empty()
    }
}

impl<'de> Deserialize<'de> for Technology {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        #[derive(Deserialize)]
        #[serde(untagged)]
        enum TechnologyHelper {
            String(String),
            Array(Vec<String>),
        }

        match TechnologyHelper::deserialize(deserializer)? {
            TechnologyHelper::String(s) => {
                if s.is_empty() {
                    Ok(Technology(vec![]))
                } else {
                    let parts: Vec<String> = s
                        .split(',')
                        .map(|p| p.trim().to_string())
                        .filter(|p| !p.is_empty())
                        .collect();
                    Ok(Technology(parts))
                }
            }
            TechnologyHelper::Array(arr) => Ok(Technology(arr)),
        }
    }
}

pub trait Element {
    fn get_id(&self) -> &str;
    fn get_name(&self) -> &str;
    fn get_description(&self) -> &str;
    fn get_tags(&self) -> &[String];
    fn get_properties(&self) -> &HashMap<String, serde_json::Value>;
    fn get_type(&self) -> ElementType;
    fn get_full_path(&self) -> String;
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BaseElement {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tags: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub properties: Option<HashMap<String, serde_json::Value>>,
}

impl BaseElement {
    pub fn get_id(&self) -> &str {
        &self.id
    }

    pub fn get_name(&self) -> &str {
        &self.name
    }

    pub fn get_description(&self) -> &str {
        self.description.as_deref().unwrap_or("")
    }

    pub fn get_tags(&self) -> &[String] {
        self.tags.as_deref().unwrap_or(&[])
    }

    pub fn get_properties(&self) -> &HashMap<String, serde_json::Value> {
        static EMPTY_MAP: once_cell::sync::Lazy<HashMap<String, serde_json::Value>> =
            once_cell::sync::Lazy::new(HashMap::new);
        self.properties.as_ref().unwrap_or(&EMPTY_MAP)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Person {
    #[serde(flatten)]
    pub base: BaseElement,
    #[serde(rename = "type", default = "default_person_type")]
    pub element_type: ElementType,
}

fn default_person_type() -> ElementType {
    ElementType::Person
}

impl Element for Person {
    fn get_id(&self) -> &str {
        self.base.get_id()
    }

    fn get_name(&self) -> &str {
        self.base.get_name()
    }

    fn get_description(&self) -> &str {
        self.base.get_description()
    }

    fn get_tags(&self) -> &[String] {
        self.base.get_tags()
    }

    fn get_properties(&self) -> &HashMap<String, serde_json::Value> {
        self.base.get_properties()
    }

    fn get_type(&self) -> ElementType {
        ElementType::Person
    }

    fn get_full_path(&self) -> String {
        self.base.id.clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SoftwareSystem {
    #[serde(flatten)]
    pub base: BaseElement,
    #[serde(rename = "type", default = "default_system_type")]
    pub element_type: ElementType,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub external: Option<bool>,
}

fn default_system_type() -> ElementType {
    ElementType::System
}

impl Element for SoftwareSystem {
    fn get_id(&self) -> &str {
        self.base.get_id()
    }

    fn get_name(&self) -> &str {
        self.base.get_name()
    }

    fn get_description(&self) -> &str {
        self.base.get_description()
    }

    fn get_tags(&self) -> &[String] {
        self.base.get_tags()
    }

    fn get_properties(&self) -> &HashMap<String, serde_json::Value> {
        self.base.get_properties()
    }

    fn get_type(&self) -> ElementType {
        ElementType::System
    }

    fn get_full_path(&self) -> String {
        self.base.id.clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Container {
    #[serde(flatten)]
    pub base: BaseElement,
    #[serde(rename = "type", default = "default_container_type")]
    pub element_type: ElementType,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub technology: Option<Technology>,
    #[serde(rename = "systemId", default)]
    pub system_id: String,
}

fn default_container_type() -> ElementType {
    ElementType::Container
}

impl Element for Container {
    fn get_id(&self) -> &str {
        self.base.get_id()
    }

    fn get_name(&self) -> &str {
        self.base.get_name()
    }

    fn get_description(&self) -> &str {
        self.base.get_description()
    }

    fn get_tags(&self) -> &[String] {
        self.base.get_tags()
    }

    fn get_properties(&self) -> &HashMap<String, serde_json::Value> {
        self.base.get_properties()
    }

    fn get_type(&self) -> ElementType {
        ElementType::Container
    }

    fn get_full_path(&self) -> String {
        format!("{}.{}", self.system_id, self.base.id)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Component {
    #[serde(flatten)]
    pub base: BaseElement,
    #[serde(rename = "type", default = "default_component_type")]
    pub element_type: ElementType,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub technology: Option<Technology>,
    #[serde(rename = "systemId", default)]
    pub system_id: String,
    #[serde(rename = "containerId", default)]
    pub container_id: String,
}

fn default_component_type() -> ElementType {
    ElementType::Component
}

impl Element for Component {
    fn get_id(&self) -> &str {
        self.base.get_id()
    }

    fn get_name(&self) -> &str {
        self.base.get_name()
    }

    fn get_description(&self) -> &str {
        self.base.get_description()
    }

    fn get_tags(&self) -> &[String] {
        self.base.get_tags()
    }

    fn get_properties(&self) -> &HashMap<String, serde_json::Value> {
        self.base.get_properties()
    }

    fn get_type(&self) -> ElementType {
        ElementType::Component
    }

    fn get_full_path(&self) -> String {
        format!("{}.{}.{}", self.system_id, self.container_id, self.base.id)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Relationship {
    pub from: String,
    pub to: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub technology: Option<Technology>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tags: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub properties: Option<HashMap<String, serde_json::Value>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlowStep {
    pub seq: i32,
    pub from: String,
    pub to: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub technology: Option<Technology>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Flow {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub steps: Vec<FlowStep>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContainerInstance {
    pub container: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub replicas: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub properties: Option<HashMap<String, serde_json::Value>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeploymentNode {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub technology: Option<Technology>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub children: Option<Vec<DeploymentNode>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub instances: Option<Vec<ContainerInstance>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub properties: Option<HashMap<String, serde_json::Value>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Deployment {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub nodes: Option<Vec<DeploymentNode>>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Options {
    #[serde(default)]
    pub show_minimap: bool,
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_element_type_serialization() {
        assert_eq!(
            serde_json::to_string(&ElementType::Person).unwrap(),
            "\"person\""
        );
        assert_eq!(
            serde_json::to_string(&ElementType::System).unwrap(),
            "\"system\""
        );
        assert_eq!(
            serde_json::to_string(&ElementType::Container).unwrap(),
            "\"container\""
        );
        assert_eq!(
            serde_json::to_string(&ElementType::Component).unwrap(),
            "\"component\""
        );
    }

    #[test]
    fn test_element_type_deserialization() {
        assert_eq!(
            serde_json::from_str::<ElementType>("\"person\"").unwrap(),
            ElementType::Person
        );
        assert_eq!(
            serde_json::from_str::<ElementType>("\"system\"").unwrap(),
            ElementType::System
        );
        assert_eq!(
            serde_json::from_str::<ElementType>("\"container\"").unwrap(),
            ElementType::Container
        );
        assert_eq!(
            serde_json::from_str::<ElementType>("\"component\"").unwrap(),
            ElementType::Component
        );
    }

    #[test]
    fn test_technology_from_string() {
        let json = "\"Go, gRPC\"";
        let tech: Technology = serde_json::from_str(json).unwrap();
        assert_eq!(tech.as_slice(), &["Go", "gRPC"]);
    }

    #[test]
    fn test_technology_from_string_with_spaces() {
        let json = "\"  Go  ,  gRPC  ,  REST  \"";
        let tech: Technology = serde_json::from_str(json).unwrap();
        assert_eq!(tech.as_slice(), &["Go", "gRPC", "REST"]);
    }

    #[test]
    fn test_technology_from_array() {
        let json = "[\"Go\", \"gRPC\"]";
        let tech: Technology = serde_json::from_str(json).unwrap();
        assert_eq!(tech.as_slice(), &["Go", "gRPC"]);
    }

    #[test]
    fn test_technology_from_empty_string() {
        let json = "\"\"";
        let tech: Technology = serde_json::from_str(json).unwrap();
        assert!(tech.is_empty());
    }

    #[test]
    fn test_technology_serialization() {
        let tech = Technology::new(vec!["Go".to_string(), "gRPC".to_string()]);
        let json = serde_json::to_string(&tech).unwrap();
        assert_eq!(json, "[\"Go\",\"gRPC\"]");
    }

    #[test]
    fn test_base_element_minimal() {
        let json = r#"{"id":"user1","name":"User"}"#;
        let base: BaseElement = serde_json::from_str(json).unwrap();
        assert_eq!(base.id, "user1");
        assert_eq!(base.name, "User");
        assert!(base.description.is_none());
        assert!(base.tags.is_none());
        assert!(base.properties.is_none());
    }

    #[test]
    fn test_base_element_full() {
        let json = r#"{
            "id":"user1",
            "name":"User",
            "description":"A user",
            "tags":["external"],
            "properties":{"color":"blue"}
        }"#;
        let base: BaseElement = serde_json::from_str(json).unwrap();
        assert_eq!(base.id, "user1");
        assert_eq!(base.name, "User");
        assert_eq!(base.description.as_deref(), Some("A user"));
        assert_eq!(
            base.tags.as_deref(),
            Some(&vec!["external".to_string()][..])
        );
        assert_eq!(
            base.properties.as_ref().unwrap().get("color").unwrap(),
            "blue"
        );
    }

    #[test]
    fn test_base_element_methods() {
        let base = BaseElement {
            id: "test".to_string(),
            name: "Test".to_string(),
            description: Some("Description".to_string()),
            tags: Some(vec!["tag1".to_string()]),
            properties: None,
        };

        assert_eq!(base.get_id(), "test");
        assert_eq!(base.get_name(), "Test");
        assert_eq!(base.get_description(), "Description");
        assert_eq!(base.get_tags(), &["tag1"]);
        assert!(base.get_properties().is_empty());
    }

    #[test]
    fn test_base_element_methods_empty() {
        let base = BaseElement {
            id: "test".to_string(),
            name: "Test".to_string(),
            description: None,
            tags: None,
            properties: None,
        };

        assert_eq!(base.get_description(), "");
        assert!(base.get_tags().is_empty());
        assert!(base.get_properties().is_empty());
    }

    #[test]
    fn test_person_serialization() {
        let person = Person {
            base: BaseElement {
                id: "user1".to_string(),
                name: "John Doe".to_string(),
                description: Some("A user".to_string()),
                tags: None,
                properties: None,
            },
            element_type: ElementType::Person,
        };

        let json = serde_json::to_value(&person).unwrap();
        assert_eq!(json["id"], "user1");
        assert_eq!(json["name"], "John Doe");
        assert_eq!(json["type"], "person");
    }

    #[test]
    fn test_person_element_trait() {
        let person = Person {
            base: BaseElement {
                id: "user1".to_string(),
                name: "John Doe".to_string(),
                description: None,
                tags: None,
                properties: None,
            },
            element_type: ElementType::Person,
        };

        assert_eq!(person.get_id(), "user1");
        assert_eq!(person.get_name(), "John Doe");
        assert_eq!(person.get_type(), ElementType::Person);
        assert_eq!(person.get_full_path(), "user1");
    }

    #[test]
    fn test_software_system_serialization() {
        let system = SoftwareSystem {
            base: BaseElement {
                id: "sys1".to_string(),
                name: "System".to_string(),
                description: None,
                tags: None,
                properties: None,
            },
            element_type: ElementType::System,
            external: Some(true),
        };

        let json = serde_json::to_value(&system).unwrap();
        assert_eq!(json["id"], "sys1");
        assert_eq!(json["type"], "system");
        assert_eq!(json["external"], true);
    }

    #[test]
    fn test_software_system_skip_external_false() {
        let system = SoftwareSystem {
            base: BaseElement {
                id: "sys1".to_string(),
                name: "System".to_string(),
                description: None,
                tags: None,
                properties: None,
            },
            element_type: ElementType::System,
            external: None,
        };

        let json = serde_json::to_string(&system).unwrap();
        assert!(!json.contains("external"));
    }

    #[test]
    fn test_software_system_element_trait() {
        let system = SoftwareSystem {
            base: BaseElement {
                id: "sys1".to_string(),
                name: "System".to_string(),
                description: None,
                tags: None,
                properties: None,
            },
            element_type: ElementType::System,
            external: Some(true),
        };

        assert_eq!(system.get_type(), ElementType::System);
        assert_eq!(system.get_full_path(), "sys1");
    }

    #[test]
    fn test_container_serialization() {
        let container = Container {
            base: BaseElement {
                id: "api".to_string(),
                name: "API".to_string(),
                description: None,
                tags: None,
                properties: None,
            },
            element_type: ElementType::Container,
            technology: Some(Technology::new(vec!["Go".to_string()])),
            system_id: "sys1".to_string(),
        };

        let json = serde_json::to_value(&container).unwrap();
        assert_eq!(json["id"], "api");
        assert_eq!(json["systemId"], "sys1");
        assert_eq!(json["technology"], json!(["Go"]));
    }

    #[test]
    fn test_container_full_path() {
        let container = Container {
            base: BaseElement {
                id: "api".to_string(),
                name: "API".to_string(),
                description: None,
                tags: None,
                properties: None,
            },
            element_type: ElementType::Container,
            technology: None,
            system_id: "sys1".to_string(),
        };

        assert_eq!(container.get_full_path(), "sys1.api");
    }

    #[test]
    fn test_component_serialization() {
        let component = Component {
            base: BaseElement {
                id: "handler".to_string(),
                name: "Handler".to_string(),
                description: None,
                tags: None,
                properties: None,
            },
            element_type: ElementType::Component,
            technology: Some(Technology::new(vec!["Go".to_string(), "gRPC".to_string()])),
            system_id: "sys1".to_string(),
            container_id: "api".to_string(),
        };

        let json = serde_json::to_value(&component).unwrap();
        assert_eq!(json["id"], "handler");
        assert_eq!(json["systemId"], "sys1");
        assert_eq!(json["containerId"], "api");
        assert_eq!(json["technology"], json!(["Go", "gRPC"]));
    }

    #[test]
    fn test_component_full_path() {
        let component = Component {
            base: BaseElement {
                id: "handler".to_string(),
                name: "Handler".to_string(),
                description: None,
                tags: None,
                properties: None,
            },
            element_type: ElementType::Component,
            technology: None,
            system_id: "sys1".to_string(),
            container_id: "api".to_string(),
        };

        assert_eq!(component.get_full_path(), "sys1.api.handler");
    }

    #[test]
    fn test_relationship_minimal() {
        let json = r#"{"from":"user1","to":"sys1"}"#;
        let rel: Relationship = serde_json::from_str(json).unwrap();
        assert_eq!(rel.from, "user1");
        assert_eq!(rel.to, "sys1");
        assert!(rel.description.is_none());
        assert!(rel.technology.is_none());
    }

    #[test]
    fn test_relationship_full() {
        let rel = Relationship {
            from: "user1".to_string(),
            to: "sys1".to_string(),
            description: Some("Uses".to_string()),
            technology: Some(Technology::new(vec!["HTTPS".to_string()])),
            tags: Some(vec!["external".to_string()]),
            properties: Some(HashMap::new()),
        };

        let json = serde_json::to_value(&rel).unwrap();
        assert_eq!(json["from"], "user1");
        assert_eq!(json["to"], "sys1");
        assert_eq!(json["description"], "Uses");
        assert_eq!(json["technology"], json!(["HTTPS"]));
    }

    #[test]
    fn test_flow_step_serialization() {
        let step = FlowStep {
            seq: 1,
            from: "user1".to_string(),
            to: "sys1".to_string(),
            description: Some("Login".to_string()),
            technology: Some(Technology::new(vec!["HTTPS".to_string()])),
        };

        let json = serde_json::to_value(&step).unwrap();
        assert_eq!(json["seq"], 1);
        assert_eq!(json["from"], "user1");
        assert_eq!(json["to"], "sys1");
        assert_eq!(json["description"], "Login");
    }

    #[test]
    fn test_flow_serialization() {
        let flow = Flow {
            id: "flow1".to_string(),
            name: "Login Flow".to_string(),
            description: Some("User login".to_string()),
            steps: vec![FlowStep {
                seq: 1,
                from: "user1".to_string(),
                to: "sys1".to_string(),
                description: None,
                technology: None,
            }],
            tags: Some(vec!["auth".to_string()]),
        };

        let json = serde_json::to_value(&flow).unwrap();
        assert_eq!(json["id"], "flow1");
        assert_eq!(json["name"], "Login Flow");
        assert_eq!(json["steps"].as_array().unwrap().len(), 1);
    }

    #[test]
    fn test_container_instance_serialization() {
        let instance = ContainerInstance {
            container: "api".to_string(),
            replicas: Some(3),
            properties: Some(HashMap::new()),
        };

        let json = serde_json::to_value(&instance).unwrap();
        assert_eq!(json["container"], "api");
        assert_eq!(json["replicas"], 3);
    }

    #[test]
    fn test_container_instance_skip_replicas() {
        let instance = ContainerInstance {
            container: "api".to_string(),
            replicas: None,
            properties: None,
        };

        let json = serde_json::to_string(&instance).unwrap();
        assert!(!json.contains("replicas"));
    }

    #[test]
    fn test_deployment_node_minimal() {
        let node = DeploymentNode {
            id: "node1".to_string(),
            name: "Node 1".to_string(),
            technology: None,
            children: None,
            instances: None,
            properties: None,
        };

        let json = serde_json::to_value(&node).unwrap();
        assert_eq!(json["id"], "node1");
        assert_eq!(json["name"], "Node 1");
        assert!(json.get("children").is_none());
    }

    #[test]
    fn test_deployment_node_with_children() {
        let node = DeploymentNode {
            id: "node1".to_string(),
            name: "Node 1".to_string(),
            technology: Some(Technology::new(vec!["AWS".to_string()])),
            children: Some(vec![DeploymentNode {
                id: "child1".to_string(),
                name: "Child 1".to_string(),
                technology: None,
                children: None,
                instances: None,
                properties: None,
            }]),
            instances: None,
            properties: None,
        };

        let json = serde_json::to_value(&node).unwrap();
        assert_eq!(json["children"].as_array().unwrap().len(), 1);
    }

    #[test]
    fn test_deployment_node_with_instances() {
        let node = DeploymentNode {
            id: "node1".to_string(),
            name: "Node 1".to_string(),
            technology: None,
            children: None,
            instances: Some(vec![ContainerInstance {
                container: "api".to_string(),
                replicas: Some(2),
                properties: None,
            }]),
            properties: None,
        };

        let json = serde_json::to_value(&node).unwrap();
        assert_eq!(json["instances"].as_array().unwrap().len(), 1);
    }

    #[test]
    fn test_deployment_serialization() {
        let deployment = Deployment {
            id: "prod".to_string(),
            name: "Production".to_string(),
            description: Some("Production environment".to_string()),
            nodes: Some(vec![DeploymentNode {
                id: "node1".to_string(),
                name: "Node 1".to_string(),
                technology: None,
                children: None,
                instances: None,
                properties: None,
            }]),
        };

        let json = serde_json::to_value(&deployment).unwrap();
        assert_eq!(json["id"], "prod");
        assert_eq!(json["name"], "Production");
        assert_eq!(json["nodes"].as_array().unwrap().len(), 1);
    }

    #[test]
    fn test_options_serialization() {
        let options = Options { show_minimap: true };

        let json = serde_json::to_value(&options).unwrap();
        assert_eq!(json["showMinimap"], true);
    }

    #[test]
    fn test_options_camel_case() {
        let json = r#"{"showMinimap":true}"#;
        let options: Options = serde_json::from_str(json).unwrap();
        assert!(options.show_minimap);
    }

    #[test]
    fn test_skip_serializing_if_none() {
        let person = Person {
            base: BaseElement {
                id: "user1".to_string(),
                name: "User".to_string(),
                description: None,
                tags: None,
                properties: None,
            },
            element_type: ElementType::Person,
        };

        let json = serde_json::to_string(&person).unwrap();
        assert!(!json.contains("description"));
        assert!(!json.contains("tags"));
        assert!(!json.contains("properties"));
    }

    #[test]
    fn test_technology_round_trip_string() {
        let original = "\"Go, gRPC, REST\"";
        let tech: Technology = serde_json::from_str(original).unwrap();
        let serialized = serde_json::to_string(&tech).unwrap();
        let deserialized: Technology = serde_json::from_str(&serialized).unwrap();
        assert_eq!(tech.as_slice(), deserialized.as_slice());
    }

    #[test]
    fn test_technology_round_trip_array() {
        let original = "[\"Go\",\"gRPC\"]";
        let tech: Technology = serde_json::from_str(original).unwrap();
        let serialized = serde_json::to_string(&tech).unwrap();
        let deserialized: Technology = serde_json::from_str(&serialized).unwrap();
        assert_eq!(tech.as_slice(), deserialized.as_slice());
    }

    #[test]
    fn test_person_deserialization() {
        let json = r#"{
            "id":"user1",
            "name":"John Doe",
            "description":"A user",
            "type":"person"
        }"#;
        let person: Person = serde_json::from_str(json).unwrap();
        assert_eq!(person.base.id, "user1");
        assert_eq!(person.element_type, ElementType::Person);
    }

    #[test]
    fn test_container_deserialization_with_string_technology() {
        let json = r#"{
            "id":"api",
            "name":"API",
            "type":"container",
            "technology":"Go, gRPC",
            "systemId":"sys1"
        }"#;
        let container: Container = serde_json::from_str(json).unwrap();
        assert_eq!(
            container.technology.as_ref().unwrap().as_slice(),
            &["Go", "gRPC"]
        );
    }

    #[test]
    fn test_component_deserialization_with_array_technology() {
        let json = r#"{
            "id":"handler",
            "name":"Handler",
            "type":"component",
            "technology":["Go","gRPC"],
            "systemId":"sys1",
            "containerId":"api"
        }"#;
        let component: Component = serde_json::from_str(json).unwrap();
        assert_eq!(
            component.technology.as_ref().unwrap().as_slice(),
            &["Go", "gRPC"]
        );
    }

    #[test]
    fn test_relationship_deserialization() {
        let json = r#"{
            "from":"user1",
            "to":"sys1",
            "description":"Uses",
            "technology":"HTTPS"
        }"#;
        let rel: Relationship = serde_json::from_str(json).unwrap();
        assert_eq!(rel.from, "user1");
        assert_eq!(rel.to, "sys1");
        assert_eq!(rel.description.as_deref(), Some("Uses"));
    }

    #[test]
    fn test_deployment_node_recursive() {
        let node = DeploymentNode {
            id: "root".to_string(),
            name: "Root".to_string(),
            technology: None,
            children: Some(vec![DeploymentNode {
                id: "child".to_string(),
                name: "Child".to_string(),
                technology: None,
                children: Some(vec![DeploymentNode {
                    id: "grandchild".to_string(),
                    name: "Grandchild".to_string(),
                    technology: None,
                    children: None,
                    instances: None,
                    properties: None,
                }]),
                instances: None,
                properties: None,
            }]),
            instances: None,
            properties: None,
        };

        let json = serde_json::to_value(&node).unwrap();
        assert_eq!(json["children"][0]["children"][0]["id"], "grandchild");
    }

    #[test]
    fn test_empty_collections_serialization() {
        let flow = Flow {
            id: "flow1".to_string(),
            name: "Flow".to_string(),
            description: None,
            steps: vec![],
            tags: None,
        };

        let json = serde_json::to_value(&flow).unwrap();
        assert_eq!(json["steps"].as_array().unwrap().len(), 0);
    }

    #[test]
    fn test_properties_with_various_types() {
        let mut props = HashMap::new();
        props.insert("string".to_string(), json!("value"));
        props.insert("number".to_string(), json!(42));
        props.insert("bool".to_string(), json!(true));
        props.insert("array".to_string(), json!([1, 2, 3]));
        props.insert("object".to_string(), json!({"key": "value"}));

        let base = BaseElement {
            id: "test".to_string(),
            name: "Test".to_string(),
            description: None,
            tags: None,
            properties: Some(props),
        };

        let json = serde_json::to_value(&base).unwrap();
        assert_eq!(json["properties"]["string"], "value");
        assert_eq!(json["properties"]["number"], 42);
        assert_eq!(json["properties"]["bool"], true);
    }

    #[test]
    fn test_person_element_trait_all_methods() {
        let mut props = HashMap::new();
        props.insert("key".to_string(), json!("value"));

        let person = Person {
            base: BaseElement {
                id: "user1".to_string(),
                name: "John Doe".to_string(),
                description: Some("A user".to_string()),
                tags: Some(vec!["external".to_string()]),
                properties: Some(props),
            },
            element_type: ElementType::Person,
        };

        assert_eq!(person.get_id(), "user1");
        assert_eq!(person.get_name(), "John Doe");
        assert_eq!(person.get_description(), "A user");
        assert_eq!(person.get_tags(), &["external"]);
        assert_eq!(person.get_properties().get("key").unwrap(), "value");
        assert_eq!(person.get_type(), ElementType::Person);
        assert_eq!(person.get_full_path(), "user1");
    }

    #[test]
    fn test_software_system_element_trait_all_methods() {
        let mut props = HashMap::new();
        props.insert("env".to_string(), json!("prod"));

        let system = SoftwareSystem {
            base: BaseElement {
                id: "api".to_string(),
                name: "API".to_string(),
                description: Some("The API".to_string()),
                tags: Some(vec!["internal".to_string()]),
                properties: Some(props),
            },
            element_type: ElementType::System,
            external: Some(false),
        };

        assert_eq!(system.get_id(), "api");
        assert_eq!(system.get_name(), "API");
        assert_eq!(system.get_description(), "The API");
        assert_eq!(system.get_tags(), &["internal"]);
        assert_eq!(system.get_properties().get("env").unwrap(), "prod");
        assert_eq!(system.get_type(), ElementType::System);
        assert_eq!(system.get_full_path(), "api");
    }

    #[test]
    fn test_container_element_trait_all_methods() {
        let mut props = HashMap::new();
        props.insert("port".to_string(), json!(8080));

        let container = Container {
            base: BaseElement {
                id: "web".to_string(),
                name: "Web Server".to_string(),
                description: Some("Serves web requests".to_string()),
                tags: Some(vec!["frontend".to_string()]),
                properties: Some(props),
            },
            element_type: ElementType::Container,
            technology: Some(Technology::new(vec!["Go".to_string()])),
            system_id: "api".to_string(),
        };

        assert_eq!(container.get_id(), "web");
        assert_eq!(container.get_name(), "Web Server");
        assert_eq!(container.get_description(), "Serves web requests");
        assert_eq!(container.get_tags(), &["frontend"]);
        assert_eq!(container.get_properties().get("port").unwrap(), 8080);
        assert_eq!(container.get_type(), ElementType::Container);
        assert_eq!(container.get_full_path(), "api.web");
    }

    #[test]
    fn test_component_element_trait_all_methods() {
        let mut props = HashMap::new();
        props.insert("version".to_string(), json!("1.0"));

        let component = Component {
            base: BaseElement {
                id: "handler".to_string(),
                name: "Request Handler".to_string(),
                description: Some("Handles requests".to_string()),
                tags: Some(vec!["core".to_string()]),
                properties: Some(props),
            },
            element_type: ElementType::Component,
            technology: Some(Technology::new(vec!["Go".to_string(), "gRPC".to_string()])),
            system_id: "api".to_string(),
            container_id: "web".to_string(),
        };

        assert_eq!(component.get_id(), "handler");
        assert_eq!(component.get_name(), "Request Handler");
        assert_eq!(component.get_description(), "Handles requests");
        assert_eq!(component.get_tags(), &["core"]);
        assert_eq!(component.get_properties().get("version").unwrap(), "1.0");
        assert_eq!(component.get_type(), ElementType::Component);
        assert_eq!(component.get_full_path(), "api.web.handler");
    }

    #[test]
    fn test_default_type_functions() {
        assert_eq!(default_person_type(), ElementType::Person);
        assert_eq!(default_system_type(), ElementType::System);
        assert_eq!(default_container_type(), ElementType::Container);
        assert_eq!(default_component_type(), ElementType::Component);
    }

    #[test]
    fn test_options_default() {
        let options = Options::default();
        assert!(!options.show_minimap);
    }
}
