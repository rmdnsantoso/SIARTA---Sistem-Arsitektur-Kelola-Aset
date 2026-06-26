'use client'
import React, { useState } from 'react'
import { Ticket, TicketStatus } from '../../types/ticket'
import StatCard from '../shared/StatCard'
interface Props {
  tickets: Ticket[]
  onUpdateTickets: React.Dispatch<React.SetStateAction<Ticket[]>>
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
      {status === 'Menunggu' && (
        <span className="text-[10px] text-gray-500">Tahap: {stage}</span>
      )}
    </div>
  )
}
export default function TiketSaya({ tickets, onUpdateTickets }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('Semua')
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  // Modal State for details
  const [modalTicket, setModalTicket] = useState<Ticket | null>(null)
  // Filter tickets to only display those belonging to "Ahmad" and which are active (Menunggu, Disetujui, Dipinjam)
  const activeStatuses = ['Menunggu', 'Disetujui', 'Dipinjam']
  const myTickets = tickets.filter(t => t.peminjam === 'Ahmad' && activeStatuses.includes(t.overallStatus))
  const filteredTickets = myTickets.filter(t => {
    const matchesSearch = 
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.alat.toLowerCase().includes(searchQuery.toLowerCase())
      
    if (filterStatus === 'Semua') return matchesSearch
    return t.overallStatus === filterStatus && matchesSearch
  })
  // Calculate metrics
  const totalMenunggu = myTickets.filter(t => t.overallStatus === 'Menunggu').length
  const totalDipinjam = myTickets.filter(t => t.overallStatus === 'Dipinjam').length
  const totalDisetujui = myTickets.filter(t => t.overallStatus === 'Disetujui').length
  const totalAktif = myTickets.length
  const stats = [
    { label: 'Total Tiket Aktif', value: totalAktif, iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', colorTheme: 'blue' as const },
    { label: 'Menunggu Persetujuan', value: totalMenunggu, iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', colorTheme: 'amber' as const },
    { label: 'Disetujui (Siap Ambil)', value: totalDisetujui, iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', colorTheme: 'green' as const },
    { label: 'Sedang Dipinjam', value: totalDipinjam, iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', colorTheme: 'purple' as const },
  ]
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
        {stats.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>
      {/* Main Table Container */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-3 sm:p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Tiket Peminjaman Aktif</h2>
            <p className="text-xs sm:text-sm text-gray-500">Melihat daftar permohonan yang sedang berjalan atau dipinjam.</p>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 mt-2 lg:mt-0 w-full lg:w-auto">
            <div className="relative w-full lg:w-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input 
                type="text" 
                placeholder="Cari ID atau Nama Aset..." 
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
              className="px-3 py-1.5 sm:py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors outline-none focus:ring-2 focus:ring-blue-500 w-full lg:w-auto"
            >
              <option value="Semua">Semua Status</option>
              <option value="Menunggu">Menunggu</option>
              <option value="Disetujui">Disetujui</option>
              <option value="Dipinjam">Dipinjam</option>
            </select>
          </div>
        </div>
        <div className="lg:hidden p-2 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50/30">
          {filteredTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((ticket) => (
            <div key={ticket.id} className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 flex flex-col gap-3">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <h3 className="font-extrabold text-gray-900 text-sm sm:text-base leading-tight">{ticket.alat}</h3>
                  <div className="text-xs font-medium text-blue-600 mt-1">{ticket.id}</div>
                </div>
                <div className="shrink-0">
                  <StatusBadge status={ticket.overallStatus} stage={ticket.currentStage} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-2.5 bg-gray-50 rounded-lg sm:rounded-xl text-xs">
                <div>
                  <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Lokasi</p>
                  <p className="font-bold text-gray-900">{ticket.lokasi}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Kuantitas</p>
                  <p className="font-bold text-gray-900">{ticket.jumlah} unit</p>
                </div>
                <div className="col-span-2 border-t border-gray-200/60 pt-2 mt-1">
                  <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Periode Pinjam</p>
                  <p className="font-bold text-gray-900">{ticket.tanggalPinjam} <span className="text-gray-400 font-normal">s/d</span> {ticket.tanggalKembali}</p>
                </div>
              </div>

              {ticket.allocatedUnits && ticket.allocatedUnits.length > 0 && (
                <div>
                  <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Alokasi Unit</p>
                  <div className="flex flex-wrap gap-1">
                    {ticket.allocatedUnits.map((sn, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-mono rounded border border-indigo-200 shadow-sm">
                        {sn}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end pt-2 border-t border-gray-100">
                <button 
                  onClick={() => setModalTicket(ticket)}
                  className="w-full py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors border border-blue-200 flex items-center justify-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Lacak Progres
                </button>
              </div>
            </div>
          ))}
          {filteredTickets.length === 0 && (
            <div className="py-12 text-center bg-white rounded-2xl border border-gray-100 border-dashed">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <p className="text-gray-500 font-medium text-sm">Tidak ada tiket aktif yang cocok.</p>
            </div>
          )}
        </div>
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {['ID Tiket', 'Aset & Lokasi', 'Kuantitas', 'Periode Pinjam', 'Alokasi Unit', 'Status', 'Aksi'].map((h, i) => (
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
                  {/* Alokasi Unit */}
                  <td className="px-6 py-4">
                    {ticket.allocatedUnits && ticket.allocatedUnits.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {ticket.allocatedUnits.map((sn, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-mono rounded border border-indigo-200 shadow-sm">
                            {sn}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Belum dialokasikan</span>
                    )}
                  </td>
                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={ticket.overallStatus} stage={ticket.currentStage} />
                  </td>
                  {/* Aksi */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={() => setModalTicket(ticket)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200"
                      title="Lacak Progres Peminjaman"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTickets.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada tiket aktif yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Footer */}
        {Math.ceil(filteredTickets.length / itemsPerPage) > 0 && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between shrink-0 gap-3 rounded-b-lg">
            <span className="text-xs sm:text-sm text-gray-500 font-medium text-center sm:text-left">
              Menampilkan <span className="font-bold text-gray-900">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredTickets.length)}</span> hingga <span className="font-bold text-gray-900">{Math.min(currentPage * itemsPerPage, filteredTickets.length)}</span> dari <span className="font-bold text-gray-900">{filteredTickets.length}</span> tiket
            </span>
            <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-center">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-gray-200 text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-100 bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Sebelumnya
              </button>
              
              <div className="flex items-center gap-0.5 sm:gap-1">
                {Array.from({ length: Math.ceil(filteredTickets.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 sm:w-8 h-7 sm:h-8 flex items-center justify-center rounded-lg text-xs sm:text-sm font-bold transition-all ${
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
                className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-gray-200 text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-100 bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>
      {/* TRACKING FLOW MODAL */}
      {modalTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white shadow-2xl flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl w-full max-w-3xl max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-4 bg-blue-600 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold">Detail Pelacakan Tiket</h3>
                <p className="text-xs opacity-90 mt-0.5">ID Tiket: {modalTicket.id} | Alat: {modalTicket.alat}</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto overscroll-y-contain p-4 sm:p-6 space-y-6 bg-white">
              {/* Approval Steps flow - Beautiful Horizontal Stepper with Visible Connecting Lines */}
              <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50 flex items-center justify-between w-full shadow-2xs overflow-x-auto no-scrollbar">
                {modalTicket.flow.map((f, i) => (
                  <React.Fragment key={f.stage}>
                    <div className="flex flex-col items-center gap-1.5 flex-1 min-w-[64px] sm:min-w-[80px] py-1">
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-2xs ${
                        f.status === 'Disetujui' ? 'bg-green-500 text-white' :
                        f.status === 'Ditolak' ? 'bg-red-500 text-white' :
                        f.status === 'Menunggu' && modalTicket.currentStage === f.stage ? 'bg-amber-500 text-white animate-pulse' :
                        'bg-gray-200 text-gray-500'
                      }`}>
                        {i + 1}
                      </div>
                      <span className="text-[10px] sm:text-xs font-bold text-gray-800 text-center leading-tight whitespace-normal line-clamp-2">{f.stage}</span>
                      <span className={`text-[9px] sm:text-[10px] text-center px-1.5 py-0.5 rounded-md font-bold ${
                        f.status === 'Disetujui' ? 'bg-green-100 text-green-700' :
                        f.status === 'Ditolak' ? 'bg-red-100 text-red-700' :
                        f.status === 'Menunggu' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>{f.status}</span>
                    </div>
                    {i < modalTicket.flow.length - 1 && (
                      <div className="h-0.5 bg-gray-200 flex-1 min-w-[12px] sm:min-w-[24px] mx-1 sm:mx-2 self-start mt-3.5 sm:mt-4" />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Logs timeline */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3 text-xs sm:text-sm uppercase tracking-wide text-gray-600">Riwayat Aktivitas & Catatan</h4>
                <div className="relative border-l-2 border-gray-200 ml-3 space-y-4 sm:space-y-5 pb-1">
                  {modalTicket.trackingLogs && modalTicket.trackingLogs.length > 0 ? (
                    modalTicket.trackingLogs.map((log, idx) => (
                      <div key={idx} className="relative pl-5 sm:pl-6">
                        <span className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-2xs ${
                          log.status.toLowerCase().includes('ditolak') ? 'bg-red-500' :
                          log.status.toLowerCase().includes('peminjam') ? 'bg-blue-500' :
                          'bg-green-500'
                        }`} />
                        <div className="bg-white border border-gray-100 p-3.5 sm:p-4 rounded-xl shadow-2xs hover:shadow-sm transition-shadow">
                          <div className="flex justify-between items-start mb-1.5">
                            <h4 className="font-bold text-gray-900 text-xs sm:text-sm">{log.stage}</h4>
                            <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">{log.timestamp}</span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-2.5">{log.status}</p>
                          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg w-fit border border-gray-100">
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            Oleh: {log.actor}
                          </div>
                          {log.notes && (
                            <div className="mt-2 text-xs bg-amber-50 text-amber-800 p-2.5 rounded-lg border border-amber-100 italic shadow-2xs">
                              "{log.notes}"
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="pl-5 sm:pl-6 text-xs sm:text-sm text-gray-500 italic">Belum ada riwayat detail log. Status saat ini: {modalTicket.overallStatus}.</div>
                  )}
                </div>
              </div>
            </div>
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100 bg-gray-50 flex shrink-0">
              <button
                onClick={() => setModalTicket(null)}
                className="w-full py-2 sm:py-2.5 bg-gray-900 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-gray-800 transition-colors shadow-sm"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
