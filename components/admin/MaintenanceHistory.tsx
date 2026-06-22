'use client'

import React, { useState } from 'react'
import StatCard from '../dashboard/StatCard'

interface HistoryTicket {
  id: string
  assetName: string
  serialNumber?: string
  dateCompleted: string
  status: 'Selesai Diperbaiki' | 'Dimusnahkan'
  notes: string
  reporter: string
  photoUrl?: string
  timestamp?: string
}

const historyData: HistoryTicket[] = [
  { id: 'ESC-004', assetName: 'Proyektor Epson', serialNumber: 'PRJ-05', dateCompleted: '10 Jun 2026', status: 'Dimusnahkan', notes: 'Lampu dan lensa pecah total akibat jatuh dari ketinggian.', reporter: 'Agus (Admin)', photoUrl: 'https://images.unsplash.com/photo-1544257121-654859a22f35?w=500&q=80', timestamp: '09 Jun 2026 14:20:00' },
  { id: 'ESC-009', assetName: 'Mesin Las Travo Rhino', serialNumber: 'RN-004', dateCompleted: '13 Jun 2026', status: 'Dimusnahkan', notes: 'Mati total dan korslet berasap.', reporter: 'Siti (Admin)', photoUrl: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=500&q=80' },
  { id: 'ESC-013', assetName: 'Helm Proyek MSA', dateCompleted: '15 Jun 2026', status: 'Dimusnahkan', notes: 'Retak struktural, tidak aman untuk keselamatan pekerja.', reporter: 'Budi (Admin)' },
  { id: 'ESC-019', assetName: 'Kursi Kantor Ergonomis', serialNumber: 'KRS-15', dateCompleted: '17 Jun 2026', status: 'Dimusnahkan', notes: 'Patah pada sumbu utama hidrolik.', reporter: 'Agus (Admin)' },
  { id: 'ESC-A01', assetName: 'Laptop Dell Latitude', serialNumber: 'DLL-012', dateCompleted: '01 Jun 2026', status: 'Selesai Diperbaiki', notes: 'Baterai drop mati mendadak dan kipas sangat berisik.', reporter: 'Siti (Admin)', photoUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&q=80', timestamp: '28 May 2026 09:15:22' },
  { id: 'ESC-A02', assetName: 'Printer HP LaserJet', serialNumber: 'HP-L01', dateCompleted: '02 Jun 2026', status: 'Selesai Diperbaiki', notes: 'Hasil cetakan bergaris hitam memanjang.', reporter: 'Budi (Admin)' },
  { id: 'ESC-A03', assetName: 'Bor Listrik Bosch', serialNumber: 'BS-09', dateCompleted: '05 Jun 2026', status: 'Selesai Diperbaiki', notes: 'Kabel power terkelupas dan percikan api di motor.', reporter: 'Agus (Admin)' },
  { id: 'ESC-A04', assetName: 'Monitor LG 24"', serialNumber: 'MN-LG-04', dateCompleted: '06 Jun 2026', status: 'Dimusnahkan', notes: 'Panel LCD pecah tertimpa barang.', reporter: 'Siti (Admin)' },
  { id: 'ESC-A05', assetName: 'Genset Yamaha', serialNumber: 'GN-Y01', dateCompleted: '08 Jun 2026', status: 'Selesai Diperbaiki', notes: 'Mesin sering mati sendiri saat beban puncak.', reporter: 'Budi (Admin)' },
  { id: 'ESC-A06', assetName: 'HT Icom V80', serialNumber: 'IC-02', dateCompleted: '09 Jun 2026', status: 'Selesai Diperbaiki', notes: 'Antena bengkok patah dan suara kresek-kresek.', reporter: 'Agus (Admin)' },
]

export default function MaintenanceHistory() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('Semua')
  const [selectedTicket, setSelectedTicket] = useState<HistoryTicket | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const filteredData = historyData.filter(item => {
    const matchesSearch = item.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.id.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (filterStatus === 'Semua') return matchesSearch
    return item.status === filterStatus && matchesSearch
  })

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="space-y-6 font-sans relative animate-fade-in">
      {/* ── Statcards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 lg:gap-6 [&>*:last-child:nth-child(odd)]:col-span-2 md:[&>*:last-child:nth-child(odd)]:col-span-1">
        <StatCard 
          label="Total Riwayat Tercatat" 
          value={historyData.length} 
          iconPath="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
          colorTheme="default"
        />
        <StatCard 
          label="Selesai Diperbaiki" 
          value={historyData.filter(d => d.status === 'Selesai Diperbaiki').length} 
          iconPath="M5 13l4 4L19 7" 
          colorTheme="green"
          sub="Kembali ke stok bulan ini"
        />
        <StatCard 
          label="Aset Dimusnahkan" 
          value={historyData.filter(d => d.status === 'Dimusnahkan').length} 
          iconPath="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
          colorTheme="red"
          sub="Dihapus dari pembukuan bulan ini"
        />
      </div>

      {/* ── Table / List View ───────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex-1">
        {/* Toolbar */}
        <div className="px-6 py-5 border-b border-gray-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Rekapitulasi Pemeliharaan</h2>
            <p className="text-sm text-gray-500">Catatan riwayat aset yang telah selesai diperbaiki atau dimusnahkan.</p>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 w-full lg:w-auto mt-4 lg:mt-0">
            <div className="relative w-full lg:w-auto shrink-0">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                placeholder="Cari ID Eskalasi atau Aset..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full lg:w-64 shadow-sm transition-colors"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value)
                setCurrentPage(1)
              }}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors outline-none focus:ring-2 focus:ring-blue-500 w-full lg:w-auto"
            >
              <option value="Semua">Semua Status</option>
              <option value="Selesai Diperbaiki">Selesai Diperbaiki</option>
              <option value="Dimusnahkan">Dimusnahkan</option>
            </select>
          </div>
        </div>

        <div className="lg:hidden p-2 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50/30">
          {paginatedData.map((item) => (
            <div key={item.id} className="bg-white p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 flex flex-col gap-2.5 sm:gap-4">
              <div className="flex justify-between items-start gap-3 sm:gap-4">
                <div className="min-w-0">
                  <h3 className="font-extrabold text-gray-900 text-sm sm:text-base leading-tight">{item.assetName}</h3>
                  <div className="text-[10px] sm:text-xs font-mono text-gray-500 mt-0.5 sm:mt-1">{item.serialNumber ? `S/N: ${item.serialNumber}` : 'S/N: N/A'}</div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] uppercase tracking-wider font-bold border whitespace-nowrap ${
                    item.status === 'Selesai Diperbaiki' ? 'bg-green-50 text-green-700 border-green-200' :
                    'bg-gray-100 text-gray-600 border-gray-200'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 rounded-lg sm:rounded-xl">
                <div>
                  <p className="text-gray-500 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider mb-0.5">ID Eskalasi</p>
                  <p className="font-bold text-gray-900 text-xs sm:text-sm font-mono">{item.id}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider mb-0.5">Tgl Selesai</p>
                  <p className="font-bold text-gray-900 text-xs sm:text-sm">{item.dateCompleted}</p>
                </div>
              </div>

              <div>
                <p className="text-gray-500 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider mb-0.5">Pelapor & Keterangan</p>
                <p className="font-bold text-gray-900 text-xs sm:text-sm">{item.reporter}</p>
                <p className="text-[10px] sm:text-xs text-gray-700 mt-0.5 sm:mt-1 line-clamp-2">{item.notes}</p>
              </div>

              <button
                onClick={() => setSelectedTicket(item)}
                className="w-full py-1.5 sm:py-2.5 mt-1 bg-white border border-gray-200 text-gray-700 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 sm:gap-2"
              >
                Buka Detail
              </button>
            </div>
          ))}
          {paginatedData.length === 0 && (
            <div className="py-12 text-center bg-white rounded-2xl border border-gray-100 border-dashed">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <p className="text-gray-500 font-medium">Tidak ada riwayat yang ditemukan.</p>
            </div>
          )}
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
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[250px]">Keterangan Kerusakan</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {/* Removed redundant empty state check, handled internally by loop length > 0 typically but keep if needed */}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-medium">
                    Tidak ada riwayat yang ditemukan.
                  </td>
                </tr>
              )}
              {paginatedData.map((item) => (
                <tr key={item.id} className="group hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500 font-medium">
                    {item.id}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-900">{item.assetName}</p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">{item.serialNumber ? `S/N: ${item.serialNumber}` : 'S/N: N/A'}</p>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-medium text-gray-900">{item.reporter}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] uppercase tracking-wider font-bold border ${
                      item.status === 'Selesai Diperbaiki' ? 'bg-green-50 text-green-700 border-green-200' :
                      'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-medium text-gray-900">{item.dateCompleted}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700 leading-relaxed line-clamp-2" title={item.notes}>{item.notes}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium transition-colors">
                    <button 
                      onClick={() => setSelectedTicket(item)}
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
          <div className="bg-white shadow-2xl flex flex-col overflow-hidden rounded-3xl w-full max-w-2xl max-h-[90vh]">
            
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Detail Riwayat Pemeliharaan</h3>
                <p className="text-[10px] sm:text-xs text-gray-500 font-mono mt-0.5">{selectedTicket.id}</p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex flex-col md:flex-row overflow-y-auto">
              {/* Left: Photo & Asset Info */}
              <div className="w-full md:w-1/2 bg-gray-50 border-r border-gray-100 flex flex-col">
                {selectedTicket.photoUrl ? (
                  <div className="w-full h-48 sm:h-auto sm:aspect-square bg-gray-200 relative shrink-0">
                    <img src={selectedTicket.photoUrl} alt="Kerusakan" className="w-full h-full object-cover" />
                    {selectedTicket.timestamp && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1.5 font-mono text-center backdrop-blur-sm">
                        {selectedTicket.timestamp}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-48 sm:h-auto sm:aspect-square bg-gray-200 flex items-center justify-center text-gray-400 shrink-0">
                    Tidak ada foto
                  </div>
                )}
                <div className="p-4 sm:p-6">
                  <h4 className="text-lg sm:text-xl font-extrabold text-gray-900 leading-tight">{selectedTicket.assetName}</h4>
                  <p className="text-xs sm:text-sm font-mono text-gray-500 mt-1">S/N: {selectedTicket.serialNumber || 'N/A'}</p>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Pelapor</p>
                    <p className="text-sm font-medium text-gray-900">{selectedTicket.reporter}</p>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Tanggal Eksekusi</p>
                    <p className="text-sm font-medium text-gray-900">{selectedTicket.dateCompleted}</p>
                  </div>
                </div>
              </div>

              {/* Right: Notes */}
              <div className="w-full md:w-1/2 p-4 sm:p-6 flex flex-col">
                <div className="flex-1">
                  <h5 className="text-sm font-bold text-gray-900 mb-2">Status Akhir</h5>
                  <div className="mb-6">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] uppercase tracking-wider font-bold border ${
                      selectedTicket.status === 'Selesai Diperbaiki' ? 'bg-green-50 text-green-700 border-green-200' :
                      'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                      {selectedTicket.status}
                    </span>
                  </div>

                  <h5 className="text-sm font-bold text-gray-900 mb-2">Keterangan Kerusakan</h5>
                  <div className="bg-amber-50 border border-amber-100 text-amber-900 p-4 rounded-xl text-sm leading-relaxed mb-6">
                    "{selectedTicket.notes}"
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
