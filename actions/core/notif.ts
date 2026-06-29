'use server'

import { prisma } from '../../lib/prisma'

export async function getNotificationsForRole(roleName: string) {
  try {
    const notifs = await prisma.notification.findMany({
      where: {
        OR: [
          { targetRole: 'Semua' },
          { targetRole: roleName }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    return { success: true, data: notifs }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createNotification(title: string, desc: string, type: string, targetRole: string) {
  try {
    const notif = await prisma.notification.create({
      data: {
        title,
        desc,
        type,
        targetRole,
        unread: true,
        time: 'Baru saja'
      }
    })
    return { success: true, data: notif }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function markNotificationAsRead(id: string) {
  try {
    const notif = await prisma.notification.update({
      where: { id },
      data: { unread: false }
    })
    return { success: true, data: notif }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
