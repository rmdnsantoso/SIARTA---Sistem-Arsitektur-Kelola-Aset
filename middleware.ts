import { NextRequest, NextResponse } from 'next/server'

// ─── Route-to-Role mapping ────────────────────────────────────────────────────

const PROTECTED_ROUTES: Record<string, string> = {
  '/admin': 'Admin',
  '/hsse': 'HSSE',
  '/areahead': 'AreaHead',
  '/peminjam': 'Peminjam',
}

const ROLE_HOME: Record<string, string> = {
  'Admin': '/admin',
  'HSSE': '/hsse',
  'AreaHead': '/areahead',
  'Peminjam': '/peminjam',
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Tentukan route yang diakses
  const matchedPrefix = Object.keys(PROTECTED_ROUTES).find(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  )

  // Bukan route yang dilindungi → lanjutkan
  if (!matchedPrefix) {
    return NextResponse.next()
  }

  const requiredRole = PROTECTED_ROUTES[matchedPrefix]

  // Baca cookie session iron-session
  const cookieValue = request.cookies.get('siarta_session')?.value

  // Tidak ada cookie → redirect ke halaman login
  if (!cookieValue) {
    const loginUrl = new URL('/', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Decode cookie iron-session (format: <sealed_data>)
  // iron-session menggunakan format khusus yang bisa kita decode sebagian untuk cek role
  // Untuk lebih aman, kita dekripsi menggunakan unsealData dari iron-session
  try {
    // Dinamis import untuk kompatibilitas Edge Runtime
    const { unsealData } = await import('iron-session')
    const sessionPassword = process.env.SESSION_SECRET || 'siarta-inventaris-secret-key-2025-very-long-and-secure'
    
    const session = await unsealData<{ user?: { role: string } }>(cookieValue, {
      password: sessionPassword,
    })

    const userRole = session?.user?.role

    // Cookie ada tapi tidak valid (tidak ada user di session)
    if (!userRole) {
      const loginUrl = new URL('/', request.url)
      return NextResponse.redirect(loginUrl)
    }

    // Role salah → redirect ke halaman yang sesuai role
    if (userRole !== requiredRole) {
      const home = ROLE_HOME[userRole] || '/'
      return NextResponse.redirect(new URL(home, request.url))
    }

    // Semua oke → lanjutkan
    return NextResponse.next()
  } catch (e) {
    // Cookie rusak, expired, atau password salah → redirect ke login
    const loginUrl = new URL('/', request.url)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: ['/admin/:path*', '/hsse/:path*', '/areahead/:path*', '/peminjam/:path*'],
}
