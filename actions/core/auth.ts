'use server'

import { prisma } from '../../lib/prisma'
import { createSession, destroySession, SessionUser } from '../../lib/session'
import { Role } from '../../app/generated/prisma'

// ─── Mapping role enum ke SessionUser role type ───────────────────────────────

function toSessionRole(role: Role): SessionUser['role'] {
  switch (role) {
    case Role.Admin: return 'Admin'
    case Role.HSSE: return 'HSSE'
    case Role.AreaHead: return 'AreaHead'
    default: return 'Peminjam'
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick Login (Testing Mode) — Ambil user pertama dari DB berdasarkan role
// Tidak memerlukan password, hanya untuk pengembangan
// ─────────────────────────────────────────────────────────────────────────────

export async function quickLoginAs(role: 'Admin' | 'Peminjam' | 'HSSE' | 'AreaHead') {
  try {
    const roleEnum = Role[role as keyof typeof Role]
    const user = await prisma.user.findFirst({
      where: { role: roleEnum, isActive: true },
      select: { id: true, name: true, email: true, role: true }
    })

    if (!user) {
      // Fallback jika tidak ada user di DB: buat sesi simulasi
      await createSession({
        id: `dev-${role.toLowerCase()}-00`,
        name: `Dev ${role}`,
        email: `dev-${role.toLowerCase()}@siarta.dev`,
        role: toSessionRole(roleEnum)
      })
      return { success: true, role }
    }

    await createSession({
      id: user.id,
      name: user.name,
      email: user.email,
      role: toSessionRole(user.role)
    })

    return { success: true, role: toSessionRole(user.role) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Logout — Hancurkan session
// ─────────────────────────────────────────────────────────────────────────────

export async function logoutUser() {
  try {
    await destroySession()
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Buat session dari data user yang sudah divalidasi (dipakai saat skip face scan)
// Dipanggil oleh FaceScanner ketika skipFaceCheck=true
// ─────────────────────────────────────────────────────────────────────────────

export async function createSessionFromUser(user: { id: string; name: string; email: string; role: string }) {
  try {
    const roleMap: Record<string, SessionUser['role']> = {
      'Admin': 'Admin',
      'HSSE': 'HSSE',
      'AreaHead': 'AreaHead',
      'Peminjam': 'Peminjam',
      'Area Head': 'AreaHead',
    }
    await createSession({
      id: user.id,
      name: user.name,
      email: user.email,
      role: roleMap[user.role] || 'Peminjam'
    })
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
