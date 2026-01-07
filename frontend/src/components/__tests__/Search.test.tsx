import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { Search } from '../Search'
import { useStore } from '../../store/useStore'

vi.mock('../../store/useStore', () => ({
  useStore: vi.fn(),
}))

describe('Search', () => {
  const mockSetFilterQuery = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render search input', () => {
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        filterQuery: '',
        setFilterQuery: mockSetFilterQuery,
      }
      return selector ? selector(state) : state
    })

    render(<Search />)
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
  })

  it('should display current filter query', () => {
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        filterQuery: 'payment',
        setFilterQuery: mockSetFilterQuery,
      }
      return selector ? selector(state) : state
    })

    render(<Search />)
    const input = screen.getByPlaceholderText(/search/i) as HTMLInputElement
    expect(input.value).toBe('payment')
  })

  it('should update filter query on input change', async () => {
    const user = userEvent.setup()
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        filterQuery: '',
        setFilterQuery: mockSetFilterQuery,
      }
      return selector ? selector(state) : state
    })

    render(<Search />)

    const input = screen.getByPlaceholderText(/search/i)
    await user.type(input, 'api')

    // Wait for debounce (300ms)
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 350))
    })

    expect(mockSetFilterQuery).toHaveBeenCalledWith('api')
  })

  it('should clear filter when clear button clicked', async () => {
    const user = userEvent.setup()
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        filterQuery: 'payment',
        setFilterQuery: mockSetFilterQuery,
      }
      return selector ? selector(state) : state
    })

    render(<Search />)

    const clearButton = screen.getByRole('button', { name: /clear/i })
    await user.click(clearButton)

    expect(mockSetFilterQuery).toHaveBeenCalledWith('')
  })

  it('should not show clear button when filter is empty', () => {
    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        filterQuery: '',
        setFilterQuery: mockSetFilterQuery,
      }
      return selector ? selector(state) : state
    })

    render(<Search />)

    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument()
  })
})
