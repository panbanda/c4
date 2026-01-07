import type { C4Model, Element } from '../types/c4'

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options)

  if (!response.ok) {
    throw new ApiError(
      `Failed to fetch ${url}`,
      response.status,
      response.statusText
    )
  }

  return response.json()
}

export async function getModel(): Promise<C4Model> {
  return fetchJson<C4Model>('/api/model')
}

export async function getHealth(): Promise<{ status: string; clients: number }> {
  return fetchJson('/api/health')
}

export async function updateElementAPI(id: string, changes: Partial<Element>): Promise<C4Model> {
  const element = changes as Element
  const type = element.type || 'unknown'

  return fetchJson<C4Model>(`/api/elements/${type}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(changes),
  })
}
