import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { KeyboardShortcuts } from '../KeyboardShortcuts'

describe('KeyboardShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not render by default', () => {
    render(<KeyboardShortcuts />)
    expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument()
  })

  it('should open when ? key is pressed', () => {
    render(<KeyboardShortcuts />)
    fireEvent.keyDown(window, { key: '?' })
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument()
  })

  it('should close when ? key is pressed again', () => {
    render(<KeyboardShortcuts />)
    fireEvent.keyDown(window, { key: '?' })
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: '?' })
    expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument()
  })

  it('should close when Escape is pressed', () => {
    render(<KeyboardShortcuts />)
    fireEvent.keyDown(window, { key: '?' })
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument()
  })

  it('should close when backdrop is clicked', () => {
    render(<KeyboardShortcuts />)
    fireEvent.keyDown(window, { key: '?' })
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument()
    const backdrop = document.querySelector('.backdrop-blur-sm')
    if (backdrop) fireEvent.click(backdrop)
    expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument()
  })

  it('should close when close button is clicked', () => {
    render(<KeyboardShortcuts />)
    fireEvent.keyDown(window, { key: '?' })
    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)
    expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument()
  })

  it('should display navigation shortcuts', () => {
    render(<KeyboardShortcuts />)
    fireEvent.keyDown(window, { key: '?' })
    expect(screen.getByText('Navigation')).toBeInTheDocument()
    expect(screen.getByText('Go up one level / Deselect')).toBeInTheDocument()
  })

  it('should display view shortcuts', () => {
    render(<KeyboardShortcuts />)
    fireEvent.keyDown(window, { key: '?' })
    expect(screen.getByText('View')).toBeInTheDocument()
    expect(screen.getByText('Context view (systems)')).toBeInTheDocument()
  })

  it('should display search shortcuts', () => {
    render(<KeyboardShortcuts />)
    fireEvent.keyDown(window, { key: '?' })
    expect(screen.getByText('Search')).toBeInTheDocument()
    expect(screen.getByText('Open command palette')).toBeInTheDocument()
  })

  it('should display flow playback shortcuts', () => {
    render(<KeyboardShortcuts />)
    fireEvent.keyDown(window, { key: '?' })
    expect(screen.getByText('Flow Playback')).toBeInTheDocument()
    expect(screen.getByText('Play / Pause flow')).toBeInTheDocument()
  })

  it('should not open when ? is typed in input', () => {
    render(
      <>
        <input data-testid="test-input" />
        <KeyboardShortcuts />
      </>
    )
    const input = screen.getByTestId('test-input')
    input.focus()
    fireEvent.keyDown(input, { key: '?' })
    expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument()
  })
})
