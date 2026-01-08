import { useState } from 'react'
import { useStore } from '../store/useStore'
import { SidePanelTabs } from './SidePanelTabs'
import { DependenciesTab } from './DependenciesTab'
import { FlowsTab } from './FlowsTab'
import { StartHere } from './StartHere'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'dependencies', label: 'Dependencies' },
  { id: 'flows', label: 'Flows' },
]

export function SidePanel() {
  const model = useStore((state) => state.model)
  const selectedElement = useStore((state) => state.selectedElement)
  const selectElement = useStore((state) => state.selectElement)
  const [activeTab, setActiveTab] = useState('overview')

  if (!model) {
    return (
      <aside className="w-80 bg-[#1e1e1e] border-l border-[#2d2d2d] p-4" role="complementary" aria-label="Side panel">
        <div className="text-slate-500 text-sm">No model loaded</div>
      </aside>
    )
  }

  const element = selectedElement
    ? [...model.persons, ...model.systems, ...model.containers, ...model.components].find(
        (el) => el.id === selectedElement
      )
    : null

  // No element selected - show Start Here
  if (!element) {
    return (
      <aside className="w-80 bg-[#1e1e1e] border-l border-[#2d2d2d] p-4 overflow-y-auto" role="complementary" aria-label="Model summary">
        <StartHere />
      </aside>
    )
  }

  // Element selected - show tabbed view
  return (
    <aside className="w-80 bg-[#1e1e1e] border-l border-[#2d2d2d] p-4 overflow-y-auto" role="complementary" aria-label="Element details">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-slate-100 truncate">{element.name}</h2>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{element.type}</span>
        </div>
        <button
          onClick={() => selectElement(null)}
          className="p-1 -mr-1 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded transition-colors"
          aria-label="Close element details"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <SidePanelTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'overview' && (
        <div className="space-y-4">
          {element.description && (
            <p className="text-sm text-slate-400 leading-relaxed">{element.description}</p>
          )}

          {(element.type === 'container' || element.type === 'component') && 'technology' in element && element.technology && (
            <div>
              <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Technology</h3>
              <div className="flex flex-wrap gap-1.5">
                {(Array.isArray(element.technology) ? element.technology : [element.technology]).map((tech, i) => (
                  <span key={i} className="px-2 py-0.5 bg-slate-800 text-slate-300 text-xs rounded border border-slate-700">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {element.tags && element.tags.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {element.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded border border-blue-500/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {element.properties && Object.keys(element.properties).length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Properties</h3>
              <div className="space-y-1.5 bg-slate-800/50 rounded-lg p-2.5">
                {Object.entries(element.properties).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-xs">
                    <span className="text-slate-500">{key}</span>
                    <span className="text-slate-300 font-mono">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'dependencies' && <DependenciesTab element={element} />}
      {activeTab === 'flows' && <FlowsTab element={element} />}
    </aside>
  )
}
