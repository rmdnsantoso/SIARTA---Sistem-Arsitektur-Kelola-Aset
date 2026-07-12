'use client'

import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { 
  getAllAssetsForAdmin, 
  createAsset, 
  updateAsset, 
  deleteAsset, 
  updatePhysicalUnitSN, 
  addPhysicalUnits, 
  removePhysicalUnit, 
  addAssetStock,
  archiveAsset,
  unarchiveAsset
} from '../../actions/core/asset'
import { QRCodeSVG } from 'qrcode.react'
import { usePolling } from '../../hooks/usePolling'

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
  assetCode: string
  name: string
  category: string
  totalStock: number
  availableStock: number
  isActive?: boolean
  trackingType: TrackingType
  imageUrl?: string
  units: PhysicalUnit[] // Hanya diisi jika trackingType === 'SERIALIZED'
}

// generateUnits deleted

const initialAssets: Asset[] = []

const TRACKING_FILTERS = ['Semua', 'SERIALIZED', 'NON_SERIALIZED']

export default function AssetMaster({ isViewOnly = false }: { isViewOnly?: boolean }) {
  const [assets, setAssets] = useState<Asset[]>(initialAssets)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [filterTracking, setFilterTracking] = useState('Semua')
  const [activeTab, setActiveTab] = useState<'Aktif' | 'Diarsipkan'>('Aktif')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const [editingAssetId, setEditingAssetId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', imageUrl: '' })

  const [historyModalUnit, setHistoryModalUnit] = useState<PhysicalUnit | null>(null)
  const [unitSearchQuery, setUnitSearchQuery] = useState('')
  const [printQRAsset, setPrintQRAsset] = useState<{ code: string; name: string }[] | null>(null)
  const [deleteUnitConfirm, setDeleteUnitConfirm] = useState<{assetId: string, unitId: string} | null>(null)
  const [assetActionConfirm, setAssetActionConfirm] = useState<{ id: string, action: 'archive' | 'unarchive' } | null>(null)

  // New asset form state
  type AssetFormState = {
    assetCode: string
    name: string
    category: string
    trackingType: 'SERIALIZED' | 'NON_SERIALIZED'
    totalStock: number | string
    serialNumbers: string[]
    spec: string
    imageFile: File | null
    imageUrl: string
  }

  const initialFormState: AssetFormState = {
    assetCode: '',
    name: '',
    category: 'Elektronik',
    trackingType: 'NON_SERIALIZED',
    totalStock: 1,
    serialNumbers: [''],
    spec: '',
    imageFile: null,
    imageUrl: ''
  }

  const [form, setForm] = useState<AssetFormState>(initialFormState)

  React.useEffect(() => {
    if (!isAddModalOpen) {
      setForm(initialFormState)
    }
  }, [isAddModalOpen])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok && data.url) {
        if (isEdit) {
          setEditForm(f => ({ ...f, imageUrl: data.url }))
        } else {
          setForm(f => ({ ...f, imageUrl: data.url }))
        }
      } else {
        toast.error(data.error || 'Gagal mengunggah foto')
      }
    } catch (err) {
      toast.error('Gagal mengunggah foto')
    }
  }

  const fetchAssets = async () => {
    try {
      const res = await getAllAssetsForAdmin()
      if (res.success && res.data) {
        const adapted: Asset[] = res.data.map((dbAsset: any) => {
          return {
            id: dbAsset.id,
            assetCode: dbAsset.assetCode,
            name: dbAsset.name,
            category: dbAsset.category,
            totalStock: dbAsset.computedTotalStock,
            availableStock: dbAsset.computedAvailableStock,
            trackingType: dbAsset.isSerialized ? 'SERIALIZED' : 'NON_SERIALIZED',
            isActive: dbAsset.isActive,
            imageUrl: dbAsset.spec || '',
            units: (dbAsset.units || []).map((u: any) => ({
              ...u,
              history: (u.history || []).map((h: any) => ({
                date: h.timestamp,
                action: h.action,
                user: h.actor
              }))
            }))
          }
        })
        setAssets(prev => JSON.stringify(prev) !== JSON.stringify(adapted) ? adapted : prev)
      }
    } catch (err) {
      console.error('Gagal memuat master aset:', err)
    }
  }

  usePolling(fetchAssets, 10000)

  const handleAddAsset = async () => {
    if (!form.name || !form.totalStock) return
    setLoading(true)
    const isSerialized = form.trackingType === 'SERIALIZED'
    const validSerialNumbers = form.serialNumbers.filter(sn => sn.trim() !== '')
    
    if (isSerialized) {
      const hasDuplicateSN = new Set(validSerialNumbers).size !== validSerialNumbers.length;
      if (hasDuplicateSN) {
        toast.error('Terdapat Serial Number yang duplikat dalam form ini.');
        setLoading(false);
        return;
      }
    }
    
    const stock = isSerialized ? Math.max(1, validSerialNumbers.length) : parseInt(form.totalStock as string)
    
    const maxId = assets.reduce((max, a) => {
      const num = parseInt(a.assetCode.split('-')[1] || '0');
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    const code = `AST-${String(maxId + 1).padStart(3, '0')}`
    
    try {
      const res = await createAsset({
        assetCode: code,
        name: form.name,
        category: 'Umum',
        isSerialized,
        quantity: stock,
        spec: form.imageUrl,
        serialNumbers: validSerialNumbers
      })

      if (!res.success) {
        toast.error(`Gagal menambahkan aset: ${res.error}`)
        setLoading(false)
        return
      }

      if (res.data) {
        const newAsset: Asset = {
          id: res.data.id,
          assetCode: res.data.assetCode,
          name: res.data.name,
          category: res.data.category,
          totalStock: (res.data as any).computedTotalStock ?? res.data.quantity,
          availableStock: (res.data as any).computedAvailableStock ?? res.data.quantity,
          trackingType: res.data.isSerialized ? 'SERIALIZED' : 'NON_SERIALIZED',
          imageUrl: res.data.spec || '',
          units: (res.data.units || []).map((u: any) => ({
            ...u,
            status: u.status as UnitStatus,
            history: (u.history || []).map((h: any) => ({
              date: h.timestamp,
              action: h.action,
              user: h.actor
            }))
          }))
        }
        setAssets(prev => [newAsset, ...prev])
        setForm({
          assetCode: '', name: '', category: 'Elektronik', trackingType: 'NON_SERIALIZED',
          totalStock: 1, serialNumbers: [''], spec: '', imageFile: null, imageUrl: ''
        })
        setIsAddModalOpen(false)
      }
    } catch (err: any) {
      toast.error(`Terjadi kesalahan: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingAssetId) return
    setLoading(true)
    try {
      const res = await updateAsset(editingAssetId, {
        name: editForm.name,
        spec: editForm.imageUrl
      })

      if (!res.success) {
        toast.error(`Gagal menyimpan perubahan: ${res.error}`)
        setLoading(false)
        return
      }

      setAssets(prev => prev.map(a => a.id === editingAssetId ? { ...a, ...editForm } : a));
      if (selectedAsset?.id === editingAssetId) {
        setSelectedAsset(prev => prev ? { ...prev, ...editForm } : null);
      }
      setEditingAssetId(null);
    } catch (err: any) {
      toast.error(`Terjadi kesalahan: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAssetAction = async (assetId: string, action: 'archive' | 'unarchive') => {
    try {
      const res = action === 'archive' ? await archiveAsset(assetId) : await unarchiveAsset(assetId);
      if (!res.success) {
        toast.error(`Gagal ${action === 'archive' ? 'mengarsipkan' : 'mengaktifkan'} aset: ${res.error}`)
        return
      }
      setAssets(prev => prev.map(a => a.id === assetId ? { ...a, isActive: action === 'archive' ? false : true } : a));
      if (action === 'archive' && selectedAsset?.id === assetId) setSelectedAsset(null);
      if (action === 'archive' && editingAssetId === assetId) setEditingAssetId(null);
      toast.success(`Asset berhasil ${action === 'archive' ? 'diarsipkan' : 'diaktifkan kembali'}`);
    } catch (err: any) {
      toast.error(`Terjadi kesalahan: ${err.message}`)
    }
  }

  const handleUpdateSerialNumber = async (assetId: string, unitId: string, newSn: string) => {
    if (newSn.trim() !== '') {
      const asset = assets.find(a => a.id === assetId);
      if (asset) {
        const isDuplicate = asset.units.some(u => u.unitId !== unitId && u.serialNumber.trim().toUpperCase() === newSn.trim().toUpperCase());
        if (isDuplicate) {
          toast.error(`Gagal: Serial Number "${newSn}" sudah ada di unit lain dalam aset ini.`);
          return;
        }
      }
    }

    try {
      const res = await updatePhysicalUnitSN(unitId, newSn);
      if (!res.success) {
        toast.error(`Gagal mengubah SN: ${res.error}`);
        return;
      }
      toast.success('Serial Number berhasil diubah');
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
    } catch (e: any) {
      toast.error(`Kesalahan: ${e.message}`);
    }
  }

  const handleAddUnitSerialized = async (assetId: string, count: number) => {
    const asset = assets.find(a => a.id === assetId)
    if (!asset) return
    const maxUnitIdNum = asset.units.reduce((max, u) => {
      const num = parseInt(u.unitId.split('-').pop() || '0');
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    
    try {
      const res = await addPhysicalUnits(assetId, count, maxUnitIdNum + 1);
      if (!res.success) {
        toast.error(`Gagal menambah unit: ${res.error}`);
        return;
      }
      toast.success('Unit berhasil ditambahkan');
      // State will update on next poll interval, but we can optimistically update
      setAssets(prev => prev.map(a => {
        if (a.id !== assetId) return a
        const newUnits = Array.from({ length: count }).map((_, i) => ({
          unitId: `${a.assetCode}-${String(maxUnitIdNum + 1 + i).padStart(2, '0')}`,
          serialNumber: '',
          status: 'Tersedia' as UnitStatus,
          history: [{ date: new Date().toLocaleString('id-ID'), action: 'Unit Ditambahkan', user: 'Admin' }]
        }))
        return { ...a, totalStock: a.totalStock + count, availableStock: a.availableStock + count, units: [...a.units, ...newUnits] }
      }))
      
      if (selectedAsset?.id === assetId) {
        setSelectedAsset(prev => prev ? { ...prev, totalStock: prev.totalStock + count, availableStock: prev.availableStock + count, units: [...prev.units, ...Array.from({ length: count }).map((_, i) => ({
          unitId: `${prev.assetCode}-${String(maxUnitIdNum + 1 + i).padStart(2, '0')}`,
          serialNumber: '',
          status: 'Tersedia' as UnitStatus,
          history: [{ date: new Date().toLocaleString('id-ID'), action: 'Unit Ditambahkan', user: 'Admin' }]
        }))] } : null)
      }
    } catch (e: any) {
      toast.error(`Kesalahan: ${e.message}`);
    }
  }

  const handleRemoveUnitSerialized = async (assetId: string, unitId: string) => {
    try {
      const res = await removePhysicalUnit(unitId);
      if (!res.success) {
        toast.error(`Gagal menghapus unit: ${res.error}`);
        return;
      }
      toast.success('Unit berhasil dihapus');
      setAssets(prev => prev.map(a => {
        if (a.id !== assetId) return a
        return {
          ...a,
          totalStock: a.totalStock - 1,
          availableStock: a.availableStock - 1,
          units: a.units.filter(u => u.unitId !== unitId)
        }
      }))
      
      if (selectedAsset?.id === assetId) {
        setSelectedAsset(prev => prev ? {
          ...prev,
          totalStock: prev.totalStock - 1,
          availableStock: prev.availableStock - 1,
          units: prev.units.filter(u => u.unitId !== unitId)
        } : null)
      }
    } catch (e: any) {
      toast.error(`Kesalahan: ${e.message}`);
    }
  };

  const handleAddStock = async (assetId: string, amount: number) => {
    try {
      const res = await addAssetStock(assetId, amount);
      if (!res.success) {
        toast.error(`Gagal menambah stok: ${res.error}`);
        return;
      }
      toast.success('Stok berhasil ditambahkan');
      setAssets(prev => prev.map(a => {
        if (a.id === assetId) {
          return { ...a, totalStock: a.totalStock + amount, availableStock: a.availableStock + amount }
        }
        return a
      }))
      
      if (selectedAsset?.id === assetId) {
        setSelectedAsset(prev => prev ? { ...prev, totalStock: prev.totalStock + amount, availableStock: prev.availableStock + amount } : null)
      }
    } catch (e: any) {
      toast.error(`Kesalahan: ${e.message}`);
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
    const isAssetActive = a.isActive !== false;
    const matchTab = activeTab === 'Aktif' ? isAssetActive : !isAssetActive;
    const matchTracking = filterTracking === 'Semua' || a.trackingType === filterTracking
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.assetCode.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchTracking && matchSearch
  })

  return (
    <div className="flex flex-col gap-6 font-sans">

      {/* ── Top Toolbar & Filters ── */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col shrink-0">
        {/* Header Row: Title, Search, Add Button */}
        <div className="p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Master Aset</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Kelola data seluruh aset dan inventaris perusahaan.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-72">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                placeholder="Cari Kode Aset atau nama..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none shadow-sm transition-all"
              />
            </div>
            
            {!isViewOnly && (
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 hover:-translate-y-[1px] transition-all shadow-md hover:shadow-lg shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Input Barang
              </button>
            )}
          </div>
        </div>
        
        {/* Filters Row */}
        <div className="p-3 sm:p-4 bg-gray-50/50 flex flex-col sm:flex-row gap-4 items-center">
          {/* Tipe Pelacakan */}
          <div className="flex items-center w-full sm:w-auto">
            <div className="flex flex-row bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
              <button
                onClick={() => setFilterTracking('Semua')}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-[11px] sm:text-xs font-bold transition-all ${
                  filterTracking === 'Semua' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilterTracking('SERIALIZED')}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-[11px] sm:text-xs font-bold transition-all ${
                  filterTracking === 'SERIALIZED' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Serialized
              </button>
              <button
                onClick={() => setFilterTracking('NON_SERIALIZED')}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-[11px] sm:text-xs font-bold transition-all ${
                  filterTracking === 'NON_SERIALIZED' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Non-Serialized
              </button>
            </div>
          </div>
          
          <div className="hidden sm:block w-px h-6 bg-gray-300"></div>

          {/* Status Barang */}
          <div className="flex items-center w-full sm:w-auto">
            <div className="flex flex-row bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('Aktif')}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-[11px] sm:text-xs font-bold transition-all ${
                  activeTab === 'Aktif' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Katalog Aktif
              </button>
              <button
                onClick={() => setActiveTab('Diarsipkan')}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-[11px] sm:text-xs font-bold transition-all ${
                  activeTab === 'Diarsipkan' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Diarsipkan
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1">
        {/* ── E-Commerce Style Grid Layout ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
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
              <div className="h-52 bg-gray-50 border-b border-gray-100 flex items-center justify-center p-4 relative overflow-hidden group-hover:bg-gray-100 transition-colors">
                {a.imageUrl ? (
                  <img src={a.imageUrl} alt={a.name} className="w-full h-full object-contain" />
                ) : (
                  <svg className="w-24 h-24 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                )}
                {/* Tracking Badge */}
                <div className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg shadow text-[10px] font-bold tracking-wider ${
                  a.trackingType === 'SERIALIZED' ? 'bg-indigo-600 text-white' : 'bg-orange-500 text-white'
                }`}>
                  {a.trackingType === 'SERIALIZED' ? (
                    <>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                      Serialized
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                      Non-Serialized
                    </>
                  )}
                </div>
                <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-gray-600 border border-gray-200">
                  {a.assetCode}
                </div>
              </div>
              
              {/* Product Info */}
              <div className="p-3 sm:p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] text-gray-400 font-mono">{a.assetCode}</span>
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
                            setEditForm({ name: a.name, imageUrl: a.imageUrl || '' });
                          }}
                          className="flex-1 xl:flex-none px-2.5 sm:px-3 py-1.5 sm:py-2 bg-gray-100 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                          title="Edit Profil Barang"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button
                          onClick={() => setAssetActionConfirm({ id: a.id, action: a.isActive === false ? 'unarchive' : 'archive' })}
                          className={`flex-1 xl:flex-none px-2.5 sm:px-3 py-1.5 sm:py-2 border rounded-lg transition-colors flex items-center justify-center ${
                            a.isActive === false 
                              ? 'bg-white border-green-200 text-green-600 hover:bg-green-50' 
                              : 'bg-white border-amber-200 text-amber-600 hover:bg-amber-50'
                          }`}
                          title={a.isActive === false ? "Aktifkan Kembali" : "Arsipkan Barang"}
                        >
                          {a.isActive === false ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                          )}
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
                    <p className="text-[10px] text-gray-500 ml-6 leading-relaxed">Pencatatan QR & Serial Number untuk tiap fisik barang. Cocok untuk alat seperti laptop, bor.</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto Barang (Opsional)</label>
                <div className="flex gap-2 items-center">
                  {form.imageUrl && (
                    <img src={form.imageUrl} alt="Preview" className="h-10 w-10 object-cover rounded" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handleFileUpload(e, false)}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>
              </div>
              {form.trackingType === 'NON_SERIALIZED' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kuantitas Masuk <span className="text-red-500">*</span></label>
                  <input
                    type="number" min="1" value={form.totalStock} onChange={e => setForm(f => ({ ...f, totalStock: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="0"
                  />
                </div>
              ) : (
                <div className="border border-indigo-100 bg-indigo-50/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-bold text-indigo-900">Serial Number Unit <span className="text-red-500">*</span></label>
                    <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{form.serialNumbers.length} Unit</span>
                  </div>
                  <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-1 custom-scrollbar">
                    {form.serialNumbers.map((sn, idx) => {
                      const isDuplicate = sn.trim() !== '' && form.serialNumbers.filter(s => s.trim() === sn.trim()).length > 1;
                      return (
                      <div key={idx} className="flex gap-3 group items-center bg-gray-50/50 p-1.5 rounded-xl border border-transparent hover:border-gray-200 transition-colors">
                        <div className="bg-indigo-100 text-indigo-700 font-mono text-xs px-2.5 py-2.5 rounded-lg flex items-center justify-center font-bold shrink-0 w-10">
                          #{idx + 1}
                        </div>
                        <input
                          type="text" value={sn}
                          onChange={e => {
                            const newSn = [...form.serialNumbers];
                            newSn[idx] = e.target.value;
                            setForm(f => ({ ...f, serialNumbers: newSn, totalStock: newSn.length }));
                          }}
                          className={`flex-1 rounded-lg px-3.5 py-2.5 text-sm font-mono outline-none uppercase transition-all ${
                            isDuplicate 
                              ? 'border-2 border-red-400 bg-red-50 text-red-900 focus:ring-2 focus:ring-red-500 placeholder:text-red-300' 
                              : 'border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 placeholder:text-gray-400'
                          }`}
                          placeholder={`Misal: SN-00${idx + 1}`}
                        />
                        <button
                          onClick={() => {
                            if (form.serialNumbers.length <= 1) return;
                            const newSn = form.serialNumbers.filter((_, i) => i !== idx);
                            setForm(f => ({ ...f, serialNumbers: newSn, totalStock: newSn.length }));
                          }}
                          disabled={form.serialNumbers.length <= 1}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent shrink-0"
                          title="Hapus baris ini"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    )})}
                  </div>
                  <button
                    onClick={() => setForm(f => ({ ...f, serialNumbers: [...f.serialNumbers, ''], totalStock: f.serialNumbers.length + 1 }))}
                    className="mt-3 w-full py-2 border-2 border-dashed border-indigo-200 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Tambah Kolom Serial Number
                  </button>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50">Batal</button>
              <button
                onClick={handleAddAsset}
                disabled={!form.name || !form.totalStock || loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Simpan & Daftarkan Aset'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ΓöÇΓöÇ Manage Units & QR Modal ΓöÇΓöÇ */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[82vh]">
            {/* Header Modal */}
            <div className="px-5 sm:px-8 py-4 sm:py-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3.5 sm:gap-5">
                <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm ${
                  selectedAsset.trackingType === 'SERIALIZED' ? 'bg-indigo-600' : 'bg-orange-500'
                }`}>
                  {selectedAsset.trackingType === 'SERIALIZED' ? (
                    <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                  ) : (
                    <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg sm:text-2xl font-bold text-gray-900 tracking-tight truncate">{selectedAsset.name}</h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${
                      selectedAsset.trackingType === 'SERIALIZED' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {selectedAsset.trackingType === 'SERIALIZED' ? 'Serialized' : 'Non-Serialized'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 font-mono mt-0.5">{selectedAsset.assetCode}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAsset(null)} className="text-gray-400 hover:text-gray-600 bg-gray-50 p-2 rounded-full border border-gray-100 shrink-0 hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
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
                <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden shrink-0 mb-8">
                  <div className="overflow-x-auto">
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
                                <div className="w-12 h-12 bg-white border border-gray-200 rounded-xl p-1 shadow-sm flex items-center justify-center shrink-0">
                                  <QRCodeSVG value={selectedAsset.assetCode} size={36} />
                                </div>
                                <span className="font-mono font-bold text-sm text-indigo-700">{selectedAsset.assetCode} (Master)</span>
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
                                    onKeyDown={(e) => { if (['-', '+', 'e', 'E', '.', ','].includes(e.key)) e.preventDefault(); }}
                                    className="w-20 border border-gray-200 rounded-xl text-sm px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none text-center font-bold bg-gray-50 focus:bg-white transition-all" 
                                  />
                                  <button
                                    onClick={() => {
                                      const input = document.getElementById('adjust-qty-bulk-table') as HTMLInputElement;
                                      const count = parseInt(input.value) || 0;
                                      if (count <= 0) return;
                                      handleAddStock(selectedAsset.id, count);
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
                                <div className="w-12 h-12 bg-white border border-gray-200 rounded-xl p-1.5 shadow-sm flex items-center justify-center overflow-hidden">
                                  <QRCodeSVG value={unit.serialNumber && unit.serialNumber !== 'N/A' ? unit.serialNumber : unit.unitId} size={36} level="L" includeMargin={false} />
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
                                    defaultValue={unit.serialNumber}
                                    onBlur={e => {
                                      if (e.target.value !== unit.serialNumber) {
                                        handleUpdateSerialNumber(selectedAsset.id, unit.unitId, e.target.value)
                                      }
                                    }}
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
                                    onClick={() => setPrintQRAsset([{ code: unit.serialNumber && unit.serialNumber !== 'N/A' ? unit.serialNumber : unit.unitId, name: `${selectedAsset.name} (${unit.unitId})` }])}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200/80 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors shadow-sm"
                                    title="Cetak Stiker QR Individual"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                    Cetak
                                  </button>
                                )}
                                {/* Tombol Hapus Unit Sementara Dinonaktifkan (Leak Prevention)
                                {!isViewOnly && (
                                  <button
                                    onClick={() => setDeleteUnitConfirm({assetId: selectedAsset.id, unitId: unit.unitId})}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-xl hover:bg-red-100 hover:text-red-700 transition-colors shadow-sm"
                                    title="Musnahkan/Hapus Unit"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  </button>
                                )}
                                */}
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
                          <h3 className="font-mono font-bold text-base text-gray-900 leading-tight">{selectedAsset.assetCode}</h3>
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
                            onKeyDown={(e) => { if (['-', '+', 'e', 'E', '.', ','].includes(e.key)) e.preventDefault(); }}
                            className="w-16 border border-gray-200 rounded-xl text-xs sm:text-sm px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none text-center font-bold bg-gray-50/50 focus:bg-white transition-all" 
                          />
                          <button
                            onClick={() => {
                              const input = document.getElementById('adjust-qty-bulk-mobile') as HTMLInputElement;
                              const count = parseInt(input.value) || 0;
                              if (count <= 0) return;
                              handleAddStock(selectedAsset.id, count);
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
                          <div className="w-8 h-8 bg-white border border-gray-200/60 rounded-xl p-1 shadow-2xs shrink-0 flex items-center justify-center overflow-hidden">
                            <QRCodeSVG value={unit.serialNumber && unit.serialNumber !== 'N/A' ? unit.serialNumber : unit.unitId} size={22} level="L" includeMargin={false} />
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
                              defaultValue={unit.serialNumber}
                              onBlur={e => {
                                if (e.target.value !== unit.serialNumber) {
                                  handleUpdateSerialNumber(selectedAsset.id, unit.unitId, e.target.value)
                                }
                              }}
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
                                onClick={() => setPrintQRAsset([{ code: unit.serialNumber && unit.serialNumber !== 'N/A' ? unit.serialNumber : selectedAsset.assetCode, name: `${selectedAsset.name} (${unit.unitId})` }])}
                                className="px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200/80 rounded-xl hover:bg-gray-100 transition-colors"
                              >
                                Cetak
                              </button>
                              {/* Tombol Hapus Unit Sementara Dinonaktifkan (Leak Prevention)
                              <button
                                onClick={() => setDeleteUnitConfirm({assetId: selectedAsset.id, unitId: unit.unitId})}
                                className="px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors"
                              >
                                Hapus
                              </button>
                              */}
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
                        max={selectedAsset.totalStock}
                        className="w-full text-xs px-2 py-2 outline-none text-center font-bold text-gray-900 bg-white focus:bg-indigo-50/50" 
                      />
                    </div>
                    <button
                      onClick={() => { 
                        const input = document.getElementById('print-qty') as HTMLInputElement;
                        let count = parseInt(input?.value) || 0;
                        if (count > selectedAsset.totalStock) {
                          count = selectedAsset.totalStock;
                          input.value = String(count);
                          toast.error(`Hanya bisa mencetak maksimal sesuai stok (${selectedAsset.totalStock})`);
                        }
                        if (count > 0) {
                          setPrintQRAsset(Array(count).fill({ code: selectedAsset.assetCode, name: selectedAsset.name }));
                        }
                      }}
                      className="flex-1 sm:flex-none px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                      <span>Cetak Semua</span>
                    </button>
                  </div>
                ) : (
                  !isViewOnly && (
                    <button
                      onClick={() => { 
                        const arr = selectedAsset.units.map(u => ({ code: u.serialNumber && u.serialNumber !== 'N/A' ? u.serialNumber : selectedAsset.assetCode, name: `${selectedAsset.name} (${u.unitId})` }));
                        setPrintQRAsset(arr.length ? arr : [{ code: selectedAsset.assetCode, name: selectedAsset.name }]);
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

      {/* ΓöÇΓöÇ Edit Profil Barang Modal ΓöÇΓöÇ */}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto Barang (Opsional)</label>
                <div className="flex gap-2 items-center">
                  {editForm.imageUrl && (
                    <img src={editForm.imageUrl} alt="Preview" className="h-10 w-10 object-cover rounded" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handleFileUpload(e, true)}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
              <button onClick={() => setEditingAssetId(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50">Batal</button>
              <button 
                  onClick={handleSaveEdit}
                  disabled={!editForm.name || loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-40">
                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ΓöÇΓöÇ Riwayat Unit Modal ΓöÇΓöÇ */}
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
              {historyModalUnit.history.filter(h => h.action.startsWith('Dipinjam') || h.action.startsWith('Dikembalikan')).length === 0 ? (
                <div className="text-center py-10">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <p className="text-sm text-gray-500">Belum ada riwayat pemakaian untuk unit ini.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {historyModalUnit.history.filter(h => h.action.startsWith('Dipinjam') || h.action.startsWith('Dikembalikan')).map((h, idx, filteredHistory) => (
                    <div key={idx} className="flex gap-4 relative">
                      {idx !== filteredHistory.length - 1 && (
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

      {/* Modal Cetak QR */}
      {printQRAsset && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900 truncate pr-4">Cetak QR Code ({printQRAsset.length} Item)</h2>
              <button onClick={() => setPrintQRAsset(null)} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-1.5 rounded-full hover:bg-gray-200 transition-colors shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 bg-gray-50 overflow-y-auto w-full flex-1">
              <div id="qr-print-area" className="flex flex-wrap gap-4 justify-start">
                {printQRAsset.map((item, idx) => (
                  <div key={idx} className="qr-container bg-white p-3 rounded-xl border border-gray-200 flex flex-col items-center w-[160px] shadow-sm">
                    <QRCodeSVG value={item.code} size={110} level="H" includeMargin={false} />
                    <h3 className="font-bold text-[11px] text-gray-900 text-center mt-3 w-full break-words leading-snug">{item.name}</h3>
                    <p className="text-gray-500 font-mono mt-1.5 text-[10px] text-center w-full break-all">{item.code}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-2 shrink-0">
              <button onClick={() => setPrintQRAsset(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100">Batal</button>
              <button onClick={() => {
                const printContent = document.getElementById('qr-print-area');
                if (printContent) {
                  const win = window.open('', '_blank');
                  win?.document.write('<html><head><title>Print QR</title><style>@page { margin: 10mm; } body { font-family: sans-serif; margin: 0; padding: 0; } #qr-print-area { display: flex; flex-wrap: wrap; justify-content: flex-start; align-items: flex-start; gap: 15px; } .qr-container { padding: 10px; border: 1px dashed #ccc; display: flex; flex-direction: column; align-items: center; width: 140px; box-sizing: border-box; page-break-inside: avoid; } .qr-container svg { width: 100px; height: 100px; } h3 { margin: 8px 0 0; font-size: 11px; text-align: center; max-width: 100%; word-break: break-word; line-height: 1.3; } p { margin: 4px 0 0; font-family: monospace; font-size: 10px; color: #555; text-align: center; max-width: 100%; word-break: break-all; }</style></head><body>');
                  win?.document.write(printContent.outerHTML);
                  win?.document.write('</body></html>');
                  win?.document.close();
                  setTimeout(() => {
                    win?.print();
                  }, 250);
                }
              }} className="px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Print Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete Unit */}
      {deleteUnitConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Unit Fisik?</h3>
              <p className="text-sm text-gray-500">
                Anda yakin ingin menghapus unit <span className="font-bold text-gray-700">{deleteUnitConfirm.unitId}</span> dari sistem? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button 
                onClick={() => setDeleteUnitConfirm(null)} 
                className="flex-1 px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
              >
                Batal
              </button>
              <button 
                onClick={() => {
                  handleRemoveUnitSerialized(deleteUnitConfirm.assetId, deleteUnitConfirm.unitId);
                  setDeleteUnitConfirm(null);
                }} 
                className="flex-1 px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors shadow-sm"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirm Archive/Unarchive Asset */}
      {assetActionConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${assetActionConfirm.action === 'archive' ? 'bg-amber-100' : 'bg-green-100'}`}>
                {assetActionConfirm.action === 'archive' ? (
                  <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {assetActionConfirm.action === 'archive' ? 'Arsipkan Barang?' : 'Aktifkan Kembali Barang?'}
              </h3>
              <p className="text-sm text-gray-500">
                {assetActionConfirm.action === 'archive' 
                  ? 'Barang ini akan disembunyikan dari daftar katalog aktif agar tidak bisa dipinjam lagi, namun riwayat masa lalunya tetap utuh.' 
                  : 'Barang ini akan kembali tersedia di daftar katalog utama dan bisa dipinjam oleh user.'}
              </p>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button 
                onClick={() => setAssetActionConfirm(null)} 
                className="flex-1 px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
              >
                Batal
              </button>
              <button 
                onClick={() => {
                  handleAssetAction(assetActionConfirm.id, assetActionConfirm.action);
                  setAssetActionConfirm(null);
                }} 
                className={`flex-1 px-4 py-2 text-sm font-bold text-white rounded-xl transition-colors shadow-sm ${
                  assetActionConfirm.action === 'archive' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {assetActionConfirm.action === 'archive' ? 'Ya, Arsipkan' : 'Ya, Aktifkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

}
 
