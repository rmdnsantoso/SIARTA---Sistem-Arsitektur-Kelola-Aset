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

