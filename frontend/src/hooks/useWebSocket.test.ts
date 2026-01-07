import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useWebSocket } from './useWebSocket'

describe('useWebSocket', () => {
  let mockWebSocket: any
  let messageHandlers: Map<string, Function>

  beforeEach(() => {
    messageHandlers = new Map()

    class MockWebSocket {
      addEventListener(event: string, handler: Function) {
        messageHandlers.set(event, handler)
      }
      removeEventListener() {}
      close = vi.fn()
    }

    mockWebSocket = MockWebSocket
    global.WebSocket = mockWebSocket as any
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('should create WebSocket connection', () => {
    renderHook(() => useWebSocket())
    expect(messageHandlers.size).toBeGreaterThan(0)
  })

  it('should handle reload message', () => {
    const onReload = vi.fn()
    renderHook(() => useWebSocket({ onReload }))

    const messageHandler = messageHandlers.get('message')
    expect(messageHandler).toBeDefined()

    messageHandler?.({ data: JSON.stringify({ type: 'reload' }) })
    expect(onReload).toHaveBeenCalled()
  })

  it('should handle error message', () => {
    const onError = vi.fn()
    renderHook(() => useWebSocket({ onError }))

    const messageHandler = messageHandlers.get('message')
    messageHandler?.({ data: JSON.stringify({ type: 'error', message: 'Test error' }) })
    expect(onError).toHaveBeenCalledWith('Test error')
  })

  it('should reconnect on close', () => {
    vi.useFakeTimers()

    let connectionCount = 0
    class MockWebSocket {
      constructor() {
        connectionCount++
      }
      addEventListener(event: string, handler: Function) {
        messageHandlers.set(event, handler)
      }
      removeEventListener() {}
      close = vi.fn()
    }
    global.WebSocket = MockWebSocket as any

    renderHook(() => useWebSocket())
    expect(connectionCount).toBe(1)

    const closeHandler = messageHandlers.get('close')
    closeHandler?.({})

    vi.advanceTimersByTime(1000)
    expect(connectionCount).toBe(2)
  })

  it('should cleanup on unmount', () => {
    const closeMock = vi.fn()

    class MockWebSocket {
      addEventListener(event: string, handler: Function) {
        messageHandlers.set(event, handler)
      }
      removeEventListener() {}
      close = closeMock
    }
    global.WebSocket = MockWebSocket as any

    const { unmount } = renderHook(() => useWebSocket())
    unmount()
    expect(closeMock).toHaveBeenCalled()
  })
})
