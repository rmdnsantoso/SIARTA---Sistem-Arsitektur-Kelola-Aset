'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import FaceScanner from './FaceScanner'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loginStep, setLoginStep] = useState<'credentials' | 'face_scan'>('credentials')
  const [targetRole, setTargetRole] = useState<'admin' | 'areahead' | 'peminjam' | 'hsse' | null>(null)

  const proceedToFaceScan = (role: 'admin' | 'areahead' | 'peminjam' | 'hsse') => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setTargetRole(role)
      setLoginStep('face_scan')
    }, 800)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Basic role simulation based on email
    if (email.toLowerCase().includes('admin')) {
      proceedToFaceScan('admin')
    } else {
      proceedToFaceScan('areahead')
    }
  }

  const handleQuickLogin = (role: 'admin' | 'areahead' | 'peminjam' | 'hsse') => {
    proceedToFaceScan(role)
  }

  const handleFaceScanSuccess = () => {
    if (targetRole) {
      if (targetRole === 'admin') router.push('/admin')
      if (targetRole === 'areahead') router.push('/areahead')
      if (targetRole === 'peminjam') router.push('/peminjam')
      if (targetRole === 'hsse') router.push('/hsse')
    }
  }

  if (loginStep === 'face_scan') {
    return (
      <div className="w-full max-w-sm mx-auto">
        <FaceScanner 
          onSuccess={handleFaceScanSuccess} 
          onCancel={() => setLoginStep('credentials')} 
        />
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm animate-fade-in mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Masuk ke SIARTA</h2>
        <p className="mt-2 text-sm text-gray-500"> 
          Masukkan kredensial Anda untuk melanjutkan.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              placeholder="johndoe@example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Kata Sandi
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600 cursor-pointer">
              Ingat sesi ini
            </label>
          </div>

          <div className="text-sm">
            <a href="#" className="font-semibold text-blue-600 hover:text-blue-800 transition-colors">
              Lupa sandi?
            </a>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-2"
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Memverifikasi...
            </span>
          ) : (
            'Masuk'
          )}
        </button>
      </form>

      {/* Simulasi Tombol Login Multi-Role */}
      <div className="mt-8 border-t border-gray-200 pt-6">
        <p className="text-[10px] text-gray-500 mb-3 uppercase tracking-wider font-semibold">
          Akses Mode Uji Coba
        </p>
        <div className="grid grid-cols-2 gap-2">
          {['admin', 'peminjam', 'hsse', 'areahead'].map((role) => (
            <button
              key={role}
              onClick={() => handleQuickLogin(role as any)}
              type="button"
              className="w-full inline-flex justify-center py-2 px-3 border border-gray-300 rounded-md shadow-sm bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors capitalize"
            >
              {role === 'areahead' ? 'Area Head' : role}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
