'use server'

import { prisma } from '../../lib/prisma'
import { AssetStatus } from '../../app/generated/prisma'

export async function getAvailableAssets() {
  try {
    const assets = await prisma.asset.findMany({
      where: {
        status: AssetStatus.Available
      },
      orderBy: {
        name: 'asc'
      }
    })
    return { success: true, data: assets }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getAssetById(id: string) {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id }
    })
    if (!asset) throw new Error('Aset tidak ditemukan')
    return { success: true, data: asset }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getAllAssetsForAdmin() {
  try {
    const assets = await prisma.asset.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
    return { success: true, data: assets }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
