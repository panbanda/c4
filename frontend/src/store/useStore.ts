import { create } from 'zustand'
import type { C4Model, ViewType } from '../types/c4'
import type { CentralityResult } from '../utils/centrality'

interface AppState {
  model: C4Model | null
  loading: boolean
  error: string | null
  currentView: ViewType
  focusElement: string | null
  selectedElement: string | null
  filterQuery: string

  activeFlow: string | null
  flowStep: number
  flowPlaying: boolean
  flowSpeed: number
  flowHighlightedNodes: string[]

  centralityData: CentralityResult | null

  setModel: (model: C4Model | null) => Promise<void>
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setView: (view: ViewType, focus?: string) => void
  selectElement: (id: string | null) => void
  setFilterQuery: (query: string) => void

  playFlow: (flowId: string) => void
  pauseFlow: () => void
  nextStep: () => void
  prevStep: () => void
  setFlowSpeed: (speed: number) => void
}

export const useStore = create<AppState>((set, get) => ({
  model: null,
  loading: false,
  error: null,
  currentView: 'landscape',
  focusElement: null,
  selectedElement: null,
  filterQuery: '',

  activeFlow: null,
  flowStep: 0,
  flowPlaying: false,
  flowSpeed: 1000,
  flowHighlightedNodes: [],

  centralityData: null,

  setModel: async (model) => {
    if (model) {
      const { calculateCentrality } = await import('../utils/centrality')
      const centralityData = calculateCentrality(model)
      set({ model, error: null, centralityData })
    } else {
      set({ model: null, error: null, centralityData: null })
    }
  },
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  setView: (view, focus) => set({ currentView: view, focusElement: focus ?? null }),
  selectElement: (id) => set({ selectedElement: id }),
  setFilterQuery: (query) => set({ filterQuery: query }),

  playFlow: (flowId) => {
    const { model } = get()
    const flow = model?.flows.find((f) => f.id === flowId)
    if (!flow) return

    const firstStep = flow.steps[0]
    const highlightedNodes = firstStep ? [firstStep.from, firstStep.to] : []

    set({
      activeFlow: flowId,
      flowStep: 0,
      flowPlaying: true,
      flowHighlightedNodes: highlightedNodes,
    })
  },

  pauseFlow: () => set({ flowPlaying: false }),

  nextStep: () => {
    const { model, activeFlow, flowStep } = get()
    if (!activeFlow) return

    const flow = model?.flows.find((f) => f.id === activeFlow)
    if (!flow) return

    const maxStep = flow.steps.length - 1
    if (flowStep < maxStep) {
      const nextStepData = flow.steps[flowStep + 1]
      const highlightedNodes = nextStepData ? [nextStepData.from, nextStepData.to] : []
      set({ flowStep: flowStep + 1, flowHighlightedNodes: highlightedNodes })
    }
  },

  prevStep: () => {
    const { model, activeFlow, flowStep } = get()
    if (flowStep > 0) {
      const flow = model?.flows.find((f) => f.id === activeFlow)
      const prevStepData = flow?.steps[flowStep - 1]
      const highlightedNodes = prevStepData ? [prevStepData.from, prevStepData.to] : []
      set({ flowStep: flowStep - 1, flowHighlightedNodes: highlightedNodes })
    }
  },

  setFlowSpeed: (speed) => set({ flowSpeed: speed }),
}))
