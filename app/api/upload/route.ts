import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import path from 'path'

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

    // ── Simpan file ke Supabase Storage ────────────────────────────────────────
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileName = `${crypto.randomUUID()}${ext}`

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Konfigurasi Supabase Storage belum diatur (NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY).' }, { status: 500 })
    }

    // Menggunakan package standar @supabase/supabase-js
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { error: uploadError } = await supabase.storage
      .from('assets')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json({ error: 'Gagal mengunggah file ke cloud storage.' }, { status: 500 })
    }

    const { data: publicUrlData } = supabase.storage
      .from('assets')
      .getPublicUrl(fileName)

    return NextResponse.json({ url: publicUrlData.publicUrl })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan saat mengunggah file.'
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
