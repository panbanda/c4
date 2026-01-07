import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { BASE_NODE_CLASSES, ELEMENT_COLORS, NODE_SIZES } from './nodeStyles'
import { useStore } from '../../store/useStore'
import { ConnectionBadge, FlowBadge, ChildrenBadge } from './NodeBadge'
import type { SoftwareSystem } from '../../types/c4'

export interface SystemNodeData extends SoftwareSystem {
  isFocus?: boolean
  onSelect?: (id: string) => void
  onDrillDown?: (id: string) => void
  [key: string]: unknown
}

export const SystemNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as SystemNodeData
  const colorClass = nodeData.isFocus
    ? ELEMENT_COLORS.system.focus
    : nodeData.external
    ? ELEMENT_COLORS.system.external
    : ELEMENT_COLORS.system.internal

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

  // Format type label like IcePanel
  const typeLabel = nodeData.external ? 'External System' : 'System'

  const centralityData = useStore((state) => state.centralityData)
  const centrality = centralityData?.centrality[nodeData.id]
  const flowCount = centralityData?.flowParticipation[nodeData.id]?.length || 0
  const childrenCount = centralityData?.childrenCount[nodeData.id] || 0

  return (
    <div
      className={`relative ${BASE_NODE_CLASSES.container} ${colorClass} border-2 ${
        selected ? BASE_NODE_CLASSES.selected : ''
      } hover:${BASE_NODE_CLASSES.hover} cursor-pointer`}
      style={{ width: NODE_SIZES.system.width, height: NODE_SIZES.system.height }}
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
        {/* Name */}
        <div className={`${BASE_NODE_CLASSES.title} text-white mb-2`}>
          {nodeData.name}
        </div>

        {/* Description */}
        <div className="flex-1 overflow-hidden">
          {nodeData.description && (
            <div className={BASE_NODE_CLASSES.description}>{nodeData.description}</div>
          )}
        </div>

        {/* Type label at bottom */}
        <div className="mt-auto pt-2">
          <div className="text-slate-400 text-xs text-center">[{typeLabel}]</div>
        </div>
      </div>
    </div>
  )
})

SystemNode.displayName = 'SystemNode'
