import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { TechIcon } from './TechIcon'
import type { FlatDeploymentNode } from '../../types/c4'

export interface DeploymentGroupNodeData extends FlatDeploymentNode {
  onSelect?: (id: string) => void
  childCount: number
  [key: string]: unknown
}

/**
 * Deployment group node - a container that holds other deployment nodes.
 * Uses React Flow's nested node pattern with parentId on children.
 */
export const DeploymentGroupNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as DeploymentGroupNodeData

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (nodeData.onSelect) {
      nodeData.onSelect(nodeData.id)
    }
  }

  const tech = Array.isArray(nodeData.technology) ? nodeData.technology : []

  // Color based on depth for visual hierarchy
  const depthStyles = [
    { bg: 'bg-slate-800/90', border: 'border-amber-500', header: 'bg-amber-600/20' },
    { bg: 'bg-slate-800/80', border: 'border-amber-400', header: 'bg-amber-500/20' },
    { bg: 'bg-slate-800/70', border: 'border-amber-300', header: 'bg-amber-400/20' },
    { bg: 'bg-slate-800/60', border: 'border-amber-200', header: 'bg-amber-300/20' },
  ]
  const style = depthStyles[Math.min(nodeData.depth, depthStyles.length - 1)]

  return (
    <div
      className={`${style.bg} ${style.border} border-2 border-dashed rounded-lg ${
        selected ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900' : ''
      }`}
      style={{ width: '100%', height: '100%', minWidth: 200, minHeight: 100 }}
      onClick={handleClick}
    >
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-amber-400 opacity-50" />
      <Handle type="target" position={Position.Left} className="w-2 h-2 bg-amber-400 opacity-50" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-amber-400 opacity-50" />
      <Handle type="source" position={Position.Right} className="w-2 h-2 bg-amber-400 opacity-50" />

      {/* Header bar */}
      <div className={`${style.header} px-3 py-2 rounded-t-md border-b ${style.border} border-dashed`}>
        <div className="flex items-center gap-2">
          <TechIcon technology={tech} className="w-5 h-5 shrink-0 opacity-80" />
          <span className="font-semibold text-sm text-white">{nodeData.name}</span>
        </div>
        {tech.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {tech.slice(0, 3).map((t, i) => (
              <span key={i} className="px-1.5 py-0.5 bg-slate-700/50 rounded text-[10px] text-amber-200">
                {t}
              </span>
            ))}
            {tech.length > 3 && (
              <span className="text-[10px] text-amber-300">+{tech.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Content area - children will be positioned here by React Flow */}
    </div>
  )
})

DeploymentGroupNode.displayName = 'DeploymentGroupNode'
