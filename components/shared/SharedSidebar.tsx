'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import UserProfileModal from './UserProfileModal'

export interface SharedSidebarProps {
  sidebarOpen: boolean
  activeNav: string
  setActiveNav: (nav: string) => void
  setSidebarOpen?: (open: boolean) => void
  pendingCount?: number
  sessionUser?: { id: string; name: string; role: string } | null
  dashboardTitle: string
  mainNavItems: { label: string }[]
  bottomNavItems?: { label: string }[]
  mobilePrimaryTabs: { label: string; shortLabel: string }[]
  mobileMoreItems?: { label: string }[]
}

/* ------------------------------------------------------------------ */
/*  Design tokens — formal pastel-blue identity for PGN COM / SIARTA  */
/* ------------------------------------------------------------------ */
const palette = {
  bgSoft: '#F6FAFD',
  border: '#DCE8F2',
  borderStrong: '#C9DCEA',
  activeBg: '#E7F1FA',
  activeText: '#2C5B82',
  accent: '#4E85B8',
  accentDark: '#1F3A54',
  gold: '#B4924F',
  textPrimary: '#1F3A54',
  textMuted: '#5C7690',
  textFaint: '#8FA4B8',
  navy: '#16324A',
}

/* ------------------------------------------------------------------ */
/*  Role accents — same muted "dusty" family as the base palette.     */
/*  Only small, personal elements pick these up (active nav state,    */
/*  avatar, role chip). Sidebar shell, logo, and borders stay neutral */
/*  so every role still reads as one consistent, formal product.      */
/* ------------------------------------------------------------------ */
type RoleTheme = {
  accent: string
  activeBg: string
  activeText: string
  navy: string
  chipBg: string
  chipText: string
}

const roleThemes: Record<string, RoleTheme> = {
  peminjam: {
    accent: '#4E85B8',
    activeBg: '#E7F1FA',
    activeText: '#2C5B82',
    navy: '#1F3A54',
    chipBg: '#E7F1FA',
    chipText: '#2C5B82',
  },
  admin: {
    accent: '#5B5FA8',
    activeBg: '#ECEBF7',
    activeText: '#40437F',
    navy: '#32356B',
    chipBg: '#ECEBF7',
    chipText: '#40437F',
  },
  hsse: {
    accent: '#3E8574',
    activeBg: '#E7F3F0',
    activeText: '#2C6355',
    navy: '#1F4A40',
    chipBg: '#E7F3F0',
    chipText: '#2C6355',
  },
  areahead: {
    accent: '#8B4A52',
    activeBg: '#F5EBEC',
    activeText: '#6B3941',
    navy: '#5C2E35',
    chipBg: '#F5EBEC',
    chipText: '#6B3941',
  },
}

function getRoleTheme(role?: string | null): RoleTheme {
  const key = (role || '').toLowerCase().replace(/[\s_-]/g, '')
  return roleThemes[key] || roleThemes.peminjam
}

function NavIcon({ label, active, accentColor }: { label: string; active: boolean; accentColor: string }) {
  const cls = active ? '' : 'group-hover:opacity-80'
  const strokeWidth = active ? 2.2 : 1.75
  const style = { color: active ? accentColor : palette.textMuted }

  switch (label) {
    case 'Dasbor Utama':
    case 'Katalog Alat':
      return (
        <svg className={`w-5 h-5 ${cls}`} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    case 'Kelola Pengguna':
      return (
        <svg className={`w-5 h-5 ${cls}`} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    case 'Master Aset':
      return (
        <svg className={`w-5 h-5 ${cls}`} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    case 'Verifikasi Pinjam':
      return (
        <svg className={`w-5 h-5 ${cls}`} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'Pengembalian Aset':
      return (
        <svg className={`w-5 h-5 ${cls}`} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      )
    case 'Riwayat Peminjaman':
      return (
        <svg className={`w-5 h-5 ${cls}`} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      )
    case 'Riwayat Pemeliharaan':
    case 'Riwayat Pinjam':
      return (
        <svg className={`w-5 h-5 ${cls}`} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'Analitik':
      return (
        <svg className={`w-5 h-5 ${cls}`} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    case 'Pemeliharaan Aset':
      return (
        <svg className={`w-5 h-5 ${cls}`} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    case 'Tiket Saya':
      return (
        <svg className={`w-5 h-5 ${cls}`} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      )
    default:
      return null
  }
}

export default function SharedSidebar({
  sidebarOpen,
  activeNav,
  setActiveNav,
  setSidebarOpen,
  pendingCount = 0,
  sessionUser,
  dashboardTitle,
  mainNavItems,
  bottomNavItems = [],
  mobilePrimaryTabs,
  mobileMoreItems = []
}: SharedSidebarProps) {
  const router = useRouter()
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  const displayName = sessionUser?.name || 'User'
  const rawRole = sessionUser?.role || 'User'
  const displayRole = rawRole === 'AreaHead' ? 'Area Head' : rawRole
  const displayInitials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  const theme = getRoleTheme(rawRole)

  const isMoreActive = mobileMoreItems.some(item => item.label === activeNav)

  const renderNavItems = (items: { label: string }[]) => {
    return items.map((item) => {
      const isActive = activeNav === item.label
      return (
        <div key={item.label} className="relative">
          {isActive && (
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full"
              style={{ backgroundColor: theme.accent }}
              aria-hidden="true"
            />
          )}
          <button
            onClick={() => {
              setActiveNav(item.label)
              if (window.innerWidth < 1024 && setSidebarOpen) {
                setSidebarOpen(false)
              }
            }}
            className="w-full flex items-center p-3 rounded-lg transition-all duration-200 group"
            style={{
              backgroundColor: isActive ? theme.activeBg : 'transparent',
              color: isActive ? theme.activeText : '#475569',
              fontWeight: isActive ? 600 : 500,
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.backgroundColor = palette.bgSoft
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <div className="shrink-0 flex items-center justify-center">
              <NavIcon label={item.label} active={isActive} accentColor={theme.accent} />
            </div>
            {sidebarOpen && (
              <span className="ml-3 text-sm tracking-wide truncate">
                {item.label}
              </span>
            )}
            {sidebarOpen && item.label === 'Verifikasi Pinjam' && pendingCount > 0 && (
              <span
                className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                style={{ backgroundColor: '#B0433D' }}
              >
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      )
    })
  }

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside
        className={`hidden md:flex fixed md:relative z-30 h-full ${sidebarOpen ? 'w-64' : 'w-20'} shrink-0 flex-col bg-white transition-all duration-300`}
        style={{ borderRight: `1px solid ${palette.border}` }}
      >
        {/* Brand header */}
        <div
          className={`flex flex-col items-center border-b ${sidebarOpen ? 'px-6 py-6' : 'px-3 py-6'}`}
          style={{ borderColor: palette.border, background: `linear-gradient(180deg, ${palette.bgSoft} 0%, #FFFFFF 100%)` }}
        >
          {sidebarOpen ? (
            <img
              src="/pgn-logo-full.png"
              alt="PGN COM"
              className="h-8 w-auto object-contain"
              draggable={false}
            />
          ) : (
            <div
              className="w-14 h-10 rounded-lg flex items-center justify-center px-1.5"
              style={{ backgroundColor: palette.activeBg }}
            >
              <img
                src="/pgn-icon.png"
                alt="PGN COM"
                className="max-h-5 w-auto object-contain"
                draggable={false}
              />
            </div>
          )}
          {sidebarOpen && (
            <>
              <div className="mt-4 mb-2.5 h-px w-9" style={{ backgroundColor: palette.gold, opacity: 0.55 }} />
              <p
                className="text-[10px] font-semibold text-center"
                style={{ color: palette.textMuted, letterSpacing: '0.16em' }}
              >
                {dashboardTitle.toUpperCase()}
              </p>
            </>
          )}
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto overscroll-y-contain">
          {renderNavItems(mainNavItems)}

          {bottomNavItems.length > 0 && (
            <>
              <div className="my-4 border-t" style={{ borderColor: palette.border }}></div>
              {renderNavItems(bottomNavItems)}
            </>
          )}
        </nav>

        <div className="p-4 border-t" style={{ borderColor: palette.border, backgroundColor: palette.bgSoft }}>
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className={`flex items-center gap-3 w-full p-1.5 rounded-lg transition-colors text-left ${!sidebarOpen ? 'justify-center' : ''}`}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.activeBg)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            title="Profil dan ganti kata sandi"
          >
            <div
              className="w-9 h-9 rounded flex items-center justify-center shrink-0"
              style={{ backgroundColor: theme.navy }}
            >
              <span className="text-sm font-bold text-white">{displayInitials}</span>
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden w-full">
                <p
                  className="text-sm font-semibold break-words whitespace-pre-wrap leading-tight mb-1"
                  style={{ color: palette.textPrimary }}
                >
                  {displayName}
                </p>
                <span
                  className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: theme.chipBg, color: theme.chipText }}
                >
                  {displayRole}
                </span>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navbar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md md:hidden grid px-1 py-1.5 shadow-lg"
        style={{
          borderTop: `1px solid ${palette.border}`,
          gridTemplateColumns: `repeat(${mobilePrimaryTabs.length + 1}, minmax(0, 1fr))`,
        }}
      >
        {mobilePrimaryTabs.map((item) => {
          const isActive = activeNav === item.label && !showMoreMenu
          return (
            <button
              key={item.label}
              onClick={() => {
                setActiveNav(item.label)
                setShowMoreMenu(false)
              }}
              className="flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-all relative group"
              style={{
                backgroundColor: isActive ? theme.activeBg : 'transparent',
                color: isActive ? theme.activeText : '#64748B',
                fontWeight: isActive ? 600 : 500,
              }}
            >
              <NavIcon label={item.label} active={isActive} accentColor={theme.accent} />
              <span className="text-[10px] text-center leading-tight mt-1 truncate w-full">
                {item.shortLabel}
              </span>
              {item.label === 'Verifikasi Pinjam' && pendingCount > 0 && (
                <span
                  className="absolute top-1 right-2 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow-sm"
                  style={{ backgroundColor: '#B0433D' }}
                >
                  {pendingCount}
                </span>
              )}
            </button>
          )
        })}

        {/* Tab "Lainnya" (selalu ada karena menampung Profil) */}
        <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-all relative"
            style={{
              backgroundColor: showMoreMenu || isMoreActive ? theme.activeBg : 'transparent',
              color: showMoreMenu || isMoreActive ? theme.activeText : '#64748B',
              fontWeight: showMoreMenu || isMoreActive ? 600 : 500,
            }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
            <span className="text-[10px] text-center leading-tight mt-1 truncate w-full">
              Lainnya
            </span>
            {isMoreActive && !showMoreMenu && (
              <span
                className="absolute top-2 right-3 w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: theme.accent }}
              ></span>
            )}
          </button>
      </nav>

      {/* Mobile "Lainnya" Bottom Sheet Modal */}
      {showMoreMenu && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={() => setShowMoreMenu(false)}
        >
          <div
            className="absolute bottom-[72px] left-4 right-4 bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
            style={{ border: `1px solid ${palette.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="px-5 py-4 border-b flex items-center justify-between"
              style={{ borderColor: palette.border, backgroundColor: palette.bgSoft }}
            >
              <span className="font-bold text-sm" style={{ color: palette.textPrimary }}>
                Menu Lainnya
              </span>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1 rounded-full transition-colors"
                style={{ color: palette.textFaint }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-2">
              {mobileMoreItems.map((item) => {
                const isActive = activeNav === item.label
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      setActiveNav(item.label)
                      setShowMoreMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors"
                    style={{
                      backgroundColor: isActive ? theme.activeBg : 'transparent',
                      color: isActive ? theme.activeText : '#334155',
                      fontWeight: isActive ? 600 : 500,
                    }}
                  >
                    <NavIcon label={item.label} active={isActive} accentColor={theme.accent} />
                    <span className="text-sm">{item.label}</span>
                  </button>
                )
              })}
              
              <button
                onClick={() => {
                  setIsProfileModalOpen(true)
                  setShowMoreMenu(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors mt-1"
                style={{
                  backgroundColor: 'transparent',
                  borderTop: mobileMoreItems.length > 0 ? `1px solid ${palette.border}` : 'none'
                }}
              >
                <div
                  className="w-9 h-9 rounded flex items-center justify-center shrink-0"
                  style={{ backgroundColor: theme.navy }}
                >
                  <span className="text-sm font-bold text-white">{displayInitials}</span>
                </div>
                <div className="overflow-hidden w-full">
                  <p
                    className="text-sm font-semibold break-words whitespace-pre-wrap leading-tight mb-1"
                    style={{ color: palette.textPrimary }}
                  >
                    {displayName}
                  </p>
                  <span
                    className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: theme.chipBg, color: theme.chipText }}
                  >
                    {displayRole}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userId={sessionUser?.id || ''}
        userName={sessionUser?.name || 'User'}
        roleName={sessionUser?.role || 'User'}
      />
    </>
  )
}
