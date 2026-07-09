import { getIronSession, IronSession, SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'

// ─── Tipe data yang disimpan di session cookie ────────────────────────────────

export interface SessionUser {
  id: string
  name: string
  email: string
  role: 'Admin' | 'Peminjam' | 'HSSE' | 'AreaHead'
}

export interface AppSessionData {
  user?: SessionUser
  isQuickLogin?: boolean // Flag untuk testing mode
}

// ─── Konfigurasi session ──────────────────────────────────────────────────────

export const SESSION_OPTIONS: SessionOptions = {
  password: process.env.SESSION_SECRET || 'siarta-secret-key-min-32-chars-long!!',
  cookieName: 'siarta_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 jam
  },
}

// ─── Helper: Ambil session dari cookie request ────────────────────────────────

export async function getSession(): Promise<IronSession<AppSessionData>> {
  const cookieStore = await cookies()
  const session = await getIronSession<AppSessionData>(cookieStore, SESSION_OPTIONS)
  return session
}

// ─── Helper: Simpan user ke session setelah login berhasil ───────────────────

export async function createSession(user: SessionUser): Promise<void> {
  const session = await getSession()
  session.user = user
  await session.save()
}

// ─── Helper: Hapus session (logout) ──────────────────────────────────────────

export async function destroySession(): Promise<void> {
  const session = await getSession()
  session.destroy()
}

// ─── Helper: Ambil user yang sedang login (untuk dipakai di halaman role) ────

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession()
  return session.user || null
}
