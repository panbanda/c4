import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { FormField } from '../FormField'

describe('FormField', () => {
  it('should render label', () => {
    render(<FormField label="Test Label" value="" onChange={() => {}} />)
    expect(screen.getByText('Test Label')).toBeInTheDocument()
  })

  it('should render input with value', () => {
    render(<FormField label="Name" value="Test Value" onChange={() => {}} />)
    expect(screen.getByDisplayValue('Test Value')).toBeInTheDocument()
  })

  it('should call onChange when typing', async () => {
    const mockOnChange = vi.fn()
    const user = userEvent.setup()

    render(<FormField label="Name" value="" onChange={mockOnChange} />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'a')

    expect(mockOnChange).toHaveBeenCalledWith('a')
  })

  it('should call onBlur when input loses focus', async () => {
    const mockOnBlur = vi.fn()
    const user = userEvent.setup()

    render(<FormField label="Name" value="test" onChange={() => {}} onBlur={mockOnBlur} />)

    const input = screen.getByRole('textbox')
    await user.click(input)
    await user.tab()

    expect(mockOnBlur).toHaveBeenCalled()
  })

  it('should render textarea when multiline is true', () => {
    render(<FormField label="Description" value="" onChange={() => {}} multiline />)
    expect(screen.getByRole('textbox').tagName).toBe('TEXTAREA')
  })

  it('should render input when multiline is false', () => {
    render(<FormField label="Name" value="" onChange={() => {}} multiline={false} />)
    expect(screen.getByRole('textbox').tagName).toBe('INPUT')
  })

  it('should apply placeholder', () => {
    render(<FormField label="Tags" value="" onChange={() => {}} placeholder="Enter tags..." />)
    expect(screen.getByPlaceholderText('Enter tags...')).toBeInTheDocument()
  })

  it('should apply custom rows to textarea', () => {
    render(<FormField label="Content" value="" onChange={() => {}} multiline rows={5} />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveAttribute('rows', '5')
  })

  it('should use default rows of 3 for textarea', () => {
    render(<FormField label="Content" value="" onChange={() => {}} multiline />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveAttribute('rows', '3')
  })

  it('should handle onChange in textarea', async () => {
    const mockOnChange = vi.fn()
    const user = userEvent.setup()

    render(<FormField label="Description" value="" onChange={mockOnChange} multiline />)

    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'x')

    expect(mockOnChange).toHaveBeenCalledWith('x')
  })

  it('should handle onBlur in textarea', async () => {
    const mockOnBlur = vi.fn()
    const user = userEvent.setup()

    render(<FormField label="Description" value="" onChange={() => {}} onBlur={mockOnBlur} multiline />)

    const textarea = screen.getByRole('textbox')
    await user.click(textarea)
    await user.tab()

    expect(mockOnBlur).toHaveBeenCalled()
  })
})
