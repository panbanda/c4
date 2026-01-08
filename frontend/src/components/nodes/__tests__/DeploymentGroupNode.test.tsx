import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import { DeploymentGroupNode, DeploymentGroupNodeData } from '../DeploymentGroupNode'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ReactFlowProvider>{children}</ReactFlowProvider>
)

const baseNodeProps = {
  id: 'group1',
  type: 'deploymentGroup',
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
  width: 400,
  height: 300,
}

describe('DeploymentGroupNode', () => {
  const mockOnSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render group name', () => {
    const data: DeploymentGroupNodeData = {
      type: 'deploymentNode',
      id: 'group1',
      name: 'US East Region',
      depth: 0,
      childCount: 3,
      onSelect: mockOnSelect,
    }

    render(<DeploymentGroupNode {...baseNodeProps} data={data} selected={false} />, { wrapper })
    expect(screen.getByText('US East Region')).toBeInTheDocument()
  })

  it('should render technology badges', () => {
    const data: DeploymentGroupNodeData = {
      type: 'deploymentNode',
      id: 'group1',
      name: 'Cluster',
      depth: 0,
      technology: ['AWS', 'Kubernetes'],
      childCount: 2,
      onSelect: mockOnSelect,
    }

    render(<DeploymentGroupNode {...baseNodeProps} data={data} selected={false} />, { wrapper })
    expect(screen.getByText('AWS')).toBeInTheDocument()
    expect(screen.getByText('Kubernetes')).toBeInTheDocument()
  })

  it('should limit technology badges to 3', () => {
    const data: DeploymentGroupNodeData = {
      type: 'deploymentNode',
      id: 'group1',
      name: 'Cluster',
      depth: 0,
      technology: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'Helm'],
      childCount: 2,
      onSelect: mockOnSelect,
    }

    render(<DeploymentGroupNode {...baseNodeProps} data={data} selected={false} />, { wrapper })
    expect(screen.getByText('AWS')).toBeInTheDocument()
    expect(screen.getByText('Kubernetes')).toBeInTheDocument()
    expect(screen.getByText('Docker')).toBeInTheDocument()
    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  it('should call onSelect when clicked and stop propagation', () => {
    const data: DeploymentGroupNodeData = {
      type: 'deploymentNode',
      id: 'group1',
      name: 'Region',
      depth: 0,
      childCount: 2,
      onSelect: mockOnSelect,
    }

    render(<DeploymentGroupNode {...baseNodeProps} data={data} selected={false} />, { wrapper })

    const node = screen.getByText('Region').closest('div[class*="rounded-lg"]')
    fireEvent.click(node!)

    expect(mockOnSelect).toHaveBeenCalledWith('group1')
  })

  it('should show selected styling when selected', () => {
    const data: DeploymentGroupNodeData = {
      type: 'deploymentNode',
      id: 'group1',
      name: 'Region',
      depth: 0,
      childCount: 2,
      onSelect: mockOnSelect,
    }

    const { container } = render(
      <DeploymentGroupNode {...baseNodeProps} data={data} selected={true} />,
      { wrapper }
    )
    expect(container.querySelector('.ring-2')).toBeInTheDocument()
  })

  it('should apply depth-based colors', () => {
    const data0: DeploymentGroupNodeData = {
      type: 'deploymentNode',
      id: 'group0',
      name: 'Region',
      depth: 0,
      childCount: 2,
      onSelect: mockOnSelect,
    }

    const { container: container0 } = render(
      <DeploymentGroupNode {...baseNodeProps} data={data0} selected={false} />,
      { wrapper }
    )
    expect(container0.querySelector('.border-amber-500')).toBeInTheDocument()

    const data1: DeploymentGroupNodeData = {
      type: 'deploymentNode',
      id: 'group1',
      name: 'Zone',
      depth: 1,
      childCount: 2,
      onSelect: mockOnSelect,
    }

    const { container: container1 } = render(
      <DeploymentGroupNode {...baseNodeProps} data={data1} selected={false} />,
      { wrapper }
    )
    expect(container1.querySelector('.border-amber-400')).toBeInTheDocument()
  })

  it('should handle node without onSelect', () => {
    const data: DeploymentGroupNodeData = {
      type: 'deploymentNode',
      id: 'group1',
      name: 'Region',
      depth: 0,
      childCount: 2,
    }

    render(<DeploymentGroupNode {...baseNodeProps} data={data} selected={false} />, { wrapper })

    const node = screen.getByText('Region').closest('div[class*="rounded-lg"]')
    expect(() => fireEvent.click(node!)).not.toThrow()
  })

  it('should handle empty technology array', () => {
    const data: DeploymentGroupNodeData = {
      type: 'deploymentNode',
      id: 'group1',
      name: 'Region',
      depth: 0,
      technology: [],
      childCount: 2,
      onSelect: mockOnSelect,
    }

    render(<DeploymentGroupNode {...baseNodeProps} data={data} selected={false} />, { wrapper })
    expect(screen.getByText('Region')).toBeInTheDocument()
  })

  it('should handle deeply nested depth', () => {
    const data: DeploymentGroupNodeData = {
      type: 'deploymentNode',
      id: 'group1',
      name: 'Deep Nested',
      depth: 10,
      childCount: 1,
      onSelect: mockOnSelect,
    }

    const { container } = render(
      <DeploymentGroupNode {...baseNodeProps} data={data} selected={false} />,
      { wrapper }
    )
    expect(container.querySelector('.border-amber-200')).toBeInTheDocument()
  })

  it('should render tech icon', () => {
    const data: DeploymentGroupNodeData = {
      type: 'deploymentNode',
      id: 'group1',
      name: 'Kubernetes Cluster',
      depth: 0,
      technology: ['Kubernetes'],
      childCount: 3,
      onSelect: mockOnSelect,
    }

    const { container } = render(
      <DeploymentGroupNode {...baseNodeProps} data={data} selected={false} />,
      { wrapper }
    )
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
