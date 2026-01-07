mod html_tests;
mod json_tests;
mod images_tests;

use serde::{Deserialize, Serialize};

/// Minimal Model stub for testing exporter
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Model {
    pub persons: Vec<Person>,
    pub systems: Vec<SoftwareSystem>,
    pub containers: Vec<Container>,
    pub components: Vec<Component>,
    pub relationships: Vec<Relationship>,
    pub flows: Vec<Flow>,
    pub deployments: Vec<Deployment>,
    pub options: Options,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Person {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SoftwareSystem {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Container {
    pub id: String,
    pub name: String,
    pub system_id: String,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Component {
    pub id: String,
    pub name: String,
    pub container_id: String,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Relationship {
    pub from: String,
    pub to: String,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Flow {
    pub id: String,
    pub name: String,
    pub steps: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Deployment {
    pub id: String,
    pub name: String,
    pub environment: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Options {
    pub title: Option<String>,
    pub theme: Option<String>,
}

impl Model {
    pub fn new_empty() -> Self {
        Self {
            persons: Vec::new(),
            systems: Vec::new(),
            containers: Vec::new(),
            components: Vec::new(),
            relationships: Vec::new(),
            flows: Vec::new(),
            deployments: Vec::new(),
            options: Options {
                title: None,
                theme: None,
            },
        }
    }

    pub fn new_sample() -> Self {
        Self {
            persons: vec![Person {
                id: "user".to_string(),
                name: "User".to_string(),
                description: Some("A user of the system".to_string()),
            }],
            systems: vec![SoftwareSystem {
                id: "app".to_string(),
                name: "Application".to_string(),
                description: Some("The main application".to_string()),
            }],
            containers: vec![Container {
                id: "web".to_string(),
                name: "Web App".to_string(),
                system_id: "app".to_string(),
                description: Some("The web frontend".to_string()),
            }],
            components: vec![Component {
                id: "auth".to_string(),
                name: "Auth Component".to_string(),
                container_id: "web".to_string(),
                description: Some("Handles authentication".to_string()),
            }],
            relationships: vec![Relationship {
                from: "user".to_string(),
                to: "app".to_string(),
                description: Some("Uses".to_string()),
            }],
            flows: vec![Flow {
                id: "login".to_string(),
                name: "Login Flow".to_string(),
                steps: vec!["user".to_string(), "app".to_string()],
            }],
            deployments: vec![Deployment {
                id: "prod".to_string(),
                name: "Production".to_string(),
                environment: "AWS".to_string(),
            }],
            options: Options {
                title: Some("Sample Architecture".to_string()),
                theme: Some("dark".to_string()),
            },
        }
    }
}
