import ELK, { ElkNode, ElkExtendedEdge } from 'elkjs/lib/elk.bundled.js'
import type { Element, Relationship } from '../types/c4'

const elk = new ELK()

/**
 * Semantic layers for C4 diagrams (top to bottom):
 * 0 - Persons/Users
 * 1 - External Systems
 * 2 - Entry Points (gateways, frontends, load balancers)
 * 3 - Services (application logic, workers)
 * 4 - Data Stores (databases, caches, queues, storage)
 */
type SemanticLayer = 0 | 1 | 2 | 3 | 4

// Keywords to identify entry point containers
const ENTRY_POINT_KEYWORDS = [
  'gateway', 'api-gateway', 'frontend', 'web', 'mobile', 'app',
  'load-balancer', 'proxy', 'nginx', 'cdn', 'edge', 'ingress',
  'graphql', 'rest-api', 'bff', 'router'
]

// Keywords to identify data store containers
const DATA_STORE_KEYWORDS = [
  'database', 'db', 'postgres', 'postgresql', 'mysql', 'mongodb', 'mongo',
  'redis', 'cache', 'memcached', 'elasticsearch', 'elastic',
  'kafka', 'queue', 'rabbitmq', 'sqs', 'pubsub', 'kinesis', 'stream',
  'storage', 's3', 'blob', 'bucket', 'warehouse', 'redshift', 'bigquery',
  'dragonfly', 'dynamodb', 'cassandra', 'cockroach', 'timescale'
]

/**
 * Determine the semantic layer for an element based on its type, tags, and technology
 */
function getSemanticLayer(element: Element): SemanticLayer {
  // Persons are always at the top
  if (element.type === 'person') {
    return 0
  }

  // External systems are in layer 1
  if (element.type === 'system') {
    if ('external' in element && element.external) {
      return 1
    }
    // Internal systems treated as services
    return 3
  }

  // For containers and components, analyze tags and technology
  const techArray = 'technology' in element && element.technology ? element.technology : []
  const searchText = [
    element.name,
    element.description || '',
    ...(element.tags || []),
    ...techArray
  ].join(' ').toLowerCase()

  // Check for data store patterns first (they're usually dependencies)
  for (const keyword of DATA_STORE_KEYWORDS) {
    if (searchText.includes(keyword)) {
      return 4
    }
  }

  // Check for entry point patterns
  for (const keyword of ENTRY_POINT_KEYWORDS) {
    if (searchText.includes(keyword)) {
      return 2
    }
  }

  // Default to service layer
  return 3
}

/**
 * Node dimensions for different element types
 */
export const NODE_DIMENSIONS = {
  person: { width: 200, height: 180 },
  system: { width: 280, height: 200 },
  container: { width: 280, height: 160 },
  component: { width: 240, height: 120 },
  deploymentNode: { width: 300, height: 180 },
  deploymentGroup: { width: 400, height: 300 }, // Min size, calculated dynamically
} as const

/**
 * ELK layout options optimized for C4 architecture diagrams
 */
const ELK_OPTIONS = {
  'elk.algorithm': 'layered',
  'elk.direction': 'DOWN',
  // Layer spacing (vertical gap between semantic layers)
  'elk.layered.spacing.nodeNodeBetweenLayers': '120',
  // Node spacing within same layer
  'elk.spacing.nodeNode': '60',
  // Edge spacing
  'elk.spacing.edgeNode': '40',
  'elk.spacing.edgeEdge': '20',
  // Crossing minimization
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  // Node placement for balanced layout
  'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
  'elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED',
  // Edge routing
  'elk.layered.edgeRouting': 'ORTHOGONAL',
  // Consider node size
  'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
  // Padding around the graph
  'elk.padding': '[top=50, left=50, bottom=50, right=50]',
}

interface LayoutInput {
  elements: Element[]
  relationships: Relationship[]
}

interface LayoutResult {
  positions: Map<string, { x: number; y: number }>
  width: number
  height: number
}

/**
 * Calculate layout for elements using ELK with semantic layering
 */
export async function calculateElkLayout(input: LayoutInput): Promise<LayoutResult> {
  const { elements, relationships } = input

  if (elements.length === 0) {
    return { positions: new Map(), width: 0, height: 0 }
  }

  // Build ELK graph structure
  const elkNodes: ElkNode[] = elements.map((element) => {
    const dimensions = NODE_DIMENSIONS[element.type] || NODE_DIMENSIONS.container
    const layer = getSemanticLayer(element)

    return {
      id: element.id,
      width: dimensions.width,
      height: dimensions.height,
      // Assign to semantic layer
      layoutOptions: {
        'elk.layered.layering.layerConstraint': layerToConstraint(layer),
      },
    }
  })

  // Build element ID lookup for relationship matching
  const elementIds = new Set(elements.map((e) => e.id))
  const elementIdMap = buildElementIdMap(elements)

  // Build edges, resolving hierarchical IDs to simple IDs
  const elkEdges: ElkExtendedEdge[] = relationships
    .map((rel, index) => {
      const sourceId = resolveElementId(rel.from, elementIdMap)
      const targetId = resolveElementId(rel.to, elementIdMap)

      // Only include edges where both endpoints exist in current view
      if (!sourceId || !targetId || !elementIds.has(sourceId) || !elementIds.has(targetId)) {
        return null
      }

      return {
        id: `e${index}`,
        sources: [sourceId],
        targets: [targetId],
      }
    })
    .filter((e): e is ElkExtendedEdge => e !== null)

  const elkGraph: ElkNode = {
    id: 'root',
    layoutOptions: ELK_OPTIONS,
    children: elkNodes,
    edges: elkEdges,
  }

  try {
    console.log('ELK: Starting layout with', elkNodes.length, 'nodes and', elkEdges.length, 'edges')
    const layoutedGraph = await elk.layout(elkGraph)
    console.log('ELK: Layout successful')

    const positions = new Map<string, { x: number; y: number }>()
    for (const node of layoutedGraph.children || []) {
      positions.set(node.id, {
        x: node.x || 0,
        y: node.y || 0,
      })
    }

    return {
      positions,
      width: layoutedGraph.width || 0,
      height: layoutedGraph.height || 0,
    }
  } catch (error) {
    console.error('ELK layout failed:', error)
    console.error('ELK graph:', JSON.stringify(elkGraph, null, 2))
    // Fallback to simple grid layout
    return fallbackGridLayout(elements)
  }
}

/**
 * Convert semantic layer to ELK layer constraint
 * Note: FIRST/LAST constraints are too strict - they fail if edges violate the constraint.
 * Instead, we use NONE and let ELK determine layers based on edge direction.
 */
function layerToConstraint(_layer: SemanticLayer): string {
  // Let ELK determine layers based on edge direction
  // Nodes with no incoming edges (sources) naturally go to top
  // Nodes with no outgoing edges (sinks) naturally go to bottom
  return 'NONE'
}

/**
 * Build a map from hierarchical IDs to simple element IDs
 */
function buildElementIdMap(elements: Element[]): Map<string, string> {
  const map = new Map<string, string>()

  for (const element of elements) {
    // Map simple ID to itself
    map.set(element.id, element.id)

    // Map hierarchical IDs
    if (element.type === 'container' && 'systemId' in element && element.systemId) {
      map.set(`${element.systemId}.${element.id}`, element.id)
    }
    if (element.type === 'component' && 'systemId' in element && 'containerId' in element) {
      if (element.systemId && element.containerId) {
        map.set(`${element.systemId}.${element.containerId}.${element.id}`, element.id)
      }
    }
  }

  return map
}

/**
 * Resolve a relationship endpoint ID to a simple element ID
 */
function resolveElementId(relationshipId: string, elementIdMap: Map<string, string>): string | null {
  return elementIdMap.get(relationshipId) || null
}

/**
 * Fallback grid layout if ELK fails
 */
function fallbackGridLayout(elements: Element[]): LayoutResult {
  const positions = new Map<string, { x: number; y: number }>()
  const SPACING = { x: 320, y: 200 }
  const COLS = 4

  elements.forEach((element, index) => {
    const col = index % COLS
    const row = Math.floor(index / COLS)
    positions.set(element.id, {
      x: col * SPACING.x,
      y: row * SPACING.y,
    })
  })

  const cols = Math.min(elements.length, COLS)
  const rows = Math.ceil(elements.length / COLS)

  return {
    positions,
    width: cols * SPACING.x,
    height: rows * SPACING.y,
  }
}
