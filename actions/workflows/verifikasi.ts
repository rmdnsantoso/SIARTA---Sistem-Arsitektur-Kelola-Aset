'use server'

import { prisma } from '../../lib/prisma'
import { requireRole } from '../../lib/auth'
import { Role, TicketStatus, AssetStatus } from '../../app/generated/prisma'
import { createNotification } from '../core/notification'

// 1. Admin menyetujui tahap pertama dan meneruskan ke HSSE (bukan langsung Area Head)
export async function verifyTicketByAdmin(ticketId: string, notes?: string, allocatedSerials?: string[]) {
  try {
    const user = await requireRole([Role.Admin])
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, include: { asset: true, peminjam: true } })
    if (!ticket) throw new Error('Tiket tidak ditemukan.')
    if (ticket.overallStatus !== TicketStatus.Menunggu) throw new Error('Status tiket tidak valid untuk verifikasi.')
    if (ticket.currentStage !== 'Menunggu Persetujuan Admin') throw new Error('Tiket tidak berada di tahap Admin.')

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        currentStage: 'Menunggu Verifikasi HSSE',
        allocatedUnits: allocatedSerials && allocatedSerials.length > 0 ? JSON.stringify(allocatedSerials) : null,
        logs: {
          create: {
            stage: 'Admin',
            status: 'Verifikasi stok fisik OK. Meneruskan ke HSSE.',
            actor: `${user.name} (Admin)`,
            timestamp: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB',
            notes
          }
        }
      }
    })

    // Kirim notif ke HSSE
    await createNotification(
      'Verifikasi Diperlukan',
      `Tiket ${ticket.ticketCode} (Peminjam: ${ticket.peminjam.name}) memerlukan verifikasi HSSE sebelum dipinjamkan.`,
      'urgent',
      'HSSE'
    )

    return { success: true, data: updated }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// 2. HSSE menyetujui dan meneruskan ke Area Head
export async function approveTicketByHSSE(ticketId: string, notes?: string) {
  try {
    const user = await requireRole([Role.HSSE])
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, include: { asset: true, peminjam: true } })
    if (!ticket) throw new Error('Tiket tidak ditemukan.')
    if (ticket.currentStage !== 'Menunggu Verifikasi HSSE') throw new Error('Tiket tidak berada di tahap HSSE.')

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        currentStage: 'Menunggu Persetujuan Area Head',
        logs: {
          create: {
            stage: 'HSSE',
            status: 'Verifikasi OK. Meneruskan ke Area Head.',
            actor: `${user.name} (HSSE)`,
            timestamp: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB',
            notes
          }
        }
      }
    })

    // Kirim notif ke Area Head
    await createNotification(
      'Menunggu Approval Akhir',
      `Tiket ${ticket.ticketCode} (Peminjam: ${ticket.peminjam.name}) telah diverifikasi HSSE dan menunggu persetujuan Anda.`,
      'urgent',
      'AreaHead'
    )

    return { success: true, data: updated }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// 3. HSSE menolak pengajuan
export async function rejectTicketByHSSE(ticketId: string, rejectReason: string) {
  try {
    const user = await requireRole([Role.HSSE])
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, include: { asset: true, peminjam: true } })
    if (!ticket) throw new Error('Tiket tidak ditemukan.')
    if (ticket.currentStage !== 'Menunggu Verifikasi HSSE') throw new Error('Tiket tidak berada di tahap HSSE.')

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        overallStatus: TicketStatus.Ditolak,
        currentStage: 'Ditolak oleh HSSE',
        logs: {
          create: {
            stage: 'HSSE',
            status: 'Ditolak oleh HSSE',
            actor: `${user.name} (HSSE)`,
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
      'Pengajuan Ditolak oleh HSSE',
      `Tiket ${ticket.ticketCode} ditolak oleh HSSE. Alasan: ${rejectReason}`,
      'urgent',
      'Semua',
      ticket.peminjamId
    )

    return { success: true, data: updated }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// 4. Admin Verifikasi Serah Terima Barang (Handover Pinjam)
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

    // Cek sisa stok. Jika 0, ubah status jadi Borrowed
    const currentAsset = await prisma.asset.findUnique({ where: { id: ticket.assetId } })
    if (currentAsset && currentAsset.quantity === 0) {
      await prisma.asset.update({
        where: { id: ticket.assetId },
        data: { status: AssetStatus.Borrowed }
      })
    }

    if (ticket.allocatedUnits) {
      const serials: string[] = JSON.parse(ticket.allocatedUnits)
      for (const sn of serials) {
        await prisma.physicalUnit.updateMany({
          where: { assetId: ticket.assetId, OR: [{ serialNumber: sn }, { unitId: sn }] },
          data: { status: 'Dipinjam' }
        })
        const units = await prisma.physicalUnit.findMany({ where: { assetId: ticket.assetId, OR: [{ serialNumber: sn }, { unitId: sn }] } })
        for (const u of units) {
          await prisma.unitHistory.create({
            data: {
              unitId: u.id,
              action: `Dipinjam oleh ${ticket.peminjam.name}. Alasan: ${ticket.alasan}`,
              actor: `${user.name} (Admin)`,
              timestamp: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB'
            }
          })
        }
      }
    }

    await createNotification(
      'Aset Diserahkan',
      `Serah terima aset untuk tiket ${ticket.ticketCode} selesai. Aset aktif dipinjam.`,
      'success',
      'Semua',
      ticket.peminjamId
    )

    return { success: true, data: updatedTicket }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// 5. Admin Verifikasi Pengembalian Barang (Return Handover)
export async function verifyAssetReturnHandover(ticketId: string, isNeedingMaintenance: boolean, maintenanceNotes?: string) {
  try {
    const user = await requireRole([Role.Admin])
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, include: { asset: true, peminjam: true } })
    if (!ticket) throw new Error('Tiket tidak ditemukan.')
    if (ticket.overallStatus !== TicketStatus.Dipinjam) throw new Error('Tiket sedang tidak dalam status dipinjam.')

    const finalAssetStatus = isNeedingMaintenance ? (ticket.asset.isSerialized ? AssetStatus.Maintenance : undefined) : AssetStatus.Available

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

    const assetUpdateData: any = {}
    if (!isNeedingMaintenance) {
      assetUpdateData.quantity = { increment: ticket.jumlah }
      assetUpdateData.status = AssetStatus.Available
    } else if (finalAssetStatus) {
      assetUpdateData.status = finalAssetStatus
    }

    if (Object.keys(assetUpdateData).length > 0) {
      await prisma.asset.update({
        where: { id: ticket.assetId },
        data: assetUpdateData
      })
    }

    if (ticket.allocatedUnits) {
      const serials: string[] = JSON.parse(ticket.allocatedUnits)
      for (const sn of serials) {
        const unitStatus = isNeedingMaintenance ? 'Maintenance' : 'Tersedia'
        await prisma.physicalUnit.updateMany({
          where: { assetId: ticket.assetId, OR: [{ serialNumber: sn }, { unitId: sn }] },
          data: { status: unitStatus }
        })
        const units = await prisma.physicalUnit.findMany({ where: { assetId: ticket.assetId, OR: [{ serialNumber: sn }, { unitId: sn }] } })
        for (const u of units) {
          await prisma.unitHistory.create({
            data: {
              unitId: u.id,
              action: `Dikembalikan. Status: ${unitStatus}`,
              actor: `${user.name} (Admin)`,
              timestamp: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB'
            }
          })
        }
      }
    }

    if (isNeedingMaintenance) {
      // Buat record maintenance baru agar terdeteksi di board AssetMaintenance
      const lastRecord = await prisma.maintenanceRecord.findFirst({ orderBy: { createdAt: 'desc' } })
      let nextNum = 1
      if (lastRecord && lastRecord.recordCode.startsWith('ESC-')) {
        const parts = lastRecord.recordCode.split('-')
        const lastNum = parseInt(parts[1])
        if (!isNaN(lastNum)) nextNum = lastNum + 1
      }
      const recordCode = `ESC-${String(nextNum).padStart(3, '0')}`
      const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' })
      
      await prisma.maintenanceRecord.create({
        data: {
          recordCode,
          issue: maintenanceNotes || 'Dilaporkan rusak saat pengembalian',
          status: 'Menunggu Tindakan',
          reporterId: user.id,
          reporterName: `${user.name} (Admin)`,
          dateReported: today,
          items: {
            create: [{
              assetId: ticket.assetId,
              assetName: ticket.asset.name,
              assetCode: ticket.asset.assetCode,
              isSerialized: ticket.asset.isSerialized,
              qty: 1
            }]
          }
        }
      })

      await createNotification(
        'Inspeksi HSSE / Maintenance Diperlukan',
        `Aset ${ticket.asset.name} (${ticket.asset.assetCode}) dikembalikan dan dimasukkan ke status Maintenance.`,
        'warning',
        'HSSE'
      )
    }

    await createNotification(
      'Aset Dikembalikan',
      `Pengembalian aset tiket ${ticket.ticketCode} selesai. Tidak ada masalah.`,
      'success',
      'Semua',
      ticket.peminjamId
    )

    return { success: true, data: updatedTicket }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// 6. HSSE & Admin berhak menyetel status Aset menjadi Maintenance / Kalibrasi (TANPA STATUS RUSAK)
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

// 7. Admin menolak pengajuan tiket
export async function rejectTicketByAdmin(ticketId: string, rejectReason: string) {
  try {
    const user = await requireRole([Role.Admin])
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, include: { asset: true, peminjam: true } })
    if (!ticket) throw new Error('Tiket tidak ditemukan.')
    if (ticket.overallStatus !== TicketStatus.Menunggu) throw new Error('Status tiket tidak valid untuk penolakan.')
    if (ticket.currentStage !== 'Menunggu Persetujuan Admin') throw new Error('Tiket tidak berada di tahap Admin.')

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        overallStatus: TicketStatus.Ditolak,
        currentStage: 'Ditolak oleh Admin',
        logs: {
          create: {
            stage: 'Admin',
            status: 'Ditolak oleh Admin',
            actor: `${user.name} (Admin)`,
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
      'Tiket Ditolak Admin',
      `Tiket ${ticket.ticketCode} ditolak. Alasan: ${rejectReason}`,
      'urgent',
      'Semua',
      ticket.peminjamId
    )

    return { success: true, data: updated }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
