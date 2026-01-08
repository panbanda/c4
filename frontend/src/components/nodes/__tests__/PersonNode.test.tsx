import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import { PersonNode, PersonNodeData } from '../PersonNode'
import { useStore } from '../../../store/useStore'

vi.mock('../../../store/useStore', () => ({
  useStore: vi.fn(),
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ReactFlowProvider>{children}</ReactFlowProvider>
)

const baseNodeProps = {
  id: 'person1',
  type: 'person',
  dragging: false,
  zIndex: 1,
  isConnectable: true,
  positionAbsoluteX: 0,
  positionAbsoluteY: 0,
  sourcePosition: undefined,
  targetPosition: undefined,
  dragHandle: undefined,
  parentId: undefined,
  deletable: false,
  selectable: true,
  draggable: true,
  width: 200,
  height: 180,
}

describe('PersonNode', () => {
  const mockOnSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        centralityData: {
          centrality: {
            person1: { incoming: 3, outgoing: 2, total: 5 },
          },
          topNodes: [],
          flowParticipation: {
            person1: ['flow1', 'flow2'],
          },
        },
      }
      return selector ? selector(state) : state
    })
  })

  it('should render person name', () => {
    const data: PersonNodeData = {
      id: 'person1',
      name: 'John Doe',
      type: 'person',
      onSelect: mockOnSelect,
    }

    render(<PersonNode {...baseNodeProps} data={data} selected={false} />, { wrapper })
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('should render person description', () => {
    const data: PersonNodeData = {
      id: 'person1',
      name: 'John Doe',
      type: 'person',
      description: 'End user of the system',
      onSelect: mockOnSelect,
    }

    render(<PersonNode {...baseNodeProps} data={data} selected={false} />, { wrapper })
    expect(screen.getByText('End user of the system')).toBeInTheDocument()
  })

  it('should render Actor label', () => {
    const data: PersonNodeData = {
      id: 'person1',
      name: 'User',
      type: 'person',
      onSelect: mockOnSelect,
    }

    render(<PersonNode {...baseNodeProps} data={data} selected={false} />, { wrapper })
    expect(screen.getByText('[Actor]')).toBeInTheDocument()
  })

  it('should call onSelect when clicked', () => {
    const data: PersonNodeData = {
      id: 'person1',
      name: 'User',
      type: 'person',
      onSelect: mockOnSelect,
    }

    render(<PersonNode {...baseNodeProps} data={data} selected={false} />, { wrapper })

    const node = screen.getByText('User').closest('div[class*="rounded-lg"]')
    fireEvent.click(node!)

    expect(mockOnSelect).toHaveBeenCalledWith('person1')
  })

  it('should apply external styling for external persons', () => {
    const data: PersonNodeData = {
      id: 'person1',
      name: 'External User',
      type: 'person',
      tags: ['external'],
      onSelect: mockOnSelect,
    }

    const { container } = render(
      <PersonNode {...baseNodeProps} data={data} selected={false} />,
      { wrapper }
    )
    expect(container.querySelector('.bg-teal-800')).toBeInTheDocument()
  })

  it('should apply internal styling for internal persons', () => {
    const data: PersonNodeData = {
      id: 'person1',
      name: 'Internal User',
      type: 'person',
      tags: [],
      onSelect: mockOnSelect,
    }

    const { container } = render(
      <PersonNode {...baseNodeProps} data={data} selected={false} />,
      { wrapper }
    )
    expect(container.querySelector('.bg-teal-700')).toBeInTheDocument()
  })

  it('should show selected styling when selected', () => {
    const data: PersonNodeData = {
      id: 'person1',
      name: 'User',
      type: 'person',
      onSelect: mockOnSelect,
    }

    const { container } = render(
      <PersonNode {...baseNodeProps} data={data} selected={true} />,
      { wrapper }
    )
    expect(container.querySelector('.ring-2')).toBeInTheDocument()
  })

  it('should render connection badges', () => {
    const data: PersonNodeData = {
      id: 'person1',
      name: 'User',
      type: 'person',
      onSelect: mockOnSelect,
    }

    render(<PersonNode {...baseNodeProps} data={data} selected={false} />, { wrapper })
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('should render flow badge', () => {
    const data: PersonNodeData = {
      id: 'person1',
      name: 'User',
      type: 'person',
      onSelect: mockOnSelect,
    }

    render(<PersonNode {...baseNodeProps} data={data} selected={false} />, { wrapper })
    expect(screen.getByTitle(/participates in 2 flows/i)).toBeInTheDocument()
  })

  it('should handle node without onSelect', () => {
    const data: PersonNodeData = {
      id: 'person1',
      name: 'User',
      type: 'person',
    }

    render(<PersonNode {...baseNodeProps} data={data} selected={false} />, { wrapper })

    const node = screen.getByText('User').closest('div[class*="rounded-lg"]')
    expect(() => fireEvent.click(node!)).not.toThrow()
  })

  it('should handle null centralityData', () => {
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = { centralityData: null }
      return selector ? selector(state) : state
    })

    const data: PersonNodeData = {
      id: 'person1',
      name: 'User',
      type: 'person',
    }

    render(<PersonNode {...baseNodeProps} data={data} selected={false} />, { wrapper })
    expect(screen.getByText('User')).toBeInTheDocument()
  })
})
