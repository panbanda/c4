import type { C4Model } from '../types/c4'

export interface NodeCentrality {
  incoming: number
  outgoing: number
}

export interface CentralityResult {
  centrality: Record<string, NodeCentrality>
  topNodes: Array<{ id: string; name: string; type: string; score: number }>
  flowParticipation: Record<string, string[]>
  childrenCount: Record<string, number>
}

export function calculateCentrality(model: C4Model): CentralityResult {
  const centrality: Record<string, NodeCentrality> = {}
  const flowParticipation: Record<string, string[]> = {}
  const childrenCount: Record<string, number> = {}

  // Initialize all elements with zero centrality
  const allElements = [
    ...model.persons,
    ...model.systems,
    ...model.containers,
    ...model.components,
  ]

  for (const el of allElements) {
    centrality[el.id] = { incoming: 0, outgoing: 0 }
  }

  // Count relationships
  for (const rel of model.relationships) {
    const fromId = rel.from.split('.').pop() || rel.from
    const toId = rel.to.split('.').pop() || rel.to

    if (centrality[fromId]) {
      centrality[fromId].outgoing++
    }
    if (centrality[toId]) {
      centrality[toId].incoming++
    }
  }

  // Track flow participation
  for (const flow of model.flows) {
    for (const step of flow.steps) {
      const fromId = step.from.split('.').pop() || step.from
      const toId = step.to.split('.').pop() || step.to

      if (!flowParticipation[fromId]) flowParticipation[fromId] = []
      if (!flowParticipation[fromId].includes(flow.id)) {
        flowParticipation[fromId].push(flow.id)
      }

      if (!flowParticipation[toId]) flowParticipation[toId] = []
      if (!flowParticipation[toId].includes(flow.id)) {
        flowParticipation[toId].push(flow.id)
      }
    }
  }

  // Count children
  for (const sys of model.systems) {
    childrenCount[sys.id] = model.containers.filter((c) => c.systemId === sys.id).length
  }
  for (const cont of model.containers) {
    childrenCount[cont.id] = model.components.filter(
      (c) => c.containerId === cont.id
    ).length
  }

  // Calculate top nodes by total degree
  const topNodes = allElements
    .map((el) => ({
      id: el.id,
      name: el.name,
      type: el.type,
      score: (centrality[el.id]?.incoming || 0) + (centrality[el.id]?.outgoing || 0),
    }))
    .filter((n) => n.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  return { centrality, topNodes, flowParticipation, childrenCount }
}
