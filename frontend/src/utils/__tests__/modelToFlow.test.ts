import { describe, it, expect } from 'vitest'
import { modelToFlow } from '../modelToFlow'
import type { C4Model } from '../../types/c4'

const mockModel: C4Model = {
  persons: [
    {
      id: 'user1',
      type: 'person',
      name: 'User',
      description: 'A user of the system',
      tags: ['external'],
    },
  ],
  systems: [
    {
      id: 'sys1',
      type: 'system',
      name: 'System A',
      description: 'Main system',
      external: false,
    },
    {
      id: 'sys2',
      type: 'system',
      name: 'System B',
      description: 'External system',
      external: true,
    },
  ],
  containers: [
    {
      id: 'cont1',
      type: 'container',
      name: 'Web App',
      description: 'Frontend',
      technology: 'React',
      systemId: 'sys1',
    },
    {
      id: 'cont2',
      type: 'container',
      name: 'API',
      description: 'Backend API',
      technology: 'Node.js',
      systemId: 'sys1',
    },
  ],
  components: [
    {
      id: 'comp1',
      type: 'component',
      name: 'Auth Service',
      technology: 'TypeScript',
      systemId: 'sys1',
      containerId: 'cont2',
    },
  ],
  relationships: [
    {
      from: 'user1',
      to: 'sys1',
      description: 'Uses',
    },
    {
      from: 'sys1',
      to: 'sys2',
      description: 'Calls',
      technology: 'REST API',
    },
    {
      from: 'cont1',
      to: 'cont2',
      description: 'Makes requests to',
      technology: 'HTTPS',
    },
  ],
  flows: [],
  deployments: [],
}

describe('modelToFlow', () => {
  it('returns empty arrays for null model', () => {
    const result = modelToFlow(null, { viewType: 'landscape' })
    expect(result.nodes).toEqual([])
    expect(result.edges).toEqual([])
  })

  it('generates landscape view with persons and systems', () => {
    const result = modelToFlow(mockModel, { viewType: 'landscape' })

    expect(result.nodes).toHaveLength(3)
    expect(result.nodes.map(n => n.type)).toEqual(['person', 'system', 'system'])
    expect(result.nodes.map(n => n.id)).toEqual(['user1', 'sys1', 'sys2'])
  })

  it('generates context view with related elements only', () => {
    const result = modelToFlow(mockModel, {
      viewType: 'context',
      focusElement: 'sys1',
    })

    expect(result.nodes).toHaveLength(3)
    const nodeIds = result.nodes.map(n => n.id)
    expect(nodeIds).toContain('user1')
    expect(nodeIds).toContain('sys1')
    expect(nodeIds).toContain('sys2')
  })

  it('generates container view with containers and related elements', () => {
    const result = modelToFlow(mockModel, {
      viewType: 'container',
      focusElement: 'sys1',
    })

    expect(result.nodes.length).toBeGreaterThanOrEqual(2)
    const nodeIds = result.nodes.map(n => n.id)
    expect(nodeIds).toContain('cont1')
    expect(nodeIds).toContain('cont2')
  })

  it('generates component view for a container', () => {
    const result = modelToFlow(mockModel, {
      viewType: 'component',
      focusElement: 'cont2',
    })

    const nodeIds = result.nodes.map(n => n.id)
    expect(nodeIds).toContain('comp1')
  })

  it('generates edges for relationships between visible nodes', () => {
    const result = modelToFlow(mockModel, { viewType: 'landscape' })

    expect(result.edges.length).toBeGreaterThan(0)
    const edge = result.edges.find(e => e.source === 'user1' && e.target === 'sys1')
    expect(edge).toBeDefined()
    expect(edge?.type).toBe('relationship')
    expect(edge?.data?.description).toBe('Uses')
  })

  it('sets isFocus flag on focused system node', () => {
    const result = modelToFlow(mockModel, {
      viewType: 'context',
      focusElement: 'sys1',
    })

    const focusNode = result.nodes.find(n => n.id === 'sys1')
    expect(focusNode?.type).toBe('system')
    expect(focusNode?.data).toHaveProperty('isFocus', true)
  })

  it('attaches callback handlers to nodes', () => {
    const onSelect = () => {}
    const onDrillDown = () => {}

    const result = modelToFlow(mockModel, {
      viewType: 'landscape',
      onSelectElement: onSelect,
      onDrillDown: onDrillDown,
    })

    const personNode = result.nodes.find(n => n.type === 'person')
    expect(personNode?.data).toHaveProperty('onSelect', onSelect)

    const systemNode = result.nodes.find(n => n.type === 'system')
    expect(systemNode?.data).toHaveProperty('onDrillDown', onDrillDown)
  })

  it('includes technology in edge data', () => {
    const result = modelToFlow(mockModel, { viewType: 'landscape' })

    const edge = result.edges.find(e => e.source === 'sys1' && e.target === 'sys2')
    expect(edge?.data?.technology).toBe('REST API')
  })

  it('filters out edges for non-visible nodes', () => {
    const result = modelToFlow(mockModel, {
      viewType: 'container',
      focusElement: 'sys1',
    })

    const edgeFromUser = result.edges.find(e => e.source === 'user1')
    if (edgeFromUser) {
      const targetNode = result.nodes.find(n => n.id === edgeFromUser.target)
      expect(targetNode).toBeDefined()
    }
  })

  it('assigns positions to all nodes', () => {
    const result = modelToFlow(mockModel, { viewType: 'landscape' })

    result.nodes.forEach(node => {
      expect(node.position).toBeDefined()
      expect(typeof node.position.x).toBe('number')
      expect(typeof node.position.y).toBe('number')
    })
  })
})
