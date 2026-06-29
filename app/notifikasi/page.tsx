'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// Data notifikasi gabungan super lengkap untuk semua role
const initialNotifications = [
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

function NotifikasiContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentRole = searchParams.get('role') || 'Semua'
  
  const [notifications, setNotifications] = useState(initialNotifications)
  const [activeTab, setActiveTab] = useState('Semua Notifikasi') // Tab filter status, BUKAN role orang lain

  // 1. ISOLASI ROLE: Pengguna HANYA bisa melihat notifikasi untuk role-nya sendiri + universal ('Semua')
  const roleIsolatedNotifs = notifications.filter(n => n.targetRole === 'Semua' || n.targetRole.toLowerCase() === currentRole.toLowerCase())

  // 2. FILTER TAB STATUS (Semua, Belum Dibaca, Penting)
  const filteredNotifs = roleIsolatedNotifs.filter(n => {
    if (activeTab === 'Belum Dibaca') return n.unread
    if (activeTab === 'Penting') return n.type === 'urgent' || n.type === 'warning'
    return true
  })

  const unreadCount = roleIsolatedNotifs.filter(n => n.unread).length

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, unread: false } : n))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => (n.targetRole === 'Semua' || n.targetRole.toLowerCase() === currentRole.toLowerCase()) ? { ...n, unread: false } : n))
  }

  const clearNotifications = () => {
    setNotifications(notifications.filter(n => !(n.targetRole === 'Semua' || n.targetRole.toLowerCase() === currentRole.toLowerCase())))
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-12 animate-in fade-in duration-200">
      {/* Header Eksklusif Mobile */}
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

      {/* Tab Filter Status (Bukan Filter Role) */}
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

      {/* Konten Daftar Notifikasi */}
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
                  n.unread ? 'bg-blue-50/20 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'
                }`}
              >
                {/* Icon Badge */}
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

                {/* Konten */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className={`text-xs sm:text-sm font-bold truncate ${n.unread ? 'text-gray-900' : 'text-gray-700'}`}>
                      {n.title}
                    </p>
                    <span className="text-[10px] sm:text-xs font-semibold text-gray-400 shrink-0">{n.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{n.desc}</p>
                  
                  {n.unread && (
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

          {filteredNotifs.length > 0 && (
            <div className="p-4 bg-slate-50 border-t border-gray-100 text-center">
              <button
                onClick={clearNotifications}
                className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors px-4 py-2 hover:bg-red-50 rounded-xl"
              >
                Bersihkan Semua Notifikasi
              </button>
            </div>
          )}
        </div>
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
