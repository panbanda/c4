import { useEffect, useRef } from 'react'

interface WebSocketMessage {
  type: 'reload' | 'error'
  message?: string
}

interface UseWebSocketOptions {
  onReload?: () => void
  onError?: (error: string) => void
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`)

      ws.addEventListener('message', (event) => {
        try {
          const msg: WebSocketMessage = JSON.parse(event.data)

          if (msg.type === 'reload') {
            options.onReload?.()
          } else if (msg.type === 'error') {
            options.onError?.(msg.message ?? 'Unknown error')
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      })

      ws.addEventListener('close', () => {
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect()
        }, 1000)
      })

      ws.addEventListener('error', (err) => {
        console.error('WebSocket error:', err)
      })

      wsRef.current = ws
    }

    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      wsRef.current?.close()
    }
  }, [options.onReload, options.onError])

  return wsRef
}
