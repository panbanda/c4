import { useEffect, useState, useCallback } from 'react'

interface Shortcut {
  keys: string[]
  description: string
}

interface ShortcutGroup {
  title: string
  shortcuts: Shortcut[]
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['Esc'], description: 'Go up one level / Deselect' },
      { keys: ['Enter'], description: 'Drill into selected element' },
      { keys: ['Backspace'], description: 'Go back one level' },
      { keys: ['\u2190', '\u2192'], description: 'Navigate between sibling elements' },
    ],
  },
  {
    title: 'View',
    shortcuts: [
      { keys: ['1'], description: 'Context view (systems)' },
      { keys: ['2'], description: 'Container view' },
      { keys: ['3'], description: 'Component view' },
      { keys: ['D'], description: 'Deployment view' },
      { keys: ['L'], description: 'Landscape view' },
    ],
  },
  {
    title: 'Search & Edit',
    shortcuts: [
      { keys: ['\u2318', 'K'], description: 'Open command palette' },
      { keys: ['/'], description: 'Focus search' },
      { keys: ['E'], description: 'Toggle edit mode' },
      { keys: ['\u2318', 'S'], description: 'Save changes' },
    ],
  },
  {
    title: 'Flow Playback',
    shortcuts: [
      { keys: ['Space'], description: 'Play / Pause flow' },
      { keys: ['['], description: 'Previous step' },
      { keys: [']'], description: 'Next step' },
    ],
  },
]

export function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      e.preventDefault()
      setIsOpen((prev) => !prev)
    }
    if (e.key === 'Escape' && isOpen) {
      setIsOpen(false)
    }
  }, [isOpen])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />
      <div className="relative bg-slate-800 border border-slate-600 rounded-xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Keyboard Shortcuts</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-slate-300 text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <span key={i}>
                          {i > 0 && <span className="text-slate-500 mx-0.5">+</span>}
                          <kbd className="px-2 py-0.5 bg-slate-700 border border-slate-600 rounded text-xs text-slate-200 font-mono">
                            {key}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-700 text-center">
          <p className="text-slate-500 text-sm">
            Press <kbd className="px-1.5 py-0.5 bg-slate-700 border border-slate-600 rounded text-xs">?</kbd> to toggle this panel
          </p>
        </div>
      </div>
    </div>
  )
}
