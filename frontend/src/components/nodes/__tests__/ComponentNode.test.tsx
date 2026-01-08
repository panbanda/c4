import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import { ComponentNode, ComponentNodeData } from '../ComponentNode'
import { useStore } from '../../../store/useStore'

vi.mock('../../../store/useStore', () => ({
  useStore: vi.fn(),
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ReactFlowProvider>{children}</ReactFlowProvider>
)

const baseNodeProps = {
  id: 'comp1',
  type: 'component',
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
  width: 240,
  height: 120,
}

describe('ComponentNode', () => {
  const mockOnSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        centralityData: {
          centrality: {
            comp1: { incoming: 2, outgoing: 1, total: 3 },
          },
          topNodes: [],
          flowParticipation: {
            comp1: ['flow1'],
          },
        },
      }
      return selector ? selector(state) : state
    })
  })

  it('should render component name', () => {
    const data: ComponentNodeData = {
      id: 'comp1',
      name: 'UserService',
      type: 'component',
      systemId: 'sys1',
      containerId: 'cont1',
      onSelect: mockOnSelect,
    }

    render(<ComponentNode {...baseNodeProps} data={data} selected={false} />, { wrapper })
    expect(screen.getByText('UserService')).toBeInTheDocument()
  })

  it('should render component description', () => {
    const data: ComponentNodeData = {
      id: 'comp1',
      name: 'UserService',
      type: 'component',
      systemId: 'sys1',
      containerId: 'cont1',
      description: 'Handles user management',
      onSelect: mockOnSelect,
    }

    render(<ComponentNode {...baseNodeProps} data={data} selected={false} />, { wrapper })
    expect(screen.getByText('Handles user management')).toBeInTheDocument()
  })

  it('should render Component label', () => {
    const data: ComponentNodeData = {
      id: 'comp1',
      name: 'Service',
      type: 'component',
      systemId: 'sys1',
      containerId: 'cont1',
      onSelect: mockOnSelect,
    }

    render(<ComponentNode {...baseNodeProps} data={data} selected={false} />, { wrapper })
    expect(screen.getByText('[Component]')).toBeInTheDocument()
  })

  it('should render technology badges', () => {
    const data: ComponentNodeData = {
      id: 'comp1',
      name: 'Service',
      type: 'component',
      systemId: 'sys1',
      containerId: 'cont1',
      technology: ['TypeScript', 'Node.js'],
      onSelect: mockOnSelect,
    }

    render(<ComponentNode {...baseNodeProps} data={data} selected={false} />, { wrapper })
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByText('Node.js')).toBeInTheDocument()
  })

  it('should call onSelect when clicked', () => {
    const data: ComponentNodeData = {
      id: 'comp1',
      name: 'Service',
      type: 'component',
      systemId: 'sys1',
      containerId: 'cont1',
      onSelect: mockOnSelect,
    }

    render(<ComponentNode {...baseNodeProps} data={data} selected={false} />, { wrapper })

    const node = screen.getByText('Service').closest('div[class*="rounded"]')
    fireEvent.click(node!)

    expect(mockOnSelect).toHaveBeenCalledWith('comp1')
  })

  it('should show selected styling when selected', () => {
    const data: ComponentNodeData = {
      id: 'comp1',
      name: 'Service',
      type: 'component',
      systemId: 'sys1',
      containerId: 'cont1',
      onSelect: mockOnSelect,
    }

    const { container } = render(
      <ComponentNode {...baseNodeProps} data={data} selected={true} />,
      { wrapper }
    )
    expect(container.querySelector('.ring-2')).toBeInTheDocument()
  })

  it('should render connection badges', () => {
    const data: ComponentNodeData = {
      id: 'comp1',
      name: 'Service',
      type: 'component',
      systemId: 'sys1',
      containerId: 'cont1',
      onSelect: mockOnSelect,
    }

    render(<ComponentNode {...baseNodeProps} data={data} selected={false} />, { wrapper })
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('should render flow badge', () => {
    const data: ComponentNodeData = {
      id: 'comp1',
      name: 'Service',
      type: 'component',
      systemId: 'sys1',
      containerId: 'cont1',
      onSelect: mockOnSelect,
    }

    render(<ComponentNode {...baseNodeProps} data={data} selected={false} />, { wrapper })
    expect(screen.getByTitle(/participates in 1 flow/i)).toBeInTheDocument()
  })

  it('should handle empty technology array', () => {
    const data: ComponentNodeData = {
      id: 'comp1',
      name: 'Service',
      type: 'component',
      systemId: 'sys1',
      containerId: 'cont1',
      technology: [],
      onSelect: mockOnSelect,
    }

    render(<ComponentNode {...baseNodeProps} data={data} selected={false} />, { wrapper })
    expect(screen.getByText('Service')).toBeInTheDocument()
  })

  it('should handle node without onSelect', () => {
    const data: ComponentNodeData = {
      id: 'comp1',
      name: 'Service',
      type: 'component',
      systemId: 'sys1',
      containerId: 'cont1',
    }

    render(<ComponentNode {...baseNodeProps} data={data} selected={false} />, { wrapper })

    const node = screen.getByText('Service').closest('div[class*="rounded"]')
    expect(() => fireEvent.click(node!)).not.toThrow()
  })

  it('should render tech icon', () => {
    const data: ComponentNodeData = {
      id: 'comp1',
      name: 'Service',
      type: 'component',
      systemId: 'sys1',
      containerId: 'cont1',
      technology: ['Python'],
      onSelect: mockOnSelect,
    }

    const { container } = render(
      <ComponentNode {...baseNodeProps} data={data} selected={false} />,
      { wrapper }
    )
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
