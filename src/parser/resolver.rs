use crate::model::{self, DeploymentNode, Element};
use std::fmt;

#[derive(Debug, Clone)]
pub struct ValidationError {
    pub path: String,
    pub message: String,
    pub line: usize,
    pub file: String,
}

impl fmt::Display for ValidationError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        if !self.file.is_empty() {
            write!(f, "{}:{}: {}: {}", self.file, self.line, self.path, self.message)
        } else {
            write!(f, "{}: {}", self.path, self.message)
        }
    }
}

impl std::error::Error for ValidationError {}

pub struct Resolver<'a> {
    model: &'a model::Model,
    errors: Vec<ValidationError>,
}

impl<'a> Resolver<'a> {
    pub fn new(model: &'a model::Model) -> Self {
        Self {
            model,
            errors: Vec::new(),
        }
    }

    pub fn resolve(&mut self) -> Vec<ValidationError> {
        self.errors.clear();

        // Validate relationship references
        for rel in &self.model.relationships {
            self.validate_ref(&rel.from, &format!("relationship.from({})", rel.from));
            self.validate_ref(&rel.to, &format!("relationship.to({})", rel.to));
        }

        // Validate flow step references
        for flow in &self.model.flows {
            for step in &flow.steps {
                self.validate_ref(
                    &step.from,
                    &format!("flow.{}.step.{}.from", flow.id, step.seq)
                );
                self.validate_ref(
                    &step.to,
                    &format!("flow.{}.step.{}.to", flow.id, step.seq)
                );
            }
        }

        // Validate deployment container references
        for dep in &self.model.deployments {
            if let Some(nodes) = &dep.nodes {
                self.validate_deployment_nodes(nodes, &dep.id);
            }
        }

        // Validate container parent references
        for container in &self.model.containers {
            if self.model.get_element(&container.system_id).is_none() {
                self.errors.push(ValidationError {
                    path: container.get_full_path(),
                    message: format!("container references unknown system {:?}", container.system_id),
                    line: 0,
                    file: String::new(),
                });
            }
        }

        // Validate component parent references
        for component in &self.model.components {
            let parent_path = format!("{}.{}", component.system_id, component.container_id);
            if self.model.get_element(&parent_path).is_none() {
                self.errors.push(ValidationError {
                    path: component.get_full_path(),
                    message: format!("component references unknown container {:?}", parent_path),
                    line: 0,
                    file: String::new(),
                });
            }
        }

        self.errors.clone()
    }

    fn validate_ref(&mut self, ref_: &str, context: &str) {
        if ref_.is_empty() {
            self.errors.push(ValidationError {
                path: context.to_string(),
                message: "empty reference".to_string(),
                line: 0,
                file: String::new(),
            });
            return;
        }

        if self.model.get_element(ref_).is_none() {
            let suggestion = self.find_similar(ref_);
            let msg = if let Some(sugg) = suggestion {
                format!("unresolved reference {:?} (did you mean {:?}?)", ref_, sugg)
            } else {
                format!("unresolved reference {:?}", ref_)
            };

            self.errors.push(ValidationError {
                path: context.to_string(),
                message: msg,
                line: 0,
                file: String::new(),
            });
        }
    }

    fn validate_deployment_nodes(&mut self, nodes: &[DeploymentNode], dep_id: &str) {
        for node in nodes {
            if let Some(instances) = &node.instances {
                for inst in instances {
                    self.validate_ref(
                        &inst.container,
                        &format!("deployment.{}.node.{}.instance", dep_id, node.id)
                    );
                }
            }
            if let Some(children) = &node.children {
                self.validate_deployment_nodes(children, dep_id);
            }
        }
    }

    pub fn find_similar(&self, ref_: &str) -> Option<String> {
        let parts: Vec<&str> = ref_.split('.').collect();
        let last_part = parts.last().unwrap_or(&"");

        let mut best_match = None;
        let mut best_score = 0;

        for element in self.model.all_elements() {
            let id = element.get_id();
            let score = common_prefix_len(last_part, id);
            if score > best_score && score >= 2 {
                best_score = score;
                best_match = Some(element.get_full_path());
            }
        }

        best_match
    }
}

fn common_prefix_len(a: &str, b: &str) -> usize {
    let max_len = a.len().min(b.len());
    for i in 0..max_len {
        if a.as_bytes()[i] != b.as_bytes()[i] {
            return i;
        }
    }
    max_len
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::model::{BaseElement, Container, ElementType, Person, Relationship, SoftwareSystem};

    fn create_test_model() -> model::Model {
        model::Model::new()
    }

    fn create_person(id: &str) -> Person {
        Person {
            base: BaseElement {
                id: id.to_string(),
                name: id.to_string(),
                description: None,
                tags: None,
                properties: None,
            },
            element_type: ElementType::Person,
        }
    }

    fn create_system(id: &str) -> SoftwareSystem {
        SoftwareSystem {
            base: BaseElement {
                id: id.to_string(),
                name: id.to_string(),
                description: None,
                tags: None,
                properties: None,
            },
            element_type: ElementType::System,
            external: None,
        }
    }

    #[test]
    fn test_validation_error_format() {
        let err = ValidationError {
            path: "relationship.from".to_string(),
            message: "unresolved reference".to_string(),
            line: 42,
            file: "data/model.yaml".to_string(),
        };
        assert_eq!(err.to_string(), "data/model.yaml:42: relationship.from: unresolved reference");

        let err = ValidationError {
            path: "relationship.from".to_string(),
            message: "unresolved reference".to_string(),
            line: 0,
            file: String::new(),
        };
        assert_eq!(err.to_string(), "relationship.from: unresolved reference");
    }

    #[test]
    fn test_resolver_new() {
        let model = create_test_model();
        let resolver = Resolver::new(&model);
        assert!(resolver.errors.is_empty());
    }

    #[test]
    fn test_resolver_validate_valid_relationships() {
        let mut model = create_test_model();
        model.persons.push(create_person("user"));
        model.systems.push(create_system("api"));
        model.relationships.push(Relationship {
            from: "user".to_string(),
            to: "api".to_string(),
            description: Some("Uses".to_string()),
            technology: None,
            tags: None,
            properties: None,
        });

        model.build_indexes().unwrap();

        let mut resolver = Resolver::new(&model);
        let errors = resolver.resolve();
        assert_eq!(errors.len(), 0);
    }

    #[test]
    fn test_resolver_validate_invalid_relationship_from() {
        let mut model = create_test_model();
        model.systems.push(create_system("api"));
        model.relationships.push(Relationship {
            from: "nonexistent".to_string(),
            to: "api".to_string(),
            description: Some("Uses".to_string()),
            technology: None,
            tags: None,
            properties: None,
        });

        model.build_indexes().unwrap();

        let mut resolver = Resolver::new(&model);
        let errors = resolver.resolve();
        assert_eq!(errors.len(), 1);
        assert!(errors[0].message.contains("nonexistent"));
    }

    #[test]
    fn test_resolver_validate_empty_reference() {
        let mut model = create_test_model();
        model.relationships.push(Relationship {
            from: "".to_string(),
            to: "api".to_string(),
            description: Some("Uses".to_string()),
            technology: None,
            tags: None,
            properties: None,
        });

        model.build_indexes().unwrap();

        let mut resolver = Resolver::new(&model);
        let errors = resolver.resolve();
        assert_eq!(errors.len(), 2); // Both empty from and invalid to
        assert!(errors[0].message.contains("empty reference"));
    }

    #[test]
    fn test_resolver_validate_container_parent() {
        let mut model = create_test_model();
        model.systems.push(create_system("api"));
        model.containers.push(Container {
            base: BaseElement {
                id: "web".to_string(),
                name: "Web Container".to_string(),
                description: None,
                tags: None,
                properties: None,
            },
            element_type: ElementType::Container,
            technology: None,
            system_id: "api".to_string(),
        });

        model.build_indexes().unwrap();

        let mut resolver = Resolver::new(&model);
        let errors = resolver.resolve();
        assert_eq!(errors.len(), 0);
    }

    #[test]
    fn test_resolver_validate_invalid_container_parent() {
        let mut model = create_test_model();
        model.containers.push(Container {
            base: BaseElement {
                id: "web".to_string(),
                name: "Web Container".to_string(),
                description: None,
                tags: None,
                properties: None,
            },
            element_type: ElementType::Container,
            technology: None,
            system_id: "nonexistent".to_string(),
        });

        model.build_indexes().unwrap();

        let mut resolver = Resolver::new(&model);
        let errors = resolver.resolve();
        assert_eq!(errors.len(), 1);
        assert!(errors[0].message.contains("unknown system"));
    }

    #[test]
    fn test_resolver_find_similar() {
        let mut model = create_test_model();
        model.systems.push(create_system("api-gateway"));

        model.build_indexes().unwrap();

        let resolver = Resolver::new(&model);
        let suggestion = resolver.find_similar("api-gate");
        assert_eq!(suggestion, Some("api-gateway".to_string()));
    }

    #[test]
    fn test_resolver_find_similar_no_match() {
        let mut model = create_test_model();
        model.systems.push(create_system("api"));

        model.build_indexes().unwrap();

        let resolver = Resolver::new(&model);
        let suggestion = resolver.find_similar("completely-different");
        assert_eq!(suggestion, None);
    }

    #[test]
    fn test_common_prefix_len() {
        assert_eq!(common_prefix_len("api-gateway", "api-gate"), 8);
        assert_eq!(common_prefix_len("api", "api"), 3);
        assert_eq!(common_prefix_len("abc", "xyz"), 0);
        assert_eq!(common_prefix_len("a", "api"), 1);
    }
}
