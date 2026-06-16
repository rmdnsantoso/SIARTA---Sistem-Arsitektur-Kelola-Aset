'use client'

import React, { useState } from 'react'
import { Ticket, TicketStatus } from '../../types/ticket'
import { initialTickets } from '../../lib/dummyData'
import StatCard from '../dashboard/StatCard'

interface Props {
  tickets?: Ticket[]
}

type ActionModal = {
  ticket: Ticket
  type: 'setujui' | 'tolak' | 'serah_terima'
}

function StatusBadge({ status, stage }: { status: TicketStatus, stage: string }) {
  const map: Record<TicketStatus, string> = {
    Menunggu: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    Disetujui: 'bg-green-50 text-green-700 border-green-200',
    Ditolak: 'bg-red-50 text-red-700 border-red-200',
    Selesai: 'bg-blue-50 text-blue-700 border-blue-200',
  }
  return (
    <div className="flex flex-col items-start gap-1">
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${map[status]}`}>
        {status}
      </span>
      {(status === 'Menunggu' || status === 'Disetujui') && (
        <span className="text-xs text-gray-500">Posisi: {stage}</span>
      )}
    </div>
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

export default function BorrowingProcess({ tickets = initialTickets }: Props) {
  const [localTickets, setLocalTickets] = useState<Ticket[]>(tickets)
  
  // State khusus Alokasi Fisik
  const [catatan, setCatatan] = useState('')
  const [allocatedBulkCount, setAllocatedBulkCount] = useState<number>(0)
  const [allocatedSerials, setAllocatedSerials] = useState<string[]>([])
  const [currentScan, setCurrentScan] = useState('')
  
  // Modal State
  const [modal, setModal] = useState<{
    type: 'setujui' | 'tolak' | 'serah_terima' | 'detail',
    ticket: Ticket
  } | null>(null)
  
  const [toast, setToast] = useState<string | null>(null)
  
  // Search
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTickets = localTickets.filter(t => 
    t.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.peminjam.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.alat.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleOpenAllocation = (ticket: Ticket) => {
    setModal({ ticket, type: 'setujui' })
    setCatatan('')
    setAllocatedBulkCount(0)
    setAllocatedSerials([])
    setCurrentScan('')
  }

  const handleAddSerial = () => {
    if (currentScan.trim() && !allocatedSerials.includes(currentScan.trim())) {
      setAllocatedSerials([...allocatedSerials, currentScan.trim()])
      setCurrentScan('')
    }
  }

  const handleConfirm = () => {
    if (!modal) return
    const { ticket, type } = modal

    setLocalTickets(prev => prev.map(t => {
      if (t.id !== ticket.id) return t
      
      if (type === 'setujui') {
        const units = ticket.assetType === 'SERIALIZED' ? allocatedSerials : [`BULK_QTY_${allocatedBulkCount}`]
        return {
          ...t,
          currentStage: 'HSSE',
          allocatedUnits: units,
          flow: t.flow.map(f =>
            f.stage === 'Admin' ? { ...f, status: 'Disetujui' } : f
          ),
        }
      } else if (type === 'tolak') {
        return {
          ...t,
          overallStatus: 'Ditolak',
          flow: t.flow.map(f =>
            f.stage === 'Admin' ? { ...f, status: 'Ditolak' } : f
          ),
        }
      } else if (type === 'serah_terima') {
        return {
          ...t,
          overallStatus: 'Selesai',
          flow: t.flow.map(f =>
            f.stage === 'Serah Terima' ? { ...f, status: 'Disetujui' } : f
          ),
        }
      }
      return t
    }))

    if (type === 'setujui') showToast(`✓ Tiket ${ticket.id} dialokasikan & diteruskan ke HSSE.`)
    else if (type === 'tolak') showToast(`✗ Tiket ${ticket.id} ditolak.`)
    else showToast(`✓ Serah terima tiket ${ticket.id} selesai. Barang resmi keluar gudang.`)
    
    setModal(null)
  }

  // Cek apakah form alokasi sudah valid
  const isAllocationValid = () => {
    if (!modal) return true
    if (modal.type === 'tolak') return catatan.trim().length > 0
    if (modal.type !== 'setujui') return true
    if (modal.ticket.assetType === 'SERIALIZED') {
      return allocatedSerials.length === modal.ticket.jumlah
    }
    if (modal.ticket.assetType === 'BULK') {
      return allocatedBulkCount === modal.ticket.jumlah
    }
    return true
  }

  // Calculate stats
  const pendingVerifikasi = localTickets.filter(t => t.overallStatus === 'Menunggu' && t.currentStage === 'Admin').length
  const pendingSerahTerima = localTickets.filter(t => t.overallStatus === 'Disetujui' && t.currentStage === 'Serah Terima').length
  const selesaiCount = localTickets.filter(t => t.overallStatus === 'Selesai').length
  const konflikCount = localTickets.filter(t => t.conflictWith && t.overallStatus === 'Menunggu' && t.currentStage === 'Admin').length

  const stats = [
    { label: 'Verifikasi Fisik (Antrean)', value: pendingVerifikasi, iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { label: 'Siap Serah Terima', value: pendingSerahTerima, iconPath: 'M5 13l4 4L19 7' },
    { label: 'Selesai / Diambil', value: selesaiCount, iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Konflik Stok', value: konflikCount, iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
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
              <h2 className="text-lg font-semibold text-gray-900">Semua Tiket Peminjaman</h2>
              <p className="text-sm text-gray-500">Kelola verifikasi fisik dan serah terima aset ke pekerja.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input 
                  type="text" 
                  placeholder="Cari Tiket..." 
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

          <div className="overflow-auto flex-1 relative">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  {['ID Pengajuan', 'Pemohon', 'Aset & Lokasi', 'Kuantitas', 'Periode Pinjam', 'Status', 'Tindakan', ''].map((h, i) => (
                    <th key={i} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTickets.map((ticket) => {
                  const isAdminActionable = ticket.overallStatus === 'Menunggu' && ticket.currentStage === 'Admin'
                  const isHandoverActionable = ticket.overallStatus === 'Disetujui' && ticket.currentStage === 'Serah Terima'
                  const hasConflict = !!ticket.conflictWith && ticket.overallStatus === 'Menunggu' && ticket.currentStage === 'Admin'
                  
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
                        <p className="text-sm font-bold text-gray-900">{ticket.alat}</p>
                        <p className="text-xs text-gray-500 mt-1">{ticket.lokasi}</p>
                        {ticket.allocatedUnits && ticket.allocatedUnits.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {ticket.allocatedUnits.map(sn => (
                              <span key={sn} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-mono rounded border border-gray-200">
                                {sn.startsWith('BULK_QTY_') ? `Jml: ${sn.split('_')[2]}` : `SN: ${sn}`}
                              </span>
                            ))}
                          </div>
                        )}
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
                        <StatusBadge status={ticket.overallStatus} stage={ticket.currentStage} />
                      </td>

                      {/* Tindakan */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2 items-center">
                          {isAdminActionable ? (
                            <>
                              <button
                                onClick={() => handleOpenAllocation(ticket)}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                              >
                                Alokasikan
                              </button>
                              <button
                                onClick={() => setModal({ ticket, type: 'tolak' })}
                                className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
                              >
                                Tolak
                              </button>
                            </>
                          ) : isHandoverActionable ? (
                            <button
                              onClick={() => setModal({ ticket, type: 'serah_terima' })}
                              className="px-3 py-1.5 bg-amber-500 text-white rounded text-sm font-medium hover:bg-amber-600 transition-colors flex items-center gap-1.5"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              Serah Terima
                            </button>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </div>
                      </td>

                      {/* Detail Riwayat (Dipisah) */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button 
                          onClick={() => setModal({ type: 'detail', ticket })}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                          title="Lihat Detail Riwayat"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                      </td>
                    </tr>
                  )
                })}
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

      </div>

      {/* MODAL ALOKASI / KONFIRMASI / DETAIL */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity">
          <div className={`bg-white shadow-2xl flex flex-col overflow-hidden rounded-3xl ${modal.type === 'setujui' || modal.type === 'detail' ? 'w-full max-w-4xl max-h-[85vh]' : 'w-full max-w-sm'}`}>
            
            {/* Modal Header */}
            <div className={`px-6 py-5 border-b shrink-0 ${
              modal.type === 'setujui' ? 'bg-blue-600 text-white' : 
              modal.type === 'serah_terima' ? 'bg-amber-500 text-white' : 
              modal.type === 'detail' ? 'bg-gray-900 text-white' :
              'bg-red-600 text-white'
            }`}>
              <h3 className="text-xl font-extrabold">
                {modal.type === 'setujui' ? 'Alokasi Fisik Unit' : 
                 modal.type === 'serah_terima' ? 'Serah Terima Barang' : 
                 modal.type === 'detail' ? 'Riwayat Pelacakan Tiket' :
                 'Konfirmasi Penolakan'}
              </h3>
              <p className="text-sm opacity-90 mt-1">
                Tiket: {modal.ticket.id} {modal.type === 'detail' && `| Diajukan: ${modal.ticket.tanggalPinjam}`}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {modal.type !== 'detail' && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="text-sm font-bold text-gray-900">{modal.ticket.alat}</div>
                  <div className="text-xs text-gray-500 mt-1">Diminta: <strong className="text-gray-900">{modal.ticket.jumlah}</strong> unit</div>
                  <div className="text-xs text-gray-500 mt-0.5">Tipe: <strong className="text-gray-900">{modal.ticket.assetType || 'N/A'}</strong></div>
                </div>
              )}

              {/* LOGIKA ALOKASI BERDASARKAN TIPE */}
              {modal.type === 'setujui' && modal.ticket.assetType === 'SERIALIZED' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Scan Nomor Seri (SN)</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={currentScan}
                        onChange={e => setCurrentScan(e.target.value)}
                        placeholder="Scan atau ketik SN..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <button onClick={handleAddSerial} disabled={!currentScan.trim() || allocatedSerials.length >= modal.ticket.jumlah} className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold disabled:opacity-50">Tambah</button>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="text-xs font-bold text-gray-500 mb-3 flex justify-between">
                      <span>UNIT DIALOKASIKAN</span>
                      <span className={`${allocatedSerials.length === modal.ticket.jumlah ? 'text-green-600' : 'text-blue-600'}`}>{allocatedSerials.length} / {modal.ticket.jumlah}</span>
                    </div>
                    <div className="space-y-2">
                      {allocatedSerials.length === 0 ? (
                        <div className="text-xs text-gray-400 italic">Belum ada unit yang di-scan.</div>
                      ) : (
                        allocatedSerials.map(sn => (
                          <div key={sn} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                            <span className="text-sm font-mono font-bold text-gray-800">{sn}</span>
                            <button onClick={() => setAllocatedSerials(allocatedSerials.filter(s => s !== sn))} className="text-red-500 hover:bg-red-50 p-1 rounded">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {modal.type === 'setujui' && modal.ticket.assetType === 'BULK' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                    <p className="text-sm text-blue-700">Barang ini bertipe <strong>GROSIR (BULK)</strong>. Scan Master QR pada rak untuk memverifikasi lokasi.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Scan Master QR Rak</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={currentScan}
                        onChange={e => setCurrentScan(e.target.value)}
                        placeholder="Scan QR Rak..."
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                      />
                      <button 
                        onClick={() => {
                          if(currentScan.trim()) {
                            setAllocatedBulkCount(modal.ticket.jumlah);
                            setCurrentScan('');
                            showToast('✓ Rak terverifikasi. Jumlah disesuaikan otomatis.');
                          }
                        }} 
                        disabled={!currentScan.trim()} 
                        className="px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold disabled:opacity-50"
                      >
                        Verifikasi
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Konfirmasi Jumlah Fisik yang Diambil</label>
                    <input 
                      type="number" 
                      value={allocatedBulkCount || ''}
                      onChange={e => setAllocatedBulkCount(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-lg font-bold text-center focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-2 text-center">Jumlah otomatis terisi setelah Anda men-scan QR Rak. Ubah angka ini hanya jika Anda mengambil jumlah yang lebih sedikit dari permintaan.</p>
                  </div>
                </div>
              )}

              {modal.type === 'serah_terima' && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                  <p className="text-sm text-amber-800 font-medium">Pastikan pekerja menerima barang fisik berikut:</p>
                  <ul className="mt-2 space-y-1">
                    {modal.ticket.allocatedUnits?.map(sn => (
                       <li key={sn} className="text-sm font-bold text-amber-900">• {sn.startsWith('BULK_QTY_') ? `Jumlah: ${sn.split('_')[2]} buah` : `SN: ${sn}`}</li>
                    ))}
                  </ul>
                </div>
              )}

              {modal.type === 'tolak' && (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                    <p className="text-sm text-red-800 font-medium">Anda akan menolak pengajuan ini. Harap berikan alasan yang jelas agar pemohon mengerti.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Alasan Penolakan <span className="text-red-500">*</span></label>
                    <textarea 
                      value={catatan}
                      onChange={e => setCatatan(e.target.value)}
                      placeholder="Misal: Stok fisik saat ini sedang dikalibrasi..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none min-h-[100px] resize-y"
                    />
                  </div>
                </div>
              )}

              {modal.type === 'detail' && (
                <div className="space-y-6">
                  {/* Tracking Flow Visualizer */}
                  <div className="relative border-l-2 border-gray-200 ml-3 space-y-8 pb-4">
                    {modal.ticket.trackingLogs && modal.ticket.trackingLogs.length > 0 ? (
                      modal.ticket.trackingLogs.map((log, idx) => (
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
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3 shrink-0">
              {modal.type === 'detail' ? (
                <button
                  onClick={() => setModal(null)}
                  className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800"
                >
                  Tutup Riwayat
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setModal(null)}
                    className="flex-1 py-3 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={!isAllocationValid()}
                    className={`flex-1 py-3 text-white rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed ${
                      modal.type === 'setujui' ? 'bg-blue-600 hover:bg-blue-700' : modal.type === 'serah_terima' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {modal.type === 'setujui' ? 'Kunci Alokasi & Lanjut' : modal.type === 'serah_terima' ? 'Selesai Serah Terima' : 'Konfirmasi Tolak'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
