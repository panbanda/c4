import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { useDebounce } from '../hooks/useDebounce'

export function Search() {
  const filterQuery = useStore((state) => state.filterQuery)
  const setFilterQuery = useStore((state) => state.setFilterQuery)
  const [inputValue, setInputValue] = useState(filterQuery)
  const debouncedValue = useDebounce(inputValue, 300)

  useEffect(() => {
    setFilterQuery(debouncedValue)
  }, [debouncedValue, setFilterQuery])

  useEffect(() => {
    setInputValue(filterQuery)
  }, [filterQuery])

  return (
    <div className="relative flex items-center group">
      <svg
        className="absolute left-2.5 w-4 h-4 text-slate-500 group-focus-within:text-slate-400 transition-colors"
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
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Search..."
        className="w-48 pl-8 pr-16 py-1 bg-slate-800/50 border border-slate-700/50 rounded-md text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:bg-slate-800 focus:border-slate-600 transition-colors"
      />
      <div className="absolute right-2 flex items-center gap-1">
        {inputValue ? (
          <button
            onClick={() => {
              setInputValue('')
              setFilterQuery('')
            }}
            className="text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="clear search"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : (
          <kbd className="px-1.5 py-0.5 bg-slate-700/50 border border-slate-600/50 rounded text-[10px] text-slate-500 font-mono">/</kbd>
        )}
      </div>
    </div>
  )
}
