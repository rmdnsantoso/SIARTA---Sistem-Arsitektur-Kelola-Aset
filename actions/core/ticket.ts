'use server'

import { prisma } from '../../lib/prisma'
import { requireRole } from '../../lib/auth'
import { Role, TicketStatus } from '../../app/generated/prisma'
import { createNotification } from '../core/notification'

import { Prisma } from '../../app/generated/prisma'

// Tipe lengkap tiket dengan relasi (dipakai sebagai return type)
export type TicketWithRelations = Prisma.TicketGetPayload<{
  include: {
    peminjam: {
      select: { id: true, name: true, email: true, nip: true, wa: true, office: true, jabatan: true, role: true }
    },
    asset: true,
    logs: true
  }
}>

// ─── Helper filter tanggal (default 6 bulan) ──────────────────────────────
function getDateFilter(startDate?: string, endDate?: string) {
  const defaultStart = new Date()
  defaultStart.setMonth(defaultStart.getMonth() - 6)

  return {
    createdAt: {
      gte: startDate ? new Date(startDate) : defaultStart,
      ...(endDate ? { lte: new Date(endDate) } : {})
    }
  }
}

// Ambil SEMUA tiket beserta relasi (untuk Admin)
export async function getAllTickets(page = 1, pageSize = 20, startDate?: string, endDate?: string, searchQuery?: string, statusFilter?: string) {
  await requireRole([Role.Admin])
  const where: Prisma.TicketWhereInput = {
    ...getDateFilter(startDate, endDate),
    ...(statusFilter && statusFilter !== 'Semua' ? { overallStatus: statusFilter as TicketStatus } : {}),
    ...(searchQuery ? {
      OR: [
        { ticketCode: { contains: searchQuery, mode: 'insensitive' } },
        { peminjam: { name: { contains: searchQuery, mode: 'insensitive' } } },
        { asset: { name: { contains: searchQuery, mode: 'insensitive' } } }
      ]
    } : {})
  }

  const [data, total, groups] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        peminjam: { select: { id: true, name: true, email: true, nip: true, wa: true, office: true, jabatan: true, role: true } },
        asset: true,
        logs: { orderBy: { createdAt: 'asc' } }
      },
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip: (page - 1) * pageSize
    }),
    prisma.ticket.count({ where }),
    prisma.ticket.groupBy({
      by: ['overallStatus'],
      _count: true,
      where
    })
  ])

  const stats = {
    totalMenunggu: groups.find(g => g.overallStatus === 'Menunggu')?._count || 0,
    totalDisetujui: groups.find(g => g.overallStatus === 'Disetujui')?._count || 0,
    totalDipinjam: groups.find(g => g.overallStatus === 'Dipinjam')?._count || 0,
    totalDitolak: groups.find(g => g.overallStatus === 'Ditolak')?._count || 0,
    totalSelesai: (groups.find(g => g.overallStatus === 'Selesai')?._count || 0) + (groups.find(g => g.overallStatus === 'Dikembalikan')?._count || 0)
  }

  return { data, total, totalPages: Math.ceil(total / pageSize), stats }
}

// Ambil tiket yang relevan untuk tahap HSSE (menunggu verifikasi HSSE)
export async function getTicketsForHSSE(page = 1, pageSize = 20, startDate?: string, endDate?: string, searchQuery?: string, statusFilter?: string) {
  await requireRole([Role.Admin, Role.HSSE])
  const where: Prisma.TicketWhereInput = {
    ...getDateFilter(startDate, endDate),
    OR: [
      { currentStage: 'Menunggu Verifikasi HSSE' },
      { logs: { some: { stage: 'HSSE' } } }
    ],
    ...(statusFilter && statusFilter !== 'Semua' ? { overallStatus: statusFilter as TicketStatus } : {}),
    ...(searchQuery ? {
      AND: [
        {
          OR: [
            { ticketCode: { contains: searchQuery, mode: 'insensitive' } },
            { peminjam: { name: { contains: searchQuery, mode: 'insensitive' } } },
            { asset: { name: { contains: searchQuery, mode: 'insensitive' } } }
          ]
        }
      ]
    } : {})
  }

  const [data, total, groups] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        peminjam: { select: { id: true, name: true, email: true, nip: true, wa: true, office: true, jabatan: true, role: true } },
        asset: true,
        logs: { orderBy: { createdAt: 'asc' } }
      },
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip: (page - 1) * pageSize
    }),
    prisma.ticket.count({ where }),
    prisma.ticket.groupBy({
      by: ['overallStatus'],
      _count: true,
      where
    })
  ])

  const stats = {
    totalMenunggu: groups.find(g => g.overallStatus === 'Menunggu')?._count || 0,
    totalDisetujui: groups.find(g => g.overallStatus === 'Disetujui')?._count || 0,
    totalDipinjam: groups.find(g => g.overallStatus === 'Dipinjam')?._count || 0,
    totalDitolak: groups.find(g => g.overallStatus === 'Ditolak')?._count || 0,
    totalSelesai: (groups.find(g => g.overallStatus === 'Selesai')?._count || 0) + (groups.find(g => g.overallStatus === 'Dikembalikan')?._count || 0)
  }

  return { data, total, totalPages: Math.ceil(total / pageSize), stats }
}

// Ambil tiket yang relevan untuk Area Head (menunggu approval Area Head)
export async function getTicketsForAreaHead(page = 1, pageSize = 20, startDate?: string, endDate?: string, searchQuery?: string, statusFilter?: string) {
  await requireRole([Role.Admin, Role.AreaHead])
  const where: Prisma.TicketWhereInput = {
    ...getDateFilter(startDate, endDate),
    OR: [
      { currentStage: 'Menunggu Persetujuan Area Head' },
      { logs: { some: { stage: 'Area Head' } } }
    ],
    ...(statusFilter && statusFilter !== 'Semua' ? { overallStatus: statusFilter as TicketStatus } : {}),
    ...(searchQuery ? {
      AND: [
        {
          OR: [
            { ticketCode: { contains: searchQuery, mode: 'insensitive' } },
            { peminjam: { name: { contains: searchQuery, mode: 'insensitive' } } },
            { asset: { name: { contains: searchQuery, mode: 'insensitive' } } }
          ]
        }
      ]
    } : {})
  }

  const [data, total, groups] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        peminjam: { select: { id: true, name: true, email: true, nip: true, wa: true, office: true, jabatan: true, role: true } },
        asset: true,
        logs: { orderBy: { createdAt: 'asc' } }
      },
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip: (page - 1) * pageSize
    }),
    prisma.ticket.count({ where }),
    prisma.ticket.groupBy({
      by: ['overallStatus'],
      _count: true,
      where
    })
  ])

  const stats = {
    totalMenunggu: groups.find(g => g.overallStatus === 'Menunggu')?._count || 0,
    totalDisetujui: groups.find(g => g.overallStatus === 'Disetujui')?._count || 0,
    totalDipinjam: groups.find(g => g.overallStatus === 'Dipinjam')?._count || 0,
    totalDitolak: groups.find(g => g.overallStatus === 'Ditolak')?._count || 0,
    totalSelesai: (groups.find(g => g.overallStatus === 'Selesai')?._count || 0) + (groups.find(g => g.overallStatus === 'Dikembalikan')?._count || 0)
  }

  return { data, total, totalPages: Math.ceil(total / pageSize), stats }
}

// Ambil tiket aktif milik peminjam tertentu (untuk dashboard / Tiket Saya)
export async function getActiveTicketsByUser(userId: string) {
  const user = await requireRole([Role.Admin, Role.HSSE, Role.AreaHead, Role.Peminjam])
  if (user.role !== Role.Admin && user.id !== userId) throw new Error('Unauthorized')
  return await prisma.ticket.findMany({
    where: { 
      peminjamId: userId,
      overallStatus: { in: ['Menunggu', 'Disetujui', 'Dipinjam'] }
    },
    include: {
      peminjam: { select: { id: true, name: true, email: true, nip: true, wa: true, office: true, jabatan: true, role: true } },
      asset: true,
      logs: { orderBy: { createdAt: 'asc' } }
    },
    orderBy: { createdAt: 'desc' }
  })
}

// Ambil riwayat tiket milik peminjam tertentu (by userId) dengan paginasi
export async function getHistoryTicketsByUser(userId: string, page = 1, pageSize = 20, startDate?: string, endDate?: string, searchQuery?: string, statusFilter?: string) {
  const user = await requireRole([Role.Admin, Role.HSSE, Role.AreaHead, Role.Peminjam])
  if (user.role !== Role.Admin && user.id !== userId) throw new Error('Unauthorized')
  const where: Prisma.TicketWhereInput = {
    peminjamId: userId,
    overallStatus: { in: ['Dikembalikan', 'Ditolak', 'Selesai'] },
    ...getDateFilter(startDate, endDate),
    ...(statusFilter && statusFilter !== 'Semua' ? { overallStatus: statusFilter as TicketStatus } : {}),
    ...(searchQuery ? {
      OR: [
        { ticketCode: { contains: searchQuery, mode: 'insensitive' } },
        { asset: { name: { contains: searchQuery, mode: 'insensitive' } } }
      ]
    } : {})
  }

  const [data, total, totalSelesai, totalDitolak] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        peminjam: { select: { id: true, name: true, email: true, nip: true, wa: true, office: true, jabatan: true, role: true } },
        asset: true,
        logs: { orderBy: { createdAt: 'asc' } }
      },
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip: (page - 1) * pageSize
    }),
    prisma.ticket.count({ where }),
    prisma.ticket.count({ where: { ...where, overallStatus: { in: ['Selesai', 'Dikembalikan'] } } }),
    prisma.ticket.count({ where: { ...where, overallStatus: 'Ditolak' } })
  ])

  return { data, total, totalPages: Math.ceil(total / pageSize), totalSelesai, totalDitolak }
}
