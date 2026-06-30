'use client'

import React, { useState } from 'react'
import { Ticket, TicketStatus } from '../../types/ticket'
import StatCard from '../shared/StatCard'
import { approveTicketByHSSE, rejectTicketByHSSE } from '../../actions/workflows/verifikasi'

interface Props {
  tickets: Ticket[]
}

type ModalState = {
  ticket: Ticket
  type: 'setujui' | 'tolak' | 'detail'
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

export default function HSSEBorrowingProcess({ tickets }: Props) {
  const [localTickets, setLocalTickets] = useState<Ticket[]>(tickets)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [catatan, setCatatan] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Tiket yang menunggu aksi HSSE
  const pendingTickets = localTickets.filter(t => t.currentStage === 'HSSE' || t.currentStage === 'Menunggu Verifikasi HSSE')

  const filteredTickets = pendingTickets.filter(t =>
    t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.peminjam.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.alat.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage)
  const paginatedTickets = filteredTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const handleConfirm = async () => {
    if (!modal) return
    const { ticket, type } = modal
    setLoading(true)

    try {
      if (type === 'setujui') {
        if (ticket.dbId) {
          const res = await approveTicketByHSSE(ticket.dbId, catatan || 'Aset sesuai standar K3.')
          if (!res.success) {
            alert(`Gagal memverifikasi: ${res.error}`)
            setLoading(false)
            return
          }
        }
        setLocalTickets(prev => prev.map(t =>
          t.id !== ticket.id ? t : {
            ...t,
            currentStage: 'Area Head' as any,
            flow: t.flow.map(f => f.stage === 'HSSE' ? { ...f, status: 'Disetujui' as TicketStatus } : f),
            trackingLogs: [
              ...(t.trackingLogs || []),
              {
                stage: 'HSSE',
                status: 'Inspeksi K3 selesai. Meneruskan ke Area Head.',
                actor: 'Hendra (HSSE)',
                timestamp: new Date().toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB',
                notes: catatan || undefined
              }
            ]
          }
        ))
        showToast(`✓ Tiket ${ticket.id} disetujui HSSE, diteruskan ke Area Head.`, 'success')
      } else if (type === 'tolak') {
        if (!catatan.trim()) {
          alert('Alasan penolakan wajib diisi untuk keamanan K3.')
          setLoading(false)
          return
        }
        if (ticket.dbId) {
          const res = await rejectTicketByHSSE(ticket.dbId, catatan)
          if (!res.success) {
            alert(`Gagal menolak: ${res.error}`)
            setLoading(false)
            return
          }
        }
        setLocalTickets(prev => prev.map(t =>
          t.id !== ticket.id ? t : {
            ...t,
            overallStatus: 'Ditolak' as TicketStatus,
            currentStage: 'Ditolak oleh HSSE' as any,
            flow: t.flow.map(f => f.stage === 'HSSE' ? { ...f, status: 'Ditolak' as TicketStatus } : f),
            trackingLogs: [
              ...(t.trackingLogs || []),
              {
                stage: 'HSSE',
                status: `Ditolak: ${catatan}`,
                actor: 'Hendra (HSSE)',
                timestamp: new Date().toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB',
                notes: catatan
              }
            ]
          }
        ))
        showToast(`✗ Tiket ${ticket.id} ditolak oleh HSSE.`, 'error')
      }
    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err.message}`)
    } finally {
      setLoading(false)
      setModal(null)
      setCatatan('')
    }
  }

  const stats: Array<{ label: string; value: number; iconPath: string; colorTheme: 'amber' | 'blue' | 'green' | 'red' }> = [
    {
      label: 'Menunggu Inspeksi K3',
      value: pendingTickets.length,
      iconPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      colorTheme: 'amber'
    },
    {
      label: 'Total Pengajuan',
      value: localTickets.length,
      iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      colorTheme: 'blue'
    },
    {
      label: 'Disetujui HSSE',
      value: localTickets.filter(t => t.flow.find(f => f.stage === 'HSSE')?.status === 'Disetujui').length,
      iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      colorTheme: 'green'
    },
    {
      label: 'Ditolak HSSE',
      value: localTickets.filter(t => t.overallStatus === 'Ditolak' && (t.currentStage as string).includes('HSSE')).length,
      iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
      colorTheme: 'red'
    },
  ]

  return (
    <div className="font-sans space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 shrink-0">
        {stats.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Ticket List */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-gray-900">Antrian Inspeksi K3</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Tiket yang memerlukan verifikasi keselamatan sebelum diteruskan ke Area Head.</p>
          </div>
          <div className="relative w-full sm:w-auto">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Cari ID atau Pemohon..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value) }}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-full sm:w-64"
            />
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden p-3 sm:p-4 space-y-3 bg-gray-50/30">
          {paginatedTickets.map((ticket) => (
            <div key={ticket.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-sm">{ticket.alat}</h3>
                  <div className="text-xs font-medium text-emerald-600 mt-0.5">{ticket.id}</div>
                </div>
                <StatusBadge status={ticket.overallStatus} />
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-xl text-xs">
                <div>
                  <p className="text-gray-500 font-bold uppercase text-[9px] tracking-wider mb-0.5">Pemohon</p>
                  <p className="font-bold text-gray-900">{ticket.peminjam}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-bold uppercase text-[9px] tracking-wider mb-0.5">Periode</p>
                  <p className="font-bold text-gray-900">{ticket.tanggalPinjam}</p>
                  <p className="text-gray-500">s.d. {ticket.tanggalKembali}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-bold uppercase text-[9px] tracking-wider mb-0.5">Lokasi</p>
                  <p className="text-gray-700">{ticket.lokasi}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-bold uppercase text-[9px] tracking-wider mb-0.5">Jumlah</p>
                  <p className="font-bold text-gray-900">{ticket.jumlah} unit</p>
                </div>
              </div>

              <div className="flex gap-2 border-t border-gray-100 pt-3">
                <button
                  onClick={() => { setModal({ ticket, type: 'detail' }) }}
                  className="flex-none px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors"
                >
                  Detail
                </button>
                <button
                  onClick={() => { setCatatan(''); setModal({ ticket, type: 'setujui' }) }}
                  className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors"
                >
                  Setujui K3
                </button>
                <button
                  onClick={() => { setCatatan(''); setModal({ ticket, type: 'tolak' }) }}
                  className="flex-1 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                >
                  Tolak
                </button>
              </div>
            </div>
          ))}
          {paginatedTickets.length === 0 && (
            <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              <p className="text-gray-500 font-medium text-sm">Tidak ada tiket yang perlu diinspeksi.</p>
              <p className="text-gray-400 text-xs mt-1">Semua pengajuan telah diproses.</p>
            </div>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['ID Pengajuan', 'Pemohon', 'Aset & Lokasi', 'Kuantitas', 'Periode Pinjam', 'Tindakan K3'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-emerald-600">{ticket.id}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-medium text-gray-900">{ticket.peminjam}</p>
                    <p className="text-xs text-gray-500">{ticket.jabatan}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{ticket.alat}</p>
                    <p className="text-xs text-gray-500 mt-1">{ticket.lokasi}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-gray-900">{ticket.jumlah} unit</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-900">{ticket.tanggalPinjam}</p>
                    <p className="text-xs text-gray-500">{ticket.tanggalKembali}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setCatatan(''); setModal({ ticket, type: 'setujui' }) }}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                      >
                        Setujui K3
                      </button>
                      <button
                        onClick={() => { setCatatan(''); setModal({ ticket, type: 'tolak' }) }}
                        className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors"
                      >
                        Tolak
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedTickets.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada tiket yang memerlukan inspeksi K3.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs sm:text-sm text-gray-500 font-medium">
              Menampilkan <span className="font-bold text-gray-900">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredTickets.length)}</span> hingga <span className="font-bold text-gray-900">{Math.min(currentPage * itemsPerPage, filteredTickets.length)}</span> dari <span className="font-bold text-gray-900">{filteredTickets.length}</span> tiket
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Sebelumnya</button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${currentPage === page ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:bg-gray-200'}`}>{page}</button>
                ))}
              </div>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Selanjutnya</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal Konfirmasi / Detail ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            
            {/* Detail Modal */}
            {modal.type === 'detail' && (
              <>
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                  <div>
                    <h3 className="text-lg font-extrabold text-gray-900">Detail Pengajuan</h3>
                    <p className="text-sm text-gray-500">{modal.ticket.id}</p>
                  </div>
                  <button onClick={() => setModal(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { label: 'Pemohon', value: modal.ticket.peminjam },
                    { label: 'Aset', value: modal.ticket.alat },
                    { label: 'Jumlah', value: `${modal.ticket.jumlah} unit` },
                    { label: 'Lokasi Penggunaan', value: modal.ticket.lokasi },
                    { label: 'Periode', value: `${modal.ticket.tanggalPinjam} – ${modal.ticket.tanggalKembali}` },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">{row.label}</span>
                      <span className="text-gray-900 font-bold text-right">{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="p-6 pt-0 flex gap-3">
                  <button onClick={() => { setCatatan(''); setModal({ ...modal, type: 'setujui' }) }} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors">Setujui K3</button>
                  <button onClick={() => { setCatatan(''); setModal({ ...modal, type: 'tolak' }) }} className="flex-1 py-3 bg-red-50 text-red-700 border border-red-200 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors">Tolak</button>
                </div>
              </>
            )}

            {/* Setujui Modal */}
            {modal.type === 'setujui' && (
              <>
                <div className="px-6 py-5 border-b border-gray-100 bg-emerald-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-gray-900">Konfirmasi Persetujuan K3</h3>
                      <p className="text-sm text-gray-600">{modal.ticket.id} — {modal.ticket.alat}</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-sm text-gray-600">Anda menyatakan bahwa aset ini telah memenuhi standar keselamatan K3 untuk digunakan di <strong>{modal.ticket.lokasi}</strong>.</p>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Catatan Inspeksi <span className="text-gray-400 font-normal">(opsional)</span></label>
                    <textarea
                      rows={3}
                      value={catatan}
                      onChange={e => setCatatan(e.target.value)}
                      placeholder="Mis. Alat dalam kondisi baik, sertifikat kalibrasi masih berlaku..."
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none transition-all"
                    />
                  </div>
                </div>
                <div className="px-6 pb-6 flex gap-3">
                  <button onClick={() => setModal(null)} className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors">Batal</button>
                  <button onClick={handleConfirm} disabled={loading} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50">
                    {loading ? 'Memproses...' : 'Setujui & Teruskan'}
                  </button>
                </div>
              </>
            )}

            {/* Tolak Modal */}
            {modal.type === 'tolak' && (
              <>
                <div className="px-6 py-5 border-b border-gray-100 bg-red-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-gray-900">Tolak Pengajuan (K3)</h3>
                      <p className="text-sm text-gray-600">{modal.ticket.id} — {modal.ticket.alat}</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-sm text-gray-600">Tiket akan ditolak karena tidak memenuhi standar keselamatan. Peminjam akan mendapat notifikasi.</p>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Alasan Penolakan K3 <span className="text-red-500">*</span></label>
                    <textarea
                      rows={3}
                      value={catatan}
                      onChange={e => setCatatan(e.target.value)}
                      placeholder="Mis. Sertifikat kalibrasi alat sudah kadaluwarsa, aset tidak layak pakai..."
                      className="w-full border border-red-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-400 outline-none resize-none transition-all"
                    />
                  </div>
                </div>
                <div className="px-6 pb-6 flex gap-3">
                  <button onClick={() => setModal(null)} className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors">Batal</button>
                  <button onClick={handleConfirm} disabled={loading || !catatan.trim()} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-50">
                    {loading ? 'Memproses...' : 'Tolak Pengajuan'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}
