import { memo, useState } from 'react'
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from '@xyflow/react'

export interface RelationshipEdgeData {
  description?: string
  technology?: string[]
  isDimmed?: boolean
  [key: string]: unknown
}

export const RelationshipEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    markerEnd,
  }: EdgeProps) => {
    const [isHovered, setIsHovered] = useState(false)
    const edgeData = data as RelationshipEdgeData | undefined
    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    })

    const hasLabel = edgeData?.description
    const isDimmed = edgeData?.isDimmed

    return (
      <g
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Invisible wider path for easier hover detection */}
        <path
          d={edgePath}
          fill="none"
          strokeWidth={20}
          stroke="transparent"
          className="cursor-pointer"
        />
        <path
          id={id}
          className={`react-flow__edge-path stroke-2 transition-colors ${
            isDimmed ? 'stroke-slate-400/20' : isHovered ? 'stroke-blue-400' : 'stroke-slate-400'
          }`}
          d={edgePath}
          markerEnd={markerEnd as string}
        />
        {hasLabel && (
          <EdgeLabelRenderer>
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                pointerEvents: 'none',
              }}
              className={`nodrag nopan transition-opacity duration-200 ${
                isDimmed ? 'opacity-0' : isHovered ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="bg-slate-800/95 border border-slate-600 rounded px-2 py-1 text-xs max-w-[180px] text-center shadow-lg">
                <div className="text-slate-200 leading-tight">{edgeData?.description}</div>
              </div>
            </div>
          </EdgeLabelRenderer>
        )}
      </g>
    )
  }
)

RelationshipEdge.displayName = 'RelationshipEdge'
