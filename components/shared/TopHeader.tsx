'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, deleteAllNotifications } from '../../actions/core/notification'
import { logoutUser } from '../../actions/core/auth'
import { usePolling } from '../../hooks/usePolling'

interface TopHeaderProps {
  sidebarOpen: boolean
  setSidebarOpen: (val: boolean) => void
  userId?: string
  userName?: string
  roleName?: string
  hideHamburgerOnMobile?: boolean
  hideNotificationBell?: boolean
  customNotificationNode?: React.ReactNode
  /** Dipanggil saat ada notifikasi baru masuk (unread count naik) — untuk trigger refresh data di parent */
  onNewNotification?: () => void
}

export default function TopHeader({ sidebarOpen, setSidebarOpen, userId, userName, roleName, hideHamburgerOnMobile, hideNotificationBell, customNotificationNode, onNewNotification }: TopHeaderProps) {
  const router = useRouter()
  const [showNotifications, setShowNotifications] = useState(false)
  
  // State from backend
  const [dbNotifs, setDbNotifs] = useState<any[]>([])
  // Ref untuk track unread count sebelumnya — deteksi notif baru
  const prevUnreadRef = useState<number>(0)
  
  // Format waktu sederhana
  const formatTime = (dateString: string) => {
    const d = new Date(dateString)
    const diff = Math.floor((Date.now() - d.getTime()) / 60000)
    if (diff < 1) return 'Baru saja'
    if (diff < 60) return `${diff} mnt lalu`
    if (diff < 1440) return `${Math.floor(diff/60)} jam lalu`
    return `${Math.floor(diff/1440)} hari lalu`
  }

  const fetchNotifications = async () => {
    if (!roleName) return
    try {
      const res = await getUserNotifications(userId || '', roleName)
      if (res.success && res.data) {
        const newNotifs: any[] = res.data
        const newUnread = newNotifs.filter((n: any) => !n.isRead).length
        const prevUnread = prevUnreadRef[0]
        // Jika ada notifikasi baru (unread naik), trigger refresh data di parent
        if (newUnread > prevUnread && onNewNotification) {
          onNewNotification()
        }
        prevUnreadRef[1](newUnread)
        setDbNotifs(newNotifs)
      }
    } catch (err) {
      console.warn('Silent fail fetching notifications', err)
    }
  }

  // Polling interval menggunakan custom hook (15 detik)
  usePolling(fetchNotifications, 15000, [userId, roleName])

  // Hitung jumlah yang belum dibaca dari dbNotifs
  const unreadCount = dbNotifs.filter(n => !n.isRead).length

  const markAsRead = async (id: string) => {
    // Optimistic UI update
    setDbNotifs(dbNotifs.map(n => n.id === id ? { ...n, isRead: true } : n))
    await markNotificationAsRead(id)
  }

  const markAllAsRead = async () => {
    if (!userId || !roleName) return
    setDbNotifs(dbNotifs.map(n => ({ ...n, isRead: true })))
    await markAllNotificationsAsRead(userId, roleName)
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    // Optimistic UI update
    setDbNotifs(dbNotifs.filter(n => n.id !== id))
    await deleteNotification(id)
  }

  const handleDeleteAll = async () => {
    if (!userId) return
    setDbNotifs([])
    await deleteAllNotifications(userId)
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
            {roleName && <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">{roleName === 'AreaHead' ? 'Area Head' : roleName}</p>}
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
                  {dbNotifs.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-xs">Belum ada notifikasi baru.</div>
                  ) : (
                    dbNotifs.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => markAsRead(n.id)}
                        className={`p-3 sm:p-4 transition-all cursor-pointer hover:bg-slate-50/80 flex items-start gap-2.5 sm:gap-3 ${!n.isRead ? 'bg-blue-50/30' : ''}`}
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
                            <p className={`text-[11px] sm:text-xs font-bold truncate ${!n.isRead ? 'text-gray-900' : 'text-gray-600'}`}>{n.title}</p>
                            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                              <span className="text-[9px] sm:text-[10px] font-semibold text-gray-400">{formatTime(n.createdAt)}</span>
                              <button 
                                onClick={(e) => handleDelete(e, n.id)} 
                                className="text-gray-400 hover:text-red-500 p-0.5 rounded transition-colors" 
                                title="Hapus Notifikasi"
                              >
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          <p className="text-[10px] sm:text-xs text-gray-500 leading-relaxed line-clamp-2">{n.message}</p>
                          {!n.isRead && (
                            <span className="inline-block w-1.5 h-1.5 bg-blue-600 rounded-full mt-1"></span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                {dbNotifs.length > 0 && (
                  <div className="p-2.5 sm:p-3 bg-slate-50 border-t border-gray-100 flex justify-center">
                    <button 
                      onClick={handleDeleteAll}
                      className="text-[11px] sm:text-xs font-bold text-red-500 hover:text-red-600 transition-colors w-full text-center py-1"
                    >
                      Hapus Semua Notifikasi
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}

        <div className="w-px h-6 bg-gray-200 mx-1"></div>
        <button
          onClick={async () => {
            await logoutUser()
            localStorage.removeItem('admin_activeNav')
            localStorage.removeItem('peminjam_activeNav')
            localStorage.removeItem('areahead_activeNav')
            localStorage.removeItem('hsse_activeNav')
            router.refresh()
            router.push('/')
          }}
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

