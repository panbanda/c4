import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { FlowsTab } from '../FlowsTab'
import { useStore } from '../../store/useStore'
import type { C4Model, SoftwareSystem } from '../../types/c4'

vi.mock('../../store/useStore', () => ({
  useStore: vi.fn(),
}))

const mockModel: C4Model = {
  persons: [],
  systems: [
    { id: 'sys1', name: 'System A', type: 'system' },
    { id: 'sys2', name: 'System B', type: 'system' },
  ],
  containers: [],
  components: [],
  relationships: [],
  flows: [
    {
      id: 'flow1',
      name: 'User Login Flow',
      description: 'Authentication process',
      steps: [
        { seq: 1, from: 'user1', to: 'sys1', description: 'Sends credentials' },
        { seq: 2, from: 'sys1', to: 'sys2', description: 'Validates token' },
        { seq: 3, from: 'sys2', to: 'sys1', description: 'Returns session' },
      ],
    },
    {
      id: 'flow2',
      name: 'Data Sync Flow',
      steps: [
        { seq: 1, from: 'sys1', to: 'sys2' },
      ],
    },
  ],
  deployments: [],
  options: { showMinimap: false },
}

const mockSystem: SoftwareSystem = mockModel.systems[0]

describe('FlowsTab', () => {
  const mockPlayFlow = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return null when model is null', () => {
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        model: null,
        playFlow: mockPlayFlow,
        centralityData: null,
      }
      return selector ? selector(state) : state
    })

    const { container } = render(<FlowsTab element={mockSystem} />)
    expect(container.firstChild).toBeNull()
  })

  it('should show no flows message when element not in any flow', () => {
    const isolatedSystem: SoftwareSystem = {
      id: 'isolated',
      name: 'Isolated',
      type: 'system',
    }

    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        model: mockModel,
        playFlow: mockPlayFlow,
        centralityData: {
          centrality: {},
          topNodes: [],
          flowParticipation: {},
        },
      }
      return selector ? selector(state) : state
    })

    render(<FlowsTab element={isolatedSystem} />)
    expect(screen.getByText(/does not participate in any flows/i)).toBeInTheDocument()
  })

  it('should show flows that element participates in', () => {
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        model: mockModel,
        playFlow: mockPlayFlow,
        centralityData: {
          centrality: {},
          topNodes: [],
          flowParticipation: {
            sys1: ['flow1', 'flow2'],
          },
        },
      }
      return selector ? selector(state) : state
    })

    render(<FlowsTab element={mockSystem} />)
    expect(screen.getByText('User Login Flow')).toBeInTheDocument()
    expect(screen.getByText('Data Sync Flow')).toBeInTheDocument()
  })

  it('should show flow count', () => {
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        model: mockModel,
        playFlow: mockPlayFlow,
        centralityData: {
          centrality: {},
          topNodes: [],
          flowParticipation: {
            sys1: ['flow1', 'flow2'],
          },
        },
      }
      return selector ? selector(state) : state
    })

    render(<FlowsTab element={mockSystem} />)
    expect(screen.getByText(/participates in 2 flows/i)).toBeInTheDocument()
  })

  it('should show singular flow text for one flow', () => {
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        model: mockModel,
        playFlow: mockPlayFlow,
        centralityData: {
          centrality: {},
          topNodes: [],
          flowParticipation: {
            sys1: ['flow1'],
          },
        },
      }
      return selector ? selector(state) : state
    })

    render(<FlowsTab element={mockSystem} />)
    expect(screen.getByText(/participates in 1 flow:/i)).toBeInTheDocument()
  })

  it('should show flow description', () => {
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        model: mockModel,
        playFlow: mockPlayFlow,
        centralityData: {
          centrality: {},
          topNodes: [],
          flowParticipation: {
            sys1: ['flow1'],
          },
        },
      }
      return selector ? selector(state) : state
    })

    render(<FlowsTab element={mockSystem} />)
    expect(screen.getByText('Authentication process')).toBeInTheDocument()
  })

  it('should show steps involving the element', () => {
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        model: mockModel,
        playFlow: mockPlayFlow,
        centralityData: {
          centrality: {},
          topNodes: [],
          flowParticipation: {
            sys1: ['flow1'],
          },
        },
      }
      return selector ? selector(state) : state
    })

    render(<FlowsTab element={mockSystem} />)
    expect(screen.getByText(/step 2/i)).toBeInTheDocument()
    expect(screen.getByText('Validates token')).toBeInTheDocument()
  })

  it('should call playFlow when play button clicked', async () => {
    const user = userEvent.setup()
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        model: mockModel,
        playFlow: mockPlayFlow,
        centralityData: {
          centrality: {},
          topNodes: [],
          flowParticipation: {
            sys1: ['flow1'],
          },
        },
      }
      return selector ? selector(state) : state
    })

    render(<FlowsTab element={mockSystem} />)

    const playButton = screen.getByRole('button', { name: /play/i })
    await user.click(playButton)

    expect(mockPlayFlow).toHaveBeenCalledWith('flow1')
  })

  it('should show step without description using from/to format', () => {
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        model: mockModel,
        playFlow: mockPlayFlow,
        centralityData: {
          centrality: {},
          topNodes: [],
          flowParticipation: {
            sys1: ['flow2'],
          },
        },
      }
      return selector ? selector(state) : state
    })

    render(<FlowsTab element={mockSystem} />)
    expect(screen.getByText(/sys1 → sys2/)).toBeInTheDocument()
  })

  it('should handle empty flowParticipation', () => {
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        model: mockModel,
        playFlow: mockPlayFlow,
        centralityData: {
          centrality: {},
          topNodes: [],
          flowParticipation: {},
        },
      }
      return selector ? selector(state) : state
    })

    render(<FlowsTab element={mockSystem} />)
    expect(screen.getByText(/does not participate in any flows/i)).toBeInTheDocument()
  })

  it('should handle null centralityData', () => {
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        model: mockModel,
        playFlow: mockPlayFlow,
        centralityData: null,
      }
      return selector ? selector(state) : state
    })

    render(<FlowsTab element={mockSystem} />)
    expect(screen.getByText(/does not participate in any flows/i)).toBeInTheDocument()
  })
})
