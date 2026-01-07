import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { BASE_NODE_CLASSES, ELEMENT_COLORS, NODE_SIZES } from './nodeStyles'
import { TechIcon } from './TechIcon'
import { useStore } from '../../store/useStore'
import { ConnectionBadge, FlowBadge, ChildrenBadge } from './NodeBadge'
import type { Container } from '../../types/c4'

export interface ContainerNodeData extends Container {
  onSelect?: (id: string) => void
  onDrillDown?: (id: string) => void
  [key: string]: unknown
}

export const ContainerNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as ContainerNodeData

  const handleClick = () => {
    if (nodeData.onSelect) {
      nodeData.onSelect(nodeData.id)
    }
  }

  const handleDoubleClick = () => {
    if (nodeData.onDrillDown) {
      nodeData.onDrillDown(nodeData.id)
    }
  }

  const tech = Array.isArray(nodeData.technology) ? nodeData.technology : []

  const centralityData = useStore((state) => state.centralityData)
  const centrality = centralityData?.centrality[nodeData.id]
  const flowCount = centralityData?.flowParticipation[nodeData.id]?.length || 0
  const childrenCount = centralityData?.childrenCount[nodeData.id] || 0

  return (
    <div
      className={`relative ${BASE_NODE_CLASSES.container} ${ELEMENT_COLORS.container.default} border-2 ${
        selected ? BASE_NODE_CLASSES.selected : ''
      } hover:${BASE_NODE_CLASSES.hover} cursor-pointer`}
      style={{ width: NODE_SIZES.container.width, height: NODE_SIZES.container.height }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <ConnectionBadge
        incoming={centrality?.incoming || 0}
        outgoing={centrality?.outgoing || 0}
      />
      <FlowBadge flowCount={flowCount} />
      <ChildrenBadge count={childrenCount} />
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-blue-400" />
      <Handle type="target" position={Position.Left} className="w-2 h-2 bg-blue-400" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-blue-400" />
      <Handle type="source" position={Position.Right} className="w-2 h-2 bg-blue-400" />

      <div className="flex flex-col h-full p-3">
        {/* Header with icon and name */}
        <div className="flex items-center gap-2 mb-1">
          <TechIcon technology={tech} className="w-5 h-5 shrink-0" />
          <div className={`${BASE_NODE_CLASSES.title} text-white`}>{nodeData.name}</div>
        </div>

        {/* Description */}
        {nodeData.description && (
          <div className={`${BASE_NODE_CLASSES.description} flex-1 overflow-hidden`}>
            {nodeData.description}
          </div>
        )}

        {/* Footer with type and tech badges */}
        <div className="mt-auto pt-2 space-y-1">
          {tech.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tech.map((t, i) => (
                <span key={i} className="px-1.5 py-0.5 bg-slate-600 rounded text-[10px] text-slate-300">
                  {t}
                </span>
              ))}
            </div>
          )}
          <div className="text-slate-500 text-[10px] text-center">[Container]</div>
        </div>
      </div>
    </div>
  )
})

ContainerNode.displayName = 'ContainerNode'
