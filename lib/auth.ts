import { prisma } from './prisma'
import { Role } from '../app/generated/prisma'
import { getCurrentUser } from './session'

// ─────────────────────────────────────────────────────────────────────────────
// Helper RBAC (Role-Based Access Control) untuk Server Actions
// Membaca sesi dari cookie iron-session yang nyata
// ─────────────────────────────────────────────────────────────────────────────

export async function requireRole(allowedRoles: Role[]) {
  const user = await getCurrentUser()

  // Jika tidak ada session → unauthorized
  if (!user) {
    // Fallback sementara untuk development: jika env dev, izinkan tanpa session
    if (process.env.ALLOW_DEV_BYPASS === 'true') {
      return {
        id: 'dev-fallback',
        name: 'Dev User',
        email: 'dev@siarta.dev',
        role: allowedRoles[0]
      }
    }
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
}
