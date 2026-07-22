import { NextResponse } from 'next/server'
import { appEvents } from '@/lib/events'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  let controllerRef: ReadableStreamDefaultController | null = null

  // Format sebuah event SSE
  const sendEvent = (eventName: string, data: any) => {
    if (!controllerRef) return
    try {
      controllerRef.enqueue(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`)
    } catch (e) {
      console.error('Error sending event', e)
    }
  }

  const handleTicketUpdated = (data: any) => sendEvent('ticket_updated', data)
  const handleNotificationNew = (data: any) => sendEvent('notification_new', data)
  const handleMaintenanceUpdated = (data: any) => sendEvent('maintenance_updated', data)

  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller

      // Listeners
      appEvents.on('ticket_updated', handleTicketUpdated)
      appEvents.on('notification_new', handleNotificationNew)
      appEvents.on('maintenance_updated', handleMaintenanceUpdated)

      // Ping setiap 30 detik untuk menjaga koneksi tetap terbuka (keep-alive)
      const pingInterval = setInterval(() => {
        sendEvent('ping', { time: Date.now() })
      }, 30000)

      // Clean up jika koneksi terputus dari client
      req.signal.addEventListener('abort', () => {
        clearInterval(pingInterval)
        appEvents.off('ticket_updated', handleTicketUpdated)
        appEvents.off('notification_new', handleNotificationNew)
        appEvents.off('maintenance_updated', handleMaintenanceUpdated)
        try {
          controller.close()
        } catch (e) {}
      })
    },
    cancel() {
      // Clean up jika stream di-cancel secara internal
      appEvents.off('ticket_updated', handleTicketUpdated)
      appEvents.off('notification_new', handleNotificationNew)
      appEvents.off('maintenance_updated', handleMaintenanceUpdated)
    }
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      // Jika di-deploy di Vercel, terkadang SSE akan terputus karena batas durasi eksekusi function
    },
  })
}
