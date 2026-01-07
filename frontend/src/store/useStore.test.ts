import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from './useStore'
import type { C4Model } from '../types/c4'

describe('useStore', () => {
  beforeEach(() => {
    useStore.setState({
      model: null,
      loading: false,
      error: null,
      currentView: 'landscape',
      focusElement: null,
      selectedElement: null,
      filterQuery: '',
    })
  })

  it('should have initial state', () => {
    const state = useStore.getState()
    expect(state.model).toBeNull()
    expect(state.loading).toBe(false)
    expect(state.error).toBeNull()
    expect(state.currentView).toBe('landscape')
    expect(state.focusElement).toBeNull()
    expect(state.selectedElement).toBeNull()
  })

  it('should set model', async () => {
    const mockModel: C4Model = {
      persons: [],
      systems: [],
      containers: [],
      components: [],
      relationships: [],
      flows: [],
      deployments: [],
    }

    await useStore.getState().setModel(mockModel)
    expect(useStore.getState().model).toBe(mockModel)
    expect(useStore.getState().centralityData).not.toBeNull()
  })

  it('should set loading state', () => {
    useStore.getState().setLoading(true)
    expect(useStore.getState().loading).toBe(true)

    useStore.getState().setLoading(false)
    expect(useStore.getState().loading).toBe(false)
  })

  it('should set error', () => {
    const errorMsg = 'Test error'
    useStore.getState().setError(errorMsg)
    expect(useStore.getState().error).toBe(errorMsg)
  })

  it('should set view without focus', () => {
    useStore.getState().setView('context')
    expect(useStore.getState().currentView).toBe('context')
    expect(useStore.getState().focusElement).toBeNull()
  })

  it('should set view with focus', () => {
    useStore.getState().setView('container', 'system1')
    expect(useStore.getState().currentView).toBe('container')
    expect(useStore.getState().focusElement).toBe('system1')
  })

  it('should select element', () => {
    useStore.getState().selectElement('element1')
    expect(useStore.getState().selectedElement).toBe('element1')

    useStore.getState().selectElement(null)
    expect(useStore.getState().selectedElement).toBeNull()
  })

  it('should set filter query', () => {
    useStore.getState().setFilterQuery('payment')
    expect(useStore.getState().filterQuery).toBe('payment')

    useStore.getState().setFilterQuery('')
    expect(useStore.getState().filterQuery).toBe('')
  })
})
