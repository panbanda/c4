// frontend/src/components/nodes/__tests__/NodeBadge.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConnectionBadge, FlowBadge, ChildrenBadge } from '../NodeBadge'

describe('ConnectionBadge', () => {
  it('renders incoming and outgoing counts', () => {
    render(<ConnectionBadge incoming={3} outgoing={5} />)
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('returns null when both counts are zero', () => {
    const { container } = render(<ConnectionBadge incoming={0} outgoing={0} />)
    expect(container.firstChild).toBeNull()
  })

  it('highlights when total exceeds threshold', () => {
    render(<ConnectionBadge incoming={3} outgoing={4} highThreshold={5} />)
    expect(screen.getByTestId('connection-badge')).toHaveClass('bg-blue-600')
  })
})

describe('FlowBadge', () => {
  it('renders when flows exist', () => {
    render(<FlowBadge flowCount={2} />)
    expect(screen.getByTestId('flow-badge')).toBeInTheDocument()
  })

  it('returns null when no flows', () => {
    const { container } = render(<FlowBadge flowCount={0} />)
    expect(container.firstChild).toBeNull()
  })
})

describe('ChildrenBadge', () => {
  it('renders children count', () => {
    render(<ChildrenBadge count={4} />)
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('returns null when count is zero', () => {
    const { container } = render(<ChildrenBadge count={0} />)
    expect(container.firstChild).toBeNull()
  })
})
