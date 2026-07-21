'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginWithCredentials } from '../../actions/core/user'
import FaceScanner from './FaceScanner'

type RoleKey = 'admin' | 'peminjam' | 'hsse' | 'areahead'

const roleQuickAccess: {
  key: RoleKey
  label: string
  icon: React.ReactNode
  bg: string
  iconColor: string
  textColor: string
  role: 'Admin' | 'Peminjam' | 'HSSE' | 'AreaHead'
  description: string
}[] = [
  {
    key: 'admin',
    label: 'Admin',
    role: 'Admin',
    description: 'Kelola inventaris & aset',
    bg: '#ECEBF7',
    iconColor: '#5B5FA8',
    textColor: '#40437F',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'peminjam',
    label: 'Peminjam',
    role: 'Peminjam',
    description: 'Pinjam & kelola pinjaman',
    bg: '#E7F1FA',
    iconColor: '#4E85B8',
    textColor: '#2C5B82',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    key: 'hsse',
    label: 'Hsse',
    role: 'HSSE',
    description: 'Pantau keamanan & K3',
    bg: '#E7F3F0',
    iconColor: '#3E8574',
    textColor: '#2C6355',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" />
      </svg>
    ),
  },
  {
    key: 'areahead',
    label: 'Area Head',
    role: 'AreaHead',
    description: 'Monitoring & kelola area',
    bg: '#F5EBEC',
    iconColor: '#8B4A52',
    textColor: '#6B3941',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
]

function getRoleRoute(role: string): string {
  switch (role) {
    case 'Admin':    return '/admin'
    case 'HSSE':     return '/hsse'
    case 'AreaHead': return '/areahead'
    default:         return '/peminjam'
  }
}

type View = 'form' | 'face'

export default function LoginForm() {
  const router = useRouter()
  const [view, setView] = useState<View>('form')

  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [quickLoading, setQuickLoading] = useState<RoleKey | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  // Face state
  // faceUserId no longer needed as the server tracks pre-auth sessions via cookie

  // ── Submit form login ───────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setIsSubmitting(true)
    try {
      const res = await loginWithCredentials(email.trim(), password)
      if (res.success && res.user) {
        if (res.user.faceRegistered && !res.sessionCreated) {
          // Wajah terdaftar → ganti view ke FaceScanner (tanpa popup)
          setView('face')
        } else {
          router.push(getRoleRoute(res.user.role as string))
        }
      } else {
        setErrorMsg(res.error || 'Email atau password salah.')
      }
    } catch {
      setErrorMsg('Terjadi kesalahan. Coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }


  // ── Face callbacks ──────────────────────────────────────────────────────────
  const handleFaceSuccess = (user?: { name: string; email: string; role: string }) => {
    router.push(getRoleRoute(user?.role ?? 'Peminjam'))
  }

  const handleFaceCancel = () => {
    setView('form')
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VIEW: Face Scanner — mengisi seluruh panel kanan, tanpa modal/popup/backdrop
  // ─────────────────────────────────────────────────────────────────────────────
  if (view === 'face') {
    return (
      <div className="w-full lg:w-[56%] xl:w-[58%] bg-white flex-1 flex items-center justify-center px-6 py-10 sm:px-10 sm:py-12 lg:px-16 animate-[formIn_0.5s_ease-out_both]">
        <style jsx>{`
          @keyframes formIn {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <div className="w-full max-w-[420px]">
          <FaceScanner
            onSuccess={handleFaceSuccess}
            onCancel={handleFaceCancel}
          />
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VIEW: Login Form
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full lg:w-[56%] xl:w-[58%] bg-white flex-1 flex items-center justify-center px-6 py-10 sm:px-10 sm:py-12 lg:px-16 animate-[formIn_0.7s_ease-out_both] relative">
      <style jsx>{`
        @keyframes formIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        /* Sembunyikan ikon reveal password bawaan browser */
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear,
        input[type="password"]::-webkit-credentials-auto-fill-button {
          display: none !important;
        }
      `}</style>

      <div className="w-full max-w-[420px] -mt-16 sm:-mt-24 lg:-mt-12">
        <img
          src="/pgn-logo-full.png"
          alt="PGN COM"
          className="h-6 sm:h-7 w-auto mb-7 sm:mb-8"
          draggable={false}
        />

        <h1 className="text-[26px] sm:text-[30px] font-semibold text-[#232838] leading-snug mb-2">
          Selamat datang<br />kembali.
        </h1>
        <p className="text-[13px] sm:text-sm text-[#8B8FA0] mb-7 sm:mb-8">
          Masuk untuk mengelola aset operasional Anda.
        </p>

        {/* ── Form Login ── */}
        <form onSubmit={handleSubmit} autoComplete="on">
          <div className="mb-3">
            <label htmlFor="email" className="sr-only">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@example.com"
              className="w-full bg-[#F5F6FA] border border-[#E4E6EF] rounded-[10px] px-3.5 py-3 text-[12.5px] text-[#232838] placeholder:text-[#9498AC] outline-none transition-colors focus:border-[#46578C] focus:bg-white"
            />
          </div>

          <div className="mb-3.5 relative">
            <label htmlFor="password" className="sr-only">Kata sandi</label>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              className="w-full bg-[#F5F6FA] border border-[#E4E6EF] rounded-[10px] px-3.5 py-3 pr-10 text-[12.5px] text-[#232838] placeholder:text-[#9498AC] outline-none transition-colors focus:border-[#46578C] focus:bg-white"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9498AC] hover:text-[#5C6690] transition-colors"
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            >
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.774 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="mb-3 px-3 py-2.5 bg-red-50 border border-red-200 rounded-[8px]">
              <p className="text-[11.5px] text-red-600">{errorMsg}</p>
            </div>
          )}



          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#46578C] hover:bg-[#3B4A78] active:scale-[0.99] disabled:opacity-70 rounded-[10px] py-3 text-[13px] font-semibold text-white transition-all mb-5 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Memproses…
              </>
            ) : 'Masuk'}
          </button>

          <div className="flex justify-center mb-5">
            <button 
              type="button" 
              onClick={() => setErrorMsg('Silakan hubungi Admin untuk mereset kata sandi Anda.')}
              className="text-[11.5px] font-medium text-[#46578C] hover:underline"
            >
              Lupa sandi?
            </button>
          </div>
        </form>

      </div>
      
      <p className="absolute bottom-6 left-0 w-full px-8 text-[9px] text-[#B4B7C4] text-center leading-relaxed">
        © 2026 PT PGAS Telekomunikasi Nusantara RO Lampung. All Rights Reserved | Developed by Mahasiswa Kerja Praktik Teknik Informatika ITERA: Audy Olivya Br Gurusinga, Jesika Filosofi Br Perangin-Angin, Muhammad Romadhon S
      </p>
    </div>
  )
}
