'use client'
import React, { useState } from 'react'
import { Ticket } from '../../types/ticket'
type TrackingType = 'SERIALIZED' | 'NON_SERIALIZED'
type Asset = {
  id: string
  name: string
  rackLocation: string
  totalStock: number
  availableStock: number
  trackingType: TrackingType
  imageUrl?: string
}
const initialAssets: Asset[] = [
  {
    id: 'AST-001', name: 'Gas Detector (MSA Altair 4X)',
    rackLocation: 'Rak A-12', totalStock: 5, availableStock: 3, trackingType: 'SERIALIZED'
  },
  {
    id: 'AST-002', name: 'Safety Harness Full Body',
    rackLocation: 'Rak B-05', totalStock: 15, availableStock: 10, trackingType: 'SERIALIZED'
  },
  {
    id: 'AST-003', name: 'Bor Listrik (Makita)',
    rackLocation: 'Rak C-01', totalStock: 4, availableStock: 0, trackingType: 'SERIALIZED'
  },
  {
    id: 'AST-004', name: 'Sarung Tangan Las (Kevlar)',
    rackLocation: 'Rak A-02', totalStock: 150, availableStock: 120, trackingType: 'NON_SERIALIZED'
  },
  {
    id: 'AST-005', name: 'Helm Safety Proyek (Kuning)',
    rackLocation: 'Rak B-01', totalStock: 50, availableStock: 48, trackingType: 'NON_SERIALIZED'
  },
]
const TRACKING_FILTERS = ['Semua', 'SERIALIZED', 'NON_SERIALIZED']
interface KatalogAlatProps {
  onAddTicket: (newTicketData: Omit<Ticket, 'id'>) => void
}
export default function KatalogAlat({ onAddTicket }: KatalogAlatProps) {
  const [assets] = useState<Asset[]>(initialAssets)
  const [filterTracking, setFilterTracking] = useState('Semua')
  const [search, setSearch] = useState('')
  // Borrow Modal State
  const [borrowAsset, setBorrowAsset] = useState<Asset | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [borrowQty, setBorrowQty] = useState(1)
  const [location, setLocation] = useState('')
  const handleBorrowSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!borrowAsset) return
    if (new Date(startDate) > new Date(endDate)) {
      alert('Tanggal selesai pinjam tidak boleh sebelum tanggal mulai pinjam.')
      return
    }
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr)
      const months = ['Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei']
      // Indonesian month names for SIARTA format consistency
      const monthsIndo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
      return `${date.getDate()} ${monthsIndo[date.getMonth()]} ${date.getFullYear()}`
    }
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
      jumlah: borrowQty,
      stokTersedia: borrowAsset.availableStock,
      tanggalPinjam: formatDate(startDate),
      tanggalKembali: formatDate(endDate),
      lokasi: location,
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
    alert(`Pengajuan peminjaman untuk ${borrowQty} unit ${borrowAsset.name} berhasil dibuat!`)
    
    // Reset Form
    setBorrowAsset(null)
    setStartDate('')
    setEndDate('')
    setBorrowQty(1)
    setLocation('')
  }
  const filtered = assets.filter(a => {
    const matchTracking = filterTracking === 'Semua' || a.trackingType === filterTracking
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase())
    return matchTracking && matchSearch
  })
  return (
    <div className="space-y-6 font-sans">
      {/* ── Toolbar ── */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama atau ID aset..."
              className="w-64 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <div className="flex gap-1">
              {TRACKING_FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => setFilterTracking(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
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
      </div>
      {/* ── E-Commerce Style Grid Layout ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map(a => {
          const isLow = a.availableStock === 0
          
          return (
            <div key={a.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all flex flex-col group relative">
              {isLow && (
                <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow z-10">
                  STOK HABIS
                </div>
              )}
              {/* Product Image Placeholder */}
              <div className="h-40 bg-gray-50 border-b border-gray-100 flex items-center justify-center p-4 relative overflow-hidden group-hover:bg-gray-100 transition-colors">
                {a.imageUrl ? (
                  <img src={a.imageUrl} alt={a.name} className="w-full h-full object-contain" />
                ) : (
                  <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                )}
                {/* Tracking Badge */}
                <div className={`absolute top-2 right-2 px-2 py-1 rounded shadow text-[10px] font-bold tracking-wider ${
                  a.trackingType === 'SERIALIZED' ? 'bg-indigo-600 text-white' : 'bg-orange-500 text-white'
                }`}>
                  {a.trackingType === 'SERIALIZED' ? 'Serialized' : 'Non-Serialized'}
                </div>
                <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-gray-600 border border-gray-200">
                  Rak {a.rackLocation}
                </div>
              </div>
              
              {/* Product Info */}
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] text-gray-400 font-mono">{a.id}</span>
                </div>
                <h3 className="font-bold text-gray-900 leading-tight mb-3 line-clamp-2">{a.name}</h3>
                
                <div className="mt-auto">
                  <div className="flex items-center justify-between py-2 border-t border-gray-100">
                    <span className="text-xs text-gray-500">Tersedia:</span>
                    <span className={`text-lg font-extrabold ${a.availableStock > 0 ? 'text-green-600' : 'text-red-500'}`}>
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
                      className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Form Pengajuan Pinjam</h3>
                <p className="text-xs text-gray-500 mt-0.5">{borrowAsset.name} ({borrowAsset.id})</p>
              </div>
              <button onClick={() => setBorrowAsset(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleBorrowSubmit}>
              <div className="p-6 space-y-4">
                {/* Info Stock */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex justify-between items-center text-sm text-blue-700">
                  <span className="font-medium">Stok Tersedia Saat Ini:</span>
                  <span className="font-extrabold text-base">{borrowAsset.availableStock} unit</span>
                </div>
                {/* Date Inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mulai Pinjam <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Selesai Pinjam <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                {/* Quantity selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Peminjaman <span className="text-red-500">*</span></label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setBorrowQty(q => Math.max(1, q - 1))}
                      className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 active:bg-gray-100 font-bold"
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
                      className="w-20 border border-gray-300 rounded-lg text-center h-10 font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setBorrowQty(q => Math.min(borrowAsset.availableStock, q + 1))}
                      className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 active:bg-gray-100 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
                {/* Lokasi Penggunaan */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi Penggunaan / Kerja <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="Mis. Platform Delta-7 atau Rig Nusantara-12"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setBorrowAsset(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded hover:bg-blue-700 shadow-sm"
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
