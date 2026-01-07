# C4 - Architecture Visualization CLI

A command-line tool for parsing, visualizing, and exporting C4 architecture models defined in YAML. Provides an interactive web-based visualization with drill-down navigation, flow animations, and export to static HTML.

## Features

- **YAML-based modeling**: Define your architecture in human-readable YAML files
- **Interactive visualization**: Web UI with drill-down navigation through system levels
- **Flow animations**: Visualize request/response flows through your system
- **Live reload**: Automatic browser refresh when YAML files change
- **Static export**: Build self-contained HTML for documentation or sharing
- **Validation**: Schema validation and reference checking
- **Deployment views**: Visualize how containers map to infrastructure

## Installation

### From Source

```bash
git clone https://github.com/panbanda/c4.git
cd c4
make build
```

The binary will be placed in `./target/release/c4`.

### Requirements

- Rust 1.75 or later
- Node.js 18+ (for frontend development)

## Quick Start

### 1. Initialize a new workspace

```bash
c4 init my-architecture
cd my-architecture
```

This creates:
- `c4.mod.yaml` - Workspace configuration
- `shared/` - Shared definitions (personas, external systems)
- `systems/example/` - Example system with containers and relationships
- `deployments/` - Deployment environment definitions

### 2. Validate your model

```bash
c4 validate
```

Checks for YAML syntax errors, schema compliance, and reference validity.

### 3. Start the visualization server

```bash
c4 serve
```

Opens http://localhost:4400 in your browser with live reload enabled.

### 4. Build static output

```bash
c4 build -o ./dist
```

Generates a self-contained HTML visualization in `./dist`.

## Commands

### c4 init

Initialize a new C4 workspace with directory structure and example files.

```bash
c4 init [name]                    # Initialize with custom name
c4 init --minimal                 # Create minimal structure
c4 init --minimal --no-example    # No example files
c4 init -C /path/to/project       # Initialize in specific directory
```

### c4 validate

Validate YAML files against schema and check references.

```bash
c4 validate                       # Validate current workspace
c4 validate -C /path/to/workspace # Validate specific directory
c4 validate --json                # JSON output for CI/CD
c4 validate --strict              # Treat warnings as errors
```

Exit codes:
- 0: Validation passed
- 1: Validation failed

### c4 serve

Start development server with live reload.

```bash
c4 serve                          # Start on default port (4400)
c4 serve --port 8080              # Use custom port
c4 serve --no-open                # Don't open browser automatically
c4 serve --no-reload              # Disable live reload
c4 serve -C /path/to/workspace    # Serve from specific directory
```

### c4 build

Export C4 model to static artifacts.

```bash
c4 build                          # Export to ./dist
c4 build -o ./output              # Export to custom directory
c4 build --json                   # Export JSON model
c4 build --images --format svg    # Export SVG images
c4 build --html=false --json      # JSON only, no HTML
```

## Configuration

### Workspace Structure

```
my-architecture/
  c4.mod.yaml              # Workspace config
  shared/
    personas.yaml          # User types
    external-systems.yaml  # External dependencies
  systems/
    example/
      system.yaml          # System definition
      containers.yaml      # Container definitions
      relationships.yaml   # Relationships between elements
      flows/               # Flow definitions
        login.yaml
  deployments/
    production.yaml        # Deployment environment
```

### c4.mod.yaml

```yaml
version: "1.0"
name: my-architecture

include:
  - shared/*.yaml
  - systems/*/system.yaml
  - systems/*/containers.yaml
  - systems/*/relationships.yaml
  - systems/*/flows/*.yaml
  - deployments/*.yaml
```

## Model Definition

### Persons

Define user types that interact with your systems:

```yaml
persons:
  - id: customer
    name: Customer
    description: End user of the application
    tags:
      - external
```

### Systems

Define software systems:

```yaml
systems:
  - id: web-app
    name: Web Application
    description: Customer-facing web application
    external: false
    tags:
      - frontend
```

### Containers

Define containers (applications, databases, etc.) within systems:

```yaml
containers:
  - id: api
    name: API Server
    description: REST API backend
    technology: Go, Chi Router

  - id: database
    name: Database
    description: Primary data store
    technology: PostgreSQL 15
```

### Relationships

Define how elements communicate:

```yaml
relationships:
  - from: customer
    to: web-app.frontend
    description: Uses the web interface
    technology: HTTPS

  - from: web-app.frontend
    to: web-app.api
    description: Makes API calls
    technology: REST, JSON
```

### Flows

Define step-by-step flows through your system:

```yaml
flows:
  - id: user-login
    name: User Login
    description: Authentication flow
    steps:
      - from: customer
        to: web-app.frontend
        description: Enters credentials

      - from: web-app.frontend
        to: web-app.api
        description: POST /api/auth/login

      - from: web-app.api
        to: web-app.database
        description: Verify credentials
```

### Deployments

Define deployment environments:

```yaml
deployments:
  - id: production
    name: Production Environment
    nodes:
      - id: cloud
        name: AWS
        technology: AWS
        children:
          - id: web-tier
            name: Web Tier
            instances:
              - container: web-app.frontend
                replicas: 2
```

## Visualization Features

### Interactive Navigation

- Click on systems to drill down into containers
- Click on containers to see components
- Use breadcrumbs to navigate back up
- Search/filter elements by name or tag

### Keyboard Shortcuts

- `Left/Right` or `h/l`: Navigate breadcrumb hierarchy
- `Up/Down` or `k/j`: Navigate between nodes in current view
- `Enter` or `Space`: Drill down into selected node
- `Backspace` or `Escape`: Navigate up one level
- `/`: Focus search box
- `e`: Toggle edit mode
- `Cmd/Ctrl+S`: Save changes (when in edit mode)

### Flow Animations

- Select a flow from the side panel
- Watch animated visualization of the request path
- See step descriptions and timing
- Pause/resume animation

### Edit Mode

- Toggle edit mode with the edit button or press `e`
- Modify element properties inline
- Changes saved to YAML files
- Live reload updates the visualization

## Development

### Build from source

```bash
# Build release binary
make build

# Development build (faster compilation)
make build-dev

# Run tests
make test

# Frontend development
cd frontend
npm install
npm run dev
```

### Project Structure

```
c4/
  src/
    cli/               # CLI commands
    parser/            # YAML parser and validator
    server/            # HTTP server and file watcher
    exporter/          # HTML/JSON export
    model/             # Data model types
  frontend/            # React visualization UI
  tests/               # Integration tests
```

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.

## Acknowledgments

Inspired by the [C4 model](https://c4model.com/) by Simon Brown.
