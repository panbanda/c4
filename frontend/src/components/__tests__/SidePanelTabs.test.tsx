import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SidePanelTabs } from '../SidePanelTabs'

describe('SidePanelTabs', () => {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'dependencies', label: 'Dependencies' },
    { id: 'flows', label: 'Flows' },
  ]

  it('renders all tabs', () => {
    render(<SidePanelTabs tabs={tabs} activeTab="overview" onTabChange={() => {}} />)
    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('Dependencies')).toBeInTheDocument()
    expect(screen.getByText('Flows')).toBeInTheDocument()
  })

  it('highlights active tab', () => {
    render(<SidePanelTabs tabs={tabs} activeTab="dependencies" onTabChange={() => {}} />)
    const activeTab = screen.getByText('Dependencies').closest('button')
    expect(activeTab).toHaveClass('border-blue-500')
  })

  it('calls onTabChange when tab clicked', () => {
    const onTabChange = vi.fn()
    render(<SidePanelTabs tabs={tabs} activeTab="overview" onTabChange={onTabChange} />)
    fireEvent.click(screen.getByText('Flows'))
    expect(onTabChange).toHaveBeenCalledWith('flows')
  })
})
