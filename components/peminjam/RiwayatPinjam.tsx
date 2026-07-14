'use client'
import React, { useState, useEffect } from 'react'
import { Ticket, TicketStatus } from '../../types/ticket'
import { initialTickets } from '../../lib/dummyData'
import StatCard from '../shared/StatCard'

import { usePolling } from '../../hooks/usePolling'
import { getHistoryTicketsByUser } from '../../actions/core/ticket'
import { getLoggedInUser } from '../../actions/core/session'
import { adaptTickets } from '../../types/db'

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

export default function RiwayatPinjam() {

  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('Semua')
  
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [totalHistory, setTotalHistory] = useState(0)
  const [totalSelesai, setTotalSelesai] = useState(0)
  const [totalDitolak, setTotalDitolak] = useState(0)
  
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)
    return () => clearTimeout(handler)
  }, [searchQuery])
  
  const fetchData = async () => {
    try {
      const sessionRes = await getLoggedInUser()
      const userId = sessionRes.user?.id
      if (!userId) return
      
      const res = await getHistoryTicketsByUser(userId, currentPage, itemsPerPage, undefined, undefined, debouncedSearch, filterStatus)
      if (res.data) {
        setTickets(adaptTickets(res.data))
        setTotalPages(res.totalPages)
        setTotalHistory(res.total)
        setTotalSelesai(res.totalSelesai || 0)
        setTotalDitolak(res.totalDitolak || 0)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [currentPage, debouncedSearch, filterStatus])

  usePolling(fetchData, 120000)

  // Modal State for details
  const [modalTicketId, setModalTicketId] = useState<string | null>(null)
  const modalTicket = modalTicketId ? tickets.find(t => t.id === modalTicketId) || null : null

  const stats = [
    { label: 'Total Riwayat', value: totalHistory, iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', colorTheme: 'blue' as const },
    { label: 'Selesai Dikembalikan', value: totalSelesai, iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', colorTheme: 'green' as const },
    { label: 'Pengajuan Ditolak', value: totalDitolak, iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z', colorTheme: 'red' as const },
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
        {stats.map((card, idx) => (
          <div key={card.label} className={idx === 2 ? "col-span-2 sm:col-span-1" : ""}>
            <StatCard {...card} />
          </div>
        ))}
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-3 sm:p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Riwayat Peminjaman Alat</h2>
            <p className="text-xs sm:text-sm text-gray-500">Melihat rekapitulasi seluruh pengajuan peminjaman Anda yang sudah selesai atau ditolak.</p>
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
              <option value="Dikembalikan">Dikembalikan</option>
              <option value="Ditolak">Ditolak</option>
            </select>
          </div>
        </div>

        <div className="lg:hidden p-2 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50/30">
          {loading ? (
            <div className="py-10 text-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
          ) : tickets.map((ticket) => (
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
                {ticket.alasan && (
                  <div>
                    <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Alasan</p>
                    <p className="font-bold text-gray-900">{ticket.alasan}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Kuantitas</p>
                  <p className="font-bold text-gray-900">{ticket.jumlah} unit</p>
                </div>
                <div className="col-span-2 border-t border-gray-200/60 pt-2 mt-1">
                  <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Periode Pinjam</p>
                  <p className="font-bold text-gray-900">{ticket.tanggalPinjam} <span className="text-gray-400 font-normal">s/d</span> {ticket.tanggalKembali}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <button 
                  onClick={() => setModalTicketId(ticket.id)}
                  className="w-full py-2 bg-gray-900 text-white hover:bg-gray-800 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Lihat Histori Lengkap
                </button>
              </div>
            </div>
          ))}
          {!loading && tickets.length === 0 && (
            <div className="py-12 text-center bg-white rounded-2xl border border-gray-100 border-dashed">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <p className="text-gray-500 font-medium text-sm">Tidak ada riwayat peminjaman yang ditemukan.</p>
            </div>
          )}
        </div>

        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {['ID Tiket', 'Aset', 'Kuantitas', 'Periode Pinjam', 'Status Akhir', 'Detail'].map((h, i) => (
                  <th key={i} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={6} className="py-10 text-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
              ) : tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                  {/* ID Pengajuan */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-blue-600">{ticket.id}</span>
                  </td>
                  {/* Aset & Alasan */}
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-900">{ticket.alat}</p>
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
                  {/* Detail */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={() => setModalTicketId(ticket.id)}
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
              {!loading && tickets.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada riwayat peminjaman yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 0 && (
          <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <span className="text-xs sm:text-sm text-gray-500 font-medium text-center sm:text-left">
              Menampilkan <span className="font-bold text-gray-900">{tickets.length}</span> dari <span className="font-bold text-gray-900">{totalHistory}</span> riwayat
            </span>
            <div className="flex gap-1 sm:gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 justify-center sm:justify-end">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || loading}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Sebelumnya
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    disabled={loading}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs sm:text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      currentPage === i + 1 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || loading || tickets.length === 0}
                className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-gray-200 text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-100 bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TRACKING DETAILS MODAL */}
      {modalTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white shadow-2xl flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl w-full max-w-3xl max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-800 shrink-0 bg-gray-950 text-white flex justify-between items-center">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold">Histori Lengkap Peminjaman</h3>
                <p className="text-xs opacity-90 mt-0.5">ID Tiket: {modalTicket.id} | Status Akhir: {modalTicket.overallStatus}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-y-contain p-4 sm:p-6 space-y-4 sm:space-y-6 bg-white">
              {/* Logs timeline */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3 text-xs sm:text-sm uppercase tracking-wide text-gray-600">Kronologi Aktivitas Tiket</h4>
                <div className="relative border-l-2 border-gray-200 ml-3 space-y-4 sm:space-y-5 pb-1">
                  {modalTicket.trackingLogs && modalTicket.trackingLogs.length > 0 ? (
                    modalTicket.trackingLogs.map((log, idx) => (
                      <div key={idx} className="relative pl-5 sm:pl-6">
                        <span className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-2xs ${
                          log.status.toLowerCase().includes('kembali') ? 'bg-blue-500' :
                          log.status.toLowerCase().includes('ditolak') ? 'bg-red-500' :
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
                    <div className="pl-5 sm:pl-6 text-xs sm:text-sm text-gray-500 italic">Belum ada riwayat aktivitas detail.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100 bg-gray-50 flex shrink-0">
              <button
                onClick={() => setModalTicketId(null)}
                className="w-full py-2 sm:py-2.5 bg-gray-900 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-gray-800 transition-colors shadow-sm"
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
