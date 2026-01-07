import { useStore } from '../store/useStore'

export function Breadcrumb() {
  const model = useStore((state) => state.model)
  const currentView = useStore((state) => state.currentView)
  const focusElement = useStore((state) => state.focusElement)
  const setView = useStore((state) => state.setView)

  const buildPath = (): Array<{ label: string; view: string; focusId: string | null }> => {
    if (!model || !focusElement) return []

    const path: Array<{ label: string; view: string; focusId: string | null }> = []

    if (currentView === 'container') {
      const system = model.systems.find((s) => s.id === focusElement)
      if (system) {
        path.push({ label: system.name, view: 'container', focusId: system.id })
      } else {
        path.push({ label: focusElement, view: 'container', focusId: focusElement })
      }
    }

    if (currentView === 'component') {
      const container = model.containers.find((c) => c.id === focusElement)
      if (container) {
        const system = model.systems.find((s) => s.id === container.systemId)
        if (system) {
          path.push({ label: system.name, view: 'container', focusId: system.id })
        }
        path.push({ label: container.name, view: 'component', focusId: container.id })
      } else {
        path.push({ label: focusElement, view: 'component', focusId: focusElement })
      }
    }

    return path
  }

  const path = buildPath()

  const handleNavigate = (view: string, focusId: string | null) => {
    if (focusId === null) {
      setView(view as any)
    } else {
      setView(view as any, focusId)
    }
  }

  return (
    <nav className="flex items-center gap-2 text-sm">
      <button
        onClick={() => handleNavigate('landscape', null)}
        className="text-slate-400 hover:text-slate-200 transition-colors p-1"
        aria-label="home"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      </button>

      {path.map((segment, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="text-slate-500">/</span>
          <button
            onClick={() => handleNavigate(segment.view, segment.focusId)}
            className="text-slate-300 hover:text-slate-100 transition-colors"
          >
            {segment.label}
          </button>
        </div>
      ))}

      {!focusElement && currentView !== 'landscape' && focusElement !== null && (
        <div className="flex items-center gap-2">
          <span className="text-slate-500">/</span>
          <span className="text-slate-300">{focusElement}</span>
        </div>
      )}
    </nav>
  )
}
