'use client'

import React, { useState } from 'react'
import StatCard from '../shared/StatCard'

type User = {
  nip: string
  name: string
  wa: string
  jabatan: string
  office: string
  regional: string
  role: string
  status: 'Aktif' | 'Nonaktif'
}

const initialUsers: User[] = [
  { nip: '100234', name: 'Ahmad Yani', wa: '081234567890', jabatan: 'Field Technician', office: 'Site Alpha', regional: 'Jawa Bagian Timur', role: 'Peminjam', status: 'Aktif' },
  { nip: '100235', name: 'Budi Santoso', wa: '081298765432', jabatan: 'Safety Officer', office: 'Site Alpha', regional: 'Jawa Bagian Timur', role: 'HSSE', status: 'Aktif' },
  { nip: '100236', name: 'Ir. Suharto', wa: '081112223334', jabatan: 'Operation Manager', office: 'HO Jakarta', regional: 'Nasional', role: 'Area Head', status: 'Aktif' },
  { nip: '100237', name: 'Siti Aminah', wa: '085544433322', jabatan: 'Admin Logistik', office: 'Gudang Pusat', regional: 'Jawa Bagian Barat', role: 'Admin', status: 'Aktif' },
  { nip: '100238', name: 'Dodo H.', wa: '087788899900', jabatan: 'Driller', office: 'Site Beta', regional: 'Kalimantan', role: 'Peminjam', status: 'Nonaktif' },
  { nip: '100239', name: 'Joko Widodo', wa: '081211112222', jabatan: 'Heavy Equipment Operator', office: 'Site Gamma', regional: 'Sumatera', role: 'Peminjam', status: 'Aktif' },
  { nip: '100240', name: 'Bambang Pamungkas', wa: '081322223333', jabatan: 'Site Supervisor', office: 'Site Alpha', regional: 'Jawa Bagian Timur', role: 'Area Head', status: 'Aktif' },
  { nip: '100241', name: 'Taufik Hidayat', wa: '081433334444', jabatan: 'Maintenance Crew', office: 'Site Beta', regional: 'Kalimantan', role: 'Peminjam', status: 'Aktif' },
  { nip: '100242', name: 'Susi Susanti', wa: '081544445555', jabatan: 'Data Analyst', office: 'HO Jakarta', regional: 'Nasional', role: 'Admin', status: 'Aktif' },
  { nip: '100243', name: 'Rudy Hartono', wa: '081655556666', jabatan: 'Security Chief', office: 'Site Gamma', regional: 'Sumatera', role: 'HSSE', status: 'Aktif' },
  { nip: '100244', name: 'Kevin Sanjaya', wa: '081766667777', jabatan: 'IT Support', office: 'HO Jakarta', regional: 'Nasional', role: 'Admin', status: 'Aktif' },
  { nip: '100245', name: 'Marcus Gideon', wa: '081877778888', jabatan: 'Network Engineer', office: 'Site Beta', regional: 'Kalimantan', role: 'Peminjam', status: 'Nonaktif' },
  { nip: '100246', name: 'Liliyana Natsir', wa: '081988889999', jabatan: 'Quality Control', office: 'Site Alpha', regional: 'Jawa Bagian Timur', role: 'Peminjam', status: 'Aktif' },
  { nip: '100247', name: 'Tontowi Ahmad', wa: '081299990000', jabatan: 'Logistics Coordinator', office: 'Gudang Pusat', regional: 'Jawa Bagian Barat', role: 'Peminjam', status: 'Aktif' },
  { nip: '100248', name: 'Anthony Ginting', wa: '081300001111', jabatan: 'Mechanic', office: 'Site Gamma', regional: 'Sumatera', role: 'Peminjam', status: 'Aktif' },
  { nip: '100249', name: 'Jonatan Christie', wa: '081411112222', jabatan: 'Welder', office: 'Site Beta', regional: 'Kalimantan', role: 'Peminjam', status: 'Nonaktif' },
  { nip: '100250', name: 'Greysia Polii', wa: '081522223333', jabatan: 'HR Specialist', office: 'HO Jakarta', regional: 'Nasional', role: 'Admin', status: 'Aktif' },
  { nip: '100251', name: 'Apriyani Rahayu', wa: '081633334444', jabatan: 'Finance Staff', office: 'HO Jakarta', regional: 'Nasional', role: 'Peminjam', status: 'Aktif' },
  { nip: '100252', name: 'Hendra Setiawan', wa: '081744445555', jabatan: 'Surveyor', office: 'Site Alpha', regional: 'Jawa Bagian Timur', role: 'Peminjam', status: 'Aktif' },
  { nip: '100253', name: 'Mohammad Ahsan', wa: '081855556666', jabatan: 'Safety Inspector', office: 'Site Gamma', regional: 'Sumatera', role: 'HSSE', status: 'Aktif' },
]

export default function UserManagement({ isViewOnly = false }: { isViewOnly?: boolean }) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Detail View State
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editForm, setEditForm] = useState<User | null>(null)

  const toggleStatus = (nip: string) => {
    setUsers(prev => prev.map(u => 
      u.nip === nip ? { ...u, status: u.status === 'Aktif' ? 'Nonaktif' : 'Aktif' } : u
    ))
    if (selectedUser && selectedUser.nip === nip) {
      setSelectedUser(prev => prev ? { ...prev, status: prev.status === 'Aktif' ? 'Nonaktif' : 'Aktif' } : null)
    }
  }

  const handleSaveEdit = () => {
    if (!editForm) return
    setUsers(prev => prev.map(u => u.nip === editForm.nip ? editForm : u))
    setSelectedUser(editForm)
    setIsEditMode(false)
  }

  const handleDelete = (nip: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus pengguna ini dari sistem?')) {
      setUsers(prev => prev.filter(u => u.nip !== nip))
      setSelectedUser(null)
    }
  }

  const handleResetPassword = () => {
    alert(`Password untuk ${selectedUser?.name} telah direset ke default (Siarta2026!).`)
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

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white z-10 shrink-0 rounded-t-2xl">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">Direktori Pengguna</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Kelola data, peran, dan akses sistem untuk seluruh pengguna.</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-4 lg:mt-0">
            <div className="relative w-full sm:w-auto">
              <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                type="text" 
                placeholder="Cari nama, NIP, atau role..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all w-full sm:w-64"
              />
            </div>
            {!isViewOnly && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-4 sm:px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors whitespace-nowrap shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Registrasi Pegawai
              </button>
            )}
          </div>
      </div>

      <div className="bg-gray-50/50 p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 rounded-b-2xl">
        {/* Header Kolom (Hanya Tampil di Desktop) */}
        <div className="hidden lg:flex items-center px-6 text-xs font-extrabold text-gray-400 uppercase tracking-wider">
          <div className="w-[30%]">Identitas Pegawai</div>
          <div className="w-[25%]">Kontak & Lokasi</div>
          <div className="w-[20%]">Peran (Role)</div>
          <div className="w-[15%]">Status</div>
          <div className="w-[10%] text-right">Aksi</div>
        </div>

        {/* Daftar Pegawai (Berbentuk Card Terpisah) */}
        <div className="space-y-3">
          {paginatedUsers.length === 0 ? (
            <div className="py-8 sm:py-12 text-center bg-white rounded-2xl border border-gray-100 border-dashed">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
              <p className="text-gray-500 font-medium">Tidak ada pegawai yang cocok dengan pencarian "{searchQuery}"</p>
            </div>
          ) : (
            paginatedUsers.map(u => (
            <div 
              key={u.nip} 
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden transform transition-transform">
            
            {/* Header */}
            <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-100 flex items-start justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 border-2 border-white shadow-md flex items-center justify-center text-blue-700 font-extrabold text-xl sm:text-2xl shrink-0">
                  {selectedUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight truncate">{selectedUser.name}</h3>
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
            <div className="flex-1 overflow-y-auto overscroll-y-contain p-4 sm:p-8 space-y-6 sm:space-y-8">
              {/* Quick Actions */}
              {!isViewOnly && (
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={`py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm border ${isEditMode ? 'bg-blue-50 text-blue-700 border-blue-200 ring-2 ring-blue-100' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    {isEditMode ? 'Batal Edit' : 'Edit Profil'}
                  </button>
                  <button 
                    onClick={handleResetPassword}
                    className="py-3 px-4 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                    Reset Sandi
                  </button>
                </div>
              )}

              {/* Data Form/View */}
              <div className="space-y-4 sm:space-y-5 bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 shadow-sm">
                <h4 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  Informasi Pegawai
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
            <div className="p-0 shrink-0">
              {!isViewOnly && !isEditMode && (
                <div className="flex flex-col sm:flex-row gap-3 p-6 sm:p-8 bg-gray-50 border-t border-gray-100">
                  <button 
                    onClick={() => setIsEditMode(true)}
                    className="flex-1 py-3.5 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Edit Data Pegawai
                  </button>
                  <button 
                    onClick={handleResetPassword}
                    className="flex-1 py-3.5 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                    Reset Sandi
                  </button>
                </div>
              )}

              {!isViewOnly && isEditMode && (
                <div className="flex flex-col sm:flex-row gap-3 p-6 sm:p-8 bg-gray-50 border-t border-gray-100">
                  <button 
                    onClick={handleSaveEdit}
                    className="flex-1 py-3.5 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 bg-green-600 text-white hover:bg-green-700"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Simpan Perubahan
                  </button>
                  <button 
                    onClick={() => { setIsEditMode(false); setEditForm(selectedUser) }}
                    className="flex-1 py-3.5 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    Batal Edit
                  </button>
                </div>
              )}

              {/* Danger Zone */}
              {!isViewOnly && !isEditMode && (
                <div className="flex flex-col sm:flex-row gap-3 p-6 sm:p-8 bg-white border-t border-red-100">
                  <button 
                    onClick={() => toggleStatus(selectedUser.nip)}
                    className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 border-2 ${
                      selectedUser.status === 'Aktif' 
                        ? 'bg-white text-orange-600 hover:bg-orange-50 border-orange-200 hover:border-orange-300' 
                        : 'bg-white text-green-700 hover:bg-green-50 border-green-200 hover:border-green-300'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                    {selectedUser.status === 'Aktif' ? 'Blokir Akses' : 'Pulihkan Akses'}
                  </button>
                  <button 
                    onClick={() => handleDelete(selectedUser.nip)}
                    className="flex-1 py-3.5 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 bg-white text-red-600 hover:bg-red-50 border-2 border-red-200 hover:border-red-300"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Hapus Pengguna
                  </button>
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}

      {/* ── Modal Add / Edit Pegawai ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white shadow-2xl flex flex-col overflow-hidden rounded-3xl w-full max-h-[90vh] max-w-2xl">
            <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-gray-900">Registrasi Pegawai Baru</h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Buat kredensial akses untuk pegawai masuk ke sistem.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-white border border-gray-200 shadow-sm p-2 rounded-full transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 sm:p-8 overflow-y-auto overscroll-y-contain space-y-6 sm:space-y-8 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">NIP (Username) <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono placeholder:font-sans transition-all" placeholder="Mis. 100239" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Nama Lengkap <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Mis. Budi Doremi" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">No. WhatsApp</label>
                  <input type="text" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono placeholder:font-sans transition-all" placeholder="Mis. 0812..." />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Jabatan</label>
                  <input type="text" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Mis. Technician" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Office / Base</label>
                  <input type="text" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Mis. Site Delta" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Regional</label>
                  <select className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white">
                    <option>Jawa Bagian Barat</option>
                    <option>Jawa Bagian Timur</option>
                    <option>Kalimantan</option>
                    <option>Sumatera</option>
                    <option>Nasional</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h4 className="text-sm font-extrabold text-gray-900 mb-4 uppercase tracking-wider">Otorisasi Sistem</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Peran Akses (Role)</label>
                    <select className="w-full border-2 border-blue-200 rounded-xl px-4 py-3 text-sm font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 outline-none bg-blue-50 transition-all">
                      <option>Peminjam</option>
                      <option>Admin</option>
                      <option>HSSE</option>
                      <option>Area Head</option>
                    </select>
                    <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">Hati-hati: Memberikan role Admin/Area Head berarti memberikan wewenang untuk menyetujui dokumen.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Password Sementara</label>
                    <div className="relative">
                      <input type="text" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 text-gray-500 outline-none font-mono" value="Siarta2026!" readOnly />
                    </div>
                    <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">Password default yang digunakan untuk login pertama. User wajib menggantinya nanti.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 py-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">Batal</button>
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-sm font-bold text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors shadow-md">Buat Akun Pegawai</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  )
}
