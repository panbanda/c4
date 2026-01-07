import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { Canvas } from '../Canvas'
import { useStore } from '../../store/useStore'
import type { C4Model } from '../../types/c4'

vi.mock('../../store/useStore', () => ({
  useStore: vi.fn(),
}))

vi.mock('../../utils/modelToFlow', () => ({
  modelToFlow: vi.fn(() => ({ nodes: [], edges: [] })),
}))

const mockModel: C4Model = {
  persons: [],
  systems: [
    { id: 'sys1', name: 'Payment System', type: 'system' },
  ],
  containers: [
    { id: 'cont1', name: 'API', type: 'container', systemId: 'sys1', technology: 'Node.js' },
  ],
  components: [],
  relationships: [],
  flows: [],
  deployments: [],
}

describe('Canvas keyboard shortcuts', () => {
  const mockSelectElement = vi.fn()
  const mockSetView = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should deselect element on Escape when element is selected', async () => {
    const user = userEvent.setup()
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        model: mockModel,
        currentView: 'landscape' as const,
        focusElement: null,
        selectedElement: 'sys1',
        selectElement: mockSelectElement,
        setView: mockSetView,
      }
      return selector ? selector(state) : state
    })

    render(<Canvas />)

    await user.keyboard('{Escape}')

    expect(mockSelectElement).toHaveBeenCalledWith(null)
  })

  it('should navigate to landscape view on Escape when in container view', async () => {
    const user = userEvent.setup()
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        model: mockModel,
        currentView: 'container' as const,
        focusElement: 'sys1',
        selectedElement: null,
        selectElement: mockSelectElement,
        setView: mockSetView,
      }
      return selector ? selector(state) : state
    })

    render(<Canvas />)

    await user.keyboard('{Escape}')

    expect(mockSetView).toHaveBeenCalledWith('landscape')
  })

  it('should navigate to container view on Escape when in component view', async () => {
    const user = userEvent.setup()
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        model: mockModel,
        currentView: 'component' as const,
        focusElement: 'cont1',
        selectedElement: null,
        selectElement: mockSelectElement,
        setView: mockSetView,
      }
      return selector ? selector(state) : state
    })

    render(<Canvas />)

    await user.keyboard('{Escape}')

    expect(mockSetView).toHaveBeenCalledWith('container', 'sys1')
  })

  it('should drill down on Enter when element is selected', async () => {
    const user = userEvent.setup()
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        model: mockModel,
        currentView: 'landscape' as const,
        focusElement: null,
        selectedElement: 'sys1',
        selectElement: mockSelectElement,
        setView: mockSetView,
      }
      return selector ? selector(state) : state
    })

    render(<Canvas />)

    await user.keyboard('{Enter}')

    expect(mockSetView).toHaveBeenCalledWith('container', 'sys1')
  })

  it('should do nothing on Enter when no element is selected', async () => {
    const user = userEvent.setup()
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        model: mockModel,
        currentView: 'landscape' as const,
        focusElement: null,
        selectedElement: null,
        selectElement: mockSelectElement,
        setView: mockSetView,
      }
      return selector ? selector(state) : state
    })

    render(<Canvas />)

    await user.keyboard('{Enter}')

    expect(mockSetView).not.toHaveBeenCalled()
  })

  it('should navigate up on Backspace from container view', async () => {
    const user = userEvent.setup()
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        model: mockModel,
        currentView: 'container' as const,
        focusElement: 'sys1',
        selectedElement: null,
        selectElement: mockSelectElement,
        setView: mockSetView,
      }
      return selector ? selector(state) : state
    })

    render(<Canvas />)

    await user.keyboard('{Backspace}')

    expect(mockSetView).toHaveBeenCalledWith('landscape')
  })

  it('should navigate up on Backspace from component view', async () => {
    const user = userEvent.setup()
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        model: mockModel,
        currentView: 'component' as const,
        focusElement: 'cont1',
        selectedElement: null,
        selectElement: mockSelectElement,
        setView: mockSetView,
      }
      return selector ? selector(state) : state
    })

    render(<Canvas />)

    await user.keyboard('{Backspace}')

    expect(mockSetView).toHaveBeenCalledWith('container', 'sys1')
  })
})
