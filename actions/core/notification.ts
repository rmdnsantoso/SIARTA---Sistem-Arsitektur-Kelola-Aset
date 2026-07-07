'use server'

import { prisma } from '../../lib/prisma'
import { Role } from '../../app/generated/prisma'

// Ambil notifikasi berdasarkan userId atau role
export async function getUserNotifications(userId: string, role: string) {
  try {
    // Convert role string ke enum (hapus spasi jika ada, e.g. "Area Head" -> "AreaHead")
    const cleanedRole = role.replace(/\s+/g, '')
    const roleEnum = cleanedRole as Role
    
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { recipientId: userId },
          { targetRole: roleEnum },
          // Opsional: Untuk Area Head yang mungkin butuh notifikasi global tapi role-nya bukan Admin
          // Tapi karena schema targetRole nullable, bisa juga dicek targetRole: null jika ada
        ]
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit 50 terbaru
    })

    return { success: true, data: notifications }
  } catch (error: any) {
    console.error('Error fetching notifications:', error)
    return { success: false, error: 'Gagal memuat notifikasi' }
  }
}

// Menandai satu notifikasi sebagai sudah dibaca
export async function markNotificationAsRead(notificationId: string) {
  try {
    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    })
    return { success: true, data: updated }
  } catch (error: any) {
    return { success: false, error: 'Gagal menandai dibaca' }
  }
}

// Menandai semua notifikasi milik user sebagai sudah dibaca
export async function markAllNotificationsAsRead(userId: string, role: string) {
  try {
    const cleanedRole = role.replace(/\s+/g, '')
    const roleEnum = cleanedRole as Role
    await prisma.notification.updateMany({
      where: {
        isRead: false,
        OR: [
          { recipientId: userId },
          { targetRole: roleEnum }
        ]
      },
      data: { isRead: true }
    })
    return { success: true }
  } catch (error: any) {
    return { success: false, error: 'Gagal menandai semua dibaca' }
  }
}

export async function createNotification(
  title: string,
  message: string,
  type: string = 'info',
  targetRole: string = 'Semua',
  recipientId?: string,
  link?: string
) {
  try {
    const cleanedTargetRole = targetRole.replace(/\s+/g, '')
    const roleEnum = targetRole !== 'Semua' ? (cleanedTargetRole as Role) : null
    const notif = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        recipientId,
        targetRole: roleEnum,
        link
      }
    })
    return { success: true, data: notif }
  } catch (error: any) {
    console.error('Error creating notification:', error)
    return { success: false, error: 'Gagal membuat notifikasi' }
  }
}
