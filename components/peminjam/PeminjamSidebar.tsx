import React from 'react'

interface PeminjamSidebarProps {
  sidebarOpen: boolean
  activeNav: string
  setActiveNav: (nav: string) => void
}

export default function PeminjamSidebar({ sidebarOpen, activeNav, setActiveNav }: PeminjamSidebarProps) {
  const menus = [
    { name: 'Katalog Alat', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { name: 'Tiket Saya', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
    { name: 'Riwayat Pinjam', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  ]

  return (
    <aside className={`bg-white border-r border-gray-200 transition-all duration-300 flex flex-col shrink-0 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
      <div className="h-16 flex items-center justify-center border-b border-gray-200 shrink-0">
        <div className={`w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm transition-all duration-300`}>
          P
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        {menus.map((m) => (
          <button
            key={m.name}
            onClick={() => setActiveNav(m.name)}
            className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group ${
              activeNav === m.name
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <div className={`shrink-0 flex items-center justify-center ${activeNav === m.name ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeNav === m.name ? 2.5 : 2} d={m.icon} />
              </svg>
            </div>
            {sidebarOpen && (
              <span className={`ml-3 text-sm tracking-wide ${activeNav === m.name ? 'font-bold' : 'font-medium'}`}>
                {m.name}
              </span>
            )}
          </button>
        ))}
      </nav>
      
      <div className="p-4 border-t border-gray-100">
        <div className={`bg-gray-50 rounded-xl p-3 flex items-center gap-3 border border-gray-100 ${sidebarOpen ? '' : 'justify-center'}`}>
          <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
            AH
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-900 truncate">Ahmad</p>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider truncate">Operasional</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
