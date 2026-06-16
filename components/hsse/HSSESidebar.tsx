import React from 'react'

interface HSSESidebarProps {
  sidebarOpen: boolean
  activeNav: string
  setActiveNav: (nav: string) => void
  pendingCount?: number
}

export default function HSSESidebar({ sidebarOpen, activeNav, setActiveNav, pendingCount = 0 }: HSSESidebarProps) {
  const menus = [
    { name: 'Verifikasi Safety', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { name: 'Analitik Keselamatan', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  ]

  return (
    <aside className={`bg-white border-r border-gray-200 transition-all duration-300 flex flex-col shrink-0 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
      <div className="h-16 flex items-center justify-center border-b border-gray-200 shrink-0">
        <div className={`w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm transition-all duration-300`}>
          H
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        {menus.map((m) => (
          <button
            key={m.name}
            onClick={() => setActiveNav(m.name)}
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
              <span className={`ml-3 text-sm tracking-wide ${activeNav === m.name ? 'font-bold' : 'font-medium'}`}>
                {m.name}
              </span>
            )}
            
            {m.name === 'Verifikasi Safety' && pendingCount > 0 && (
              <span className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center min-w-[20px] h-5 rounded-full text-[10px] font-bold ${
                activeNav === m.name ? 'bg-green-200 text-green-800' : 'bg-red-100 text-red-600'
              }`}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </nav>
      
      <div className="p-4 border-t border-gray-100">
        <div className={`bg-gray-50 rounded-xl p-3 flex items-center gap-3 border border-gray-100 ${sidebarOpen ? '' : 'justify-center'}`}>
          <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold text-xs shrink-0">
            DR
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-900 truncate">Hendra</p>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider truncate">HSSE</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
