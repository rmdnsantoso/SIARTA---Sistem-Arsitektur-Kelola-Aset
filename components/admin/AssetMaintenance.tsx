'use client'

import React, { useState } from 'react'

type EscalationStatus = 'Menunggu Tindakan' | 'Selesai' | 'Dimusnahkan'

interface EscalationTicket {
  id: string
  assetName: string
  serialNumber?: string
  issue: string
  reporter: string
  dateReported: string
  status: EscalationStatus
  photoUrl?: string
  timestamp?: string
}

const initialTickets: EscalationTicket[] = [
  { id: 'ESC-001', assetName: 'Gas Detector MSA Altair', serialNumber: 'SN-002', issue: 'Sensor O2 error saat kalibrasi, pembacaan tidak stabil.', reporter: 'Siti (Admin)', dateReported: '14 Jun 2026', status: 'Menunggu Tindakan', photoUrl: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=500&q=80' },
  { id: 'ESC-002', assetName: 'Bor Listrik Makita', serialNumber: 'BR-014', issue: 'Kabel power terkelupas parah, berasap saat dinyalakan.', reporter: 'Agus (Admin)', dateReported: '15 Jun 2026', status: 'Menunggu Tindakan', photoUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&q=80', timestamp: '15 Jun 2026 10:20:05' },
  { id: 'ESC-003', assetName: 'Safety Harness Full Body', issue: 'Tali utama putus sebagian. Tidak layak pakai.', reporter: 'Siti (Admin)', dateReported: '16 Jun 2026', status: 'Menunggu Tindakan', photoUrl: 'https://images.unsplash.com/photo-1544257121-654859a22f35?w=500&q=80' },
  { id: 'ESC-005', assetName: 'Laptop Lenovo ThinkPad', serialNumber: 'LNV-008', issue: 'Keyboard beberapa tombol tidak berfungsi dan baterai bocor.', reporter: 'Budi (Admin)', dateReported: '11 Jun 2026', status: 'Menunggu Tindakan' },
  { id: 'ESC-006', assetName: 'Drone DJI Mavic 3', serialNumber: 'DJI-001', issue: 'Gimbal kamera macet setelah pendaratan darurat.', reporter: 'Rina (Admin)', dateReported: '11 Jun 2026', status: 'Menunggu Tindakan' },
  { id: 'ESC-007', assetName: 'HT Motorola Xir P8668i', serialNumber: 'MT-020', issue: 'Suara tidak keluar sama sekali meski volume maksimal.', reporter: 'Siti (Admin)', dateReported: '12 Jun 2026', status: 'Menunggu Tindakan' },
  { id: 'ESC-008', assetName: 'Multimeter Fluke 117', serialNumber: 'FLK-112', issue: 'Layar LCD bergaris, pembacaan tidak terbaca jelas.', reporter: 'Agus (Admin)', dateReported: '12 Jun 2026', status: 'Menunggu Tindakan' },
  { id: 'ESC-010', assetName: 'Kamera DSLR Canon', serialNumber: 'CN-002', issue: 'Lensa kit jamuran parah, tidak bisa fokus.', reporter: 'Rina (Admin)', dateReported: '13 Jun 2026', status: 'Menunggu Tindakan' },
]

const STATUS_META: Record<string, { label: string; headerCls: string; dotCls: string }> = {
  'Menunggu Tindakan':{ label: 'Menunggu Tindakan Area Head', headerCls: 'border-l-amber-400',   dotCls: 'bg-amber-400' },
  'Selesai':{ label: 'Selesai Diperbaiki', headerCls: 'border-l-green-400',  dotCls: 'bg-green-400' },
  'Dimusnahkan':    { label: 'Telah Dimusnahkan (Write-off)',    headerCls: 'border-l-gray-400', dotCls: 'bg-gray-400' },
}

export default function AssetMaintenance() {
  const [tickets, setTickets] = useState<EscalationTicket[]>(initialTickets)
  const [selectedTicket, setSelectedTicket] = useState<EscalationTicket | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'Aktif' | 'Dimusnahkan' | 'Semua'>('Aktif')
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportForm, setReportForm] = useState({ assetId: '', qtyOrSn: '', notes: '', photos: [] as string[] })
  const [isCameraOpen, setIsCameraOpen] = useState(false)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleAction = (newStatus: EscalationStatus | 'Selesai') => {
    if (!selectedTicket) return

    if (newStatus === 'Selesai' || newStatus === 'Dimusnahkan') {
      // It completely leaves this board (goes back to stock or goes to write-off history)
      setTickets(prev => prev.filter(t => t.id !== selectedTicket.id))
      if (newStatus === 'Selesai') showToast(`Aset ${selectedTicket.assetName} berhasil diperbaiki dan dikembalikan ke stok.`)
      if (newStatus === 'Dimusnahkan') showToast(`Aset telah dimusnahkan dan dipindah ke Riwayat Pemeliharaan.`)
    } else {
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status: newStatus } : t))
    }
    
    setSelectedTicket(null)
  }

  const handleSaveReport = () => {
    if (!reportForm.assetId || !reportForm.notes) return;
    const newId = `ESC-0${Math.floor(Math.random() * 90) + 10}`
    const newTicket: EscalationTicket = {
      id: newId,
      assetName: reportForm.assetId,
      serialNumber: reportForm.qtyOrSn,
      issue: reportForm.notes,
      reporter: 'Admin / HSSE',
      dateReported: 'Hari Ini',
      status: 'Menunggu Tindakan',
      photoUrl: reportForm.photos[0] || undefined
    }
    setTickets([newTicket, ...tickets])
    setIsReportModalOpen(false)
    setReportForm({ assetId: '', qtyOrSn: '', notes: '', photos: [] })
    showToast('Laporan temuan kerusakan berhasil dicatat dan masuk ke antrean review.')
  }

  const countTindakan = tickets.filter(t => t.status === 'Menunggu Tindakan').length

  const itemsPerPage = 5
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(tickets.length / itemsPerPage)
  const paginatedTickets = tickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="space-y-6 font-sans relative">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[99] px-5 py-3 bg-gray-900 text-white rounded-lg shadow-xl text-sm font-medium animate-fade-in flex items-center gap-2">
          {toast}
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-1">Manajemen Eskalasi</p>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Aset Bermasalah</h1>
          <p className="text-sm text-gray-400 mt-0.5">Daftar laporan aset rusak yang menunggu tindak lanjut pemeliharaan.</p>
        </div>
        <button 
          onClick={() => setIsReportModalOpen(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-red-700 flex items-center gap-2 shrink-0"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          Catat Temuan Kerusakan
        </button>
      </div>


      {/* ── Table / List View ───────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex-1">
        <div className="lg:hidden p-2 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50/30">
          {paginatedTickets.map((t) => (
            <div key={t.id} className="bg-white p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 flex flex-col gap-2.5 sm:gap-4">
              <div className="flex justify-between items-start gap-3 sm:gap-4">
                <div className="min-w-0">
                  <h3 className="font-extrabold text-gray-900 text-sm sm:text-base leading-tight">{t.assetName}</h3>
                  <div className="text-[10px] sm:text-xs font-mono text-gray-500 mt-0.5 sm:mt-1">{t.serialNumber ? `S/N: ${t.serialNumber}` : 'S/N: N/A'}</div>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
                    Menunggu Tindakan
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 rounded-lg sm:rounded-xl">
                <div>
                  <p className="text-gray-500 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider mb-0.5">ID Eskalasi</p>
                  <p className="font-bold text-gray-900 text-xs sm:text-sm font-mono">{t.id}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider mb-0.5">Dilaporkan Oleh</p>
                  <p className="font-bold text-gray-900 text-xs sm:text-sm">{t.reporter}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500">{t.dateReported}</p>
                </div>
              </div>

              <div>
                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Keterangan</p>
                <p className="text-sm text-gray-700 line-clamp-2">{t.issue}</p>
              </div>

              <button 
                onClick={() => setSelectedTicket(t)}
                className="w-full py-1.5 sm:py-2.5 mt-1 bg-white border border-gray-200 text-gray-700 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 sm:gap-2"
              >
                Buka Detail
              </button>
            </div>
          ))}
          {paginatedTickets.length === 0 && (
            <div className="py-12 text-center bg-white rounded-2xl border border-gray-100 border-dashed">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <p className="text-gray-500 font-medium">Tidak ada tiket eskalasi saat ini.</p>
            </div>
          )}
        </div>

        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ID Eskalasi</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Aset Bermasalah</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Dilaporkan Oleh</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Keterangan Kerusakan</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {tickets.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">
                    Tidak ada tiket eskalasi saat ini.
                  </td>
                </tr>
              )}
              {paginatedTickets.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                    {t.id}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{t.assetName}</p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">{t.serialNumber ? `S/N: ${t.serialNumber}` : 'S/N: N/A'}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">

                    <p className="text-sm font-medium text-gray-900">{t.reporter}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t.dateReported}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600 line-clamp-2" title={t.issue}>{t.issue}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => setSelectedTicket(t)}
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
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50 flex flex-col lg:flex-row items-center justify-between shrink-0 gap-4 rounded-b-lg">
            <span className="text-xs sm:text-sm text-gray-500 font-medium text-center sm:text-left">
              Menampilkan <span className="font-bold text-gray-900">{Math.min((currentPage - 1) * itemsPerPage + 1, tickets.length)}</span> hingga <span className="font-bold text-gray-900">{Math.min(currentPage * itemsPerPage, tickets.length)}</span> dari <span className="font-bold text-gray-900">{tickets.length}</span> laporan
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-gray-200 text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-100 bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                disabled={currentPage === totalPages || tickets.length === 0}
                className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-gray-200 text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-100 bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Eskalasi Detail Modal ────────────────────────────────────────────────── */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white shadow-2xl flex flex-col overflow-hidden rounded-3xl w-full max-w-2xl max-h-[85vh]">
            
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Detail Laporan Kerusakan</h3>
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
                    <p className="text-xs text-gray-500">{selectedTicket.dateReported}</p>
                  </div>
                </div>
              </div>

              {/* Right: Notes & Actions */}
              <div className="w-full md:w-1/2 p-4 sm:p-6 flex flex-col">
                <div className="flex-1">
                  <h5 className="text-sm font-bold text-gray-900 mb-2">Kronologi / Deskripsi Kerusakan</h5>
                  <div className="bg-amber-50 border border-amber-100 text-amber-900 p-4 rounded-xl text-sm leading-relaxed mb-6">
                    "{selectedTicket.issue}"
                  </div>


                </div>

                {/* Actions Grid */}
                <div className="pt-4 border-t border-gray-100 mt-auto">
                  {selectedTicket.status === 'Menunggu Tindakan' && (
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => handleAction('Dimusnahkan')}
                        className="flex flex-col items-center justify-center gap-1.5 p-2 sm:p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        <span className="text-xs font-bold">Musnahkan (Write-off)</span>
                      </button>
                      <button 
                        onClick={() => handleAction('Selesai')}
                        className="flex flex-col items-center justify-center gap-1.5 p-2 sm:p-3 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        <span className="text-xs font-bold text-center leading-tight mt-1">Selesai &<br/>Kembalikan</span>
                      </button>
                    </div>
                  )}

                  {selectedTicket.status === 'Dimusnahkan' && (
                    <div className="w-full p-4 rounded-xl bg-gray-100 text-gray-500 font-medium text-sm text-center border border-gray-200">
                      Aset ini telah dihapus permanen dari sistem.
                    </div>
                  )}
                </div>
              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* ── Modal Input Temuan Kerusakan ── */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between bg-red-50 shrink-0">
              <h3 className="text-lg font-bold text-red-900 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Catat Temuan Kerusakan
              </h3>
              <button onClick={() => setIsReportModalOpen(false)} className="text-red-700 hover:text-red-900">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between items-end">
                  <span>Nama/ID Aset <span className="text-red-500">*</span></span>
                  <button 
                    onClick={() => {
                      setReportForm(f => ({ ...f, assetId: 'Gas Detector (MSA Altair 4X)', qtyOrSn: 'SN-MSA-004' }));
                      showToast('Barcode berhasil dipindai!');
                    }}
                    className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 px-2 py-1 rounded transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                    Scan Barcode
                  </button>
                </label>
                <input
                  type="text" 
                  value={reportForm.assetId} 
                  onChange={e => setReportForm(f => ({ ...f, assetId: e.target.value }))}
                  placeholder="Ketik nama atau ID aset..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">S/N atau Qty <span className="text-gray-400 font-normal">(opsional)</span></label>
                <input
                  type="text" 
                  value={reportForm.qtyOrSn} 
                  onChange={e => setReportForm(f => ({ ...f, qtyOrSn: e.target.value }))}
                  placeholder="Mis. SN-1234 atau 5 unit"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Foto Temuan Fisik <span className="text-gray-400 font-normal">(Maks. 5 Foto)</span>
                  </label>
                  <span className="text-xs font-bold text-gray-500">{reportForm.photos.length} / 5</span>
                </div>
                
                {reportForm.photos.length > 0 && (
                  <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                    {reportForm.photos.map((p, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-md overflow-hidden shrink-0 border border-gray-200">
                        <img src={p} className="w-full h-full object-cover" alt="Captured" />
                        <button onClick={() => setReportForm(f => ({ ...f, photos: f.photos.filter((_, idx) => idx !== i) }))} className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {reportForm.photos.length < 5 && (
                  <button onClick={() => setIsCameraOpen(true)} className="w-full flex flex-col items-center justify-center h-24 border-2 border-indigo-300 border-dashed rounded-lg cursor-pointer bg-indigo-50/50 hover:bg-indigo-50 transition-colors text-indigo-600">
                    <svg className="w-6 h-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span className="text-sm font-bold">Buka Kamera Langsung</span>
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Kerusakan <span className="text-red-500">*</span></label>
                <textarea 
                  value={reportForm.notes} 
                  onChange={e => setReportForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none min-h-[80px]"
                  placeholder="Jelaskan detail temuan fisik secara spesifik..."
                />
              </div>
            </div>
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsReportModalOpen(false)} className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50">Batal</button>
              <button onClick={handleSaveReport} className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-40"
                disabled={!reportForm.assetId || !reportForm.notes}>
                Simpan & Eskalasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Simulated Camera Modal ── */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[80] flex flex-col bg-black items-center justify-center">
          <div className="relative w-full max-w-md h-full sm:h-[80vh] sm:rounded-2xl overflow-hidden bg-gray-900 flex flex-col">
            <div className="flex items-center justify-between p-4 bg-black/50 absolute top-0 w-full z-10">
              <span className="text-white font-mono text-sm">KAMERA AKTIF</span>
              <button onClick={() => setIsCameraOpen(false)} className="text-white hover:text-gray-300">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex-1 flex items-center justify-center relative">
              <div className="absolute inset-0 bg-gray-800 animate-pulse opacity-50"></div>
              <p className="text-gray-400 font-mono text-xs z-10">[Simulasi Viewfinder Kamera]</p>
              {/* Target bracket */}
              <div className="absolute w-48 h-48 border-2 border-white/20 z-10 flex flex-col justify-between">
                <div className="w-full flex justify-between"><div className="w-4 h-4 border-t-2 border-l-2 border-white"></div><div className="w-4 h-4 border-t-2 border-r-2 border-white"></div></div>
                <div className="w-full flex justify-between"><div className="w-4 h-4 border-b-2 border-l-2 border-white"></div><div className="w-4 h-4 border-b-2 border-r-2 border-white"></div></div>
              </div>
            </div>

            <div className="h-32 bg-black flex items-center justify-center pb-4">
              <button 
                onClick={() => {
                  const simulatedPhotos = [
                    'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=200&q=80',
                    'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200&q=80',
                    'https://images.unsplash.com/photo-1544257121-654859a22f35?w=200&q=80',
                    'https://images.unsplash.com/photo-1581092335397-9583eb92d232?w=200&q=80',
                    'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=200&q=80'
                  ];
                  const randomPhoto = simulatedPhotos[Math.floor(Math.random() * simulatedPhotos.length)];
                  setReportForm(f => ({ ...f, photos: [...f.photos, randomPhoto] }));
                  setIsCameraOpen(false);
                  showToast('Foto berhasil ditangkap!');
                }}
                className="w-16 h-16 rounded-full border-4 border-white bg-red-500 hover:bg-red-600 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.5)]"
              ></button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
