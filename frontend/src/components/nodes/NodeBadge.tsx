// frontend/src/components/nodes/NodeBadge.tsx
import { memo } from 'react'

interface ConnectionBadgeProps {
  incoming: number
  outgoing: number
  highThreshold?: number
}

export const ConnectionBadge = memo(({
  incoming,
  outgoing,
  highThreshold = 5,
}: ConnectionBadgeProps) => {
  if (incoming === 0 && outgoing === 0) return null

  const total = incoming + outgoing
  const isHigh = total > highThreshold
  const bgClass = isHigh ? 'bg-blue-600' : 'bg-slate-600'

  return (
    <div
      data-testid="connection-badge"
      className={`absolute -top-2 -right-2 flex items-center gap-0.5 px-1.5 py-0.5 ${bgClass} rounded text-[10px] font-medium text-white shadow-md`}
    >
      {incoming > 0 && (
        <span className="flex items-center">
          <span className="text-slate-300 mr-0.5">&#8592;</span>
          <span>{incoming}</span>
        </span>
      )}
      {incoming > 0 && outgoing > 0 && <span className="text-slate-400 mx-0.5">|</span>}
      {outgoing > 0 && (
        <span className="flex items-center">
          <span>{outgoing}</span>
          <span className="text-slate-300 ml-0.5">&#8594;</span>
        </span>
      )}
    </div>
  )
})
ConnectionBadge.displayName = 'ConnectionBadge'

interface FlowBadgeProps {
  flowCount: number
}

export const FlowBadge = memo(({ flowCount }: FlowBadgeProps) => {
  if (flowCount === 0) return null

  return (
    <div
      data-testid="flow-badge"
      className="absolute -top-2 left-2 w-3 h-3 bg-amber-500 rounded-full shadow-md animate-pulse"
      title={`Participates in ${flowCount} flow${flowCount > 1 ? 's' : ''}`}
    />
  )
})
FlowBadge.displayName = 'FlowBadge'

interface ChildrenBadgeProps {
  count: number
}

export const ChildrenBadge = memo(({ count }: ChildrenBadgeProps) => {
  if (count === 0) return null

  return (
    <div
      data-testid="children-badge"
      className="absolute -bottom-2 -right-2 flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-600 rounded text-[10px] font-medium text-white shadow-md"
    >
      <span className="text-slate-300">&#9660;</span>
      <span>{count}</span>
    </div>
  )
})
ChildrenBadge.displayName = 'ChildrenBadge'
