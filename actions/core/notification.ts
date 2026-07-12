'use server'

import { prisma } from '../../lib/prisma'
import { Role } from '../../app/generated/prisma'
import { getCurrentUser } from '../../lib/session'

// ─── Wrapper Fungsi untuk Mobile (Otomatis deteksi dari Session) ───
export async function getMyNotifications() {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }
  return getUserNotifications(user.id, user.role)
}

export async function markMyNotificationAsRead(notificationId: string) {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }
  return markNotificationAsRead(notificationId)
}

export async function markAllMyNotificationsAsRead() {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }
  return markAllNotificationsAsRead(user.id, user.role)
}

export async function deleteMyNotification(notificationId: string) {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }
  return deleteNotification(notificationId)
}

export async function deleteAllMyNotifications() {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }
  return deleteAllNotifications(user.id)
}

// Ambil notifikasi berdasarkan userId
export async function getUserNotifications(userId: string, role: string) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
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
    await prisma.notification.updateMany({
      where: {
        isRead: false,
        recipientId: userId
      },
      data: { isRead: true }
    })
    return { success: true }
  } catch (error: any) {
    return { success: false, error: 'Gagal menandai semua dibaca' }
  }
}

export async function deleteNotification(notificationId: string) {
  try {
    await prisma.notification.delete({
      where: { id: notificationId }
    })
    return { success: true }
  } catch (error: any) {
    return { success: false, error: 'Gagal menghapus notifikasi' }
  }
}

export async function deleteAllNotifications(userId: string) {
  try {
    await prisma.notification.deleteMany({
      where: { recipientId: userId }
    })
    return { success: true }
  } catch (error: any) {
    return { success: false, error: 'Gagal menghapus semua notifikasi' }
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
    if (recipientId) {
      // ── Target Individu Spesifik ──
      const notif = await prisma.notification.create({
        data: { title, message, type, recipientId, link }
      })
      return { success: true, data: notif }
    } else {
      // ── Target Role / Semua Pengguna (Broadcast Individual) ──
      const cleanedTargetRole = targetRole.replace(/\s+/g, '')
      const roleEnum = targetRole !== 'Semua' ? (cleanedTargetRole as Role) : null
      
      const whereClause = roleEnum ? { role: roleEnum, isActive: true } : { isActive: true }
      const users = await prisma.user.findMany({
        where: whereClause,
        select: { id: true }
      })
      
      if (users.length === 0) return { success: true, data: [] }
      
      const dataToInsert = users.map(u => ({
        title,
        message,
        type,
        recipientId: u.id,
        targetRole: roleEnum, // Opsional untuk metadata
        link
      }))
      
      const result = await prisma.notification.createMany({
        data: dataToInsert
      })
      
      return { success: true, data: result }
    }
  } catch (error: any) {
    console.error('Error creating notification:', error)
    return { success: false, error: 'Gagal membuat notifikasi' }
  }
}
