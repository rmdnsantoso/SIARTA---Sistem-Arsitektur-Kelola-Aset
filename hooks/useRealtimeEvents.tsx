'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type AppEventName = 'ticket_updated' | 'notification_new' | 'maintenance_updated'

interface RealtimeContextType {
  isConnected: boolean;
  subscribe: (eventName: AppEventName, callback: (data: any) => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null)

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [eventSource, setEventSource] = useState<EventSource | null>(null)
  
  // Gunakan Set untuk menyimpan listeners
  const [listeners] = useState(new Map<AppEventName, Set<(data: any) => void>>())

  useEffect(() => {
    let sse: EventSource | null = null
    let reconnectTimeout: NodeJS.Timeout

    const connect = () => {
      sse = new EventSource('/api/events')
      setEventSource(sse)

      sse.onopen = () => {
        setIsConnected(true)
      }

      sse.onerror = (err) => {
        console.error('SSE Error', err)
        setIsConnected(false)
        sse?.close()
        // Coba konek ulang
        reconnectTimeout = setTimeout(connect, 5000)
      }

      // Dengarkan event dan distribusikan ke listeners
      sse.addEventListener('ticket_updated', (e) => {
        const data = JSON.parse((e as MessageEvent).data)
        listeners.get('ticket_updated')?.forEach(cb => cb(data))
      })

      sse.addEventListener('notification_new', (e) => {
        const data = JSON.parse((e as MessageEvent).data)
        listeners.get('notification_new')?.forEach(cb => cb(data))
      })

      sse.addEventListener('maintenance_updated', (e) => {
        const data = JSON.parse((e as MessageEvent).data)
        listeners.get('maintenance_updated')?.forEach(cb => cb(data))
      })
      
      sse.addEventListener('ping', (e) => {
        // Ping event hanya untuk keep-alive
      })
    }

    connect()

    return () => {
      clearTimeout(reconnectTimeout)
      if (sse) sse.close()
    }
  }, [listeners])

  const subscribe = (eventName: AppEventName, callback: (data: any) => void) => {
    if (!listeners.has(eventName)) {
      listeners.set(eventName, new Set())
    }
    listeners.get(eventName)!.add(callback)

    return () => {
      listeners.get(eventName)?.delete(callback)
    }
  }

  return (
    <RealtimeContext.Provider value={{ isConnected, subscribe }}>
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtimeEvent(eventName: AppEventName, callback: (data: any) => void) {
  const context = useContext(RealtimeContext)
  
  useEffect(() => {
    if (!context) return
    const unsubscribe = context.subscribe(eventName, callback)
    return () => unsubscribe()
  }, [context, eventName, callback])
}
