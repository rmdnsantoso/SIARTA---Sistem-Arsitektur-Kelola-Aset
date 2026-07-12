'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import FaceScanner from './FaceScanner'
import toast from 'react-hot-toast'
import { loginWithCredentials } from '../../actions/core/user'
import { quickLoginAs } from '../../actions/core/auth'
import { ensureModelsLoaded } from '../../lib/face/utils'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const [loginStep, setLoginStep] = useState<'credentials' | 'face_scan'>('credentials')
  const [authenticatedUser, setAuthenticatedUser] = useState<{ id: string; name: string; email: string; role: string; faceRegistered?: boolean } | null>(null)

  // Preload AI Models quietly in the background
  useEffect(() => {
    ensureModelsLoaded().catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await loginWithCredentials(email, password)
      if (res.success && res.user) {
        if (res.sessionCreated) {
          toast.success('Login berhasil.')
          const role = res.user.role.toLowerCase()
          if (role === 'admin') router.push('/admin')
          else if (role === 'areahead' || role === 'area head') router.push('/areahead')
          else if (role === 'hsse') router.push('/hsse')
          else router.push('/peminjam')
          return
        }

        setAuthenticatedUser({
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          role: res.user.role,
          faceRegistered: res.user.faceRegistered
        })
        setLoginStep('face_scan')
      } else {
        toast.error(res.error || 'Login gagal.')
      }
    } catch (err: any) {
      toast.error('Terjadi kesalahan sistem.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickLogin = async (role: 'admin' | 'peminjam' | 'hsse' | 'areahead') => {
    setIsLoading(true)
    try {
      const roleMap = {
        admin: 'Admin' as const,
        peminjam: 'Peminjam' as const,
        hsse: 'HSSE' as const,
        areahead: 'AreaHead' as const,
      }
      const res = await quickLoginAs(roleMap[role])
      if (res.success) {
        // Testing mode: route langsung setelah session dibuat
        if (role === 'admin') router.push('/admin')
        else if (role === 'areahead') router.push('/areahead')
        else if (role === 'hsse') router.push('/hsse')
        else router.push('/peminjam')
      } else {
        toast.error('Quick login gagal: ' + (res.error || 'Error tidak diketahui'))
        setIsLoading(false)
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat quick login.')
      setIsLoading(false)
    }
  }

  // Dipanggil oleh FaceScanner setelah wajah berhasil dikenali dari DB (atau bypass)
  const handleFaceScanSuccess = (user?: { name: string; email: string; role: string }) => {
    const targetRole = user?.role || authenticatedUser?.role || 'peminjam'
    const role = targetRole.toLowerCase()
    
    if (role === 'admin') router.push('/admin')
    else if (role === 'areahead' || role === 'area head') router.push('/areahead')
    else if (role === 'hsse') router.push('/hsse')
    else router.push('/peminjam')
  }

  if (loginStep === 'face_scan') {
    return (
      <div className="w-full max-w-sm mx-auto">
        <FaceScanner 
          onSuccess={handleFaceScanSuccess} 
          onCancel={() => setLoginStep('credentials')} 
          userId={authenticatedUser?.id}
          skipFaceCheck={authenticatedUser ? !authenticatedUser.faceRegistered : false}
          skipFaceUser={authenticatedUser && !authenticatedUser.faceRegistered ? {
            id: authenticatedUser.id,
            name: authenticatedUser.name || '',
            email: authenticatedUser.email || '',
            role: authenticatedUser.role
          } : undefined}
        />
      </div>
    )
  }


  return (
    <div className="bg-[#0f1f3e]/85 backdrop-blur-xl rounded-[1.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.3)] border-none p-5 sm:p-6 lg:p-7 w-full select-none relative z-20 animate-fade-in-slide-right">
      {/* Welcome Branding */}
      <div className="text-center mb-4">
        <h1 className="text-xl font-extrabold text-white tracking-wide">Selamat Datang</h1>
        <p className="text-[10.5px] font-bold text-blue-200/60 mt-1 tracking-wide">
          Masukkan kredensial Anda untuk melanjutkan.
        </p>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Email Input */}
        <div>
          <label className="block text-[10px] font-extrabold text-blue-200 uppercase tracking-wider mb-1 ml-0.5">
            Email
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-3 text-blue-300/60 pointer-events-none">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="w-full pl-9 pr-3 py-4 bg-blue-950/60 border border-blue-800/60 rounded-2xl text-xs text-white placeholder-blue-300/40 focus:outline-none focus:ring-0 focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.2)] transition-all font-medium disabled:opacity-50"
              placeholder="nama@perusahaan.com"
            />
          </div>
        </div>

        {/* Password Input */}
        <div>
          <label className="block text-[10px] font-extrabold text-blue-200 uppercase tracking-wider mb-1 ml-0.5">
            Kata Sandi
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-3 text-blue-300/60 pointer-events-none">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="w-full pl-9 pr-9 py-4 bg-blue-950/60 border border-blue-800/60 rounded-2xl text-xs text-white placeholder-blue-300/40 focus:outline-none focus:ring-0 focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.2)] transition-all font-medium disabled:opacity-50"
              placeholder="Masukkan kata sandi"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="absolute right-3 text-blue-300/60 hover:text-blue-200 transition-colors"
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Checkbox and Forgot Password */}
        <div className="flex items-center justify-between pt-0.5">
          <label className="flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-500 bg-blue-950 border-blue-800/60 rounded focus:ring-blue-500/20 focus:ring-offset-0"
            />
            <span className="ml-2 text-[11px] font-bold text-blue-200/80">Ingat sesi ini</span>
          </label>
          <a
            href="#"
            className="text-[11px] font-extrabold text-rose-300 hover:text-rose-200 transition-colors"
          >
            Lupa sandi?
          </a>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-1.5 py-4 px-4 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-500 hover:-translate-y-[2px] hover:shadow-[0_12px_30px_rgba(37,99,235,0.25)] active:scale-[0.99] transition-all duration-300 shadow-[0_4px_10px_rgba(37,99,235,0.15)] disabled:opacity-75 disabled:cursor-not-allowed text-xs mt-2"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-1.5">
              <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Memproses...
            </span>
          ) : (
            <>
              <span>Masuk</span>
              <svg className="w-3.5 h-3.5 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>
      </form>

      {/* Akses Cepat Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-blue-800/40"></div>
        </div>
        <div className="relative flex justify-center text-[8.5px] font-bold uppercase tracking-widest">
          <span className="bg-[#0f1f3e] border border-blue-800/40 rounded-full px-3 py-0.5 text-blue-300/70">Atau Pilih Akses Cepat</span>
        </div>
      </div>

      {/* Quick Access Role Buttons Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Admin Card */}
        <button
          type="button"
          onClick={() => handleQuickLogin('admin')}
          disabled={isLoading}
          className="flex items-center gap-2 p-2 rounded-xl border border-slate-700/30 bg-slate-800/20 text-slate-400 hover:border-blue-500/60 hover:bg-blue-500/10 transition-all duration-300 text-left group disabled:opacity-50"
        >
          <div className="w-8 h-8 rounded-full bg-slate-700/30 text-slate-500 group-hover:bg-blue-500/20 group-hover:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-all duration-300">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="overflow-hidden">
            <div className="text-[11px] font-bold text-slate-400 group-hover:text-blue-200 transition-colors duration-300 leading-tight">Admin</div>
            <div className="text-[8.5px] text-slate-500 group-hover:text-blue-300/60 transition-colors duration-300 font-semibold truncate">Kelola sistem & aset</div>
          </div>
        </button>

        {/* Peminjam Card */}
        <button
          type="button"
          onClick={() => handleQuickLogin('peminjam')}
          disabled={isLoading}
          className="flex items-center gap-2 p-2 rounded-xl border border-slate-700/30 bg-slate-800/20 text-slate-400 hover:border-rose-500/50 hover:bg-rose-500/10 transition-all duration-300 text-left group disabled:opacity-50"
        >
          <div className="w-8 h-8 rounded-full bg-slate-700/30 text-slate-500 group-hover:bg-rose-500/20 group-hover:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-all duration-300">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="overflow-hidden">
            <div className="text-[11px] font-bold text-slate-400 group-hover:text-rose-200 transition-colors duration-300 leading-tight">Peminjam</div>
            <div className="text-[8.5px] text-slate-500 group-hover:text-rose-300/60 transition-colors duration-300 font-semibold truncate">Ajukan & kelola pinjam</div>
          </div>
        </button>

        {/* HSSE Card */}
        <button
          type="button"
          onClick={() => handleQuickLogin('hsse')}
          disabled={isLoading}
          className="flex items-center gap-2 p-2 rounded-xl border border-slate-700/30 bg-slate-800/20 text-slate-400 hover:border-pink-500/50 hover:bg-pink-50/10 transition-all duration-300 text-left group disabled:opacity-50"
        >
          <div className="w-8 h-8 rounded-full bg-slate-700/30 text-slate-500 group-hover:bg-pink-500/20 group-hover:text-pink-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-all duration-300">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <div className="overflow-hidden">
            <div className="text-[11px] font-bold text-slate-400 group-hover:text-pink-200 transition-colors duration-300 leading-tight">Hsse</div>
            <div className="text-[8.5px] text-slate-500 group-hover:text-pink-300/60 transition-colors duration-300 font-semibold truncate">Kelola keamanan & K3</div>
          </div>
        </button>

        {/* Area Head Card */}
        <button
          type="button"
          onClick={() => handleQuickLogin('areahead')}
          disabled={isLoading}
          className="flex items-center gap-2 p-2 rounded-xl border border-slate-700/30 bg-slate-800/20 text-slate-400 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all duration-300 text-left group disabled:opacity-50"
        >
          <div className="w-8 h-8 rounded-full bg-slate-700/30 text-slate-500 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-all duration-300">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="overflow-hidden">
            <div className="text-[11px] font-bold text-slate-400 group-hover:text-indigo-200 transition-colors duration-300 leading-tight">Area Head</div>
            <div className="text-[8.5px] text-slate-500 group-hover:text-indigo-300/60 transition-colors duration-300 font-semibold truncate">Monitoring & setuju</div>
          </div>
        </button>
      </div>
    </div>
  )
}
