import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useStore } from '../store/useStore'
import type { Element, ViewType } from '../types/c4'

interface Command {
  id: string
  type: 'element' | 'action' | 'view'
  icon: string
  name: string
  description?: string
  category: string
  action: () => void
}

const VIEW_ICONS: Record<ViewType, string> = {
  landscape: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
  context: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  container: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
  component: 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z',
  deployment: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01',
}

const ELEMENT_ICONS: Record<string, string> = {
  person: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  system: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z',
  container: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
  component: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const { model, selectElement, setView, focusElement } = useStore()

  const handleOpen = useCallback(() => {
    setIsOpen(true)
    setQuery('')
    setSelectedIndex(0)
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setQuery('')
  }, [])

  const commands = useMemo((): Command[] => {
    const cmds: Command[] = []

    // View commands
    cmds.push({
      id: 'view-landscape',
      type: 'view',
      icon: VIEW_ICONS.landscape,
      name: 'Landscape View',
      description: 'Show all systems and persons',
      category: 'Views',
      action: () => { setView('landscape'); handleClose() },
    })
    cmds.push({
      id: 'view-deployment',
      type: 'view',
      icon: VIEW_ICONS.deployment,
      name: 'Deployment View',
      description: 'Show infrastructure deployment',
      category: 'Views',
      action: () => { setView('deployment'); handleClose() },
    })

    if (!model) return cmds

    // Element commands
    const addElement = (el: Element) => {
      cmds.push({
        id: `el-${el.id}`,
        type: 'element',
        icon: ELEMENT_ICONS[el.type] || ELEMENT_ICONS.system,
        name: el.name,
        description: el.description,
        category: el.type.charAt(0).toUpperCase() + el.type.slice(1) + 's',
        action: () => {
          selectElement(el.id)
          handleClose()
        },
      })
    }

    model.persons.forEach(addElement)
    model.systems.forEach(addElement)
    model.containers.forEach(addElement)
    model.components.forEach(addElement)

    // System drill-down commands
    model.systems.forEach((sys) => {
      const hasContainers = model.containers.some((c) => c.systemId === sys.id)
      if (hasContainers) {
        cmds.push({
          id: `drill-${sys.id}`,
          type: 'action',
          icon: 'M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z',
          name: `Drill into ${sys.name}`,
          description: 'View containers in this system',
          category: 'Actions',
          action: () => {
            setView('container', sys.id)
            handleClose()
          },
        })
      }
    })

    return cmds
  }, [model, selectElement, setView, handleClose])

  const filteredCommands = useMemo(() => {
    if (!query) return commands
    const lower = query.toLowerCase()
    return commands.filter((cmd) =>
      cmd.name.toLowerCase().includes(lower) ||
      cmd.description?.toLowerCase().includes(lower) ||
      cmd.category.toLowerCase().includes(lower)
    )
  }, [commands, query])

  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {}
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) groups[cmd.category] = []
      groups[cmd.category].push(cmd)
    })
    return groups
  }, [filteredCommands])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) handleClose()
        else handleOpen()
      }
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
        e.preventDefault()
        handleOpen()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleOpen, handleClose])

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleKeyDownInPalette = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const cmd = filteredCommands[selectedIndex]
      if (cmd) cmd.action()
    }
  }, [handleClose, filteredCommands, selectedIndex])

  if (!isOpen) return null

  let flatIndex = 0

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative bg-slate-800 border border-slate-600 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center px-4 border-b border-slate-700">
          <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDownInPalette}
            placeholder="Search elements and actions..."
            className="flex-1 px-3 py-4 bg-transparent text-white placeholder-slate-500 focus:outline-none"
          />
          <kbd className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-slate-400">
            esc
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto py-2">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-500">
              No results found
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category}>
                <div className="px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {category}
                </div>
                {cmds.map((cmd) => {
                  const thisIndex = flatIndex++
                  const isSelected = thisIndex === selectedIndex
                  return (
                    <button
                      key={cmd.id}
                      onClick={cmd.action}
                      onMouseEnter={() => setSelectedIndex(thisIndex)}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                        isSelected ? 'bg-blue-600' : 'hover:bg-slate-700'
                      }`}
                    >
                      <svg className={`w-5 h-5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cmd.icon} />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                          {cmd.name}
                        </div>
                        {cmd.description && (
                          <div className={`text-xs truncate ${isSelected ? 'text-blue-200' : 'text-slate-500'}`}>
                            {cmd.description}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-700 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span><kbd className="px-1 bg-slate-700 rounded">\u2191</kbd><kbd className="px-1 bg-slate-700 rounded">\u2193</kbd> to navigate</span>
            <span><kbd className="px-1 bg-slate-700 rounded">\u23CE</kbd> to select</span>
          </div>
          <div>
            <kbd className="px-1 bg-slate-700 rounded">\u2318K</kbd> to toggle
          </div>
        </div>
      </div>
    </div>
  )
}
