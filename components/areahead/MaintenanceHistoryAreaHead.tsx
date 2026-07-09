'use client'

import React, { useState, useEffect } from 'react'
import StatCard from '../shared/StatCard'
import { getAllMaintenanceRecords } from '../../actions/core/maintenance'

interface HistoryTicket {
  id: string
  items: any[]
  dateReported: string
  dateCompleted?: string
  status: 'Laporan Masuk' | 'Selesai Diperbaiki' | 'Dimusnahkan'
  notes: string
  reporter: string
  photoUrl?: string
  photos?: string[]
  timestamp?: string
  updatedAt?: string
}

export default function MaintenanceHistoryAreaHead() {
  const [records, setRecords] = useState<HistoryTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('Semua')
  const [selectedTicket, setSelectedTicket] = useState<HistoryTicket | null>(null)
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null)
  const [zoomScale, setZoomScale] = useState(1)
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const refreshData = () => {
    getAllMaintenanceRecords().then(res => {
      if (res.success && res.data) {
        const adapted: HistoryTicket[] = res.data.map(r => ({
          id: r.recordCode,
          items: r.items || [],
          dateReported: r.dateReported,
          dateCompleted: r.dateResolved || undefined,
          status: r.status === 'Menunggu Tindakan' ? 'Laporan Masuk' : r.status as 'Selesai Diperbaiki' | 'Dimusnahkan',
          notes: r.issue,
          reporter: r.reporterName,
          photoUrl: r.photoUrl ?? undefined,
          photos: r.photos?.map((p: any) => p.image) || [],
          timestamp: r.createdAt?.toString(),
          updatedAt: r.updatedAt?.toString(),
        }))
        setRecords(adapted)
      }
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    refreshData()
    const interval = setInterval(() => {
      refreshData()
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const historyData = records

  const filteredData = historyData.filter(item => {
    const matchesSearch = item.items.some(i => i.assetName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          item.id.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (filterStatus === 'Semua') return matchesSearch
    return item.status === filterStatus && matchesSearch
  })

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="space-y-4 sm:space-y-6 font-sans relative animate-fade-in">
      {/* ── Statcards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-6">
        <StatCard 
          label="Total Riwayat Tercatat" 
          value={historyData.length} 
          iconPath="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
          colorTheme="default"
        />
        <StatCard 
          label="Laporan Masuk" 
          value={historyData.filter(d => d.status === 'Laporan Masuk').length} 
          iconPath="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
          colorTheme="amber"
        />
        <StatCard 
          label="Selesai Diperbaiki" 
          value={historyData.filter(d => d.status === 'Selesai Diperbaiki').length} 
          iconPath="M5 13l4 4L19 7" 
          colorTheme="green"
        />
        <StatCard 
          label="Aset Dimusnahkan" 
          value={historyData.filter(d => d.status === 'Dimusnahkan').length} 
          iconPath="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
          colorTheme="red"
        />
      </div>

      {/* ── Table / List View ───────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex-1">
        {/* Toolbar */}
        <div className="p-3 sm:p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Rekapitulasi Pemeliharaan</h2>
            <p className="text-xs sm:text-sm text-gray-500">Catatan riwayat aset yang telah selesai diperbaiki atau dimusnahkan.</p>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 mt-2 lg:mt-0 w-full lg:w-auto">
            <div className="relative w-full lg:w-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input 
                type="text" 
                placeholder="Cari ID Eskalasi atau Aset..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-9 pr-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full lg:w-64 transition-all outline-none"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm bg-white hover:bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 transition-colors w-full lg:w-auto cursor-pointer"
            >
              <option value="Semua">Semua Status</option>
              <option value="Laporan Masuk">Laporan Masuk</option>
              <option value="Selesai Diperbaiki">Selesai Diperbaiki</option>
              <option value="Dimusnahkan">Dimusnahkan</option>
            </select>
          </div>
        </div>

        <div className="lg:hidden p-2 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50/30">
          {paginatedData.map((item) => (
            <div key={item.id} className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 flex flex-col gap-3">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <h3 className="font-extrabold text-gray-900 text-sm sm:text-base leading-tight">
                    {item.items.length === 1 ? item.items[0].assetName : `${item.items.length} Jenis Aset`}
                  </h3>
                  <div className="text-xs font-medium text-gray-500 mt-1">
                    {item.items.length === 1 
                      ? (item.items[0].serialNumber ? `S/N: ${item.items[0].serialNumber}` : `Qty: ${item.items[0].qty || 1}`)
                      : 'Multi-Item Report'}
                  </div>
                </div>
                <div className="shrink-0">
                  <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] uppercase tracking-wider font-bold border whitespace-nowrap ${
                    item.status === 'Selesai Diperbaiki' ? 'bg-green-50 text-green-700 border-green-200' :
                    item.status === 'Laporan Masuk' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-2.5 bg-gray-50 rounded-lg sm:rounded-xl text-xs">
                <div>
                  <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">ID Eskalasi</p>
                  <p className="font-bold text-gray-900">{item.id}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Tanggal Eksekusi</p>
                  <p className="font-bold text-gray-900">{item.dateCompleted || '-'}</p>
                </div>
                <div className="col-span-2 border-t border-gray-200/60 pt-2 mt-1">
                  <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Pelapor</p>
                  <p className="font-bold text-gray-900">{item.reporter}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <button
                  onClick={() => { setSelectedTicket(item); setCurrentPhotoIdx(0); }}
                  className="w-full py-2 bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  Buka Detail
                </button>
              </div>
            </div>
          ))}
          {loading ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-gray-100 border-dashed">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
              <p className="text-gray-500 font-medium">Memuat data...</p>
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-gray-100 border-dashed">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <p className="text-gray-500 font-medium">Tidak ada riwayat yang ditemukan.</p>
            </div>
          ) : null}
        </div>

        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">ID Eskalasi</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Aset Terkait</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Pelapor</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status Akhir</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Tanggal Eksekusi</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      <p className="text-gray-500 font-medium">Memuat data riwayat pemeliharaan...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-medium">
                    Tidak ada riwayat yang ditemukan.
                  </td>
                </tr>
              ) : null}
              {paginatedData.map((item) => (
                <tr key={item.id} className="group hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500 font-medium">
                    {item.id}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-900">
                      {item.items.length === 1 ? item.items[0].assetName : `${item.items.length} Jenis Aset`}
                    </p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">
                      {item.items.length === 1 
                        ? (item.items[0].serialNumber ? `S/N: ${item.items[0].serialNumber}` : `Qty: ${item.items[0].qty || 1}`)
                        : 'Multi-Item Report'}
                    </p>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-medium text-gray-900">{item.reporter}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] uppercase tracking-wider font-bold border ${
                      item.status === 'Selesai Diperbaiki' ? 'bg-green-50 text-green-700 border-green-200' :
                      item.status === 'Laporan Masuk' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-medium text-gray-900">{item.dateCompleted || item.dateReported}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium transition-colors">
                    <button 
                      onClick={() => { setSelectedTicket(item); setCurrentPhotoIdx(0); }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
                    >
                      Buka Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col lg:flex-row items-center justify-between shrink-0 gap-4 rounded-b-lg">
            <span className="text-sm text-gray-500 font-medium">
              Menampilkan <span className="font-bold text-gray-900">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredData.length)}</span> hingga <span className="font-bold text-gray-900">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> dari <span className="font-bold text-gray-900">{filteredData.length}</span> hasil
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Sebelumnya
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${
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
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || filteredData.length === 0}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Detail Modal ────────────────────────────────────────────────── */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white shadow-2xl flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh]">
            
            <div className="px-5 sm:px-6 py-4 border-b flex items-center justify-between bg-gray-50 shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Detail Riwayat Pemeliharaan</h3>
                <p className="text-[10px] sm:text-xs text-gray-500 font-mono mt-0.5">{selectedTicket.id}</p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex flex-col md:flex-row flex-1 overflow-y-auto md:overflow-hidden min-h-0 md:min-h-[400px]">
              {/* Left: Photos (Sticky/Full height on Desktop) */}
              {(() => {
                const photos = selectedTicket.photos?.length ? selectedTicket.photos : selectedTicket.photoUrl?.split(',') || [];
                return (
                  <div className={`w-full md:w-5/12 bg-gray-900 shrink-0 relative flex-col ${photos.length === 0 ? 'hidden md:flex' : 'flex'}`}>
                    {photos.length > 0 ? (
                      <div className="relative w-full h-56 sm:h-72 md:h-auto md:absolute md:inset-0 flex items-center justify-center bg-black overflow-hidden group">
                        <img 
                          src={photos[currentPhotoIdx]} 
                          alt="Kerusakan" 
                          className="absolute w-full h-full object-contain cursor-zoom-in transition-transform duration-300 group-hover:scale-105" 
                          onClick={() => setZoomedPhoto(photos[currentPhotoIdx])}
                        />
                        {photos.length > 1 && (
                          <>
                            <button onClick={() => setCurrentPhotoIdx(p => Math.max(0, p - 1))} disabled={currentPhotoIdx === 0} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/30 text-white p-1.5 sm:p-2 rounded-full backdrop-blur-sm disabled:opacity-30 transition-all z-10">
                              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button onClick={() => setCurrentPhotoIdx(p => Math.min(photos.length - 1, p + 1))} disabled={currentPhotoIdx === photos.length - 1} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/30 text-white p-1.5 sm:p-2 rounded-full backdrop-blur-sm disabled:opacity-30 transition-all z-10">
                              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold text-white tracking-widest z-10">
                              {currentPhotoIdx + 1} / {photos.length}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="relative w-full h-56 sm:h-72 md:h-auto md:absolute md:inset-0 flex items-center justify-center text-gray-500 bg-gray-900 font-medium text-sm">
                        Tidak ada foto terlampir
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Right: Info, Assets, Timeline */}
              <div className="w-full md:w-7/12 bg-white flex flex-col md:overflow-y-auto overscroll-y-contain">
                <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 sm:gap-8 min-h-full">
                  {/* Status & Reporter Header */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 pb-4 sm:pb-6 border-b border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Status Akhir</p>
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs uppercase tracking-wider font-bold border ${
                        selectedTicket.status === 'Selesai Diperbaiki' ? 'bg-green-50 text-green-700 border-green-200' :
                        selectedTicket.status === 'Laporan Masuk' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-gray-100 text-gray-600 border-gray-200'
                      }`}>
                        {selectedTicket.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Pelapor</p>
                      <p className="text-sm font-bold text-gray-900">{selectedTicket.reporter}</p>
                    </div>
                  </div>

                {/* Assets List */}
                <div>
                  <h5 className="text-sm font-bold text-gray-900 mb-3 sm:mb-4">{selectedTicket.items.length} Jenis Aset Dilaporkan</h5>
                  <div className="space-y-3">
                    {selectedTicket.items.map((item, idx) => (
                      <div key={idx} className="bg-gray-50/50 border border-gray-200 rounded-xl p-3 sm:p-4 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group">
                        <div className="font-bold text-gray-900 text-sm group-hover:text-indigo-700 transition-colors">{item.assetName}</div>
                        <div className="text-xs text-gray-500 font-mono mt-1.5 flex items-center gap-2">
                          <span className="bg-gray-200/50 px-2 py-0.5 rounded-md">{item.isSerialized ? `S/N: ${item.serialNumber || 'N/A'}` : `Qty: ${item.qty || 1}`}</span>
                        </div>
                        {item.issue && (
                          <div className="mt-3 text-xs text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-100 leading-relaxed">
                            <span className="font-semibold block mb-0.5">Kendala:</span>
                            {item.issue}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                <div className="pt-2">
                  <h5 className="text-sm font-bold text-gray-900 mb-4 sm:mb-6">Timeline Laporan</h5>
                  <div className="space-y-4 sm:space-y-6">
                    {/* Step 1 */}
                    <div className="flex gap-3 sm:gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-amber-500 rounded-full ring-4 ring-amber-50"></div>
                        {(selectedTicket.status === 'Selesai Diperbaiki' || selectedTicket.status === 'Dimusnahkan') && (
                          <div className="w-0.5 h-12 bg-gray-200 my-1"></div>
                        )}
                      </div>
                      <div className="-mt-1">
                        <p className="text-sm font-bold text-gray-900">Laporan Masuk (Sedang Diperbaiki)</p>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {selectedTicket.dateReported}
                          {selectedTicket.timestamp && (() => {
                            try {
                              const d = new Date(selectedTicket.timestamp);
                              return !isNaN(d.getTime()) ? ` • ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : '';
                            } catch { return ''; }
                          })()}
                        </p>
                      </div>
                    </div>
                    {/* Step 2 */}
                    {(selectedTicket.status === 'Selesai Diperbaiki' || selectedTicket.status === 'Dimusnahkan') && selectedTicket.dateCompleted && (
                      <div className="flex gap-3 sm:gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ring-4 ${selectedTicket.status === 'Selesai Diperbaiki' ? 'bg-green-500 ring-green-50' : 'bg-gray-500 ring-gray-50'}`}></div>
                        </div>
                        <div className="-mt-1">
                          <p className="text-sm font-bold text-gray-900">Penyelesaian Laporan ({selectedTicket.status})</p>
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {selectedTicket.dateCompleted}
                            {selectedTicket.updatedAt && (() => {
                              try {
                                const d = new Date(selectedTicket.updatedAt);
                                return !isNaN(d.getTime()) ? ` • ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : '';
                              } catch { return ''; }
                            })()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ── Photo Lightbox ────────────────────────────────────────────────── */}
      {zoomedPhoto && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in"
          onClick={() => { setZoomedPhoto(null); setZoomScale(1); }}
        >
          {/* Controls */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 sm:gap-3 z-[70]" onClick={(e) => e.stopPropagation()}>
            <button 
              className="p-2 sm:p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all"
              onClick={() => setZoomScale(s => Math.max(1, s - 0.5))}
              title="Zoom Out"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>
            </button>
            <button 
              className="p-2 sm:p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all"
              onClick={() => setZoomScale(s => Math.min(5, s + 0.5))}
              title="Zoom In"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
            </button>
            <button 
              className="p-2 sm:p-3 text-white/70 hover:text-white bg-red-500/80 hover:bg-red-500 rounded-full transition-all ml-1 sm:ml-2"
              onClick={() => { setZoomedPhoto(null); setZoomScale(1); }}
              title="Tutup"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
            <img 
              src={zoomedPhoto} 
              alt="Zoomed" 
              className="max-w-none rounded-lg shadow-2xl transition-transform duration-200 cursor-zoom-in"
              style={{ 
                transform: `scale(${zoomScale})`, 
                transformOrigin: 'center',
                maxWidth: zoomScale > 1 ? 'none' : '100%',
                maxHeight: zoomScale > 1 ? 'none' : '90vh'
              }}
              onClick={(e) => { 
                e.stopPropagation(); 
                if (zoomScale > 1) {
                  setZoomScale(1);
                } else {
                  setZoomScale(2);
                }
              }}
              onWheel={(e) => {
                e.stopPropagation();
                if (e.deltaY < 0) setZoomScale(s => Math.min(5, s + 0.25));
                else setZoomScale(s => Math.max(1, s - 0.25));
              }}
            />
          </div>
        </div>
      )}

    </div>
  )
}
