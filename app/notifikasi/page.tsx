'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { getMyNotifications, markMyNotificationAsRead, markAllMyNotificationsAsRead, deleteMyNotification, deleteAllMyNotifications } from '../../actions/core/notification'
import { usePolling } from '../../hooks/usePolling'

// Format waktu sederhana
const formatTime = (dateString: string) => {
  const d = new Date(dateString)
  const diff = Math.floor((Date.now() - d.getTime()) / 60000)
  if (diff < 1) return 'Baru saja'
  if (diff < 60) return `${diff} mnt lalu`
  if (diff < 1440) return `${Math.floor(diff/60)} jam lalu`
  return `${Math.floor(diff/1440)} hari lalu`
}

function NotifikasiContent() {
  const router = useRouter()
  
  const [dbNotifs, setDbNotifs] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('Semua Notifikasi')

  const fetchNotifications = async () => {
    try {
      const res = await getMyNotifications()
      if (res.success && 'data' in res && res.data) {
        setDbNotifs(res.data)
      }
    } catch (err) {
      console.warn('Silent fail fetching notifications', err)
    }
  }

  usePolling(fetchNotifications, 15000)

  // 2. FILTER TAB STATUS (Semua, Belum Dibaca, Penting)
  const filteredNotifs = dbNotifs.filter(n => {
    if (activeTab === 'Belum Dibaca') return !n.isRead
    if (activeTab === 'Penting') return n.type === 'urgent' || n.type === 'warning'
    return true
  })

  const unreadCount = dbNotifs.filter(n => !n.isRead).length

  const markAsRead = async (id: string) => {
    setDbNotifs(dbNotifs.map(n => n.id === id ? { ...n, isRead: true } : n))
    await markMyNotificationAsRead(id)
  }

  const markAllAsRead = async () => {
    setDbNotifs(dbNotifs.map(n => ({ ...n, isRead: true })))
    await markAllMyNotificationsAsRead()
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setDbNotifs(dbNotifs.filter(n => n.id !== id))
    await deleteMyNotification(id)
  }

  const handleDeleteAll = async () => {
    setDbNotifs([])
    await deleteAllMyNotifications()
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-12 animate-in fade-in duration-200">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors flex items-center justify-center"
            title="Kembali"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Notifikasi Sistem</h1>
            {unreadCount > 0 && (
              <p className="text-xs text-blue-600 font-semibold mt-0.5">{unreadCount} notifikasi belum dibaca</p>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors px-3 py-1.5 bg-blue-50 rounded-lg hover:bg-blue-100"
          >
            Tandai dibaca
          </button>
        )}
      </header>

      <div className="bg-white border-b border-gray-200 px-4 py-2 sticky top-[65px] z-40 shadow-sm overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2 min-w-max">
          {['Semua Notifikasi', 'Belum Dibaca', 'Penting'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
          {filteredNotifs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <p className="text-sm font-bold text-gray-700">Belum ada notifikasi {activeTab.toLowerCase()}</p>
              <p className="text-xs text-gray-500 mt-1">Notifikasi yang masuk untuk Anda akan tampil di sini.</p>
            </div>
          ) : (
            filteredNotifs.map(n => (
              <div
                key={n.id}
                onClick={() => markAsRead(n.id)}
                className={`p-4 sm:p-5 transition-all cursor-pointer hover:bg-slate-50 flex items-start gap-3.5 ${
                  !n.isRead ? 'bg-blue-50/20 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'
                }`}
              >
                <div
                  className={`p-2.5 rounded-2xl shrink-0 mt-0.5 ${
                    n.type === 'urgent'
                      ? 'bg-red-100 text-red-600'
                      : n.type === 'success'
                      ? 'bg-green-100 text-green-600'
                      : n.type === 'warning'
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}
                >
                  {n.type === 'urgent' && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                  {n.type === 'success' && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {n.type === 'warning' && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {n.type === 'info' && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className={`text-xs sm:text-sm font-bold truncate ${!n.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                      {n.title}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] sm:text-xs font-semibold text-gray-400">{formatTime(n.createdAt)}</span>
                      <button 
                        onClick={(e) => handleDelete(e, n.id)} 
                        className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors" 
                        title="Hapus Notifikasi"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{n.message}</p>
                  
                  {!n.isRead && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span> Baru
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {dbNotifs.length > 0 && (
          <div className="mt-6 flex justify-center">
            <button 
              onClick={handleDeleteAll}
              className="text-xs sm:text-sm font-bold text-red-500 hover:text-red-600 transition-colors w-full bg-white border border-gray-200 shadow-sm rounded-xl py-3 text-center active:bg-red-50"
            >
              Hapus Semua Notifikasi
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default function NotifikasiPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm font-semibold text-gray-500">Memuat notifikasi...</div>}>
      <NotifikasiContent />
    </Suspense>
  )
}
