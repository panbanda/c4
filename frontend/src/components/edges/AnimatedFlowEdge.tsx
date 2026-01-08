import { memo, useState } from 'react'
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from '@xyflow/react'
import { useStore } from '../../store/useStore'

export interface AnimatedFlowEdgeData {
  description?: string
  technology?: string[]
  isDimmed?: boolean
  isHighlighted?: boolean
  isFlowActive?: boolean
  tags?: string[]
  [key: string]: unknown
}

type EdgeStyle = {
  strokeDasharray?: string
  strokeWidth: number
  className: string
}

function getEdgeStyleFromTags(tags?: string[], technology?: string[]): EdgeStyle {
  const allTags = [...(tags || []), ...(technology || [])].map(t => t.toLowerCase())

  if (allTags.some(t => t.includes('async') || t.includes('event') || t.includes('queue') || t.includes('kafka') || t.includes('rabbitmq'))) {
    return { strokeDasharray: '8 4', strokeWidth: 2.5, className: 'stroke-amber-400' }
  }

  if (allTags.some(t => t.includes('grpc') || t.includes('rpc'))) {
    return { strokeDasharray: '2 2', strokeWidth: 2.5, className: 'stroke-purple-400' }
  }

  if (allTags.some(t => t.includes('rest') || t.includes('http') || t.includes('api'))) {
    return { strokeDasharray: undefined, strokeWidth: 2.5, className: 'stroke-blue-400' }
  }

  if (allTags.some(t => t.includes('db') || t.includes('database') || t.includes('sql') || t.includes('postgres') || t.includes('mysql'))) {
    return { strokeDasharray: '4 2 1 2', strokeWidth: 2.5, className: 'stroke-emerald-400' }
  }

  if (allTags.some(t => t.includes('file') || t.includes('s3') || t.includes('storage'))) {
    return { strokeDasharray: '1 3', strokeWidth: 2.5, className: 'stroke-cyan-400' }
  }

  return { strokeDasharray: undefined, strokeWidth: 2.5, className: 'stroke-slate-400' }
}

export const AnimatedFlowEdge = memo(
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
    source,
    target,
  }: EdgeProps) => {
    const [isHovered, setIsHovered] = useState(false)
    const { model, activeFlow, flowStep, currentView } = useStore()
    const edgeData = data as AnimatedFlowEdgeData | undefined

    // Show labels by default in component view, hover-only in other views
    const alwaysShowLabels = currentView === 'component'

    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    })

    const flow = activeFlow ? model?.flows.find((f) => f.id === activeFlow) : null
    const currentStep = flow?.steps[flowStep]

    const isActiveFlowEdge =
      currentStep &&
      currentStep.from === source &&
      currentStep.to === target

    const isInFlow = flow?.steps.some(
      (step) => step.from === source && step.to === target
    )

    const hasLabel = edgeData?.description

    const baseStyle = getEdgeStyleFromTags(edgeData?.tags, edgeData?.technology)
    let edgeClassName = 'react-flow__edge-path transition-all duration-300'
    let strokeWidth = baseStyle.strokeWidth
    let strokeDasharray = baseStyle.strokeDasharray
    let showLabel = alwaysShowLabels || isHovered

    if (activeFlow) {
      if (isActiveFlowEdge) {
        edgeClassName += ' flow-edge-active stroke-blue-500'
        strokeDasharray = '12 12'
        strokeWidth = 3
      } else if (isInFlow) {
        edgeClassName += ' stroke-blue-400/40'
      } else {
        edgeClassName += ' stroke-slate-400/20'
        showLabel = false
      }
    } else if (edgeData?.isHighlighted) {
      edgeClassName += ` ${baseStyle.className}`
      strokeWidth = isHovered ? 3.5 : 2.5
      showLabel = true
    } else if (edgeData?.isDimmed) {
      edgeClassName += ' stroke-slate-600/30'
      showLabel = false
    } else {
      edgeClassName += isHovered ? ' stroke-blue-400' : ` ${baseStyle.className}`
      strokeWidth = isHovered ? 3.5 : baseStyle.strokeWidth
    }

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
          className={edgeClassName}
          d={edgePath}
          strokeWidth={strokeWidth}
          markerEnd={markerEnd as string}
          strokeDasharray={strokeDasharray}
          fill="none"
        />
        {isActiveFlowEdge && (
          <EdgeLabelRenderer>
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                pointerEvents: 'all',
              }}
              className="nodrag nopan"
            >
              <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg">
                {flowStep + 1}
              </div>
            </div>
          </EdgeLabelRenderer>
        )}
        {hasLabel && !isActiveFlowEdge && (
          <EdgeLabelRenderer>
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                pointerEvents: showLabel ? 'all' : 'none',
                zIndex: isHovered || edgeData?.isHighlighted ? 1000 : 1,
              }}
              className={`nodrag nopan transition-all duration-200 ${showLabel ? 'opacity-100' : 'opacity-0'}`}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <div className={`bg-slate-800/95 border rounded px-2 py-1.5 text-xs max-w-[200px] shadow-lg transition-colors ${isHovered || edgeData?.isHighlighted ? 'border-blue-400' : 'border-slate-600'}`}>
                <div className="text-slate-200 leading-tight text-center">{edgeData?.description}</div>
                {edgeData?.technology && edgeData.technology.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-center mt-1.5 pt-1.5 border-t border-slate-700">
                    {edgeData.technology.map((tech, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-slate-700 rounded text-[10px] text-slate-400">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </EdgeLabelRenderer>
        )}
      </g>
    )
  }
)

AnimatedFlowEdge.displayName = 'AnimatedFlowEdge'
