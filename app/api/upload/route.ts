import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

// ── Whitelist tipe file yang diizinkan (hanya gambar) ─────────────────────────
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(request: NextRequest) {
  try {
    // ── Autentikasi: Hanya user yang sudah login ───────────────────────────────
    const { getSession } = await import('../../../lib/session')
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized: Silakan login terlebih dahulu.' }, { status: 401 })
    }

    // ── Hanya Admin dan HSSE yang boleh upload ─────────────────────────────────
    if (!['Admin', 'HSSE'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden: Role Anda tidak diizinkan melakukan upload.' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah.' }, { status: 400 })
    }

    // ── Validasi ukuran file ───────────────────────────────────────────────────
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Ukuran file terlalu besar. Maksimal 5 MB.' }, { status: 400 })
    }

    // ── Validasi tipe MIME ─────────────────────────────────────────────────────
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Tipe file tidak diizinkan. Hanya gambar (JPG, PNG, WEBP, GIF).' }, { status: 400 })
    }

    // ── Validasi ekstensi (double-check dari nama file) ────────────────────────
    const originalName = file.name || 'upload.jpg'
    const ext = path.extname(originalName).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ error: 'Ekstensi file tidak diizinkan.' }, { status: 400 })
    }

    // ── Simpan file dengan nama acak kriptografis ──────────────────────────────
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileName = `${crypto.randomUUID()}${ext}`

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'assets')
    await mkdir(uploadDir, { recursive: true })

    const filePath = path.join(uploadDir, fileName)
    await writeFile(filePath, buffer)

    const fileUrl = `/uploads/assets/${fileName}`

    return NextResponse.json({ url: fileUrl })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan saat mengunggah file.'
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
