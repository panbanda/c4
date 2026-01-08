import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { BASE_NODE_CLASSES, ELEMENT_COLORS, NODE_SIZES } from './nodeStyles'
import { TechIcon } from './TechIcon'
import { useStore } from '../../store/useStore'
import { ConnectionBadge, FlowBadge } from './NodeBadge'
import type { Component } from '../../types/c4'

export interface ComponentNodeData extends Component {
  onSelect?: (id: string) => void
  [key: string]: unknown
}

export const ComponentNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as ComponentNodeData

  const handleClick = () => {
    if (nodeData.onSelect) {
      nodeData.onSelect(nodeData.id)
    }
  }

  const tech = Array.isArray(nodeData.technology) ? nodeData.technology : []

  const centralityData = useStore((state) => state.centralityData)
  const centrality = centralityData?.centrality[nodeData.id]
  const flowCount = centralityData?.flowParticipation[nodeData.id]?.length || 0

  return (
    <div
      className={`relative ${BASE_NODE_CLASSES.container} ${ELEMENT_COLORS.component.default} border-2 ${
        selected ? BASE_NODE_CLASSES.selected : ''
      } cursor-pointer`}
      style={{ width: NODE_SIZES.component.width, height: NODE_SIZES.component.height }}
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

      <div className="flex flex-col h-full p-2">
        {/* Header with icon and name */}
        <div className="flex items-center justify-center gap-2 mb-1">
          <TechIcon technology={tech} className="w-4 h-4 shrink-0" />
          <div className={`${BASE_NODE_CLASSES.title} text-white text-center`}>
            {nodeData.name}
          </div>
        </div>

        {/* Description */}
        {nodeData.description && (
          <div className={`${BASE_NODE_CLASSES.description} text-center flex-1 line-clamp-2`}>
            {nodeData.description}
          </div>
        )}

        {/* Footer with tech badges and type */}
        <div className="mt-auto pt-1 space-y-1">
          {tech.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1">
              {tech.map((t, i) => (
                <span key={i} className="px-1.5 py-0.5 bg-slate-600 rounded text-[10px] text-slate-300">
                  {t}
                </span>
              ))}
            </div>
          )}
          <div className="text-slate-500 text-[10px] text-center">[Component]</div>
        </div>
      </div>
    </div>
  )
})

ComponentNode.displayName = 'ComponentNode'
