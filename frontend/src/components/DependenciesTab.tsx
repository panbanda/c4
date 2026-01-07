import { memo, useState } from 'react'
import { useStore } from '../store/useStore'
import type { Element, Relationship } from '../types/c4'

interface DependenciesTabProps {
  element: Element
}

export const DependenciesTab = memo(({ element }: DependenciesTabProps) => {
  const model = useStore((state) => state.model)
  const selectElement = useStore((state) => state.selectElement)
  const [filter, setFilter] = useState('')

  if (!model) return null

  // Build all possible IDs for this element
  const elementIds = new Set([element.id])
  if (element.type === 'container' && 'systemId' in element) {
    elementIds.add(`${element.systemId}.${element.id}`)
  }
  if (element.type === 'component' && 'systemId' in element && 'containerId' in element) {
    elementIds.add(`${element.systemId}.${element.containerId}.${element.id}`)
  }

  const incoming = model.relationships.filter((r) => elementIds.has(r.to))
  const outgoing = model.relationships.filter((r) => elementIds.has(r.from))

  const filterRels = (rels: Relationship[]) => {
    if (!filter) return rels
    const lowerFilter = filter.toLowerCase()
    return rels.filter(
      (r) =>
        r.from.toLowerCase().includes(lowerFilter) ||
        r.to.toLowerCase().includes(lowerFilter) ||
        r.description?.toLowerCase().includes(lowerFilter)
    )
  }

  const resolveElementName = (id: string): string => {
    const simpleId = id.split('.').pop() || id
    const all = [...model.persons, ...model.systems, ...model.containers, ...model.components]
    return all.find((el) => el.id === simpleId)?.name || simpleId
  }

  const handleNavigate = (id: string) => {
    const simpleId = id.split('.').pop() || id
    selectElement(simpleId)
  }

  const filteredIncoming = filterRels(incoming)
  const filteredOutgoing = filterRels(outgoing)

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter dependencies..."
        className="w-full px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-500"
      />

      {filteredIncoming.length > 0 && (
        <div>
          <h4 className="text-xs text-slate-400 uppercase mb-2">
            Incoming ({filteredIncoming.length})
          </h4>
          <div className="space-y-1">
            {filteredIncoming.map((rel, i) => (
              <button
                key={i}
                onClick={() => handleNavigate(rel.from)}
                className="w-full flex items-center justify-between p-2 bg-slate-700/50 hover:bg-slate-700 rounded text-left transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-slate-200 truncate block">
                    {resolveElementName(rel.from)}
                  </span>
                  {rel.description && (
                    <span className="text-xs text-slate-500 truncate block">
                      {rel.description}
                    </span>
                  )}
                </div>
                <span className="text-slate-500 ml-2">&#8594;</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {filteredOutgoing.length > 0 && (
        <div>
          <h4 className="text-xs text-slate-400 uppercase mb-2">
            Outgoing ({filteredOutgoing.length})
          </h4>
          <div className="space-y-1">
            {filteredOutgoing.map((rel, i) => (
              <button
                key={i}
                onClick={() => handleNavigate(rel.to)}
                className="w-full flex items-center justify-between p-2 bg-slate-700/50 hover:bg-slate-700 rounded text-left transition-colors"
              >
                <span className="text-slate-500 mr-2">&#8594;</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-slate-200 truncate block">
                    {resolveElementName(rel.to)}
                  </span>
                  {rel.description && (
                    <span className="text-xs text-slate-500 truncate block">
                      {rel.description}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {filteredIncoming.length === 0 && filteredOutgoing.length === 0 && (
        <div className="text-sm text-slate-500 text-center py-4">
          No dependencies found
        </div>
      )}
    </div>
  )
})

DependenciesTab.displayName = 'DependenciesTab'
