'use server'

import { prisma } from '../../lib/prisma'
import { requireRole } from '../../lib/auth'
import { Role, TicketStatus, AssetStatus } from '../../app/generated/prisma'
import { createNotification } from '../core/notification'
import { appEvents } from '../../lib/events'
import { parseIndonesianDate } from '../../lib/dateUtils'

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

    // 2. Validasi input dasar
    if (!input.assetId?.trim()) throw new Error('ID aset tidak valid.')
    if (!input.alasan?.trim()) throw new Error('Alasan peminjaman wajib diisi.')
    if (typeof input.jumlah !== 'number' || input.jumlah < 1) throw new Error('Jumlah peminjaman harus minimal 1.')

    // Validasi tanggal menggunakan parser Indonesian date karena format di sistem adalah "18 Jun 2026"
    const tglPinjam = parseIndonesianDate(input.tanggalPinjam)
    const tglKembali = parseIndonesianDate(input.tanggalKembali)
    if (!tglPinjam) throw new Error('Format tanggal pinjam tidak valid.')
    if (!tglKembali) throw new Error('Format tanggal kembali tidak valid.')
    if (tglKembali <= tglPinjam) throw new Error('Tanggal kembali harus setelah tanggal pinjam.')

    // 3. Cek validitas aset dan status ketersediaannya (harus Available)
    const asset = await prisma.asset.findUnique({ where: { id: input.assetId } })
    if (!asset) throw new Error('Aset tidak ditemukan di database.')
    if (asset.status !== AssetStatus.Available) {
      throw new Error(`Aset saat ini tidak dapat dipinjam (Status: ${asset.status})`)
    }

    // Pre-check stok (soft check untuk UX cepat — sebelum buat tiket)
    // Atomic check di bawah masih ada sebagai safety net untuk race condition
    if (asset.quantity < input.jumlah) {
      return {
        success: false,
        error: `Stok tidak cukup. Sisa stok tersedia: ${asset.quantity} unit.`,
        trueStock: asset.quantity
      }
    }

    // 4. Buat Ticket dan catat log awal
    const todayStr = new Date().toISOString().slice(2, 10).replace(/-/g, '') // format: YYMMDD
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

    // 5. Kurangi stok secara ATOMIK — cegah race condition
    // updateMany dengan WHERE quantity >= jumlah: jika stok tidak cukup, count = 0
    const stockUpdate = await prisma.asset.updateMany({
      where: { id: asset.id, quantity: { gte: input.jumlah } },
      data: { quantity: { decrement: input.jumlah } }
    })

    if (stockUpdate.count === 0) {
      // Rollback: hapus tiket yang baru dibuat karena stok berubah di antara pre-check dan atomic update
      await prisma.ticket.delete({ where: { id: ticket.id } }).catch(() => {})
      // Ambil stok aktual terbaru untuk koreksi UI
      const freshAsset = await prisma.asset.findUnique({ 
        where: { id: asset.id },
        select: { quantity: true }
      })
      return { 
        success: false, 
        error: `Stok habis diambil pengguna lain. Silakan coba lagi.`,
        trueStock: freshAsset?.quantity ?? 0
      }
    }

    // Ambil stok terbaru setelah update
    const updatedAsset = await prisma.asset.findUnique({ where: { id: asset.id } })

    // 6. Kirim Notifikasi ke Admin
    await createNotification(
      'Pengajuan Pinjam Baru',
      `${user.name} mengajukan pinjaman ${input.jumlah} unit ${asset.name} (${ticketCode}).`,
      'info',
      'Admin'
    )

    appEvents.emit('ticket_updated', { ticketId: ticket.id, status: ticket.overallStatus })
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
    const updatedAsset = await prisma.asset.update({
      where: { id: ticket.assetId },
      data: { quantity: { increment: ticket.jumlah } }
    })

    appEvents.emit('ticket_updated', { ticketId: updatedTicket.id, status: updatedTicket.overallStatus })
    return { success: true, data: updatedTicket, updatedAsset }
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
