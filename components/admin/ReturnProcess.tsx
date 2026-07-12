'use client'

import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { Ticket } from '../../types/ticket'
import { initialTickets } from '../../lib/dummyData'
import StatCard from '../shared/StatCard'
import InlineQRScanner from '../shared/InlineQRScanner'
import { verifyAssetReturnHandover } from '../../actions/workflows/verifikasi'
import { isOverdue } from '../../lib/dateUtils'

interface Props {
  tickets?: Ticket[]
  onSuccess?: () => void
}

export default function ReturnProcess({ tickets = initialTickets, onSuccess }: Props) {
  // Only interested in tickets that are currently borrowed
  const [localTickets, setLocalTickets] = useState<Ticket[]>(tickets.filter(t => t.overallStatus === 'Dipinjam'))
  
  React.useEffect(() => {
    setLocalTickets(tickets.filter(t => t.overallStatus === 'Dipinjam'))
  }, [tickets])

  // Modal State
  const [modalTicket, setModalTicket] = useState<Ticket | null>(null)
  
  const [verifiedSNs, setVerifiedSNs] = useState<string[]>([])
  const verifiedSNsRef = React.useRef<string[]>([])
  const [scanInput, setScanInput] = useState('')
  
  const [searchQuery, setSearchQuery] = useState('')
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [scannerContext, setScannerContext] = useState<'main' | 'detail'>('main')

  // Helper: always update both state AND ref together
  const setVerifiedSNsWithRef = (sns: string[]) => {
    verifiedSNsRef.current = sns
    setVerifiedSNs(sns)
  }

  // Auto-close scanner when limit is reached
  React.useEffect(() => {
    if (isScannerOpen && scannerContext === 'detail' && modalTicket && modalTicket.jumlah > 0) {
      const targetLength = modalTicket.assetType === 'NON_SERIALIZED' ? 1 : modalTicket.jumlah;
      if (verifiedSNs.length >= targetLength) {
        setIsScannerOpen(false)
      }
    }
  }, [verifiedSNs, isScannerOpen, modalTicket, scannerContext])

  // Simulate scanning a specific SN
  const verifySN = (sn: string) => {
    if (modalTicket?.assetType === 'NON_SERIALIZED') {
      setVerifiedSNsWithRef(['NON_SERIALIZED_VERIFIED'])
    } else {
      const current = verifiedSNsRef.current
      if (!current.includes(sn)) {
        setVerifiedSNsWithRef([...current, sn])
      }
    }
  }

  const toggleSN = (sn: string) => {
    const current = verifiedSNsRef.current
    const next = current.includes(sn) ? current.filter(s => s !== sn) : [...current, sn]
    setVerifiedSNsWithRef(next)
  }

  const handleScanInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const sn = scanInput.trim()
      if (modalTicket?.assetType === 'NON_SERIALIZED') {
        if (modalTicket.assetCode && sn.toUpperCase() !== modalTicket.assetCode.toUpperCase()) {
          toast.error('Kode salah. Harap ketik/scan QR Master yang benar.')
          return
        }
        verifySN(sn)
        setScanInput('')
        toast.success(`Berhasil diverifikasi: ${sn}`, { duration: 1500, id: `succ-${sn}` })
      } else if (modalTicket?.allocatedUnits && modalTicket.allocatedUnits.length > 0) {
        if (modalTicket.allocatedUnits.includes(sn)) {
          verifySN(sn)
          setScanInput('')
          toast.success(`Berhasil diverifikasi: ${sn}`, { duration: 1500, id: `succ-${sn}` })
        } else {
          toast.error('Serial Number tidak valid untuk tiket ini.')
        }
      } else {
        // Fallback for legacy tickets without allocatedUnits
        if (modalTicket && verifiedSNsRef.current.length < modalTicket.jumlah) {
          verifySN(sn)
          setScanInput('')
          toast.success(`Berhasil diverifikasi: ${sn}`, { duration: 1500, id: `succ-${sn}` })
        } else {
          toast.error('Kapasitas penuh.')
        }
      }
    }
  }

  const handleScanSuccess = (text: string) => {
    const sn = text.trim();
    if (scannerContext === 'main') {
      const scannedTicket = localTickets.find(t => t.allocatedUnits?.includes(sn) || t.id === sn);
      if (scannedTicket) {
        handleOpenProcess(scannedTicket, sn);
        toast.success(`Aset ${sn} ditemukan, memproses pengembalian...`);
      } else {
        toast.error('Aset tidak ditemukan dalam daftar peminjaman aktif.');
      }
    } else {
      if (modalTicket?.assetType === 'NON_SERIALIZED') {
        if (modalTicket.assetCode && sn.toUpperCase() !== modalTicket.assetCode.toUpperCase()) {
          toast.error('Kode salah. Harap ketik/scan QR Master yang benar.')
          return
        }
        verifySN(sn)
        toast.success(`Berhasil discan & diverifikasi: ${sn}`, { duration: 1500, id: `succ-${sn}` })
      } else if (modalTicket?.allocatedUnits && modalTicket.allocatedUnits.length > 0) {
        if (modalTicket.allocatedUnits.includes(sn)) {
          if (!verifiedSNsRef.current.includes(sn)) {
            verifySN(sn)
            toast.success(`Berhasil discan & diverifikasi: ${sn}`, { duration: 1500, id: `succ-${sn}` })
          } else {
            toast.error('S/N ini sudah terverifikasi.', { duration: 2000, id: 'dup-sn' })
          }
        } else {
          toast.error('Kode QR Tidak Dikenali (Bukan S/N yang dipinjam pada tiket ini).')
        }
      } else {
        // Fallback — use ref to avoid stale closure
        if (modalTicket && verifiedSNsRef.current.length < modalTicket.jumlah) {
          verifySN(sn)
          toast.success(`Berhasil discan & diverifikasi: ${sn}`, { duration: 1500, id: `succ-${sn}` })
        } else {
          toast.error('Kapasitas penuh.')
        }
      }
    }
  }

  const handleOpenProcess = (ticket: Ticket, preScannedSN?: string) => {
    setModalTicket(ticket)
    const initial = preScannedSN ? [preScannedSN] : []
    setVerifiedSNsWithRef(initial)
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

  const handleConfirmReturn = async () => {
    if (!modalTicket) return

    if (modalTicket.dbId) {
      const res = await verifyAssetReturnHandover(modalTicket.dbId, false, '')
      if (!res.success) {
        toast.error(`Gagal memverifikasi pengembalian: ${res.error}`)
        return
      }
    }

    onSuccess?.()
    toast.success(`Tiket pengembalian ${modalTicket.id} berhasil dikonfirmasi.`)
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


  const openMainScanner = () => {
    setScannerContext('main')
    setIsScannerOpen(true)
  }

  const openDetailScanner = () => {
    setScannerContext('detail')
    setIsScannerOpen(true)
  }

  // Calculate stats based on current active list
  const stats = [
    { label: 'Sedang Dipinjam', value: localTickets.length, iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', colorTheme: 'blue' as const },
    { label: 'Lewat Jatuh Tempo', value: localTickets.filter(t => isOverdue(t.tanggalKembali)).length, iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', colorTheme: 'red' as const },
  ]

  return (
    <div className="font-sans">
      {/* Main Content Area */}
      <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8">
        
        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-3 lg:gap-6">
          {stats.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>

        {/* Active Tickets List */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-3 sm:p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shrink-0">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Antrean Pengembalian</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Tiket yang sedang dalam proses pengembalian oleh peminjam.</p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-auto mt-2 sm:mt-0">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Cari ID tiket atau nama..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="pl-9 pr-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64 shadow-sm"
                />
              </div>
                <button 
                  onClick={openMainScanner}
                  className="flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-sm shadow-blue-600/20 hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Scan Barcode
                </button>
            </div>
          </div>
          
          {isScannerOpen && scannerContext === 'main' && (
            <div className="p-4 border-b border-gray-200 bg-gray-50/50">
              <InlineQRScanner
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScanSuccess={handleScanSuccess}
              />
            </div>
          )}

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
                    <div className="flex items-center gap-1.5">
                      <p className={`font-bold text-xs sm:text-sm ${isOverdue(ticket.tanggalKembali) ? 'text-red-600' : 'text-gray-900'}`}>{ticket.tanggalKembali}</p>
                      {isOverdue(ticket.tanggalKembali) && (
                        <span className="bg-red-100 text-red-700 text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Terlambat</span>
                      )}
                    </div>
                    <p className="text-[9px] sm:text-[10px] font-medium text-gray-500 mt-0.5">Harus Kembali</p>
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
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium ${isOverdue(ticket.tanggalKembali) ? 'text-red-600' : 'text-gray-900'}`}>{ticket.tanggalKembali}</p>
                        {isOverdue(ticket.tanggalKembali) && (
                          <span className="bg-red-100 text-red-700 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Terlambat</span>
                        )}
                      </div>
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



            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 flex-1 overflow-y-auto overscroll-y-contain">
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
              {modalTicket.assetType !== 'NON_SERIALIZED' && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <span className="text-sm font-bold text-gray-900">Evaluasi Fisik Aset (Scan Satu Per Satu)</span>
                    <div className="relative w-full sm:w-auto">
                      <input 
                        type="text" 
                        placeholder="Scan S/N di sini..."
                        value={scanInput}
                        onChange={e => setScanInput(e.target.value)}
                        onKeyDown={handleScanInput}
                        className="w-full bg-white border border-gray-300 rounded-xl pl-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none pr-12 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        disabled={verifiedSNs.length >= (modalTicket.allocatedUnits?.length || 0)}
                      />
                      <button 
                        onClick={openDetailScanner}
                        disabled={verifiedSNs.length >= (modalTicket.allocatedUnits?.length || 0)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {isScannerOpen && scannerContext === 'detail' && (
                    <InlineQRScanner
                      isOpen={isScannerOpen}
                      onClose={() => setIsScannerOpen(false)}
                      onScanSuccess={handleScanSuccess}
                    />
                  )}
                  <div className="p-4 space-y-3 max-h-60 overflow-y-auto">
                    {modalTicket.allocatedUnits && modalTicket.allocatedUnits.length > 0 ? (
                      modalTicket.allocatedUnits.map(sn => {
                        const isVerified = verifiedSNs.includes(sn)
                        return (
                          <div key={sn} className={`flex flex-col gap-3 p-3 rounded-xl border ${isVerified ? 'bg-blue-50/30 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <button 
                                  onClick={() => toggleSN(sn)}
                                  title={isVerified ? "Batal verifikasi" : "Verifikasi manual (Stiker Rusak)"}
                                  className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors cursor-pointer hover:opacity-80 ${isVerified ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-200 text-gray-400 hover:bg-gray-300'}`}
                                >
                                  {isVerified ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : <span className="text-[10px] font-bold">SN</span>}
                                </button>
                                <span className={`text-sm font-mono font-bold ${isVerified ? 'text-gray-900' : 'text-gray-500'}`}>
                                  {sn}
                                </span>
                              </div>
                              {isVerified && <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-1 rounded">Terverifikasi</span>}
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <>
                        {verifiedSNs.map(sn => (
                          <div key={sn} className="flex flex-col gap-3 p-3 rounded-xl border bg-blue-50/30 border-blue-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-md flex items-center justify-center bg-blue-600 text-white shadow-sm">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <span className="text-sm font-mono font-bold text-gray-900">{sn}</span>
                              </div>
                              <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-1 rounded">Terverifikasi</span>
                            </div>
                          </div>
                        ))}
                        {verifiedSNs.length < modalTicket.jumlah && (
                          <div className="text-center p-6 border-2 border-dashed border-gray-200 rounded-xl">
                            <p className="text-sm font-bold text-gray-700 mb-2">Menunggu Scan...</p>
                            <p className="text-xs text-gray-500 mb-4">Aset ini tidak memiliki rekaman S/N awal. Silakan scan {modalTicket.jumlah} unit secara manual.</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Langkah 1: Barang Non-Serialized */}
              {modalTicket.assetType === 'NON_SERIALIZED' && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-blue-50 border-b border-blue-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <span className="text-sm font-bold text-blue-900">Scan 1 Unit Saja (Mewakili Semua)</span>
                    <div className="relative w-full sm:w-auto">
                      <input 
                        type="text"
                        className="w-full bg-white border border-blue-300 rounded-xl pl-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none pr-12 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Ketik Kode Master Aset..."
                        value={scanInput}
                        onChange={e => setScanInput(e.target.value)}
                        onKeyDown={handleScanInput}
                        disabled={verifiedSNs.length > 0}
                      />
                      <button 
                        onClick={openDetailScanner}
                        disabled={verifiedSNs.length > 0}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Scan dengan Kamera"
                      >
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {isScannerOpen && scannerContext === 'detail' && (
                    <InlineQRScanner
                      isOpen={isScannerOpen}
                      onClose={() => setIsScannerOpen(false)}
                      onScanSuccess={handleScanSuccess}
                    />
                  )}
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

      {/* Scanner Modal Removed */}
    </div>
  )
}
