import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { BASE_NODE_CLASSES, ELEMENT_COLORS, NODE_SIZES } from './nodeStyles'
import { useStore } from '../../store/useStore'
import { ConnectionBadge, FlowBadge } from './NodeBadge'
import type { Person } from '../../types/c4'

export interface PersonNodeData extends Person {
  onSelect?: (id: string) => void
  [key: string]: unknown
}

export const PersonNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as PersonNodeData
  const isExternal = nodeData.tags?.includes('external')
  const colorClass = isExternal ? ELEMENT_COLORS.person.external : ELEMENT_COLORS.person.internal

  const handleClick = () => {
    if (nodeData.onSelect) {
      nodeData.onSelect(nodeData.id)
    }
  }

  const centralityData = useStore((state) => state.centralityData)
  const centrality = centralityData?.centrality[nodeData.id]
  const flowCount = centralityData?.flowParticipation[nodeData.id]?.length || 0

  return (
    <div
      className={`relative ${BASE_NODE_CLASSES.container} ${colorClass} border-2 ${
        selected ? BASE_NODE_CLASSES.selected : ''
      } cursor-pointer`}
      style={{ width: NODE_SIZES.person.width, height: NODE_SIZES.person.height }}
      onClick={handleClick}
    >
      <ConnectionBadge
        incoming={centrality?.incoming || 0}
        outgoing={centrality?.outgoing || 0}
      />
      <FlowBadge flowCount={flowCount} />
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-blue-400" />
      <Handle type="target" position={Position.Left} className="w-2 h-2 bg-blue-400" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-blue-400" />
      <Handle type="source" position={Position.Right} className="w-2 h-2 bg-blue-400" />

      <div className="flex flex-col items-center h-full p-3">
        {/* Person icon */}
        <div className="mb-2">
          <svg
            className="w-10 h-10 text-slate-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>

        {/* Name */}
        <div className={`${BASE_NODE_CLASSES.title} text-center text-white`}>
          {nodeData.name}
        </div>

        {/* Description */}
        {nodeData.description && (
          <div className={`${BASE_NODE_CLASSES.description} text-center flex-1 mt-1`}>
            {nodeData.description}
          </div>
        )}

        {/* Type label at bottom */}
        <div className="mt-auto pt-2">
          <div className="text-slate-400 text-xs text-center">[Actor]</div>
        </div>
      </div>
    </div>
  )
})

PersonNode.displayName = 'PersonNode'
