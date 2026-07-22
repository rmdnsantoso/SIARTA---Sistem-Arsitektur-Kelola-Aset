'use client'

import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import StatCard from '../shared/StatCard'
import { getAllUsers, createUser, updateUser, deleteUser, resetUserPassword, saveFaceDescriptor } from '../../actions/core/user'
import FaceCapture from '../auth/FaceCapture'
import { usePolling } from '../../hooks/usePolling'

type User = {
  id: string
  nip: string
  name: string
  email: string
  wa: string
  jabatan: string
  office: string
  regional: string
  role: string
  status: 'Aktif' | 'Nonaktif'
  faceRegistered?: boolean
}



export default function UserManagement({ isViewOnly = false, currentUserId }: { isViewOnly?: boolean, currentUserId?: string }) {
  const [users, setUsers] = useState<User[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  
  // Detail View State
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editForm, setEditForm] = useState<User | null>(null)

  // ── Modal 2-step state ──
  // step: 'data' → isi form | 'face' → rekam wajah | 'done' → selesai tampilkan password
  const [modalStep, setModalStep] = useState<'data' | 'face' | 'done'>('data')
  const [newUserId, setNewUserId] = useState<string | null>(null)
  const [shownPassword, setShownPassword] = useState<string | null>(null)
  const [passwordCopied, setPasswordCopied] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Add Form State — semua field wajib
  const [addForm, setAddForm] = useState({
    nip: '',
    name: '',
    email: '',
    wa: '',
    jabatan: '',
    office: '',
    regional: 'Jawa Bagian Barat',
    role: 'Peminjam'
  })

  const fetchUsers = async () => {
    try {
      const res = await getAllUsers()
      if (res.success && res.data) {
        const adapted: User[] = res.data.map((dbUser: any) => {
          const roleDisplay = dbUser.role === 'AreaHead' ? 'Area Head' : dbUser.role;
          return {
            id: dbUser.id,
            nip: dbUser.nip || '—',
            name: dbUser.name,
            email: dbUser.email,
            wa: dbUser.wa || '—',
            jabatan: dbUser.jabatan || roleDisplay,
            office: dbUser.office || '—',
            regional: dbUser.regional || '—',
            role: roleDisplay,
            status: dbUser.isActive ? 'Aktif' : 'Nonaktif',
            faceRegistered: dbUser.faceRegistered,
          }
        })
        setUsers(adapted)
      }
    } catch (err) {
      console.warn('Gagal memuat daftar user (polling):', err)
    } finally {
      setInitialLoading(false)
    }
  }

  // Polling data pengguna setiap 15 detik (menggunakan cara yang sudah didiskusikan)
  usePolling(fetchUsers, 15000)

  // ── Step 1: Submit data → create user di DB
  const handleAddUser = async () => {
    const { nip, name, email, wa, jabatan, office, regional } = addForm
    if (!nip || !name || !email || !wa || !jabatan || !office || !regional) {
      toast.error('Semua field wajib diisi!')
      return
    }
    setLoading(true)
    try {
      const roleDb = addForm.role === 'Area Head' ? 'AreaHead' : addForm.role
      const res = await createUser({
        name, email,
        role: roleDb as any,
        nip, wa, jabatan, office, regional,
      })
      if (!res.success) {
        toast.error(`Gagal membuat akun: ${res.error}`)
        return
      }
      if (res.data) {
        setNewUserId(res.data.id)
        setShownPassword((res as any).tempPassword || null)
        // Lanjut ke step rekam wajah
        setModalStep('face')
      }
    } catch (err: any) {
      toast.error(`Terjadi kesalahan: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: Simpan descriptor wajah → selesai
  const handleFaceCaptured = async (descriptor: number[]) => {
    if (!newUserId) return
    const res = await saveFaceDescriptor(newUserId, descriptor)
    if (res.success) {
      setModalStep('done')
      // Refresh list
      const listRes = await getAllUsers()
      if (listRes.success && listRes.data) {
        const adapted: User[] = listRes.data.map((dbUser: any) => ({
          id: dbUser.id,
          nip: dbUser.nip || '—',
          name: dbUser.name,
          email: dbUser.email,
          wa: dbUser.wa || '—',
          jabatan: dbUser.jabatan || dbUser.role,
          office: dbUser.office || '—',
          regional: dbUser.regional || '—',
          role: dbUser.role === 'AreaHead' ? 'Area Head' : dbUser.role,
          status: dbUser.isActive ? 'Aktif' : 'Nonaktif',
          faceRegistered: dbUser.faceRegistered,
        }))
        setUsers(adapted)
      }
    } else {
      toast.error('Gagal menyimpan data wajah. Coba lagi.')
      setModalStep('data')
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setModalStep('data')
    setNewUserId(null)
    setShownPassword(null)
    setPasswordCopied(false)
    setAddForm({ nip: '', name: '', email: '', wa: '', jabatan: '', office: '', regional: 'Jawa Bagian Barat', role: 'Peminjam' })
  }

  const toggleStatus = async (id: string) => {
    const user = users.find(u => u.id === id)
    if (!user) return

    const newIsActive = user.status !== 'Aktif'
    setLoading(true)
    try {
      const res = await updateUser(id, { isActive: newIsActive })
      if (!res.success) {
        toast.error(`Gagal mengubah status akses: ${res.error}`)
        return
      }
      // Update state lokal setelah berhasil disimpan ke DB
      const newStatus = newIsActive ? 'Aktif' : 'Nonaktif'
      setUsers(prev => prev.map(u =>
        u.id === id ? { ...u, status: newStatus } : u
      ))
      if (selectedUser && selectedUser.id === id) {
        setSelectedUser(prev => prev ? { ...prev, status: newStatus } : null)
      }
      toast.success(newIsActive ? 'Akses pengguna dipulihkan.' : 'Akses pengguna diblokir.')
    } catch (err: any) {
      toast.error(`Terjadi kesalahan: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!editForm) return
    setLoading(true)
    try {
      const roleDb = editForm.role === 'Area Head' ? 'AreaHead' : editForm.role;
      const res = await updateUser(editForm.id, {
        name: editForm.name,
        email: editForm.email,
        role: roleDb as any,
        nip: editForm.nip !== '—' ? editForm.nip : undefined,
        wa: editForm.wa !== '—' ? editForm.wa : undefined,
        jabatan: editForm.jabatan !== '—' ? editForm.jabatan : undefined,
        office: editForm.office !== '—' ? editForm.office : undefined,
        regional: editForm.regional !== '—' ? editForm.regional : undefined,
        isActive: editForm.status === 'Aktif',
      })
      if (!res.success) {
        toast.error(`Gagal menyimpan perubahan: ${res.error}`)
        setLoading(false)
        return
      }
      setUsers(prev => prev.map(u => u.id === editForm.id ? editForm : u))
      setSelectedUser(editForm)
      setIsEditMode(false)
    } catch (err: any) {
      toast.error(`Terjadi kesalahan: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id)
  }

  const confirmDelete = async () => {
    if (!deleteConfirmId) return
    setLoading(true)
    try {
      const res = await deleteUser(deleteConfirmId)
      if (!res.success) {
        toast.error(`Gagal menghapus pengguna: ${res.error}`)
        setLoading(false)
        setDeleteConfirmId(null)
        return
      }
      setUsers(prev => prev.filter(u => u.id !== deleteConfirmId))
      setSelectedUser(null)
      setDeleteConfirmId(null)
      toast.success('Pengguna berhasil dihapus.')
    } catch (err: any) {
      toast.error(`Terjadi kesalahan: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!selectedUser) return
    setLoading(true)
    try {
      const res = await resetUserPassword(selectedUser.id)
      if (res.success && res.tempPassword) {
        toast.custom((t) => (
          <div className={`bg-white border border-gray-200 shadow-xl rounded-2xl px-5 py-4 flex flex-col gap-3 max-w-sm w-full ${t.visible ? 'animate-fade-in' : 'opacity-0'}`}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="font-bold text-gray-900 text-sm">Password Berhasil Direset</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
              <p className="text-[10px] text-gray-500 mb-1 uppercase font-bold tracking-wider">Password Baru untuk {selectedUser.name}</p>
              <p className="font-mono font-bold text-lg text-gray-900 tracking-widest">{res.tempPassword}</p>
            </div>
            <p className="text-[11px] text-gray-400">Catat dan berikan password ini kepada pengguna. Tidak akan ditampilkan lagi.</p>
            <button onClick={() => toast.dismiss(t.id)} className="text-xs font-bold text-blue-600 self-end hover:text-blue-700">Tutup</button>
          </div>
        ), { duration: 20000 })
      } else {
        toast.error(res.error || 'Gagal mereset password.')
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const openDetail = (u: User) => {
    setSelectedUser(u)
    setIsEditMode(false)
    setEditForm(u)
  }

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.nip.includes(searchQuery) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const ITEMS_PER_PAGE = 5
  const [currentPage, setCurrentPage] = React.useState(1)

  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const totalUsers = users.length
  const totalNonaktif = users.filter(u => u.status === 'Nonaktif').length

  const stats: Array<{ label: string, value: number, iconPath: string, colorTheme: 'default' | 'blue' | 'green' | 'amber' | 'red' | 'purple' }> = [
    { label: 'Total Pengguna', value: totalUsers, iconPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', colorTheme: 'blue' },
    { label: 'Akun Nonaktif', value: totalNonaktif, iconPath: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636', colorTheme: 'red' },
  ]

  return (
    <div className="font-sans">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 lg:gap-6 mb-6 shrink-0">
        {stats.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
        <div className="p-3 sm:p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 bg-white z-10 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900">
              Manajemen Pengguna {isViewOnly && <span className="text-gray-500 font-normal text-sm ml-1">(View Only)</span>}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Kelola data seluruh admin, Area Head, HSSE, dan peminjam dalam sistem.</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <form className="relative w-full sm:w-auto" autoComplete="off" onSubmit={e => e.preventDefault()}>
              <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                id="searchUser"
                name="searchUser"
                type="text" 
                autoComplete="new-password"
                placeholder="Cari nama, NIP, atau role..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
              />
            </form>
            {!isViewOnly && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-4 sm:px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors whitespace-nowrap shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Registrasi Pengguna
              </button>
            )}
          </div>
      </div>

      <div className="bg-gray-50/50 p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 rounded-b-2xl">
        {/* Header Kolom (Hanya Tampil di Desktop) */}
        <div className="hidden lg:flex items-center px-6 text-xs font-extrabold text-gray-400 uppercase tracking-wider">
          <div className="w-[30%]">Identitas Pengguna</div>
          <div className="w-[25%]">Kontak & Lokasi</div>
          <div className="w-[20%]">Peran (Role)</div>
          <div className="w-[15%]">Status</div>
          <div className="w-[10%] text-right">Aksi</div>
        </div>

        {/* Daftar Pegawai (Berbentuk Card Terpisah) */}
        <div className="space-y-3">
          {initialLoading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-sm font-semibold text-gray-500">Memuat data pengguna...</p>
            </div>
          ) : paginatedUsers.length === 0 ? (
            <div className="py-8 sm:py-12 text-center bg-white rounded-2xl border border-gray-100 border-dashed">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
              <p className="text-gray-500 font-medium">
                {searchQuery 
                  ? `Tidak ada pengguna yang cocok dengan pencarian "${searchQuery}"`
                  : 'Belum ada data pengguna yang terdaftar.'}
              </p>
            </div>
          ) : (
            paginatedUsers.map(u => (
            <div 
              key={u.id} 
              onClick={() => openDetail(u)}
              className="flex flex-col lg:flex-row lg:items-center bg-white p-3 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group gap-2.5 sm:gap-3 lg:gap-0"
            >
              {/* Kolom 1: Identitas & Chevron (Mobile) */}
              <div className="w-full lg:w-[30%] flex items-center justify-between lg:justify-start gap-2.5 sm:gap-3 lg:gap-4">
                <div className="flex items-center gap-2.5 sm:gap-3 lg:gap-4 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full bg-gradient-to-br from-indigo-50 to-blue-100 border-2 border-blue-200 flex items-center justify-center text-blue-700 font-extrabold text-sm sm:text-base lg:text-lg shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    {u.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm lg:text-base font-extrabold text-gray-900 group-hover:text-blue-700 transition-colors truncate">{u.name}</div>
                    <div className="text-xs font-mono font-medium text-gray-500 mt-0.5">
                      NIP: {u.nip} <span className="text-gray-300 mx-1 hidden sm:inline">•</span> <span className="text-gray-400 font-sans block sm:inline mt-0.5 sm:mt-0">{u.jabatan}</span>
                    </div>
                  </div>
                </div>
                {/* Chevron for Mobile Only */}
                <div className="lg:hidden shrink-0">
                  <button className="p-1.5 text-gray-400 bg-gray-50 rounded-full border border-gray-200 shadow-sm group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>

              {/* Desktop Columns (Hidden on Mobile) */}
              <div className="hidden lg:block w-full lg:w-[25%]">
                <div className="text-sm text-gray-700 font-bold truncate">{u.office}</div>
                <div className="text-xs text-gray-500 mt-0.5 truncate">{u.regional}</div>
                <div className="mt-1.5">
                  <span className="inline-flex items-center px-2 py-1 text-[10px] text-gray-600 font-mono bg-gray-50 rounded-md border border-gray-200 shadow-sm font-bold">WA: {u.wa}</span>
                </div>
              </div>

              <div className="hidden lg:flex w-full lg:w-[20%] items-center">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-extrabold border shadow-sm ${
                  u.role === 'Admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                  u.role === 'Area Head' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  u.role === 'HSSE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  'bg-slate-50 text-slate-700 border-slate-200'
                }`}>
                  {u.role}
                </span>
              </div>

              <div className="hidden lg:flex w-full lg:w-[15%] items-center">
                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-extrabold shadow-sm border ${
                  u.status === 'Aktif' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${u.status === 'Aktif' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                  {u.status}
                </span>
              </div>

              <div className="hidden lg:flex w-full lg:w-[10%] justify-end items-center">
                <button className="p-2 text-gray-400 bg-gray-50 rounded-full border border-gray-200 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-colors group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 shadow-sm">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>

              {/* Mobile Only View */}
              <div className="lg:hidden flex flex-col gap-2.5 border-t border-gray-100 pt-3">
                <div className="min-w-0">
                  <div className="text-sm text-gray-700 font-bold truncate">{u.office}</div>
                  <div className="text-xs text-gray-500 truncate">{u.regional}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-extrabold border shadow-sm ${
                    u.role === 'Admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                    u.role === 'Area Head' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    u.role === 'HSSE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    'bg-slate-50 text-slate-700 border-slate-200'
                  }`}>
                    {u.role}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-extrabold shadow-sm border ${
                    u.status === 'Aktif' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${u.status === 'Aktif' ? 'bg-green-500' : 'bg-red-500'}`} />
                    {u.status}
                  </span>
                  <span className="inline-flex items-center px-2 py-1 text-[10px] text-gray-600 font-mono bg-gray-50 rounded-md border border-gray-200 shadow-sm font-bold">
                    WA: {u.wa}
                  </span>
                </div>
              </div>
            </div>
          )))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col lg:flex-row items-center justify-between px-4 sm:px-6 py-4 bg-white rounded-2xl border border-gray-200 shadow-sm gap-4 overflow-hidden w-full">
            <span className="text-xs sm:text-sm text-gray-500 font-medium text-center sm:text-left">
              Menampilkan <span className="font-bold text-gray-900">{Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredUsers.length)}</span> hingga <span className="font-bold text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)}</span> dari <span className="font-bold text-gray-900">{filteredUsers.length}</span> pengguna
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-8 px-3 flex items-center justify-center rounded-lg border border-gray-200 text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-100 bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                Sebelumnya
              </button>
              
              <div className="flex flex-wrap items-center justify-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all shrink-0 ${
                      currentPage === page 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-gray-500 hover:bg-gray-200 bg-transparent'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-8 px-3 flex items-center justify-center rounded-lg border border-gray-200 text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-100 bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DETAIL MODAL (Tengah) */}
      {selectedUser && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[88vh] flex flex-col overflow-hidden transform transition-transform">
            
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 flex items-start justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 border-2 border-white shadow-md flex items-center justify-center text-blue-700 font-extrabold text-lg sm:text-2xl shrink-0">
                  {selectedUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-2xl font-extrabold text-gray-900 tracking-tight truncate">{selectedUser.name}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-sm font-mono text-gray-500 bg-white px-2 py-0.5 rounded-md border border-gray-200 shadow-sm">{selectedUser.nip}</span>
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-widest border shadow-sm ${selectedUser.status === 'Aktif' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                      {selectedUser.status}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-colors bg-white shadow-sm border border-gray-100">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto overscroll-y-contain p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Data Form/View */}
              <div className="space-y-3 sm:space-y-5 bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 shadow-sm">
                <h4 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  Informasi Pengguna
                </h4>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Nama Lengkap</label>
                  {isEditMode ? (
                    <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full border-b-2 border-blue-500 bg-blue-50/50 px-3 py-2.5 text-sm font-bold text-gray-900 outline-none rounded-t-md transition-colors" />
                  ) : (
                    <div className="text-sm font-bold text-gray-900 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-100">{selectedUser.name}</div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Email Akses</label>
                  {isEditMode ? (
                    <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full border-b-2 border-blue-500 bg-blue-50/50 px-3 py-2.5 text-sm font-bold text-gray-900 outline-none rounded-t-md transition-colors" />
                  ) : (
                    <div className="text-sm font-bold text-gray-900 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-100">{selectedUser.email}</div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Jabatan</label>
                  {isEditMode ? (
                    <input type="text" value={editForm.jabatan} onChange={e => setEditForm({...editForm, jabatan: e.target.value})} className="w-full border-b-2 border-blue-500 bg-blue-50/50 px-3 py-2.5 text-sm font-bold text-gray-900 outline-none rounded-t-md transition-colors" />
                  ) : (
                    <div className="text-sm font-bold text-gray-900 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-100">{selectedUser.jabatan}</div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">Office / Base</label>
                    {isEditMode ? (
                      <input type="text" value={editForm.office} onChange={e => setEditForm({...editForm, office: e.target.value})} className="w-full border-b-2 border-blue-500 bg-blue-50/50 px-3 py-2.5 text-sm font-bold text-gray-900 outline-none rounded-t-md transition-colors" />
                    ) : (
                      <div className="text-sm font-bold text-gray-900 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-100">{selectedUser.office}</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">Regional</label>
                    {isEditMode ? (
                      <select value={editForm.regional} onChange={e => setEditForm({...editForm, regional: e.target.value})} className="w-full border-b-2 border-blue-500 bg-blue-50/50 px-3 py-2.5 text-sm font-bold text-gray-900 outline-none rounded-t-md transition-colors">
                        <option>Jawa Bagian Barat</option>
                        <option>Jawa Bagian Timur</option>
                        <option>Kalimantan</option>
                        <option>Sumatera</option>
                        <option>Nasional</option>
                      </select>
                    ) : (
                      <div className="text-sm font-bold text-gray-900 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-100">{selectedUser.regional}</div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">No. WhatsApp</label>
                  {isEditMode ? (
                    <input type="text" value={editForm.wa} onChange={e => setEditForm({...editForm, wa: e.target.value})} className="w-full border-b-2 border-blue-500 bg-blue-50/50 px-3 py-2.5 text-sm font-mono font-bold text-gray-900 outline-none rounded-t-md transition-colors" />
                  ) : (
                    <div className="text-sm font-mono font-bold text-gray-900 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-100">{selectedUser.wa}</div>
                  )}
                </div>
              </div>

              <div className="space-y-5 bg-slate-50 border border-slate-100 rounded-2xl p-6 shadow-sm">
                <h4 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  Otorisasi Sistem
                </h4>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Peran (Role)</label>
                  {isEditMode ? (
                    <select value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})} className="w-full border-2 border-blue-200 rounded-xl px-4 py-3 text-sm font-extrabold text-blue-900 focus:ring-2 focus:ring-blue-500 outline-none bg-blue-50 transition-colors">
                      <option>Peminjam</option>
                      <option>Admin</option>
                      <option>HSSE</option>
                      <option>Area Head</option>
                    </select>
                  ) : (
                    <div className="text-sm font-extrabold text-gray-900 px-4 py-3 bg-white rounded-xl border border-gray-200 shadow-sm">{selectedUser.role}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 sm:p-6 bg-slate-50/90 border-t border-slate-100 shrink-0 flex flex-col gap-4">
              {selectedUser.id === currentUserId ? (
                <div className="flex items-center justify-center py-3 px-4 rounded-xl text-sm font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Anda tidak dapat mengubah data akun yang sedang Anda gunakan.
                </div>
              ) : !isViewOnly && !isEditMode && (
                <>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      onClick={() => setIsEditMode(true)}
                      className="flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      Edit Data Pengguna
                    </button>
                    <button 
                      onClick={handleResetPassword}
                      className="flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                      Reset Sandi
                    </button>
                  </div>

                  {/* Danger Zone */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200/60">
                    <button 
                      onClick={() => toggleStatus(selectedUser.id)}
                      disabled={loading}
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 border disabled:opacity-50 ${
                        selectedUser.status === 'Aktif' 
                          ? 'bg-white text-orange-600 hover:bg-orange-50 border-orange-200 hover:border-orange-300' 
                          : 'bg-white text-green-700 hover:bg-green-50 border-green-200 hover:border-green-300'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                      {loading ? 'Menyimpan...' : selectedUser.status === 'Aktif' ? 'Blokir Akses' : 'Pulihkan Akses'}
                    </button>
                    <button 
                      onClick={() => handleDelete(selectedUser.id)}
                      disabled={loading}
                      className="flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 bg-white text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-300 disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      {loading ? 'Menghapus...' : 'Hapus Pengguna'}
                    </button>
                  </div>
                </>
              )}

              {selectedUser.id !== currentUserId && !isViewOnly && isEditMode && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={handleSaveEdit}
                    disabled={loading}
                    className="flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                  <button 
                    onClick={() => { setIsEditMode(false); setEditForm(selectedUser) }}
                    className="flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    Batal Edit
                  </button>
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}

      {/* ── Modal Registrasi Pengguna Baru (3-step) ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white shadow-2xl flex flex-col overflow-hidden rounded-3xl w-full max-h-[90vh] max-w-2xl">

            {/* Header */}
            <div className="px-6 sm:px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-gray-900">Registrasi Pengguna Baru</h3>
                <div className="flex items-center gap-2 mt-1.5">
                  {['Data Akun', 'Rekam Wajah', 'Selesai'].map((label, idx) => {
                    const stepIdx = modalStep === 'data' ? 0 : modalStep === 'face' ? 1 : 2
                    return (
                      <React.Fragment key={label}>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${idx === stepIdx ? 'bg-blue-600 text-white' : idx < stepIdx ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                          {idx < stepIdx ? '✓ ' : `${idx + 1}. `}{label}
                        </span>
                        {idx < 2 && <span className="text-gray-200 text-xs">→</span>}
                      </React.Fragment>
                    )
                  })}
                </div>
              </div>
              {modalStep !== 'face' && (
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 bg-white border border-gray-200 shadow-sm p-2 rounded-full transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>

            {/* ── STEP 1: Data Form ── */}
            {modalStep === 'data' && (
              <form autoComplete="off" onSubmit={e => { e.preventDefault(); handleAddUser(); }} className="flex flex-col h-full overflow-hidden">
                <div className="p-6 sm:p-8 overflow-y-auto overscroll-y-contain space-y-6 flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                    <div>
                      <label htmlFor="reg_nip" className="block text-sm font-bold text-gray-700 mb-1.5">No. Pegawai <span className="text-red-500">*</span></label>
                      <input id="reg_nip" name="reg_nip" type="text" autoComplete="new-password" value={addForm.nip} onChange={e => setAddForm({...addForm, nip: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono placeholder:font-sans transition-all" placeholder="Mis. 100239" />
                    </div>
                    <div>
                      <label htmlFor="reg_name" className="block text-sm font-bold text-gray-700 mb-1.5">Nama Lengkap <span className="text-red-500">*</span></label>
                      <input id="reg_name" name="reg_name" type="text" autoComplete="new-password" value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Mis. John Doe" />
                    </div>
                    <div>
                      <label htmlFor="reg_email" className="block text-sm font-bold text-gray-700 mb-1.5">Email Akses <span className="text-red-500">*</span></label>
                      <input id="reg_email" name="reg_email" type="email" autoComplete="new-password" value={addForm.email} onChange={e => setAddForm({...addForm, email: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Mis. john@siarta.com" />
                    </div>
                    <div>
                      <label htmlFor="reg_wa" className="block text-sm font-bold text-gray-700 mb-1.5">No. WhatsApp <span className="text-red-500">*</span></label>
                      <input id="reg_wa" name="reg_wa" type="text" autoComplete="new-password" value={addForm.wa} onChange={e => setAddForm({...addForm, wa: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono placeholder:font-sans transition-all" placeholder="Mis. 0812..." />
                    </div>
                    <div>
                      <label htmlFor="reg_jabatan" className="block text-sm font-bold text-gray-700 mb-1.5">Jabatan <span className="text-red-500">*</span></label>
                      <input id="reg_jabatan" name="reg_jabatan" type="text" autoComplete="new-password" value={addForm.jabatan} onChange={e => setAddForm({...addForm, jabatan: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Mis. Engineer" />
                    </div>
                    <div>
                      <label htmlFor="reg_office" className="block text-sm font-bold text-gray-700 mb-1.5">Office / Base <span className="text-red-500">*</span></label>
                      <input id="reg_office" name="reg_office" type="text" autoComplete="new-password" value={addForm.office} onChange={e => setAddForm({...addForm, office: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Mis. Kantor Pusat" />
                    </div>
                    <div>
                      <label htmlFor="reg_regional" className="block text-sm font-bold text-gray-700 mb-1.5">Regional <span className="text-red-500">*</span></label>
                      <select id="reg_regional" name="reg_regional" value={addForm.regional} onChange={e => setAddForm({...addForm, regional: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white">
                        <option>Jawa Bagian Barat</option>
                        <option>Jawa Bagian Timur</option>
                        <option>Kalimantan</option>
                        <option>Sumatera</option>
                        <option>Nasional</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="reg_role" className="block text-sm font-bold text-gray-700 mb-1.5">Peran Akses (Role) <span className="text-red-500">*</span></label>
                      <select id="reg_role" name="reg_role" value={addForm.role} onChange={e => setAddForm({...addForm, role: e.target.value})} className="w-full border-2 border-blue-200 rounded-xl px-4 py-3 text-sm font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 outline-none bg-blue-50 transition-all">
                        <option>Peminjam</option>
                        <option>Admin</option>
                        <option>HSSE</option>
                        <option>Area Head</option>
                      </select>
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                    <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      <span className="font-bold">Langkah selanjutnya:</span> Setelah data akun tersimpan, sistem akan meminta rekaman wajah pengguna untuk otentikasi biometrik. Pastikan pengguna hadir secara langsung.
                    </p>
                  </div>
                </div>
                <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
                  <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">Batal</button>
                  <button type="submit" disabled={loading} className="px-6 py-2.5 text-sm font-bold text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors shadow-md disabled:opacity-50 flex items-center gap-2">
                    {loading ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Menyimpan...</>
                    ) : (
                      <>Lanjut: Rekam Wajah <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ── STEP 2: Face Capture ── */}
            {modalStep === 'face' && (
              <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
                <FaceCapture
                  onCapture={handleFaceCaptured}
                  onCancel={() => setModalStep('data')}
                />
              </div>
            )}

            {/* ── STEP 3: Done — Tampilkan Password ── */}
            {modalStep === 'done' && (
              <div className="p-8 flex-1 flex flex-col items-center justify-center gap-6 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xl font-extrabold text-gray-900">Akun Berhasil Dibuat!</h4>
                  <p className="text-sm text-gray-500 mt-1">Data dan wajah pengguna telah tersimpan dalam sistem.</p>
                </div>

                {shownPassword && (
                  <div className="w-full max-w-sm bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Password Sementara</p>
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-mono font-bold text-2xl text-gray-900 tracking-widest">{shownPassword}</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(shownPassword)
                          setPasswordCopied(true)
                        }}
                        className={`shrink-0 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${passwordCopied ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                      >
                        {passwordCopied ? '✓ Disalin' : 'Salin'}
                      </button>
                    </div>
                    <p className="text-[11px] text-red-500 font-semibold mt-3">
                      ⚠ Catat & berikan ke pengguna sekarang. Password ini tidak akan muncul lagi.
                    </p>
                  </div>
                )}

                <button onClick={closeModal} className="px-8 py-3 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-md">
                  Selesai
                </button>
              </div>
            )}

          </div>
        </div>
      )}
      {/* MODAL KONFIRMASI HAPUS */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 overflow-hidden flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-500">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Hapus Pengguna?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Apakah Anda yakin ingin menghapus pengguna ini dari sistem? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setDeleteConfirmId(null)} 
                disabled={loading}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button 
                onClick={confirmDelete} 
                disabled={loading}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
    </div>
  )
}
