import { describe, it, expect } from 'vitest'
import { calculateCentrality } from '../centrality'
import type { C4Model } from '../../types/c4'

describe('calculateCentrality', () => {
  it('returns empty result for empty model', () => {
    const model: C4Model = {
      persons: [],
      systems: [],
      containers: [],
      components: [],
      relationships: [],
      flows: [],
      deployments: [],
      options: { showMinimap: true },
    }
    const result = calculateCentrality(model)
    expect(result.centrality).toEqual({})
    expect(result.topNodes).toEqual([])
  })

  it('calculates degree centrality from relationships', () => {
    const model: C4Model = {
      persons: [{ id: 'user', name: 'User', type: 'person' }],
      systems: [
        { id: 'api', name: 'API', type: 'system' },
        { id: 'db', name: 'Database', type: 'system' },
      ],
      containers: [],
      components: [],
      relationships: [
        { from: 'user', to: 'api' },
        { from: 'api', to: 'db' },
        { from: 'api', to: 'user' },
      ],
      flows: [],
      deployments: [],
      options: { showMinimap: true },
    }
    const result = calculateCentrality(model)

    expect(result.centrality['api']).toEqual({ incoming: 1, outgoing: 2 })
    expect(result.centrality['user']).toEqual({ incoming: 1, outgoing: 1 })
    expect(result.centrality['db']).toEqual({ incoming: 1, outgoing: 0 })
    expect(result.topNodes[0].id).toBe('api')
  })

  it('identifies flow participation', () => {
    const model: C4Model = {
      persons: [],
      systems: [{ id: 'api', name: 'API', type: 'system' }],
      containers: [],
      components: [],
      relationships: [],
      flows: [
        {
          id: 'login',
          name: 'Login Flow',
          steps: [{ seq: 1, from: 'user', to: 'api' }],
        },
      ],
      deployments: [],
      options: { showMinimap: true },
    }
    const result = calculateCentrality(model)
    expect(result.flowParticipation['api']).toContain('login')
  })

  it('counts children for systems and containers', () => {
    const model: C4Model = {
      persons: [],
      systems: [{ id: 'sys', name: 'System', type: 'system' }],
      containers: [
        { id: 'c1', name: 'Container 1', type: 'container', systemId: 'sys' },
        { id: 'c2', name: 'Container 2', type: 'container', systemId: 'sys' },
      ],
      components: [
        { id: 'comp1', name: 'Comp', type: 'component', systemId: 'sys', containerId: 'c1' },
      ],
      relationships: [],
      flows: [],
      deployments: [],
      options: { showMinimap: true },
    }
    const result = calculateCentrality(model)
    expect(result.childrenCount['sys']).toBe(2)
    expect(result.childrenCount['c1']).toBe(1)
    expect(result.childrenCount['c2']).toBe(0)
  })
})
