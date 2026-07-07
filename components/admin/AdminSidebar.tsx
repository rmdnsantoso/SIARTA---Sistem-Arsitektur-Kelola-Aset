'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import UserProfileModal from '../shared/UserProfileModal'

interface AdminSidebarProps {
  sidebarOpen: boolean
  activeNav: string
  setActiveNav: (nav: string) => void
  setSidebarOpen?: (open: boolean) => void
  pendingCount: number
  sessionUser?: { id: string; name: string; role: string } | null
}

function NavIcon({ label, active }: { label: string; active: boolean }) {
  const cls = active ? 'text-blue-600' : 'text-gray-500'
  switch (label) {
    case 'Dasbor Utama':
      return (
        <svg className={`w-5 h-5 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    case 'Kelola Pengguna':
      return (
        <svg className={`w-5 h-5 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    case 'Master Aset':
      return (
        <svg className={`w-5 h-5 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    case 'Verifikasi Pinjam':
      return (
        <svg className={`w-5 h-5 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )

    case 'Pengembalian Aset':
      return (
        <svg className={`w-5 h-5 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
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
    case 'Analitik':
      return (
        <svg className={`w-5 h-5 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    case 'Pemeliharaan Aset':
      return (
        <svg className={`w-5 h-5 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    default:
      return null
  }
}

const mainNavItems = [
  { label: 'Verifikasi Pinjam' },
  { label: 'Pengembalian Aset' },
  { label: 'Master Aset' },
  { label: 'Pemeliharaan Aset' },
  { label: 'Kelola Pengguna' },
  { label: 'Analitik' },
]

const bottomNavItems = [
  { label: 'Riwayat Peminjaman' },
  { label: 'Riwayat Pemeliharaan' },
]

export default function AdminSidebar({ sidebarOpen, activeNav, setActiveNav, setSidebarOpen, pendingCount, sessionUser }: AdminSidebarProps) {
  const router = useRouter()
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  const displayName = sessionUser?.name || 'Admin'
  const displayRole = sessionUser?.role || 'Admin'
  const displayInitials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  const renderNavItems = (items: { label: string }[]) => {
    return items.map((item) => {
      const isActive = activeNav === item.label
      return (
        <button
          key={item.label}
          onClick={() => {
            setActiveNav(item.label);
            if (window.innerWidth < 1024 && setSidebarOpen) {
              setSidebarOpen(false);
            }
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
            isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <NavIcon label={item.label} active={isActive} />
          {sidebarOpen && <span className="truncate">{item.label}</span>}
          {sidebarOpen && item.label === 'Verifikasi Pinjam' && pendingCount > 0 && (
            <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500 text-white">
              {pendingCount}
            </span>
          )}
        </button>
      )
    })
  }

  const mobilePrimaryTabs = [
    { label: 'Verifikasi Pinjam', shortLabel: 'Verifikasi' },
    { label: 'Pengembalian Aset', shortLabel: 'Kembali' },
    { label: 'Master Aset', shortLabel: 'Master' },
    { label: 'Analitik', shortLabel: 'Analitik' },
  ]

  const mobileMoreItems = [
    { label: 'Pemeliharaan Aset' },
    { label: 'Kelola Pengguna' },
    { label: 'Riwayat Peminjaman' },
    { label: 'Riwayat Pemeliharaan' },
  ]

  const isMoreActive = mobileMoreItems.some(item => item.label === activeNav)

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside className={`hidden md:flex fixed md:relative z-30 h-full ${sidebarOpen ? 'w-64' : 'w-20'} shrink-0 flex-col bg-white border-r border-gray-200 transition-all duration-300`}>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-base font-bold tracking-tight text-gray-900">SIARTA</p>
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Administrator Dashboard</p>
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto overscroll-y-contain">
          {renderNavItems(mainNavItems)}
          
          <div className="my-4 border-t border-gray-200"></div>
          
          {renderNavItems(bottomNavItems)}
        </nav>

        {sidebarOpen && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-3 w-full hover:bg-gray-200/50 p-1.5 rounded-lg transition-colors text-left"
            >
              <div className="w-9 h-9 rounded bg-blue-600 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-white">{displayInitials}</span>
              </div>
              <div className="overflow-hidden w-full">
                <p className="text-sm font-semibold text-gray-900 break-words whitespace-pre-wrap leading-tight mb-0.5">{displayName}</p>
                <p className="text-xs text-gray-500 break-words">{displayRole}</p>
              </div>
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Bottom Navbar (5 Tabs Grid) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 md:hidden grid grid-cols-5 px-1 py-1.5 shadow-lg">
        {mobilePrimaryTabs.map((item) => {
          const isActive = activeNav === item.label && !showMoreMenu
          return (
            <button
              key={item.label}
              onClick={() => {
                setActiveNav(item.label)
                setShowMoreMenu(false)
              }}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative group ${
                isActive ? 'bg-blue-50 text-blue-700 font-bold shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'
              }`}
            >
              <NavIcon label={item.label} active={isActive} />
              <span className="text-[10px] text-center leading-tight mt-1 truncate w-full">
                {item.shortLabel}
              </span>
              {item.label === 'Verifikasi Pinjam' && pendingCount > 0 && (
                <span className="absolute top-1 right-2 bg-red-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>
          )
        })}

        {/* Tab "Lainnya" */}
        <button
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative ${
            showMoreMenu || isMoreActive ? 'bg-blue-50 text-blue-700 font-bold shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'
          }`}
        >
          <svg className={`w-5 h-5 ${showMoreMenu || isMoreActive ? 'text-blue-600' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
          <span className="text-[10px] text-center leading-tight mt-1 truncate w-full">
            Lainnya
          </span>
          {isMoreActive && !showMoreMenu && (
            <span className="absolute top-2 right-3 w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
          )}
        </button>
      </nav>

      {/* Mobile "Lainnya" Bottom Sheet Modal */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm md:hidden transition-opacity duration-300" onClick={() => setShowMoreMenu(false)}>
          <div 
            className="absolute bottom-[72px] left-4 right-4 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <span className="font-bold text-gray-900 text-sm">Menu Lainnya</span>
              <button onClick={() => setShowMoreMenu(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-full">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-2 space-y-1">
              {mobileMoreItems.map((item) => {
                const isActive = activeNav === item.label
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      setActiveNav(item.label)
                      setShowMoreMenu(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <NavIcon label={item.label} active={isActive} />
                    <span>{item.label}</span>
                  </button>
                )
              })}
              
              <div className="my-2 border-t border-gray-100"></div>
              
              <button
                onClick={() => {
                  setShowMoreMenu(false)
                  setIsProfileModalOpen(true)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors text-gray-600 hover:bg-gray-50"
              >
                <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-white">{displayInitials}</span>
                </div>
                <div className="flex flex-col items-start overflow-hidden">
                  <span className="text-sm font-bold text-gray-900 break-words text-left leading-tight mb-0.5">{displayName}</span>
                  <span className="text-[10px] text-gray-500">{displayRole}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userId={sessionUser?.id || ''}
        userName={displayName}
        roleName={displayRole}
      />
    </>
  )
}
