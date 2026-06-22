'use client'

import { useRouter } from 'next/navigation'

interface TopHeaderProps {
  sidebarOpen: boolean
  setSidebarOpen: (val: boolean) => void
  userName?: string
  roleName?: string
}

export default function TopHeader({ sidebarOpen, setSidebarOpen, userName, roleName }: TopHeaderProps) {
  const router = useRouter()

  return (
    <header className="flex items-center justify-between px-4 sm:px-8 py-4 bg-white border-b border-gray-200 shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 hidden sm:block">Portal SIARTA</h1>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {userName && (
          <div className="hidden md:block text-right mr-4 border-r border-gray-200 pr-4">
            <p className="text-sm font-extrabold text-gray-900">Selamat datang, {userName}</p>
            {roleName && <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">{roleName}</p>}
          </div>
        )}
        {/* Global Search Bar Removed */}
        <button className="p-2 rounded text-gray-500 hover:bg-gray-100 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
        <div className="w-px h-6 bg-gray-200 mx-1"></div>
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 p-2 rounded text-red-600 hover:bg-red-50 transition-colors font-medium text-sm"
          title="Keluar dari sistem"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden sm:block">Keluar</span>
        </button>
      </div>
    </header>
  )
}
