'use server'

import { prisma } from '../../lib/prisma'
import { requireRole } from '../../lib/auth'
import { Role, TicketStatus } from '../../app/generated/prisma'
import { createNotification } from '../core/notif'

// Tipe lengkap tiket dengan relasi (dipakai sebagai return type)
export type TicketWithRelations = Awaited<ReturnType<typeof getAllTickets>>[number]

// Ambil SEMUA tiket beserta relasi (untuk Admin)
export async function getAllTickets() {
  return await prisma.ticket.findMany({
    include: {
      peminjam: true,
      asset: true,
      logs: { orderBy: { createdAt: 'asc' } }
    },
    orderBy: { createdAt: 'desc' }
  })
}

// Ambil tiket yang relevan untuk tahap HSSE (menunggu verifikasi HSSE)
export async function getTicketsForHSSE() {
  return await prisma.ticket.findMany({
    where: {
      OR: [
        // Tiket yang sedang menunggu verifikasi HSSE
        { currentStage: 'Menunggu Verifikasi HSSE' },
        // Tiket yang sudah lewat HSSE (untuk riwayat)
        {
          overallStatus: { in: [TicketStatus.Disetujui, TicketStatus.Dipinjam, TicketStatus.Dikembalikan, TicketStatus.Ditolak] }
        }
      ]
    },
    include: {
      peminjam: true,
      asset: true,
      logs: { orderBy: { createdAt: 'asc' } }
    },
    orderBy: { createdAt: 'desc' }
  })
}

// Ambil tiket yang relevan untuk Area Head (menunggu approval Area Head)
export async function getTicketsForAreaHead() {
  return await prisma.ticket.findMany({
    where: {
      OR: [
        // Tiket yang sedang menunggu persetujuan Area Head
        { currentStage: 'Menunggu Persetujuan Area Head' },
        // Tiket yang sudah disetujui/ditolak Area Head (untuk riwayat)
        {
          overallStatus: { in: [TicketStatus.Disetujui, TicketStatus.Dipinjam, TicketStatus.Dikembalikan, TicketStatus.Ditolak] }
        }
      ]
    },
    include: {
      peminjam: true,
      asset: true,
      logs: { orderBy: { createdAt: 'asc' } }
    },
    orderBy: { createdAt: 'desc' }
  })
}

// Ambil tiket milik peminjam tertentu (by userId)
export async function getTicketsByUser(userId: string) {
  return await prisma.ticket.findMany({
    where: { peminjamId: userId },
    include: {
      peminjam: true,
      asset: true,
      logs: { orderBy: { createdAt: 'asc' } }
    },
    orderBy: { createdAt: 'desc' }
  })
}
