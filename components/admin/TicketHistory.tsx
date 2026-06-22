'use client'

import React, { useState } from 'react'
import { Ticket, TicketStatus } from '../../types/ticket'
import { initialTickets } from '../../lib/dummyData'
import StatCard from '../dashboard/StatCard'

interface Props {
  tickets?: Ticket[]
}

function StatusBadge({ status, stage, align = 'start' }: { status: TicketStatus, stage: string, align?: 'start' | 'end' }) {
  const map: Record<TicketStatus, string> = {
    Menunggu: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    Disetujui: 'bg-green-50 text-green-700 border-green-200',
    Ditolak: 'bg-red-50 text-red-700 border-red-200',
    Selesai: 'bg-blue-50 text-blue-700 border-blue-200',
    Dipinjam: 'bg-purple-50 text-purple-700 border-purple-200',
    Dikembalikan: 'bg-gray-50 text-gray-700 border-gray-200',
  }
  return (
    <div className={`flex flex-col gap-1 ${align === 'end' ? 'items-end text-right' : 'items-start text-left'}`}>
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${map[status] || map.Menunggu}`}>
        {status}
      </span>
      {(status === 'Menunggu' || status === 'Disetujui' || status === 'Dipinjam') && (
        <span className="text-xs text-gray-500">Posisi: {stage}</span>
      )}
    </div>
  )
}

export default function TicketHistory({ tickets = initialTickets }: Props) {
  const [localTickets] = useState<Ticket[]>(tickets)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('Semua')

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Modal State for details
  const [modalTicket, setModalTicket] = useState<Ticket | null>(null)

  const filteredTickets = localTickets.filter(t => {
    const matchesSearch = 
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.peminjam.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.alat.toLowerCase().includes(searchQuery.toLowerCase())
      
    if (filterStatus === 'Semua') return matchesSearch
    return t.overallStatus === filterStatus && matchesSearch
  })

  // Calculate stats
  const totalSelesai = localTickets.filter(t => t.overallStatus === 'Selesai' || t.overallStatus === 'Dikembalikan').length
  const totalDitolak = localTickets.filter(t => t.overallStatus === 'Ditolak').length
  const totalDipinjam = localTickets.filter(t => t.overallStatus === 'Dipinjam').length
  const totalPengajuan = localTickets.length

  const stats: Array<{ label: string, value: number, iconPath: string, colorTheme: 'default' | 'blue' | 'green' | 'amber' | 'red' | 'purple' }> = [
    { label: 'Total Pengajuan', value: totalPengajuan, iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', colorTheme: 'blue' },
    { label: 'Selesai / Dikembalikan', value: totalSelesai, iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', colorTheme: 'green' },
    { label: 'Sedang Dipinjam', value: totalDipinjam, iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', colorTheme: 'amber' },
    { label: 'Ditolak', value: totalDitolak, iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z', colorTheme: 'red' },
  ]

  return (
    <div className="font-sans">
      {/* Main Content Area */}
      <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8">
        
        {/* Stat Cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-6">
          {stats.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>

        {/* Unified Table */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Rekapitulasi Pengajuan</h2>
              <p className="text-sm text-gray-500">Melihat seluruh riwayat tiket yang sudah selesai, ditolak, atau dikembalikan.</p>
            </div>
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 w-full lg:w-auto mt-4 lg:mt-0">
              <div className="relative w-full lg:w-auto">
                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input 
                  type="text" 
                  placeholder="Cari ID, Nama, atau Aset..." 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full lg:w-64"
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
                <option value="Menunggu">Menunggu</option>
                <option value="Disetujui">Disetujui</option>
                <option value="Selesai">Selesai</option>
                <option value="Dipinjam">Dipinjam</option>
                <option value="Dikembalikan">Dikembalikan</option>
                <option value="Ditolak">Ditolak</option>
              </select>
            </div>
          </div>

          <div className="lg:hidden p-2 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50/30">
            {filteredTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((ticket) => (
              <div key={ticket.id} className="bg-white p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 flex flex-col gap-2.5 sm:gap-4">
                <div className="flex justify-between items-start gap-3 sm:gap-4">
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-gray-900 text-sm sm:text-base leading-tight">{ticket.alat}</h3>
                    <div className="text-[10px] sm:text-xs font-medium text-blue-600 mt-0.5 sm:mt-1">{ticket.id}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <StatusBadge status={ticket.overallStatus} stage={ticket.currentStage} align="end" />
                    <div className="text-[10px] sm:text-xs font-bold text-gray-500 mt-0.5 sm:mt-1">{ticket.jumlah} unit</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 rounded-lg sm:rounded-xl">
                  <div>
                    <p className="text-gray-500 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider mb-0.5">Pemohon</p>
                    <p className="font-bold text-gray-900 text-xs sm:text-sm">{ticket.peminjam}</p>
                    <p className="text-[10px] sm:text-xs font-mono text-gray-500">{ticket.nip || 'NIP-XXX'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider mb-0.5">Periode Pinjam</p>
                    <p className="font-bold text-gray-900 text-xs sm:text-sm">{ticket.tanggalPinjam}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">s.d. {ticket.tanggalKembali}</p>
                  </div>
                </div>

                <button
                  onClick={() => setModalTicket(ticket)}
                  className="w-full py-1.5 sm:py-2.5 mt-1 bg-white border border-gray-200 text-gray-700 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 sm:gap-2"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  Lihat Detail Riwayat
                </button>
              </div>
            ))}
            {filteredTickets.length === 0 && (
              <div className="py-12 text-center bg-white rounded-2xl border border-gray-100 border-dashed">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <p className="text-gray-500 font-medium">Tidak ada riwayat yang cocok.</p>
              </div>
            )}
          </div>

          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  {['ID Pengajuan', 'Pemohon', 'Aset & Lokasi', 'Kuantitas', 'Periode Pinjam', 'Status Akhir'].map((h, i) => (
                    <th key={i} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Riwayat
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((ticket) => (
                  <tr key={ticket.id} className="group hover:bg-gray-50 transition-colors">
                    {/* ID Pengajuan */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-blue-600">{ticket.id}</span>
                    </td>

                    {/* Pemohon */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{ticket.peminjam}</div>
                      <div className="text-xs font-mono text-gray-500 mt-0.5 tracking-tight">{ticket.nip || 'NIP-XXX'}</div>
                      <div className="text-xs text-blue-600 font-medium mt-0.5">{ticket.jabatan}</div>
                    </td>

                    {/* Aset & Lokasi */}
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">{ticket.alat}</p>
                      <p className="text-xs text-gray-500 mt-1">{ticket.lokasi}</p>
                      {ticket.allocatedUnits && ticket.allocatedUnits.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                            {ticket.allocatedUnits.map((sn, idx) => {
                              if (sn.startsWith('NON_SERIAL_QTY_')) {
                                const qty = sn.replace('NON_SERIAL_QTY_', '');
                                return (
                                  <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded border border-blue-200 shadow-sm">
                                    [Non-Serial] Fisik Keluar: {qty}
                                  </span>
                                );
                              }
                              return (
                                <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-mono rounded border border-gray-200 shadow-sm">
                                  {sn}
                                </span>
                              );
                            })}
                        </div>
                      )}
                    </td>

                    {/* Kuantitas */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1.5">
                        <div className="text-sm font-bold text-gray-900">
                          {ticket.jumlah} <span className="text-xs font-normal text-gray-500">unit</span>
                        </div>
                      </div>
                    </td>

                    {/* Periode */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900">{ticket.tanggalPinjam}</p>
                      <p className="text-xs text-gray-500">{ticket.tanggalKembali}</p>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={ticket.overallStatus} stage={ticket.currentStage} />
                    </td>

                    {/* Detail Riwayat */}
                    <td className="px-6 py-4 whitespace-nowrap text-left transition-colors">
                      <button 
                        onClick={() => setModalTicket(ticket)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                        title="Lihat Detail Riwayat"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {/* Removed redundant empty state check, handled internally by loop length > 0 typically but keep if needed */}
                {filteredTickets.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      Tidak ada riwayat tiket yang cocok dengan filter atau pencarian Anda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {Math.ceil(filteredTickets.length / itemsPerPage) > 0 && (
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50 flex flex-col lg:flex-row items-center justify-between shrink-0 gap-4 rounded-b-lg">
              <span className="text-xs sm:text-sm text-gray-500 font-medium text-center sm:text-left">
                Menampilkan <span className="font-bold text-gray-900">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredTickets.length)}</span> hingga <span className="font-bold text-gray-900">{Math.min(currentPage * itemsPerPage, filteredTickets.length)}</span> dari <span className="font-bold text-gray-900">{filteredTickets.length}</span> hasil
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
                  className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-gray-200 text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-100 bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DETAIL RIWAYAT */}
      {modalTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white shadow-2xl flex flex-col overflow-hidden rounded-3xl w-full max-w-4xl max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b shrink-0 bg-gray-900 text-white">
              <h3 className="text-xl font-extrabold">Riwayat Pelacakan Tiket</h3>
              <p className="text-sm opacity-90 mt-1">Tiket: {modalTicket.id} | Diajukan: {modalTicket.tanggalPinjam}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
              {/* Tracking Flow Visualizer */}
              <div className="relative border-l-2 border-gray-200 ml-3 space-y-8 pb-4">
                {modalTicket.trackingLogs && modalTicket.trackingLogs.length > 0 ? (
                  modalTicket.trackingLogs.map((log, idx) => (
                    <div key={idx} className="relative pl-6">
                      <span className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${
                        log.status.toLowerCase().includes('ditolak') ? 'bg-red-500' :
                        log.status.toLowerCase().includes('menunggu') ? 'bg-amber-500' :
                        'bg-blue-500'
                      }`} />
                      <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-gray-900 text-sm">{log.stage}</h4>
                          <span className="text-[10px] font-bold text-gray-400">{log.timestamp}</span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed mb-2">{log.status}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          {log.actor}
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
                  <div className="pl-6 text-sm text-gray-500 italic">Belum ada riwayat aktivitas spesifik.</div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex shrink-0">
              <button
                onClick={() => setModalTicket(null)}
                className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800"
              >
                Tutup Riwayat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
