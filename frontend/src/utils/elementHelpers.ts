import type { Element } from '../types/c4'

/**
 * Build all possible IDs for an element (simple and hierarchical).
 * Containers get systemId.containerId format.
 * Components get systemId.containerId.componentId format.
 */
export function getElementIds(element: Element): string[] {
  const ids = [element.id]
  if (element.type === 'container' && 'systemId' in element && element.systemId) {
    ids.push(`${element.systemId}.${element.id}`)
  }
  if (element.type === 'component' && 'systemId' in element && 'containerId' in element) {
    if (element.systemId && element.containerId) {
      ids.push(`${element.systemId}.${element.containerId}.${element.id}`)
    }
  }
  return ids
}

/**
 * Check if a relationship endpoint matches any of the element's IDs.
 */
export function matchesElement(relationshipId: string, element: Element): boolean {
  return getElementIds(element).includes(relationshipId)
}

/**
 * Check if an element matches a search query (name, description, or tags).
 */
export function matchesFilter(element: Element, query: string): boolean {
  if (!query) return true

  const lowerQuery = query.toLowerCase()
  const nameMatch = element.name.toLowerCase().includes(lowerQuery)
  const descMatch = element.description?.toLowerCase().includes(lowerQuery)
  const tagMatch = element.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))

  return nameMatch || !!descMatch || !!tagMatch
}
