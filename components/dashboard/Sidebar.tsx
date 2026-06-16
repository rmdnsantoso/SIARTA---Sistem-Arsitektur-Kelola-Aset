import { navItems } from '../../lib/dummyData'

interface SidebarProps {
  sidebarOpen: boolean
  activeNav: string
  setActiveNav: (nav: string) => void
  pendingCount: number
}

function NavIcon({ label, active }: { label: string; active: boolean }) {
  const cls = active ? 'text-blue-600' : 'text-gray-500'
  if (label === 'Dasbor') return (
    <svg className={`w-5 h-5 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
  if (label === 'Aset') return (
    <svg className={`w-5 h-5 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  )
  if (label === 'Analitik') return (
    <svg className={`w-5 h-5 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
  return (
    <svg className={`w-5 h-5 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

export default function Sidebar({ sidebarOpen, activeNav, setActiveNav, pendingCount }: SidebarProps) {
  return (
    <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} shrink-0 flex flex-col bg-white border-r border-gray-200 transition-all duration-300`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden">
            <p className="text-base font-bold tracking-tight text-gray-900">SIARTA</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = activeNav === item.label
          return (
            <button
              key={item.label}
              onClick={() => setActiveNav(item.label)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <NavIcon label={item.label} active={isActive} />
              {sidebarOpen && <span className="truncate">{item.label}</span>}
              {sidebarOpen && item.label === 'Persetujuan' && pendingCount > 0 && (
                <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-700'
                }`}>
                  {pendingCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* User Card */}
      {sidebarOpen && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-white">AH</span>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-gray-900 truncate">John Doe.</p>
              <p className="text-xs text-gray-500 truncate">Area Head</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
