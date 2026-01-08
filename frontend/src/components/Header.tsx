import { Breadcrumb } from './Breadcrumb'
import { Search } from './Search'
import { useStore } from '../store/useStore'

export function Header() {
  const editMode = useStore((state) => state.editMode)
  const toggleEditMode = useStore((state) => state.toggleEditMode)
  const hasPendingChanges = useStore((state) => state.hasPendingChanges)

  return (
    <header
      className={`h-12 bg-[#1e1e1e] border-b flex items-center px-4 justify-between transition-colors ${
        editMode ? 'border-amber-500/50' : 'border-[#2d2d2d]'
      }`}
      role="banner"
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h1 className="text-sm font-medium text-slate-200 tracking-tight">C4 Model</h1>
        </div>
        <div className="h-4 w-px bg-slate-700" />
        <Breadcrumb />
        {editMode && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-amber-400">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            <span className="text-xs font-medium" aria-live="polite">
              Editing{hasPendingChanges() && <span className="text-amber-300 ml-0.5">*</span>}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Search />
        <div className="h-4 w-px bg-slate-700" />
        <button
          onClick={toggleEditMode}
          className={`p-1.5 rounded transition-colors ${
            editMode
              ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
          }`}
          title="Toggle edit mode (E)"
          aria-label={editMode ? 'Exit edit mode' : 'Enter edit mode'}
          aria-pressed={editMode}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }))}
          className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
          title="Keyboard shortcuts (?)"
          aria-label="Show keyboard shortcuts"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    </header>
  )
}
