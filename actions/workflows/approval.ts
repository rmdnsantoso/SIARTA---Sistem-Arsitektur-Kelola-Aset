'use server'

import { prisma } from '../../lib/prisma'
import { requireRole } from '../../lib/auth'
import { Role, TicketStatus } from '../../app/generated/prisma'
import { createNotification } from '../core/notification'

// 1. Area Head melakukan approval akhir
export async function approveTicketByAreaHead(ticketId: string, notes?: string) {
  try {
    const user = await requireRole([Role.AreaHead])
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, include: { asset: true, peminjam: true } })
    if (!ticket) throw new Error('Tiket tidak ditemukan.')
    if (ticket.currentStage !== 'Menunggu Persetujuan Area Head') throw new Error('Tiket tidak berada di tahap Area Head.')
    if (ticket.overallStatus !== TicketStatus.Menunggu) throw new Error('Tiket tidak dalam status menunggu.')

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        overallStatus: TicketStatus.Disetujui,
        currentStage: 'Menunggu Pengambilan di Gudang',
        logs: {
          create: {
            stage: 'Area Head',
            status: 'Pengajuan disetujui penuh oleh Area Head. Siap diambil.',
            actor: `${user.name} (Area Head)`,
            timestamp: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB',
            notes
          }
        }
      }
    })

    await createNotification(
      'Pengajuan Disetujui!',
      `Tiket ${ticket.ticketCode} (${ticket.asset.name}) telah disetujui oleh ${user.name} (Area Head). Ambil di Gudang Utama.`,
      'success',
      'Semua',
      ticket.peminjamId
    )

    return { success: true, data: updated }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// 2. Area Head menolak pengajuan
export async function rejectTicketByAreaHead(ticketId: string, rejectReason: string) {
  try {
    const user = await requireRole([Role.AreaHead])
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, include: { asset: true, peminjam: true } })
    if (!ticket) throw new Error('Tiket tidak ditemukan.')
    if (ticket.currentStage !== 'Menunggu Persetujuan Area Head') throw new Error('Tiket tidak berada di tahap Area Head.')
    if (ticket.overallStatus !== TicketStatus.Menunggu) throw new Error('Tiket tidak dalam status menunggu.')

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        overallStatus: TicketStatus.Ditolak,
        currentStage: 'Ditolak oleh Area Head',
        logs: {
          create: {
            stage: 'Area Head',
            status: 'Ditolak oleh Area Head',
            actor: `${user.name} (Area Head)`,
            timestamp: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB',
            notes: rejectReason
          }
        }
      }
    })

    // Kembalikan stok yang di-booking
    await prisma.asset.update({
      where: { id: ticket.assetId },
      data: { quantity: { increment: ticket.jumlah } }
    })

    await createNotification(
      'Pengajuan Ditolak',
      `Tiket ${ticket.ticketCode} ditolak oleh ${user.name} (Area Head). Alasan: ${rejectReason}`,
      'urgent',
      'Semua',
      ticket.peminjamId
    )

    return { success: true, data: updated }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
