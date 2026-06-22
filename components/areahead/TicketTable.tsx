'use client'

import React, { useState } from 'react'
import { Ticket, TicketStatus } from '../../types/ticket'

interface TicketTableProps {
  tickets: Ticket[]
  handleAction: (ticket: Ticket, action: 'Setujui' | 'Tolak') => void
}

function StatusBadge({ status }: { status: TicketStatus }) {
  const map: Record<TicketStatus, string> = {
    Menunggu: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    Disetujui: 'bg-green-50 text-green-700 border-green-200',
    Ditolak: 'bg-red-50 text-red-700 border-red-200',
    Selesai: 'bg-blue-50 text-blue-700 border-blue-200',
    Dipinjam: 'bg-purple-50 text-purple-700 border-purple-200',
    Dikembalikan: 'bg-gray-50 text-gray-700 border-gray-200',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${map[status] || map.Menunggu}`}>
      {status}
    </span>
  )
}

function ConflictWarning({ conflictWith }: { conflictWith: string }) {
  return (
    <div className="flex items-start gap-1.5 mt-2 bg-red-50 border border-red-100 rounded p-2">
      <svg className="w-4 h-4 text-red-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span className="text-xs text-red-700">
        Konflik Stok! Diminta juga oleh <strong>{conflictWith}</strong>.
      </span>
    </div>
  )
}

export default function TicketTable({ tickets, handleAction }: TicketTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const filteredTickets = tickets.filter(t => 
    t.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.peminjam.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.alat.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage)
  const paginatedTickets = filteredTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Daftar Pengajuan Aktif</h2>
          <p className="text-sm text-gray-500">Menampilkan pengajuan yang memerlukan peninjauan.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Cari ID atau Pemohon..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64"
            />
          </div>
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Saring
          </button>
        </div>
      </div>

      <div className="lg:hidden p-2 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50/30">
        {paginatedTickets.map((ticket) => {
          const isActionable = ticket.overallStatus === 'Menunggu' && ticket.currentStage === 'Area Head'
          const hasConflict = !!ticket.conflictWith && ticket.overallStatus === 'Menunggu'

          return (
            <div key={ticket.id} className="bg-white p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 flex flex-col gap-2.5 sm:gap-4">
              <div className="flex justify-between items-start gap-3 sm:gap-4">
                <div className="min-w-0">
                  <h3 className="font-extrabold text-gray-900 text-sm sm:text-base leading-tight">{ticket.alat}</h3>
                  <div className="text-xs sm:text-sm font-medium text-blue-600 mt-0.5 sm:mt-1">{ticket.id}</div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`inline-flex items-center text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md border whitespace-nowrap ${ticket.jumlah > ticket.stokTersedia || hasConflict ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                    {ticket.jumlah} unit
                  </span>
                  <div className="text-[9px] sm:text-[10px] font-medium text-gray-500 mt-0.5 sm:mt-1">Stok: {ticket.stokTersedia}</div>
                </div>
              </div>

              {hasConflict && <div className="mt-1"><ConflictWarning conflictWith={ticket.conflictWith!} /></div>}

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

              {/* Actions */}
              {isActionable && (
                <div className="flex gap-2 sm:gap-2 mt-1 sm:mt-1 border-t border-gray-100 pt-3">
                  <button
                    onClick={() => handleAction(ticket, 'Setujui')}
                    className="flex-1 py-1.5 sm:py-2.5 bg-blue-600 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:bg-blue-700 transition-colors"
                  >
                    Setujui
                  </button>
                  <button
                    onClick={() => handleAction(ticket, 'Tolak')}
                    className="flex-1 py-1.5 sm:py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:bg-red-100 transition-colors"
                  >
                    Tolak
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {paginatedTickets.length === 0 && (
          <div className="py-12 text-center bg-white rounded-2xl border border-gray-100 border-dashed">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <p className="text-gray-500 font-medium">Tidak ada tiket yang ditemukan.</p>
          </div>
        )}
      </div>

      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {['ID Pengajuan', 'Pemohon', 'Aset & Lokasi', 'Kuantitas', 'Periode Pinjam', 'Tindakan'].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedTickets.map((ticket) => {
              const isActionable = ticket.overallStatus === 'Menunggu' && ticket.currentStage === 'Area Head'
              const hasConflict = !!ticket.conflictWith && ticket.overallStatus === 'Menunggu'
              return (
                <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                  
                  {/* ID Pengajuan */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-blue-600">{ticket.id}</span>
                    {hasConflict && (
                      <span className="block mt-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded w-fit uppercase">
                        Konflik Stok
                      </span>
                    )}
                  </td>

                  {/* Pemohon */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-medium text-gray-900">{ticket.peminjam}</p>
                    <p className="text-xs text-gray-500">{ticket.jabatan}</p>
                  </td>

                  {/* Aset & Lokasi */}
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{ticket.alat}</p>
                    <p className="text-xs text-gray-500 mt-1">{ticket.lokasi}</p>
                    {hasConflict && <ConflictWarning conflictWith={ticket.conflictWith!} />}
                  </td>

                  {/* Kuantitas */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1.5">
                      <div className={`text-sm font-bold ${ticket.jumlah > ticket.stokTersedia || hasConflict ? 'text-red-600' : 'text-gray-900'}`}>
                        {ticket.jumlah} <span className="text-xs font-normal text-gray-500">unit diajukan</span>
                      </div>
                      <div className="text-[11px] font-medium text-gray-500 bg-gray-50 border border-gray-100 rounded px-2 py-0.5 w-fit">
                        Live Stok: <span className={`font-bold ${ticket.stokTersedia < ticket.jumlah ? 'text-red-600' : 'text-blue-600'}`}>{ticket.stokTersedia}</span>
                      </div>
                    </div>
                  </td>

                  {/* Periode */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-900">{ticket.tanggalPinjam}</p>
                    <p className="text-xs text-gray-500">{ticket.tanggalKembali}</p>
                  </td>

                  {/* Tindakan */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isActionable ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(ticket, 'Setujui')}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          Setujui
                        </button>
                        <button
                          onClick={() => handleAction(ticket, 'Tolak')}
                          className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded text-sm font-bold hover:bg-red-100 transition-colors shadow-sm"
                        >
                          Tolak
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
            {paginatedTickets.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  Tidak ada tiket yang cocok dengan pencarian "{searchQuery}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 0 && (
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <span className="text-xs sm:text-sm text-gray-500 font-medium text-center sm:text-left">
            Menampilkan <span className="font-bold text-gray-900">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredTickets.length)}</span> hingga <span className="font-bold text-gray-900">{Math.min(currentPage * itemsPerPage, filteredTickets.length)}</span> dari <span className="font-bold text-gray-900">{filteredTickets.length}</span> pengajuan
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
              disabled={currentPage === totalPages}
              className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-gray-200 text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-100 bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
