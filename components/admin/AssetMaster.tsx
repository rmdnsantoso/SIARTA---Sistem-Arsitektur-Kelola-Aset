'use client'

import React, { useState } from 'react'

type UnitStatus = 'Tersedia' | 'Dipinjam' | 'Maintenance' | 'Rusak'
type TrackingType = 'SERIALIZED' | 'NON_SERIALIZED'

type UnitHistory = {
  date: string
  action: string
  user: string
  notes?: string
}

type PhysicalUnit = {
  unitId: string
  serialNumber: string
  status: UnitStatus
  history: UnitHistory[]
}

type Asset = {
  id: string
  name: string
  rackLocation: string
  totalStock: number
  availableStock: number
  trackingType: TrackingType
  imageUrl?: string
  units: PhysicalUnit[] // Hanya diisi jika trackingType === 'SERIALIZED'
}

// Helper to generate dummy units
const generateUnits = (assetId: string, count: number, availableCount: number, isNonSerialized: boolean = false): PhysicalUnit[] => {
  return Array.from({ length: count }).map((_, i) => {
    const isAvailable = i < availableCount;
    const history: UnitHistory[] = isAvailable ? [] : [
      { date: '12 Juni 2026 14:30', action: 'Dipinjam', user: 'Budi Santoso' }
    ];
    return {
      unitId: `${assetId}-${String(i + 1).padStart(2, '0')}`,
      serialNumber: isNonSerialized ? 'N/A' : `SN-${Math.floor(1000 + Math.random() * 9000)}`,
      status: isAvailable ? 'Tersedia' : 'Dipinjam',
      history
    }
  })
}

const initialAssets: Asset[] = [
  {
    id: 'AST-001', name: 'Gas Detector (MSA Altair 4X)',
    rackLocation: 'Rak A-12', totalStock: 5, availableStock: 3, trackingType: 'SERIALIZED',
    units: generateUnits('AST-001', 5, 3)
  },
  {
    id: 'AST-002', name: 'Safety Harness Full Body',
    rackLocation: 'Rak B-05', totalStock: 15, availableStock: 10, trackingType: 'SERIALIZED',
    units: generateUnits('AST-002', 15, 10)
  },
  {
    id: 'AST-003', name: 'Bor Listrik (Makita)',
    rackLocation: 'Rak C-01', totalStock: 4, availableStock: 0, trackingType: 'SERIALIZED',
    units: generateUnits('AST-003', 4, 0)
  },
  {
    id: 'AST-004', name: 'Sarung Tangan Las (Kevlar)',
    rackLocation: 'Rak A-02', totalStock: 150, availableStock: 120, trackingType: 'NON_SERIALIZED',
    units: []
  },
  {
    id: 'AST-005', name: 'Helm Safety Proyek (Kuning)',
    rackLocation: 'Rak B-01', totalStock: 50, availableStock: 48, trackingType: 'NON_SERIALIZED',
    units: []
  },
]

const TRACKING_FILTERS = ['Semua', 'SERIALIZED', 'NON_SERIALIZED']

export default function AssetMaster({ isViewOnly = false }: { isViewOnly?: boolean }) {
  const [assets, setAssets] = useState<Asset[]>(initialAssets)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [filterTracking, setFilterTracking] = useState('Semua')
  const [search, setSearch] = useState('')

  const [editingAssetId, setEditingAssetId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', rackLocation: '', imageUrl: '' })

  const [historyModalUnit, setHistoryModalUnit] = useState<PhysicalUnit | null>(null)
  const [unitSearchQuery, setUnitSearchQuery] = useState('')

  // New asset form state
  const [form, setForm] = useState<{
    name: string; rackLocation: string; totalStock: string; trackingType: TrackingType; imageUrl: string
  }>({ name: '', rackLocation: '', totalStock: '', trackingType: 'SERIALIZED', imageUrl: '' })

  const handleAddAsset = () => {
    if (!form.name || !form.rackLocation || !form.totalStock) return
    const stock = parseInt(form.totalStock)
    const newId = `AST-${String(assets.length + 1).padStart(3, '0')}`
    
    const newAsset: Asset = {
      id: newId,
      name: form.name,
      rackLocation: form.rackLocation.toUpperCase(),
      totalStock: stock,
      availableStock: stock,
      trackingType: form.trackingType,
      imageUrl: form.imageUrl,
      units: form.trackingType === 'SERIALIZED' ? generateUnits(newId, stock, stock) : []
    }
    setAssets(prev => [newAsset, ...prev])
    setForm({ name: '', rackLocation: '', totalStock: '', trackingType: 'SERIALIZED', imageUrl: '' })
    setIsAddModalOpen(false)
  }

  const handleSaveEdit = () => {
    setAssets(prev => prev.map(a => a.id === editingAssetId ? { ...a, ...editForm } : a));
    if (selectedAsset?.id === editingAssetId) {
      setSelectedAsset(prev => prev ? { ...prev, ...editForm } : null);
    }
    setEditingAssetId(null);
  }

  const handleDeleteAsset = (assetId: string) => {
    if (confirm('Yakin ingin menghapus barang ini secara permanen dari master data? Semua data unit fisik terkait juga akan terhapus.')) {
      setAssets(prev => prev.filter(a => a.id !== assetId));
      if (selectedAsset?.id === assetId) setSelectedAsset(null);
      if (editingAssetId === assetId) setEditingAssetId(null);
    }
  }

  const handleUpdateSerialNumber = (assetId: string, unitId: string, newSn: string) => {
    setAssets(prev => prev.map(a => {
      if (a.id === assetId) {
        return {
          ...a,
          units: a.units.map(u => u.unitId === unitId ? { ...u, serialNumber: newSn } : u)
        }
      }
      return a
    }))
    
    if (selectedAsset?.id === assetId) {
      setSelectedAsset(prev => prev ? {
        ...prev,
        units: prev.units.map(u => u.unitId === unitId ? { ...u, serialNumber: newSn } : u)
      } : null)
    }
  }

  const handleAddUnitSerialized = (assetId: string, count: number) => {
    setAssets(prev => prev.map(a => {
      if (a.id !== assetId) return a
      if (a.trackingType === 'NON_SERIALIZED') return a // Handled separately
      const currentCount = a.units.length
      const newUnits = Array.from({ length: count }).map((_, i) => ({
        unitId: `${a.id}-${String(currentCount + i + 1).padStart(2, '0')}`,
        serialNumber: `SN-NEW-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'Tersedia' as UnitStatus,
        history: [{ date: new Date().toLocaleString('id-ID'), action: 'Unit Ditambahkan', user: 'Siti Aminah (Admin)' }]
      }))
      return {
        ...a,
        totalStock: a.totalStock + count,
        availableStock: a.availableStock + count,
        units: [...a.units, ...newUnits]
      }
    }))
  }

  const handleRemoveUnitSerialized = (assetId: string, unitId: string) => {
    if(!confirm('Anda yakin ingin memusnahkan / menghapus unit ini dari sistem?')) return;
    setAssets(prev => prev.map(a => {
      if (a.id !== assetId) return a;
      const unitToRemove = a.units.find(u => u.unitId === unitId);
      if (!unitToRemove) return a;
      const isAvail = unitToRemove.status === 'Tersedia';
      return {
        ...a,
        totalStock: Math.max(0, a.totalStock - 1),
        availableStock: Math.max(0, a.availableStock - (isAvail ? 1 : 0)),
        units: a.units.filter(u => u.unitId !== unitId)
      }
    }))
    
    if (selectedAsset?.id === assetId) {
      const unitToRemove = selectedAsset.units.find(u => u.unitId === unitId);
      setSelectedAsset(prev => prev ? {
        ...prev,
        totalStock: Math.max(0, prev.totalStock - 1),
        availableStock: Math.max(0, prev.availableStock - (unitToRemove?.status === 'Tersedia' ? 1 : 0)),
        units: prev.units.filter(u => u.unitId !== unitId)
      } : null)
    }
  }

  const handleAdjustBulkStock = (assetId: string, delta: number) => {
    setAssets(prev => prev.map(a => {
      if (a.id !== assetId) return a;
      const newTotal = Math.max(0, a.totalStock + delta);
      const newAvail = Math.max(0, a.availableStock + delta);
      return {
        ...a,
        totalStock: newTotal,
        availableStock: newAvail
      }
    }))
  
    if (selectedAsset?.id === assetId) {
      setSelectedAsset(prev => prev ? {
        ...prev,
        totalStock: Math.max(0, prev.totalStock + delta),
        availableStock: Math.max(0, prev.availableStock + delta)
      } : null)
    }
  }

  const handleSetBulkStock = (assetId: string, newTotal: number) => {
    if (newTotal < 0) return;
    setAssets(prev => prev.map(a => {
      if (a.id !== assetId) return a;
      const diff = newTotal - a.totalStock;
      return {
        ...a,
        totalStock: newTotal,
        availableStock: Math.max(0, a.availableStock + diff)
      }
    }))
  
    if (selectedAsset?.id === assetId) {
      const diff = newTotal - selectedAsset.totalStock;
      setSelectedAsset(prev => prev ? {
        ...prev,
        totalStock: newTotal,
        availableStock: Math.max(0, prev.availableStock + diff)
      } : null)
    }
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
            {!isViewOnly && (
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shrink-0"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Input Barang Baru
              </button>
            )}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
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
              <div className="p-3 sm:p-4 flex-1 flex flex-col">
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
                  <div className="flex flex-col xl:flex-row gap-2 mt-2">
                    <button
                      onClick={() => setSelectedAsset(a)}
                      className="flex-1 py-1.5 sm:py-2 px-2 bg-white border border-blue-600 text-blue-600 rounded-lg text-xs sm:text-sm font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5 sm:gap-2 min-w-0"
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                      <span className="truncate">{isViewOnly ? 'Lihat Unit' : 'Kelola Unit & QR'}</span>
                    </button>
                    {!isViewOnly && (
                      <div className="flex gap-2 justify-center shrink-0">
                        <button
                          onClick={() => {
                            setEditingAssetId(a.id);
                            setEditForm({ name: a.name, rackLocation: a.rackLocation, imageUrl: a.imageUrl || '' });
                          }}
                          className="flex-1 xl:flex-none px-2.5 sm:px-3 py-1.5 sm:py-2 bg-gray-100 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                          title="Edit Profil Barang"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button
                          onClick={() => handleDeleteAsset(a.id)}
                          className="flex-1 xl:flex-none px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center"
                          title="Hapus Barang"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    )}
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

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Input Barang Baru</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto overscroll-y-contain">
              
              {/* Tipe Pelacakan Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Tipe Pelacakan Sistem <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setForm(f => ({ ...f, trackingType: 'SERIALIZED' }))}
                    className={`p-3 text-left border rounded-lg transition-all ${
                      form.trackingType === 'SERIALIZED' ? 'border-indigo-600 ring-1 ring-indigo-600 bg-indigo-50/50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${form.trackingType === 'SERIALIZED' ? 'border-indigo-600' : 'border-gray-300'}`}>
                        {form.trackingType === 'SERIALIZED' && <div className="w-2 h-2 bg-indigo-600 rounded-full" />}
                      </div>
                      <span className="font-bold text-gray-900 text-sm">Per Unit (Serialized)</span>
                    </div>
                    <p className="text-[10px] text-gray-500 ml-6 leading-relaxed">Pencatatan QR & Serial Number untuk tiap fisik barang. Cocok untuk alat mahal (Laptop, Bor).</p>
                  </button>

                  <button
                    onClick={() => setForm(f => ({ ...f, trackingType: 'NON_SERIALIZED' }))}
                    className={`p-3 text-left border rounded-lg transition-all ${
                      form.trackingType === 'NON_SERIALIZED' ? 'border-orange-500 ring-1 ring-orange-500 bg-orange-50/50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${form.trackingType === 'NON_SERIALIZED' ? 'border-orange-500' : 'border-gray-300'}`}>
                        {form.trackingType === 'NON_SERIALIZED' && <div className="w-2 h-2 bg-orange-500 rounded-full" />}
                      </div>
                      <span className="font-bold text-gray-900 text-sm">Per Unit (Non-Serialized)</span>
                    </div>
                    <p className="text-[10px] text-gray-500 ml-6 leading-relaxed">Pencatatan per item fisik dengan QR unik dari sistem tanpa Serial Number pabrik. Cocok untuk helm, tang, jas hujan.</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Barang <span className="text-red-500">*</span></label>
                <input
                  type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Mis. Multi-Gas Detector Series X"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Foto Barang (Opsional)</label>
                <div className="flex gap-2">
                  <input
                    type="url" value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="https://example.com/foto.jpg"
                  />
                  <button className="px-3 py-2 bg-gray-100 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 shrink-0">Upload</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kuantitas Masuk <span className="text-red-500">*</span></label>
                  <input
                    type="number" min="1" value={form.totalStock} onChange={e => setForm(f => ({ ...f, totalStock: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi Rak <span className="text-red-500">*</span></label>
                  <input
                    type="text" value={form.rackLocation} onChange={e => setForm(f => ({ ...f, rackLocation: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                    placeholder="Mis. A-15"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50">Batal</button>
              <button onClick={handleAddAsset} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-40"
                disabled={!form.name || !form.rackLocation || !form.totalStock}>
                Simpan & Daftarkan Aset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Manage Units & QR Modal ── */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[82vh]">
            {/* Header Modal */}
            <div className="px-5 sm:px-8 py-4 sm:py-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3.5 sm:gap-5">
                <div className={`w-11 h-11 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-bold text-xs tracking-wider shrink-0 shadow-sm ${
                  selectedAsset.trackingType === 'SERIALIZED' ? 'bg-indigo-600' : 'bg-orange-500'
                }`}>
                  {selectedAsset.trackingType === 'SERIALIZED' ? 'SER' : 'NON'}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-2xl font-bold text-gray-900 tracking-tight truncate">{selectedAsset.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 font-mono mt-0.5">{selectedAsset.id} &middot; Rak {selectedAsset.rackLocation}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAsset(null)} className="text-gray-400 hover:text-gray-600 bg-gray-50 p-2 rounded-full border border-gray-100 shrink-0 hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            {/* Content for both SERIALIZED and NON_SERIALIZED */}
            <div className="flex-1 overflow-y-auto overscroll-y-contain bg-gray-50/50 p-4 sm:p-6 flex flex-col gap-4 sm:gap-6">
                <div className="flex flex-col lg:flex-row gap-3 justify-between lg:items-center bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm shrink-0">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">
                      {selectedAsset.trackingType === 'NON_SERIALIZED' 
                        ? `Informasi Stok Master (${selectedAsset.totalStock} Unit)` 
                        : `Daftar Unit Tersimpan (${selectedAsset.totalStock})`}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {selectedAsset.trackingType === 'NON_SERIALIZED' 
                        ? 'Pengelolaan kuantitas stok massal tanpa pelacakan nomor seri' 
                        : 'Nomor seri dan status spesifik tiap fisik barang'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                    {selectedAsset.trackingType !== 'NON_SERIALIZED' && (
                      <div className="relative flex-1 min-w-[140px]">
                        <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input 
                          type="text" 
                          value={unitSearchQuery}
                          onChange={e => setUnitSearchQuery(e.target.value)}
                          placeholder="Cari S/N atau ID..." 
                          className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50/50 focus:bg-white transition-all"
                        />
                      </div>
                    )}
                    {!isViewOnly && selectedAsset.trackingType === 'SERIALIZED' && (
                      <div className="flex items-center gap-1.5 lg:border-l border-gray-100 lg:pl-4 shrink-0">
                        <input 
                          type="number" 
                          id="add-qty-input"
                          defaultValue="1" 
                          min="1"
                          className="w-12 sm:w-16 border border-gray-200 rounded-xl text-xs sm:text-sm px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none text-center font-bold bg-gray-50/50 focus:bg-white transition-all" 
                        />
                        <button
                          onClick={() => {
                            const input = document.getElementById('add-qty-input') as HTMLInputElement;
                            const count = parseInt(input.value) || 0;
                            if (count > 0) handleAddUnitSerialized(selectedAsset.id, count);
                            input.value = '1';
                          }}
                          className="bg-indigo-600 text-white px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-1.5"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                          Tambah Unit
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex-1">
                  <div className="overflow-x-auto overflow-y-auto overscroll-y-contain max-h-[40vh]">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Unit ID / QR</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nomor Seri Pabrik (S/N)</th>
                          <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                      {selectedAsset.trackingType === 'NON_SERIALIZED' ? (
                          <tr className="hover:bg-gray-50/80 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-orange-50 border border-orange-200/60 rounded-xl p-2 shadow-sm flex items-center justify-center text-orange-600">
                                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                </div>
                                <span className="font-mono font-bold text-sm text-indigo-700">{selectedAsset.id} (Master)</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className="text-gray-400 font-mono text-sm italic">N/A (Non-Serialized)</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-green-100 text-green-800">
                                    {selectedAsset.availableStock} Tersedia
                                  </span>
                                  {selectedAsset.totalStock - selectedAsset.availableStock > 0 && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-800">
                                      {selectedAsset.totalStock - selectedAsset.availableStock} Dipinjam
                                    </span>
                                  )}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right whitespace-nowrap">
                              {!isViewOnly && (
                                <div className="flex items-center justify-end gap-2">
                                  <input 
                                    type="number" 
                                    id="adjust-qty-bulk-table"
                                    defaultValue="1" 
                                    min="1"
                                    className="w-16 border border-gray-200 rounded-xl text-sm px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none text-center bg-gray-50 focus:bg-white transition-all" 
                                  />
                                  <button
                                    onClick={() => {
                                      const input = document.getElementById('adjust-qty-bulk-table') as HTMLInputElement;
                                      const count = parseInt(input.value) || 0;
                                      if (count <= 0) return;
                                      handleAdjustBulkStock(selectedAsset.id, count);
                                      input.value = '1';
                                    }}
                                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-xl hover:bg-indigo-100 hover:text-indigo-800 transition-colors shadow-sm"
                                    title="Tambah Stok Baru (Pembelian Masuk)"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    Tambah Stok
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                      ) : selectedAsset.units.filter(u => 
                        u.unitId.toLowerCase().includes(unitSearchQuery.toLowerCase()) || 
                        u.serialNumber.toLowerCase().includes(unitSearchQuery.toLowerCase())
                      ).map(unit => {
                        const isAvailable = unit.status === 'Tersedia'
                        return (
                          <tr key={unit.unitId} className="hover:bg-gray-50/80 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                                  <div className="w-full h-full grid grid-cols-5 gap-[1px]">
                                    {Array.from({ length: 25 }).map((_, j) => (
                                      <div key={j} className={Math.random() > 0.5 ? 'bg-gray-800' : 'bg-transparent'} />
                                    ))}
                                  </div>
                                </div>
                                <span className="font-mono font-bold text-sm text-indigo-700">{unit.unitId}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {selectedAsset.trackingType === 'SERIALIZED' ? (
                                isViewOnly ? (
                                  <span className="text-gray-900 font-mono text-sm">{unit.serialNumber || '-'}</span>
                                ) : (
                                  <input 
                                    type="text"
                                    value={unit.serialNumber}
                                    onChange={e => handleUpdateSerialNumber(selectedAsset.id, unit.unitId, e.target.value)}
                                    placeholder="Masukkan S/N Pabrik..."
                                    className="w-full max-w-[200px] border border-gray-200 rounded-xl text-sm px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none font-mono placeholder:font-sans bg-gray-50 focus:bg-white transition-all"
                                  />
                                )
                              ) : (
                                <span className="text-gray-400 font-mono text-sm italic">N/A (Non-Serialized)</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold tracking-wider ${
                                unit.status === 'Tersedia' ? 'bg-green-50 text-green-700 border border-green-200/60' : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                              }`}>
                                {unit.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setHistoryModalUnit(unit)}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-2 rounded-xl hover:bg-blue-100 transition-colors"
                                  title="Lihat Riwayat & Log Unit"
                                >
                                  Riwayat
                                </button>
                                {!isViewOnly && (
                                  <button
                                    onClick={() => alert(`Mencetak stiker QR individual untuk unit: ${unit.unitId}`)}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200/80 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors shadow-sm"
                                    title="Cetak Stiker QR Individual"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                    Cetak
                                  </button>
                                )}
                                {!isViewOnly && (
                                  <button
                                    onClick={() => handleRemoveUnitSerialized(selectedAsset.id, unit.unitId)}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-xl hover:bg-red-100 hover:text-red-700 transition-colors shadow-sm"
                                    title="Musnahkan/Hapus Unit"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards for Units */}
              <div className="md:hidden space-y-3">
                {selectedAsset.trackingType === 'NON_SERIALIZED' ? (
                  <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4 hover:border-gray-200 transition-all">
                    <div className="flex justify-between items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-orange-50 border border-orange-200/60 rounded-xl p-2 shadow-2xs shrink-0 flex items-center justify-center text-orange-600">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-mono font-bold text-base text-gray-900 leading-tight">{selectedAsset.id}</h3>
                          <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block mt-0.5">Stok Non-Serial</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold tracking-wider bg-green-50 text-green-700 border border-green-200/60">
                          {selectedAsset.availableStock} Tersedia
                        </span>
                        {selectedAsset.totalStock - selectedAsset.availableStock > 0 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-bold tracking-wider bg-amber-50 text-amber-700 border border-amber-200/60">
                            {selectedAsset.totalStock - selectedAsset.availableStock} Dipinjam
                          </span>
                        )}
                      </div>
                    </div>
                    {!isViewOnly && (
                      <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-gray-100">
                        <div className="text-xs text-gray-500 font-medium pb-1 sm:pb-0 sm:flex-1 sm:self-center">Tambah stok baru (pembelian):</div>
                        <div className="flex items-center gap-2 justify-end">
                          <input 
                            type="number" 
                            id="adjust-qty-bulk-mobile"
                            defaultValue="1" 
                            min="1"
                            className="w-16 border border-gray-200 rounded-xl text-xs sm:text-sm px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none text-center font-bold bg-gray-50/50 focus:bg-white transition-all" 
                          />
                          <button
                            onClick={() => {
                              const input = document.getElementById('adjust-qty-bulk-mobile') as HTMLInputElement;
                              const count = parseInt(input.value) || 0;
                              if (count <= 0) return;
                              handleAdjustBulkStock(selectedAsset.id, count);
                              input.value = '1';
                            }}
                            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-4 py-1.5 rounded-xl hover:bg-indigo-100 hover:text-indigo-800 transition-colors shadow-sm"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            Tambah Stok
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : selectedAsset.units.filter(u => 
                  u.unitId.toLowerCase().includes(unitSearchQuery.toLowerCase()) || 
                  u.serialNumber.toLowerCase().includes(unitSearchQuery.toLowerCase())
                ).map(unit => {
                  const isAvailable = unit.status === 'Tersedia'
                  return (
                    <div key={unit.unitId} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 hover:border-gray-200 transition-all">
                      <div className="flex justify-between items-center gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-gray-50 border border-gray-200/60 rounded-xl p-1.5 shadow-2xs shrink-0 flex items-center justify-center">
                            <div className="w-full h-full grid grid-cols-5 gap-[1px]">
                              {Array.from({ length: 25 }).map((_, j) => (
                                <div key={j} className={Math.random() > 0.5 ? 'bg-indigo-600' : 'bg-transparent'} />
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="font-mono font-bold text-sm text-gray-900 leading-tight block">{unit.unitId}</span>
                            <span className="text-[10px] text-gray-400 font-mono block">Fisik Aset</span>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider shrink-0 ${
                          isAvailable ? 'bg-green-50 text-green-700 border border-green-200/60' : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                        }`}>
                          {unit.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 pt-2.5 border-t border-gray-100">
                        <div className="flex-1 min-w-0">
                          {isViewOnly ? (
                            <span className="text-xs font-mono text-gray-700 truncate block">S/N: {unit.serialNumber || '-'}</span>
                          ) : (
                            <input 
                              type="text"
                              value={unit.serialNumber}
                              onChange={e => handleUpdateSerialNumber(selectedAsset.id, unit.unitId, e.target.value)}
                              placeholder="S/N Pabrik..."
                              className="w-full border border-gray-200 rounded-xl text-xs px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none font-mono placeholder:font-sans bg-gray-50/50 focus:bg-white transition-all"
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => setHistoryModalUnit(unit)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                          >
                            Riwayat
                          </button>
                          {!isViewOnly && (
                            <>
                              <button
                                onClick={() => alert(`Mencetak stiker QR individual untuk unit: ${unit.unitId}`)}
                                className="px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200/80 rounded-xl hover:bg-gray-100 transition-colors"
                              >
                                Cetak
                              </button>
                              <button
                                onClick={() => handleRemoveUnitSerialized(selectedAsset.id, unit.unitId)}
                                className="px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors"
                              >
                                Hapus
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="px-5 sm:px-8 py-4 border-t border-gray-100 bg-white flex flex-col sm:flex-row gap-3 justify-between items-center shrink-0">
              <div className="text-xs text-gray-500 text-center sm:text-left w-full sm:w-auto">
                {selectedAsset.trackingType === 'SERIALIZED' ? (
                  <p>Pencetakan mencantumkan <strong>Unit ID</strong> & <strong>S/N Pabrik</strong>.</p>
                ) : (
                  <p>Pencetakan mencetak <strong>copy dari QR Master</strong>.</p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto justify-end">
                {!isViewOnly && selectedAsset.trackingType === 'NON_SERIALIZED' ? (
                  <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50 h-10 w-24 shrink-0">
                      <span className="px-2.5 text-xs text-gray-500 border-r border-gray-200 h-full flex items-center font-medium whitespace-nowrap">Jml</span>
                      <input 
                        type="number" 
                        id="print-qty"
                        defaultValue={selectedAsset.totalStock} 
                        min="1"
                        className="w-full text-xs px-2 py-2 outline-none text-center font-bold text-gray-900 bg-white focus:bg-indigo-50/50" 
                      />
                    </div>
                    <button
                      onClick={() => { 
                        const input = document.getElementById('print-qty') as HTMLInputElement;
                        const count = parseInt(input?.value) || 0;
                        if (count > 0) {
                          alert(`Mencetak ${count} lembar stiker QR Master...`);
                          setSelectedAsset(null);
                        }
                      }}
                      className="flex-1 sm:flex-none px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                      <span>Cetak Label Master</span>
                    </button>
                  </div>
                ) : (
                  !isViewOnly && (
                    <button
                      onClick={() => { 
                        alert(`Mencetak BATCH ${selectedAsset.totalStock} stiker QR untuk ${selectedAsset.name}...`); 
                        setSelectedAsset(null);
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                      <span>Cetak Semua ({selectedAsset.totalStock})</span>
                    </button>
                  )
                )}
                <button onClick={() => setSelectedAsset(null)} className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200/80 rounded-xl hover:bg-gray-100 text-center transition-colors">Selesai</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Profil Barang Modal ── */}
      {editingAssetId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Edit Data Barang</h3>
              <button onClick={() => setEditingAssetId(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto overscroll-y-contain">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Barang <span className="text-red-500">*</span></label>
                <input
                  type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Foto Barang (Opsional)</label>
                <div className="flex gap-2">
                  <input
                    type="url" value={editForm.imageUrl} onChange={e => setEditForm(f => ({ ...f, imageUrl: e.target.value }))}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="https://example.com/foto.jpg"
                  />
                  <button className="px-3 py-2 bg-gray-100 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 shrink-0">Upload</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi Rak <span className="text-red-500">*</span></label>
                <input
                  type="text" value={editForm.rackLocation} onChange={e => setEditForm(f => ({ ...f, rackLocation: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
              <button onClick={() => setEditingAssetId(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50">Batal</button>
              <button onClick={handleSaveEdit} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-40"
                disabled={!editForm.name || !editForm.rackLocation}>
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Riwayat Unit Modal ── */}
      {historyModalUnit && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Riwayat Pemakaian Unit
                </h3>
                <p className="text-xs text-gray-500 font-mono mt-1">ID: {historyModalUnit.unitId} | S/N: {historyModalUnit.serialNumber || 'Kosong'}</p>
              </div>
              <button onClick={() => setHistoryModalUnit(null)} className="text-gray-400 hover:text-gray-600 bg-gray-50 p-2 rounded-full">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-4 sm:p-8 overflow-y-auto overscroll-y-contain space-y-6 sm:space-y-8 flex-1 bg-gray-50">
              {historyModalUnit.history.length === 0 ? (
                <div className="text-center py-10">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <p className="text-sm text-gray-500">Belum ada riwayat pemakaian untuk unit ini.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {historyModalUnit.history.map((h, idx) => (
                    <div key={idx} className="flex gap-4 relative">
                      {idx !== historyModalUnit.history.length - 1 && (
                        <div className="absolute left-[11px] top-6 bottom-[-24px] w-0.5 bg-gray-200" />
                      )}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 z-10 ${
                        h.action === 'Dipinjam' ? 'bg-orange-50 border-orange-200 text-orange-600' :
                        h.action === 'Dikembalikan' ? 'bg-green-50 border-green-200 text-green-600' :
                        'bg-blue-50 border-blue-200 text-blue-600'
                      }`}>
                        <div className="w-2 h-2 rounded-full bg-current" />
                      </div>
                      <div className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-bold text-gray-900">{h.action}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{h.date}</span>
                        </div>
                        <p className="text-sm text-gray-700 font-medium">{h.user}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
