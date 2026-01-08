import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StartHere } from '../StartHere'
import { useStore } from '../../store/useStore'
import type { C4Model } from '../../types/c4'

vi.mock('../../store/useStore', () => ({
  useStore: vi.fn(),
}))

const mockModel: C4Model = {
  persons: [{ id: 'user', name: 'User', type: 'person' }],
  systems: [
    { id: 'sys1', name: 'System One', type: 'system' },
    { id: 'sys2', name: 'System Two', type: 'system' },
  ],
  containers: [
    { id: 'api', name: 'API', type: 'container', systemId: 'sys1' },
  ],
  components: [
    { id: 'svc', name: 'Service', type: 'component', systemId: 'sys1', containerId: 'api' },
  ],
  relationships: [
    { from: 'user', to: 'sys1' },
    { from: 'sys1', to: 'sys2' },
  ],
  flows: [
    { id: 'flow1', name: 'Main Flow', steps: [{ seq: 1, from: 'user', to: 'sys1' }] },
  ],
  deployments: [],
  options: { showMinimap: false },
}

const mockCentralityData = {
  topNodes: [
    { id: 'sys1', name: 'System One' },
  ],
  centrality: {
    sys1: { incoming: 1, outgoing: 1, total: 2 },
  },
}

describe('StartHere', () => {
  const mockSelectElement = vi.fn()
  const mockPlayFlow = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        model: mockModel,
        centralityData: mockCentralityData,
        selectElement: mockSelectElement,
        playFlow: mockPlayFlow,
      }
      return selector(state)
    })
  })

  it('should return null when model is null', () => {
    vi.mocked(useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        model: null,
        centralityData: null,
        selectElement: mockSelectElement,
        playFlow: mockPlayFlow,
      }
      return selector(state)
    })

    const { container } = render(<StartHere />)
    expect(container.firstChild).toBeNull()
  })

  it('should show model overview heading', () => {
    render(<StartHere />)
    expect(screen.getByText('Model Overview')).toBeInTheDocument()
  })

  it('should show Browse by Type section', () => {
    render(<StartHere />)
    expect(screen.getByText('Browse by Type')).toBeInTheDocument()
  })

  it('should show type buttons', () => {
    render(<StartHere />)
    expect(screen.getByRole('button', { name: /persons/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /systems/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /containers/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /components/i })).toBeInTheDocument()
  })

  it('should toggle type expansion on click', () => {
    render(<StartHere />)

    const systemsButton = screen.getByRole('button', { name: /systems/i })
    expect(systemsButton).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(systemsButton)
    expect(systemsButton).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(systemsButton)
    expect(systemsButton).toHaveAttribute('aria-expanded', 'false')
  })

  it('should show elements when type is expanded', () => {
    render(<StartHere />)

    const personsButton = screen.getByRole('button', { name: /persons/i })
    fireEvent.click(personsButton)

    expect(screen.getByText('User')).toBeInTheDocument()
  })

  it('should call selectElement when element clicked', () => {
    render(<StartHere />)

    const personsButton = screen.getByRole('button', { name: /persons/i })
    fireEvent.click(personsButton)

    const userButton = screen.getByText('User')
    fireEvent.click(userButton)

    expect(mockSelectElement).toHaveBeenCalledWith('user')
  })

  it('should show flows section', () => {
    render(<StartHere />)
    expect(screen.getByText('Flows (1)')).toBeInTheDocument()
    expect(screen.getByText('Main Flow')).toBeInTheDocument()
  })

  it('should call playFlow when flow clicked', () => {
    render(<StartHere />)

    const flowButton = screen.getByText('Main Flow').closest('button')!
    fireEvent.click(flowButton)

    expect(mockPlayFlow).toHaveBeenCalledWith('flow1')
  })

  it('should not show flows section when no flows', () => {
    vi.mocked(useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        model: { ...mockModel, flows: [] },
        centralityData: mockCentralityData,
        selectElement: mockSelectElement,
        playFlow: mockPlayFlow,
      }
      return selector(state)
    })

    render(<StartHere />)
    expect(screen.queryByText(/Flows/)).not.toBeInTheDocument()
  })

  it('should show Start Here section with top nodes', () => {
    render(<StartHere />)
    expect(screen.getByText('Start Here')).toBeInTheDocument()
  })

  it('should call selectElement when top node clicked', () => {
    render(<StartHere />)

    // Find the button in the Start Here section
    const startHereSection = screen.getByText('Start Here').parentElement!
    const topNodeButton = startHereSection.querySelector('button')!
    fireEvent.click(topNodeButton)

    expect(mockSelectElement).toHaveBeenCalledWith('sys1')
  })

  it('should show relationship count', () => {
    render(<StartHere />)
    expect(screen.getByText('Relationships')).toBeInTheDocument()
  })

  it('should expand containers type', () => {
    render(<StartHere />)

    const containersButton = screen.getByRole('button', { name: /containers/i })
    fireEvent.click(containersButton)

    expect(screen.getByText('API')).toBeInTheDocument()
  })

  it('should expand components type', () => {
    render(<StartHere />)

    const componentsButton = screen.getByRole('button', { name: /components/i })
    fireEvent.click(componentsButton)

    expect(screen.getByText('Service')).toBeInTheDocument()
  })

  it('should show centrality badges on top nodes', () => {
    render(<StartHere />)
    expect(screen.getByText('Most connected elements')).toBeInTheDocument()
  })

  it('should not show Start Here when no top nodes', () => {
    vi.mocked(useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        model: mockModel,
        centralityData: { topNodes: [], centrality: {} },
        selectElement: mockSelectElement,
        playFlow: mockPlayFlow,
      }
      return selector(state)
    })

    render(<StartHere />)
    expect(screen.queryByText('Start Here')).not.toBeInTheDocument()
  })
})
