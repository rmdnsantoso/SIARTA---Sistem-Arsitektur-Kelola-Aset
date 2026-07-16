'use server'

import { prisma } from '../../lib/prisma'
import { requireRole } from '../../lib/auth'
import { Prisma, AssetStatus, Role } from '../../app/generated/prisma'
import { createActivityLog } from './log'

// ============================================================
// READ
// ============================================================

// Untuk halaman listing aset (Peminjam, HSSE, AreaHead) — ringan, hanya data yang dibutuhkan
export async function getAvailableAssets() {
  try {
    await requireRole([Role.Admin, Role.HSSE, Role.AreaHead, Role.Peminjam])

    const [assets, activeTickets] = await Promise.all([
      prisma.asset.findMany({
        orderBy: { createdAt: 'asc' },
        // Hanya ambil count unit per status — jauh lebih ringan dari include full history
        include: {
          _count: { select: { units: true } },
          units: {
            where: { status: { not: 'Dimusnahkan' } },
            select: { id: true, status: true, unitId: true, serialNumber: true }
          }
        }
      }),
      prisma.ticket.findMany({
        where: { overallStatus: { in: ['Menunggu', 'Disetujui', 'Dipinjam'] } },
        select: { assetId: true, jumlah: true }
      })
    ])

    const data = assets.map(a => {
      let computedTotal = 0
      let computedAvailable = 0

      if (a.isSerialized) {
        computedTotal = a.units?.length || 0
        computedAvailable = a.quantity
      } else {
        const borrowed = activeTickets
          .filter(t => t.assetId === a.id)
          .reduce((sum, t) => sum + t.jumlah, 0)
        computedAvailable = a.quantity
        computedTotal = a.quantity + borrowed
      }

      return { ...a, computedTotalStock: computedTotal, computedAvailableStock: computedAvailable }
    })

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getAssetById(id: string) {
  try {
    await requireRole([Role.Admin, Role.HSSE, Role.AreaHead, Role.Peminjam])
    if (!id || typeof id !== 'string') throw new Error('ID aset tidak valid.')
    const asset = await prisma.asset.findUnique({ where: { id } })
    if (!asset) throw new Error('Aset tidak ditemukan.')
    return { success: true, data: asset }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Untuk halaman admin listing — mirip getAvailableAssets tapi tanpa auth gate role khusus
export async function getAllAssetsForAdmin() {
  try {
    const [assets, activeTickets] = await Promise.all([
      prisma.asset.findMany({
        orderBy: { createdAt: 'asc' },
        include: {
          _count: { select: { units: true } },
          units: {
            where: { status: { not: 'Dimusnahkan' } },
            select: { id: true, status: true, unitId: true, serialNumber: true }
          }
        }
      }),
      prisma.ticket.findMany({
        where: { overallStatus: { in: ['Menunggu', 'Disetujui', 'Dipinjam'] } },
        select: { assetId: true, jumlah: true }
      })
    ])

    const data = assets.map(a => {
      let computedTotal = 0
      let computedAvailable = 0

      if (a.isSerialized) {
        computedTotal = a.units?.length || 0
        computedAvailable = a.units?.filter(u => u.status === 'Tersedia').length || 0
      } else {
        const borrowed = activeTickets
          .filter(t => t.assetId === a.id)
          .reduce((sum, t) => sum + t.jumlah, 0)
        computedAvailable = a.quantity
        computedTotal = a.quantity + borrowed
      }

      return { ...a, computedTotalStock: computedTotal, computedAvailableStock: computedAvailable }
    })

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Untuk detail aset — fetch unit lengkap + history (hanya dipanggil saat buka detail modal/halaman)
export async function getAssetUnitsById(assetId: string) {
  try {
    await requireRole([Role.Admin, Role.HSSE, Role.AreaHead, Role.Peminjam])
    if (!assetId?.trim()) throw new Error('ID aset tidak valid.')

    const units = await prisma.physicalUnit.findMany({
      where: { assetId },
      orderBy: { unitId: 'asc' },
      include: {
        history: {
          orderBy: { id: 'desc' }, // Setelah prisma generate: ganti ke { createdAt: 'desc' }
          take: 10 // Batasi 10 histori terakhir per unit
        }
      }
    })

    return { success: true, data: units }
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

    // ── Validasi input ────────────────────────────────────────────────────────
    if (!input.assetCode?.trim()) throw new Error('Kode aset wajib diisi.')
    if (!input.name?.trim()) throw new Error('Nama aset wajib diisi.')
    if (!input.category?.trim()) throw new Error('Kategori aset wajib diisi.')
    if (typeof input.quantity !== 'number' || input.quantity < 1) throw new Error('Jumlah aset harus minimal 1.')
    if (input.quantity > 9999) throw new Error('Jumlah aset terlalu besar (maks 9999).')
    // Sanitasi kode aset: hanya huruf, angka, dan tanda hubung
    if (!/^[A-Za-z0-9\-]+$/.test(input.assetCode)) throw new Error('Kode aset hanya boleh berisi huruf, angka, dan tanda hubung (-)')

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

    // ── Validasi input ────────────────────────────────────────────────────────
    if (input.name !== undefined && !input.name.trim()) throw new Error('Nama aset tidak boleh kosong.')
    if (input.category !== undefined && !input.category.trim()) throw new Error('Kategori tidak boleh kosong.')
    if (input.quantity !== undefined && (typeof input.quantity !== 'number' || input.quantity < 0)) throw new Error('Jumlah tidak boleh negatif.')
    if (input.quantity !== undefined && input.quantity > 9999) throw new Error('Jumlah aset terlalu besar (maks 9999).')

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
    if (!unitId?.trim()) throw new Error('Unit ID tidak valid.')
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
