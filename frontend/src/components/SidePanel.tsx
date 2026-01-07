import { useState } from 'react'
import { useStore } from '../store/useStore'
import { PropertyEditor } from './PropertyEditor'
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
  const editMode = useStore((state) => state.editMode)
  const [activeTab, setActiveTab] = useState('overview')

  if (!model) {
    return (
      <aside className="w-80 bg-[#242424] border-l border-[#333333] p-4" role="complementary" aria-label="Side panel">
        <div className="text-slate-400">No model loaded</div>
      </aside>
    )
  }

  const element = selectedElement
    ? [...model.persons, ...model.systems, ...model.containers, ...model.components].find(
        (el) => el.id === selectedElement
      )
    : null

  if (editMode && element) {
    return (
      <aside className="w-80 bg-[#242424] border-l border-amber-600 p-4 overflow-y-auto" role="complementary" aria-label="Property editor">
        <PropertyEditor element={element} />
      </aside>
    )
  }

  // No element selected - show Start Here
  if (!element) {
    return (
      <aside className="w-80 bg-[#242424] border-l border-[#333333] p-4 overflow-y-auto" role="complementary" aria-label="Model summary">
        <StartHere />
      </aside>
    )
  }

  // Element selected - show tabbed view
  return (
    <aside className="w-80 bg-[#242424] border-l border-[#333333] p-4 overflow-y-auto" role="complementary" aria-label="Element details">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">{element.name}</h2>
          <span className="text-xs text-slate-400 uppercase">{element.type}</span>
        </div>
        <button
          onClick={() => selectElement(null)}
          className="text-slate-400 hover:text-slate-200 transition-colors"
          aria-label="Close element details"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <SidePanelTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'overview' && (
        <div className="space-y-4">
          {element.description && (
            <div>
              <p className="text-sm text-slate-300">{element.description}</p>
            </div>
          )}

          {(element.type === 'container' || element.type === 'component') && 'technology' in element && element.technology && (
            <div>
              <h3 className="text-sm font-semibold text-slate-100 mb-2">Technology</h3>
              <div className="flex flex-wrap gap-1">
                {(Array.isArray(element.technology) ? element.technology : [element.technology]).map((tech, i) => (
                  <span key={i} className="px-2 py-1 bg-slate-700 text-slate-200 text-xs rounded">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {element.tags && element.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-100 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {element.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-slate-700 text-slate-200 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {element.properties && Object.keys(element.properties).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-100 mb-2">Properties</h3>
              <div className="space-y-2">
                {Object.entries(element.properties).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-slate-400">{key}</span>
                    <span className="text-slate-300">{String(value)}</span>
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
