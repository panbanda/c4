import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { Search } from '../Search'

describe('Search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render search button', () => {
    render(<Search />)
    expect(screen.getByRole('button', { name: /open search/i })).toBeInTheDocument()
  })

  it('should display Search... placeholder text', () => {
    render(<Search />)
    expect(screen.getByText('Search...')).toBeInTheDocument()
  })

  it('should display keyboard shortcut hint', () => {
    render(<Search />)
    expect(screen.getByText('/')).toBeInTheDocument()
  })

  it('should dispatch keydown event when clicked', async () => {
    const user = userEvent.setup()
    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')

    render(<Search />)
    const button = screen.getByRole('button', { name: /open search/i })
    await user.click(button)

    expect(dispatchEventSpy).toHaveBeenCalled()
    const event = dispatchEventSpy.mock.calls[0][0] as KeyboardEvent
    expect(event.key).toBe('/')
  })

  it('should not show clear button when filter is empty', () => {
    render(<Search />)
    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument()
  })
})
