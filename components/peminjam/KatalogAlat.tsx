'use client'
import React, { useState } from 'react'
import { Ticket } from '../../types/ticket'
import toast from 'react-hot-toast'
type TrackingType = 'SERIALIZED' | 'NON_SERIALIZED'
type Asset = {
  id: string
  name: string
  totalStock: number
  availableStock: number
  trackingType: TrackingType
  imageUrl?: string
}
const initialAssets: Asset[] = [
  {
    id: 'AST-001', name: 'Gas Detector (MSA Altair 4X)',
    totalStock: 5, availableStock: 3, trackingType: 'SERIALIZED'
  },
  {
    id: 'AST-002', name: 'Safety Harness Full Body',
    totalStock: 15, availableStock: 10, trackingType: 'SERIALIZED'
  },
  {
    id: 'AST-003', name: 'Bor Listrik (Makita)',
    totalStock: 4, availableStock: 0, trackingType: 'SERIALIZED'
  },
  {
    id: 'AST-004', name: 'Sarung Tangan Las (Kevlar)',
    totalStock: 150, availableStock: 120, trackingType: 'NON_SERIALIZED'
  },
  {
    id: 'AST-005', name: 'Helm Safety Proyek (Kuning)',
    totalStock: 50, availableStock: 48, trackingType: 'NON_SERIALIZED'
  },
]
const TRACKING_FILTERS = ['Semua', 'SERIALIZED', 'NON_SERIALIZED']
interface KatalogAlatProps {
  onAddTicket: (newTicketData: Omit<Ticket, 'id'>) => void
  assets?: Asset[]
}
export default function KatalogAlat({ onAddTicket, assets: propAssets }: KatalogAlatProps) {
  const assets = propAssets || initialAssets
  const [filterTracking, setFilterTracking] = useState('Semua')
  const [search, setSearch] = useState('')
  // Borrow Modal State
  const [borrowAsset, setBorrowAsset] = useState<Asset | null>(null)
  const [borrowDuration, setBorrowDuration] = useState(1)
  const [borrowQty, setBorrowQty] = useState(1)
  const [alasan, setAlasan] = useState('')
  const calculateReturnDate = () => {
    const start = new Date()
    const end = new Date()
    end.setDate(start.getDate() + borrowDuration)
    end.setHours(17, 0, 0, 0) // 17:00 cut-off

    const formatDateObj = (date: Date) => {
      const monthsIndo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
      return `${date.getDate()} ${monthsIndo[date.getMonth()]} ${date.getFullYear()}`
    }
    const formatTimeObj = (date: Date) => {
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    }
    
    return {
      startDateStr: formatDateObj(start),
      endDateStr: `${formatDateObj(end)}, ${formatTimeObj(end)} WIB`
    }
  }

  const handleBorrowSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!borrowAsset) return

    const { startDateStr, endDateStr } = calculateReturnDate()
    const timestampStr = () => {
      const now = new Date()
      const monthsIndo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
      const datePart = `${now.getDate()} ${monthsIndo[now.getMonth()]} ${now.getFullYear()}`
      const timePart = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      return `${datePart}, ${timePart} WIB`
    }
    onAddTicket({
      peminjam: 'Ahmad',
      nip: '19940102009',
      jabatan: 'Operasional',
      alat: borrowAsset.name,
      assetId: borrowAsset.id,
      jumlah: borrowQty,
      stokTersedia: borrowAsset.availableStock,
      tanggalPinjam: startDateStr,
      tanggalKembali: endDateStr,
      alasan: alasan,
      currentStage: 'Admin',
      overallStatus: 'Menunggu',
      assetType: borrowAsset.trackingType,
      flow: [
        { stage: 'Peminjam', status: 'Disetujui' },
        { stage: 'Admin', status: 'Menunggu' },
        { stage: 'HSSE', status: 'Menunggu' },
        { stage: 'Area Head', status: 'Menunggu' }
      ],
      trackingLogs: [
        { 
          stage: 'Peminjam', 
          status: 'Pengajuan dibuat oleh pekerja.', 
          actor: 'Ahmad', 
          timestamp: timestampStr()
        }
      ]
    })
    toast.success(`Pengajuan peminjaman untuk ${borrowQty} unit ${borrowAsset.name} berhasil dibuat!`)
    
    // Reset Form
    setBorrowAsset(null)
    setBorrowDuration(1)
    setBorrowQty(1)
    setAlasan('')
  }
  const filtered = assets.filter(a => {
    const matchTracking = filterTracking === 'Semua' || a.trackingType === filterTracking
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase())
    return matchTracking && matchSearch
  })
  return (
    <div className="space-y-4 sm:space-y-6 font-sans">
      {/* ── Toolbar ── */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-4 py-4 sm:px-6 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                placeholder="Cari ID atau nama aset..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {TRACKING_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilterTracking(f)}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-medium transition-colors text-center whitespace-nowrap ${
                  filterTracking === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'Semua' ? 'Semua' : f === 'SERIALIZED' ? 'Per Unit (Serialized)' : 'Per Unit (Non-Serialized)'}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* ── E-Commerce Style Grid Layout ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {filtered.map(a => {
          const isLow = a.availableStock === 0
          
          return (
            <div key={a.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all flex flex-col group relative">
              {isLow && (
                <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow z-10">
                  STOK HABIS
                </div>
              )}
              {/* Product Image Placeholder */}
              <div className="h-28 sm:h-36 bg-gray-50 border-b border-gray-100 flex items-center justify-center p-3 relative overflow-hidden group-hover:bg-gray-100 transition-colors">
                {a.imageUrl ? (
                  <img src={a.imageUrl} alt={a.name} className="w-full h-full object-contain" />
                ) : (
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                )}
                {/* Tracking Badge */}
                <div className={`absolute top-2 right-2 px-2 py-0.5 rounded shadow text-[10px] font-bold tracking-wider ${
                  a.trackingType === 'SERIALIZED' ? 'bg-indigo-600 text-white' : 'bg-orange-500 text-white'
                }`}>
                  {a.trackingType === 'SERIALIZED' ? 'Serialized' : 'Non-Serialized'}
                </div>

              </div>
              
              {/* Product Info */}
              <div className="p-3.5 sm:p-4 flex-1 flex flex-col">

                <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-snug mb-3 line-clamp-2">{a.name}</h3>
                
                <div className="mt-auto">
                  <div className="flex items-center justify-between py-1.5 border-t border-gray-100">
                    <span className="text-xs text-gray-500">Tersedia:</span>
                    <span className={`text-base sm:text-lg font-extrabold ${a.availableStock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {a.availableStock} <span className="text-xs font-medium text-gray-400">/ {a.totalStock}</span>
                    </span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        setBorrowAsset(a)
                        setBorrowQty(1)
                      }}
                      disabled={a.availableStock === 0}
                      className={`w-full py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm ${
                        a.availableStock > 0 
                          ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95' 
                          : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Pinjam
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        
        {filtered.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-gray-500 font-medium">Tidak ada aset yang ditemukan.</p>
          </div>
        )}
      </div>

      {/* ── Borrow Modal ── */}
      {borrowAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Form Pengajuan Pinjam</h3>
                <p className="text-xs text-gray-500 mt-0.5">{borrowAsset.name}</p>
              </div>
            </div>
            
            <form onSubmit={handleBorrowSubmit} className="flex-1 overflow-y-auto overscroll-y-contain flex flex-col">
              <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 flex-1 bg-white">
                {/* Info Stock */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5 sm:p-3 flex justify-between items-center text-blue-700 shadow-2xs">
                  <span className="font-medium text-xs sm:text-sm">Stok Tersedia Saat Ini:</span>
                  <span className="font-extrabold text-xs sm:text-base bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs">{borrowAsset.availableStock} unit</span>
                </div>
                {/* Duration Inputs */}
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">Durasi Peminjaman (Hari) <span className="text-red-500">*</span></label>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => setBorrowDuration(d => Math.max(1, d - 1))}
                        className="w-8 h-8 sm:w-9 sm:h-9 border border-gray-300 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-100 active:bg-gray-200 font-bold text-sm bg-gray-50 transition-colors shadow-2xs"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={borrowDuration}
                        onChange={e => {
                          const val = parseInt(e.target.value) || 1
                          setBorrowDuration(Math.min(30, Math.max(1, val)))
                        }}
                        className="w-16 sm:w-20 border border-gray-300 rounded-xl text-center h-8 sm:h-9 font-bold text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50/50 focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setBorrowDuration(d => Math.min(30, d + 1))}
                        className="w-8 h-8 sm:w-9 sm:h-9 border border-gray-300 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-100 active:bg-gray-200 font-bold text-sm bg-gray-50 transition-colors shadow-2xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 shadow-2xs">
                    <p className="text-xs sm:text-sm text-orange-800 font-medium">
                      Batas Waktu Pengembalian: <strong className="font-bold">{calculateReturnDate().endDateStr}</strong>
                    </p>
                    <p className="text-[10px] text-orange-600 mt-0.5">*Batas waktu ditetapkan otomatis mengikuti jam tutup operasional (17:00 WIB).</p>
                  </div>
                </div>
                {/* Quantity selector */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">Jumlah Peminjaman <span className="text-red-500">*</span></label>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => setBorrowQty(q => Math.max(1, q - 1))}
                      className="w-8 h-8 sm:w-9 sm:h-9 border border-gray-300 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-100 active:bg-gray-200 font-bold text-sm bg-gray-50 transition-colors shadow-2xs"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={borrowAsset.availableStock}
                      value={borrowQty}
                      onChange={e => {
                        const val = parseInt(e.target.value) || 1
                        setBorrowQty(Math.min(borrowAsset.availableStock, Math.max(1, val)))
                      }}
                      className="w-16 sm:w-20 border border-gray-300 rounded-xl text-center h-8 sm:h-9 font-bold text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50/50 focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setBorrowQty(q => Math.min(borrowAsset.availableStock, q + 1))}
                      className="w-8 h-8 sm:w-9 sm:h-9 border border-gray-300 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-100 active:bg-gray-200 font-bold text-sm bg-gray-50 transition-colors shadow-2xs"
                    >
                      +
                    </button>
                  </div>
                </div>
                {/* Alasan Peminjaman */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">Alasan Peminjaman <span className="text-red-500">*</span></label>
                  <textarea
                    required
                    rows={2}
                    value={alasan}
                    onChange={(e) => setAlasan(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm bg-gray-50/50 focus:bg-white transition-all resize-none"
                    placeholder="Contoh: Pekerjaan pemeliharaan rutin di Area A..."
                  />
                </div>
              </div>
              
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100 bg-gray-50 flex gap-2 sm:gap-3 shrink-0">
                <button 
                  type="button"
                  onClick={() => setBorrowAsset(null)}
                  className="flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-2xs"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Kirim Pengajuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
