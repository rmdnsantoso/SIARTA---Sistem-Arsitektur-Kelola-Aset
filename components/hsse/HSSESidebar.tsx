import React from 'react'

interface HSSESidebarProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  activeNav: string
  setActiveNav: (nav: string) => void
  pendingCount?: number
}

export default function HSSESidebar({ sidebarOpen, setSidebarOpen, activeNav, setActiveNav, pendingCount = 0 }: HSSESidebarProps) {
  const mainMenus = [
  { name: 'Verifikasi Peminjaman', icon: '...' },
  { name: 'Pengembalian Aset', icon: '...' },
  { name: 'Master Aset', icon: '...' },
  { name: 'Pemeliharaan Aset', icon: '...' },
]

const historyMenus = [
  { name: 'Riwayat Peminjaman', icon: '...' },
  { name: 'Riwayat Pemeliharaan', icon: '...' },
]
  return (
    
    <aside
  className={`bg-white border-r border-gray-200 transition-all duration-300 flex flex-col shrink-0
  fixed md:static z-40 h-screen
  ${sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-20'}`}
>
      <div className="h-16 flex items-center justify-center border-b border-gray-200 shrink-0">
        <div className={`w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm transition-all duration-300`}>
          H
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 overflow-y-auto">

  {/* Menu Utama */}
  <div className="space-y-1.5">
{mainMenus.map((m) => (
  <button
    key={m.name}
    onClick={() => {
      setActiveNav(m.name);
      // Logika untuk menutup sidebar di layar mobile/tablet
      if (window.innerWidth < 768 && setSidebarOpen) {
        setSidebarOpen(false);
      }
    }}
    className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group relative ${
      activeNav === m.name
        ? 'bg-green-50 text-green-700'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`}
  >
            <div className={`shrink-0 flex items-center justify-center ${activeNav === m.name ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeNav === m.name ? 2.5 : 2} d={m.icon} />
              </svg>
            </div>
            {sidebarOpen && (
              <span
  className={`ml-3 text-sm tracking-wide ${
    activeNav === m.name ? 'font-bold' : 'font-medium'
  }`}
>
  {m.name}
</span>
            )}
            
            {sidebarOpen && m.name === 'Verifikasi Peminjaman' && pendingCount > 0 && (
              <span className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center min-w-[20px] h-5 rounded-full text-[10px] font-bold ${
                activeNav === m.name ? 'bg-green-200 text-green-800' : 'bg-red-100 text-red-600'
              }`}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}

              </div>

      {/* Garis Pembatas */}
      <div className="my-4 border-t border-gray-200"></div>

      {/* Menu Riwayat */}
      <div className="space-y-1.5">
{historyMenus.map((m) => (
  <button
    key={m.name}
    onClick={() => {
      setActiveNav(m.name);
      // Logika untuk menutup sidebar di layar mobile/tablet
      if (window.innerWidth < 768 && setSidebarOpen) {
        setSidebarOpen(false);
      }
    }}
    className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group relative ${
      activeNav === m.name
        ? 'bg-green-50 text-green-700'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`}
  >
            <div
              className={`shrink-0 flex items-center justify-center ${
                activeNav === m.name
                  ? 'text-green-600'
                  : 'text-gray-400 group-hover:text-gray-600'
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={activeNav === m.name ? 2.5 : 2}
                  d={m.icon}
                />
              </svg>
            </div>

            {sidebarOpen && (
              <span
  className={`ml-3 text-sm tracking-wide ${
    activeNav === m.name ? 'font-bold' : 'font-medium'
  }`}
>
                {m.name}
              </span>
            )}
            
          </button>
        ))}
      </div>
      
      </nav>
      
      <div className="p-4 border-t border-gray-100">
        <div className={`bg-gray-50 rounded-xl p-3 flex items-center gap-3 border border-gray-100 ${sidebarOpen ? '' : 'justify-center'}`}>
          <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold text-xs shrink-0">
            DR
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden hidden md:block">
              <p className="text-sm font-bold hidden md:block text-gray-900 truncate">Hendra</p>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider truncate">HSSE</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}