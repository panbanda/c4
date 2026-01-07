import { useEffect } from 'react'
import { useStore } from './store/useStore'
import { useWebSocket } from './hooks/useWebSocket'
import { useUrlSync } from './hooks/useUrlSync'
import { getModel } from './api/client'
import { Header } from './components/Header'
import { Canvas } from './components/Canvas'
import { SidePanel } from './components/SidePanel'
import { FlowPlayer } from './components/FlowPlayer'
import { LoadingSpinner } from './components/LoadingSpinner'

export default function App() {
  const { setModel, setLoading, setError, loading, error, toggleEditMode, saveChanges, hasPendingChanges } = useStore()

  // Sync view state with URL for deep linking
  useUrlSync()

  const loadModel = async () => {
    setLoading(true)
    try {
      const model = await getModel()
      setModel(model)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load model')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadModel()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'e' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          return
        }
        e.preventDefault()
        toggleEditMode()
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        if (hasPendingChanges()) {
          e.preventDefault()
          saveChanges()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleEditMode, saveChanges, hasPendingChanges])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasPendingChanges()) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasPendingChanges])

  useWebSocket({
    onReload: () => {
      loadModel()
    },
    onError: (msg) => {
      setError(msg)
    },
  })

  return (
    <div className="flex flex-col h-screen bg-[#1a1a1a] text-slate-200">
      <Header />
      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative">
          {loading && <LoadingSpinner message="Loading model..." />}
          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-900/90 text-red-100 px-4 py-2 rounded-lg z-10 max-w-md">
              {error}
            </div>
          )}
          <Canvas />
          <FlowPlayer />
        </div>
        <SidePanel />
      </main>
    </div>
  )
}
