import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { Breadcrumb } from '../Breadcrumb'
import { useStore } from '../../store/useStore'
import type { C4Model } from '../../types/c4'

vi.mock('../../store/useStore', () => ({
  useStore: vi.fn(),
}))

const mockModel: C4Model = {
  persons: [],
  systems: [
    { id: 'sys1', name: 'Payment System', type: 'system', description: 'Handles payments' },
    { id: 'sys2', name: 'Auth System', type: 'system', description: 'Handles auth' },
  ],
  containers: [
    { id: 'cont1', name: 'API Container', type: 'container', systemId: 'sys1', technology: 'Node.js' },
    { id: 'cont2', name: 'DB Container', type: 'container', systemId: 'sys1', technology: 'PostgreSQL' },
  ],
  components: [
    { id: 'comp1', name: 'Auth Service', type: 'component', systemId: 'sys1', containerId: 'cont1', technology: 'TypeScript' },
  ],
  relationships: [],
  flows: [],
  deployments: [],
}

describe('Breadcrumb', () => {
  const mockSetView = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        model: mockModel,
        currentView: 'landscape' as const,
        focusElement: null,
        setView: mockSetView,
      }
      return selector ? selector(state) : state
    })
  })

  it('should show only home icon in landscape view', () => {
    render(<Breadcrumb />)

    const homeButton = screen.getByRole('button', { name: /home/i })
    expect(homeButton).toBeInTheDocument()
    expect(screen.queryByText('Payment System')).not.toBeInTheDocument()
  })

  it('should show system name in container view', () => {
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        model: mockModel,
        currentView: 'container' as const,
        focusElement: 'sys1',
        setView: mockSetView,
      }
      return selector ? selector(state) : state
    })

    render(<Breadcrumb />)

    expect(screen.getByText('Payment System')).toBeInTheDocument()
  })

  it('should show system and container in component view', () => {
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        model: mockModel,
        currentView: 'component' as const,
        focusElement: 'cont1',
        setView: mockSetView,
      }
      return selector ? selector(state) : state
    })

    render(<Breadcrumb />)

    expect(screen.getByText('Payment System')).toBeInTheDocument()
    expect(screen.getByText('API Container')).toBeInTheDocument()
  })

  it('should navigate to landscape on home click', async () => {
    const user = userEvent.setup()
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        model: mockModel,
        currentView: 'container' as const,
        focusElement: 'sys1',
        setView: mockSetView,
      }
      return selector ? selector(state) : state
    })

    render(<Breadcrumb />)

    const homeButton = screen.getByRole('button', { name: /home/i })
    await user.click(homeButton)

    expect(mockSetView).toHaveBeenCalledWith('landscape')
  })

  it('should navigate to container view when clicking system in component view', async () => {
    const user = userEvent.setup()
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        model: mockModel,
        currentView: 'component' as const,
        focusElement: 'cont1',
        setView: mockSetView,
      }
      return selector ? selector(state) : state
    })

    render(<Breadcrumb />)

    const systemLink = screen.getByText('Payment System')
    await user.click(systemLink)

    expect(mockSetView).toHaveBeenCalledWith('container', 'sys1')
  })

  it('should handle missing focus element gracefully', () => {
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        model: mockModel,
        currentView: 'container' as const,
        focusElement: null,
        setView: mockSetView,
      }
      return selector ? selector(state) : state
    })

    render(<Breadcrumb />)

    expect(screen.queryByText('Payment System')).not.toBeInTheDocument()
  })

  it('should handle unknown element ID gracefully', () => {
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        model: mockModel,
        currentView: 'container' as const,
        focusElement: 'unknown',
        setView: mockSetView,
      }
      return selector ? selector(state) : state
    })

    render(<Breadcrumb />)

    expect(screen.getByText('unknown')).toBeInTheDocument()
  })
})
