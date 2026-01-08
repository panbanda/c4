import { create } from 'zustand'
import type { C4Model, ViewType, Element } from '../types/c4'
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

  editMode: boolean
  pendingChanges: Map<string, Partial<Element>>

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

  toggleEditMode: () => void
  updateElement: (id: string, changes: Partial<Element>) => void
  saveChanges: () => Promise<void>
  discardChanges: () => void
  hasPendingChanges: () => boolean
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

  editMode: false,
  pendingChanges: new Map(),

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

  toggleEditMode: () => {
    const { editMode, pendingChanges } = get()
    if (editMode && pendingChanges.size > 0) {
      const confirmed = window.confirm('You have unsaved changes. Discard them?')
      if (!confirmed) return
    }
    set({ editMode: !editMode, pendingChanges: new Map() })
  },

  updateElement: (id, changes) => {
    const { pendingChanges } = get()
    const newChanges = new Map(pendingChanges)
    const existing = newChanges.get(id) || {}
    newChanges.set(id, { ...existing, ...changes })
    set({ pendingChanges: newChanges })
  },

  saveChanges: async () => {
    const { pendingChanges } = get()

    for (const [id, changes] of pendingChanges.entries()) {
      const { updateElementAPI } = await import('../api/client')
      await updateElementAPI(id, changes)
    }

    set({ pendingChanges: new Map() })

    const { setModel, setLoading, setError } = get()
    const { getModel } = await import('../api/client')
    setLoading(true)
    try {
      const model = await getModel()
      setModel(model)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reload model')
    }
  },

  discardChanges: () => {
    set({ pendingChanges: new Map() })
  },

  hasPendingChanges: () => {
    return get().pendingChanges.size > 0
  },
}))
