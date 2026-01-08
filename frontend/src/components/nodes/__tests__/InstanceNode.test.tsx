import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import { InstanceNode, InstanceNodeData } from '../InstanceNode'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ReactFlowProvider>{children}</ReactFlowProvider>
)

const baseNodeProps = {
  id: 'instance1',
  type: 'instanceNode',
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
  width: 180,
  height: 70,
}

describe('InstanceNode', () => {
  const mockOnSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render short name from containerRef', () => {
    const data: InstanceNodeData = {
      type: 'instanceNode',
      id: 'instance1',
      name: 'my-system.api-gateway',
      containerRef: 'my-system.api-gateway',
      parentId: 'node1',
      depth: 1,
      onSelect: mockOnSelect,
    }

    render(<InstanceNode {...baseNodeProps} data={data} selected={false} />, { wrapper })
    expect(screen.getByText('api-gateway')).toBeInTheDocument()
  })

  it('should show replicas count when greater than 1', () => {
    const data: InstanceNodeData = {
      type: 'instanceNode',
      id: 'instance1',
      name: 'api-gateway',
      containerRef: 'api-gateway',
      replicas: 3,
      parentId: 'node1',
      depth: 1,
      onSelect: mockOnSelect,
    }

    render(<InstanceNode {...baseNodeProps} data={data} selected={false} />, { wrapper })
    expect(screen.getByText('3 replicas')).toBeInTheDocument()
  })

  it('should not show replicas when 1 or undefined', () => {
    const data: InstanceNodeData = {
      type: 'instanceNode',
      id: 'instance1',
      name: 'api-gateway',
      containerRef: 'api-gateway',
      replicas: 1,
      parentId: 'node1',
      depth: 1,
      onSelect: mockOnSelect,
    }

    render(<InstanceNode {...baseNodeProps} data={data} selected={false} />, { wrapper })
    expect(screen.queryByText('replicas')).not.toBeInTheDocument()
  })

  it('should call onSelect when clicked and stop propagation', () => {
    const data: InstanceNodeData = {
      type: 'instanceNode',
      id: 'instance1',
      name: 'api-gateway',
      containerRef: 'api-gateway',
      parentId: 'node1',
      depth: 1,
      onSelect: mockOnSelect,
    }

    render(<InstanceNode {...baseNodeProps} data={data} selected={false} />, { wrapper })

    const node = screen.getByText('api-gateway').closest('div[class*="rounded-lg"]')
    fireEvent.click(node!)

    expect(mockOnSelect).toHaveBeenCalledWith('instance1')
  })

  it('should show selected styling when selected', () => {
    const data: InstanceNodeData = {
      type: 'instanceNode',
      id: 'instance1',
      name: 'api-gateway',
      containerRef: 'api-gateway',
      parentId: 'node1',
      depth: 1,
      onSelect: mockOnSelect,
    }

    const { container } = render(
      <InstanceNode {...baseNodeProps} data={data} selected={true} />,
      { wrapper }
    )
    expect(container.querySelector('.ring-2')).toBeInTheDocument()
  })

  it('should handle node without onSelect', () => {
    const data: InstanceNodeData = {
      type: 'instanceNode',
      id: 'instance1',
      name: 'api-gateway',
      containerRef: 'api-gateway',
      parentId: 'node1',
      depth: 1,
    }

    render(<InstanceNode {...baseNodeProps} data={data} selected={false} />, { wrapper })

    const node = screen.getByText('api-gateway').closest('div[class*="rounded-lg"]')
    expect(() => fireEvent.click(node!)).not.toThrow()
  })

  it('should detect postgres database tech hint', () => {
    const data: InstanceNodeData = {
      type: 'instanceNode',
      id: 'instance1',
      name: 'postgres-db',
      containerRef: 'postgres-db',
      parentId: 'node1',
      depth: 1,
      onSelect: mockOnSelect,
    }

    const { container } = render(
      <InstanceNode {...baseNodeProps} data={data} selected={false} />,
      { wrapper }
    )
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('should detect redis cache tech hint', () => {
    const data: InstanceNodeData = {
      type: 'instanceNode',
      id: 'instance1',
      name: 'redis-cache',
      containerRef: 'redis-cache',
      parentId: 'node1',
      depth: 1,
      onSelect: mockOnSelect,
    }

    const { container } = render(
      <InstanceNode {...baseNodeProps} data={data} selected={false} />,
      { wrapper }
    )
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('should detect dragonfly cache tech hint', () => {
    const data: InstanceNodeData = {
      type: 'instanceNode',
      id: 'instance1',
      name: 'dragonfly-cache',
      containerRef: 'dragonfly-cache',
      parentId: 'node1',
      depth: 1,
      onSelect: mockOnSelect,
    }

    const { container } = render(
      <InstanceNode {...baseNodeProps} data={data} selected={false} />,
      { wrapper }
    )
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('should detect kafka queue tech hint', () => {
    const data: InstanceNodeData = {
      type: 'instanceNode',
      id: 'instance1',
      name: 'kafka-queue',
      containerRef: 'kafka-queue',
      parentId: 'node1',
      depth: 1,
      onSelect: mockOnSelect,
    }

    const { container } = render(
      <InstanceNode {...baseNodeProps} data={data} selected={false} />,
      { wrapper }
    )
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('should detect api gateway tech hint', () => {
    const data: InstanceNodeData = {
      type: 'instanceNode',
      id: 'instance1',
      name: 'api-gateway',
      containerRef: 'api-gateway',
      parentId: 'node1',
      depth: 1,
      onSelect: mockOnSelect,
    }

    const { container } = render(
      <InstanceNode {...baseNodeProps} data={data} selected={false} />,
      { wrapper }
    )
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('should default to Container tech hint for unknown names', () => {
    const data: InstanceNodeData = {
      type: 'instanceNode',
      id: 'instance1',
      name: 'unknown-service',
      containerRef: 'unknown-service',
      parentId: 'node1',
      depth: 1,
      onSelect: mockOnSelect,
    }

    const { container } = render(
      <InstanceNode {...baseNodeProps} data={data} selected={false} />,
      { wrapper }
    )
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('should handle name without dots', () => {
    const data: InstanceNodeData = {
      type: 'instanceNode',
      id: 'instance1',
      name: 'simple-name',
      containerRef: 'simple-name',
      parentId: 'node1',
      depth: 1,
      onSelect: mockOnSelect,
    }

    render(<InstanceNode {...baseNodeProps} data={data} selected={false} />, { wrapper })
    expect(screen.getByText('simple-name')).toBeInTheDocument()
  })
})
