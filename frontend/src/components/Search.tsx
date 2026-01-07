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
    <div className="relative flex items-center">
      <svg
        className="absolute left-3 w-4 h-4 text-slate-400"
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
        placeholder="Search elements..."
        className="w-64 pl-10 pr-10 py-1.5 bg-[#1a1a1a] border border-[#333333] rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-500"
      />
      {inputValue && (
        <button
          onClick={() => {
            setInputValue('')
            setFilterQuery('')
          }}
          className="absolute right-2 text-slate-400 hover:text-slate-200 transition-colors"
          aria-label="clear search"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
