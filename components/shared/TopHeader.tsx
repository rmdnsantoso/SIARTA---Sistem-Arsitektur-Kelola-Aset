'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface TopHeaderProps {
  sidebarOpen: boolean
  setSidebarOpen: (val: boolean) => void
  userName?: string
  roleName?: string
  hideHamburgerOnMobile?: boolean
  hideNotificationBell?: boolean
  customNotificationNode?: React.ReactNode
}

// Data notifikasi default berbasis role & universal
const defaultNotifications = [
  {
    id: 1,
    title: 'Pembaruan Sistem SIARTA v2.4',
    desc: 'Fitur pelacakan Non-Serialized dengan QR Master berhasil diluncurkan.',
    time: '10 mnt lalu',
    unread: true,
    type: 'info',
    targetRole: 'Semua'
  },
  {
    id: 2,
    title: 'Verifikasi Pengembalian Selesai',
    desc: 'Budi telah mengembalikan 2 unit Gas Detector (AST-001) dalam kondisi baik.',
    time: '1 jam lalu',
    unread: true,
    type: 'success',
    targetRole: 'Admin'
  },
  {
    id: 3,
    title: 'Peringatan Stok Kritis!',
    desc: 'Stok APAR di Gudang Timur tersisa 3 unit. Segera ajukan pengadaan baru.',
    time: '2 jam lalu',
    unread: true,
    type: 'urgent',
    targetRole: 'Admin'
  },
  {
    id: 4,
    title: 'Menunggu Persetujuan Area Head',
    desc: 'Pengajuan pinjaman 15 unit Safety Harness untuk Proyek BUMN menunggu approval akhir Anda.',
    time: '15 mnt lalu',
    unread: true,
    type: 'urgent',
    targetRole: 'Area Head'
  },
  {
    id: 5,
    title: 'Laporan Pemanfaatan Aset Bulanan',
    desc: 'Tingkat utilisasi alat berat bulan ini mencapai 88%. Efisiensi operasional meningkat.',
    time: '1 jam lalu',
    unread: false,
    type: 'success',
    targetRole: 'Area Head'
  },
  {
    id: 6,
    title: 'Inspeksi Keselamatan Terjadwal',
    desc: 'Ada 5 unit APAR dan Gas Detector yang membutuhkan verifikasi kelayakan keselamatan kerja minggu ini.',
    time: '20 mnt lalu',
    unread: true,
    type: 'urgent',
    targetRole: 'HSSE'
  },
  {
    id: 7,
    title: 'Laporan Audit Investigasi HSSE',
    desc: 'Dokumen panduan standar inspeksi alat berat terbaru telah ditambahkan ke pustaka sistem.',
    time: '2 jam lalu',
    unread: false,
    type: 'info',
    targetRole: 'HSSE'
  },
  {
    id: 8,
    title: 'Pengajuan Pinjam Disetujui',
    desc: 'Tiket pinjaman TIK-102 (Helm Safety) telah disetujui. Ambil di Gudang Utama.',
    time: '30 mnt lalu',
    unread: true,
    type: 'success',
    targetRole: 'Peminjam'
  },
  {
    id: 9,
    title: 'Peringatan Masa Aktif Pinjaman',
    desc: 'Tiket pinjaman TIK-101 (Gas Detector) akan jatuh tempo besok. Harap kembalikan tepat waktu.',
    time: '1 jam lalu',
    unread: true,
    type: 'warning',
    targetRole: 'Peminjam'
  },
  {
    id: 10,
    title: 'Jadwal Pemeliharaan Berkala',
    desc: '5 unit Bor Listrik memasuki siklus inspeksi kelistrikan wajib bulan ini.',
    time: '3 jam lalu',
    unread: false,
    type: 'warning',
    targetRole: 'Semua'
  },
]

export default function TopHeader({ sidebarOpen, setSidebarOpen, userName, roleName, hideHamburgerOnMobile, hideNotificationBell, customNotificationNode }: TopHeaderProps) {
  const router = useRouter()
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState(defaultNotifications)

  // Filter notifikasi yang sesuai dengan role aktif saat ini (atau 'Semua')
  const currentRoleMatch = roleName ? (
    roleName.toLowerCase().includes('admin') ? 'Admin' :
    roleName.toLowerCase().includes('area') || roleName.toLowerCase().includes('manajer') || roleName.toLowerCase().includes('manajemen') ? 'Area Head' :
    roleName.toLowerCase().includes('hsse') ? 'HSSE' :
    roleName.toLowerCase().includes('peminjam') ? 'Peminjam' : 'Semua'
  ) : 'Semua'

  const filteredNotifs = notifications.filter(n => n.targetRole === 'Semua' || n.targetRole === currentRoleMatch)
  const unreadCount = filteredNotifs.filter(n => n.unread).length

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, unread: false } : n))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => (n.targetRole === 'Semua' || n.targetRole === currentRoleMatch) ? { ...n, unread: false } : n))
  }

  return (
    <header className="flex items-center justify-between px-4 sm:px-8 py-4 bg-white border-b border-gray-200 shrink-0 relative">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`p-2 rounded text-gray-500 hover:bg-gray-100 transition-colors ${hideHamburgerOnMobile ? 'hidden md:block' : ''}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div>
          <h1 className={`text-xl font-bold text-gray-900 ${hideHamburgerOnMobile ? 'block' : 'hidden sm:block'}`}>Portal SIARTA</h1>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        {userName && (
          <div className="hidden md:block text-right mr-2 sm:mr-4 border-r border-gray-200 pr-4">
            <p className="text-sm font-extrabold text-gray-900">Selamat datang, {userName}</p>
            {roleName && <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">{roleName}</p>}
          </div>
        )}

        {/* Universal & Role-Based Notification Toggle */}
        {customNotificationNode ? (
          customNotificationNode
        ) : !hideNotificationBell ? (
          <div className="relative">
            <button 
              onClick={() => {
                if (window.innerWidth < 1024) {
                  router.push('/notifikasi?role=' + encodeURIComponent(roleName || 'Semua'))
                } else {
                  setShowNotifications(!showNotifications)
                }
              }}
              className={`relative p-2 rounded-xl transition-all ${showNotifications ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
              title="Notifikasi Sistem"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
              )}
            </button>

            {/* Dropdown Notifikasi */}
            {showNotifications && (
              <div className="fixed right-3 top-16 w-[290px] sm:absolute sm:inset-auto sm:right-0 sm:top-12 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Header */}
                <div className="p-3 sm:p-4 bg-slate-50 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <h3 className="text-xs sm:text-sm font-extrabold text-gray-900">Notifikasi Sistem</h3>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold bg-blue-600 text-white rounded-full">
                        {unreadCount} Baru
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead} 
                      className="text-[10px] sm:text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Tandai dibaca
                    </button>
                  )}
                </div>

                {/* Body */}
                <div className="max-h-[280px] sm:max-h-[360px] overflow-y-auto divide-y divide-gray-100">
                  {filteredNotifs.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-xs">Belum ada notifikasi baru.</div>
                  ) : (
                    filteredNotifs.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => markAsRead(n.id)}
                        className={`p-3 sm:p-4 transition-all cursor-pointer hover:bg-slate-50/80 flex items-start gap-2.5 sm:gap-3 ${n.unread ? 'bg-blue-50/30' : ''}`}
                      >
                        {/* Icon badge */}
                        <div className={`p-1.5 sm:p-2 rounded-xl shrink-0 mt-0.5 ${
                          n.type === 'urgent' ? 'bg-red-100 text-red-600' :
                          n.type === 'success' ? 'bg-green-100 text-green-600' :
                          n.type === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {n.type === 'urgent' && <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                          {n.type === 'success' && <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
                          {n.type === 'warning' && <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                          {n.type === 'info' && <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1.5 mb-1">
                            <p className={`text-[11px] sm:text-xs font-bold truncate ${n.unread ? 'text-gray-900' : 'text-gray-600'}`}>{n.title}</p>
                            <span className="text-[9px] sm:text-[10px] font-semibold text-gray-400 shrink-0">{n.time}</span>
                          </div>
                          <p className="text-[10px] sm:text-xs text-gray-500 leading-relaxed line-clamp-2">{n.desc}</p>
                          {n.unread && (
                            <span className="inline-block w-1.5 h-1.5 bg-blue-600 rounded-full mt-1"></span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                {filteredNotifs.length > 0 && (
                  <div className="p-2.5 sm:p-3 bg-slate-50 border-t border-gray-100 text-center">
                    <button 
                      onClick={() => setNotifications(notifications.filter(n => !(n.targetRole === 'Semua' || n.targetRole === currentRoleMatch)))}
                      className="text-[11px] sm:text-xs font-bold text-red-600 hover:text-red-700 transition-colors"
                    >
                      Bersihkan Semua Notifikasi
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}

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

