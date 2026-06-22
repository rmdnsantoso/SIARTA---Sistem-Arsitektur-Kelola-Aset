'use client'
import React, { useState } from 'react'
import { Ticket, TicketStatus } from '../../types/ticket'
import { initialTickets } from '../../lib/dummyData'
import StatCard from '../shared/StatCard'
interface Props {
  tickets?: Ticket[]
}
function StatusBadge({ status, stage }: { status: TicketStatus, stage: string }) {
  const map: Record<TicketStatus, string> = {
    Menunggu: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    Disetujui: 'bg-green-50 text-green-700 border-green-200',
    Ditolak: 'bg-red-50 text-red-700 border-red-200',
    Selesai: 'bg-blue-50 text-blue-700 border-blue-200',
    Dipinjam: 'bg-purple-50 text-purple-700 border-purple-200',
    Dikembalikan: 'bg-gray-50 text-gray-700 border-gray-200',
  }
  return (
    <div className="flex flex-col items-start gap-1">
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${map[status] || map.Menunggu}`}>
        {status}
      </span>
      {status === 'Dipinjam' && (
        <span className="text-[10px] text-gray-500">Tahap: {stage}</span>
      )}
    </div>
  )
}
export default function RiwayatPinjam({ tickets = initialTickets }: Props) {
  const [localTickets] = useState<Ticket[]>(tickets)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('Semua')
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  // Modal State for details
  const [modalTicket, setModalTicket] = useState<Ticket | null>(null)
  // Filter completed/rejected tickets for Ahmad
  const historyStatuses = ['Selesai', 'Dikembalikan', 'Ditolak']
  const myHistoryTickets = localTickets.filter(t => t.peminjam === 'Ahmad' && historyStatuses.includes(t.overallStatus))
  const filteredTickets = myHistoryTickets.filter(t => {
    const matchesSearch = 
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.alat.toLowerCase().includes(searchQuery.toLowerCase())
      
    if (filterStatus === 'Semua') return matchesSearch
    return t.overallStatus === filterStatus && matchesSearch
  })
  // Calculate metrics
  const totalSelesai = myHistoryTickets.filter(t => t.overallStatus === 'Selesai' || t.overallStatus === 'Dikembalikan').length
  const totalDitolak = myHistoryTickets.filter(t => t.overallStatus === 'Ditolak').length
  const totalLaporRusak = myHistoryTickets.filter(t => t.isReportedDamaged).length
  const totalHistory = myHistoryTickets.length
  const stats = [
    { label: 'Total Riwayat', value: totalHistory, iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', colorTheme: 'blue' as const },
    { label: 'Selesai Dikembalikan', value: totalSelesai, iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', colorTheme: 'green' as const },
    { label: 'Pengajuan Ditolak', value: totalDitolak, iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z', colorTheme: 'red' as const },
    { label: 'Laporan Kerusakan', value: totalLaporRusak, iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', colorTheme: 'amber' as const },
  ]
  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>
      {/* Main Table Container */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Riwayat Peminjaman Alat</h2>
            <p className="text-sm text-gray-500">Melihat rekapitulasi seluruh pengajuan peminjaman Anda yang sudah selesai atau ditolak.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                type="text" 
                placeholder="Cari ID atau Nama Aset..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value)
                setCurrentPage(1)
              }}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Semua">Semua Status</option>
              <option value="Dikembalikan">Dikembalikan</option>
              <option value="Ditolak">Ditolak</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {['ID Tiket', 'Aset & Lokasi', 'Kuantitas', 'Periode Pinjam', 'Status Akhir', 'Kerusakan', 'Detail'].map((h, i) => (
                  <th key={i} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                  {/* ID Pengajuan */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-blue-600">{ticket.id}</span>
                  </td>
                  {/* Aset & Lokasi */}
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-900">{ticket.alat}</p>
                    <p className="text-xs text-gray-500 mt-1">{ticket.lokasi}</p>
                  </td>
                  {/* Kuantitas */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-gray-900">{ticket.jumlah}</span> <span className="text-xs text-gray-500">unit</span>
                  </td>
                  {/* Periode */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <p>{ticket.tanggalPinjam}</p>
                    <p className="text-xs text-gray-400 mt-0.5">s/d {ticket.tanggalKembali}</p>
                  </td>
                  {/* Status Akhir */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={ticket.overallStatus} stage={ticket.currentStage} />
                  </td>
                  {/* Kerusakan */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {ticket.isReportedDamaged ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-red-50 text-red-700 text-xs font-semibold border border-red-100 rounded-md">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Rusak
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Tidak ada</span>
                    )}
                  </td>
                  {/* Detail */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={() => setModalTicket(ticket)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200"
                      title="Lihat Histori Lengkap"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTickets.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada riwayat peminjaman yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Footer */}
        {Math.ceil(filteredTickets.length / itemsPerPage) > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between shrink-0 gap-4 rounded-b-lg">
            <span className="text-sm text-gray-500 font-medium">
              Menampilkan <span className="font-bold text-gray-900">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredTickets.length)}</span> hingga <span className="font-bold text-gray-900">{Math.min(currentPage * itemsPerPage, filteredTickets.length)}</span> dari <span className="font-bold text-gray-900">{filteredTickets.length}</span> riwayat
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
                {Array.from({ length: Math.ceil(filteredTickets.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
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
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredTickets.length / itemsPerPage), p + 1))}
                disabled={currentPage === Math.ceil(filteredTickets.length / itemsPerPage) || filteredTickets.length === 0}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>
      {/* TRACKING DETAILS MODAL */}
      {modalTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white shadow-2xl flex flex-col overflow-hidden rounded-3xl w-full max-w-4xl max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b shrink-0 bg-gray-950 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-extrabold">Histori Lengkap Peminjaman</h3>
                <p className="text-sm opacity-90 mt-1">ID Tiket: {modalTicket.id} | Status Akhir: {modalTicket.overallStatus}</p>
              </div>
              <button 
                onClick={() => setModalTicket(null)}
                className="text-white hover:bg-gray-800 bg-gray-900 p-2 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
              {/* Damage Report View if present */}
              {modalTicket.isReportedDamaged && modalTicket.damageReport && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-start">
                  <div className="w-full md:w-40 h-28 bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-red-100 shadow-sm relative">
                    <img 
                      src={modalTicket.damageReport.imageUrl} 
                      alt="Bukti Kerusakan" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <span className="inline-flex items-center px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold rounded-md uppercase">
                      Laporan Kerusakan Terkirim
                    </span>
                    <h5 className="font-bold text-gray-900 text-sm mt-1">Deskripsi Kerusakan Alat:</h5>
                    <p className="text-sm text-gray-700 leading-relaxed italic">
                      "{modalTicket.damageReport.description}"
                    </p>
                    <p className="text-[10px] text-gray-400 mt-2 font-mono">
                      Dilaporkan pada: {modalTicket.damageReport.timestamp}
                    </p>
                  </div>
                </div>
              )}
              {/* Logs timeline */}
              <div>
                <h4 className="font-bold text-gray-900 mb-4 text-sm">Kronologi Aktivitas Tiket</h4>
                <div className="relative border-l-2 border-gray-200 ml-3 space-y-6 pb-2">
                  {modalTicket.trackingLogs && modalTicket.trackingLogs.length > 0 ? (
                    modalTicket.trackingLogs.map((log, idx) => (
                      <div key={idx} className="relative pl-6">
                        <span className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${
                          log.status.toLowerCase().includes('kembali') ? 'bg-blue-500' :
                          log.status.toLowerCase().includes('ditolak') ? 'bg-red-500' :
                          'bg-green-500'
                        }`} />
                        <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-gray-900 text-sm">{log.stage}</h4>
                            <span className="text-[10px] font-bold text-gray-400">{log.timestamp}</span>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed mb-2">{log.status}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg w-fit">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            Oleh: {log.actor}
                          </div>
                          {log.notes && (
                            <div className="mt-2 text-xs bg-amber-50 text-amber-800 p-2 rounded border border-amber-100 italic">
                              " {log.notes} "
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="pl-6 text-sm text-gray-500 italic">Belum ada riwayat aktivitas detail.</div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex shrink-0">
              <button
                onClick={() => setModalTicket(null)}
                className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors"
              >
                Tutup Histori
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
