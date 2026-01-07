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
    <div className="flex border-b border-slate-600 mb-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'text-blue-400 border-b-2 border-blue-500 -mb-px'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
})

SidePanelTabs.displayName = 'SidePanelTabs'
