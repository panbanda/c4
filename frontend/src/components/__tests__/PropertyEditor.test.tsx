import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { act } from 'react'
import { PropertyEditor } from '../PropertyEditor'
import { useStore } from '../../store/useStore'
import type { Container, SoftwareSystem } from '../../types/c4'

vi.mock('../../store/useStore', () => ({
  useStore: vi.fn(),
}))

const mockContainer: Container = {
  id: 'container1',
  name: 'Test Container',
  type: 'container',
  description: 'A test container',
  technology: ['React', 'TypeScript'],
  tags: ['frontend', 'ui'],
  systemId: 'sys1',
}

const mockSystem: SoftwareSystem = {
  id: 'system1',
  name: 'Test System',
  type: 'system',
  description: 'A test system',
  tags: ['backend'],
}

describe('PropertyEditor', () => {
  const mockUpdateElement = vi.fn()
  const mockSaveChanges = vi.fn().mockResolvedValue(undefined)
  const mockDiscardChanges = vi.fn()
  const mockSelectElement = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        updateElement: mockUpdateElement,
        saveChanges: mockSaveChanges,
        discardChanges: mockDiscardChanges,
        selectElement: mockSelectElement,
        pendingChanges: new Map(),
      }
      return selector(state)
    })
  })

  it('should render element name in input', () => {
    render(<PropertyEditor element={mockContainer} />)
    const input = screen.getByDisplayValue('Test Container')
    expect(input).toBeInTheDocument()
  })

  it('should render element description', () => {
    render(<PropertyEditor element={mockContainer} />)
    const textarea = screen.getByDisplayValue('A test container')
    expect(textarea).toBeInTheDocument()
  })

  it('should render tags', () => {
    render(<PropertyEditor element={mockContainer} />)
    const input = screen.getByDisplayValue('frontend, ui')
    expect(input).toBeInTheDocument()
  })

  it('should render element type', () => {
    render(<PropertyEditor element={mockContainer} />)
    expect(screen.getByText('container')).toBeInTheDocument()
  })

  it('should show technology field for containers', () => {
    render(<PropertyEditor element={mockContainer} />)
    expect(screen.getByText('Technology')).toBeInTheDocument()
    expect(screen.getByDisplayValue('React, TypeScript')).toBeInTheDocument()
  })

  it('should not show technology field for systems', () => {
    render(<PropertyEditor element={mockSystem} />)
    expect(screen.queryByText('Technology')).not.toBeInTheDocument()
  })

  it('should call handleUpdate on name change blur', async () => {
    render(<PropertyEditor element={mockContainer} />)

    const input = screen.getByDisplayValue('Test Container')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'New Name' } })
    })
    await act(async () => {
      fireEvent.blur(input)
    })

    expect(mockUpdateElement).toHaveBeenCalled()
  })

  it('should have save button', () => {
    render(<PropertyEditor element={mockContainer} />)
    const saveButton = screen.getByRole('button', { name: /save/i })
    expect(saveButton).toBeInTheDocument()
  })

  it('should call discardChanges and selectElement when cancel clicked', async () => {
    render(<PropertyEditor element={mockContainer} />)

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await act(async () => {
      fireEvent.click(cancelButton)
    })

    expect(mockDiscardChanges).toHaveBeenCalled()
    expect(mockSelectElement).toHaveBeenCalledWith(null)
  })

  it('should call selectElement when close button clicked', async () => {
    render(<PropertyEditor element={mockContainer} />)

    const closeButton = screen.getByRole('button', { name: /close/i })
    await act(async () => {
      fireEvent.click(closeButton)
    })

    expect(mockDiscardChanges).toHaveBeenCalled()
    expect(mockSelectElement).toHaveBeenCalledWith(null)
  })

  it('should apply pending changes to current values', () => {
    vi.mocked(useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        updateElement: mockUpdateElement,
        saveChanges: mockSaveChanges,
        discardChanges: mockDiscardChanges,
        selectElement: mockSelectElement,
        pendingChanges: new Map([['container1', { name: 'Pending Name' }]]),
      }
      return selector(state)
    })

    render(<PropertyEditor element={mockContainer} />)
    expect(screen.getByDisplayValue('Pending Name')).toBeInTheDocument()
  })

  it('should handle element without description', () => {
    const elementWithoutDesc: Container = { ...mockContainer, description: undefined }
    render(<PropertyEditor element={elementWithoutDesc} />)
    // Find the description textarea - it should have empty value
    const textareas = screen.getAllByRole('textbox')
    const descTextarea = textareas.find(t => t.getAttribute('rows') === '3')
    expect(descTextarea).toHaveValue('')
  })

  it('should handle element without tags', () => {
    const elementWithoutTags: Container = { ...mockContainer, tags: undefined }
    render(<PropertyEditor element={elementWithoutTags} />)
    // Tags field should be empty
    expect(screen.queryByDisplayValue('frontend, ui')).not.toBeInTheDocument()
  })

  it('should handle tags change on blur', async () => {
    render(<PropertyEditor element={mockContainer} />)

    const input = screen.getByDisplayValue('frontend, ui')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'new, tags' } })
    })
    await act(async () => {
      fireEvent.blur(input)
    })

    expect(mockUpdateElement).toHaveBeenCalled()
  })

  it('should disable save button when no changes', () => {
    render(<PropertyEditor element={mockContainer} />)
    const saveButton = screen.getByRole('button', { name: /save/i })
    expect(saveButton).toBeDisabled()
  })

  it('should handle technology update for container', async () => {
    render(<PropertyEditor element={mockContainer} />)

    const techInput = screen.getByDisplayValue('React, TypeScript')
    await act(async () => {
      fireEvent.change(techInput, { target: { value: 'Vue, JavaScript' } })
    })
    await act(async () => {
      fireEvent.blur(techInput)
    })

    expect(mockUpdateElement).toHaveBeenCalled()
  })

  it('should render Edit Element heading', () => {
    render(<PropertyEditor element={mockContainer} />)
    expect(screen.getByText('Edit Element')).toBeInTheDocument()
  })

  it('should show Name label', () => {
    render(<PropertyEditor element={mockContainer} />)
    expect(screen.getByText('Name')).toBeInTheDocument()
  })
})
