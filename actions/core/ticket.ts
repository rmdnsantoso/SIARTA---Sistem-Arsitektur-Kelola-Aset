'use server'

import { prisma } from '../../lib/prisma'

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

// Ambil tiket yang relevan untuk tahap HSSE
export async function getTicketsForHSSE() {
  return await prisma.ticket.findMany({
    include: {
      peminjam: true,
      asset: true,
      logs: { orderBy: { createdAt: 'asc' } }
    },
    orderBy: { createdAt: 'desc' }
  })
}

// Ambil tiket yang relevan untuk Area Head
export async function getTicketsForAreaHead() {
  return await prisma.ticket.findMany({
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
