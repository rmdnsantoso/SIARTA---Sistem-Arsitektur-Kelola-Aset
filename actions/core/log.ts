'use server'

import { prisma } from '../../lib/prisma'
import { getCurrentUser } from '../../lib/session'

// Fungsi untuk mencatat aktivitas ke database secara rahasia
export async function createActivityLog(
  action: string, 
  entityType: string, 
  details: string, 
  entityId?: string
) {
  try {
    const user = await getCurrentUser()
    if (!user) return // Jika tidak ada user, batalkan pencatatan

    await prisma.activityLog.create({
      data: {
        action,
        entityType,
        details,
        entityId,
        actorId: user.id,
        actorName: user.name
      }
    })
  } catch (err) {
    console.error('Failed to create activity log', err)
  }
}
