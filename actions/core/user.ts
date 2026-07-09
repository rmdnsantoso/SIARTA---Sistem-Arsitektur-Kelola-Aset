'use server'

import { prisma } from '../../lib/prisma'
import { requireRole } from '../../lib/auth'
import { Role } from '../../app/generated/prisma'
import bcrypt from 'bcryptjs'
import { createSession, getCurrentUser } from '../../lib/session'
import { headers } from 'next/headers'

// ─────────────────────────────────────────
// In-memory brute-force / rate limiter
// Max 5 gagal per email per 15 menit
// ─────────────────────────────────────────
const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 menit

function checkRateLimit(key: string): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now()
  const entry = loginAttempts.get(key)

  if (!entry || now > entry.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, retryAfterMs: 0 }
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0, retryAfterMs: entry.resetAt - now }
  }

  entry.count += 1
  return { allowed: true, remaining: MAX_ATTEMPTS - entry.count, retryAfterMs: 0 }
}

function resetRateLimit(key: string) {
  loginAttempts.delete(key)
}

// ─────────────────────────────────────────
// Helper: Generate password acak 10 karakter
// ─────────────────────────────────────────
function generateRandomPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
  let result = ''
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// ─────────────────────────────────────────
// Ambil semua pengguna (Admin & HSSE)
// ─────────────────────────────────────────
export async function getAllUsers() {
  try {
    await requireRole([Role.Admin, Role.HSSE])
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        nip: true,
        name: true,
        email: true,
        wa: true,
        jabatan: true,
        office: true,
        regional: true,
        role: true,
        isActive: true,
        faceRegistered: true,
        createdAt: true,
        updatedAt: true,
        // Jangan return passwordHash, tempPassword, faceDescriptor ke client
      }
    })
    // Serialize to avoid Next.js Server Action Date object serialization errors
    return { success: true, data: JSON.parse(JSON.stringify(users)) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ─────────────────────────────────────────
// Buat pengguna baru — semua field wajib
// ─────────────────────────────────────────
export async function createUser(input: {
  name: string
  email: string
  role: Role
  nip: string
  wa: string
  jabatan: string
  office: string
  regional: string
}) {
  try {
    await requireRole([Role.Admin, Role.HSSE])

    // Validasi semua field wajib
    if (!input.name || !input.email || !input.nip || !input.wa || !input.jabatan || !input.office || !input.regional) {
      throw new Error('Semua field wajib diisi.')
    }

    const existing = await prisma.user.findUnique({ where: { email: input.email } })
    if (existing) throw new Error(`Email ${input.email} sudah terdaftar.`)

    // Generate & hash password acak
    const rawPassword = generateRandomPassword()
    const passwordHash = await bcrypt.hash(rawPassword, 12)

    const user = await prisma.user.create({
      data: {
        ...input,
        passwordHash,
        tempPassword: rawPassword, // Disimpan sementara agar admin bisa lihat
      }
    })

    return {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        nip: user.nip,
        wa: user.wa,
        jabatan: user.jabatan,
        office: user.office,
        regional: user.regional,
        role: user.role,
        isActive: user.isActive,
        faceRegistered: user.faceRegistered,
      },
      tempPassword: rawPassword // Dikembalikan sekali agar ditampilkan ke admin
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ─────────────────────────────────────────
// Update data pengguna
// ─────────────────────────────────────────
export async function updateUser(id: string, input: {
  name?: string
  email?: string
  role?: Role
  nip?: string
  wa?: string
  jabatan?: string
  office?: string
  regional?: string
  isActive?: boolean
}) {
  try {
    await requireRole([Role.Admin, Role.HSSE])
    
    // Prevent self-modification for security
    const currentUser = await getCurrentUser()
    if (currentUser?.id === id) {
      throw new Error('Anda tidak dapat mengubah status atau peran akun Anda sendiri melalui manajemen pengguna.')
    }

    const user = await prisma.user.update({ where: { id }, data: input })
    return { success: true, data: JSON.parse(JSON.stringify(user)) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ─────────────────────────────────────────
// Hapus pengguna
// ─────────────────────────────────────────
export async function deleteUser(id: string) {
  try {
    await requireRole([Role.Admin, Role.HSSE])

    // Prevent self-deletion for security
    const currentUser = await getCurrentUser()
    if (currentUser?.id === id) {
      throw new Error('Tindakan tidak diizinkan. Anda tidak dapat menghapus akun Anda sendiri.')
    }

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

// ─────────────────────────────────────────
// Reset password → generate acak baru
// ─────────────────────────────────────────
export async function resetUserPassword(id: string) {
  try {
    await requireRole([Role.Admin, Role.HSSE])

    const rawPassword = generateRandomPassword()
    const passwordHash = await bcrypt.hash(rawPassword, 12)

    await prisma.user.update({
      where: { id },
      data: { passwordHash, tempPassword: rawPassword }
    })

    return { success: true, tempPassword: rawPassword }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ─────────────────────────────────────────
// Simpan face descriptor setelah registrasi wajah
// ─────────────────────────────────────────
export async function saveFaceDescriptor(userId: string, descriptor: number[]) {
  try {
    await requireRole([Role.Admin, Role.HSSE])

    await prisma.user.update({
      where: { id: userId },
      data: {
        faceDescriptor: JSON.stringify(descriptor),
        faceRegistered: true,
      }
    })

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ─────────────────────────────────────────
// Ganti password sendiri oleh user (Hanya sekali)
// ─────────────────────────────────────────
export async function changeUserPassword(userId: string, oldPassword: string, newPassword: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, tempPassword: true }
    })
    
    if (!user) throw new Error('Pengguna tidak ditemukan.')
    if (!user.tempPassword) {
      throw new Error('Anda sudah pernah mengganti password. Silakan hubungi Admin jika ingin mereset password.')
    }
    if (!user.passwordHash) {
      throw new Error('Password belum dikonfigurasi oleh admin.')
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash)
    if (!isMatch) throw new Error('Password lama salah.')

    const newHash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newHash,
        tempPassword: null // Hapus tempPassword sebagai penanda sudah pernah diganti
      }
    })

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ─────────────────────────────────────────
// Login dengan kredensial (email + password)
// Tidak butuh role khusus — ini endpoint publik
// ─────────────────────────────────────────
export async function loginWithCredentials(email: string, password: string) {
  try {
    // ── Validasi input dasar ──────────────────────────────────────────────────
    if (!email || !password) throw new Error('Email dan password wajib diisi.')

    // Batas panjang untuk mencegah oversized payload
    if (email.length > 254) throw new Error('Format email tidak valid.')
    if (password.length > 128) throw new Error('Password terlalu panjang.')

    // Validasi format email (regex sederhana)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) throw new Error('Format email tidak valid.')

    const cleanEmail = email.toLowerCase().trim()

    // ── Rate limiting per email ───────────────────────────────────────────────
    const rl = checkRateLimit(`email:${cleanEmail}`)
    if (!rl.allowed) {
      const menit = Math.ceil(rl.retryAfterMs / 60000)
      throw new Error(`Terlalu banyak percobaan login. Coba lagi dalam ${menit} menit.`)
    }

    // ── Cek user di database ──────────────────────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: {
        id: true, name: true, email: true, role: true,
        isActive: true, passwordHash: true, faceRegistered: true
      }
    })

    // Pesan error generik agar tidak bocorkan info akun mana yang exist
    if (!user || !user.passwordHash) throw new Error('Email atau password salah.')
    if (!user.isActive) throw new Error('Akun ini telah dinonaktifkan. Hubungi administrator.')

    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) throw new Error('Email atau password salah.')

    // ── Login sukses — reset rate limit ──────────────────────────────────────
    resetRateLimit(`email:${cleanEmail}`)

    // Session dibuat di FaceScanner setelah 2FA wajah berhasil, bukan di sini
    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        faceRegistered: user.faceRegistered,
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ─────────────────────────────────────────
// Verifikasi wajah saat login
// Jika userId diberikan, hanya cocokkan ke user tersebut (targeted match)
// Jika tidak, cari ke seluruh user aktif (fallback mode)
// ─────────────────────────────────────────
export async function verifyFaceLogin(descriptor: number[], userId?: string) {
  try {
    const THRESHOLD = 0.55

    if (userId) {
      // ── Targeted: hanya cocokkan wajah user yg sudah login via kredensial ──
      const user = await prisma.user.findUnique({
        where: { id: userId, isActive: true, faceRegistered: true },
        select: { id: true, name: true, email: true, role: true, faceDescriptor: true }
      })

      if (!user || !user.faceDescriptor) {
        return { success: false, error: 'Data wajah belum direkam untuk akun ini.' }
      }

      const stored: number[] = JSON.parse(user.faceDescriptor)
      let sum = 0
      for (let i = 0; i < descriptor.length; i++) {
        const diff = descriptor[i] - (stored[i] ?? 0)
        sum += diff * diff
      }
      const distance = Math.sqrt(sum)

      if (distance < THRESHOLD) {
        // ── Buat session setelah wajah berhasil diverifikasi (targeted) ──
        await createSession({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as any,
        })
        return {
          success: true,
          user: { id: user.id, name: user.name, email: user.email, role: user.role }
        }
      }
      return { success: false, error: 'Wajah tidak cocok dengan akun ini. Coba lagi.' }
    }

    // ── Global search: mode fallback (quick login testing) ──
    const users = await prisma.user.findMany({
      where: { isActive: true, faceRegistered: true, faceDescriptor: { not: null } },
      select: { id: true, name: true, email: true, role: true, faceDescriptor: true }
    })

    let bestMatch: { userId: string; name: string; email: string; role: Role; distance: number } | null = null

    for (const user of users) {
      if (!user.faceDescriptor) continue
      const stored: number[] = JSON.parse(user.faceDescriptor)
      let sum = 0
      for (let i = 0; i < descriptor.length; i++) {
        const diff = descriptor[i] - (stored[i] ?? 0)
        sum += diff * diff
      }
      const distance = Math.sqrt(sum)
      if (distance < THRESHOLD) {
        if (!bestMatch || distance < bestMatch.distance) {
          bestMatch = { userId: user.id, name: user.name, email: user.email, role: user.role, distance }
        }
      }
    }

    if (bestMatch) {
      // ── Buat session setelah wajah berhasil diverifikasi (global match) ──
      await createSession({
        id: bestMatch.userId,
        name: bestMatch.name,
        email: bestMatch.email,
        role: bestMatch.role as any,
      })
      return {
        success: true,
        user: { id: bestMatch.userId, name: bestMatch.name, email: bestMatch.email, role: bestMatch.role }
      }
    }

    return { success: false, error: 'Wajah tidak dikenali dalam sistem.' }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
