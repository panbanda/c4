import React, { useEffect, useState, useCallback } from 'react'
import type { Node, Edge } from '@xyflow/react'
import type { C4Model, Element, ViewType, DeploymentNode, FlatDeploymentNode, FlatInstanceNode, DeploymentElement } from '../types/c4'
import { calculateElkLayout, NODE_DIMENSIONS } from '../utils/elkLayout'
import { getElementIds, matchesElement, matchesFilter } from '../utils/elementHelpers'
import type { PersonNodeData } from '../components/nodes/PersonNode'
import type { SystemNodeData } from '../components/nodes/SystemNode'
import type { ContainerNodeData } from '../components/nodes/ContainerNode'
import type { ComponentNodeData } from '../components/nodes/ComponentNode'
import type { DeploymentNodeData } from '../components/nodes/DeploymentNode'
import type { DeploymentGroupNodeData } from '../components/nodes/DeploymentGroupNode'
import type { InstanceNodeData } from '../components/nodes/InstanceNode'
import type { RelationshipEdgeData } from '../components/edges/RelationshipEdge'

type NodeData = PersonNodeData | SystemNodeData | ContainerNodeData | ComponentNodeData | DeploymentNodeData | DeploymentGroupNodeData | InstanceNodeData

interface UseElkLayoutOptions {
  viewType: ViewType
  focusElement?: string
  selectedElement?: string
  filterQuery?: string
  onSelectElement?: (id: string) => void
  onDrillDown?: (id: string) => void
}

interface UseElkLayoutResult {
  nodes: Node<NodeData>[]
  edges: Edge<RelationshipEdgeData>[]
  isLayouting: boolean
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

        // Collect all endpoint IDs from relationships involving this container
        const connectedIds = new Set<string>()
        model.relationships.forEach((r) => {
          if (containerIds.includes(r.from)) connectedIds.add(r.to)
          if (containerIds.includes(r.to)) connectedIds.add(r.from)
        })

        // Helper to check if element matches any connected ID
        const isConnected = (element: Element): boolean => {
          const elementIds = getElementIds(element)
          return elementIds.some(id => connectedIds.has(id))
        }

        const connectedPersons = model.persons.filter(isConnected)
        const connectedSystems = model.systems.filter(isConnected)
        const connectedContainers = model.containers.filter((c) =>
          c.id !== container.id && isConnected(c)
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

    case 'deployment':
      // Deployment view returns empty for regular elements - handled separately
      return []

    default:
      return []
  }
}

/**
 * Flatten hierarchical deployment nodes into a list for rendering.
 * Nodes with children are marked as groups and will be rendered as containers.
 * Nodes with instances (and no children) will have instance nodes created as children.
 *
 * @param containerFilter - Optional array of container refs to filter instances by
 */
function flattenDeploymentNodes(
  nodes: DeploymentNode[],
  depth: number = 0,
  parentId?: string,
  containerFilter?: string[]
): DeploymentElement[] {
  const result: DeploymentElement[] = []

  for (const node of nodes) {
    const hasChildren = node.children && node.children.length > 0

    // Filter instances if containerFilter is provided
    let instances = node.instances || []
    if (containerFilter && instances.length > 0) {
      instances = instances.filter((inst) =>
        containerFilter.some((ref) =>
          inst.container.includes(ref) || ref.includes(inst.container)
        )
      )
    }

    const hasInstances = instances.length > 0

    // A node becomes a "group" if it has children OR instances
    const isGroup = hasChildren || hasInstances

    const flatNode: FlatDeploymentNode = {
      type: 'deploymentNode',
      id: node.id,
      name: node.name,
      technology: Array.isArray(node.technology) ? node.technology : node.technology ? [node.technology] : [],
      depth,
      parentId,
      instances: instances,
      hasChildren: isGroup,
      childCount: hasChildren ? node.children!.length : (hasInstances ? instances.length : 0),
    }
    result.push(flatNode)

    // Recursively flatten children
    if (hasChildren) {
      result.push(...flattenDeploymentNodes(node.children!, depth + 1, node.id, containerFilter))
    }

    // Create instance nodes for leaf nodes with instances
    if (!hasChildren && hasInstances) {
      for (const instance of instances) {
        const instanceNode: FlatInstanceNode = {
          type: 'instanceNode',
          id: `${node.id}-instance-${instance.container.replace(/\./g, '-')}`,
          name: instance.container,
          containerRef: instance.container,
          replicas: instance.replicas,
          parentId: node.id,
          depth: depth + 1,
        }
        result.push(instanceNode)
      }
    }
  }

  return result
}

/**
 * Find deployment nodes that contain a specific container instance
 * Returns the IDs of nodes that should be shown (nodes with the instance + their ancestors)
 */
function findNodesWithContainer(
  nodes: DeploymentNode[],
  containerRef: string,
  parentPath: string[] = []
): Set<string> {
  const result = new Set<string>()

  for (const node of nodes) {
    const currentPath = [...parentPath, node.id]

    // Check if this node has instances matching the container
    const hasMatchingInstance = node.instances?.some((inst) => {
      // Match by container reference (e.g., "my-system.my-container")
      return inst.container.includes(containerRef) || containerRef.includes(inst.container)
    })

    if (hasMatchingInstance) {
      // Add this node and all its ancestors
      currentPath.forEach((id) => result.add(id))
    }

    // Recurse into children
    if (node.children) {
      const childResults = findNodesWithContainer(node.children, containerRef, currentPath)
      childResults.forEach((id) => result.add(id))
    }
  }

  return result
}

/**
 * Filter deployment nodes to only include those in the allowed set
 */
function filterDeploymentNodes(
  nodes: DeploymentNode[],
  allowedIds: Set<string>
): DeploymentNode[] {
  return nodes
    .filter((node) => allowedIds.has(node.id))
    .map((node) => ({
      ...node,
      children: node.children ? filterDeploymentNodes(node.children, allowedIds) : undefined,
    }))
}

/**
 * Get deployment nodes for a specific deployment environment
 * If selectedElement is provided, filter to only show nodes containing that element
 */
function getDeploymentElements(
  model: C4Model,
  focusElement?: string,
  selectedElement?: string
): DeploymentElement[] {
  if (!focusElement) {
    // If no focus, show first deployment or empty
    const deployment = model.deployments[0]
    if (!deployment || !deployment.nodes) return []
    return flattenDeploymentNodes(deployment.nodes)
  }

  const deployment = model.deployments.find(d => d.id === focusElement)
  if (!deployment || !deployment.nodes) return []

  // If we have a selected element, filter deployment to only show relevant nodes
  if (selectedElement) {
    // Build container reference patterns to search for
    const container = model.containers.find((c) => c.id === selectedElement)
    const system = model.systems.find((s) => s.id === selectedElement)

    let containerRefs: string[] = []

    if (container) {
      // Search for this specific container
      containerRefs = [
        container.id,
        `${container.systemId}.${container.id}`,
      ]
    } else if (system) {
      // Search for all containers in this system
      containerRefs = model.containers
        .filter((c) => c.systemId === system.id)
        .flatMap((c) => [c.id, `${system.id}.${c.id}`])
    }

    if (containerRefs.length > 0) {
      // Find nodes that contain these containers
      const relevantNodeIds = new Set<string>()
      for (const ref of containerRefs) {
        const nodeIds = findNodesWithContainer(deployment.nodes, ref)
        nodeIds.forEach((id) => relevantNodeIds.add(id))
      }

      if (relevantNodeIds.size > 0) {
        const filteredNodes = filterDeploymentNodes(deployment.nodes, relevantNodeIds)
        // Pass containerRefs to also filter instances to only show matching ones
        return flattenDeploymentNodes(filteredNodes, 0, undefined, containerRefs)
      }
    }
  }

  return flattenDeploymentNodes(deployment.nodes)
}

function createNode(
  element: Element,
  position: { x: number; y: number },
  focusElement?: string,
  selectedElement?: string,
  filterQuery?: string,
  onSelect?: (id: string) => void,
  onDrillDown?: (id: string) => void
): Node<NodeData> {
  const isFiltered = filterQuery && !matchesFilter(element, filterQuery)
  const dimensions = NODE_DIMENSIONS[element.type] || NODE_DIMENSIONS.container

  const baseNode = {
    id: element.id,
    position,
    selected: element.id === selectedElement,
    className: isFiltered ? 'opacity-30' : undefined,
    width: dimensions.width,
    height: dimensions.height,
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
  relationship: { from: string; to: string; description?: string; technology?: string[] },
  elements: Element[],
  index: number
): Edge<RelationshipEdgeData> | null {
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
      width: 20,
      height: 20,
    },
  }
}

// Track current computation to handle race conditions
let layoutComputationId = 0

export function useElkLayout(
  model: C4Model | null,
  options: UseElkLayoutOptions
): UseElkLayoutResult {
  const [nodes, setNodes] = useState<Node<NodeData>[]>([])
  const [edges, setEdges] = useState<Edge<RelationshipEdgeData>[]>([])
  const [isLayouting, setIsLayouting] = useState(false)

  const { viewType, focusElement, selectedElement, filterQuery, onSelectElement, onDrillDown } = options

  // Use ref for selectedElement to avoid triggering layout recomputation on selection change.
  // Selection styling is handled by Canvas.tsx through nodesWithHoverState - layout positions don't depend on it.
  const selectedElementRef = React.useRef(selectedElement)
  selectedElementRef.current = selectedElement

  const computeLayout = useCallback(async () => {
    if (!model) {
      setNodes([])
      setEdges([])
      return
    }

    // Increment computation ID to invalidate any in-flight computations
    const thisComputationId = ++layoutComputationId

    setIsLayouting(true)

    // Helper to check if this computation is still current
    const isStale = () => thisComputationId !== layoutComputationId

    try {
      console.log('Layout: viewType=', viewType, 'focusElement=', focusElement, 'selectedElement=', selectedElementRef.current, 'computationId=', thisComputationId)

      // Handle deployment view separately with nested group nodes
      if (viewType === 'deployment') {
        const deploymentElements = getDeploymentElements(model, focusElement, selectedElementRef.current)
        console.log('Deployment elements:', deploymentElements.length, deploymentElements.map(n => n.id))

        if (deploymentElements.length === 0) {
          setNodes([])
          setEdges([])
          setIsLayouting(false)
          return
        }

        // Build a map for quick lookup
        const elementMap = new Map<string, DeploymentElement>()
        for (const element of deploymentElements) {
          elementMap.set(element.id, element)
        }

        // Group children by parent
        const childrenByParent = new Map<string, DeploymentElement[]>()
        const rootNodes: DeploymentElement[] = []

        for (const element of deploymentElements) {
          if (element.parentId) {
            const siblings = childrenByParent.get(element.parentId) || []
            siblings.push(element)
            childrenByParent.set(element.parentId, siblings)
          } else {
            rootNodes.push(element)
          }
        }

        // Calculate sizes bottom-up (leaf nodes have fixed size, groups contain children)
        const nodeSizes = new Map<string, { width: number; height: number }>()
        const DEPLOYMENT_SIZE = { width: NODE_DIMENSIONS.deploymentNode.width, height: NODE_DIMENSIONS.deploymentNode.height }
        const INSTANCE_SIZE = { width: 180, height: 70 }
        const PADDING = { x: 24, y: 24, top: 70 } // Padding inside groups (top clears header ~60px)
        const SPACING = { x: 30, y: 30 } // Spacing between siblings

        function calculateSize(elementId: string): { width: number; height: number } {
          const element = elementMap.get(elementId)
          if (!element) return DEPLOYMENT_SIZE

          // Instance nodes are always leaves
          if (element.type === 'instanceNode') {
            nodeSizes.set(elementId, INSTANCE_SIZE)
            return INSTANCE_SIZE
          }

          const children = childrenByParent.get(elementId) || []

          // Leaf deployment node (no children, no instances)
          if (children.length === 0) {
            nodeSizes.set(elementId, DEPLOYMENT_SIZE)
            return DEPLOYMENT_SIZE
          }

          // Group node - size based on children
          const childSizes = children.map(c => calculateSize(c.id))

          // Arrange children horizontally
          const totalChildWidth = childSizes.reduce((sum, s) => sum + s.width, 0) +
            (children.length - 1) * SPACING.x
          const maxChildHeight = Math.max(...childSizes.map(s => s.height))

          const groupSize = {
            width: Math.max(300, totalChildWidth + PADDING.x * 2),
            height: maxChildHeight + PADDING.top + PADDING.y, // top padding + bottom padding
          }

          nodeSizes.set(elementId, groupSize)
          return groupSize
        }

        // Calculate all sizes
        for (const root of rootNodes) {
          calculateSize(root.id)
        }

        // Calculate positions (relative to parent for children)
        const nodePositions = new Map<string, { x: number; y: number }>()

        function calculatePositions(
          elements: DeploymentElement[],
          startX: number,
          startY: number
        ): void {
          let currentX = startX

          for (const element of elements) {
            const size = nodeSizes.get(element.id) || DEPLOYMENT_SIZE
            nodePositions.set(element.id, { x: currentX, y: startY })

            // Position children relative to this element (use top padding for y offset)
            const children = childrenByParent.get(element.id) || []
            if (children.length > 0) {
              calculatePositions(children, PADDING.x, PADDING.top)
            }

            currentX += size.width + SPACING.x
          }
        }

        calculatePositions(rootNodes, 0, 0)

        // Create React Flow nodes
        const flowNodes: Node<NodeData>[] = []

        // Process nodes in order (parents before children for React Flow)
        function addElement(element: DeploymentElement): void {
          const size = nodeSizes.get(element.id) || DEPLOYMENT_SIZE
          const position = nodePositions.get(element.id) || { x: 0, y: 0 }

          if (element.type === 'instanceNode') {
            // Instance node (pod)
            flowNodes.push({
              id: element.id,
              type: 'instanceNode',
              position,
              style: { width: size.width, height: size.height },
              parentId: element.parentId,
              extent: element.parentId ? 'parent' : undefined,
              data: {
                ...element,
                onSelect: onSelectElement,
              } as InstanceNodeData,
            })
          } else {
            // Deployment node
            const isGroup = element.hasChildren

            if (isGroup) {
              flowNodes.push({
                id: element.id,
                type: 'deploymentGroup',
                position,
                style: { width: size.width, height: size.height },
                parentId: element.parentId,
                extent: element.parentId ? 'parent' : undefined,
                data: {
                  ...element,
                  childCount: element.childCount || 0,
                  onSelect: onSelectElement,
                } as DeploymentGroupNodeData,
              })
            } else {
              flowNodes.push({
                id: element.id,
                type: 'deploymentNode',
                position,
                style: { width: size.width, height: size.height },
                parentId: element.parentId,
                extent: element.parentId ? 'parent' : undefined,
                data: {
                  ...element,
                  onSelect: onSelectElement,
                } as DeploymentNodeData,
              })
            }
          }

          // Add children
          const children = childrenByParent.get(element.id) || []
          for (const child of children) {
            addElement(child)
          }
        }

        for (const root of rootNodes) {
          addElement(root)
        }

        // No edges for deployment view - containment is shown visually
        // Check if this computation is still current before setting state
        if (isStale()) {
          console.log('Deployment layout stale, skipping')
          return
        }
        setNodes(flowNodes)
        setEdges([])
        setIsLayouting(false)
        return
      }

      // Regular element views
      const elements = getElementsForView(model, viewType, focusElement)

      if (elements.length === 0) {
        setNodes([])
        setEdges([])
        setIsLayouting(false)
        return
      }

      // Calculate layout using ELK
      const { positions } = await calculateElkLayout({
        elements,
        relationships: model.relationships,
      })

      // Check if this computation is still current before setting state
      if (isStale()) {
        console.log('ELK layout stale, skipping')
        return
      }

      // Create React Flow nodes with calculated positions
      // Note: We don't pass selectedElement here to avoid triggering layout recomputation on selection change.
      // Selection highlighting is handled by Canvas.tsx through CSS classes.
      const flowNodes = elements.map((element) => {
        const position = positions.get(element.id) || { x: 0, y: 0 }
        return createNode(element, position, focusElement, undefined, filterQuery, onSelectElement, onDrillDown)
      })

      // Create React Flow edges
      const flowEdges = model.relationships
        .map((rel, index) => createEdge(rel, elements, index))
        .filter((edge): edge is Edge<RelationshipEdgeData> => edge !== null)

      setNodes(flowNodes)
      setEdges(flowEdges)
    } catch (error) {
      console.error('Layout computation failed:', error)
    } finally {
      setIsLayouting(false)
    }
  // Note: selectedElement is intentionally NOT in the dependency array.
  // Selection changes should not trigger layout recomputation - Canvas.tsx handles selection styling via CSS classes.
  // For deployment view, we use selectedElement from the ref for filtering, which reads the current value.
  }, [model, viewType, focusElement, filterQuery, onSelectElement, onDrillDown])

  useEffect(() => {
    computeLayout()
  }, [computeLayout])

  return { nodes, edges, isLayouting }
}
