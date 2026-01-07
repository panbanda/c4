import { Breadcrumb } from './Breadcrumb'
import { Search } from './Search'
import { useStore } from '../store/useStore'

export function Header() {
  const editMode = useStore((state) => state.editMode)
  const toggleEditMode = useStore((state) => state.toggleEditMode)
  const hasPendingChanges = useStore((state) => state.hasPendingChanges)

  return (
    <header
      className={`h-14 bg-[#242424] border-b flex items-center px-4 justify-between ${
        editMode ? 'border-amber-600' : 'border-[#333333]'
      }`}
      role="banner"
    >
      <div className="flex items-center gap-6">
        <h1 className="text-xl font-semibold text-slate-100">C4 Visualization</h1>
        <Breadcrumb />
        {editMode && (
          <span
            className="text-xs text-amber-400 font-medium uppercase flex items-center gap-1"
            aria-live="polite"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            Edit Mode
            {hasPendingChanges() && <span className="text-amber-300" aria-label="unsaved changes">*</span>}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={toggleEditMode}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            editMode
              ? 'bg-amber-600 text-white hover:bg-amber-700'
              : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
          }`}
          title="Toggle edit mode (E)"
          aria-label={editMode ? 'Exit edit mode' : 'Enter edit mode'}
          aria-pressed={editMode}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </button>
        <Search />
      </div>
    </header>
  )
}
