'use server'

import { prisma } from '../../lib/prisma'
import { requireRole } from '../../lib/auth'
import { Role, AssetStatus } from '../../app/generated/prisma'
import { createNotification } from './notif'

// ─── READ ─────────────────────────────────────────────────────────────────────

export async function getAllMaintenanceRecords() {
  try {
    const records = await prisma.maintenanceRecord.findMany({
      include: { reporter: true, items: true, photos: true },
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
      include: { reporter: true, items: true, photos: true },
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
      include: { reporter: true, items: true, photos: true },
      orderBy: { updatedAt: 'desc' }
    })
    return { success: true, data: records }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ─── CREATE ────────────────────────────────────────────────────────────────────

export async function createMaintenanceRecord(input: {
  issue: string
  photoUrl?: string // legacy
  photos?: string[]
  items: {
    assetId: string
    assetName: string
    assetCode: string
    isSerialized: boolean
    qty?: number
    serialNumber?: string
    issue?: string
  }[]
}) {
  try {
    const user = await requireRole([Role.Admin, Role.HSSE])
    
    if (!input.items || input.items.length === 0) {
      throw new Error('Minimal 1 barang harus dilaporkan.')
    }

    // Generate record code (ESC-YYMMDD-XXX)
    const todayStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // format: YYMMDD
    const lastRecord = await prisma.maintenanceRecord.findFirst({ 
      where: { recordCode: { startsWith: `ESC-${todayStr}-` } },
      orderBy: { createdAt: 'desc' } 
    })
    
    let nextNum = 1
    if (lastRecord) {
      const parts = lastRecord.recordCode.split('-')
      const lastNum = parseInt(parts[2])
      if (!isNaN(lastNum)) nextNum = lastNum + 1
    }
    const recordCode = `ESC-${todayStr}-${String(nextNum).padStart(3, '0')}`

    // Ubah status aset ke Maintenance
    for (const item of input.items) {
      await prisma.asset.update({
        where: { id: item.assetId },
        data: { status: AssetStatus.Maintenance }
      })
    }

    const today = new Date().toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta'
    })

    const record = await prisma.maintenanceRecord.create({
      data: {
        recordCode,
        issue: input.issue,
        status: 'Menunggu Tindakan',
        reporterId: user.id,
        reporterName: `${user.name} (${user.role})`,
        dateReported: today,
        photoUrl: input.photoUrl,
        items: {
          create: input.items.map(item => ({
            assetId: item.assetId,
            assetName: item.assetName,
            assetCode: item.assetCode,
            isSerialized: item.isSerialized,
            qty: item.qty || 1,
            serialNumber: item.serialNumber,
            issue: item.issue
          }))
        },
        ...(input.photos && input.photos.length > 0 ? {
          photos: {
            create: input.photos.map(p => ({ image: p }))
          }
        } : {})
      },
      include: { items: true, photos: true }
    })

    await createNotification(
      'Laporan Kerusakan Baru',
      `${user.name} melaporkan ${input.items.length} jenis kerusakan. Menunggu tindak lanjut.`,
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
    const record = await prisma.maintenanceRecord.findUnique({ 
      where: { id: recordId },
      include: { items: true }
    })
    if (!record) throw new Error('Record tidak ditemukan.')

    const today = new Date().toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta'
    })

    // Update status aset: jika selesai diperbaiki → Available, jika dimusnahkan → tetap Maintenance
    const newAssetStatus = resolution === 'Selesai Diperbaiki' ? AssetStatus.Available : AssetStatus.Maintenance

    for (const item of record.items) {
      await prisma.asset.update({
        where: { id: item.assetId },
        data: { status: newAssetStatus }
      })
    }

    const updated = await prisma.maintenanceRecord.update({
      where: { id: recordId },
      data: {
        status: resolution,
        resolution,
        dateResolved: today,
        notes
      },
      include: { items: true }
    })

    await createNotification(
      resolution === 'Selesai Diperbaiki' ? 'Aset Kembali Tersedia' : 'Aset Dimusnahkan (Write-off)',
      resolution === 'Selesai Diperbaiki'
        ? `Laporan ${record.recordCode} selesai diperbaiki dan aset kembali ke stok.`
        : `Aset pada laporan ${record.recordCode} telah dimusnahkan dan dihapus dari inventaris aktif.`,
      resolution === 'Selesai Diperbaiki' ? 'success' : 'warning',
      'Semua'
    )

    return { success: true, data: updated }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
