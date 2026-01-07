import { useCallback, useState, useMemo } from 'react'
import { ReactFlow, Background, Controls, MiniMap, Node } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { useStore } from '../store/useStore'
import { useElkLayout } from '../hooks/useElkLayout'
import { useCanvasKeyboard } from '../hooks/useCanvasKeyboard'

import { PersonNode } from './nodes/PersonNode'
import { SystemNode } from './nodes/SystemNode'
import { ContainerNode } from './nodes/ContainerNode'
import { ComponentNode } from './nodes/ComponentNode'
import { DeploymentNode } from './nodes/DeploymentNode'
import { DeploymentGroupNode } from './nodes/DeploymentGroupNode'
import { InstanceNode } from './nodes/InstanceNode'
import { AnimatedFlowEdge } from './edges/AnimatedFlowEdge'
import { ViewModeSwitcher } from './ViewModeSwitcher'

const nodeTypes = {
  person: PersonNode,
  system: SystemNode,
  container: ContainerNode,
  component: ComponentNode,
  deploymentNode: DeploymentNode,
  deploymentGroup: DeploymentGroupNode,
  instanceNode: InstanceNode,
} as const

const edgeTypes = {
  relationship: AnimatedFlowEdge,
} as const

export function Canvas() {
  const { model, currentView, focusElement, selectElement, setView, selectedElement, filterQuery } = useStore()
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  const handleSelectElement = useCallback(
    (id: string) => {
      selectElement(id)
    },
    [selectElement]
  )

  const handleDrillDown = useCallback(
    (id: string) => {
      const element = model?.systems.find((s) => s.id === id) ||
                      model?.containers.find((c) => c.id === id)

      if (!element) return

      if (element.type === 'system') {
        // Only drill down if there are containers in this system
        const hasContainers = model?.containers.some((c) => c.systemId === id)
        if (hasContainers) {
          setView('container', id)
        }
      } else if (element.type === 'container') {
        // Drill down to show focused view (components or connections)
        setView('component', id)
      }
    },
    [model, setView]
  )

  const handleNodeMouseEnter = useCallback((_: React.MouseEvent, node: Node) => {
    // Skip hover tracking for deployment view (causes nested node flickering)
    if (currentView === 'deployment') return
    setHoveredNode(node.id)
  }, [currentView])

  const handleNodeMouseLeave = useCallback(() => {
    if (currentView === 'deployment') return
    setHoveredNode(null)
  }, [currentView])

  // Use ELK layout with semantic layering
  const { nodes, edges, isLayouting } = useElkLayout(model, {
    viewType: currentView,
    focusElement: focusElement ?? undefined,
    selectedElement: selectedElement ?? undefined,
    filterQuery,
    onSelectElement: handleSelectElement,
    onDrillDown: handleDrillDown,
  })

  const connectedNodeIds = useMemo(() => {
    const activeNode = hoveredNode || selectedElement
    if (!activeNode) return new Set<string>()

    const connected = new Set<string>([activeNode])
    edges.forEach((edge) => {
      if (edge.source === activeNode) {
        connected.add(edge.target)
      }
      if (edge.target === activeNode) {
        connected.add(edge.source)
      }
    })

    return connected
  }, [hoveredNode, selectedElement, edges])

  const activeNode = hoveredNode || selectedElement

  const nodesWithHoverState = useMemo(() => {
    // Skip hover highlighting for deployment view (no edges, causes nested node flickering)
    if (!activeNode || currentView === 'deployment') return nodes

    return nodes.map((node) => ({
      ...node,
      className: `${node.className || ''} ${connectedNodeIds.has(node.id) ? 'highlighted' : 'dimmed'}`.trim(),
    }))
  }, [nodes, activeNode, connectedNodeIds, currentView])

  const edgesWithHoverState = useMemo(() => {
    if (!activeNode) return edges

    return edges.map((edge) => {
      const isConnected = edge.source === activeNode || edge.target === activeNode
      return {
        ...edge,
        data: {
          ...edge.data,
          isDimmed: !isConnected,
          isHighlighted: isConnected,
        },
      }
    })
  }, [edges, activeNode])

  useCanvasKeyboard({
    model,
    currentView,
    focusElement,
    selectedElement,
    selectElement,
    setView,
  })

  // Generate a stable key that changes when layout completes
  const layoutKey = `${currentView}-${focusElement ?? 'none'}-${nodes.length}`

  return (
    <div className="w-full h-full bg-[#1a1a1a] relative" role="main" aria-label="Architecture diagram">
      {isLayouting && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a]/80 z-50">
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            <span>Computing layout...</span>
          </div>
        </div>
      )}
      <ReactFlow
        key={layoutKey}
        nodes={nodesWithHoverState as any}
        edges={edgesWithHoverState as any}
        nodeTypes={nodeTypes as any}
        edgeTypes={edgeTypes as any}
        onNodeMouseEnter={handleNodeMouseEnter}
        onNodeMouseLeave={handleNodeMouseLeave}
        fitView
        fitViewOptions={{ padding: 0.15, maxZoom: 1.5 }}
        className="bg-[#242424]"
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'relationship',
        }}
      >
        <Background color="#333" gap={16} />
        <Controls />
        {model?.options?.showMinimap && (
          <MiniMap
            className="bg-[#1a1a1a] border-[#333333]"
            nodeColor={(node) => {
              switch (node.type) {
                case 'person':
                  return '#3b82f6'
                case 'system':
                  return '#1d4ed8'
                case 'container':
                  return '#6366f1'
                case 'component':
                  return '#64748b'
                case 'deploymentNode':
                  return '#d97706'
                case 'deploymentGroup':
                  return '#92400e'
                default:
                  return '#64748b'
              }
            }}
            ariaLabel="Mini map overview"
          />
        )}
      </ReactFlow>
      <ViewModeSwitcher />
      {/* Hide React Flow attribution */}
      <style>{`.react-flow__attribution { display: none !important; }`}</style>
    </div>
  )
}
