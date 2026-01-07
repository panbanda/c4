# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Approach

**Always use Test-Driven Development (TDD)** when implementing features, fixes, or refactoring:
1. Write a failing test first
2. Write minimal code to make the test pass
3. Refactor while keeping tests green

**Bug fixes require tests too.** A runtime error or user-reported bug is not "the test" - write a test that reproduces the failure before fixing it. Do not rationalize skipping TDD because the fix seems "simple" or "obvious."

## Commands

```bash
# Build
make build              # Release build (includes frontend)
make build-dev          # Debug build (faster, no frontend)
cargo build             # Rust only

# Test
make test               # Run all tests (validates schemas first)
cargo test              # Rust tests only
cargo test <test_name>  # Run single test by name
cargo test -- --nocapture  # Show println output

# Frontend
cd frontend && npm test           # Run frontend tests
cd frontend && npm run test:watch # Watch mode
cd frontend && npm run dev        # Dev server (port 5173)

# Lint & Format
make lint               # cargo clippy
make fmt                # cargo fmt

# Development
make dev                # Build and serve examples/dispatch
./target/release/c4 serve -C ./examples/simple  # Serve specific workspace
```

## Architecture

C4 is a CLI tool for visualizing C4 architecture models. It parses YAML definitions and serves an interactive React visualization.

### Rust Modules (`src/`)

| Module | Purpose |
|--------|---------|
| `cli/` | Command handlers (init, validate, serve, build) |
| `parser/` | YAML parsing, file discovery, reference resolution |
| `model/` | C4 data types (Person, System, Container, Component, Relationship, Flow, Deployment) |
| `server/` | Axum HTTP server, WebSocket hub for live reload, file watcher |
| `exporter/` | Static HTML/JSON export |

### Data Flow

1. `Parser` reads `c4.mod.yaml` and discovers YAML files via glob patterns
2. Files are parsed into typed structs, building a `Model` with indexed lookups
3. `Server` serves the model as JSON at `/api/model` and hosts the React frontend
4. `Watcher` monitors YAML files and broadcasts reload events via WebSocket

### Frontend (`frontend/`)

React + TypeScript visualization using React Flow and ELK layout. See `frontend/CLAUDE.md` for frontend-specific guidance.

### Workspace Structure

A C4 workspace has:
- `c4.mod.yaml` - Defines name, version, and glob patterns for included files
- `shared/` - Personas and external systems
- `systems/<name>/` - System definitions with containers and relationships
- `deployments/` - Infrastructure deployment views
