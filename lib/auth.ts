import { prisma } from './prisma'
import { Role } from '../app/generated/prisma'
import { getCurrentUser } from './session'
import { cache } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Helper RBAC (Role-Based Access Control) untuk Server Actions
// Membaca sesi dari cookie iron-session yang nyata
// ─────────────────────────────────────────────────────────────────────────────

export const requireRole = cache(async (allowedRoles: Role[]) => {
  const user = await getCurrentUser()

  // Jika tidak ada session → unauthorized
  if (!user) {
    throw new Error('Unauthorized: Anda belum login.')
  }

  // Map session role string ke Prisma Role enum
  const roleMap: Record<string, Role> = {
    'Admin': Role.Admin,
    'HSSE': Role.HSSE,
    'AreaHead': Role.AreaHead,
    'Peminjam': Role.Peminjam,
  }

  const userRole = roleMap[user.role] || Role.Peminjam

  if (!allowedRoles.includes(userRole)) {
    throw new Error(`Unauthorized: Role '${user.role}' tidak memiliki akses ke operasi ini.`)
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: userRole
  }
})
