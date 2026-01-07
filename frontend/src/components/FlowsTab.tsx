import { memo } from 'react'
import { useStore } from '../store/useStore'
import type { Element } from '../types/c4'

interface FlowsTabProps {
  element: Element
}

export const FlowsTab = memo(({ element }: FlowsTabProps) => {
  const model = useStore((state) => state.model)
  const playFlow = useStore((state) => state.playFlow)
  const centralityData = useStore((state) => state.centralityData)

  if (!model) return null

  const flowIds = centralityData?.flowParticipation[element.id] || []
  const flows = model.flows.filter((f) => flowIds.includes(f.id))

  if (flows.length === 0) {
    return (
      <div className="text-sm text-slate-500 text-center py-4">
        This element does not participate in any flows
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400">
        Participates in {flows.length} flow{flows.length > 1 ? 's' : ''}:
      </p>

      {flows.map((flow) => {
        const stepsWithElement = flow.steps.filter(
          (step) =>
            step.from.includes(element.id) || step.to.includes(element.id)
        )

        return (
          <div
            key={flow.id}
            className="p-3 bg-slate-700/50 rounded-lg border border-slate-600"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-slate-200">{flow.name}</h4>
              <button
                onClick={() => playFlow(flow.id)}
                className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white transition-colors"
              >
                <span>&#9658;</span>
                Play
              </button>
            </div>

            {flow.description && (
              <p className="text-xs text-slate-400 mb-2">{flow.description}</p>
            )}

            <div className="space-y-1">
              {stepsWithElement.map((step) => (
                <div key={step.seq} className="text-xs text-slate-300">
                  <span className="text-slate-500">Step {step.seq}:</span>{' '}
                  {step.description || `${step.from} → ${step.to}`}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
})

FlowsTab.displayName = 'FlowsTab'
