'use server'

import { prisma } from '../../lib/prisma'
import { requireRole } from '../../lib/auth'
import { Role, TicketStatus, AssetStatus } from '../../app/generated/prisma'
import { createNotification } from '../core/notif'

// 1. Admin menyetujui tahap pertama dan meneruskan ke Area Head
export async function verifyTicketByAdmin(ticketId: string, notes?: string) {
  try {
    const user = await requireRole([Role.Admin])
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, include: { asset: true, peminjam: true } })
    if (!ticket) throw new Error('Tiket tidak ditemukan.')
    if (ticket.overallStatus !== TicketStatus.Menunggu) throw new Error('Status tiket tidak valid untuk verifikasi.')

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        currentStage: 'Menunggu Persetujuan Area Head',
        logs: {
          create: {
            stage: 'Admin',
            status: 'Verifikasi stok fisik OK. Menunggu approval Area Head.',
            actor: `${user.name} (Admin)`,
            timestamp: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB',
            notes
          }
        }
      }
    })

    // Kirim notif ke Area Head
    await createNotification(
      'Menunggu Approval Akhir',
      `Tiket ${ticket.ticketCode} (Peminjam: ${ticket.peminjam.name}) telah diverifikasi Admin dan menunggu persetujuan Anda.`,
      'urgent',
      'AreaHead'
    )

    return { success: true, data: updated }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// 2. Admin Verifikasi Serah Terima Barang (Handover Pinjam)
export async function verifyAssetBorrowHandover(ticketId: string) {
  try {
    const user = await requireRole([Role.Admin])
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, include: { asset: true, peminjam: true } })
    if (!ticket) throw new Error('Tiket tidak ditemukan.')
    if (ticket.overallStatus !== TicketStatus.Disetujui) throw new Error('Tiket belum disetujui Area Head.')

    // Update status tiket jadi Dipinjam, update status aset jadi Borrowed
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        overallStatus: TicketStatus.Dipinjam,
        currentStage: 'Dipinjam di Lapangan',
        logs: {
          create: {
            stage: 'Admin',
            status: 'Serah terima aset selesai. Aset dibawa ke lapangan.',
            actor: `${user.name} (Admin)`,
            timestamp: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB'
          }
        }
      }
    })

    await prisma.asset.update({
      where: { id: ticket.assetId },
      data: { status: AssetStatus.Borrowed }
    })

    await createNotification(
      'Aset Diserahkan',
      `Serah terima aset untuk tiket ${ticket.ticketCode} selesai. Aset aktif dipinjam.`,
      'success',
      'Peminjam'
    )

    return { success: true, data: updatedTicket }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// 3. Admin Verifikasi Pengembalian Barang (Return Handover)
export async function verifyAssetReturnHandover(ticketId: string, isNeedingMaintenance: boolean, maintenanceNotes?: string) {
  try {
    const user = await requireRole([Role.Admin])
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, include: { asset: true, peminjam: true } })
    if (!ticket) throw new Error('Tiket tidak ditemukan.')
    if (ticket.overallStatus !== TicketStatus.Dipinjam) throw new Error('Tiket sedang tidak dalam status dipinjam.')

    const finalAssetStatus = isNeedingMaintenance ? AssetStatus.Maintenance : AssetStatus.Available

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        overallStatus: TicketStatus.Dikembalikan,
        currentStage: 'Selesai Dikembalikan',
        logs: {
          create: {
            stage: 'Admin',
            status: `Pengembalian aset diverifikasi. Kondisi akhir: ${finalAssetStatus}.`,
            actor: `${user.name} (Admin)`,
            timestamp: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB',
            notes: maintenanceNotes
          }
        }
      }
    })

    await prisma.asset.update({
      where: { id: ticket.assetId },
      data: { status: finalAssetStatus }
    })

    if (isNeedingMaintenance) {
      await createNotification(
        'Inspeksi HSSE / Maintenance Diperlukan',
        `Aset ${ticket.asset.name} (${ticket.asset.assetCode}) dikembalikan dan dimasukkan ke status Maintenance.`,
        'warning',
        'HSSE'
      )
    }

    return { success: true, data: updatedTicket }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// 4. HSSE & Admin berhak menyetel status Aset menjadi Maintenance / Kalibrasi (TANPA STATUS RUSAK)
export async function setAssetToMaintenance(assetId: string, maintenanceNotes: string) {
  try {
    // RBAC: Admin dan HSSE berhak
    const user = await requireRole([Role.Admin, Role.HSSE])
    const asset = await prisma.asset.findUnique({ where: { id: assetId } })
    if (!asset) throw new Error('Aset tidak ditemukan.')

    const updated = await prisma.asset.update({
      where: { id: assetId },
      data: {
        status: AssetStatus.Maintenance,
        spec: asset.spec ? `${asset.spec} | Catatan Maintenance: ${maintenanceNotes}` : `Catatan Maintenance: ${maintenanceNotes}`
      }
    })

    await createNotification(
      'Status Aset: Pemeliharaan',
      `${user.name} mengubah status ${asset.name} (${asset.assetCode}) menjadi Sedang Maintenance. Catatan: ${maintenanceNotes}`,
      'warning',
      'Semua'
    )

    return { success: true, data: updated }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
