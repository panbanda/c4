import { useState } from 'react'

const EDGE_STYLES = [
  {
    label: 'REST / HTTP / API',
    color: 'bg-blue-400',
    dasharray: undefined,
    description: 'Synchronous HTTP-based communication',
  },
  {
    label: 'Async / Event / Queue',
    color: 'bg-amber-400',
    dasharray: '8 4',
    description: 'Asynchronous messaging (Kafka, RabbitMQ, etc.)',
  },
  {
    label: 'gRPC / RPC',
    color: 'bg-purple-400',
    dasharray: '2 2',
    description: 'Remote procedure calls',
  },
  {
    label: 'Database',
    color: 'bg-emerald-400',
    dasharray: '4 2 1 2',
    description: 'Database connections (SQL, PostgreSQL, MySQL, etc.)',
  },
  {
    label: 'File / Storage',
    color: 'bg-cyan-400',
    dasharray: '1 3',
    description: 'File storage (S3, filesystem, etc.)',
  },
  {
    label: 'Other',
    color: 'bg-slate-400',
    dasharray: undefined,
    description: 'Default connection style',
  },
]

export function EdgeLegend() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="absolute bottom-4 left-4 z-10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-600 rounded-lg text-sm text-slate-300 transition-colors shadow-lg"
        aria-expanded={isOpen}
        aria-controls="edge-legend-panel"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Line Types
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {isOpen && (
        <div
          id="edge-legend-panel"
          className="absolute bottom-full left-0 mb-2 w-72 bg-slate-800/95 border border-slate-600 rounded-lg shadow-xl overflow-hidden"
        >
          <div className="px-3 py-2 border-b border-slate-700">
            <h3 className="text-sm font-medium text-slate-200">Connection Types</h3>
            <p className="text-xs text-slate-400 mt-0.5">Based on technology tags in relationships</p>
          </div>
          <div className="p-2 space-y-1 max-h-80 overflow-y-auto">
            {EDGE_STYLES.map((style) => (
              <div
                key={style.label}
                className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-slate-700/50 transition-colors"
              >
                <div className="w-12 h-0.5 flex-shrink-0 relative">
                  <svg width="48" height="8" className="overflow-visible">
                    <line
                      x1="0"
                      y1="4"
                      x2="48"
                      y2="4"
                      strokeWidth="2.5"
                      className={style.color.replace('bg-', 'stroke-')}
                      strokeDasharray={style.dasharray}
                      strokeLinecap="round"
                    />
                    <polygon
                      points="48,4 42,1 42,7"
                      className={style.color.replace('bg-', 'fill-')}
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-200">{style.label}</div>
                  <div className="text-[10px] text-slate-400 truncate">{style.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
