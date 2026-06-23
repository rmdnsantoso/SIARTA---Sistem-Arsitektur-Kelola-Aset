'use client'

import React, { useState } from 'react'
import { Ticket } from '../../types/ticket'
import { initialTickets } from '../../lib/dummyData'
import StatCard from '../shared/StatCard'

interface Props {
  tickets?: Ticket[]
}

type Condition = 'BAIK' | 'RUSAK' | null

export default function ReturnProcess({ tickets = initialTickets }: Props) {
  // Only interested in tickets that are currently borrowed
  const [localTickets, setLocalTickets] = useState<Ticket[]>(tickets.filter(t => t.overallStatus === 'Dipinjam'))
  
  // Modal State
  const [modalTicket, setModalTicket] = useState<Ticket | null>(null)
  
  const [verifiedSNs, setVerifiedSNs] = useState<string[]>([])
  const [scanInput, setScanInput] = useState('')
  
  const [toast, setToast] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isScanning, setIsScanning] = useState(false)

  // Simulate scanning a specific SN
  const verifySN = (sn: string) => {
    if (modalTicket?.assetType === 'NON_SERIALIZED') {
      setVerifiedSNs(['NON_SERIALIZED_VERIFIED'])
    } else {
      if (!verifiedSNs.includes(sn)) {
        setVerifiedSNs([...verifiedSNs, sn])
      }
    }
  }

  const handleScanInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (modalTicket?.assetType === 'NON_SERIALIZED') {
        verifySN(scanInput)
        setScanInput('')
      } else if (modalTicket?.allocatedUnits?.includes(scanInput)) {
        verifySN(scanInput)
        setScanInput('')
      } else {
        alert(`Serial Number ${scanInput} tidak valid untuk tiket ini.`)
      }
    }
  }

  const handleOpenProcess = (ticket: Ticket, preScannedSN?: string) => {
    setModalTicket(ticket)
    setVerifiedSNs(preScannedSN ? [preScannedSN] : [])
    setScanInput('')
  }

  const filteredTickets = localTickets.filter(t => 
    t.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.peminjam.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.alat.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.allocatedUnits && t.allocatedUnits.some(sn => sn.toLowerCase().includes(searchQuery.toLowerCase())))
  )

  const itemsPerPage = 5
  const [currentPage, setCurrentPage] = useState(1)

  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage)
  const paginatedTickets = filteredTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }


  const handleConfirmReturn = () => {
    if (!modalTicket) return
    setLocalTickets(prev => prev.filter(t => t.id !== modalTicket.id))
    showToast(`✓ Tiket pengembalian ${modalTicket.id} berhasil dikonfirmasi.`)
    setModalTicket(null)
  }

  const isSubmitDisabled = () => {
    if (!modalTicket) return true;
    if (modalTicket.assetType === 'NON_SERIALIZED') {
      return verifiedSNs.length === 0;
    }
    const serializedUnits = modalTicket.allocatedUnits || []
    return verifiedSNs.length !== serializedUnits.length
  }


  const simulateScan = () => {
    setIsScanning(true)
    setTimeout(() => {
      setIsScanning(false)
      // Auto-find TKT-006 (Welding Mask Pro)
      const scannedTicket = localTickets.find(t => t.id === 'TKT-006')
      if (scannedTicket) {
        handleOpenProcess(scannedTicket, 'SN-WLD-005')
        showToast('Berhasil men-scan Barcode SN-WLD-005')
      } else {
        showToast('Barcode tidak ditemukan di sistem.')
      }
    }, 2000)
  }

  // Calculate stats based on current active list
  const stats = [
    { label: 'Sedang Dipinjam', value: localTickets.length, iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', colorTheme: 'blue' as const },
    { label: 'Lewat Jatuh Tempo', value: 0, iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', colorTheme: 'red' as const },
  ]

  return (
    <div className="font-sans">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[99] px-5 py-3 bg-gray-900 text-white rounded-lg shadow-xl text-sm font-medium animate-fade-in flex items-center gap-2">
          {toast}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8">
        
        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-3 lg:gap-6">
          {stats.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>

        {/* Unified Table */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Pengembalian Aset (Walk-in)</h2>
              <p className="text-sm text-gray-500">Pindai barang yang dibawa peminjam untuk memproses pengembalian.</p>
            </div>
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 mt-4 lg:mt-0 w-full lg:w-auto">
              <div className="relative w-full lg:w-auto">
                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input 
                  type="text" 
                  placeholder="Cari ID, Nama, atau Aset..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full lg:w-64 transition-all"
                />
              </div>
              <button 
                onClick={simulateScan}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-md shadow hover:bg-gray-800 transition-colors w-full lg:w-auto shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h4a1 1 0 010 2H5v3a1 1 0 01-2 0V4zm14-1a1 1 0 011 1v3a1 1 0 01-2 0V5h-3a1 1 0 010-2h4zM3 20a1 1 0 001 1h4a1 1 0 000-2H5v-3a1 1 0 00-2 0v4zm14 1a1 1 0 001-1v-4a1 1 0 00-2 0v3h-3a1 1 0 000 2h4z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h8" /></svg>
                Scan Barcode
              </button>
            </div>
          </div>

          <div className="lg:hidden p-2 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50/30">
            {paginatedTickets.map((ticket) => (
              <div key={ticket.id} className="bg-white p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 flex flex-col gap-2.5 sm:gap-4">
                <div className="flex justify-between items-start gap-3 sm:gap-4">
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-gray-900 text-sm sm:text-base leading-tight">{ticket.alat}</h3>
                    <div className="text-xs sm:text-sm font-medium text-blue-600 mt-0.5 sm:mt-1">{ticket.id}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center bg-blue-50 text-blue-700 text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg border border-blue-100 whitespace-nowrap">
                      {ticket.jumlah} unit
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 rounded-lg sm:rounded-xl">
                  <div>
                    <p className="text-gray-500 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider mb-0.5">Peminjam</p>
                    <p className="font-bold text-gray-900 text-xs sm:text-sm">{ticket.peminjam}</p>
                    <p className="text-[10px] sm:text-xs font-mono text-gray-500">{ticket.nip || 'NIP-XXX'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider mb-0.5">Tenggat Waktu</p>
                    <p className="font-bold text-red-600 text-xs sm:text-sm">{ticket.tanggalKembali}</p>
                    <p className="text-[9px] sm:text-[10px] font-medium text-gray-500">Harus Kembali</p>
                  </div>
                </div>

                {ticket.allocatedUnits && ticket.allocatedUnits.length > 0 && (
                  <div>
                    <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1.5">Serial Number</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ticket.allocatedUnits.map(sn => (
                        <span key={sn} className="text-xs font-mono bg-white text-gray-700 px-2 py-0.5 rounded border border-gray-200">
                          {sn}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleOpenProcess(ticket)}
                  className="w-full py-1.5 sm:py-2.5 mt-1 sm:mt-1 bg-gray-900 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5 sm:gap-2"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                  Proses Terima
                </button>
              </div>
            ))}
            {paginatedTickets.length === 0 && (
              <div className="py-12 text-center bg-white rounded-2xl border border-gray-100 border-dashed">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <p className="text-gray-500 font-medium">Tidak ada barang yang sedang dipinjam.</p>
              </div>
            )}
          </div>

          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  {['ID Pengajuan', 'Peminjam', 'Aset & SN Dipinjam', 'Kuantitas', 'Tenggat Waktu'].map((h, i) => (
                    <th key={i} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Tindakan
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedTickets.map((ticket) => (
                  <tr key={ticket.id} className="group hover:bg-gray-50 transition-colors">
                    {/* ID Pengajuan */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-blue-600">{ticket.id}</span>
                    </td>

                    {/* Peminjam */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{ticket.peminjam}</div>
                        <div className="text-xs font-mono text-gray-500 mt-0.5 tracking-tight">{ticket.nip || 'NIP-XXX'}</div>
                        <div className="text-xs text-blue-600 font-medium mt-0.5">{ticket.jabatan}</div>
                      </td>

                    {/* Aset & SN */}
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">{ticket.alat}</p>

                      {ticket.allocatedUnits && ticket.allocatedUnits.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {ticket.allocatedUnits.map(sn => (
                              <span key={sn} className="inline-block mt-2 text-xs font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded mr-1 mb-1">
                                {sn}
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
                    <td className="px-6 py-4 whitespace-nowrap transition-colors">
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
                {paginatedTickets.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Tidak ada barang yang sedang dipinjam atau cocok dengan pencarian Anda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 0 && (
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50 flex flex-col lg:flex-row items-center justify-between shrink-0 gap-4 rounded-b-lg">
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
                  disabled={currentPage === totalPages || filteredTickets.length === 0}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-gray-200 text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-100 bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL PENGEMBALIAN */}
      {modalTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white shadow-2xl flex flex-col overflow-hidden rounded-3xl w-full max-h-[85vh] max-w-lg">
            
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b shrink-0 bg-gray-900 text-white">
              <h3 className="text-xl font-extrabold">Inspeksi & Pengembalian</h3>
              <p className="text-sm opacity-90 mt-1">Tiket: {modalTicket.id} | {modalTicket.peminjam}</p>
            </div>



            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 flex-1 overflow-y-auto">
              <div className="bg-gray-50 p-3 sm:p-4 rounded-xl border border-gray-100 flex justify-between items-center">
                <div>
                  <div className="text-sm font-bold text-gray-900">{modalTicket.alat}</div>
                  <div className="text-xs text-gray-500 mt-1">Total: <strong className="text-gray-900">{modalTicket.jumlah}</strong> unit</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status Verifikasi SN</div>
                  <div className="text-sm font-bold text-blue-600">
                    {verifiedSNs.length} / {modalTicket.allocatedUnits?.length || 0} Ter-scan
                  </div>
                </div>
              </div>

              {/* Langkah 1: Barang Serialized */}
              {modalTicket.assetType !== 'NON_SERIALIZED' && modalTicket.allocatedUnits && modalTicket.allocatedUnits.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <span className="text-sm font-bold text-gray-900">Evaluasi Fisik Aset (Scan Satu Per Satu)</span>
                    <div className="relative w-full sm:w-auto">
                      <svg className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      <input 
                        type="text" 
                        placeholder="Scan S/N di sini..."
                        value={scanInput}
                        onChange={e => setScanInput(e.target.value)}
                        onKeyDown={handleScanInput}
                        className="pl-8 pr-3 py-2.5 sm:py-1.5 text-base sm:text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-48"
                      />
                    </div>
                  </div>
                  <div className="p-4 space-y-3 max-h-60 overflow-y-auto">
                    {modalTicket.allocatedUnits?.map(sn => {
                      const isVerified = verifiedSNs.includes(sn)
                      return (
                        <div key={sn} className={`flex flex-col gap-3 p-3 rounded-xl border ${isVerified ? 'bg-blue-50/30 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isVerified ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-200 text-gray-400'}`}>
                                {isVerified ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : <span className="text-[10px] font-bold">SN</span>}
                              </div>
                              <span className={`text-sm font-mono font-bold ${isVerified ? 'text-gray-900' : 'text-gray-500'}`}>
                                {sn}
                              </span>
                            </div>
                            {!isVerified && (
                              <button onClick={() => verifySN(sn)} className="text-[10px] px-3 py-1.5 bg-white border border-gray-300 rounded shadow-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">
                                Simulasi Scan
                              </button>
                            )}
                            {isVerified && <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-1 rounded">Terverifikasi</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Langkah 1: Barang Non-Serialized */}
              {modalTicket.assetType === 'NON_SERIALIZED' && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-blue-50 border-b border-blue-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <span className="text-sm font-bold text-blue-900">Scan 1 Unit Saja (Mewakili Semua)</span>
                    <div className="relative w-full sm:w-auto">
                      <svg className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      <input 
                        type="text" 
                        placeholder="Scan S/N di sini..."
                        value={scanInput}
                        onChange={e => setScanInput(e.target.value)}
                        onKeyDown={handleScanInput}
                        disabled={verifiedSNs.length > 0}
                        className="pl-8 pr-3 py-2.5 sm:py-1.5 text-base sm:text-xs border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-48 disabled:bg-gray-100 bg-white"
                      />
                    </div>
                  </div>
                  <div className="p-4">
                    {verifiedSNs.length > 0 ? (
                      <div className="flex items-center gap-3 bg-green-50 p-4 rounded-xl border border-green-200">
                        <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-green-900">Verifikasi Selesai!</p>
                          <p className="text-xs text-green-700">Seluruh {modalTicket.jumlah} unit tercatat telah dikembalikan (berdasarkan 1 scan fisik).</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-6 border-2 border-dashed border-gray-200 rounded-xl">
                        <p className="text-sm font-bold text-gray-700 mb-2">Menunggu Scan...</p>
                        <p className="text-xs text-gray-500 mb-4">Cukup pindai salah satu dari {modalTicket.jumlah} unit {modalTicket.alat} yang dikembalikan.</p>
                           <button onClick={() => verifySN('MASTER-QR')} className="text-xs px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm font-bold hover:bg-blue-700 transition-colors">
                             Simulasi Scan 1 Unit
                           </button>
                      </div>
                    )}
                  </div>
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
                disabled={isSubmitDisabled()}
                className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800"
              >
                Terima & Konfirmasi Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scanning Overlay Modal */}
      {isScanning && (
        <div className="fixed inset-0 z-[100] bg-gray-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white p-8 rounded-2xl max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center text-center">
            <div className="relative w-48 h-48 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl mb-6 overflow-hidden flex items-center justify-center">
              {/* Fake barcode lines */}
              <div className="flex gap-1 h-20 opacity-50">
                {[1,3,1,2,1,4,1,1,2,1,3,2,1].map((w, i) => (
                  <div key={i} className="bg-gray-900 h-full" style={{ width: `${w * 4}px` }}></div>
                ))}
              </div>
              {/* Scanning Laser */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-scan"></div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Membaca Barcode...</h3>
            <p className="text-sm text-gray-500">Arahkan kamera ke stiker barcode aset yang dikembalikan.</p>
          </div>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes scan {
              0% { top: 10%; }
              50% { top: 90%; }
              100% { top: 10%; }
            }
            .animate-scan { animation: scan 1.5s ease-in-out infinite; }
          `}} />
        </div>
      )}

    </div>
  )
}
