import { prisma } from './prisma'
import { Role } from '../app/generated/prisma'

interface SimulatedSession {
  user: {
    id: string
    name: string
    email: string
    role: Role
  }
}

// Simulasi penyimpanan sesi aktif (dalam implementasi nyata, gunakan NextAuth / Auth.js / Cookies)
let currentSimulatedUser: { id: string; name: string; email: string; role: Role } = {
  id: 'usr-peminjam-01',
  name: 'Ahmad',
  email: 'ahmad@siarta.com',
  role: Role.Peminjam
}

export async function getSimulatedSession(): Promise<SimulatedSession> {
  // Simulasikan pengambilan sesi dari database atau cookie
  return {
    user: currentSimulatedUser
  }
}

export async function setSimulatedRole(role: Role, name: string, email: string) {
  currentSimulatedUser = {
    id: `usr-${role.toLowerCase()}-01`,
    name,
    email,
    role
  }
  return currentSimulatedUser
}

// Helper RBAC (Role-Based Access Control) untuk Server Actions
export async function requireRole(allowedRoles: Role[]) {
  const session = await getSimulatedSession()
  if (!allowedRoles.includes(session.user.role)) {
    throw new Error(`OTORISASI GAGAL: Role ${session.user.role} tidak memiliki wewenang untuk tindakan ini. Wewenang dibutuhkan: ${allowedRoles.join(', ')}`)
  }
  return session.user
}
