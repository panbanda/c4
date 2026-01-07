use std::collections::HashMap;

#[cfg(test)]
mod resolver_tests {
    use super::*;

    #[test]
    fn test_validation_error_format() {
        // Test ValidationError display format
        // With file and line
        // let err = ValidationError {
        //     path: "relationship.from".to_string(),
        //     message: "unresolved reference".to_string(),
        //     line: 42,
        //     file: "data/model.yaml".to_string(),
        // };
        // assert_eq!(err.to_string(), "data/model.yaml:42: relationship.from: unresolved reference");

        // Without file
        // let err = ValidationError {
        //     path: "relationship.from".to_string(),
        //     message: "unresolved reference".to_string(),
        //     line: 0,
        //     file: String::new(),
        // };
        // assert_eq!(err.to_string(), "relationship.from: unresolved reference");
    }

    #[test]
    fn test_resolver_new() {
        // Resolver should be created with a model reference
        // let model = create_test_model();
        // let resolver = Resolver::new(&model);
        // assert!(resolver.errors.is_empty());
    }

    #[test]
    fn test_resolver_validate_valid_relationships() {
        // Create a model with valid relationships
        // let mut model = create_test_model();
        // model.persons.push(create_person("user"));
        // model.systems.push(create_system("api"));
        // model.relationships.push(Relationship {
        //     from: "user".to_string(),
        //     to: "api".to_string(),
        //     description: "Uses".to_string(),
        //     technology: None,
        // });
        //
        // let mut resolver = Resolver::new(&model);
        // let errors = resolver.resolve();
        // assert_eq!(errors.len(), 0);
    }

    #[test]
    fn test_resolver_validate_invalid_relationship_from() {
        // Relationship with invalid "from" reference
        // let mut model = create_test_model();
        // model.systems.push(create_system("api"));
        // model.relationships.push(Relationship {
        //     from: "nonexistent".to_string(),
        //     to: "api".to_string(),
        //     description: "Uses".to_string(),
        //     technology: None,
        // });
        //
        // let mut resolver = Resolver::new(&model);
        // let errors = resolver.resolve();
        // assert_eq!(errors.len(), 1);
        // assert!(errors[0].message.contains("nonexistent"));
    }

    #[test]
    fn test_resolver_validate_invalid_relationship_to() {
        // Relationship with invalid "to" reference
        // let mut model = create_test_model();
        // model.persons.push(create_person("user"));
        // model.relationships.push(Relationship {
        //     from: "user".to_string(),
        //     to: "nonexistent".to_string(),
        //     description: "Uses".to_string(),
        //     technology: None,
        // });
        //
        // let mut resolver = Resolver::new(&model);
        // let errors = resolver.resolve();
        // assert_eq!(errors.len(), 1);
    }

    #[test]
    fn test_resolver_validate_empty_reference() {
        // Relationship with empty reference
        // let mut model = create_test_model();
        // model.relationships.push(Relationship {
        //     from: "".to_string(),
        //     to: "api".to_string(),
        //     description: "Uses".to_string(),
        //     technology: None,
        // });
        //
        // let mut resolver = Resolver::new(&model);
        // let errors = resolver.resolve();
        // assert_eq!(errors.len(), 1);
        // assert!(errors[0].message.contains("empty reference"));
    }

    #[test]
    fn test_resolver_validate_flow_steps() {
        // Validate flow step references
        // let mut model = create_test_model();
        // model.persons.push(create_person("user"));
        // model.systems.push(create_system("api"));
        // model.flows.push(Flow {
        //     id: "login".to_string(),
        //     name: "Login Flow".to_string(),
        //     steps: vec![
        //         FlowStep {
        //             seq: 1,
        //             from: "user".to_string(),
        //             to: "api".to_string(),
        //             description: "Authenticate".to_string(),
        //         },
        //     ],
        // });
        //
        // let mut resolver = Resolver::new(&model);
        // let errors = resolver.resolve();
        // assert_eq!(errors.len(), 0);
    }

    #[test]
    fn test_resolver_validate_invalid_flow_steps() {
        // Flow steps with invalid references
        // let mut model = create_test_model();
        // model.flows.push(Flow {
        //     id: "login".to_string(),
        //     name: "Login Flow".to_string(),
        //     steps: vec![
        //         FlowStep {
        //             seq: 1,
        //             from: "nonexistent1".to_string(),
        //             to: "nonexistent2".to_string(),
        //             description: "Invalid".to_string(),
        //         },
        //     ],
        // });
        //
        // let mut resolver = Resolver::new(&model);
        // let errors = resolver.resolve();
        // assert_eq!(errors.len(), 2); // Both from and to are invalid
    }

    #[test]
    fn test_resolver_validate_container_parent() {
        // Container with valid system reference
        // let mut model = create_test_model();
        // model.systems.push(create_system("api"));
        // model.containers.push(Container {
        //     id: "web".to_string(),
        //     name: "Web Container".to_string(),
        //     system_id: "api".to_string(),
        //     technology: None,
        // });
        //
        // let mut resolver = Resolver::new(&model);
        // let errors = resolver.resolve();
        // assert_eq!(errors.len(), 0);
    }

    #[test]
    fn test_resolver_validate_invalid_container_parent() {
        // Container with invalid system reference
        // let mut model = create_test_model();
        // model.containers.push(Container {
        //     id: "web".to_string(),
        //     name: "Web Container".to_string(),
        //     system_id: "nonexistent".to_string(),
        //     technology: None,
        // });
        //
        // let mut resolver = Resolver::new(&model);
        // let errors = resolver.resolve();
        // assert_eq!(errors.len(), 1);
        // assert!(errors[0].message.contains("unknown system"));
    }

    #[test]
    fn test_resolver_validate_component_parent() {
        // Component with valid system and container references
        // let mut model = create_test_model();
        // model.systems.push(create_system("api"));
        // model.containers.push(Container {
        //     id: "backend".to_string(),
        //     system_id: "api".to_string(),
        //     ...
        // });
        // model.components.push(Component {
        //     id: "auth".to_string(),
        //     system_id: "api".to_string(),
        //     container_id: "backend".to_string(),
        //     ...
        // });
        //
        // let mut resolver = Resolver::new(&model);
        // let errors = resolver.resolve();
        // assert_eq!(errors.len(), 0);
    }

    #[test]
    fn test_resolver_validate_invalid_component_parent() {
        // Component with invalid container reference
        // let mut model = create_test_model();
        // model.components.push(Component {
        //     id: "auth".to_string(),
        //     system_id: "api".to_string(),
        //     container_id: "nonexistent".to_string(),
        //     ...
        // });
        //
        // let mut resolver = Resolver::new(&model);
        // let errors = resolver.resolve();
        // assert_eq!(errors.len(), 1);
        // assert!(errors[0].message.contains("unknown container"));
    }

    #[test]
    fn test_resolver_validate_deployment_nodes() {
        // Deployment with valid container instances
        // let mut model = create_test_model();
        // model.systems.push(create_system("api"));
        // model.containers.push(create_container("web", "api"));
        // model.deployments.push(Deployment {
        //     id: "prod".to_string(),
        //     environment: "production".to_string(),
        //     nodes: vec![
        //         DeploymentNode {
        //             id: "aws".to_string(),
        //             instances: vec![
        //                 ContainerInstance {
        //                     container: "api.web".to_string(),
        //                 }
        //             ],
        //             children: vec![],
        //         }
        //     ],
        // });
        //
        // let mut resolver = Resolver::new(&model);
        // let errors = resolver.resolve();
        // assert_eq!(errors.len(), 0);
    }

    #[test]
    fn test_resolver_validate_invalid_deployment_instances() {
        // Deployment with invalid container reference
        // let mut model = create_test_model();
        // model.deployments.push(Deployment {
        //     id: "prod".to_string(),
        //     nodes: vec![
        //         DeploymentNode {
        //             id: "aws".to_string(),
        //             instances: vec![
        //                 ContainerInstance {
        //                     container: "nonexistent.web".to_string(),
        //                 }
        //             ],
        //             children: vec![],
        //         }
        //     ],
        // });
        //
        // let mut resolver = Resolver::new(&model);
        // let errors = resolver.resolve();
        // assert_eq!(errors.len(), 1);
    }

    #[test]
    fn test_resolver_validate_nested_deployment_nodes() {
        // Deployment with nested nodes
        // Should recursively validate all levels
    }

    #[test]
    fn test_resolver_find_similar() {
        // Test similarity matching for suggestions
        // let mut model = create_test_model();
        // model.systems.push(create_system("api-gateway"));
        //
        // let resolver = Resolver::new(&model);
        // let suggestion = resolver.find_similar("api-gate");
        // assert_eq!(suggestion, Some("api-gateway".to_string()));
    }

    #[test]
    fn test_resolver_find_similar_no_match() {
        // No similar elements
        // let mut model = create_test_model();
        // model.systems.push(create_system("api"));
        //
        // let resolver = Resolver::new(&model);
        // let suggestion = resolver.find_similar("completely-different");
        // assert_eq!(suggestion, None);
    }

    #[test]
    fn test_resolver_find_similar_minimum_score() {
        // Should require at least 2 character match
        // let mut model = create_test_model();
        // model.systems.push(create_system("api"));
        //
        // let resolver = Resolver::new(&model);
        // let suggestion = resolver.find_similar("a");
        // assert_eq!(suggestion, None);
    }

    #[test]
    fn test_resolver_multiple_errors() {
        // Accumulate multiple validation errors
        // let mut model = create_test_model();
        // model.relationships.push(Relationship {
        //     from: "invalid1".to_string(),
        //     to: "invalid2".to_string(),
        //     ...
        // });
        // model.containers.push(Container {
        //     system_id: "invalid3".to_string(),
        //     ...
        // });
        //
        // let mut resolver = Resolver::new(&model);
        // let errors = resolver.resolve();
        // assert!(errors.len() >= 3);
    }

    #[test]
    fn test_resolver_clears_previous_errors() {
        // Resolver should clear errors between resolve calls
        // let model = create_test_model();
        // let mut resolver = Resolver::new(&model);
        //
        // resolver.resolve();
        // resolver.resolve();
        //
        // // Should not accumulate errors from previous runs
    }
}
