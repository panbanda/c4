export const NODE_SIZES = {
  person: { width: 200, height: 180 },
  system: { width: 280, height: 200 },
  container: { width: 280, height: 160 },
  component: { width: 240, height: 120 },
  deploymentNode: { width: 300, height: 180 },
  deploymentGroup: { width: 400, height: 300 }, // Min size, calculated dynamically
} as const

export const TECHNOLOGY_COLORS = {
  database: 'bg-emerald-600 border-emerald-500',
  api: 'bg-violet-600 border-violet-500',
  web: 'bg-blue-600 border-blue-500',
  default: 'bg-slate-600 border-slate-500',
} as const

export type TechnologyCategory = keyof typeof TECHNOLOGY_COLORS

export function getTechnologyColor(technology?: string[]): string {
  if (!technology || !Array.isArray(technology) || technology.length === 0) return TECHNOLOGY_COLORS.default

  const tech = technology.join(' ').toLowerCase()
  if (tech.includes('database') || tech.includes('postgres') || tech.includes('mysql') || tech.includes('mongo') || tech.includes('redis') || tech.includes('dragonfly')) {
    return TECHNOLOGY_COLORS.database
  }
  if (tech.includes('api') || tech.includes('rest') || tech.includes('graphql') || tech.includes('grpc')) {
    return TECHNOLOGY_COLORS.api
  }
  if (tech.includes('web') || tech.includes('react') || tech.includes('vue') || tech.includes('angular') || tech.includes('rails')) {
    return TECHNOLOGY_COLORS.web
  }
  return TECHNOLOGY_COLORS.default
}

export const BASE_NODE_CLASSES = {
  container: 'rounded-lg shadow-lg transition-all duration-200',
  selected: 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900',
  hover: 'shadow-xl',
  title: 'font-semibold text-sm leading-tight',
  description: 'text-xs text-slate-300 leading-relaxed line-clamp-4',
  badge: 'px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap',
} as const

export const ELEMENT_COLORS = {
  person: {
    internal: 'bg-teal-700 border-teal-600',
    external: 'bg-teal-800 border-teal-700',
  },
  system: {
    focus: 'bg-blue-700 border-blue-600',
    internal: 'bg-slate-600 border-slate-500',
    external: 'bg-amber-700 border-amber-600',
  },
  container: {
    default: 'bg-blue-700 border-blue-600',
  },
  component: {
    default: 'bg-indigo-700 border-indigo-600',
  },
  deployment: {
    default: 'bg-emerald-700 border-emerald-600',
  },
} as const
