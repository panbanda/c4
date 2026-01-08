import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CommandPalette } from '../CommandPalette'
import { useStore } from '../../store/useStore'
import type { C4Model } from '../../types/c4'

vi.mock('../../store/useStore', () => ({
  useStore: vi.fn(),
}))

const mockModel: C4Model = {
  persons: [{ id: 'user', name: 'User', type: 'person' }],
  systems: [
    { id: 'sys1', name: 'System One', type: 'system' },
    { id: 'sys2', name: 'System Two', type: 'system' },
  ],
  containers: [
    { id: 'api', name: 'API', type: 'container', systemId: 'sys1' },
  ],
  components: [],
  relationships: [],
  flows: [],
  deployments: [],
  options: { showMinimap: false },
}

describe('CommandPalette', () => {
  const mockSelectElement = vi.fn()
  const mockSetView = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useStore).mockReturnValue({
      model: mockModel,
      selectElement: mockSelectElement,
      setView: mockSetView,
      focusElement: null,
    })
  })

  it('should not render by default', () => {
    render(<CommandPalette />)
    expect(screen.queryByPlaceholderText('Search elements and actions...')).not.toBeInTheDocument()
  })

  it('should open when Cmd+K is pressed', () => {
    render(<CommandPalette />)
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(screen.getByPlaceholderText('Search elements and actions...')).toBeInTheDocument()
  })

  it('should open when Ctrl+K is pressed', () => {
    render(<CommandPalette />)
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    expect(screen.getByPlaceholderText('Search elements and actions...')).toBeInTheDocument()
  })

  it('should open when / is pressed', () => {
    render(<CommandPalette />)
    fireEvent.keyDown(window, { key: '/' })
    expect(screen.getByPlaceholderText('Search elements and actions...')).toBeInTheDocument()
  })

  it('should not open when / is pressed in input', () => {
    render(
      <>
        <input data-testid="test-input" />
        <CommandPalette />
      </>
    )
    const input = screen.getByTestId('test-input')
    input.focus()
    fireEvent.keyDown(input, { key: '/' })
    expect(screen.queryByPlaceholderText('Search elements and actions...')).not.toBeInTheDocument()
  })

  it('should close when Escape is pressed', () => {
    render(<CommandPalette />)
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(screen.getByPlaceholderText('Search elements and actions...')).toBeInTheDocument()

    const input = screen.getByPlaceholderText('Search elements and actions...')
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByPlaceholderText('Search elements and actions...')).not.toBeInTheDocument()
  })

  it('should close when backdrop is clicked', () => {
    render(<CommandPalette />)
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(screen.getByPlaceholderText('Search elements and actions...')).toBeInTheDocument()

    const backdrop = document.querySelector('.backdrop-blur-sm')
    if (backdrop) fireEvent.click(backdrop)
    expect(screen.queryByPlaceholderText('Search elements and actions...')).not.toBeInTheDocument()
  })

  it('should display view commands', () => {
    render(<CommandPalette />)
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(screen.getByText('Views')).toBeInTheDocument()
    expect(screen.getByText('Landscape View')).toBeInTheDocument()
    expect(screen.getByText('Deployment View')).toBeInTheDocument()
  })

  it('should display element commands', () => {
    render(<CommandPalette />)
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(screen.getByText('Persons')).toBeInTheDocument()
    expect(screen.getByText('User')).toBeInTheDocument()
    expect(screen.getByText('Systems')).toBeInTheDocument()
    expect(screen.getByText('System One')).toBeInTheDocument()
  })

  it('should filter commands by query', () => {
    render(<CommandPalette />)
    fireEvent.keyDown(window, { key: 'k', metaKey: true })

    const input = screen.getByPlaceholderText('Search elements and actions...')
    fireEvent.change(input, { target: { value: 'user' } })

    expect(screen.getByText('User')).toBeInTheDocument()
    expect(screen.queryByText('System One')).not.toBeInTheDocument()
  })

  it('should show no results message when nothing matches', () => {
    render(<CommandPalette />)
    fireEvent.keyDown(window, { key: 'k', metaKey: true })

    const input = screen.getByPlaceholderText('Search elements and actions...')
    fireEvent.change(input, { target: { value: 'nonexistent' } })

    expect(screen.getByText('No results found')).toBeInTheDocument()
  })

  it('should navigate with arrow keys', () => {
    render(<CommandPalette />)
    fireEvent.keyDown(window, { key: 'k', metaKey: true })

    const input = screen.getByPlaceholderText('Search elements and actions...')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowUp' })

    // Should be on second item
    expect(input).toBeInTheDocument()
  })

  it('should call setView when view command is selected', () => {
    render(<CommandPalette />)
    fireEvent.keyDown(window, { key: 'k', metaKey: true })

    const deploymentView = screen.getByText('Deployment View')
    fireEvent.click(deploymentView.closest('button')!)

    expect(mockSetView).toHaveBeenCalledWith('deployment')
  })

  it('should call selectElement when element command is selected', () => {
    render(<CommandPalette />)
    fireEvent.keyDown(window, { key: 'k', metaKey: true })

    const userItem = screen.getByText('User')
    fireEvent.click(userItem.closest('button')!)

    expect(mockSelectElement).toHaveBeenCalledWith('user')
  })

  it('should handle Enter key to select command', () => {
    render(<CommandPalette />)
    fireEvent.keyDown(window, { key: 'k', metaKey: true })

    const input = screen.getByPlaceholderText('Search elements and actions...')
    fireEvent.keyDown(input, { key: 'Enter' })

    // First command should be executed (Landscape View)
    expect(mockSetView).toHaveBeenCalledWith('landscape')
  })

  it('should handle null model gracefully', () => {
    vi.mocked(useStore).mockReturnValue({
      model: null,
      selectElement: mockSelectElement,
      setView: mockSetView,
      focusElement: null,
    })

    render(<CommandPalette />)
    fireEvent.keyDown(window, { key: 'k', metaKey: true })

    // Should still show view commands
    expect(screen.getByText('Views')).toBeInTheDocument()
    expect(screen.queryByText('Persons')).not.toBeInTheDocument()
  })
})
