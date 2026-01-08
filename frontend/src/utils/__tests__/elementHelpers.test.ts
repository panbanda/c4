import { describe, it, expect } from 'vitest'
import { getElementIds, matchesElement, matchesFilter } from '../elementHelpers'
import type { Element, Person, SoftwareSystem, Container, Component } from '../../types/c4'

describe('getElementIds', () => {
  it('should return simple ID for person', () => {
    const person: Person = { id: 'user1', name: 'User', type: 'person' }
    expect(getElementIds(person)).toEqual(['user1'])
  })

  it('should return simple ID for system', () => {
    const system: SoftwareSystem = { id: 'sys1', name: 'System', type: 'system' }
    expect(getElementIds(system)).toEqual(['sys1'])
  })

  it('should return simple and hierarchical ID for container', () => {
    const container: Container = {
      id: 'api',
      name: 'API',
      type: 'container',
      systemId: 'sys1',
    }
    expect(getElementIds(container)).toEqual(['api', 'sys1.api'])
  })

  it('should return simple and hierarchical ID for component', () => {
    const component: Component = {
      id: 'svc',
      name: 'Service',
      type: 'component',
      systemId: 'sys1',
      containerId: 'api',
    }
    expect(getElementIds(component)).toEqual(['svc', 'sys1.api.svc'])
  })

  it('should handle container without systemId', () => {
    const container = {
      id: 'api',
      name: 'API',
      type: 'container',
    } as Element
    expect(getElementIds(container)).toEqual(['api'])
  })

  it('should handle component without systemId or containerId', () => {
    const component = {
      id: 'svc',
      name: 'Service',
      type: 'component',
    } as Element
    expect(getElementIds(component)).toEqual(['svc'])
  })
})

describe('matchesElement', () => {
  it('should match by simple ID', () => {
    const system: SoftwareSystem = { id: 'sys1', name: 'System', type: 'system' }
    expect(matchesElement('sys1', system)).toBe(true)
  })

  it('should not match non-matching ID', () => {
    const system: SoftwareSystem = { id: 'sys1', name: 'System', type: 'system' }
    expect(matchesElement('sys2', system)).toBe(false)
  })

  it('should match container by hierarchical ID', () => {
    const container: Container = {
      id: 'api',
      name: 'API',
      type: 'container',
      systemId: 'sys1',
    }
    expect(matchesElement('sys1.api', container)).toBe(true)
  })

  it('should match component by hierarchical ID', () => {
    const component: Component = {
      id: 'svc',
      name: 'Service',
      type: 'component',
      systemId: 'sys1',
      containerId: 'api',
    }
    expect(matchesElement('sys1.api.svc', component)).toBe(true)
  })

  it('should match container by simple ID', () => {
    const container: Container = {
      id: 'api',
      name: 'API',
      type: 'container',
      systemId: 'sys1',
    }
    expect(matchesElement('api', container)).toBe(true)
  })
})

describe('matchesFilter', () => {
  const testElement: SoftwareSystem = {
    id: 'sys1',
    name: 'Payment System',
    type: 'system',
    description: 'Handles all payment processing',
    tags: ['backend', 'payments'],
  }

  it('should return true for empty query', () => {
    expect(matchesFilter(testElement, '')).toBe(true)
  })

  it('should match by name', () => {
    expect(matchesFilter(testElement, 'payment')).toBe(true)
    expect(matchesFilter(testElement, 'Payment')).toBe(true)
  })

  it('should match by description', () => {
    expect(matchesFilter(testElement, 'processing')).toBe(true)
  })

  it('should match by tag', () => {
    expect(matchesFilter(testElement, 'backend')).toBe(true)
    expect(matchesFilter(testElement, 'payments')).toBe(true)
  })

  it('should not match non-matching query', () => {
    expect(matchesFilter(testElement, 'shipping')).toBe(false)
  })

  it('should be case insensitive', () => {
    expect(matchesFilter(testElement, 'PAYMENT')).toBe(true)
    expect(matchesFilter(testElement, 'BACKEND')).toBe(true)
  })

  it('should handle element without description', () => {
    const element: SoftwareSystem = { id: 'sys', name: 'System', type: 'system' }
    expect(matchesFilter(element, 'System')).toBe(true)
    expect(matchesFilter(element, 'desc')).toBe(false)
  })

  it('should handle element without tags', () => {
    const element: SoftwareSystem = { id: 'sys', name: 'System', type: 'system' }
    expect(matchesFilter(element, 'tag')).toBe(false)
  })

  it('should handle partial matches', () => {
    expect(matchesFilter(testElement, 'pay')).toBe(true)
    expect(matchesFilter(testElement, 'back')).toBe(true)
  })
})
