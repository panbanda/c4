import { describe, it, expect } from 'vitest'
import {
  NODE_SIZES,
  TECHNOLOGY_COLORS,
  getTechnologyColor,
  BASE_NODE_CLASSES,
  ELEMENT_COLORS,
} from '../nodeStyles'

describe('NODE_SIZES', () => {
  it('should define person node dimensions', () => {
    expect(NODE_SIZES.person.width).toBe(200)
    expect(NODE_SIZES.person.height).toBe(180)
  })

  it('should define system node dimensions', () => {
    expect(NODE_SIZES.system.width).toBe(280)
    expect(NODE_SIZES.system.height).toBe(200)
  })

  it('should define container node dimensions', () => {
    expect(NODE_SIZES.container.width).toBe(280)
    expect(NODE_SIZES.container.height).toBe(160)
  })

  it('should define component node dimensions', () => {
    expect(NODE_SIZES.component.width).toBe(240)
    expect(NODE_SIZES.component.height).toBe(120)
  })

  it('should define deploymentNode dimensions', () => {
    expect(NODE_SIZES.deploymentNode.width).toBe(300)
    expect(NODE_SIZES.deploymentNode.height).toBe(180)
  })

  it('should define deploymentGroup dimensions', () => {
    expect(NODE_SIZES.deploymentGroup.width).toBe(400)
    expect(NODE_SIZES.deploymentGroup.height).toBe(300)
  })
})

describe('TECHNOLOGY_COLORS', () => {
  it('should define database color', () => {
    expect(TECHNOLOGY_COLORS.database).toContain('emerald')
  })

  it('should define api color', () => {
    expect(TECHNOLOGY_COLORS.api).toContain('violet')
  })

  it('should define web color', () => {
    expect(TECHNOLOGY_COLORS.web).toContain('blue')
  })

  it('should define default color', () => {
    expect(TECHNOLOGY_COLORS.default).toContain('slate')
  })
})

describe('getTechnologyColor', () => {
  it('should return default for undefined technology', () => {
    expect(getTechnologyColor()).toBe(TECHNOLOGY_COLORS.default)
  })

  it('should return default for empty array', () => {
    expect(getTechnologyColor([])).toBe(TECHNOLOGY_COLORS.default)
  })

  it('should return database color for postgres', () => {
    expect(getTechnologyColor(['PostgreSQL'])).toBe(TECHNOLOGY_COLORS.database)
  })

  it('should return database color for mysql', () => {
    expect(getTechnologyColor(['MySQL'])).toBe(TECHNOLOGY_COLORS.database)
  })

  it('should return database color for mongo', () => {
    expect(getTechnologyColor(['MongoDB'])).toBe(TECHNOLOGY_COLORS.database)
  })

  it('should return database color for redis', () => {
    expect(getTechnologyColor(['Redis'])).toBe(TECHNOLOGY_COLORS.database)
  })

  it('should return database color for dragonfly', () => {
    expect(getTechnologyColor(['Dragonfly'])).toBe(TECHNOLOGY_COLORS.database)
  })

  it('should return api color for REST', () => {
    expect(getTechnologyColor(['REST API'])).toBe(TECHNOLOGY_COLORS.api)
  })

  it('should return api color for graphql', () => {
    expect(getTechnologyColor(['GraphQL'])).toBe(TECHNOLOGY_COLORS.api)
  })

  it('should return api color for grpc', () => {
    expect(getTechnologyColor(['gRPC'])).toBe(TECHNOLOGY_COLORS.api)
  })

  it('should return web color for react', () => {
    expect(getTechnologyColor(['React'])).toBe(TECHNOLOGY_COLORS.web)
  })

  it('should return web color for vue', () => {
    expect(getTechnologyColor(['Vue'])).toBe(TECHNOLOGY_COLORS.web)
  })

  it('should return web color for angular', () => {
    expect(getTechnologyColor(['Angular'])).toBe(TECHNOLOGY_COLORS.web)
  })

  it('should return web color for rails', () => {
    expect(getTechnologyColor(['Rails'])).toBe(TECHNOLOGY_COLORS.web)
  })

  it('should return default for unknown technology', () => {
    expect(getTechnologyColor(['Unknown Tech'])).toBe(TECHNOLOGY_COLORS.default)
  })

  it('should handle case insensitivity', () => {
    expect(getTechnologyColor(['POSTGRESQL'])).toBe(TECHNOLOGY_COLORS.database)
    expect(getTechnologyColor(['graphql'])).toBe(TECHNOLOGY_COLORS.api)
  })

  it('should handle multiple technologies', () => {
    expect(getTechnologyColor(['Node.js', 'PostgreSQL'])).toBe(TECHNOLOGY_COLORS.database)
  })
})

describe('BASE_NODE_CLASSES', () => {
  it('should define container class', () => {
    expect(BASE_NODE_CLASSES.container).toContain('rounded-lg')
  })

  it('should define selected class', () => {
    expect(BASE_NODE_CLASSES.selected).toContain('ring-2')
  })

  it('should define hover class', () => {
    expect(BASE_NODE_CLASSES.hover).toContain('shadow-xl')
  })

  it('should define title class', () => {
    expect(BASE_NODE_CLASSES.title).toContain('font-semibold')
  })

  it('should define description class', () => {
    expect(BASE_NODE_CLASSES.description).toContain('text-xs')
  })

  it('should define badge class', () => {
    expect(BASE_NODE_CLASSES.badge).toContain('rounded')
  })
})

describe('ELEMENT_COLORS', () => {
  it('should define person internal color', () => {
    expect(ELEMENT_COLORS.person.internal).toContain('teal-700')
  })

  it('should define person external color', () => {
    expect(ELEMENT_COLORS.person.external).toContain('teal-800')
  })

  it('should define system focus color', () => {
    expect(ELEMENT_COLORS.system.focus).toContain('blue-700')
  })

  it('should define system internal color', () => {
    expect(ELEMENT_COLORS.system.internal).toContain('slate-600')
  })

  it('should define system external color', () => {
    expect(ELEMENT_COLORS.system.external).toContain('amber-700')
  })

  it('should define container default color', () => {
    expect(ELEMENT_COLORS.container.default).toContain('blue-700')
  })

  it('should define component default color', () => {
    expect(ELEMENT_COLORS.component.default).toContain('indigo-700')
  })

  it('should define deployment default color', () => {
    expect(ELEMENT_COLORS.deployment.default).toContain('emerald-700')
  })
})
