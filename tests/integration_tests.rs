//! Integration tests for the C4 Rust implementation
//! Tests the full parsing, validation, and export pipeline

use c4::model::{BaseElement, Component, Container, Element, ElementType, Person, Technology};
use c4::parser::{Parser, Resolver};
use std::fs;
use tempfile::TempDir;

/// Helper to create a valid test workspace
fn create_test_workspace() -> TempDir {
    let temp_dir = TempDir::new().unwrap();
    let root = temp_dir.path();

    // Create directory structure
    fs::create_dir_all(root.join("shared")).unwrap();
    fs::create_dir_all(root.join("systems/order-system")).unwrap();
    fs::create_dir_all(root.join("deployments")).unwrap();

    // Create c4.mod.yaml
    let mod_content = r#"version: "1.0"
name: test-architecture

include:
  - shared/*.yaml
  - systems/*/system.yaml
  - systems/*/containers.yaml
  - systems/*/relationships.yaml
  - deployments/*.yaml

options:
  showMinimap: true
"#;
    fs::write(root.join("c4.mod.yaml"), mod_content).unwrap();

    // Create shared/personas.yaml
    let personas_content = r#"persons:
  - id: customer
    name: Customer
    description: A retail customer who browses and purchases products
    tags:
      - external
      - end-user
"#;
    fs::write(root.join("shared/personas.yaml"), personas_content).unwrap();

    // Create systems/order-system/system.yaml
    let system_content = r#"systems:
  - id: order-system
    name: Order Management System
    description: Handles the complete order lifecycle
    external: false
    tags:
      - core
      - revenue-critical
"#;
    fs::write(
        root.join("systems/order-system/system.yaml"),
        system_content,
    )
    .unwrap();

    // Create systems/order-system/containers.yaml
    let containers_content = r#"containers:
  - id: web-app
    name: Web Application
    description: The main web interface
    technology: React, TypeScript

  - id: api
    name: API Server
    description: Backend REST API
    technology: Go, Chi

  - id: database
    name: Database
    description: Primary data store
    technology: PostgreSQL 15
"#;
    fs::write(
        root.join("systems/order-system/containers.yaml"),
        containers_content,
    )
    .unwrap();

    // Create systems/order-system/relationships.yaml
    let relationships_content = r#"relationships:
  - from: customer
    to: order-system.web-app
    description: Uses the web interface
    technology: HTTPS

  - from: order-system.web-app
    to: order-system.api
    description: Makes API calls
    technology: HTTPS, JSON

  - from: order-system.api
    to: order-system.database
    description: Reads and writes data
    technology: SQL/TCP
"#;
    fs::write(
        root.join("systems/order-system/relationships.yaml"),
        relationships_content,
    )
    .unwrap();

    // Create deployments/production.yaml
    let deployment_content = r#"deployments:
  - id: production
    name: Production Environment
    description: AWS production deployment
    nodes:
      - id: aws-region
        name: AWS us-east-1
        environment: production
        children:
          - id: web-tier
            name: Web Tier
            technology: AWS ECS
            instances:
              - container: order-system.web-app
                replicas: 3
          - id: api-tier
            name: API Tier
            technology: AWS ECS
            instances:
              - container: order-system.api
                replicas: 5
          - id: data-tier
            name: Data Tier
            technology: AWS RDS
            instances:
              - container: order-system.database
                replicas: 1
"#;
    fs::write(root.join("deployments/production.yaml"), deployment_content).unwrap();

    temp_dir
}

#[test]
fn test_parse_complete_workspace() {
    let temp_dir = create_test_workspace();
    let root = temp_dir.path().to_str().unwrap();

    let mut parser = Parser::new(root);
    let result = parser.parse();
    assert!(result.is_ok(), "Parse should succeed: {:?}", result.err());

    let model = result.unwrap();

    // Check persons
    assert_eq!(model.persons.len(), 1);
    assert_eq!(model.persons[0].base.id, "customer");
    assert_eq!(model.persons[0].base.name, "Customer");

    // Check systems
    assert_eq!(model.systems.len(), 1);
    assert_eq!(model.systems[0].base.id, "order-system");
    // external is Option<bool>
    assert_eq!(model.systems[0].external, Some(false));

    // Check containers
    assert_eq!(model.containers.len(), 3);

    // Check relationships
    assert_eq!(model.relationships.len(), 3);

    // Check deployments
    assert_eq!(model.deployments.len(), 1);
    assert_eq!(model.deployments[0].id, "production");
}

#[test]
fn test_parse_and_resolve_references() {
    let temp_dir = create_test_workspace();
    let root = temp_dir.path().to_str().unwrap();

    let mut parser = Parser::new(root);
    let model = parser.parse().unwrap();

    let mut resolver = Resolver::new(&model);
    let errors = resolver.resolve();

    assert!(
        errors.is_empty(),
        "Should have no validation errors: {:?}",
        errors
    );
}

#[test]
fn test_parse_invalid_reference() {
    let temp_dir = TempDir::new().unwrap();
    let root = temp_dir.path();

    // Create minimal workspace with invalid reference
    fs::create_dir_all(root.join("shared")).unwrap();

    let mod_content = r#"version: "1.0"
name: test

include:
  - shared/*.yaml
"#;
    fs::write(root.join("c4.mod.yaml"), mod_content).unwrap();

    let data_content = r#"persons:
  - id: user
    name: User

relationships:
  - from: user
    to: nonexistent-system
    description: Invalid reference
"#;
    fs::write(root.join("shared/data.yaml"), data_content).unwrap();

    let mut parser = Parser::new(root.to_str().unwrap());
    let model = parser.parse().unwrap();

    let mut resolver = Resolver::new(&model);
    let errors = resolver.resolve();

    assert!(!errors.is_empty(), "Should have validation errors");
    assert!(errors[0].message.contains("nonexistent-system"));
}

#[test]
fn test_context_from_path() {
    let temp_dir = TempDir::new().unwrap();
    let root = temp_dir.path();

    // Create directory structure
    fs::create_dir_all(root.join("systems/my-service")).unwrap();
    fs::write(
        root.join("c4.mod.yaml"),
        "version: \"1.0\"\nname: test\ninclude: []",
    )
    .unwrap();

    let parser = Parser::new(root.to_str().unwrap());

    // Test system path extraction - system_id is String, not Option
    let ctx = parser.context_from_path(&root.join("systems/my-service/containers.yaml"));
    assert_eq!(ctx.system_id, "my-service");

    // Test shared path (no system context)
    let ctx = parser.context_from_path(&root.join("shared/personas.yaml"));
    assert_eq!(ctx.system_id, "");
}

#[test]
fn test_model_indexes() {
    let temp_dir = create_test_workspace();
    let root = temp_dir.path().to_str().unwrap();

    let mut parser = Parser::new(root);
    let model = parser.parse().unwrap();

    // Test get_element
    let customer = model.get_element("customer");
    assert!(customer.is_some());
    assert_eq!(customer.unwrap().get_name(), "Customer");

    // Test get_element for container
    let api = model.get_element("order-system.api");
    assert!(api.is_some());
    assert_eq!(api.unwrap().get_name(), "API Server");

    // Test get_elements_by_type
    let persons = model.get_elements_by_type(ElementType::Person);
    assert_eq!(persons.len(), 1);

    let containers = model.get_elements_by_type(ElementType::Container);
    assert_eq!(containers.len(), 3);

    // Test get_children
    let system_children = model.get_children("order-system");
    assert_eq!(system_children.len(), 3, "System should have 3 containers");
}

#[test]
fn test_model_relationships() {
    let temp_dir = create_test_workspace();
    let root = temp_dir.path().to_str().unwrap();

    let mut parser = Parser::new(root);
    let model = parser.parse().unwrap();

    // Test outgoing relationships
    let customer_rels = model.get_outgoing_relationships("customer");
    assert_eq!(customer_rels.len(), 1);
    assert_eq!(customer_rels[0].to, "order-system.web-app");

    // Test incoming relationships
    let api_incoming = model.get_incoming_relationships("order-system.api");
    assert_eq!(api_incoming.len(), 1);
    assert_eq!(api_incoming[0].from, "order-system.web-app");
}

#[test]
fn test_parser_get_mod_file() {
    let temp_dir = create_test_workspace();
    let root = temp_dir.path().to_str().unwrap();

    let mut parser = Parser::new(root);
    let _ = parser.parse().unwrap();

    let mod_file = parser.get_mod_file();
    assert!(mod_file.is_some());

    let mod_file = mod_file.unwrap();
    assert_eq!(mod_file.version, "1.0");
    assert_eq!(mod_file.name, "test-architecture");
    assert!(!mod_file.include.is_empty());
    assert!(mod_file.options.show_minimap);
}

#[test]
fn test_full_path_generation() {
    let person = Person {
        base: BaseElement {
            id: "user".to_string(),
            name: "User".to_string(),
            description: None,
            tags: None,
            properties: None,
        },
        element_type: ElementType::Person,
    };
    assert_eq!(person.get_full_path(), "user");

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
        system_id: "order-system".to_string(),
    };
    assert_eq!(container.get_full_path(), "order-system.api");

    let component = Component {
        base: BaseElement {
            id: "handler".to_string(),
            name: "Handler".to_string(),
            description: None,
            tags: None,
            properties: None,
        },
        element_type: ElementType::Component,
        technology: Some(Technology::new(vec!["Go".to_string()])),
        system_id: "order-system".to_string(),
        container_id: "api".to_string(),
    };
    assert_eq!(component.get_full_path(), "order-system.api.handler");
}

#[test]
fn test_technology_deserialization() {
    // From string
    let yaml = r#"technology: "Go, gRPC""#;
    let data: serde_yaml::Value = serde_yaml::from_str(yaml).unwrap();
    let tech_str = data["technology"].as_str().unwrap();
    let tech: Technology = serde_yaml::from_str(&format!("\"{}\"", tech_str)).unwrap();
    assert_eq!(tech.as_slice(), &["Go", "gRPC"]);

    // From array
    let yaml = r#"technology:
  - Go
  - gRPC"#;
    let data: serde_yaml::Value = serde_yaml::from_str(yaml).unwrap();
    let tech: Technology = serde_yaml::from_value(data["technology"].clone()).unwrap();
    assert_eq!(tech.as_slice(), &["Go", "gRPC"]);
}

#[test]
fn test_flow_parsing() {
    let temp_dir = TempDir::new().unwrap();
    let root = temp_dir.path();

    fs::create_dir_all(root.join("shared")).unwrap();

    let mod_content = r#"version: "1.0"
name: test
include:
  - shared/*.yaml
"#;
    fs::write(root.join("c4.mod.yaml"), mod_content).unwrap();

    let flow_content = r#"persons:
  - id: user
    name: User

systems:
  - id: system
    name: System

flows:
  - id: checkout-flow
    name: Checkout Process
    description: User checkout flow
    steps:
      - seq: 1
        from: user
        to: system
        description: Initiates checkout
"#;
    fs::write(root.join("shared/flow.yaml"), flow_content).unwrap();

    let mut parser = Parser::new(root.to_str().unwrap());
    let model = parser.parse().unwrap();

    assert_eq!(model.flows.len(), 1);
    assert_eq!(model.flows[0].id, "checkout-flow");
    assert_eq!(model.flows[0].steps.len(), 1);
    assert_eq!(model.flows[0].steps[0].seq, 1);
}

#[test]
fn test_empty_workspace() {
    let temp_dir = TempDir::new().unwrap();
    let root = temp_dir.path();

    let mod_content = r#"version: "1.0"
name: empty
include: []
"#;
    fs::write(root.join("c4.mod.yaml"), mod_content).unwrap();

    let mut parser = Parser::new(root.to_str().unwrap());
    let model = parser.parse().unwrap();

    assert_eq!(model.persons.len(), 0);
    assert_eq!(model.systems.len(), 0);
    assert_eq!(model.containers.len(), 0);
    assert_eq!(model.components.len(), 0);
    assert_eq!(model.relationships.len(), 0);
    assert_eq!(model.flows.len(), 0);
    assert_eq!(model.deployments.len(), 0);
}

#[test]
fn test_parser_missing_mod_file() {
    let temp_dir = TempDir::new().unwrap();
    let root = temp_dir.path();

    let mut parser = Parser::new(root.to_str().unwrap());
    let result = parser.parse();

    assert!(result.is_err());
    let err = result.unwrap_err();
    assert!(err.to_string().contains("c4.mod.yaml"));
}

#[test]
fn test_model_all_elements() {
    let temp_dir = create_test_workspace();
    let root = temp_dir.path().to_str().unwrap();

    let mut parser = Parser::new(root);
    let model = parser.parse().unwrap();

    let all = model.all_elements();
    // 1 person + 1 system + 3 containers = 5 elements
    assert_eq!(all.len(), 5);
}

#[test]
fn test_element_tags() {
    let temp_dir = create_test_workspace();
    let root = temp_dir.path().to_str().unwrap();

    let mut parser = Parser::new(root);
    let model = parser.parse().unwrap();

    // Check customer has tags
    let customer = &model.persons[0];
    assert!(customer.base.tags.is_some());
    let tags = customer.base.tags.as_ref().unwrap();
    assert!(tags.contains(&"external".to_string()));
    assert!(tags.contains(&"end-user".to_string()));

    // Test get_elements_by_tag
    let externals = model.get_elements_by_tag("external");
    assert_eq!(externals.len(), 1);
    assert_eq!(externals[0].get_id(), "customer");
}

#[test]
fn test_container_technology() {
    let temp_dir = create_test_workspace();
    let root = temp_dir.path().to_str().unwrap();

    let mut parser = Parser::new(root);
    let model = parser.parse().unwrap();

    // Find the API container
    let api = model.containers.iter().find(|c| c.base.id == "api");
    assert!(api.is_some());

    let api = api.unwrap();
    assert!(api.technology.is_some());
    let tech = api.technology.as_ref().unwrap();
    assert!(tech.as_slice().contains(&"Go".to_string()));
    assert!(tech.as_slice().contains(&"Chi".to_string()));
}

#[test]
fn test_resolver_find_similar() {
    let temp_dir = TempDir::new().unwrap();
    let root = temp_dir.path();

    fs::create_dir_all(root.join("shared")).unwrap();

    let mod_content = r#"version: "1.0"
name: test
include:
  - shared/*.yaml
"#;
    fs::write(root.join("c4.mod.yaml"), mod_content).unwrap();

    let data_content = r#"persons:
  - id: customer
    name: Customer

systems:
  - id: system
    name: System

relationships:
  - from: customer
    to: systm
    description: typo in reference
"#;
    fs::write(root.join("shared/data.yaml"), data_content).unwrap();

    let mut parser = Parser::new(root.to_str().unwrap());
    let model = parser.parse().unwrap();

    let mut resolver = Resolver::new(&model);
    let errors = resolver.resolve();

    assert!(!errors.is_empty());
    // Should suggest "system" for "systm"
    let error_msg = &errors[0].message;
    assert!(
        error_msg.contains("did you mean"),
        "Should suggest similar: {}",
        error_msg
    );
}

#[test]
fn test_deployment_structure() {
    let temp_dir = create_test_workspace();
    let root = temp_dir.path().to_str().unwrap();

    let mut parser = Parser::new(root);
    let model = parser.parse().unwrap();

    let deployment = &model.deployments[0];
    assert_eq!(deployment.id, "production");
    assert_eq!(deployment.name, "Production Environment");

    let nodes = deployment.nodes.as_ref().unwrap();
    assert_eq!(nodes.len(), 1);
    assert_eq!(nodes[0].id, "aws-region");

    let children = nodes[0].children.as_ref().unwrap();
    assert_eq!(children.len(), 3);
}
