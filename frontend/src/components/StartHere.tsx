import { memo, useState } from 'react'
import { useStore } from '../store/useStore'
import type { Element } from '../types/c4'

export const StartHere = memo(() => {
  const model = useStore((state) => state.model)
  const centralityData = useStore((state) => state.centralityData)
  const selectElement = useStore((state) => state.selectElement)
  const playFlow = useStore((state) => state.playFlow)
  const [expandedType, setExpandedType] = useState<string | null>(null)

  if (!model) return null

  const topNodes = centralityData?.topNodes || []

  const typeCounts = {
    persons: model.persons.length,
    systems: model.systems.length,
    containers: model.containers.length,
    components: model.components.length,
  }

  const getElementsByType = (type: string): Element[] => {
    switch (type) {
      case 'persons': return model.persons
      case 'systems': return model.systems
      case 'containers': return model.containers
      case 'components': return model.components
      default: return []
    }
  }

  const handleTypeClick = (type: string) => {
    setExpandedType(expandedType === type ? null : type)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-100">Model Overview</h2>

      {topNodes.length > 0 && (
        <div>
          <h3 className="text-xs text-slate-400 uppercase mb-2">Start Here</h3>
          <div className="space-y-1">
            {topNodes.map((node) => (
              <button
                key={node.id}
                onClick={() => selectElement(node.id)}
                className="w-full flex items-center justify-between p-2 bg-slate-700/50 hover:bg-slate-700 rounded text-left transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-amber-400">&#9733;</span>
                  <span className="text-sm text-slate-200">{node.name}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <span>&#8592;{centralityData?.centrality[node.id]?.incoming || 0}</span>
                  <span>&#8594;{centralityData?.centrality[node.id]?.outgoing || 0}</span>
                </div>
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-1">Most connected elements</p>
        </div>
      )}

      <div>
        <h3 className="text-xs text-slate-400 uppercase mb-2">Browse by Type</h3>
        <div className="space-y-1">
          {Object.entries(typeCounts).map(([type, count]) => (
            <div key={type}>
              <button
                onClick={() => handleTypeClick(type)}
                aria-expanded={expandedType === type}
                className="w-full flex items-center justify-between p-2 bg-slate-700/50 hover:bg-slate-700 rounded text-left transition-colors"
              >
                <span className="text-sm text-slate-200 capitalize">{type}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">{count}</span>
                  <span className="text-slate-500">{expandedType === type ? '\u25BC' : '\u25B6'}</span>
                </div>
              </button>
              {expandedType === type && (
                <div className="mt-1 ml-4 space-y-1">
                  {getElementsByType(type).map((el) => (
                    <button
                      key={el.id}
                      onClick={() => selectElement(el.id)}
                      className="w-full p-2 text-left text-sm text-slate-300 hover:text-slate-100 hover:bg-slate-700/30 rounded transition-colors"
                    >
                      {el.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="flex items-center justify-between p-2 text-sm">
            <span className="text-slate-400">Relationships</span>
            <span className="text-slate-500">{model.relationships.length}</span>
          </div>
        </div>
      </div>

      {model.flows.length > 0 && (
        <div>
          <h3 className="text-xs text-slate-400 uppercase mb-2">
            Flows ({model.flows.length})
          </h3>
          <div className="space-y-1">
            {model.flows.map((flow) => (
              <button
                key={flow.id}
                onClick={() => playFlow(flow.id)}
                className="w-full flex items-center gap-2 p-2 bg-slate-700/50 hover:bg-slate-700 rounded text-left transition-colors"
              >
                <span className="text-blue-400">&#9658;</span>
                <span className="text-sm text-slate-200">{flow.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

StartHere.displayName = 'StartHere'
