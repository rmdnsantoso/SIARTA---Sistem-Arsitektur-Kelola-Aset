'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCircle2, XCircle, Clock, AlertTriangle, Info } from 'lucide-react'
import { Ticket } from '../../types/ticket'

// ===== Tipe Notifikasi (digabung di sini, tidak perlu file types terpisah) =====
type NotificationType = 'approval' | 'rejected' | 'reminder' | 'overdue' | 'info'

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  ticketId?: string
  timestamp: string
  isRead: boolean
}

// ===== Helper tanggal (format "DD MMM YYYY" ala dummyData, contoh: "18 Jun 2026") =====
const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, Mei: 4, Jun: 5,
  Jul: 6, Agu: 7, Sep: 8, Okt: 9, Nov: 10, Des: 11,
}

function parseIndoDate(value: string): Date | null {
  const parts = value.trim().split(' ')
  if (parts.length !== 3) return null
  const day = parseInt(parts[0], 10)
  const month = MONTHS[parts[1]]
  const year = parseInt(parts[2], 10)
  if (Number.isNaN(day) || month === undefined || Number.isNaN(year)) return null
  return new Date(year, month, day)
}

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24
  const start = new Date(a.getFullYear(), a.getMonth(), a.getDate())
  const end = new Date(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((end.getTime() - start.getTime()) / msPerDay)
}

// ===== Logic: ubah data tiket jadi daftar notifikasi =====
function generateNotifications(tickets: Ticket[], peminjamName: string, today: Date = new Date()): Notification[] {
  const myTickets = tickets.filter(t => t.peminjam === peminjamName)
  const notifications: Notification[] = []

  myTickets.forEach(ticket => {
    // 1. Status persetujuan / penolakan
    if (ticket.overallStatus === 'Disetujui') {
      notifications.push({
        id: `${ticket.id}-approved`,
        type: 'approval',
        title: 'Pengajuan disetujui',
        message: `Peminjaman ${ticket.alat} (${ticket.id}) telah disetujui dan siap untuk proses serah terima.`,
        ticketId: ticket.id,
        timestamp: ticket.tanggalPinjam,
        isRead: false,
      })
    } else if (ticket.overallStatus === 'Ditolak') {
      const reason = ticket.trackingLogs?.find(l => l.status?.toLowerCase().includes('ditolak'))?.status
      notifications.push({
        id: `${ticket.id}-rejected`,
        type: 'rejected',
        title: 'Pengajuan ditolak',
        message: reason
          ? `Peminjaman ${ticket.alat} (${ticket.id}) ditolak. ${reason}`
          : `Peminjaman ${ticket.alat} (${ticket.id}) ditolak pada tahap ${ticket.currentStage}.`,
        ticketId: ticket.id,
        timestamp: ticket.tanggalPinjam,
        isRead: false,
      })
    } else if (ticket.overallStatus === 'Menunggu') {
      notifications.push({
        id: `${ticket.id}-pending`,
        type: 'info',
        title: 'Menunggu persetujuan',
        message: `Peminjaman ${ticket.alat} (${ticket.id}) sedang menunggu persetujuan dari ${ticket.currentStage}.`,
        ticketId: ticket.id,
        timestamp: ticket.tanggalPinjam,
        isRead: true,
      })
    }

    // 2. Pengingat pengembalian (H-3 dan H-1) & keterlambatan, hanya untuk alat yang sedang dipinjam
    if (ticket.overallStatus === 'Dipinjam') {
      const dueDate = parseIndoDate(ticket.tanggalKembali)
      if (dueDate) {
        const diff = daysBetween(today, dueDate) // positif = belum jatuh tempo, negatif = sudah lewat

        if (diff === 3) {
          notifications.push({
            id: `${ticket.id}-h3`,
            type: 'reminder',
            title: 'Pengingat pengembalian (H-3)',
            message: `${ticket.alat} (${ticket.id}) harus dikembalikan dalam 3 hari, paling lambat ${ticket.tanggalKembali}.`,
            ticketId: ticket.id,
            timestamp: ticket.tanggalKembali,
            isRead: false,
          })
        } else if (diff === 1) {
          notifications.push({
            id: `${ticket.id}-h1`,
            type: 'reminder',
            title: 'Pengingat pengembalian (H-1)',
            message: `${ticket.alat} (${ticket.id}) harus dikembalikan besok, ${ticket.tanggalKembali}.`,
            ticketId: ticket.id,
            timestamp: ticket.tanggalKembali,
            isRead: false,
          })
        } else if (diff < 0) {
          notifications.push({
            id: `${ticket.id}-overdue`,
            type: 'overdue',
            title: 'Keterlambatan pengembalian',
            message: `${ticket.alat} (${ticket.id}) sudah terlambat dikembalikan ${Math.abs(diff)} hari sejak ${ticket.tanggalKembali}.`,
            ticketId: ticket.id,
            timestamp: ticket.tanggalKembali,
            isRead: false,
          })
        }
      }
    }

    // 3. Laporan kerusakan yang sudah dikirim
    if (ticket.isReportedDamaged && ticket.damageReport) {
      notifications.push({
        id: `${ticket.id}-damage`,
        type: 'info',
        title: 'Laporan kerusakan tercatat',
        message: `Laporan kerusakan untuk ${ticket.alat} (${ticket.id}) telah tercatat dan sedang ditindaklanjuti.`,
        ticketId: ticket.id,
        timestamp: ticket.damageReport.timestamp,
        isRead: true,
      })
    }
  })

  return notifications
}

// ===== UI =====
interface Props {
  tickets: Ticket[]
  peminjamName: string
}

const ICONS: Record<NotificationType, React.ReactNode> = {
  approval: <CheckCircle2 className="w-4 h-4 text-green-600" />,
  rejected: <XCircle className="w-4 h-4 text-red-600" />,
  reminder: <Clock className="w-4 h-4 text-amber-600" />,
  overdue: <AlertTriangle className="w-4 h-4 text-red-600" />,
  info: <Info className="w-4 h-4 text-blue-600" />,
}

const BG: Record<NotificationType, string> = {
  approval: 'bg-green-50',
  rejected: 'bg-red-50',
  reminder: 'bg-amber-50',
  overdue: 'bg-red-50',
  info: 'bg-blue-50',
}

export default function NotificationDropdown({ tickets, peminjamName }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const ref = useRef<HTMLDivElement>(null)

  const notifications = generateNotifications(tickets, peminjamName)
    .map(n => (readIds.has(n.id) ? { ...n, isRead: true } : n))
    .sort((a, b) => Number(a.isRead) - Number(b.isRead))

  const unreadCount = notifications.filter(n => !n.isRead).length

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkRead = (id: string) => {
    setReadIds(prev => new Set(prev).add(id))
  }

  const handleMarkAllRead = () => {
    setReadIds(prev => {
      const next = new Set(prev)
      notifications.forEach(n => next.add(n.id))
      return next
    })
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          if (window.innerWidth < 1024) {
            router.push('/notifikasi?role=Peminjam')
          } else {
            setOpen(prev => !prev)
          }
        }}
        className="relative p-2 rounded text-gray-500 hover:bg-gray-100 transition-colors"
        title="Notifikasi"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed right-3 top-16 w-[290px] sm:absolute sm:inset-auto sm:right-0 sm:top-12 sm:w-96 bg-white rounded-2xl border border-gray-100 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-50 border-b border-gray-100">
            <h3 className="text-xs sm:text-sm font-extrabold text-gray-900">Notifikasi Sistem</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] sm:text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Tandai dibaca
              </button>
            )}
          </div>

          <div className="max-h-[280px] sm:max-h-[360px] overflow-y-auto divide-y divide-gray-100">
            {notifications.length === 0 && (
              <div className="p-6 text-center">
                <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">Belum ada notifikasi</p>
              </div>
            )}

            {notifications.map(n => (
              <button
                key={n.id}
                onClick={() => handleMarkRead(n.id)}
                className={`w-full text-left p-3 sm:p-4 flex gap-2.5 sm:gap-3 hover:bg-slate-50/80 transition-all ${!n.isRead ? 'bg-blue-50/30' : ''}`}
              >
                <div className={`shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mt-0.5 ${BG[n.type]}`}>
                  {ICONS[n.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <p className={`text-[11px] sm:text-xs font-bold truncate ${!n.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                      {n.title}
                    </p>
                    {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />}
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-500 leading-relaxed line-clamp-2">{n.message}</p>
                  <p className="text-[9px] sm:text-[10px] font-semibold text-gray-400 mt-1">{n.timestamp}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}