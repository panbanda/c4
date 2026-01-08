export function Search() {
  const openCommandPalette = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true }))
  }

  return (
    <button
      onClick={openCommandPalette}
      className="relative flex items-center group w-48 pl-8 pr-3 py-1 bg-slate-800/50 border border-slate-700/50 rounded-md text-sm text-slate-500 hover:text-slate-400 hover:bg-slate-800 hover:border-slate-600 transition-colors text-left"
      aria-label="Open search (press /)"
    >
      <svg
        className="absolute left-2.5 w-4 h-4 text-slate-500 group-hover:text-slate-400 transition-colors"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <span className="flex-1">Search...</span>
      <kbd className="px-1.5 py-0.5 bg-slate-700/50 border border-slate-600/50 rounded text-[10px] text-slate-500 font-mono">/</kbd>
    </button>
  )
}
