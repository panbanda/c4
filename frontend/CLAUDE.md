# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (port 5173, proxies /api to localhost:4400)
npm run build        # Type-check and build for production
npm run lint         # Run ESLint
npm run test         # Run all tests once
npm run test:watch   # Run tests in watch mode
npx tsc --noEmit     # Type-check without emitting
```

Run a single test file:
```bash
npx vitest run src/hooks/useWebSocket.test.ts
```

## Architecture

This is a React frontend for visualizing C4 architecture models. It renders interactive diagrams using React Flow with ELK-based automatic layout.

### Core Data Flow

1. **API Layer** (`src/api/client.ts`) - Fetches C4Model from backend at `/api/model`
2. **Store** (`src/store/useStore.ts`) - Zustand store holding model, view state, and pending edits
3. **Layout** (`src/hooks/useElkLayout.ts`) - Transforms C4Model into React Flow nodes/edges using ELK algorithm
4. **Canvas** (`src/components/Canvas.tsx`) - Renders React Flow with node types

### C4 Model Types (`src/types/c4.ts`)

The model follows C4 hierarchy: Person/System > Container > Component. Key types:
- `C4Model` - Root type with all elements, relationships, flows, and deployments
- `Element` - Union of Person, SoftwareSystem, Container, Component
- `ViewType` - `'landscape' | 'context' | 'container' | 'component' | 'deployment'`

### View System

Views are hierarchical and support drill-down:
- `landscape` - All systems and persons
- `container` - Containers within a focused system
- `component` - Components within a focused container
- `deployment` - Infrastructure nodes with nested groups

URL state syncs via `useUrlSync` hook: `?view=container&focus=systemId&selected=elementId`

### Node Types (`src/components/nodes/`)

Each C4 element type has a corresponding React Flow node component:
- `PersonNode`, `SystemNode`, `ContainerNode`, `ComponentNode`
- `DeploymentNode`, `DeploymentGroupNode`, `InstanceNode` (for deployment view)

### Layout Engine (`src/utils/elkLayout.ts`, `src/hooks/useElkLayout.ts`)

- Uses ELK (Eclipse Layout Kernel) via `elkjs` for graph layout
- Assigns semantic layers based on element type (persons -> systems -> containers)
- Deployment view uses custom nested layout (not ELK) with React Flow parent/child relationships

### State Management

Zustand store manages:
- `model` - The C4 model data
- `currentView` / `focusElement` - Current view hierarchy
- `selectedElement` - Currently selected element for property editing
- `activeFlow` / `flowStep` - Flow animation state
- `pendingChanges` - Staged edits before save

## Key Patterns

- Nodes receive `onSelect` and `onDrillDown` callbacks via data prop
- Double-click drills down; single-click selects for editing
- Keyboard: Escape = deselect/navigate up, Enter = drill down, Backspace = navigate up
- Hover highlighting dims unconnected nodes (disabled in deployment view)
