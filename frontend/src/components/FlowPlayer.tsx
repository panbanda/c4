import { useEffect } from 'react'
import { useStore } from '../store/useStore'

export function FlowPlayer() {
  const {
    model,
    activeFlow,
    flowStep,
    flowPlaying,
    flowSpeed,
    playFlow,
    pauseFlow,
    nextStep,
    prevStep,
    setFlowSpeed,
  } = useStore()

  const flows = model?.flows || []
  const currentFlow = flows.find((f) => f.id === activeFlow)
  const currentStep = currentFlow?.steps[flowStep]
  const totalSteps = currentFlow?.steps.length || 0

  useEffect(() => {
    if (!flowPlaying || !currentFlow) return

    const interval = setInterval(() => {
      if (flowStep < totalSteps - 1) {
        nextStep()
      } else {
        pauseFlow()
      }
    }, flowSpeed)

    return () => clearInterval(interval)
  }, [flowPlaying, flowStep, totalSteps, flowSpeed, currentFlow, nextStep, pauseFlow])

  if (flows.length === 0) return null

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10" role="region" aria-label="Flow player controls">
      <div className="bg-slate-800 border border-slate-600 rounded-lg shadow-xl p-4 min-w-96">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label htmlFor="flow-select" className="text-slate-300 text-sm font-medium whitespace-nowrap">
              Flow:
            </label>
            <select
              id="flow-select"
              value={activeFlow || ''}
              onChange={(e) => {
                if (e.target.value) {
                  playFlow(e.target.value)
                }
              }}
              className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Select flow"
            >
              <option value="">Select a flow...</option>
              {flows.map((flow) => (
                <option key={flow.id} value={flow.id}>
                  {flow.name}
                </option>
              ))}
            </select>
          </div>

          {activeFlow && currentFlow && (
            <>
              <div className="flex items-center gap-2" role="group" aria-label="Flow playback controls">
                <button
                  onClick={prevStep}
                  disabled={flowStep === 0}
                  className="p-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
                  aria-label="Previous step"
                >
                  <svg
                    className="w-4 h-4 text-slate-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => (flowPlaying ? pauseFlow() : playFlow(activeFlow))}
                  className="p-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                  aria-label={flowPlaying ? 'Pause flow' : 'Play flow'}
                >
                  {flowPlaying ? (
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 9v6m4-6v6"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.752 11.168l-5.197-3.748A1 1 0 008 8.248v7.504a1 1 0 001.555.832l5.197-3.748a1 1 0 000-1.664z"
                      />
                    </svg>
                  )}
                </button>

                <button
                  onClick={nextStep}
                  disabled={flowStep >= totalSteps - 1}
                  className="p-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
                  aria-label="Next step"
                >
                  <svg
                    className="w-4 h-4 text-slate-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                <div className="flex-1 flex items-center gap-2">
                  <div
                    className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden"
                    role="progressbar"
                    aria-valuenow={flowStep + 1}
                    aria-valuemin={1}
                    aria-valuemax={totalSteps}
                    aria-label="Flow progress"
                  >
                    <div
                      className="bg-blue-500 h-full transition-all duration-300"
                      style={{ width: `${((flowStep + 1) / totalSteps) * 100}%` }}
                    />
                  </div>
                  <span className="text-slate-300 text-sm whitespace-nowrap" aria-live="polite">
                    {flowStep + 1} / {totalSteps}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <label htmlFor="flow-speed" className="text-slate-400 text-xs">Speed:</label>
                  <select
                    id="flow-speed"
                    value={flowSpeed}
                    onChange={(e) => setFlowSpeed(Number(e.target.value))}
                    className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Playback speed"
                  >
                    <option value={2000}>0.5x</option>
                    <option value={1000}>1x</option>
                    <option value={500}>2x</option>
                    <option value={250}>4x</option>
                  </select>
                </div>
              </div>

              {currentStep && (
                <div className="bg-slate-900 rounded p-3 border border-slate-700">
                  <div className="text-slate-400 text-xs mb-1">
                    Step {flowStep + 1}: {currentStep.from} → {currentStep.to}
                  </div>
                  {currentStep.description && (
                    <div className="text-slate-200 text-sm">{currentStep.description}</div>
                  )}
                  {currentStep.technology && (
                    <div className="text-slate-500 text-xs mt-1">{currentStep.technology}</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
