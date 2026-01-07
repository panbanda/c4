import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { BASE_NODE_CLASSES } from './nodeStyles'
import { TechIcon } from './TechIcon'
import type { FlatDeploymentNode, ContainerInstance } from '../../types/c4'

export interface DeploymentNodeData extends FlatDeploymentNode {
  onSelect?: (id: string) => void
  [key: string]: unknown
}

export const DeploymentNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as DeploymentNodeData

  const handleClick = () => {
    if (nodeData.onSelect) {
      nodeData.onSelect(nodeData.id)
    }
  }

  const tech = Array.isArray(nodeData.technology) ? nodeData.technology : []
  const instances = nodeData.instances || []

  // Color based on depth for visual hierarchy
  const depthColors = [
    'bg-amber-800 border-amber-600',      // depth 0 - region/cloud
    'bg-amber-700 border-amber-500',      // depth 1 - zone/cluster
    'bg-amber-600 border-amber-400',      // depth 2 - node/pod
    'bg-amber-500 border-amber-300',      // depth 3+ - nested
  ]
  const colorClass = depthColors[Math.min(nodeData.depth, depthColors.length - 1)]

  return (
    <div
      className={`${BASE_NODE_CLASSES.container} ${colorClass} border-2 border-dashed ${
        selected ? BASE_NODE_CLASSES.selected : ''
      } hover:${BASE_NODE_CLASSES.hover} cursor-pointer`}
      style={{ width: '100%', height: '100%' }}
      onClick={handleClick}
    >
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-amber-400" />
      <Handle type="target" position={Position.Left} className="w-2 h-2 bg-amber-400" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-amber-400" />
      <Handle type="source" position={Position.Right} className="w-2 h-2 bg-amber-400" />

      <div className="flex flex-col h-full p-3">
        {/* Header with icon and name */}
        <div className="flex items-center gap-2 mb-1">
          <TechIcon technology={tech} className="w-5 h-5 shrink-0" />
          <div className={`${BASE_NODE_CLASSES.title} text-white`}>{nodeData.name}</div>
        </div>

        {/* Technology */}
        {tech.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {tech.map((t, i) => (
              <span key={i} className="px-1.5 py-0.5 bg-amber-900/50 rounded text-[10px] text-amber-200">
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Container instances */}
        {instances.length > 0 && (
          <div className="flex-1 overflow-hidden">
            <div className="text-[10px] text-amber-200 mb-1">Containers:</div>
            <div className="space-y-1">
              {instances.slice(0, 3).map((inst: ContainerInstance, i: number) => (
                <div key={i} className="flex items-center gap-1 text-xs text-white bg-slate-700/50 rounded px-2 py-1">
                  <span className="truncate">{inst.container}</span>
                  {inst.replicas && inst.replicas > 1 && (
                    <span className="text-amber-300 text-[10px]">x{inst.replicas}</span>
                  )}
                </div>
              ))}
              {instances.length > 3 && (
                <div className="text-[10px] text-amber-300">+{instances.length - 3} more</div>
              )}
            </div>
          </div>
        )}

        {/* Footer with type */}
        <div className="mt-auto pt-1">
          <div className="text-amber-300 text-[10px] text-center">[Deployment Node]</div>
        </div>
      </div>
    </div>
  )
})

DeploymentNode.displayName = 'DeploymentNode'
