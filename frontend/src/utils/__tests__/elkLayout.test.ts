import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculateElkLayout, NODE_DIMENSIONS } from '../elkLayout'
import type { Element, Relationship } from '../../types/c4'

describe('NODE_DIMENSIONS', () => {
  it('should define person dimensions', () => {
    expect(NODE_DIMENSIONS.person.width).toBe(200)
    expect(NODE_DIMENSIONS.person.height).toBe(180)
  })

  it('should define system dimensions', () => {
    expect(NODE_DIMENSIONS.system.width).toBe(280)
    expect(NODE_DIMENSIONS.system.height).toBe(200)
  })

  it('should define container dimensions', () => {
    expect(NODE_DIMENSIONS.container.width).toBe(280)
    expect(NODE_DIMENSIONS.container.height).toBe(160)
  })

  it('should define component dimensions', () => {
    expect(NODE_DIMENSIONS.component.width).toBe(240)
    expect(NODE_DIMENSIONS.component.height).toBe(120)
  })

  it('should define deploymentNode dimensions', () => {
    expect(NODE_DIMENSIONS.deploymentNode.width).toBe(300)
    expect(NODE_DIMENSIONS.deploymentNode.height).toBe(180)
  })

  it('should define deploymentGroup dimensions', () => {
    expect(NODE_DIMENSIONS.deploymentGroup.width).toBe(400)
    expect(NODE_DIMENSIONS.deploymentGroup.height).toBe(300)
  })
})

describe('calculateElkLayout', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  it('should return empty positions for empty elements', async () => {
    const result = await calculateElkLayout({
      elements: [],
      relationships: [],
    })

    expect(result.positions.size).toBe(0)
    expect(result.width).toBe(0)
    expect(result.height).toBe(0)
  })

  it('should calculate positions for persons', async () => {
    const elements: Element[] = [
      { id: 'person1', name: 'User', type: 'person' },
    ]

    const result = await calculateElkLayout({
      elements,
      relationships: [],
    })

    expect(result.positions.has('person1')).toBe(true)
    const pos = result.positions.get('person1')
    expect(pos).toBeDefined()
    expect(typeof pos?.x).toBe('number')
    expect(typeof pos?.y).toBe('number')
  })

  it('should calculate positions for systems', async () => {
    const elements: Element[] = [
      { id: 'sys1', name: 'System A', type: 'system' },
      { id: 'sys2', name: 'System B', type: 'system', external: true },
    ]

    const result = await calculateElkLayout({
      elements,
      relationships: [],
    })

    expect(result.positions.has('sys1')).toBe(true)
    expect(result.positions.has('sys2')).toBe(true)
  })

  it('should calculate positions for containers', async () => {
    const elements: Element[] = [
      { id: 'cont1', name: 'API', type: 'container', systemId: 'sys1' },
    ]

    const result = await calculateElkLayout({
      elements,
      relationships: [],
    })

    expect(result.positions.has('cont1')).toBe(true)
  })

  it('should calculate positions for components', async () => {
    const elements: Element[] = [
      {
        id: 'comp1',
        name: 'Service',
        type: 'component',
        systemId: 'sys1',
        containerId: 'cont1',
      },
    ]

    const result = await calculateElkLayout({
      elements,
      relationships: [],
    })

    expect(result.positions.has('comp1')).toBe(true)
  })

  it('should handle relationships between elements', async () => {
    const elements: Element[] = [
      { id: 'person1', name: 'User', type: 'person' },
      { id: 'sys1', name: 'System', type: 'system' },
    ]
    const relationships: Relationship[] = [
      { from: 'person1', to: 'sys1', description: 'Uses' },
    ]

    const result = await calculateElkLayout({
      elements,
      relationships,
    })

    expect(result.positions.has('person1')).toBe(true)
    expect(result.positions.has('sys1')).toBe(true)
  })

  it('should detect database containers for semantic layering', async () => {
    const elements: Element[] = [
      { id: 'api', name: 'API', type: 'container', systemId: 'sys1' },
      {
        id: 'db',
        name: 'PostgreSQL Database',
        type: 'container',
        systemId: 'sys1',
        technology: ['PostgreSQL'],
      },
    ]

    const result = await calculateElkLayout({
      elements,
      relationships: [{ from: 'api', to: 'db' }],
    })

    expect(result.positions.has('api')).toBe(true)
    expect(result.positions.has('db')).toBe(true)
  })

  it('should detect entry point containers', async () => {
    const elements: Element[] = [
      {
        id: 'gateway',
        name: 'API Gateway',
        type: 'container',
        systemId: 'sys1',
        tags: ['gateway'],
      },
    ]

    const result = await calculateElkLayout({
      elements,
      relationships: [],
    })

    expect(result.positions.has('gateway')).toBe(true)
  })

  it('should resolve hierarchical container IDs', async () => {
    const elements: Element[] = [
      { id: 'api', name: 'API', type: 'container', systemId: 'sys1' },
      { id: 'db', name: 'DB', type: 'container', systemId: 'sys1' },
    ]
    const relationships: Relationship[] = [
      { from: 'sys1.api', to: 'sys1.db' },
    ]

    const result = await calculateElkLayout({
      elements,
      relationships,
    })

    expect(result.positions.has('api')).toBe(true)
    expect(result.positions.has('db')).toBe(true)
  })

  it('should resolve hierarchical component IDs', async () => {
    const elements: Element[] = [
      {
        id: 'svc',
        name: 'Service',
        type: 'component',
        systemId: 'sys1',
        containerId: 'api',
      },
    ]
    const relationships: Relationship[] = []

    const result = await calculateElkLayout({
      elements,
      relationships,
    })

    expect(result.positions.has('svc')).toBe(true)
  })

  it('should exclude edges where endpoint not in view', async () => {
    const elements: Element[] = [
      { id: 'sys1', name: 'System', type: 'system' },
    ]
    const relationships: Relationship[] = [
      { from: 'sys1', to: 'nonexistent' },
    ]

    const result = await calculateElkLayout({
      elements,
      relationships,
    })

    expect(result.positions.has('sys1')).toBe(true)
  })

  it('should handle redis technology as data store', async () => {
    const elements: Element[] = [
      {
        id: 'cache',
        name: 'Redis Cache',
        type: 'container',
        systemId: 'sys1',
        technology: ['Redis'],
      },
    ]

    const result = await calculateElkLayout({
      elements,
      relationships: [],
    })

    expect(result.positions.has('cache')).toBe(true)
  })

  it('should handle kafka technology as data store', async () => {
    const elements: Element[] = [
      {
        id: 'queue',
        name: 'Kafka Queue',
        type: 'container',
        systemId: 'sys1',
        description: 'Message queue with Kafka',
      },
    ]

    const result = await calculateElkLayout({
      elements,
      relationships: [],
    })

    expect(result.positions.has('queue')).toBe(true)
  })

  it('should handle frontend/web entry points', async () => {
    const elements: Element[] = [
      {
        id: 'web',
        name: 'Web Frontend',
        type: 'container',
        systemId: 'sys1',
      },
    ]

    const result = await calculateElkLayout({
      elements,
      relationships: [],
    })

    expect(result.positions.has('web')).toBe(true)
  })

  it('should handle internal system as service layer', async () => {
    const elements: Element[] = [
      { id: 'sys1', name: 'Internal System', type: 'system', external: false },
    ]

    const result = await calculateElkLayout({
      elements,
      relationships: [],
    })

    expect(result.positions.has('sys1')).toBe(true)
  })

  it('should handle multiple elements and relationships', async () => {
    const elements: Element[] = [
      { id: 'user', name: 'User', type: 'person' },
      { id: 'sys1', name: 'System', type: 'system' },
      { id: 'api', name: 'API', type: 'container', systemId: 'sys1' },
      { id: 'db', name: 'DB', type: 'container', systemId: 'sys1', technology: ['PostgreSQL'] },
    ]
    const relationships: Relationship[] = [
      { from: 'user', to: 'sys1' },
      { from: 'sys1.api', to: 'sys1.db' },
    ]

    const result = await calculateElkLayout({
      elements,
      relationships,
    })

    expect(result.positions.size).toBe(4)
  })
})
