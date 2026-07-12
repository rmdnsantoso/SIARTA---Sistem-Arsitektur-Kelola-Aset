'use client'
import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { Ticket, TicketStatus } from '../../types/ticket'
import { initialTickets } from '../../lib/dummyData'
import StatCard from '../shared/StatCard'
import InlineQRScanner from '../shared/InlineQRScanner'
import { verifyTicketByAdmin, rejectTicketByAdmin, verifyAssetBorrowHandover } from '../../actions/workflows/verifikasi'
import { getAvailableSerials } from '../../actions/core/asset'

interface Props {
  tickets?: Ticket[]
  onSuccess?: () => void
}

type ModalState = {
  ticket: Ticket
  type: 'setujui' | 'tolak' | 'serah_terima' | 'detail'
}

export default function BorrowingProcess({ tickets = initialTickets, onSuccess }: Props) {

  const [localTickets, setLocalTickets] = useState<Ticket[]>(tickets)
  
  React.useEffect(() => {
    setLocalTickets(tickets)
  }, [tickets])
  
  // State khusus Alokasi Fisik
  const [catatan, setCatatan] = useState('')
  const [modal, setModal] = useState<ModalState | null>(null)

  const [allocatedSerials, setAllocatedSerials] = useState<string[]>([])
  const allocatedSerialsRef = React.useRef<string[]>([])
  const [currentScan, setCurrentScan] = useState('')
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [validSerials, setValidSerials] = useState<string[]>([])

  // Auto-close scanner when allocation limit is reached
  React.useEffect(() => {
    if (isScannerOpen && modal && modal.ticket.jumlah > 0) {
      const targetLength = modal.ticket.assetType === 'NON_SERIALIZED' ? 1 : modal.ticket.jumlah
      if (allocatedSerials.length >= targetLength) {
        setIsScannerOpen(false)
      }
    }
  }, [allocatedSerials, isScannerOpen, modal])
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'Semua' | 'Verifikasi Fisik' | 'Siap Serah Terima'>('Semua')

  const filteredTickets = localTickets.filter(t => {
    const isVerifikasi = t.overallStatus === 'Menunggu' && t.currentStage === 'Admin'
    const isSiapSerahTerima = t.overallStatus === 'Disetujui' && t.currentStage === 'Serah Terima'

    let passesFilter = false
    if (activeFilter === 'Semua') {
      passesFilter = isVerifikasi || isSiapSerahTerima
    } else if (activeFilter === 'Verifikasi Fisik') {
      passesFilter = isVerifikasi
    } else if (activeFilter === 'Siap Serah Terima') {
      passesFilter = isSiapSerahTerima
    }

    if (!passesFilter) return false

    return (
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.peminjam.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.alat.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage)
  const paginatedTickets = filteredTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Reset to page 1 if search query or filter changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, activeFilter])

  const handleOpenTolak = (ticket: Ticket) => {
    setModal({ ticket, type: 'tolak' })
    setCatatan('')
  }

  const handleOpenSerahTerima = (ticket: Ticket) => {
    setModal({ ticket, type: 'serah_terima' })
    setCatatan('')
  }

  const handleOpenAllocation = async (ticket: Ticket) => {
    setModal({ ticket, type: 'setujui' })
    setCatatan('')
    setAllocatedSerials([])
    allocatedSerialsRef.current = []
    setCurrentScan('')
    setValidSerials([])
    
    if (ticket.assetType === 'SERIALIZED' && ticket.assetId) {
      const res = await getAvailableSerials(ticket.assetId)
      if (res.success && res.data) {
        setValidSerials(res.data)
      }
    }
  }

  const handleAddSerial = (scannedCode?: string | React.MouseEvent) => {
    const codeStr = typeof scannedCode === 'string' ? scannedCode : currentScan;
    const code = codeStr.trim();
    if (!code || !modal) return;

    if (modal.ticket.assetType === 'SERIALIZED') {
      if (!validSerials.includes(code)) {
        toast.error('QR Tidak Valid — bukan S/N yang terdaftar untuk aset ini.', { id: 'err-qr', duration: 3000 })
        return
      }
      if (allocatedSerialsRef.current.includes(code)) {
        toast.error('S/N ini sudah di-scan sebelumnya.', { duration: 2000, id: 'dup-sn' })
        return
      }
    } else {
      if (modal.ticket.assetCode && code.toUpperCase() !== modal.ticket.assetCode.toUpperCase()) {
        toast.error('Kode Salah — scan QR Master aset yang sesuai tiket ini.', { id: 'err-qr2', duration: 3000 })
        return
      }
      if (allocatedSerialsRef.current.includes(code)) {
        toast.error('Aset ini sudah terverifikasi.', { duration: 2000, id: 'dup-ns' })
        return
      }
    }

    const newSerials = [...allocatedSerialsRef.current, code]
    allocatedSerialsRef.current = newSerials
    setAllocatedSerials(newSerials)
    setCurrentScan('')
    toast.success(`Berhasil discan & ditambahkan: ${code}`, { duration: 1500, id: `succ-${code}` })
  }

  const handleRemoveSerial = (sn: string) => {
    const newSerials = allocatedSerialsRef.current.filter(s => s !== sn)
    allocatedSerialsRef.current = newSerials
    setAllocatedSerials(newSerials)
  }

  const handleConfirm = async () => {
    if (!modal) return
    const { ticket, type } = modal

    if (type === 'setujui') {
      if (ticket.dbId) {
        const res = await verifyTicketByAdmin(ticket.dbId, 'Dialokasikan oleh Admin', allocatedSerials)
        if (!res.success) {
          toast.error(`Gagal memverifikasi tiket: ${res.error}`)
          return
        }
      }
      toast.success(`Tiket ${ticket.id} dialokasikan & diteruskan ke HSSE untuk diverifikasi.`)
    } else if (type === 'tolak') {
      if (ticket.dbId) {
        const res = await rejectTicketByAdmin(ticket.dbId, catatan)
        if (!res.success) {
          toast.error(`Gagal menolak tiket: ${res.error}`)
          return
        }
      }
      toast.success(`Tiket ${ticket.id} ditolak.`)
    } else if (type === 'serah_terima') {
      if (ticket.dbId) {
        const res = await verifyAssetBorrowHandover(ticket.dbId)
        if (!res.success) {
          toast.error(`Gagal memverifikasi serah terima: ${res.error}`)
          return
        }
      }
      toast.success(`Serah terima tiket ${ticket.id} selesai. Barang resmi keluar gudang.`)
    }

    onSuccess?.()
    setModal(null)
  }

  // Cek apakah form alokasi sudah valid
  const isAllocationValid = () => {
    if (!modal) return true
    if (modal.type === 'tolak') return catatan.trim().length > 0
    if (modal.type !== 'setujui') return true
    if (modal.ticket.assetType === 'NON_SERIALIZED') {
      return allocatedSerials.length === 1
    }
    return allocatedSerials.length === modal.ticket.jumlah
  }

  // Calculate stats
  const pendingVerifikasi = localTickets.filter(t => t.overallStatus === 'Menunggu' && t.currentStage === 'Admin').length
  const pendingSerahTerima = localTickets.filter(t => t.overallStatus === 'Disetujui' && t.currentStage === 'Serah Terima').length

  const stats = [
    { label: 'Verifikasi Fisik (Antrean)', value: pendingVerifikasi, iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', colorTheme: 'blue' as const },
    { label: 'Siap Serah Terima', value: pendingSerahTerima, iconPath: 'M5 13l4 4L19 7', colorTheme: 'green' as const },
  ]

  return (
    <div className="font-sans">
      {/* Main Content Area */}
      <div className="flex flex-col gap-3 sm:gap-6 lg:gap-8">
        
        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:gap-6">
          {stats.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>

        {/* Unified Table */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-3 sm:p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shrink-0">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Antrean Verifikasi & Serah Terima</h2>
              <p className="text-sm text-gray-500">Kelola verifikasi fisik dan serah terima aset ke peminjam.</p>
            </div>
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 mt-4 lg:mt-0 w-full lg:w-auto">
              <div className="relative w-full lg:w-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input 
                  type="text" 
                  placeholder="Cari ID, Nama, atau Aset..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full lg:w-64 transition-all"
                />
              </div>
              <div className="relative w-full lg:w-auto">
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="px-3 py-1.5 sm:py-2 bg-white border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 sm:gap-2 w-full lg:w-auto"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                  </svg>
                  Filter {activeFilter !== 'Semua' && `(${activeFilter})`}
                </button>
                
                {/* Dropdown Menu */}
                {isFilterOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      {(['Semua', 'Verifikasi Fisik', 'Siap Serah Terima'] as const).map((filterOpt) => (
                        <button
                          key={filterOpt}
                          onClick={() => {
                            setActiveFilter(filterOpt)
                            setIsFilterOpen(false)
                          }}
                          className={`w-full text-left px-4 py-2 text-sm ${
                            activeFilter === filterOpt 
                              ? 'bg-blue-50 text-blue-700 font-semibold' 
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {filterOpt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:hidden p-2 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50/30">
            {paginatedTickets.map((ticket) => {
              const isAdminActionable = ticket.overallStatus === 'Menunggu' && ticket.currentStage === 'Admin'
              const isHandoverActionable = ticket.overallStatus === 'Disetujui' && ticket.currentStage === 'Serah Terima'
              
              return (
                <div key={ticket.id} className="bg-white p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 flex flex-col gap-2.5 sm:gap-4">
                  <div className="flex justify-between items-start gap-3 sm:gap-4">
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-gray-900 text-sm sm:text-base leading-tight">{ticket.alat}</h3>
                      <div className="text-xs sm:text-sm font-medium text-blue-600 mt-0.5 sm:mt-1">{ticket.id}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-flex items-center text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg border whitespace-nowrap ${ticket.jumlah > ticket.stokTersedia ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                        {ticket.jumlah} unit
                      </span>
                      <div className="text-[9px] sm:text-[10px] font-medium text-gray-500 mt-0.5 sm:mt-1">Stok: {ticket.stokTersedia}</div>
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

                  {ticket.allocatedUnits && ticket.allocatedUnits.length > 0 && (
                    <div>
                      <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1.5">Alokasi S/N</p>
                      <div className="flex flex-wrap gap-1.5">
                        {ticket.allocatedUnits.map(sn => (
                          <span key={sn} className="text-xs font-mono bg-white text-gray-700 px-2 py-0.5 rounded border border-gray-200">
                            {sn}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {(isAdminActionable || isHandoverActionable) && (
                    <div className="flex gap-2 sm:gap-2 mt-1 sm:mt-1">
                      {isAdminActionable && (
                        <>
                          <button
                            onClick={() => handleOpenAllocation(ticket)}
                            className="flex-1 py-1.5 sm:py-2.5 bg-blue-600 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:bg-blue-700 transition-colors"
                          >
                            Alokasikan
                          </button>
                          <button
                            onClick={() => handleOpenTolak(ticket)}
                            className="flex-1 py-1.5 sm:py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:bg-red-100 transition-colors"
                          >
                            Tolak
                          </button>
                        </>
                      )}
                      {isHandoverActionable && (
                        <button
                          onClick={() => handleOpenSerahTerima(ticket)}
                          className="w-full py-1.5 sm:py-2.5 bg-amber-500 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:bg-amber-600 transition-colors flex justify-center items-center gap-1 sm:gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          Serah Terima
                        </button>
                      )}
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
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">ID Pengajuan</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Pemohon</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Aset</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Kuantitas</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Periode Pinjam</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Tindakan</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y-2 divide-gray-100">
                {paginatedTickets.map((ticket) => {
                  const isAdminActionable = ticket.overallStatus === 'Menunggu' && ticket.currentStage === 'Admin'
                  const isHandoverActionable = ticket.overallStatus === 'Disetujui' && ticket.currentStage === 'Serah Terima'
                  
                  return (
                    <tr key={ticket.id} className="group hover:bg-blue-50 transition-colors even:bg-gray-50">
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

                      {/* Aset & Alasan */}
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
                        <div className="flex flex-col gap-1.5">
                          <div className={`text-sm font-bold ${ticket.jumlah > ticket.stokTersedia ? 'text-red-600' : 'text-gray-900'}`}>
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
                      <td className="px-6 py-4 whitespace-nowrap transition-colors">
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
                                onClick={() => handleOpenTolak(ticket)}
                                className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded text-sm font-bold hover:bg-red-100 transition-colors shadow-sm"
                              >
                                Tolak
                              </button>
                            </>
                          ) : isHandoverActionable ? (
                            <button
                              onClick={() => handleOpenSerahTerima(ticket)}
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
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {/* Removed redundant empty state check, handled internally by loop length > 0 typically but keep if needed */}
            {paginatedTickets.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada tiket</h3>
                <p className="mt-1 text-sm text-gray-500">Antrean kosong atau tidak ditemukan hasil pencarian.</p>
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {totalPages > 0 && (
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50 flex flex-col lg:flex-row items-center justify-between shrink-0 gap-4 rounded-b-lg">
              <span className="text-xs sm:text-sm text-gray-500 font-medium text-center sm:text-left">
                Menampilkan <span className="font-bold text-gray-900">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredTickets.length)}</span> hingga <span className="font-bold text-gray-900">{Math.min(currentPage * itemsPerPage, filteredTickets.length)}</span> dari <span className="font-bold text-gray-900">{filteredTickets.length}</span> pengajuan
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-3 flex items-center justify-center rounded-lg border border-gray-200 text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-100 bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  Sebelumnya
                </button>
                
                <div className="flex flex-wrap items-center justify-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all shrink-0 ${
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
                  className="h-8 px-3 flex items-center justify-center rounded-lg border border-gray-200 text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-100 bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* MODAL ALOKASI / KONFIRMASI / DETAIL */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity">
          <div className={`bg-white shadow-2xl flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl ${modal.type === 'setujui' || modal.type === 'detail' ? 'w-full max-h-[85vh] max-w-3xl' : 'w-full max-w-sm'}`}>
            
            {/* Modal Header */}
            <div className={`px-4 sm:px-6 py-4 sm:py-5 border-b shrink-0 ${
              modal.type === 'setujui' ? 'bg-blue-600 text-white' : 
              modal.type === 'serah_terima' ? 'bg-amber-500 text-white' : 
              modal.type === 'detail' ? 'bg-gray-900 text-white' :
              'bg-red-600 text-white'
            }`}>
              <h3 className="text-lg sm:text-xl font-extrabold">
                {modal.type === 'setujui' ? 'Alokasi Fisik Unit' : 
                 modal.type === 'serah_terima' ? 'Serah Terima Barang' : 
                 modal.type === 'detail' ? 'Riwayat Pelacakan Tiket' :
                 'Konfirmasi Penolakan'}
              </h3>
              <p className="text-xs sm:text-sm opacity-90 mt-1">
                Tiket: {modal.ticket.id} {modal.type === 'detail' && `| Diajukan: ${modal.ticket.tanggalPinjam}`}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-y-contain p-4 sm:p-6 space-y-4 sm:space-y-6">
              {modal.type !== 'detail' && (
                <div className="bg-gray-50 p-3 sm:p-4 rounded-xl border border-gray-100">
                  <div className="text-sm font-bold text-gray-900">{modal.ticket.alat}</div>
                  <div className="text-xs text-gray-500 mt-1">Diminta: <strong className="text-gray-900">{modal.ticket.jumlah}</strong> unit</div>
                  <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">Tipe: <strong className="text-gray-900 flex items-center gap-1">
                    {modal.ticket.assetType === 'SERIALIZED' ? (
                      <><svg className="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>Serialized</>
                    ) : modal.ticket.assetType === 'NON_SERIALIZED' ? (
                      <><svg className="w-3.5 h-3.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>Non-Serialized</>
                    ) : 'N/A'}
                  </strong></div>
                </div>
              )}

              {/* LOGIKA ALOKASI BERDASARKAN TIPE */}
              {modal.type === 'setujui' && modal.ticket.assetType !== 'NON_SERIALIZED' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Scan Unit ID / QR Code</label>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <div className="flex-1 relative">
                        <input 
                          type="text" 
                          value={currentScan}
                          onChange={e => setCurrentScan(e.target.value)}
                          placeholder="Ketik SN..."
                          className="w-full pl-3 sm:pl-4 pr-12 py-2 sm:py-3 border border-gray-300 rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                          disabled={allocatedSerials.length >= modal.ticket.jumlah}
                        />
                        <button 
                          onClick={() => setIsScannerOpen(true)}
                          disabled={allocatedSerials.length >= modal.ticket.jumlah}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Scan dengan Kamera"
                        >
                          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                      </div>
                      <button onClick={handleAddSerial} disabled={!currentScan.trim() || allocatedSerials.length >= modal.ticket.jumlah} className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-900 text-white rounded-xl text-sm font-bold disabled:opacity-50 whitespace-nowrap shrink-0">Tambah</button>
                    </div>
                    {isScannerOpen && (
                      <InlineQRScanner
                        isOpen={isScannerOpen}
                        onClose={() => setIsScannerOpen(false)}
                        onScanSuccess={(text) => {
                          if (allocatedSerialsRef.current.length < modal.ticket.jumlah) {
                            handleAddSerial(text)
                          }
                        }}
                      />
                    )}
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
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
                            <button onClick={() => handleRemoveSerial(sn)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {modal.type === 'setujui' && modal.ticket.assetType === 'NON_SERIALIZED' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 p-3 sm:p-4 rounded-xl">
                    <p className="text-sm text-blue-800 font-medium mb-2">Scan 1 QR Fisik Saja (Otomatis mewakili seluruh {modal.ticket.jumlah} unit)</p>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
                      <div className="flex-1 relative">
                        <input 
                          type="text" 
                          value={currentScan}
                          onChange={e => setCurrentScan(e.target.value)}
                          placeholder="Ketik Kode Master Aset..."
                          className="w-full pl-4 pr-12 py-2 sm:py-3 border border-blue-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                          disabled={allocatedSerials.length >= 1}
                        />
                        <button 
                          onClick={() => setIsScannerOpen(true)}
                          disabled={allocatedSerials.length >= 1}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                          title="Scan dengan Kamera"
                        >
                          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                      </div>
                      <button 
                        onClick={handleAddSerial}
                        disabled={!currentScan.trim() || allocatedSerials.length >= 1}
                        className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-xl text-sm font-bold disabled:opacity-50 whitespace-nowrap shrink-0"
                      >
                        Verifikasi Sekaligus
                      </button>
                    </div>

                    {isScannerOpen && (
                      <InlineQRScanner
                        isOpen={isScannerOpen}
                        onClose={() => setIsScannerOpen(false)}
                        onScanSuccess={(text) => {
                          if (allocatedSerialsRef.current.length < 1) {
                            handleAddSerial(text)
                          }
                        }}
                      />
                    )}

                    {allocatedSerials.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-green-700 bg-green-100 px-3 py-2 rounded-lg font-bold">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Telah terverifikasi! {modal.ticket.jumlah} unit dialokasikan.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {modal.type === 'serah_terima' && (
                <div className="bg-amber-50 border border-amber-200 p-3 sm:p-4 rounded-xl">
                  <p className="text-sm text-amber-800 font-medium">Pastikan pekerja menerima barang fisik berikut:</p>
                  <ul className="mt-2 space-y-1">
                    {modal.ticket.allocatedUnits?.map((sn: string) => (
                       <li key={sn} className="text-sm font-bold text-amber-900">• SN: {sn}</li>
                    ))}
                  </ul>
                </div>
              )}

              {modal.type === 'tolak' && (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 p-3 sm:p-4 rounded-xl">
                    <p className="text-sm text-red-800 font-medium">Anda akan menolak pengajuan ini. Harap berikan alasan yang jelas agar pemohon mengerti.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Alasan Penolakan <span className="text-red-500">*</span></label>
                    <textarea 
                      spellCheck={false}
                      value={catatan}
                      onChange={e => setCatatan(e.target.value)}
                      placeholder="Misal: Stok fisik saat ini sedang dikalibrasi..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none min-h-[100px] resize-y"
                    />
                  </div>
                </div>
              )}

              {modal.type === 'detail' && (
                <div className="space-y-4 sm:space-y-6">
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

            <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 flex gap-2 sm:gap-3 shrink-0">
              {modal.type === 'detail' ? (
                <button
                  onClick={() => setModal(null)}
                  className="w-full py-2.5 sm:py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800"
                >
                  Tutup Riwayat
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setModal(null)}
                    className="flex-1 py-2.5 sm:py-3 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={!isAllocationValid()}
                    className={`flex-1 py-2.5 sm:py-3 text-white rounded-xl text-xs sm:text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed ${
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

      {/* Scanner Modal Removed */}
    </div>
  )
}
