'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    setTimeout(() => {
      // Basic role simulation based on email
      if (email.toLowerCase().includes('admin')) {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    }, 1500)
  }

  const handleQuickLogin = (role: 'admin' | 'areahead') => {
    setIsLoading(true)
    setTimeout(() => {
      if (role === 'admin') router.push('/admin')
      if (role === 'areahead') router.push('/dashboard')
    }, 1000)
  }

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Masuk ke SIARTA</h2>
        <p className="mt-2 text-sm text-gray-500">
          Sistem Arsitektur Kelola Aset
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Email Korporat
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            placeholder="nama@perusahaan.com"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Kata Sandi
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            placeholder="••••••••"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Ingat saya
            </label>
          </div>

          <div className="text-sm">
            <a href="#" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
              Lupa kata sandi?
            </a>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Memproses...
            </span>
          ) : (
            'Masuk ke Dasbor'
          )}
        </button>
      </form>

      {/* Simulasi Tombol Login Multi-Role */}
      <div className="mt-8 border-t border-gray-200 pt-6">
        <p className="text-xs text-center text-gray-500 mb-4 uppercase tracking-wider font-semibold">
          Testing Mode
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => handleQuickLogin('admin')}
            type="button"
            className="w-full inline-flex justify-center py-2 px-3 border border-gray-300 rounded-md shadow-sm bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Admin
          </button>
          <button
            onClick={() => {
              setIsLoading(true);
              setTimeout(() => router.push('/peminjam'), 1000);
            }}
            type="button"
            className="w-full inline-flex justify-center py-2 px-3 border border-gray-300 rounded-md shadow-sm bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Peminjam
          </button>
          <button
            onClick={() => {
              setIsLoading(true);
              setTimeout(() => router.push('/hsse'), 1000);
            }}
            type="button"
            className="w-full inline-flex justify-center py-2 px-3 border border-gray-300 rounded-md shadow-sm bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            HSSE
          </button>
          <button
            onClick={() => handleQuickLogin('areahead')}
            type="button"
            className="w-full inline-flex justify-center py-2 px-3 border border-gray-300 rounded-md shadow-sm bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Area Head
          </button>
        </div>
      </div>
    </div>
  )
}
