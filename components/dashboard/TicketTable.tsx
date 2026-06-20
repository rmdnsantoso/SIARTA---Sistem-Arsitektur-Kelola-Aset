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
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${map[status] || map.Menunggu}`}>
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

  const filteredTickets = tickets.filter(t => 
    t.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.peminjam.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.alat.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-6 py-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Daftar Pengajuan Aktif</h2>
          <p className="text-sm text-gray-500">Menampilkan pengajuan yang memerlukan peninjauan.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Cari ID atau Pemohon..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {['ID Pengajuan', 'Pemohon', 'Aset & Lokasi', 'Kuantitas', 'Periode Pinjam', 'Status', 'Tindakan'].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTickets.map((ticket) => {
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

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col items-start gap-1">
                      <StatusBadge status={ticket.overallStatus} />
                      {ticket.overallStatus === 'Menunggu' && (
                        <span className="text-xs text-gray-500">Posisi: {ticket.currentStage}</span>
                      )}
                    </div>
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
                          className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
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
            {filteredTickets.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  Tidak ada tiket yang cocok dengan pencarian "{searchQuery}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
        <span className="text-sm text-gray-500">Menampilkan {filteredTickets.length} hasil</span>
        <div className="flex gap-1">
          <button className="px-3 py-1 rounded border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50" disabled>Seb</button>
          <button className="px-3 py-1 rounded bg-blue-600 text-white text-sm font-medium">1</button>
          <button className="px-3 py-1 rounded border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50" disabled>Sel</button>
      </div>
      </div>
    </div>
  )
}
