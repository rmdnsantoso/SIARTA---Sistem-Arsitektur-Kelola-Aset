'use server'

import { prisma } from '../../lib/prisma'
import { requireRole } from '../../lib/auth'
import { Role, AssetStatus } from '../../app/generated/prisma'
import { createNotification } from './notif'

// ─── READ ─────────────────────────────────────────────────────────────────────

export async function getAllMaintenanceRecords() {
  try {
    const records = await prisma.maintenanceRecord.findMany({
      include: { reporter: true },
      orderBy: { createdAt: 'desc' }
    })
    return { success: true, data: records }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getActiveMaintenanceRecords() {
  try {
    const records = await prisma.maintenanceRecord.findMany({
      where: { status: 'Menunggu Tindakan' },
      include: { reporter: true },
      orderBy: { createdAt: 'desc' }
    })
    return { success: true, data: records }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getMaintenanceHistory() {
  try {
    const records = await prisma.maintenanceRecord.findMany({
      where: {
        status: { in: ['Selesai Diperbaiki', 'Dimusnahkan'] }
      },
      include: { reporter: true },
      orderBy: { updatedAt: 'desc' }
    })
    return { success: true, data: records }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ─── CREATE ────────────────────────────────────────────────────────────────────

export async function createMaintenanceRecord(input: {
  assetId: string
  issue: string
  serialNumber?: string
  photoUrl?: string
}) {
  try {
    const user = await requireRole([Role.Admin, Role.HSSE])
    const asset = await prisma.asset.findUnique({ where: { id: input.assetId } })
    if (!asset) throw new Error('Aset tidak ditemukan.')

    // Generate record code
    const count = await prisma.maintenanceRecord.count()
    const recordCode = `ESC-${String(count + 1).padStart(3, '0')}`

    // Ubah status aset ke Maintenance
    await prisma.asset.update({
      where: { id: input.assetId },
      data: { status: AssetStatus.Maintenance }
    })

    const today = new Date().toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta'
    })

    const record = await prisma.maintenanceRecord.create({
      data: {
        recordCode,
        assetId: input.assetId,
        assetName: asset.name,
        assetCode: asset.assetCode,
        serialNumber: input.serialNumber,
        issue: input.issue,
        status: 'Menunggu Tindakan',
        reporterId: user.id,
        reporterName: `${user.name} (${user.role})`,
        dateReported: today,
        photoUrl: input.photoUrl,
      }
    })

    await createNotification(
      'Laporan Kerusakan Baru',
      `${user.name} melaporkan kerusakan pada ${asset.name} (${asset.assetCode}). Menunggu tindak lanjut.`,
      'warning',
      'Semua'
    )

    return { success: true, data: record }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ─── UPDATE STATUS (Selesai / Dimusnahkan) ───────────────────────────────────

export async function resolveMaintenanceRecord(
  recordId: string,
  resolution: 'Selesai Diperbaiki' | 'Dimusnahkan',
  notes?: string
) {
  try {
    const user = await requireRole([Role.Admin, Role.HSSE])
    const record = await prisma.maintenanceRecord.findUnique({ where: { id: recordId } })
    if (!record) throw new Error('Record tidak ditemukan.')

    const today = new Date().toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta'
    })

    // Update status aset: jika selesai diperbaiki → Available, jika dimusnahkan → tetap Maintenance
    const newAssetStatus = resolution === 'Selesai Diperbaiki' ? AssetStatus.Available : AssetStatus.Maintenance

    await prisma.asset.update({
      where: { id: record.assetId },
      data: { status: newAssetStatus }
    })

    const updated = await prisma.maintenanceRecord.update({
      where: { id: recordId },
      data: {
        status: resolution,
        resolution,
        dateResolved: today,
        notes
      }
    })

    await createNotification(
      resolution === 'Selesai Diperbaiki' ? 'Aset Kembali Tersedia' : 'Aset Dimusnahkan (Write-off)',
      resolution === 'Selesai Diperbaiki'
        ? `${record.assetName} (${record.assetCode}) selesai diperbaiki dan kembali ke stok.`
        : `${record.assetName} (${record.assetCode}) telah dimusnahkan dan dihapus dari inventaris aktif.`,
      resolution === 'Selesai Diperbaiki' ? 'success' : 'warning',
      'Semua'
    )

    return { success: true, data: updated }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
