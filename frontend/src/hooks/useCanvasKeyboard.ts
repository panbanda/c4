import { useEffect } from 'react'
import type { C4Model, ViewType } from '../types/c4'

interface UseCanvasKeyboardOptions {
  model: C4Model | null
  currentView: ViewType
  focusElement: string | null
  selectedElement: string | null
  selectElement: (id: string | null) => void
  setView: (view: ViewType, focus?: string) => void
}

/**
 * Keyboard navigation for canvas:
 * - Escape: Deselect or navigate up hierarchy
 * - Enter: Drill down into selected element
 * - Backspace: Navigate up hierarchy
 */
export function useCanvasKeyboard({
  model,
  currentView,
  focusElement,
  selectedElement,
  selectElement,
  setView,
}: UseCanvasKeyboardOptions): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedElement) {
          selectElement(null)
        } else if (currentView === 'component' && focusElement) {
          const container = model?.containers.find((c) => c.id === focusElement)
          if (container) {
            setView('container', container.systemId)
          }
        } else if (currentView === 'container') {
          setView('landscape')
        }
      }

      if (e.key === 'Enter' && selectedElement) {
        const element =
          model?.systems.find((s) => s.id === selectedElement) ||
          model?.containers.find((c) => c.id === selectedElement)

        if (element) {
          if (element.type === 'system') {
            const hasContainers = model?.containers.some((c) => c.systemId === element.id)
            if (hasContainers) {
              setView('container', element.id)
            }
          } else if (element.type === 'container') {
            setView('component', element.id)
          }
        }
      }

      if (e.key === 'Backspace') {
        e.preventDefault()
        if (currentView === 'component' && focusElement) {
          const container = model?.containers.find((c) => c.id === focusElement)
          if (container) {
            setView('container', container.systemId)
          }
        } else if (currentView === 'container') {
          setView('landscape')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentView, focusElement, selectedElement, model, selectElement, setView])
}
