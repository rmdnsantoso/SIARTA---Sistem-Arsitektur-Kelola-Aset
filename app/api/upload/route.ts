import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Get file extension safely
    const originalName = file.name || 'upload.jpg'
    const ext = path.extname(originalName) || '.jpg'
    const fileName = `${crypto.randomUUID()}${ext}`

    // Upload path
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'assets')
    
    // Ensure directory exists
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (e) {
      // Ignore if exists
    }

    const filePath = path.join(uploadDir, fileName)
    await writeFile(filePath, buffer)

    // Public URL
    const fileUrl = `/uploads/assets/${fileName}`

    return NextResponse.json({ url: fileUrl })
  } catch (error: any) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan saat mengunggah file' }, { status: 500 })
  }
}
