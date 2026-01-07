import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { TechIcon } from './TechIcon'
import type { FlatInstanceNode } from '../../types/c4'

export interface InstanceNodeData extends FlatInstanceNode {
  onSelect?: (id: string) => void
  [key: string]: unknown
}

/**
 * Instance node representing a deployed container (pod/service).
 * Shows the container name, replicas, and visual indication of deployment.
 */
export const InstanceNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as InstanceNodeData

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (nodeData.onSelect) {
      nodeData.onSelect(nodeData.id)
    }
  }

  // Extract short name from containerRef (e.g., "my-system.api-gateway" -> "api-gateway")
  const shortName = nodeData.name.split('.').pop() || nodeData.name

  // Determine icon based on name patterns
  const getTechHint = (): string[] => {
    const name = shortName.toLowerCase()
    if (name.includes('postgres') || name.includes('db') || name.includes('database')) {
      return ['PostgreSQL']
    }
    if (name.includes('redis') || name.includes('dragonfly') || name.includes('cache')) {
      return ['Redis']
    }
    if (name.includes('kafka') || name.includes('queue')) {
      return ['Kafka']
    }
    if (name.includes('gateway') || name.includes('api')) {
      return ['API Gateway']
    }
    return ['Container']
  }

  return (
    <div
      className={`bg-blue-600 border-2 border-blue-400 rounded-lg shadow-lg ${
        selected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''
      } hover:shadow-xl transition-all cursor-pointer`}
      style={{ width: '100%', height: '100%', minWidth: 160, minHeight: 60 }}
      onClick={handleClick}
    >
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-blue-300" />
      <Handle type="target" position={Position.Left} className="w-2 h-2 bg-blue-300" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-blue-300" />
      <Handle type="source" position={Position.Right} className="w-2 h-2 bg-blue-300" />

      <div className="flex items-center gap-2 p-3 h-full">
        <TechIcon technology={getTechHint()} className="w-6 h-6 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-white truncate">{shortName}</div>
          {nodeData.replicas && nodeData.replicas > 1 && (
            <div className="text-xs text-blue-200">
              {nodeData.replicas} replicas
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

InstanceNode.displayName = 'InstanceNode'
