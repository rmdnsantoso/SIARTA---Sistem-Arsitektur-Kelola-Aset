import { EventEmitter } from 'events'

// Gunakan singleton agar event emitter tidak ter-reset saat hot reload di development, 
// dan agar semua route handler berbagi instance yang sama di production (single node).
const globalForEvents = global as unknown as { appEvents: EventEmitter }

export const appEvents =
  globalForEvents.appEvents ||
  new EventEmitter()

// Tambah max listeners untuk mencegah memory leak warning jika ada banyak klien aktif
appEvents.setMaxListeners(100)

if (process.env.NODE_ENV !== 'production') {
  globalForEvents.appEvents = appEvents
}
