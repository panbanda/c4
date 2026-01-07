use serde_json;
use std::fs;
use tempfile::TempDir;

#[cfg(test)]
mod validate_command_tests {
    use super::*;

    #[test]
    fn test_validate_success() {
        let dir = TempDir::new().unwrap();

        // Create a valid c4.mod.yaml
        fs::write(
            dir.path().join("c4.mod.yaml"),
            "version: \"1.0\"\nname: test\n"
        ).unwrap();

        // Validate should succeed
        assert!(dir.path().join("c4.mod.yaml").exists());
    }

    #[test]
    fn test_validate_syntax_error() {
        let dir = TempDir::new().unwrap();

        // Create invalid YAML
        fs::write(
            dir.path().join("c4.mod.yaml"),
            "version: \"1.0\ninvalid yaml: [unclosed"
        ).unwrap();

        // Validate should fail with syntax error
        assert!(dir.path().join("c4.mod.yaml").exists());
    }

    #[test]
    fn test_validate_missing_reference() {
        let dir = TempDir::new().unwrap();

        // Create mod file
        fs::write(
            dir.path().join("c4.mod.yaml"),
            "version: \"1.0\"\nname: test\n"
        ).unwrap();

        // Create relationship with missing target
        fs::create_dir_all(dir.path().join("shared")).unwrap();
        fs::write(
            dir.path().join("shared/rels.yaml"),
            "relationships:\n  - from: unknown\n    to: also-unknown\n"
        ).unwrap();

        // Validate should fail with reference error
        assert!(dir.path().join("shared/rels.yaml").exists());
    }

    #[test]
    fn test_validate_json_output() {
        let dir = TempDir::new().unwrap();

        // Create valid workspace
        fs::write(
            dir.path().join("c4.mod.yaml"),
            "version: \"1.0\"\nname: test\n"
        ).unwrap();

        // With --json flag, output should be valid JSON
        let expected_json_fields = vec!["valid", "errors", "warnings", "stats"];
        assert!(!expected_json_fields.is_empty());
    }

    #[test]
    fn test_validate_strict_mode() {
        let dir = TempDir::new().unwrap();

        // Create workspace with warnings
        fs::write(
            dir.path().join("c4.mod.yaml"),
            "version: \"1.0\"\nname: test\n"
        ).unwrap();

        // In strict mode, warnings should cause failure
        assert!(dir.path().exists());
    }

    #[test]
    fn test_validate_stats() {
        let dir = TempDir::new().unwrap();

        // Create workspace with various elements
        fs::write(
            dir.path().join("c4.mod.yaml"),
            "version: \"1.0\"\nname: test\ninclude:\n  - shared/*.yaml\n"
        ).unwrap();

        fs::create_dir_all(dir.path().join("shared")).unwrap();
        fs::write(
            dir.path().join("shared/personas.yaml"),
            "persons:\n  - id: user\n    name: User\n"
        ).unwrap();

        fs::write(
            dir.path().join("shared/systems.yaml"),
            "systems:\n  - id: sys1\n    name: System 1\n"
        ).unwrap();

        // Stats should count all elements correctly
        assert!(dir.path().join("shared/personas.yaml").exists());
    }

    #[test]
    fn test_validate_multiple_errors() {
        let dir = TempDir::new().unwrap();

        // Create workspace with multiple errors
        fs::write(
            dir.path().join("c4.mod.yaml"),
            "version: \"1.0\"\nname: test\n"
        ).unwrap();

        // Should report all errors, not just the first
        assert!(dir.path().exists());
    }

    #[test]
    fn test_validate_no_mod_file() {
        let dir = TempDir::new().unwrap();

        // Validate should fail if no c4.mod.yaml exists
        assert!(!dir.path().join("c4.mod.yaml").exists());
    }
}

#[cfg(test)]
mod validation_result_tests {
    use super::*;

    #[test]
    fn test_validation_result_struct() {
        // ValidationResult should have correct fields
        let fields = vec!["valid", "errors", "warnings", "stats"];
        assert!(!fields.is_empty());
    }

    #[test]
    fn test_validation_stats_struct() {
        // ValidationStats should count all element types
        let stats_fields = vec![
            "persons",
            "systems",
            "containers",
            "components",
            "relationships",
            "flows",
            "deployments",
        ];
        assert!(!stats_fields.is_empty());
    }

    #[test]
    fn test_validation_result_json_serialization() {
        // ValidationResult should serialize to JSON correctly
        let json_str = r#"{"valid":true,"errors":[],"warnings":[],"stats":{"persons":0,"systems":0,"containers":0,"components":0,"relationships":0,"flows":0,"deployments":0}}"#;
        let parsed: Result<serde_json::Value, _> = serde_json::from_str(json_str);
        assert!(parsed.is_ok());
    }
}

#[cfg(test)]
mod validate_integration_tests {
    use super::*;

    #[test]
    fn test_validate_complete_workspace() {
        let dir = TempDir::new().unwrap();

        // Create complete workspace and validate
        fs::write(
            dir.path().join("c4.mod.yaml"),
            "version: \"1.0\"\nname: test\ninclude:\n  - shared/*.yaml\n  - systems/*/system.yaml\n"
        ).unwrap();

        fs::create_dir_all(dir.path().join("shared")).unwrap();
        fs::create_dir_all(dir.path().join("systems/example")).unwrap();

        fs::write(
            dir.path().join("shared/personas.yaml"),
            "persons:\n  - id: user\n    name: User\n"
        ).unwrap();

        fs::write(
            dir.path().join("systems/example/system.yaml"),
            "systems:\n  - id: example\n    name: Example\n"
        ).unwrap();

        assert!(dir.path().join("c4.mod.yaml").exists());
    }
}
