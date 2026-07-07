'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import UserProfileModal from '../shared/UserProfileModal'

interface PeminjamSidebarProps {
  sidebarOpen: boolean
  activeNav: string
  setActiveNav: (nav: string) => void
  setSidebarOpen?: (open: boolean) => void
  sessionUser?: { id: string; name: string; role: string } | null
}

export default function PeminjamSidebar({ sidebarOpen, activeNav, setActiveNav, setSidebarOpen, sessionUser }: PeminjamSidebarProps) {
  const router = useRouter()
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  const displayName = sessionUser?.name || 'Peminjam'
  const displayRole = sessionUser?.role || 'Peminjam'
  const displayInitials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  const menus = [
    { name: 'Katalog Alat', shortName: 'Katalog', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { name: 'Tiket Saya', shortName: 'Tiket', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
    { name: 'Riwayat Pinjam', shortName: 'Riwayat', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  ]

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
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Peminjam Dashboard</p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
          {menus.map((m) => {
            const isActive = activeNav === m.name
            return (
              <button
                key={m.name}
                onClick={() => {
                  setActiveNav(m.name);
                  if (window.innerWidth < 1024 && setSidebarOpen) {
                    setSidebarOpen(false);
                  }
                }}
                className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
                }`}
              >
                <div className={`shrink-0 flex items-center justify-center ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2.5 : 2} d={m.icon} />
                  </svg>
                </div>
                {sidebarOpen && (
                  <span className="ml-3 text-sm tracking-wide truncate">
                    {m.name}
                  </span>
                )}
              </button>
            )
          })}
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

      {/* Mobile Bottom Navbar (4 Tabs Grid) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 md:hidden grid grid-cols-4 px-2 py-1.5 shadow-lg">
        {menus.map((item) => {
          const isActive = activeNav === item.name
          return (
            <button
              key={item.name}
              onClick={() => setActiveNav(item.name)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all relative group ${
                isActive ? 'bg-blue-50 text-blue-700 font-bold shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'
              }`}
            >
              <div className={`shrink-0 flex items-center justify-center ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2.5 : 2} d={item.icon} />
                </svg>
              </div>
              <span className="text-[10px] text-center leading-tight mt-1 truncate w-full">
                {item.shortName}
              </span>
            </button>
          )
        })}
        
        {/* Tab "Profil" */}
        <button
          onClick={() => setIsProfileModalOpen(true)}
          className="flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all relative group text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium"
        >
          <div className="shrink-0 flex items-center justify-center text-gray-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <span className="text-[10px] text-center leading-tight mt-1 truncate w-full">
            Profil
          </span>
        </button>
      </nav>

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
