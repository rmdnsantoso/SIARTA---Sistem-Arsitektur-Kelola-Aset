'use server'

import { prisma } from '../../lib/prisma'
import { requireRole } from '../../lib/auth'
import { AssetStatus, Role } from '../../app/generated/prisma'

// ============================================================
// READ
// ============================================================

export async function getAvailableAssets() {
  try {
    const assets = await prisma.asset.findMany({
      where: { status: AssetStatus.Available },
      orderBy: { name: 'asc' }
    })
    return { success: true, data: assets }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getAssetById(id: string) {
  try {
    const asset = await prisma.asset.findUnique({ where: { id } })
    if (!asset) throw new Error('Aset tidak ditemukan')
    return { success: true, data: asset }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getAllAssetsForAdmin() {
  try {
    const assets = await prisma.asset.findMany({ orderBy: { createdAt: 'desc' } })
    return { success: true, data: assets }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ============================================================
// CREATE
// ============================================================

export async function createAsset(input: {
  assetCode: string
  name: string
  category: string
  isSerialized: boolean
  location: string
  quantity: number
  spec?: string
  status?: AssetStatus
}) {
  try {
    await requireRole([Role.Admin])
    const existing = await prisma.asset.findUnique({ where: { assetCode: input.assetCode } })
    if (existing) throw new Error(`Kode aset ${input.assetCode} sudah digunakan.`)
    const asset = await prisma.asset.create({
      data: { ...input, status: input.status ?? AssetStatus.Available }
    })
    return { success: true, data: asset }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ============================================================
// UPDATE
// ============================================================

export async function updateAsset(id: string, input: {
  name?: string
  category?: string
  location?: string
  quantity?: number
  spec?: string
  isSerialized?: boolean
}) {
  try {
    await requireRole([Role.Admin])
    const asset = await prisma.asset.update({ where: { id }, data: input })
    return { success: true, data: asset }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ============================================================
// UPDATE STATUS (Admin & HSSE)
// ============================================================

export async function updateAssetStatus(id: string, status: AssetStatus) {
  try {
    await requireRole([Role.Admin, Role.HSSE])
    const asset = await prisma.asset.findUnique({ where: { id } })
    if (!asset) throw new Error('Aset tidak ditemukan.')

    // Tidak boleh ubah status aset yang sedang dipinjam ke Available secara langsung
    if (asset.status === AssetStatus.Borrowed && status === AssetStatus.Available) {
      throw new Error('Aset yang sedang dipinjam tidak bisa langsung diubah ke Tersedia. Proses melalui pengembalian.')
    }

    const updated = await prisma.asset.update({ where: { id }, data: { status } })
    return { success: true, data: updated }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ============================================================
// DELETE
// ============================================================

export async function deleteAsset(id: string) {
  try {
    await requireRole([Role.Admin])
    const asset = await prisma.asset.findUnique({ where: { id } })
    if (!asset) throw new Error('Aset tidak ditemukan.')

    // Tidak boleh hapus aset yang sedang dipinjam
    if (asset.status === AssetStatus.Borrowed) {
      throw new Error('Tidak bisa menghapus aset yang sedang dipinjam.')
    }

    // Hapus tiket terkait terlebih dahulu (cascade)
    await prisma.ticket.deleteMany({ where: { assetId: id } })
    await prisma.asset.delete({ where: { id } })
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
