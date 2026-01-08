import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import { DeploymentNode, DeploymentNodeData } from '../DeploymentNode'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ReactFlowProvider>{children}</ReactFlowProvider>
)

const baseNodeProps = {
  id: 'deploy1',
  type: 'deploymentNode',
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
  width: 300,
  height: 180,
}

describe('DeploymentNode', () => {
  const mockOnSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render deployment node name', () => {
    const data: DeploymentNodeData = {
      type: 'deploymentNode',
      id: 'deploy1',
      name: 'Production Server',
      depth: 0,
      onSelect: mockOnSelect,
    }

    render(<DeploymentNode {...baseNodeProps} data={data} selected={false} />, { wrapper })
    expect(screen.getByText('Production Server')).toBeInTheDocument()
  })

  it('should render technology badges', () => {
    const data: DeploymentNodeData = {
      type: 'deploymentNode',
      id: 'deploy1',
      name: 'Server',
      depth: 0,
      technology: ['Kubernetes', 'Docker'],
      onSelect: mockOnSelect,
    }

    render(<DeploymentNode {...baseNodeProps} data={data} selected={false} />, { wrapper })
    expect(screen.getByText('Kubernetes')).toBeInTheDocument()
    expect(screen.getByText('Docker')).toBeInTheDocument()
  })

  it('should render Deployment Node label', () => {
    const data: DeploymentNodeData = {
      type: 'deploymentNode',
      id: 'deploy1',
      name: 'Server',
      depth: 0,
      onSelect: mockOnSelect,
    }

    render(<DeploymentNode {...baseNodeProps} data={data} selected={false} />, { wrapper })
    expect(screen.getByText('[Deployment Node]')).toBeInTheDocument()
  })

  it('should call onSelect when clicked', () => {
    const data: DeploymentNodeData = {
      type: 'deploymentNode',
      id: 'deploy1',
      name: 'Server',
      depth: 0,
      onSelect: mockOnSelect,
    }

    render(<DeploymentNode {...baseNodeProps} data={data} selected={false} />, { wrapper })

    const node = screen.getByText('Server').closest('div[class*="rounded"]')
    fireEvent.click(node!)

    expect(mockOnSelect).toHaveBeenCalledWith('deploy1')
  })

  it('should show selected styling when selected', () => {
    const data: DeploymentNodeData = {
      type: 'deploymentNode',
      id: 'deploy1',
      name: 'Server',
      depth: 0,
      onSelect: mockOnSelect,
    }

    const { container } = render(
      <DeploymentNode {...baseNodeProps} data={data} selected={true} />,
      { wrapper }
    )
    expect(container.querySelector('.ring-2')).toBeInTheDocument()
  })

  it('should render container instances', () => {
    const data: DeploymentNodeData = {
      type: 'deploymentNode',
      id: 'deploy1',
      name: 'Server',
      depth: 0,
      instances: [
        { container: 'sys1.api-gateway' },
        { container: 'sys1.web-app', replicas: 3 },
      ],
      onSelect: mockOnSelect,
    }

    render(<DeploymentNode {...baseNodeProps} data={data} selected={false} />, { wrapper })
    expect(screen.getByText('Containers:')).toBeInTheDocument()
    expect(screen.getByText('sys1.api-gateway')).toBeInTheDocument()
    expect(screen.getByText('sys1.web-app')).toBeInTheDocument()
    expect(screen.getByText('x3')).toBeInTheDocument()
  })

  it('should show +N more when more than 3 instances', () => {
    const data: DeploymentNodeData = {
      type: 'deploymentNode',
      id: 'deploy1',
      name: 'Server',
      depth: 0,
      instances: [
        { container: 'cont1' },
        { container: 'cont2' },
        { container: 'cont3' },
        { container: 'cont4' },
        { container: 'cont5' },
      ],
      onSelect: mockOnSelect,
    }

    render(<DeploymentNode {...baseNodeProps} data={data} selected={false} />, { wrapper })
    expect(screen.getByText('+2 more')).toBeInTheDocument()
  })

  it('should apply depth-based colors', () => {
    const data0: DeploymentNodeData = {
      type: 'deploymentNode',
      id: 'deploy0',
      name: 'Region',
      depth: 0,
      onSelect: mockOnSelect,
    }

    const { container: container0 } = render(
      <DeploymentNode {...baseNodeProps} data={data0} selected={false} />,
      { wrapper }
    )
    expect(container0.querySelector('.bg-amber-800')).toBeInTheDocument()

    const data1: DeploymentNodeData = {
      type: 'deploymentNode',
      id: 'deploy1',
      name: 'Zone',
      depth: 1,
      onSelect: mockOnSelect,
    }

    const { container: container1 } = render(
      <DeploymentNode {...baseNodeProps} data={data1} selected={false} />,
      { wrapper }
    )
    expect(container1.querySelector('.bg-amber-700')).toBeInTheDocument()
  })

  it('should handle node without onSelect', () => {
    const data: DeploymentNodeData = {
      type: 'deploymentNode',
      id: 'deploy1',
      name: 'Server',
      depth: 0,
    }

    render(<DeploymentNode {...baseNodeProps} data={data} selected={false} />, { wrapper })

    const node = screen.getByText('Server').closest('div[class*="rounded"]')
    expect(() => fireEvent.click(node!)).not.toThrow()
  })

  it('should handle empty technology array', () => {
    const data: DeploymentNodeData = {
      type: 'deploymentNode',
      id: 'deploy1',
      name: 'Server',
      depth: 0,
      technology: [],
      onSelect: mockOnSelect,
    }

    render(<DeploymentNode {...baseNodeProps} data={data} selected={false} />, { wrapper })
    expect(screen.queryByText('Kubernetes')).not.toBeInTheDocument()
  })

  it('should handle deeply nested depth', () => {
    const data: DeploymentNodeData = {
      type: 'deploymentNode',
      id: 'deploy1',
      name: 'Nested',
      depth: 10,
      onSelect: mockOnSelect,
    }

    const { container } = render(
      <DeploymentNode {...baseNodeProps} data={data} selected={false} />,
      { wrapper }
    )
    expect(container.querySelector('.bg-amber-500')).toBeInTheDocument()
  })
})
