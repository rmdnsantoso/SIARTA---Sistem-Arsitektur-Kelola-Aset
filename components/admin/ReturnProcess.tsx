'use client'

import React, { useState } from 'react'
import { Ticket } from '../../types/ticket'
import { initialTickets } from '../../lib/dummyData'
import StatCard from '../dashboard/StatCard'

interface Props {
  tickets?: Ticket[]
}

type Condition = 'BAIK' | 'RUSAK' | 'HILANG' | null

export default function ReturnProcess({ tickets = initialTickets }: Props) {
  // Only interested in tickets that are currently borrowed
  const [localTickets, setLocalTickets] = useState<Ticket[]>(tickets.filter(t => t.overallStatus === 'Dipinjam'))
  
  // Modal State
  const [modalTicket, setModalTicket] = useState<Ticket | null>(null)
  const [condition, setCondition] = useState<Condition>(null)
  const [notes, setNotes] = useState('')
  
  const [toast, setToast] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTickets = localTickets.filter(t => 
    t.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.peminjam.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.alat.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.allocatedUnits && t.allocatedUnits.some(sn => sn.toLowerCase().includes(searchQuery.toLowerCase())))
  )

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleOpenProcess = (ticket: Ticket) => {
    setModalTicket(ticket)
    setCondition(null)
    setNotes('')
  }

  const handleConfirmReturn = () => {
    if (!modalTicket || !condition) return

    setLocalTickets(prev => prev.filter(t => t.id !== modalTicket.id))

    if (condition === 'BAIK') {
      showToast(`✓ Barang dari tiket ${modalTicket.id} dikembalikan dalam kondisi baik.`)
    } else if (condition === 'RUSAK') {
      showToast(`⚠️ Barang dari tiket ${modalTicket.id} dikembalikan dengan status RUSAK. Dilaporkan ke sistem.`)
    } else if (condition === 'HILANG') {
      showToast(`❌ Barang dari tiket ${modalTicket.id} dilaporkan HILANG. Investigasi dimulai.`)
    }
    
    setModalTicket(null)
  }

  // Calculate stats based on current active list
  const stats = [
    { label: 'Sedang Dipinjam', value: localTickets.length, iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { label: 'Lewat Jatuh Tempo', value: 0, iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' }, // Dummy 0 for now
  ]

  return (
    <div className="font-sans flex flex-col h-full overflow-hidden bg-gray-50">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[99] px-5 py-3 bg-gray-900 text-white rounded-lg shadow-xl text-sm font-medium animate-fade-in flex items-center gap-2">
          {toast}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden p-8">
        
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 shrink-0">
          {stats.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>

        {/* Unified Table */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col min-h-0 flex-1">
          <div className="px-6 py-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Pengembalian Aset (Walk-in)</h2>
              <p className="text-sm text-gray-500">Pindai barang yang dibawa pekerja untuk memproses pengembalian.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                <input 
                  type="text" 
                  placeholder="Pindai QR / Ketik SN..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-blue-300 bg-blue-50/30 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-72 font-mono"
                  autoFocus
                />
              </div>
            </div>
          </div>

          <div className="overflow-auto flex-1 relative">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  {['ID Pengajuan', 'Peminjam', 'Aset & SN Dipinjam', 'Kuantitas', 'Tenggat Waktu', 'Tindakan'].map((h, i) => (
                    <th key={i} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                    {/* ID Pengajuan */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-blue-600">{ticket.id}</span>
                    </td>

                    {/* Peminjam */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-gray-900">{ticket.peminjam}</p>
                      <p className="text-xs text-gray-500">{ticket.jabatan}</p>
                    </td>

                    {/* Aset & SN */}
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">{ticket.alat}</p>
                      {ticket.allocatedUnits && ticket.allocatedUnits.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {ticket.allocatedUnits.map(sn => (
                            <span key={sn} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-mono rounded border border-blue-200">
                              {sn.startsWith('BULK_QTY_') ? `Jml: ${sn.split('_')[2]}` : `SN: ${sn}`}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Kuantitas */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        {ticket.jumlah} <span className="text-xs font-normal text-gray-500">unit</span>
                      </div>
                    </td>

                    {/* Tenggat Waktu */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-gray-900">{ticket.tanggalKembali}</p>
                      <p className="text-[10px] uppercase text-gray-500 mt-1">Harus Kembali</p>
                    </td>

                    {/* Tindakan */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenProcess(ticket)}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                        Proses Terima
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredTickets.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Tidak ada barang yang sedang dipinjam atau cocok dengan pencarian Anda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL PENGEMBALIAN */}
      {modalTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white shadow-2xl flex flex-col overflow-hidden rounded-3xl w-full max-w-lg">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b shrink-0 bg-gray-900 text-white">
              <h3 className="text-xl font-extrabold">Inspeksi & Pengembalian</h3>
              <p className="text-sm opacity-90 mt-1">Tiket: {modalTicket.id} | {modalTicket.peminjam}</p>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="text-sm font-bold text-gray-900">{modalTicket.alat}</div>
                <div className="text-xs text-gray-500 mt-1">Jumlah Kembali: <strong className="text-gray-900">{modalTicket.jumlah}</strong> unit</div>
                {modalTicket.allocatedUnits && (
                  <div className="mt-2 text-xs font-mono text-gray-500 break-words">
                    SN/Ref: {modalTicket.allocatedUnits.join(', ')}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Bagaimana kondisi fisik barang saat ini?</label>
                <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={() => setCondition('BAIK')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${condition === 'BAIK' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-green-200 text-gray-500'}`}
                  >
                    <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span className="text-xs font-bold uppercase tracking-wider">Baik</span>
                  </button>
                  <button 
                    onClick={() => setCondition('RUSAK')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${condition === 'RUSAK' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-200 hover:border-amber-200 text-gray-500'}`}
                  >
                    <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <span className="text-xs font-bold uppercase tracking-wider">Cacat/Rusak</span>
                  </button>
                  <button 
                    onClick={() => setCondition('HILANG')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${condition === 'HILANG' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 hover:border-red-200 text-gray-500'}`}
                  >
                    <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-xs font-bold uppercase tracking-wider">Hilang</span>
                  </button>
                </div>
              </div>

              {(condition === 'RUSAK' || condition === 'HILANG') && (
                <div className="animate-fade-in space-y-2">
                  <label className="block text-sm font-bold text-gray-700">
                    Catatan {condition === 'RUSAK' ? 'Kerusakan' : 'Kehilangan'} <span className="text-red-500">*</span>
                  </label>
                  <textarea 
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder={condition === 'RUSAK' ? "Jelaskan bagian mana yang rusak/cacat..." : "Jelaskan kronologi singkat pelaporan hilang..."}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px] resize-y"
                  />
                  {condition === 'RUSAK' && (
                    <button className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      Unggah Foto Kerusakan (Opsional)
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3 shrink-0">
              <button
                onClick={() => setModalTicket(null)}
                className="flex-1 py-3 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReturn}
                disabled={!condition || ((condition === 'RUSAK' || condition === 'HILANG') && notes.trim().length === 0)}
                className={`flex-1 py-3 text-white rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed ${
                  condition === 'BAIK' ? 'bg-green-600 hover:bg-green-700' : 
                  condition === 'RUSAK' ? 'bg-amber-600 hover:bg-amber-700' : 
                  condition === 'HILANG' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-900'
                }`}
              >
                Konfirmasi Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
