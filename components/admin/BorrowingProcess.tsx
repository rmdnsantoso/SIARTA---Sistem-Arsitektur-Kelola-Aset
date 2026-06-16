'use client'

import React, { useState } from 'react'
import { Ticket } from '../../types/ticket'
import { initialTickets } from '../../lib/dummyData'

interface Props {
  tickets?: Ticket[]
}

type ActionModal = {
  ticket: Ticket
  type: 'setujui' | 'tolak' | 'serah_terima'
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
  
  // Tab UI
  const [activeTab, setActiveTab] = useState<'admin' | 'handover' | 'history'>('admin')

  const filterFn = (t: Ticket) => 
    t.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.peminjam.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.alat.toLowerCase().includes(searchQuery.toLowerCase())

  const adminQueue = localTickets.filter(
    t => t.overallStatus === 'Menunggu' && t.currentStage === 'Admin' && filterFn(t)
  )
  const handoverQueue = localTickets.filter(
    t => t.overallStatus === 'Disetujui' && t.currentStage === 'Serah Terima' && filterFn(t)
  )
  const historyQueue = localTickets.filter(
    t => ((t.currentStage !== 'Admin' && t.currentStage !== 'Serah Terima') || t.overallStatus === 'Ditolak' || t.overallStatus === 'Selesai') && filterFn(t)
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
    return true // Default if type unknown
  }

  return (
    <div className="font-sans flex flex-col h-full overflow-hidden bg-gray-50/50">
      
      {/* Header & Tabs */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 shrink-0 z-10">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Verifikasi & Serah Terima Peminjaman</h2>
            <p className="text-sm text-gray-500 mt-1">Kelola antrean verifikasi fisik alat dan serah terima ke pekerja.</p>
          </div>
          <div className="relative">
            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Cari ID tiket, pemohon, aset..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all w-full sm:w-72"
            />
          </div>
        </div>
        
        <div className="flex gap-6 mt-6 border-b border-gray-100">
          <button 
            onClick={() => setActiveTab('admin')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors relative ${activeTab === 'admin' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Antrean Verifikasi Fisik
            {adminQueue.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-700">
                {adminQueue.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('handover')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors relative ${activeTab === 'handover' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Siap Serah Terima
            {handoverQueue.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-700">
                {handoverQueue.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'history' ? 'border-gray-800 text-gray-800' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Riwayat Selesai
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[99] px-5 py-3 bg-gray-900 text-white rounded-lg shadow-xl text-sm font-medium animate-fade-in flex items-center gap-2">
          {toast}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-8">
        
        {/* TAB: VERIFIKASI FISIK (ADMIN) */}
        {activeTab === 'admin' && (
          <div className="space-y-4">
            {adminQueue.some(t => t.conflictWith) && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
                <div className="p-1.5 bg-red-100 rounded-full shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-red-700">Terdeteksi Konflik Stok!</p>
                  <p className="text-xs text-red-600 mt-0.5">Ada pengajuan berebut aset. Tolak salah satu agar alokasi fisik tidak minus.</p>
                </div>
              </div>
            )}

            {adminQueue.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-2xl border border-gray-100 border-dashed">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-gray-500 font-medium">Semua antrean telah dialokasikan.</p>
              </div>
            ) : (
              adminQueue.map(ticket => (
                <div key={ticket.id} className={`bg-white p-5 rounded-2xl shadow-sm border transition-all ${ticket.conflictWith ? 'border-red-300 bg-red-50/30' : 'border-gray-200 hover:shadow-md'}`}>
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center flex-wrap gap-2 mb-1">
                            <span className="text-sm font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{ticket.id}</span>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{ticket.tanggalPinjam} - {ticket.tanggalKembali}</span>
                            {ticket.conflictWith && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded uppercase tracking-wider border border-red-200">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                Konflik Stok dg {ticket.conflictWith}
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-extrabold text-gray-900">{ticket.alat}</h3>
                          <p className="text-sm text-gray-600 mt-1">Pemohon: <span className="font-bold text-gray-900">{ticket.peminjam}</span> ({ticket.jabatan}) di {ticket.lokasi}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black text-gray-900">{ticket.jumlah}</div>
                          <div className="text-xs font-bold text-gray-500 uppercase">Diminta</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div className="text-xs font-medium text-gray-500">Tipe Aset: <strong className="text-gray-900">{ticket.assetType || 'N/A'}</strong></div>
                        <div className="w-px h-4 bg-gray-300"></div>
                        <div className={`text-xs font-bold ${ticket.stokTersedia >= ticket.jumlah ? 'text-green-600' : 'text-red-600'}`}>
                          Stok Gudang: {ticket.stokTersedia} Tersedia
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-full lg:w-48 flex flex-col justify-center gap-2 shrink-0 border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-6">
                      <button
                        onClick={() => handleOpenAllocation(ticket)}
                        className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        Alokasikan Unit
                      </button>
                      <button
                        onClick={() => setModal({ ticket, type: 'tolak' })}
                        className="w-full py-2.5 bg-white border border-red-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors shadow-sm"
                      >
                        Tolak
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB: SERAH TERIMA (HANDOVER) */}
        {activeTab === 'handover' && (
          <div className="space-y-4">
            {handoverQueue.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-2xl border border-gray-100 border-dashed">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" /></svg>
                <p className="text-gray-500 font-medium">Belum ada barang yang siap diserahterimakan.</p>
              </div>
            ) : (
              handoverQueue.map(ticket => (
                <div key={ticket.id} className="bg-white p-5 rounded-2xl shadow-sm border border-amber-200 hover:shadow-md transition-all flex flex-col lg:flex-row gap-6 items-center">
                  <div className="flex-1">
                     <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{ticket.id}</span>
                      <span className="text-xs font-bold text-gray-500 uppercase">Siap Diambil</span>
                    </div>
                    <h3 className="text-lg font-extrabold text-gray-900">{ticket.alat} (x{ticket.jumlah})</h3>
                    <p className="text-sm text-gray-600 mt-1">Pemohon: <span className="font-bold text-gray-900">{ticket.peminjam}</span></p>
                    
                    <div className="mt-3 flex flex-wrap gap-2">
                      {ticket.allocatedUnits?.map(sn => (
                        <span key={sn} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-mono rounded border border-gray-200">
                          {sn.startsWith('BULK_QTY_') ? `Jumlah: ${sn.split('_')[2]}` : `SN: ${sn}`}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="shrink-0 w-full lg:w-auto">
                    <button
                      onClick={() => setModal({ ticket, type: 'serah_terima' })}
                      className="w-full lg:w-auto px-6 py-3 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      Selesaikan Serah Terima
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB: HISTORY */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">ID Tiket</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Tanggal</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Pemohon & Aset</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Status Terkini</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {historyQueue.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{t.id}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{t.tanggalPinjam}</div>
                      <div className="text-xs text-gray-500">s/d {t.tanggalKembali}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">{t.alat}</div>
                      <div className="text-xs text-gray-500">{t.peminjam} ({t.jabatan})</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold border ${
                          t.overallStatus === 'Selesai' ? 'bg-green-50 text-green-700 border-green-200' :
                          t.overallStatus === 'Ditolak' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {t.overallStatus === 'Selesai' ? 'Selesai / Diambil' : 
                           t.overallStatus === 'Ditolak' ? `Ditolak (Oleh ${t.currentStage})` : 
                           `Menunggu (${t.currentStage})`}
                        </span>
                        <button 
                          onClick={() => setModal({ type: 'detail', ticket: t })}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Lihat Detail Riwayat"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL ALOKASI / KONFIRMASI / DETAIL (Tengah) */}
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
