import { useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import type { ViewType } from '../types/c4'

const VIEW_PARAM = 'view'
const FOCUS_PARAM = 'focus'
const SELECTED_PARAM = 'selected'

interface HistoryState {
  view: ViewType
  focus: string | null
}

/**
 * Parse view type from URL, defaulting to 'landscape' if invalid
 */
function parseViewType(value: string | null): ViewType {
  const validViews: ViewType[] = ['landscape', 'context', 'container', 'component', 'deployment']
  if (value && validViews.includes(value as ViewType)) {
    return value as ViewType
  }
  return 'landscape'
}

/**
 * Hook to sync view state with URL parameters for deep linking
 * Uses pushState for view navigation to enable browser back/forward
 */
export function useUrlSync() {
  const { currentView, focusElement, selectedElement, setView, selectElement, model } = useStore()
  const isInitialized = useRef(false)
  const isUpdatingFromUrl = useRef(false)
  const lastHistoryState = useRef<HistoryState>({ view: 'landscape', focus: null })

  // Initialize from URL on mount (after model loads)
  useEffect(() => {
    if (!model || isInitialized.current) return

    const params = new URLSearchParams(window.location.search)
    const urlView = parseViewType(params.get(VIEW_PARAM))
    const urlFocus = params.get(FOCUS_PARAM)
    const urlSelected = params.get(SELECTED_PARAM)

    // Validate that focus element exists in model
    let validFocus: string | undefined = undefined
    if (urlFocus) {
      const exists =
        model.systems.some(s => s.id === urlFocus) ||
        model.containers.some(c => c.id === urlFocus) ||
        model.components.some(c => c.id === urlFocus) ||
        model.deployments.some(d => d.id === urlFocus)

      if (exists) {
        validFocus = urlFocus
      }
    }

    // Initialize history state
    lastHistoryState.current = { view: urlView, focus: validFocus || null }

    // Only set view if different from default or if URL has params
    if (urlView !== 'landscape' || validFocus) {
      isUpdatingFromUrl.current = true
      setView(urlView, validFocus)

      // Also restore selected element if valid
      if (urlSelected) {
        const selectedExists =
          model.persons.some(p => p.id === urlSelected) ||
          model.systems.some(s => s.id === urlSelected) ||
          model.containers.some(c => c.id === urlSelected) ||
          model.components.some(c => c.id === urlSelected)

        if (selectedExists) {
          selectElement(urlSelected)
        }
      }

      isUpdatingFromUrl.current = false
    }

    // Replace current history entry with state object
    window.history.replaceState(lastHistoryState.current, '', window.location.href)

    isInitialized.current = true
  }, [model, setView, selectElement])

  // Update URL when view changes
  useEffect(() => {
    // Skip if we're currently updating from URL or not initialized
    if (!isInitialized.current || isUpdatingFromUrl.current) return

    const params = new URLSearchParams()

    // Only add params if not default
    if (currentView !== 'landscape') {
      params.set(VIEW_PARAM, currentView)
    }

    if (focusElement) {
      params.set(FOCUS_PARAM, focusElement)
    }

    if (selectedElement) {
      params.set(SELECTED_PARAM, selectedElement)
    }

    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname

    // Check if view or focus changed (navigation) vs just selection
    const viewChanged = currentView !== lastHistoryState.current.view
    const focusChanged = focusElement !== lastHistoryState.current.focus

    if (viewChanged || focusChanged) {
      // Push new history entry for navigation changes
      const state: HistoryState = { view: currentView, focus: focusElement }
      window.history.pushState(state, '', newUrl)
      lastHistoryState.current = state
    } else {
      // Use replaceState for selection changes to avoid cluttering history
      window.history.replaceState(lastHistoryState.current, '', newUrl)
    }
  }, [currentView, focusElement, selectedElement])

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search)
      const urlView = parseViewType(params.get(VIEW_PARAM))
      const urlFocus = params.get(FOCUS_PARAM)
      const urlSelected = params.get(SELECTED_PARAM)

      // Update tracking ref to prevent pushState on this change
      lastHistoryState.current = { view: urlView, focus: urlFocus }

      isUpdatingFromUrl.current = true
      setView(urlView, urlFocus || undefined)
      selectElement(urlSelected)
      isUpdatingFromUrl.current = false
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [setView, selectElement])
}
