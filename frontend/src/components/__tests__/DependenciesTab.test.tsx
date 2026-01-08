import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DependenciesTab } from '../DependenciesTab'
import { useStore } from '../../store/useStore'
import type { C4Model, Container, Component, SoftwareSystem } from '../../types/c4'

vi.mock('../../store/useStore', () => ({
  useStore: vi.fn(),
}))

const mockSystem: SoftwareSystem = {
  id: 'sys1',
  name: 'System',
  type: 'system',
}

const mockContainer: Container = {
  id: 'api',
  name: 'API',
  type: 'container',
  systemId: 'sys1',
}

const mockComponent: Component = {
  id: 'svc',
  name: 'Service',
  type: 'component',
  systemId: 'sys1',
  containerId: 'api',
}

const mockModel: C4Model = {
  persons: [{ id: 'user', name: 'User', type: 'person' }],
  systems: [mockSystem],
  containers: [mockContainer],
  components: [mockComponent],
  relationships: [
    { from: 'user', to: 'sys1', description: 'Uses the system' },
    { from: 'sys1', to: 'api', description: 'Connects to' },
    { from: 'api', to: 'svc', description: 'Contains' },
  ],
  flows: [],
  deployments: [],
  options: { showMinimap: false },
}

describe('DependenciesTab', () => {
  const mockSelectElement = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        model: mockModel,
        selectElement: mockSelectElement,
      }
      return selector(state)
    })
  })

  it('should return null when model is null', () => {
    vi.mocked(useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        model: null,
        selectElement: mockSelectElement,
      }
      return selector(state)
    })

    const { container } = render(<DependenciesTab element={mockSystem} />)
    expect(container.firstChild).toBeNull()
  })

  it('should show incoming dependencies', () => {
    render(<DependenciesTab element={mockSystem} />)
    expect(screen.getByText('Incoming (1)')).toBeInTheDocument()
    expect(screen.getByText('User')).toBeInTheDocument()
  })

  it('should show outgoing dependencies', () => {
    render(<DependenciesTab element={mockSystem} />)
    expect(screen.getByText('Outgoing (1)')).toBeInTheDocument()
    expect(screen.getByText('API')).toBeInTheDocument()
  })

  it('should show no dependencies message when none exist', () => {
    const elementWithNoDeps: SoftwareSystem = { id: 'isolated', name: 'Isolated', type: 'system' }
    render(<DependenciesTab element={elementWithNoDeps} />)
    expect(screen.getByText('No dependencies found')).toBeInTheDocument()
  })

  it('should filter dependencies by search', () => {
    render(<DependenciesTab element={mockSystem} />)

    const searchInput = screen.getByPlaceholderText('Filter dependencies...')
    fireEvent.change(searchInput, { target: { value: 'user' } })

    expect(screen.getByText('User')).toBeInTheDocument()
    expect(screen.queryByText('Outgoing')).not.toBeInTheDocument()
  })

  it('should filter by description', () => {
    render(<DependenciesTab element={mockSystem} />)

    const searchInput = screen.getByPlaceholderText('Filter dependencies...')
    fireEvent.change(searchInput, { target: { value: 'Uses' } })

    expect(screen.getByText('User')).toBeInTheDocument()
  })

  it('should navigate to element on click', () => {
    render(<DependenciesTab element={mockSystem} />)

    const userButton = screen.getByText('User').closest('button')!
    fireEvent.click(userButton)

    expect(mockSelectElement).toHaveBeenCalledWith('user')
  })

  it('should handle container dependencies', () => {
    render(<DependenciesTab element={mockContainer} />)
    // Container 'api' has outgoing to 'svc'
    expect(screen.getByText('Outgoing (1)')).toBeInTheDocument()
    expect(screen.getByText('Service')).toBeInTheDocument()
  })

  it('should handle component dependencies', () => {
    render(<DependenciesTab element={mockComponent} />)
    // Component 'svc' has incoming from 'api'
    expect(screen.getByText('Incoming (1)')).toBeInTheDocument()
    expect(screen.getByText('API')).toBeInTheDocument()
  })

  it('should resolve element names from IDs', () => {
    render(<DependenciesTab element={mockSystem} />)
    // Should show 'User' instead of 'user'
    expect(screen.getByText('User')).toBeInTheDocument()
    // Should show 'API' instead of 'api'
    expect(screen.getByText('API')).toBeInTheDocument()
  })

  it('should show both incoming and outgoing counts', () => {
    render(<DependenciesTab element={mockSystem} />)
    expect(screen.getByText('Incoming (1)')).toBeInTheDocument()
    expect(screen.getByText('Outgoing (1)')).toBeInTheDocument()
  })

  it('should clear filter when input is cleared', () => {
    render(<DependenciesTab element={mockSystem} />)

    const searchInput = screen.getByPlaceholderText('Filter dependencies...')

    // Apply filter
    fireEvent.change(searchInput, { target: { value: 'user' } })
    expect(screen.queryByText('Outgoing')).not.toBeInTheDocument()

    // Clear filter
    fireEvent.change(searchInput, { target: { value: '' } })
    expect(screen.getByText('Outgoing (1)')).toBeInTheDocument()
  })
})
