import { memo } from 'react'

interface Tab {
  id: string
  label: string
}

interface SidePanelTabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
}

export const SidePanelTabs = memo(({ tabs, activeTab, onTabChange }: SidePanelTabsProps) => {
  return (
    <div className="flex gap-1 p-1 bg-slate-800/50 rounded-lg mb-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            activeTab === tab.id
              ? 'bg-slate-700 text-slate-100 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
})

SidePanelTabs.displayName = 'SidePanelTabs'
