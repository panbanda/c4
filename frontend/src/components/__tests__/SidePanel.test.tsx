import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { SidePanel } from '../SidePanel'
import { useStore } from '../../store/useStore'
import type { C4Model } from '../../types/c4'

vi.mock('../../store/useStore', () => ({
  useStore: vi.fn(),
}))

const mockModel: C4Model = {
  persons: [
    { id: 'user1', name: 'User', type: 'person', description: 'End user' },
  ],
  systems: [
    { id: 'sys1', name: 'Payment System', type: 'system', description: 'Handles payments', tags: ['backend'], properties: { team: 'payments' } },
  ],
  containers: [
    { id: 'cont1', name: 'API', type: 'container', systemId: 'sys1', technology: 'Node.js', description: 'REST API' },
  ],
  components: [],
  relationships: [
    { from: 'user1', to: 'sys1', description: 'Uses', technology: 'HTTPS' },
    { from: 'sys1', to: 'cont1', description: 'Contains' },
  ],
  flows: [],
  deployments: [],
}

describe('SidePanel', () => {
  const mockSelectElement = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show "No model loaded" when model is null', () => {
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        model: null,
        selectedElement: null,
        selectElement: mockSelectElement,
      }
      return selector ? selector(state) : state
    })

    render(<SidePanel />)
    expect(screen.getByText('No model loaded')).toBeInTheDocument()
  })

  it('should show model overview when no element selected', () => {
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        model: mockModel,
        selectedElement: null,
        selectElement: mockSelectElement,
        centralityData: null,
        playFlow: vi.fn(),
      }
      return selector ? selector(state) : state
    })

    render(<SidePanel />)
    expect(screen.getByText('Model Overview')).toBeInTheDocument()
    expect(screen.getByText('Browse by Type')).toBeInTheDocument()
  })

  it('should show element details when element is selected', () => {
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        model: mockModel,
        selectedElement: 'sys1',
        selectElement: mockSelectElement,
      }
      return selector ? selector(state) : state
    })

    render(<SidePanel />)
    expect(screen.getByText('Payment System')).toBeInTheDocument()
    expect(screen.getByText('Handles payments')).toBeInTheDocument()
    expect(screen.getByText('system')).toBeInTheDocument()
  })

  it('should show element tags', () => {
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        model: mockModel,
        selectedElement: 'sys1',
        selectElement: mockSelectElement,
      }
      return selector ? selector(state) : state
    })

    render(<SidePanel />)
    expect(screen.getByText('Tags')).toBeInTheDocument()
    expect(screen.getByText('backend')).toBeInTheDocument()
  })

  it('should show element properties', () => {
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        model: mockModel,
        selectedElement: 'sys1',
        selectElement: mockSelectElement,
      }
      return selector ? selector(state) : state
    })

    render(<SidePanel />)
    expect(screen.getByText('Properties')).toBeInTheDocument()
    expect(screen.getByText('team')).toBeInTheDocument()
    expect(screen.getByText('payments')).toBeInTheDocument()
  })

  it('should show tabs when element is selected', () => {
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        model: mockModel,
        selectedElement: 'sys1',
        selectElement: mockSelectElement,
      }
      return selector ? selector(state) : state
    })

    render(<SidePanel />)
    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('Dependencies')).toBeInTheDocument()
    expect(screen.getByText('Flows')).toBeInTheDocument()
  })

  it('should close panel when close button clicked', async () => {
    const user = userEvent.setup()
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        model: mockModel,
        selectedElement: 'sys1',
        selectElement: mockSelectElement,
      }
      return selector ? selector(state) : state
    })

    render(<SidePanel />)

    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)

    expect(mockSelectElement).toHaveBeenCalledWith(null)
  })

  it('should show technology for containers', () => {
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        model: mockModel,
        selectedElement: 'cont1',
        selectElement: mockSelectElement,
      }
      return selector ? selector(state) : state
    })

    render(<SidePanel />)
    expect(screen.getByText('Technology')).toBeInTheDocument()
    expect(screen.getByText('Node.js')).toBeInTheDocument()
  })
})
