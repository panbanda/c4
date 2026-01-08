import { useCallback, useMemo, useEffect, useRef } from 'react'
import { ReactFlow, Background, Controls, MiniMap, useReactFlow, ReactFlowProvider } from '@xyflow/react'
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
import { EdgeLegend } from './EdgeLegend'

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

function CanvasContent() {
  const { model, currentView, focusElement, selectElement, setView, selectedElement, filterQuery, flowHighlightedNodes, activeFlow } = useStore()
  const { fitView, getNodes } = useReactFlow()
  const prevFlowNodesRef = useRef<string[]>([])

  // Pan to flow-highlighted nodes when they change
  useEffect(() => {
    if (!flowHighlightedNodes || flowHighlightedNodes.length === 0) return
    if (JSON.stringify(flowHighlightedNodes) === JSON.stringify(prevFlowNodesRef.current)) return

    prevFlowNodesRef.current = flowHighlightedNodes

    // Wait for nodes to be rendered, then fit view to highlighted nodes
    requestAnimationFrame(() => {
      const allNodes = getNodes()
      const targetNodes = allNodes.filter(n => flowHighlightedNodes.includes(n.id))
      if (targetNodes.length > 0) {
        fitView({
          nodes: targetNodes,
          padding: 0.3,
          duration: 500,
          maxZoom: 1.2
        })
      }
    })
  }, [flowHighlightedNodes, fitView, getNodes])

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

  const handlePaneClick = useCallback(() => {
    if (selectedElement) {
      selectElement(null)
    }
  }, [selectedElement, selectElement])

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
    const activeNode = selectedElement
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
  }, [selectedElement, edges])

  const nodesWithHoverState = useMemo(() => {
    // Skip hover highlighting for deployment view (no edges, causes nested node flickering)
    if (currentView === 'deployment') return nodes

    // If flow is active, highlight the flow nodes
    if (activeFlow && flowHighlightedNodes && flowHighlightedNodes.length > 0) {
      return nodes.map((node) => ({
        ...node,
        className: `${node.className || ''} ${flowHighlightedNodes.includes(node.id) ? 'flow-highlighted' : 'flow-dimmed'}`.trim(),
      }))
    }

    // Otherwise use selection-based highlighting
    if (!selectedElement) return nodes

    return nodes.map((node) => ({
      ...node,
      className: `${node.className || ''} ${connectedNodeIds.has(node.id) ? 'highlighted' : 'dimmed'}`.trim(),
    }))
  }, [nodes, selectedElement, connectedNodeIds, currentView, activeFlow, flowHighlightedNodes])

  const edgesWithHoverState = useMemo(() => {
    // If flow is active, highlight edges that connect flow nodes
    if (activeFlow && flowHighlightedNodes && flowHighlightedNodes.length >= 2) {
      return edges.map((edge) => {
        const isFlowEdge = flowHighlightedNodes.includes(edge.source) && flowHighlightedNodes.includes(edge.target)
        return {
          ...edge,
          data: {
            ...edge.data,
            isDimmed: !isFlowEdge,
            isHighlighted: isFlowEdge,
            isFlowActive: isFlowEdge,
          },
        }
      })
    }

    // Otherwise use selection-based highlighting
    if (!selectedElement) return edges

    return edges.map((edge) => {
      const isConnected = edge.source === selectedElement || edge.target === selectedElement
      return {
        ...edge,
        data: {
          ...edge.data,
          isDimmed: !isConnected,
          isHighlighted: isConnected,
        },
      }
    })
  }, [edges, selectedElement, activeFlow, flowHighlightedNodes])

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
        onPaneClick={handlePaneClick}
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
      <EdgeLegend />
      {/* Hide React Flow attribution and add flow highlight styles */}
      <style>{`
        .react-flow__attribution { display: none !important; }
        .flow-highlighted { opacity: 1 !important; }
        .flow-dimmed { opacity: 0.3 !important; }
        .dimmed { opacity: 0.3 !important; }
        .highlighted { opacity: 1 !important; }
      `}</style>
    </div>
  )
}

export function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasContent />
    </ReactFlowProvider>
  )
}
