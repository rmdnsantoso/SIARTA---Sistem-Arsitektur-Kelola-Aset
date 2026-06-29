'use server'

import { prisma } from '../../lib/prisma'
import { requireRole } from '../../lib/auth'
import { Role, TicketStatus, AssetStatus } from '../../app/generated/prisma'
import { createNotification } from '../core/notif'

interface CreateTicketInput {
  assetId: string
  jumlah: number
  tanggalPinjam: string
  tanggalKembali: string
  lokasi: string
  notes?: string
}

export async function createBorrowTicket(input: CreateTicketInput) {
  try {
    // 1. RBAC Check: Hanya Peminjam yang bisa mengajukan tiket
    const user = await requireRole([Role.Peminjam])

    // 2. Cek validitas aset dan status ketersediaannya (harus Available)
    const asset = await prisma.asset.findUnique({ where: { id: input.assetId } })
    if (!asset) throw new Error('Aset tidak ditemukan di database.')
    if (asset.status !== AssetStatus.Available) {
      throw new Error(`Aset saat ini tidak dapat dipinjam (Status: ${asset.status})`)
    }

    if (input.jumlah > asset.quantity) {
      throw new Error(`Jumlah pinjaman (${input.jumlah}) melebihi stok yang tersedia (${asset.quantity}).`)
    }

    // 3. Buat Ticket dan catat log awal
    const ticketCount = await prisma.ticket.count()
    const ticketCode = `TK-${String(ticketCount + 1).padStart(3, '0')}`

    const ticket = await prisma.ticket.create({
      data: {
        ticketCode,
        peminjamId: user.id,
        assetId: asset.id,
        jumlah: input.jumlah,
        tanggalPinjam: input.tanggalPinjam,
        tanggalKembali: input.tanggalKembali,
        lokasi: input.lokasi,
        overallStatus: TicketStatus.Menunggu,
        currentStage: 'Menunggu Persetujuan Admin',
        notes: input.notes,
        logs: {
          create: {
            stage: 'Peminjam',
            status: 'Pengajuan pinjaman dibuat dan dikirim ke Admin.',
            actor: `${user.name} (Peminjam)`,
            timestamp: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB',
            notes: input.notes
          }
        }
      }
    })

    // 4. Kirim Notifikasi ke Admin
    await createNotification(
      'Pengajuan Pinjam Baru',
      `${user.name} mengajukan pinjaman ${input.jumlah} unit ${asset.name} (${ticketCode}).`,
      'info',
      'Admin'
    )

    return { success: true, data: ticket }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function cancelBorrowTicket(ticketId: string) {
  try {
    // 1. RBAC Check
    const user = await requireRole([Role.Peminjam])

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
    if (!ticket) throw new Error('Tiket tidak ditemukan.')
    if (ticket.peminjamId !== user.id) throw new Error('Anda tidak berhak membatalkan tiket orang lain.')
    if (ticket.overallStatus !== TicketStatus.Menunggu) {
      throw new Error('Tiket yang sudah diproses tidak dapat dibatalkan.')
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        overallStatus: TicketStatus.Ditolak, // Batal/Ditolak
        currentStage: 'Dibatalkan oleh Peminjam',
        logs: {
          create: {
            stage: 'Peminjam',
            status: 'Pengajuan dibatalkan secara mandiri oleh Peminjam.',
            actor: `${user.name} (Peminjam)`,
            timestamp: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB'
          }
        }
      }
    })

    return { success: true, data: updatedTicket }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getMyBorrowHistory() {
  try {
    const user = await requireRole([Role.Peminjam])
    const tickets = await prisma.ticket.findMany({
      where: { peminjamId: user.id },
      include: { asset: true, logs: true },
      orderBy: { createdAt: 'desc' }
    })
    return { success: true, data: tickets }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
