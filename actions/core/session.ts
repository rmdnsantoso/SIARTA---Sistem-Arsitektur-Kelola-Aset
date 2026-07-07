'use server'

import { getCurrentUser } from '../../lib/session'

/**
 * Server Action: ambil user yang sedang login
 * Dipakai oleh halaman client-side untuk mendapatkan info user dari session
 */
export async function getLoggedInUser() {
  try {
    const user = await getCurrentUser()
    return { success: true, user }
  } catch (error: any) {
    return { success: false, user: null, error: error.message }
  }
}
