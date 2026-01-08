import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { ViewModeSwitcher } from '../ViewModeSwitcher'
import { useStore } from '../../store/useStore'
import type { C4Model } from '../../types/c4'

vi.mock('../../store/useStore', () => ({
  useStore: vi.fn(),
}))

const mockModel: C4Model = {
  persons: [],
  systems: [
    { id: 'sys1', name: 'System A', type: 'system' },
  ],
  containers: [
    { id: 'cont1', name: 'API', type: 'container', systemId: 'sys1' },
    { id: 'cont2', name: 'Web', type: 'container', systemId: 'sys1' },
  ],
  components: [],
  relationships: [],
  flows: [],
  deployments: [
    {
      id: 'prod',
      name: 'Production',
      nodes: [
        {
          id: 'node1',
          name: 'Server',
          instances: [{ container: 'sys1.cont1' }],
        },
      ],
    },
    {
      id: 'staging',
      name: 'Staging',
      nodes: [
        {
          id: 'node2',
          name: 'Dev Server',
          instances: [{ container: 'sys1.cont1' }],
        },
      ],
    },
  ],
  options: { showMinimap: false },
}

describe('ViewModeSwitcher', () => {
  const mockSetView = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return null in landscape view', () => {
    vi.mocked(useStore).mockReturnValue({
      currentView: 'landscape',
      focusElement: null,
      setView: mockSetView,
      model: mockModel,
      selectedElement: null,
    })

    const { container } = render(<ViewModeSwitcher />)
    expect(container.firstChild).toBeNull()
  })

  it('should return null when model is null', () => {
    vi.mocked(useStore).mockReturnValue({
      currentView: 'container',
      focusElement: 'sys1',
      setView: mockSetView,
      model: null,
      selectedElement: null,
    })

    const { container } = render(<ViewModeSwitcher />)
    expect(container.firstChild).toBeNull()
  })

  it('should show Architecture label in container view', () => {
    vi.mocked(useStore).mockReturnValue({
      currentView: 'container',
      focusElement: 'sys1',
      setView: mockSetView,
      model: mockModel,
      selectedElement: null,
    })

    render(<ViewModeSwitcher />)
    expect(screen.getByText('Architecture')).toBeInTheDocument()
  })

  it('should show deployment name in deployment view', () => {
    vi.mocked(useStore).mockReturnValue({
      currentView: 'deployment',
      focusElement: 'prod',
      setView: mockSetView,
      model: mockModel,
      selectedElement: null,
    })

    render(<ViewModeSwitcher />)
    expect(screen.getByText('Production')).toBeInTheDocument()
  })

  it('should open dropdown when clicked', async () => {
    const user = userEvent.setup()
    vi.mocked(useStore).mockReturnValue({
      currentView: 'container',
      focusElement: 'sys1',
      setView: mockSetView,
      model: mockModel,
      selectedElement: null,
    })

    render(<ViewModeSwitcher />)

    const button = screen.getByRole('button', { expanded: false })
    await user.click(button)

    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('should show deployments in dropdown', async () => {
    const user = userEvent.setup()
    vi.mocked(useStore).mockReturnValue({
      currentView: 'container',
      focusElement: 'sys1',
      setView: mockSetView,
      model: mockModel,
      selectedElement: null,
    })

    render(<ViewModeSwitcher />)

    const button = screen.getByText('Architecture').closest('button')!
    await user.click(button)

    expect(screen.getByText('Deployments')).toBeInTheDocument()
    expect(screen.getByText('Production')).toBeInTheDocument()
    expect(screen.getByText('Staging')).toBeInTheDocument()
  })

  it('should switch to architecture view when Architecture clicked', async () => {
    const user = userEvent.setup()
    vi.mocked(useStore).mockReturnValue({
      currentView: 'deployment',
      focusElement: 'prod',
      setView: mockSetView,
      model: mockModel,
      selectedElement: null,
    })

    render(<ViewModeSwitcher />)

    const button = screen.getByText('Production').closest('button')!
    await user.click(button)

    const archOption = screen.getAllByText('Architecture')[0]
    await user.click(archOption.closest('button')!)

    expect(mockSetView).toHaveBeenCalledWith('landscape')
  })

  it('should switch to deployment view when deployment clicked', async () => {
    const user = userEvent.setup()
    vi.mocked(useStore).mockReturnValue({
      currentView: 'container',
      focusElement: 'sys1',
      setView: mockSetView,
      model: mockModel,
      selectedElement: null,
    })

    render(<ViewModeSwitcher />)

    const button = screen.getByText('Architecture').closest('button')!
    await user.click(button)

    const prodOption = screen.getByRole('option', { name: /production/i })
    await user.click(prodOption)

    expect(mockSetView).toHaveBeenCalledWith('deployment', 'prod')
  })

  it('should close dropdown when clicking outside', async () => {
    vi.mocked(useStore).mockReturnValue({
      currentView: 'container',
      focusElement: 'sys1',
      setView: mockSetView,
      model: mockModel,
      selectedElement: null,
    })

    render(<ViewModeSwitcher />)

    const button = screen.getByText('Architecture').closest('button')!
    fireEvent.click(button)

    expect(screen.getByRole('listbox')).toBeInTheDocument()

    fireEvent.mouseDown(document.body)

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('should show no deployments message when none available', async () => {
    const user = userEvent.setup()
    const modelNoDeployments = { ...mockModel, deployments: [] }

    vi.mocked(useStore).mockReturnValue({
      currentView: 'container',
      focusElement: 'sys1',
      setView: mockSetView,
      model: modelNoDeployments,
      selectedElement: null,
    })

    render(<ViewModeSwitcher />)

    const button = screen.getByText('Architecture').closest('button')!
    await user.click(button)

    expect(screen.getByText('No deployments available')).toBeInTheDocument()
  })

  it('should highlight selected architecture option', async () => {
    const user = userEvent.setup()
    vi.mocked(useStore).mockReturnValue({
      currentView: 'container',
      focusElement: 'sys1',
      setView: mockSetView,
      model: mockModel,
      selectedElement: null,
    })

    render(<ViewModeSwitcher />)

    const button = screen.getByText('Architecture').closest('button')!
    await user.click(button)

    const archOption = screen.getByRole('option', { name: /architecture/i })
    expect(archOption).toHaveAttribute('aria-selected', 'true')
  })

  it('should highlight selected deployment option', async () => {
    const user = userEvent.setup()
    vi.mocked(useStore).mockReturnValue({
      currentView: 'deployment',
      focusElement: 'prod',
      setView: mockSetView,
      model: mockModel,
      selectedElement: null,
    })

    render(<ViewModeSwitcher />)

    const button = screen.getByText('Production').closest('button')!
    await user.click(button)

    const prodOption = screen.getByRole('option', { name: /production/i })
    expect(prodOption).toHaveAttribute('aria-selected', 'true')
  })

  it('should apply custom className', () => {
    vi.mocked(useStore).mockReturnValue({
      currentView: 'container',
      focusElement: 'sys1',
      setView: mockSetView,
      model: mockModel,
      selectedElement: null,
    })

    const { container } = render(<ViewModeSwitcher className="custom-class" />)
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('should derive system ID from container focus', () => {
    vi.mocked(useStore).mockReturnValue({
      currentView: 'component',
      focusElement: 'cont1',
      setView: mockSetView,
      model: mockModel,
      selectedElement: null,
    })

    render(<ViewModeSwitcher />)
    expect(screen.getByText('Architecture')).toBeInTheDocument()
  })

  it('should derive system ID from selected container', async () => {
    const user = userEvent.setup()
    vi.mocked(useStore).mockReturnValue({
      currentView: 'deployment',
      focusElement: 'prod',
      setView: mockSetView,
      model: mockModel,
      selectedElement: 'cont1',
    })

    render(<ViewModeSwitcher />)

    const button = screen.getByText('Production').closest('button')!
    await user.click(button)

    const archOption = screen.getAllByText('Architecture')[0].closest('button')!
    await user.click(archOption)

    expect(mockSetView).toHaveBeenCalledWith('container', 'sys1')
  })

  it('should derive system ID from selected system', async () => {
    const user = userEvent.setup()
    vi.mocked(useStore).mockReturnValue({
      currentView: 'deployment',
      focusElement: 'prod',
      setView: mockSetView,
      model: mockModel,
      selectedElement: 'sys1',
    })

    render(<ViewModeSwitcher />)

    const button = screen.getByText('Production').closest('button')!
    await user.click(button)

    const archOption = screen.getAllByText('Architecture')[0].closest('button')!
    await user.click(archOption)

    expect(mockSetView).toHaveBeenCalledWith('container', 'sys1')
  })

  it('should filter deployments by system containers', async () => {
    const user = userEvent.setup()
    const modelWithFiltered: C4Model = {
      ...mockModel,
      deployments: [
        {
          id: 'prod',
          name: 'Production',
          nodes: [
            { id: 'n1', name: 'Server', instances: [{ container: 'sys1.cont1' }] },
          ],
        },
        {
          id: 'other',
          name: 'Other',
          nodes: [
            { id: 'n2', name: 'Server', instances: [{ container: 'sys2.cont3' }] },
          ],
        },
      ],
    }

    vi.mocked(useStore).mockReturnValue({
      currentView: 'container',
      focusElement: 'sys1',
      setView: mockSetView,
      model: modelWithFiltered,
      selectedElement: null,
    })

    render(<ViewModeSwitcher />)

    const button = screen.getByText('Architecture').closest('button')!
    await user.click(button)

    expect(screen.getByText('Production')).toBeInTheDocument()
  })

  it('should handle deployment with nested children', async () => {
    const user = userEvent.setup()
    const modelWithNested: C4Model = {
      ...mockModel,
      deployments: [
        {
          id: 'prod',
          name: 'Production',
          nodes: [
            {
              id: 'region',
              name: 'US East',
              children: [
                {
                  id: 'zone',
                  name: 'Zone A',
                  instances: [{ container: 'sys1.cont1' }],
                },
              ],
            },
          ],
        },
      ],
    }

    vi.mocked(useStore).mockReturnValue({
      currentView: 'container',
      focusElement: 'sys1',
      setView: mockSetView,
      model: modelWithNested,
      selectedElement: null,
    })

    render(<ViewModeSwitcher />)

    const button = screen.getByText('Architecture').closest('button')!
    await user.click(button)

    expect(screen.getByText('Production')).toBeInTheDocument()
  })

  it('should show Deployment fallback label when no specific deployment found', () => {
    vi.mocked(useStore).mockReturnValue({
      currentView: 'deployment',
      focusElement: 'nonexistent',
      setView: mockSetView,
      model: mockModel,
      selectedElement: null,
    })

    render(<ViewModeSwitcher />)
    expect(screen.getByText('Deployment')).toBeInTheDocument()
  })
})
