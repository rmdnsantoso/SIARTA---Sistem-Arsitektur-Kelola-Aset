'use server'

import { prisma } from '../../lib/prisma'
import { requireRole } from '../../lib/auth'
import { Role } from '../../app/generated/prisma'

export async function getAllUsers() {
  try {
    await requireRole([Role.Admin])
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } })
    return { success: true, data: users }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createUser(input: {
  name: string
  email: string
  role: Role
}) {
  try {
    await requireRole([Role.Admin])
    const existing = await prisma.user.findUnique({ where: { email: input.email } })
    if (existing) throw new Error(`Email ${input.email} sudah terdaftar.`)
    const user = await prisma.user.create({ data: input })
    return { success: true, data: user }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateUser(id: string, input: {
  name?: string
  email?: string
  role?: Role
}) {
  try {
    await requireRole([Role.Admin])
    const user = await prisma.user.update({ where: { id }, data: input })
    return { success: true, data: user }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteUser(id: string) {
  try {
    await requireRole([Role.Admin])
    // Cek apakah user punya tiket aktif
    const activeTickets = await prisma.ticket.count({
      where: {
        peminjamId: id,
        overallStatus: { in: ['Menunggu', 'Disetujui', 'Dipinjam'] }
      }
    })
    if (activeTickets > 0) {
      throw new Error('Tidak bisa hapus pengguna yang masih memiliki tiket aktif.')
    }
    await prisma.user.delete({ where: { id } })
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
