'use server'

import { prisma } from '../../lib/prisma'
import { requireRole } from '../../lib/auth'
import { Role, TicketStatus, AssetStatus } from '../../app/generated/prisma'
import { createNotification } from '../core/notification'

interface CreateTicketInput {
  assetId: string
  jumlah: number
  tanggalPinjam: string
  tanggalKembali: string
  alasan: string
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
      return { 
        success: false, 
        error: `Stok tidak cukup. Sisa stok saat ini: ${asset.quantity} unit.`,
        trueStock: asset.quantity
      }
    }

    // 3. Buat Ticket dan catat log awal
    const todayStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // format: YYMMDD
    const lastTicket = await prisma.ticket.findFirst({ 
      where: { ticketCode: { startsWith: `TK-${todayStr}-` } },
      orderBy: { createdAt: 'desc' } 
    })
    
    let nextNum = 1
    if (lastTicket) {
      const parts = lastTicket.ticketCode.split('-')
      const lastNum = parseInt(parts[2])
      if (!isNaN(lastNum)) nextNum = lastNum + 1
    }
    const ticketCode = `TK-${todayStr}-${String(nextNum).padStart(3, '0')}`

    const ticket = await prisma.ticket.create({
      data: {
        ticketCode,
        peminjamId: user.id,
        assetId: asset.id,
        jumlah: input.jumlah,
        tanggalPinjam: input.tanggalPinjam,
        tanggalKembali: input.tanggalKembali,
        alasan: input.alasan,
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

    // 4. Kurangi stok aset secara langsung (Reservasi)
    const updatedAsset = await prisma.asset.update({
      where: { id: asset.id },
      data: { quantity: { decrement: input.jumlah } }
    })

    // 5. Kirim Notifikasi ke Admin
    await createNotification(
      'Pengajuan Pinjam Baru',
      `${user.name} mengajukan pinjaman ${input.jumlah} unit ${asset.name} (${ticketCode}).`,
      'info',
      'Admin'
    )

    return { success: true, data: ticket, updatedAsset }
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
    if (ticket.overallStatus !== TicketStatus.Menunggu && ticket.overallStatus !== TicketStatus.Disetujui) {
      throw new Error('Tiket yang sudah dipinjam atau selesai tidak dapat dibatalkan.')
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

    // 3. Kembalikan stok yang di-booking
    await prisma.asset.update({
      where: { id: ticket.assetId },
      data: { quantity: { increment: ticket.jumlah } }
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
