import React from 'react'

interface SidebarProps {
  sidebarOpen: boolean
  activeNav: string
  setActiveNav: (nav: string) => void
  setSidebarOpen?: (open: boolean) => void
  pendingCount: number
}

function NavIcon({ label, active }: { label: string; active: boolean }) {
  const cls = active ? 'text-blue-600' : 'text-gray-500'
  switch (label) {
    case 'Verifikasi Pinjam':
      return (
        <svg className={`w-5 h-5 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'Master Aset':
      return (
        <svg className={`w-5 h-5 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    case 'Kelola Pengguna':
      return (
        <svg className={`w-5 h-5 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    case 'Analitik':
      return (
        <svg className={`w-5 h-5 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    case 'Riwayat Peminjaman':
      return (
        <svg className={`w-5 h-5 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      )
    case 'Riwayat Pemeliharaan':
      return (
        <svg className={`w-5 h-5 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    default:
      return null
  }
}

const mainNavItems = [
  { label: 'Verifikasi Pinjam' },
  { label: 'Master Aset' },
  { label: 'Kelola Pengguna' },
  { label: 'Analitik' },
]

const bottomNavItems = [
  { label: 'Riwayat Peminjaman' },
  { label: 'Riwayat Pemeliharaan' },
]

export default function Sidebar({ sidebarOpen, activeNav, setActiveNav, setSidebarOpen, pendingCount }: SidebarProps) {
  const renderNavItems = (items: { label: string }[]) => {
    return items.map((item) => {
      const isActive = activeNav === item.label
      return (
        <button
          key={item.label}
          onClick={() => {
            setActiveNav(item.label)
            if (window.innerWidth < 1024 && setSidebarOpen) {
              setSidebarOpen(false)
            }
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
            isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <NavIcon label={item.label} active={isActive} />
          {sidebarOpen && <span className="truncate">{item.label}</span>}
          {sidebarOpen && item.label === 'Verifikasi Pinjam' && pendingCount > 0 && (
            <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${
              isActive ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-700'
            }`}>
              {pendingCount}
            </span>
          )}
        </button>
      )
    })
  }

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && setSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-20 xl:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside className={`fixed xl:relative z-30 h-full ${sidebarOpen ? 'w-64 translate-x-0' : 'w-64 xl:w-20 -translate-x-full xl:translate-x-0'} shrink-0 flex flex-col bg-white border-r border-gray-200 transition-all duration-300`}>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-base font-bold tracking-tight text-gray-900">SIARTA</p>
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Area Head</p>
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {renderNavItems(mainNavItems)}
          
          <div className="my-4 border-t border-gray-200"></div>
          
          {renderNavItems(bottomNavItems)}
        </nav>

        {sidebarOpen && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-blue-600 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-white">AH</span>
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-gray-900 truncate">John Doe</p>
                <p className="text-xs text-gray-500 truncate">Area Head</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
