import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useStore } from './useStore'
import type { C4Model } from '../types/c4'

vi.mock('../api/client', () => ({
  updateElementAPI: vi.fn().mockResolvedValue(undefined),
  getModel: vi.fn().mockResolvedValue({
    persons: [],
    systems: [],
    containers: [],
    components: [],
    relationships: [],
    flows: [],
    deployments: [],
    options: { showMinimap: false },
  }),
}))

const mockModelWithFlows: C4Model = {
  persons: [],
  systems: [{ id: 'sys1', name: 'System', type: 'system' }],
  containers: [],
  components: [],
  relationships: [],
  flows: [
    {
      id: 'flow1',
      name: 'Test Flow',
      steps: [
        { seq: 1, from: 'a', to: 'b' },
        { seq: 2, from: 'b', to: 'c' },
        { seq: 3, from: 'c', to: 'd' },
      ],
    },
  ],
  deployments: [],
  options: { showMinimap: false },
}

describe('useStore - Extended Tests', () => {
  beforeEach(() => {
    useStore.setState({
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
      editMode: false,
      pendingChanges: new Map(),
      centralityData: null,
    })
  })

  describe('setModel', () => {
    it('should clear model when null passed', async () => {
      await useStore.getState().setModel(mockModelWithFlows)
      expect(useStore.getState().model).not.toBeNull()

      await useStore.getState().setModel(null)
      expect(useStore.getState().model).toBeNull()
      expect(useStore.getState().centralityData).toBeNull()
    })
  })

  describe('playFlow', () => {
    it('should start playing flow', async () => {
      await useStore.getState().setModel(mockModelWithFlows)
      useStore.getState().playFlow('flow1')

      expect(useStore.getState().activeFlow).toBe('flow1')
      expect(useStore.getState().flowStep).toBe(0)
      expect(useStore.getState().flowPlaying).toBe(true)
    })

    it('should not play non-existent flow', async () => {
      await useStore.getState().setModel(mockModelWithFlows)
      useStore.getState().playFlow('nonexistent')

      expect(useStore.getState().activeFlow).toBeNull()
    })
  })

  describe('pauseFlow', () => {
    it('should pause flow', async () => {
      await useStore.getState().setModel(mockModelWithFlows)
      useStore.getState().playFlow('flow1')
      useStore.getState().pauseFlow()

      expect(useStore.getState().flowPlaying).toBe(false)
    })
  })

  describe('nextStep', () => {
    it('should advance to next step', async () => {
      await useStore.getState().setModel(mockModelWithFlows)
      useStore.getState().playFlow('flow1')
      useStore.getState().nextStep()

      expect(useStore.getState().flowStep).toBe(1)
    })

    it('should not advance past last step', async () => {
      await useStore.getState().setModel(mockModelWithFlows)
      useStore.getState().playFlow('flow1')
      useStore.getState().nextStep()
      useStore.getState().nextStep()
      useStore.getState().nextStep()

      expect(useStore.getState().flowStep).toBe(2)
    })

    it('should do nothing if no active flow', () => {
      useStore.getState().nextStep()
      expect(useStore.getState().flowStep).toBe(0)
    })
  })

  describe('prevStep', () => {
    it('should go to previous step', async () => {
      await useStore.getState().setModel(mockModelWithFlows)
      useStore.getState().playFlow('flow1')
      useStore.getState().nextStep()
      useStore.getState().nextStep()
      useStore.getState().prevStep()

      expect(useStore.getState().flowStep).toBe(1)
    })

    it('should not go before step 0', () => {
      useStore.getState().prevStep()
      expect(useStore.getState().flowStep).toBe(0)
    })
  })

  describe('setFlowSpeed', () => {
    it('should set flow speed', () => {
      useStore.getState().setFlowSpeed(500)
      expect(useStore.getState().flowSpeed).toBe(500)
    })
  })

  describe('toggleEditMode', () => {
    beforeEach(() => {
      // Mock window.confirm for tests that need it
      vi.stubGlobal('confirm', vi.fn())
    })

    it('should toggle edit mode on', () => {
      useStore.getState().toggleEditMode()
      expect(useStore.getState().editMode).toBe(true)
    })

    it('should toggle edit mode off', () => {
      useStore.getState().toggleEditMode()
      useStore.getState().toggleEditMode()
      expect(useStore.getState().editMode).toBe(false)
    })

    it('should confirm before toggling off with pending changes', () => {
      vi.mocked(window.confirm).mockReturnValue(true)

      useStore.getState().toggleEditMode()
      useStore.getState().updateElement('test', { name: 'New Name' })
      useStore.getState().toggleEditMode()

      expect(window.confirm).toHaveBeenCalled()
      expect(useStore.getState().editMode).toBe(false)
    })

    it('should not toggle off if user cancels', () => {
      vi.mocked(window.confirm).mockReturnValue(false)

      useStore.getState().toggleEditMode()
      useStore.getState().updateElement('test', { name: 'New Name' })
      useStore.getState().toggleEditMode()

      expect(useStore.getState().editMode).toBe(true)
    })

    it('should clear pending changes when toggling off', () => {
      vi.mocked(window.confirm).mockReturnValue(true)

      useStore.getState().toggleEditMode()
      useStore.getState().updateElement('test', { name: 'New Name' })
      useStore.getState().toggleEditMode()

      expect(useStore.getState().pendingChanges.size).toBe(0)
    })
  })

  describe('updateElement', () => {
    it('should add pending changes', () => {
      useStore.getState().updateElement('elem1', { name: 'New Name' })

      const changes = useStore.getState().pendingChanges.get('elem1')
      expect(changes?.name).toBe('New Name')
    })

    it('should merge with existing changes', () => {
      useStore.getState().updateElement('elem1', { name: 'New Name' })
      useStore.getState().updateElement('elem1', { description: 'New Desc' })

      const changes = useStore.getState().pendingChanges.get('elem1')
      expect(changes?.name).toBe('New Name')
      expect(changes?.description).toBe('New Desc')
    })
  })

  describe('saveChanges', () => {
    it('should save changes and reload model', async () => {
      useStore.getState().updateElement('elem1', { name: 'New Name' })
      await useStore.getState().saveChanges()

      expect(useStore.getState().pendingChanges.size).toBe(0)
    })
  })

  describe('discardChanges', () => {
    it('should clear pending changes', () => {
      useStore.getState().updateElement('elem1', { name: 'New Name' })
      useStore.getState().discardChanges()

      expect(useStore.getState().pendingChanges.size).toBe(0)
    })
  })

  describe('hasPendingChanges', () => {
    it('should return false when no changes', () => {
      expect(useStore.getState().hasPendingChanges()).toBe(false)
    })

    it('should return true when changes exist', () => {
      useStore.getState().updateElement('elem1', { name: 'New' })
      expect(useStore.getState().hasPendingChanges()).toBe(true)
    })
  })
})
