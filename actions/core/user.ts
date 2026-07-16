'use server'

import { prisma } from '../../lib/prisma'
import { requireRole } from '../../lib/auth'
import { Role } from '../../app/generated/prisma'
import bcrypt from 'bcryptjs'
import { createSession, getCurrentUser, getSession } from '../../lib/session'
import { headers } from 'next/headers'
import crypto from 'crypto'
import { createActivityLog } from './log'

// ─────────────────────────────────────────
// Database-backed brute-force / rate limiter
// Max 5 gagal per key per 15 menit
// ─────────────────────────────────────────
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 menit

async function checkRateLimit(key: string): Promise<{ allowed: boolean; remaining: number; retryAfterMs: number }> {
  const now = new Date()
  const nowMs = now.getTime()
  
  let entry = await prisma.loginAttempt.findUnique({ where: { key } })
  
  if (!entry || nowMs > entry.resetAt.getTime()) {
    entry = await prisma.loginAttempt.upsert({
      where: { key },
      update: { count: 1, resetAt: new Date(nowMs + WINDOW_MS) },
      create: { key, count: 1, resetAt: new Date(nowMs + WINDOW_MS) }
    })
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, retryAfterMs: 0 }
  }
  
  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0, retryAfterMs: entry.resetAt.getTime() - nowMs }
  }
  
  entry = await prisma.loginAttempt.update({
    where: { key },
    data: { count: entry.count + 1 }
  })
  
  return { allowed: true, remaining: MAX_ATTEMPTS - entry.count, retryAfterMs: 0 }
}

async function resetRateLimit(key: string) {
  try {
    await prisma.loginAttempt.delete({ where: { key } })
  } catch (e) {
    // Abaikan error jika data tidak ditemukan (sudah terhapus)
  }
}

// ─────────────────────────────────────────
// Helper: Generate password acak kriptografis 12 karakter
// ─────────────────────────────────────────
function generateRandomPassword(): string {
  return crypto.randomBytes(6).toString('hex')
}

// ─────────────────────────────────────────
// Ambil semua pengguna (Admin, HSSE, Area Head)
// ─────────────────────────────────────────
export async function getAllUsers() {
  try {
    await requireRole([Role.Admin, Role.HSSE, Role.AreaHead])
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
        mustChangePassword: true,
      }
    })

    await createActivityLog('CREATE_USER', 'User', `Menambahkan pengguna baru: ${user.role}: ${user.name}`, user.id)

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
    const actor = await requireRole([Role.Admin, Role.HSSE])
    
    // Prevent self-modification for security
    const currentUser = await getCurrentUser()
    if (currentUser?.id === id) {
      throw new Error('Anda tidak dapat mengubah status atau peran akun Anda sendiri melalui manajemen pengguna.')
    }

    // ── HSSE tidak boleh mengubah user Admin ────────────────────────────────────
    if (actor.role === Role.HSSE) {
      const targetUser = await prisma.user.findUnique({ where: { id }, select: { role: true } })
      if (targetUser?.role === Role.Admin) {
        throw new Error('HSSE tidak diizinkan mengubah data pengguna dengan role Admin.')
      }
      // HSSE juga tidak boleh meng-upgrade role menjadi Admin
      if (input.role === Role.Admin) {
        throw new Error('HSSE tidak diizinkan menetapkan role Admin.')
      }
    }

    const user = await prisma.user.update({ where: { id }, data: input })
    await createActivityLog('UPDATE_USER', 'User', `Memperbarui data pengguna: ${user.name}`, user.id)
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
    const actor = await requireRole([Role.Admin, Role.HSSE])

    // Prevent self-deletion for security
    const currentUser = await getCurrentUser()
    if (currentUser?.id === id) {
      throw new Error('Tindakan tidak diizinkan. Anda tidak dapat menghapus akun Anda sendiri.')
    }

    // ── HSSE tidak boleh menghapus user Admin ────────────────────────────────────
    if (actor.role === Role.HSSE) {
      const targetUser = await prisma.user.findUnique({ where: { id }, select: { role: true } })
      if (targetUser?.role === Role.Admin) {
        throw new Error('HSSE tidak diizinkan menghapus pengguna dengan role Admin.')
      }
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
    const userToDelete = await prisma.user.findUnique({ where: { id } })
    if (userToDelete) {
      await createActivityLog('DELETE_USER', 'User', `Menghapus akun pengguna: ${userToDelete.name}`, id)
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
      data: { passwordHash, mustChangePassword: true }
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
      select: { passwordHash: true, mustChangePassword: true }
    })
    
    if (!user) throw new Error('Pengguna tidak ditemukan.')
    if (!user.mustChangePassword) {
      throw new Error('Anda sudah pernah mengganti password. Silakan hubungi Admin jika ingin mereset password.')
    }
    if (!user.passwordHash) {
      throw new Error('Password belum dikonfigurasi oleh admin.')
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash)
    if (!isMatch) throw new Error('Password lama salah.')

    // Validasi kekuatan password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!passwordRegex.test(newPassword)) {
      throw new Error('Password baru harus minimal 8 karakter, mengandung setidaknya satu huruf besar, satu huruf kecil, dan satu angka.')
    }

    const newHash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newHash,
        mustChangePassword: false
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
    const headersList = await headers()
    const clientIp = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'

    const rl = await checkRateLimit(`email:${cleanEmail}`)
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
    await resetRateLimit(`email:${cleanEmail}`)

    let sessionCreated = false
    let preAuthToken: string | undefined

    if (user.faceRegistered) {
      const session = await getSession()
      session.pendingFaceUserId = user.id
      await session.save()
    } else {
      await createSession({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as any,
      })
      sessionCreated = true
    }

    return {
      success: true,
      sessionCreated,
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
// Generate liveness challenge acak (Blink atau Turn Head)
// ─────────────────────────────────────────
export async function generateLivenessChallenge() {
  try {
    const session = await getSession()
    if (!session.pendingFaceUserId) {
      throw new Error('Pre-authentication required. Silakan login dengan password terlebih dahulu.')
    }

    const sessionId = crypto.randomUUID()

    // Acak 2 tantangan dari kumpulan yang ada
    const allChallenges = ['BLINK', 'TURN_LEFT', 'TURN_RIGHT']
    const sequence = allChallenges.sort(() => Math.random() - 0.5).slice(0, 2)
    const expiresAt = new Date(Date.now() + 30 * 1000) // 30 detik untuk 2 gerakan

    await prisma.livenessChallenge.create({
      data: {
        id: sessionId,
        userId: session.pendingFaceUserId,
        sequence: JSON.stringify(sequence),
        expiresAt
      }
    })

    // Bersihkan data expired secara acak 10% dari waktu
    if (Math.random() < 0.1) {
      prisma.livenessChallenge.deleteMany({
        where: { expiresAt: { lt: new Date() } }
      }).catch(() => {})
    }

    return { success: true, sessionId, challenge: sequence }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ─────────────────────────────────────────
// Verifikasi wajah saat login
// Jika userId diberikan, hanya cocokkan ke user tersebut (targeted match)
// Jika tidak, cari ke seluruh user aktif (fallback mode)
// ─────────────────────────────────────────
async function logFailedLiveness(userId: string, reason: string) {
  try {
    if (!userId) return
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
    if (user) {
      await prisma.activityLog.create({
        data: {
          action: 'FAILED_LIVENESS',
          entityType: 'System',
          details: `Percobaan spoofing/kegagalan liveness: ${reason}`,
          actorId: userId,
          actorName: user.name
        }
      })
    }
  } catch (err) {}
}

export async function verifyFaceLogin(
  descriptor: number[],
  sessionId?: string,
  livenessData?: {
    earHistory?: { ear: number, yawRatio: number }[],
    headTurnHistory?: { dir: 'left'|'right'|'center', eyeRatio: number }[]
  }
) {
  try {
    const session = await getSession()
    const userId = session.pendingFaceUserId

    if (!userId) {
      return { success: false, error: 'Pre-authentication required. Silakan login ulang.' }
    }

    if (!descriptor || descriptor.length !== 128) return { success: false, error: 'Data wajah dari perangkat tidak valid atau korup.' }

    // ── Rate Limiting Check ──
    const headersList = await headers()
    const clientIp = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'

    const rateLimit = await checkRateLimit(`face:${userId}`)
    if (!rateLimit.allowed) {
      return { success: false, error: `Terlalu banyak percobaan gagal. Silakan coba lagi setelah ${Math.ceil(rateLimit.retryAfterMs / 1000 / 60)} menit.` }
    }

    // ── Validasi Liveness (Server-Side) ──
    if (!sessionId || !livenessData) {
      await logFailedLiveness(userId, 'Data liveness tidak lengkap.')
      return { success: false, error: 'Data liveness tidak lengkap.' }
    }

    const storedChallenge = await prisma.livenessChallenge.findUnique({
      where: { id: sessionId }
    })

    if (!storedChallenge || storedChallenge.userId !== userId) {
      await logFailedLiveness(userId, 'Sesi tantangan tidak valid.')
      return { success: false, error: 'Sesi tantangan tidak valid atau milik pengguna lain. Silakan coba lagi.' }
    }

    await prisma.livenessChallenge.delete({ where: { id: sessionId } }).catch(() => {})

    if (storedChallenge.expiresAt.getTime() < Date.now()) {
      await logFailedLiveness(userId, 'Waktu verifikasi habis.')
      return { success: false, error: 'Waktu verifikasi habis. Coba lagi.' }
    }

    const sequence: string[] = JSON.parse(storedChallenge.sequence)

    for (const challengeType of sequence) {
      if (challengeType === 'BLINK') {
        const { earHistory } = livenessData
        if (!earHistory || earHistory.length < 3) {
          await logFailedLiveness(userId, 'Data kedipan tidak memadai.')
          return { success: false, error: 'Data kedipan tidak memadai.' }
        }
        
        // Cek EAR relatif terhadap baseline (kira-kira max dari data)
        const ears = earHistory.map(d => d.ear)
        const maxEAR = Math.max(...ears)
        const minEAR = Math.min(...ears)
        const latestEAR = ears[ears.length - 1]
        
        // Pose-gating: pastikan yawRatio relatif stabil selama window
        const yaws = earHistory.map(d => d.yawRatio)
        const maxYaw = Math.max(...yaws)
        const minYaw = Math.min(...yaws)
        
        if (maxEAR - minEAR < 0.05 || latestEAR - minEAR < 0.03 || maxYaw - minYaw > 0.2) {
          await logFailedLiveness(userId, 'Kedipan gagal pose-gating atau kurang signifikan.')
          return { success: false, error: 'Kedipan wajah gagal divalidasi oleh server.' }
        }
      } else if (challengeType === 'TURN_LEFT' || challengeType === 'TURN_RIGHT') {
        const { headTurnHistory } = livenessData
        if (!headTurnHistory || headTurnHistory.length < 4) {
          await logFailedLiveness(userId, 'Data gerakan kepala tidak memadai.')
          return { success: false, error: 'Data gerakan kepala tidak memadai.' }
        }
        
        const expectedDir = challengeType === 'TURN_LEFT' ? 'left' : 'right'
        
        const turnIdx = headTurnHistory.findIndex((d, i) => 
          d.dir === expectedDir && headTurnHistory.slice(i, i + 3).every(x => x.dir === expectedDir)
        )
        const returnedToCenter = turnIdx >= 0 && headTurnHistory.slice(turnIdx + 3).some(d => d.dir === 'center')
        
        if (turnIdx < 0 || !returnedToCenter) {
          await logFailedLiveness(userId, `Gagal melakukan ${expectedDir}.`)
          return { success: false, error: 'Gerakan menoleh gagal divalidasi oleh server (harus menoleh lalu kembali menatap layar).' }
        }
        
        // 3D Rotation Check: rasio lebar mata harus berubah secara signifikan saat menoleh
        const centerRatios = headTurnHistory.filter(d => d.dir === 'center').map(d => d.eyeRatio)
        const turnRatios = headTurnHistory.filter(d => d.dir === expectedDir).map(d => d.eyeRatio)
        
        if (centerRatios.length > 0 && turnRatios.length > 0) {
          const avgCenter = centerRatios.reduce((a, b) => a + b, 0) / centerRatios.length
          const avgTurn = turnRatios.reduce((a, b) => a + b, 0) / turnRatios.length
          const diff = Math.abs(avgCenter - avgTurn)
          if (diff < 0.05) { // Threshold dinamis, foto 2D diff nya sangat kecil
            await logFailedLiveness(userId, '3D Rotation check gagal (terindikasi foto datar).')
            return { success: false, error: 'Wajah terdeteksi bukan 3D (indikasi foto). Coba lagi.' }
          }
        }
      }
    }

    const THRESHOLD = 0.55

    // ── Targeted: hanya cocokkan wajah user yg sudah login via kredensial ──
    const user = await prisma.user.findUnique({
      where: { id: userId, isActive: true, faceRegistered: true },
      select: { id: true, name: true, email: true, role: true, faceDescriptor: true }
    })

    if (!user || !user.faceDescriptor) {
      return { success: false, error: 'Data wajah belum direkam untuk akun ini.' }
    }

    const stored: number[] = JSON.parse(user.faceDescriptor)
    if (!stored || stored.length !== 128) {
      return { success: false, error: 'Data wajah di server tidak valid (panjang array berbeda). Silakan hubungi Admin untuk registrasi ulang wajah.' }
    }

    let sum = 0
    for (let i = 0; i < 128; i++) {
      const diff = descriptor[i] - stored[i]
      sum += diff * diff
    }
    const distance = Math.sqrt(sum)

    if (distance < THRESHOLD) {
      // ── Buat session setelah wajah berhasil diverifikasi ──
      // Hapus tiket pre-auth dari cookie karena sesi penuh akan diterbitkan
      delete session.pendingFaceUserId
      session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as any,
      }
      await session.save()
      
      // Reset rate limit on success
      await resetRateLimit(`face:${userId}`)
      
      return {
        success: true,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      }
    }

    return { success: false, error: 'Wajah tidak cocok dengan akun ini. Coba lagi.' }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
