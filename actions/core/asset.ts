'use server'

import { prisma } from '../../lib/prisma'
import { requireRole } from '../../lib/auth'
import { Prisma, AssetStatus, Role } from '../../app/generated/prisma'
import { createActivityLog } from './log'

// ============================================================
// READ
// ============================================================

export async function getAvailableAssets() {
  try {
    const assets = await prisma.asset.findMany({
      orderBy: { createdAt: 'asc' },
      include: { units: { include: { history: { orderBy: { timestamp: 'desc' } } } } }
    })
    
    const activeTickets = await prisma.ticket.findMany({
      where: { overallStatus: { in: ['Menunggu', 'Disetujui', 'Dipinjam'] } }
    })
    
    const data = assets.map(a => {
      let computedTotal = 0;
      let computedAvailable = 0;
      
      if (a.isSerialized) {
        // Serialized: total adalah yang belum dimusnahkan
        computedTotal = a.units?.filter(u => u.status !== 'Dimusnahkan').length || 0;
        // Tersedia: ambil dari a.quantity karena peminjaman sudah mengurangi a.quantity
        computedAvailable = a.quantity;
      } else {
        // Non-serialized: quantity di DB = available stock. Total = available + borrowed.
        const borrowed = activeTickets.filter(t => t.assetId === a.id).reduce((sum, t) => sum + t.jumlah, 0);
        computedAvailable = a.quantity;
        computedTotal = a.quantity + borrowed;
      }
      
      return {
        ...a,
        computedTotalStock: computedTotal,
        computedAvailableStock: computedAvailable
      }
    })
    
    return { success: true, data }
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
    const assets = await prisma.asset.findMany({ 
      orderBy: { createdAt: 'asc' },
      include: { units: { include: { history: { orderBy: { timestamp: 'desc' } } } } }
    })

    const activeTickets = await prisma.ticket.findMany({
      where: { overallStatus: { in: ['Menunggu', 'Disetujui', 'Dipinjam'] } }
    })
    
    const data = assets.map(a => {
      let computedTotal = 0;
      let computedAvailable = 0;
      
      if (a.isSerialized) {
        // Serialized: total adalah yang belum dimusnahkan
        computedTotal = a.units?.filter(u => u.status !== 'Dimusnahkan').length || 0;
        // Tersedia adalah yang statusnya beneran 'Tersedia'
        computedAvailable = a.units?.filter(u => u.status === 'Tersedia').length || 0;
      } else {
        // Non-serialized: quantity di DB = available stock. Total = available + borrowed.
        const borrowed = activeTickets.filter(t => t.assetId === a.id).reduce((sum, t) => sum + t.jumlah, 0);
        computedAvailable = a.quantity;
        computedTotal = a.quantity + borrowed;
      }
      
      return {
        ...a,
        computedTotalStock: computedTotal,
        computedAvailableStock: computedAvailable
      }
    })

    return { success: true, data }
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
  quantity: number
  spec?: string
  status?: AssetStatus
  imageUrl?: string
  serialNumbers?: string[]
}) {
  try {
    await requireRole([Role.Admin])
    const existing = await prisma.asset.findUnique({ where: { assetCode: input.assetCode } })
    if (existing) throw new Error(`Kode aset ${input.assetCode} sudah digunakan.`)
    
    const { serialNumbers, ...restInput } = input;
    
    const asset = await prisma.asset.create({
      data: { 
        ...restInput, 
        status: restInput.status ?? AssetStatus.Available,
        units: restInput.isSerialized ? {
          create: Array.from({ length: restInput.quantity }).map((_, i) => ({
            unitId: `${restInput.assetCode}-${String(i + 1).padStart(2, '0')}`,
            serialNumber: serialNumbers?.[i] || `SN-NEW-${Math.floor(1000 + Math.random() * 9000)}`,
            status: 'Tersedia'
          }))
        } : undefined
      },
      include: { units: { include: { history: true } } }
    })
    
    await createActivityLog('CREATE_ASSET', 'Asset', `Menambahkan aset baru: ${asset.name} (${asset.assetCode})`, asset.id)
    
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
  quantity?: number
  spec?: string
  isSerialized?: boolean
  status?: AssetStatus
  imageUrl?: string
}) {
  try {
    await requireRole([Role.Admin])
    const asset = await prisma.asset.update({ where: { id }, data: input })
    await createActivityLog('UPDATE_ASSET', 'Asset', `Memperbarui data aset: ${asset.name} (${asset.assetCode})`, asset.id)
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
    await createActivityLog('DELETE_ASSET', 'Asset', `Menghapus aset: ${asset.name} (${asset.assetCode})`, id)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function archiveAsset(id: string) {
  try {
    await requireRole([Role.Admin])
    const asset = await prisma.asset.findUnique({ where: { id } })
    if (!asset) throw new Error('Aset tidak ditemukan.')
    
    const updated = await prisma.asset.update({ 
      where: { id }, 
      data: { isActive: false } 
    })
    return { success: true, data: updated }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function unarchiveAsset(id: string) {
  try {
    await requireRole([Role.Admin])
    const asset = await prisma.asset.findUnique({ where: { id } })
    if (!asset) throw new Error('Aset tidak ditemukan.')
    
    const updated = await prisma.asset.update({ 
      where: { id }, 
      data: { isActive: true } 
    })
    return { success: true, data: updated }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ============================================================
// UNIT CRUD OPERATIONS
// ============================================================

export async function updatePhysicalUnitSN(unitId: string, serialNumber: string) {
  try {
    const user = await requireRole([Role.Admin])
    await requireRole([Role.Admin])
    const unit = await prisma.physicalUnit.findUnique({ where: { unitId } })
    if (!unit) throw new Error('Unit tidak ditemukan.')
    
    const updated = await prisma.physicalUnit.update({
      where: { unitId },
      data: { serialNumber }
    });

    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function addPhysicalUnits(assetId: string, count: number, startIdx: number) {
  try {
    const user = await requireRole([Role.Admin])
    const asset = await prisma.asset.findUnique({ where: { id: assetId }, include: { units: true } })
    if (!asset) throw new Error('Aset tidak ditemukan.')
    
    const unitsData = Array.from({ length: count }).map((_, i) => ({
      assetId,
      unitId: `${asset.assetCode}-${String(startIdx + i).padStart(2, '0')}`,
      serialNumber: '',
      status: 'Tersedia'
    }))
    
    await prisma.physicalUnit.createMany({ data: unitsData })
    await prisma.asset.update({
      where: { id: assetId },
      data: { quantity: { increment: count } }
    })
    
    const newUnits = await prisma.physicalUnit.findMany({
      where: { assetId, unitId: { in: unitsData.map(u => u.unitId) } }
    })
    
    for (const u of newUnits) {
      await prisma.unitHistory.create({
        data: {
          unitId: u.id,
          action: 'Unit Ditambahkan',
          actor: `Admin: ${user.name}`,
          timestamp: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB'
        }
      })
    }
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function removePhysicalUnit(unitId: string) {
  try {
    const user = await requireRole([Role.Admin])
    const unit = await prisma.physicalUnit.findUnique({ where: { unitId } })
    if (!unit) throw new Error('Unit tidak ditemukan.')
    if (unit.status === 'Dipinjam') throw new Error('Unit sedang dipinjam, tidak bisa dihapus.')
    
    await prisma.physicalUnit.delete({ where: { unitId } })
    await prisma.asset.update({
      where: { id: unit.assetId },
      data: { quantity: { decrement: 1 } }
    })
    
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function addAssetStock(assetId: string, addedStock: number) {
  try {
    await requireRole([Role.Admin])
    const updated = await prisma.asset.update({
      where: { id: assetId },
      data: { quantity: { increment: addedStock } }
    })
    return { success: true, data: updated }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Ambil list serial number yang berstatus Tersedia untuk suatu aset
export async function getAvailableSerials(assetId: string) {
  try {
    const units = await prisma.physicalUnit.findMany({
      where: { assetId, status: 'Tersedia' },
      select: { serialNumber: true, unitId: true }
    })
    const validCodes = units.flatMap(u => {
      const codes = [u.unitId]
      if (u.serialNumber && u.serialNumber !== 'N/A') codes.push(u.serialNumber)
      return codes
    })
    return { success: true, data: validCodes }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
