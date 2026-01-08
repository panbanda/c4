import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReactFlowProvider, ReactFlow } from '@xyflow/react'
import { AnimatedFlowEdge } from '../AnimatedFlowEdge'
import { useStore } from '../../../store/useStore'
import type { C4Model } from '../../../types/c4'

vi.mock('../../../store/useStore', () => ({
  useStore: vi.fn(),
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ReactFlowProvider>
    <svg>{children}</svg>
  </ReactFlowProvider>
)

const baseEdgeProps = {
  id: 'edge1',
  source: 'node1',
  target: 'node2',
  sourceX: 100,
  sourceY: 100,
  targetX: 300,
  targetY: 200,
  sourcePosition: 'bottom' as const,
  targetPosition: 'top' as const,
  markerEnd: 'url(#arrow)',
  style: {},
  label: undefined,
  labelStyle: undefined,
  labelShowBg: undefined,
  labelBgStyle: undefined,
  labelBgPadding: undefined,
  labelBgBorderRadius: undefined,
  interactionWidth: undefined,
}

const mockModel: C4Model = {
  persons: [],
  systems: [],
  containers: [],
  components: [],
  relationships: [],
  flows: [
    {
      id: 'flow1',
      name: 'Test Flow',
      steps: [
        { seq: 1, from: 'node1', to: 'node2', description: 'Step 1' },
        { seq: 2, from: 'node2', to: 'node3', description: 'Step 2' },
      ],
    },
  ],
  deployments: [],
  options: { showMinimap: false },
}

describe('AnimatedFlowEdge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useStore).mockReturnValue({
      model: mockModel,
      activeFlow: null,
      flowStep: 0,
      currentView: 'landscape',
    })
  })

  it('should render edge path', () => {
    const { container } = render(
      <AnimatedFlowEdge {...baseEdgeProps} data={{}} />,
      { wrapper }
    )
    expect(container.querySelector('path')).toBeInTheDocument()
  })

  it('should render edge with bezier path', () => {
    const { container } = render(
      <AnimatedFlowEdge {...baseEdgeProps} data={{}} />,
      { wrapper }
    )
    const path = container.querySelector('path[id="edge1"]')
    expect(path).toBeInTheDocument()
    expect(path?.getAttribute('d')).toContain('M100,100')
  })

  it('should highlight active flow edge', () => {
    vi.mocked(useStore).mockReturnValue({
      model: mockModel,
      activeFlow: 'flow1',
      flowStep: 0,
      currentView: 'landscape',
    })

    const { container } = render(
      <AnimatedFlowEdge {...baseEdgeProps} data={{}} />,
      { wrapper }
    )

    const path = container.querySelector('path.flow-edge-active')
    expect(path).toBeInTheDocument()
  })

  it('should dim edge not in active flow', () => {
    vi.mocked(useStore).mockReturnValue({
      model: mockModel,
      activeFlow: 'flow1',
      flowStep: 0,
      currentView: 'landscape',
    })

    const { container } = render(
      <AnimatedFlowEdge
        {...baseEdgeProps}
        id="other-edge"
        source="nodeA"
        target="nodeB"
        data={{}}
      />,
      { wrapper }
    )

    const path = container.querySelector('path.stroke-slate-400\\/20')
    expect(path).toBeInTheDocument()
  })

  it('should highlight edge in flow but not active step', () => {
    vi.mocked(useStore).mockReturnValue({
      model: mockModel,
      activeFlow: 'flow1',
      flowStep: 0,
      currentView: 'landscape',
    })

    const { container } = render(
      <AnimatedFlowEdge
        {...baseEdgeProps}
        id="edge2"
        source="node2"
        target="node3"
        data={{}}
      />,
      { wrapper }
    )

    const path = container.querySelector('path.stroke-blue-400\\/40')
    expect(path).toBeInTheDocument()
  })

  it('should apply highlighted styling', () => {
    const { container } = render(
      <AnimatedFlowEdge {...baseEdgeProps} data={{ isHighlighted: true }} />,
      { wrapper }
    )

    // Default stroke color for highlighted edges without specific technology
    const path = container.querySelector('path.stroke-slate-400')
    expect(path).toBeInTheDocument()
  })

  it('should apply dimmed styling', () => {
    const { container } = render(
      <AnimatedFlowEdge {...baseEdgeProps} data={{ isDimmed: true }} />,
      { wrapper }
    )

    const path = container.querySelector('path.stroke-slate-600\\/15')
    expect(path).toBeInTheDocument()
  })

  it('should handle mouse enter/leave on edge group', () => {
    const { container } = render(
      <AnimatedFlowEdge {...baseEdgeProps} data={{ description: 'Test' }} />,
      { wrapper }
    )

    const group = container.querySelector('g')!
    fireEvent.mouseEnter(group)
    fireEvent.mouseLeave(group)

    expect(container.querySelector('g')).toBeInTheDocument()
  })

  it('should render invisible hover path', () => {
    const { container } = render(
      <AnimatedFlowEdge {...baseEdgeProps} data={{}} />,
      { wrapper }
    )

    const paths = container.querySelectorAll('path')
    const hoverPath = Array.from(paths).find(
      (p) => p.getAttribute('stroke') === 'transparent'
    )
    expect(hoverPath).toBeInTheDocument()
  })

  it('should handle null active flow', () => {
    vi.mocked(useStore).mockReturnValue({
      model: mockModel,
      activeFlow: null,
      flowStep: 0,
      currentView: 'landscape',
    })

    const { container } = render(
      <AnimatedFlowEdge {...baseEdgeProps} data={{}} />,
      { wrapper }
    )

    expect(container.querySelector('path')).toBeInTheDocument()
  })

  it('should handle undefined edge data', () => {
    const { container } = render(
      <AnimatedFlowEdge {...baseEdgeProps} data={undefined} />,
      { wrapper }
    )

    expect(container.querySelector('path')).toBeInTheDocument()
  })

  it('should apply stroke dash array for active flow edge', () => {
    vi.mocked(useStore).mockReturnValue({
      model: mockModel,
      activeFlow: 'flow1',
      flowStep: 0,
      currentView: 'landscape',
    })

    const { container } = render(
      <AnimatedFlowEdge {...baseEdgeProps} data={{}} />,
      { wrapper }
    )

    const path = container.querySelector('path[id="edge1"]')
    expect(path?.getAttribute('stroke-dasharray')).toBe('12 12')
  })

  it('should not have stroke dash array when not active flow edge', () => {
    const { container } = render(
      <AnimatedFlowEdge {...baseEdgeProps} data={{}} />,
      { wrapper }
    )

    const path = container.querySelector('path[id="edge1"]')
    expect(path?.getAttribute('stroke-dasharray')).toBeNull()
  })

  it('should render hover path with correct stroke width', () => {
    const { container } = render(
      <AnimatedFlowEdge {...baseEdgeProps} data={{}} />,
      { wrapper }
    )

    const paths = container.querySelectorAll('path')
    const hoverPath = Array.from(paths).find(
      (p) => p.getAttribute('stroke') === 'transparent'
    )
    expect(hoverPath?.getAttribute('stroke-width')).toBe('20')
  })

  it('should apply default stroke color when not active flow', () => {
    const { container } = render(
      <AnimatedFlowEdge {...baseEdgeProps} data={{}} />,
      { wrapper }
    )

    const path = container.querySelector('path.stroke-slate-400')
    expect(path).toBeInTheDocument()
  })

  it('should have correct edge marker', () => {
    const { container } = render(
      <AnimatedFlowEdge {...baseEdgeProps} data={{}} />,
      { wrapper }
    )

    const path = container.querySelector('path[id="edge1"]')
    expect(path?.getAttribute('marker-end')).toBe('url(#arrow)')
  })
})
