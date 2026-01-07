import { memo, useState } from 'react'
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from '@xyflow/react'
import { useStore } from '../../store/useStore'

export interface AnimatedFlowEdgeData {
  description?: string
  technology?: string[]
  isDimmed?: boolean
  isHighlighted?: boolean
  [key: string]: unknown
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

    let edgeClassName = 'react-flow__edge-path transition-all duration-300'
    let strokeWidth = 2
    let showLabel = alwaysShowLabels || isHovered

    if (activeFlow) {
      if (isActiveFlowEdge) {
        edgeClassName += ' flow-edge-active stroke-blue-500'
      } else if (isInFlow) {
        edgeClassName += ' stroke-blue-400/40'
      } else {
        edgeClassName += ' stroke-slate-400/20'
        showLabel = false
      }
    } else if (edgeData?.isHighlighted) {
      // Bright: edge is connected to selected/hovered node
      edgeClassName += ' stroke-blue-400'
      strokeWidth = isHovered ? 3 : 2
      showLabel = true
    } else if (edgeData?.isDimmed) {
      // Very dim for edges not connected to hovered node
      edgeClassName += ' stroke-slate-600/15'
      showLabel = false
    } else {
      edgeClassName += isHovered ? ' stroke-blue-400' : ' stroke-slate-400'
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
          strokeDasharray={isActiveFlowEdge ? '12 12' : undefined}
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
              <div className={`bg-slate-800/95 border rounded px-2 py-1 text-xs max-w-[180px] text-center shadow-lg transition-colors ${isHovered || edgeData?.isHighlighted ? 'border-blue-400' : 'border-slate-600'}`}>
                <div className="text-slate-200 leading-tight">{edgeData?.description}</div>
              </div>
            </div>
          </EdgeLabelRenderer>
        )}
      </g>
    )
  }
)

AnimatedFlowEdge.displayName = 'AnimatedFlowEdge'
