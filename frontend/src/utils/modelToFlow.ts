import type { Node, Edge } from '@xyflow/react'
import type {
  C4Model,
  Element,
  Relationship,
  ViewType,
} from '../types/c4'
import type { PersonNodeData } from '../components/nodes/PersonNode'
import type { SystemNodeData } from '../components/nodes/SystemNode'
import type { ContainerNodeData } from '../components/nodes/ContainerNode'
import type { ComponentNodeData } from '../components/nodes/ComponentNode'
import type { RelationshipEdgeData } from '../components/edges/RelationshipEdge'
import { getElementIds, matchesElement, matchesFilter } from './elementHelpers'

type NodeData = PersonNodeData | SystemNodeData | ContainerNodeData | ComponentNodeData

interface LayoutPosition {
  x: number
  y: number
}

const GRID_SPACING = {
  x: 300,
  y: 250,
}


function getElementsForView(
  model: C4Model,
  viewType: ViewType,
  focusElement?: string
): Element[] {
  switch (viewType) {
    case 'landscape':
      return [...model.persons, ...model.systems]

    case 'context':
      if (!focusElement) {
        return [...model.persons, ...model.systems]
      }
      const relatedIds = new Set<string>([focusElement])
      model.relationships.forEach((rel) => {
        if (rel.from === focusElement) relatedIds.add(rel.to)
        if (rel.to === focusElement) relatedIds.add(rel.from)
      })
      return [...model.persons, ...model.systems].filter((el) => relatedIds.has(el.id))

    case 'container':
      if (!focusElement) return []
      const containers = model.containers.filter((c) => c.systemId === focusElement)
      const relatedPersons = model.persons.filter((p) =>
        model.relationships.some(
          (r) =>
            (r.from === p.id && containers.some((c) => matchesElement(r.to, c))) ||
            (r.to === p.id && containers.some((c) => matchesElement(r.from, c)))
        )
      )
      const relatedSystems = model.systems.filter((s) =>
        model.relationships.some(
          (r) =>
            (r.from === s.id && containers.some((c) => matchesElement(r.to, c))) ||
            (r.to === s.id && containers.some((c) => matchesElement(r.from, c)))
        )
      )
      return [...relatedPersons, ...relatedSystems, ...containers]

    case 'component':
      if (!focusElement) return []
      const components = model.components.filter((c) => c.containerId === focusElement)
      const container = model.containers.find((c) => c.id === focusElement)
      if (!container) return components

      // If no components, show focused container with all its connections
      if (components.length === 0) {
        const containerIds = getElementIds(container)

        // Find all elements this container connects to/from
        const connectedIds = new Set<string>()
        model.relationships.forEach((r) => {
          if (containerIds.includes(r.from)) connectedIds.add(r.to)
          if (containerIds.includes(r.to)) connectedIds.add(r.from)
        })

        // Gather connected elements
        const connectedPersons = model.persons.filter((p) => connectedIds.has(p.id))
        const connectedSystems = model.systems.filter((s) => connectedIds.has(s.id))
        const connectedContainers = model.containers.filter((c) =>
          c.id !== container.id && (
            connectedIds.has(c.id) ||
            connectedIds.has(`${c.systemId}.${c.id}`)
          )
        )

        return [container, ...connectedPersons, ...connectedSystems, ...connectedContainers]
      }

      const otherContainers = model.containers.filter(
        (c) =>
          c.systemId === container.systemId &&
          model.relationships.some(
            (r) =>
              (r.from === c.id && components.some((comp) => comp.id === r.to)) ||
              (r.to === c.id && components.some((comp) => comp.id === r.from))
          )
      )
      return [...otherContainers, ...components]

    default:
      return []
  }
}

function calculateLayout(elements: Element[]): Map<string, LayoutPosition> {
  const positions = new Map<string, LayoutPosition>()

  const persons = elements.filter((e) => e.type === 'person')
  const systems = elements.filter((e) => e.type === 'system')
  const containers = elements.filter((e) => e.type === 'container')
  const components = elements.filter((e) => e.type === 'component')

  let currentY = 0

  persons.forEach((person, index) => {
    positions.set(person.id, {
      x: index * GRID_SPACING.x,
      y: currentY,
    })
  })

  if (persons.length > 0) {
    currentY += GRID_SPACING.y
  }

  systems.forEach((system, index) => {
    positions.set(system.id, {
      x: index * GRID_SPACING.x,
      y: currentY,
    })
  })

  if (systems.length > 0) {
    currentY += GRID_SPACING.y
  }

  containers.forEach((container, index) => {
    positions.set(container.id, {
      x: index * GRID_SPACING.x,
      y: currentY,
    })
  })

  if (containers.length > 0) {
    currentY += GRID_SPACING.y
  }

  components.forEach((component, index) => {
    positions.set(component.id, {
      x: index * GRID_SPACING.x,
      y: currentY,
    })
  })

  return positions
}

function createNode(
  element: Element,
  position: LayoutPosition,
  focusElement?: string,
  filterQuery?: string,
  onSelect?: (id: string) => void,
  onDrillDown?: (id: string) => void
): Node<NodeData> {
  const isFiltered = filterQuery && !matchesFilter(element, filterQuery)
  const baseNode = {
    id: element.id,
    position,
    className: isFiltered ? 'opacity-30' : undefined,
  }

  switch (element.type) {
    case 'person':
      return {
        ...baseNode,
        type: 'person',
        data: {
          ...element,
          onSelect,
        } as PersonNodeData,
      }

    case 'system':
      return {
        ...baseNode,
        type: 'system',
        data: {
          ...element,
          isFocus: element.id === focusElement,
          onSelect,
          onDrillDown,
        } as SystemNodeData,
      }

    case 'container':
      return {
        ...baseNode,
        type: 'container',
        data: {
          ...element,
          onSelect,
          onDrillDown,
        } as ContainerNodeData,
      }

    case 'component':
      return {
        ...baseNode,
        type: 'component',
        data: {
          ...element,
          onSelect,
        } as ComponentNodeData,
      }
  }
}

function createEdge(
  relationship: Relationship,
  elements: Element[],
  index: number
): Edge<RelationshipEdgeData> | null {
  // Find source and target elements by matching against all possible IDs
  const sourceElement = elements.find((e) => matchesElement(relationship.from, e))
  const targetElement = elements.find((e) => matchesElement(relationship.to, e))

  if (!sourceElement || !targetElement) {
    return null
  }

  return {
    id: `${relationship.from}-${relationship.to}-${index}`,
    source: sourceElement.id,
    target: targetElement.id,
    type: 'relationship',
    data: {
      description: relationship.description,
      technology: relationship.technology,
    },
    markerEnd: {
      type: 'arrowclosed',
      color: '#94a3b8',
    },
  }
}

export interface ModelToFlowOptions {
  viewType: ViewType
  focusElement?: string
  filterQuery?: string
  onSelectElement?: (id: string) => void
  onDrillDown?: (id: string) => void
}

export function modelToFlow(
  model: C4Model | null,
  options: ModelToFlowOptions
): { nodes: Node<NodeData>[]; edges: Edge<RelationshipEdgeData>[] } {
  if (!model) {
    return { nodes: [], edges: [] }
  }

  const elements = getElementsForView(model, options.viewType, options.focusElement)
  const positions = calculateLayout(elements)

  const nodes = elements.map((element) => {
    const position = positions.get(element.id) || { x: 0, y: 0 }
    return createNode(element, position, options.focusElement, options.filterQuery, options.onSelectElement, options.onDrillDown)
  })

  const edges = model.relationships
    .map((rel, index) => createEdge(rel, elements, index))
    .filter((edge): edge is Edge<RelationshipEdgeData> => edge !== null)

  return { nodes, edges }
}
