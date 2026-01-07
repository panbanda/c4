import { memo, useState, useRef, useEffect, useMemo } from 'react'
import { useStore } from '../store/useStore'

interface ViewModeSwitcherProps {
  className?: string
}

export const ViewModeSwitcher = memo(({ className = '' }: ViewModeSwitcherProps) => {
  const { currentView, focusElement, setView, model, selectedElement } = useStore()
  const [isOpen, setIsOpen] = useState(false)
  const [lastSystemId, setLastSystemId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isArchitectureView = currentView === 'container' || currentView === 'component'
  const isDeploymentView = currentView === 'deployment'

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Derive system ID from various sources
  const systemId = useMemo((): string | null => {
    if (!model) return lastSystemId

    // If in architecture view, focusElement is the system/container ID
    if (isArchitectureView && focusElement) {
      // Check if it's a container (component view)
      const container = model.containers.find((c) => c.id === focusElement)
      if (container) {
        return container.systemId
      }
      // Check if it's a system (container view)
      const system = model.systems.find((s) => s.id === focusElement)
      if (system) {
        return system.id
      }
    }

    // If we have a selected container, derive system from it
    if (selectedElement) {
      const container = model.containers.find((c) => c.id === selectedElement)
      if (container) {
        return container.systemId
      }
      // Check if selected element is a system
      const system = model.systems.find((s) => s.id === selectedElement)
      if (system) {
        return system.id
      }
    }

    // Use last known system ID
    return lastSystemId
  }, [model, isArchitectureView, focusElement, selectedElement, lastSystemId])

  // Track last system ID when in architecture view
  useEffect(() => {
    if (isArchitectureView && systemId) {
      setLastSystemId(systemId)
    }
  }, [isArchitectureView, systemId])

  // Early returns AFTER all hooks
  if (!isArchitectureView && !isDeploymentView) return null
  if (!model) return null

  // Find deployments that contain containers from this system
  const getDeploymentsForSystem = () => {
    if (!systemId) return model.deployments

    const systemContainerIds = model.containers
      .filter((c) => c.systemId === systemId)
      .map((c) => `${systemId}.${c.id}`)

    const relevantDeployments = model.deployments.filter((deployment) => {
      return findContainerInDeployment(deployment.nodes, systemContainerIds)
    })

    return relevantDeployments.length > 0 ? relevantDeployments : model.deployments
  }

  const findContainerInDeployment = (
    nodes: typeof model.deployments[0]['nodes'],
    containerIds: string[]
  ): boolean => {
    if (!nodes) return false

    for (const node of nodes) {
      if (node.instances) {
        for (const instance of node.instances) {
          if (containerIds.some((id) => instance.container.includes(id) || id.includes(instance.container))) {
            return true
          }
        }
      }
      if (node.children && findContainerInDeployment(node.children, containerIds)) {
        return true
      }
    }
    return false
  }

  const availableDeployments = getDeploymentsForSystem()

  const getCurrentLabel = () => {
    if (isArchitectureView) {
      return 'Architecture'
    }
    if (isDeploymentView && focusElement) {
      const deployment = model.deployments.find((d) => d.id === focusElement)
      return deployment?.name || 'Deployment'
    }
    return 'View'
  }

  const handleArchitectureClick = () => {
    // Use the tracked system ID or derive from selected element
    const targetSystemId = systemId || lastSystemId
    if (targetSystemId) {
      setView('container', targetSystemId)
    } else {
      // Fallback to landscape if no system context
      setView('landscape')
    }
    setIsOpen(false)
  }

  const handleDeploymentClick = (deploymentId: string) => {
    // Remember current system before switching
    if (systemId) {
      setLastSystemId(systemId)
    }
    setView('deployment', deploymentId)
    setIsOpen(false)
  }

  return (
    <div
      ref={dropdownRef}
      className={`absolute top-3 right-3 z-10 ${className}`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg border border-slate-600 shadow-lg text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isArchitectureView ? 'bg-blue-500' : 'bg-amber-500'
          }`}
        />
        <span>{getCurrentLabel()}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute top-full right-0 mt-2 w-48 bg-slate-800 rounded-lg border border-slate-600 shadow-xl overflow-hidden"
          role="listbox"
        >
          <button
            role="option"
            aria-selected={isArchitectureView}
            className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors ${
              isArchitectureView
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-700'
            }`}
            onClick={handleArchitectureClick}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Architecture</span>
          </button>

          {availableDeployments.length > 0 && (
            <div className="border-t border-slate-600 my-1" />
          )}

          {availableDeployments.length > 0 && (
            <div className="px-3 py-1 text-[10px] text-slate-500 uppercase tracking-wide">
              Deployments
            </div>
          )}

          {availableDeployments.map((deployment) => {
            const isSelected = isDeploymentView && focusElement === deployment.id
            return (
              <button
                key={deployment.id}
                role="option"
                aria-selected={isSelected}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors ${
                  isSelected
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
                onClick={() => handleDeploymentClick(deployment.id)}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>{deployment.name}</span>
              </button>
            )
          })}

          {availableDeployments.length === 0 && (
            <div className="px-3 py-2 text-xs text-slate-500 italic">
              No deployments available
            </div>
          )}
        </div>
      )}

    </div>
  )
})

ViewModeSwitcher.displayName = 'ViewModeSwitcher'
