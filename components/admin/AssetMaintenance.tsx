'use client'

import React, { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { createMaintenanceRecord, resolveMaintenanceRecord, getActiveMaintenanceRecords } from '../../actions/core/maintenance'
import { getAllAssetsForAdmin } from '../../actions/core/asset'
import InlineQRScanner from '../shared/InlineQRScanner'

type EscalationStatus = 'Menunggu Tindakan' | 'Selesai' | 'Dimusnahkan'

interface EscalationTicket {
  id: string
  dbId?: string
  items: any[]
  issue: string
  reporter: string
  dateReported: string
  status: EscalationStatus
  photoUrl?: string
  photos?: string[]
  timestamp?: string
}

const STATUS_META: Record<string, { label: string; headerCls: string; dotCls: string }> = {
  'Menunggu Tindakan':{ label: 'Menunggu Tindakan Area Head', headerCls: 'border-l-amber-400',   dotCls: 'bg-amber-400' },
  'Selesai':{ label: 'Selesai Diperbaiki', headerCls: 'border-l-green-400',  dotCls: 'bg-green-400' },
  'Dimusnahkan':    { label: 'Telah Dimusnahkan (Write-off)',    headerCls: 'border-l-gray-400', dotCls: 'bg-gray-400' },
}

export default function AssetMaintenance() {
  const [tickets, setTickets] = useState<EscalationTicket[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<EscalationTicket | null>(null)
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null)
  const [zoomScale, setZoomScale] = useState(1)
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0)
  const [activeTab, setActiveTab] = useState<'Aktif' | 'Dimusnahkan' | 'Semua'>('Aktif')
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportForm, setReportForm] = useState({ 
    items: [] as { assetId: string, assetName: string, assetCode: string, isSerialized: boolean, qty: number, damagedSNs: { sn: string, issue: string }[] }[],
    notes: '', 
    photos: [] as string[] 
  })
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [isScanningBarcode, setIsScanningBarcode] = useState(false)
  const [dbAssets, setDbAssets] = useState<Array<{ id: string; name: string; assetCode: string; isSerialized: boolean; units: any[]; computedAvailableStock?: number }>>([])

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (isCameraOpen) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          streamRef.current = stream
          if (videoRef.current) {
            videoRef.current.srcObject = stream
          }
        })
        .catch(err => {
          toast.error('Gagal mengakses kamera. Pastikan izin telah diberikan.')
          setIsCameraOpen(false)
        })
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }, [isCameraOpen])

  const refreshData = () => {
    // Load aset dari DB untuk dropdown
    getAllAssetsForAdmin().then(res => {
      if (res.success && res.data) {
        setDbAssets(res.data.map(a => ({ id: a.id, name: a.name, assetCode: a.assetCode, isSerialized: a.isSerialized, units: a.units || [], computedAvailableStock: (a as any).computedAvailableStock })))
      }
    })
    // Load tiket aktif dari DB
    getActiveMaintenanceRecords().then(res => {
      if (res.success && res.data && res.data.length > 0) {
        const adapted: EscalationTicket[] = res.data.map(r => ({
          id: r.recordCode,
          dbId: r.id,
          items: r.items || [],
          issue: r.issue,
          reporter: r.reporterName,
          dateReported: r.dateReported,
          status: r.status as EscalationStatus,
          photoUrl: r.photoUrl ?? undefined,
          photos: r.photos?.map((p: any) => p.image) || [],
        }))
        setTickets(adapted)
      } else if (res.success && res.data?.length === 0) {
        setTickets([])
      }
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    refreshData()
    const interval = setInterval(refreshData, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleAction = async (newStatus: EscalationStatus | 'Selesai') => {
    if (!selectedTicket) return

    if (newStatus === 'Selesai' || newStatus === 'Dimusnahkan') {
      const resolution = newStatus === 'Selesai' ? 'Selesai Diperbaiki' : 'Dimusnahkan'
      // Simpan ke DB jika ada dbId
      if ((selectedTicket as any).dbId) {
        const res = await resolveMaintenanceRecord((selectedTicket as any).dbId, resolution)
        if (!res.success) {
          toast.error(`Gagal: ${res.error}`)
          return
        }
      }
      setTickets(prev => prev.filter(t => t.id !== selectedTicket.id))
      if (newStatus === 'Selesai') toast.success(`Laporan ${selectedTicket.id} berhasil diselesaikan. Aset dikembalikan ke stok.`)
      if (newStatus === 'Dimusnahkan') toast.success(`Aset dimusnahkan dan dipindah ke Riwayat Pemeliharaan.`)
      
      // Refetch assets
      getAllAssetsForAdmin().then(res => {
        if (res.success && res.data) {
          setDbAssets(res.data.map(a => ({ id: a.id, name: a.name, assetCode: a.assetCode, isSerialized: a.isSerialized, units: a.units || [], computedAvailableStock: (a as any).computedAvailableStock })))
        }
      })
    } else {
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status: newStatus } : t))
    }
    
    setSelectedTicket(null)
    setCurrentPhotoIdx(0)
  }

  const handleSaveReport = async () => {
    const isSerializedReport = reportForm.items.length > 0 && reportForm.items[0].isSerialized;
    if (reportForm.items.length === 0 || (!isSerializedReport && !reportForm.notes)) {
      toast.error('Pilih minimal 1 aset dan lengkapi keterangan kerusakan.')
      return
    }

    if (reportForm.photos.length === 0) {
      toast.error('Wajib mengunggah minimal 1 foto bukti kerusakan.')
      return
    }

    try {
      // Buat payload items yang valid untuk backend
      const payloadItems: any[] = reportForm.items.flatMap(item => {
        if (item.isSerialized) {
          if (item.damagedSNs.length === 0) return []
          return item.damagedSNs.map(d => ({
            assetId: item.assetId,
            assetName: item.assetName,
            assetCode: item.assetCode,
            isSerialized: true,
            serialNumber: d.sn,
            issue: d.issue || reportForm.notes
          })) as any[]
        } else {
          return [{
            assetId: item.assetId,
            assetName: item.assetName,
            assetCode: item.assetCode,
            isSerialized: false,
            qty: item.qty
          }] as any[]
        }
      })

      if (payloadItems.length === 0) {
        toast.error('Tidak ada S/N atau kuantitas yang valid untuk dilaporkan.')
        return
      }

      const res = await createMaintenanceRecord({
        issue: isSerializedReport ? 'Rusak (Lihat detail per-item)' : reportForm.notes,
        photoUrl: undefined,
        photos: reportForm.photos,
        items: payloadItems
      })
      if (!res.success) {
        toast.error(`Gagal mencatat temuan: ${res.error}`)
        return
      }

      const newTicket: EscalationTicket = {
        id: res.data?.recordCode || `ESC-${Date.now()}`,
        dbId: res.data?.id,
        items: payloadItems,
        issue: reportForm.notes,
        reporter: res.data?.reporterName || 'Admin / HSSE',
        dateReported: res.data?.dateReported || 'Hari Ini',
        status: 'Menunggu Tindakan',
        photoUrl: reportForm.photos.length > 0 ? reportForm.photos.join(',') : undefined,
        photos: reportForm.photos,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
      }
      setTickets([newTicket, ...tickets])
      setIsReportModalOpen(false)
      setReportForm({ items: [], notes: '', photos: [] })
      toast.success(`Laporan kerusakan masal berhasil dicatat.`)
      
      // Refetch assets to reflect the reduced stock in the UI
      getAllAssetsForAdmin().then(res => {
        if (res.success && res.data) {
          setDbAssets(res.data.map(a => ({ id: a.id, name: a.name, assetCode: a.assetCode, isSerialized: a.isSerialized, units: a.units || [], computedAvailableStock: (a as any).computedAvailableStock })))
        }
      })
    } catch (err) {
      console.error(err)
    }
  }

  const filteredTickets = tickets.filter(t => 
    t.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.items.some(item => item.assetName.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const countTindakan = filteredTickets.filter(t => t.status === 'Menunggu Tindakan').length

  const itemsPerPage = 5
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage)
  const paginatedTickets = filteredTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="space-y-6 font-sans relative">
      {/* ── Table / List View ───────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="p-3 sm:p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Aset Bermasalah</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Daftar laporan aset rusak yang menunggu tindak lanjut pemeliharaan.</p>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 w-full lg:w-auto mt-2 sm:mt-0">
            <div className="relative w-full lg:w-auto shrink-0">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                placeholder="Cari ID atau Nama Aset..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-red-500 outline-none w-full lg:w-64 shadow-sm transition-colors"
              />
            </div>
            <button 
              onClick={() => setIsReportModalOpen(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-bold shadow-sm hover:bg-red-700 flex justify-center items-center gap-2 whitespace-nowrap w-full lg:w-auto transition-colors"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Catat Temuan Kerusakan
            </button>
          </div>
        </div>
        <div className="lg:hidden p-2 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50/30">
          {paginatedTickets.map((t) => (
            <div key={t.id} className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 flex flex-col gap-3">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  {(() => {
                    const uniqueNames = Array.from(new Set(t.items.map(i => i.assetName)));
                    const isSingle = uniqueNames.length === 1;
                    const title = isSingle ? uniqueNames[0] : `${uniqueNames.length} Jenis Aset`;
                    
                    let subtitle = '';
                    if (!isSingle) {
                      subtitle = 'Multi-Item Report';
                    } else {
                      const isSer = t.items.length > 0 && t.items[0].isSerialized;
                      if (isSer) {
                        const sns = t.items.map(i => i.serialNumber).filter(Boolean);
                        subtitle = `S/N: ${sns.join(', ')}`;
                      } else {
                        const totalQty = t.items.reduce((acc, curr) => acc + (curr.qty || 1), 0);
                        subtitle = `Qty: ${totalQty}`;
                      }
                    }
                    return (
                      <>
                        <p className="text-sm font-bold text-gray-900">
                          {title}
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-500 font-mono mt-0.5 line-clamp-2" title={subtitle}>
                          {subtitle}
                        </p>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 rounded-lg sm:rounded-xl">
                <div>
                  <p className="text-gray-500 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider mb-0.5">ID Eskalasi</p>
                  <p className="font-bold text-gray-900 text-xs sm:text-sm font-mono">{t.id}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider mb-0.5">Dilaporkan Oleh</p>
                  <p className="font-bold text-gray-900 text-xs sm:text-sm">{t.reporter}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500">{t.dateReported}</p>
                </div>
              </div>

              <button 
                onClick={() => { setSelectedTicket(t); setCurrentPhotoIdx(0); }}
                className="w-full py-1.5 sm:py-2.5 mt-1 bg-white border border-gray-200 text-gray-700 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 sm:gap-2"
              >
                Buka Detail
              </button>
            </div>
          ))}
          {loading ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-gray-100 border-dashed">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
              <p className="text-gray-500 font-medium">Memuat data...</p>
            </div>
          ) : paginatedTickets.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-gray-100 border-dashed">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <p className="text-gray-500 font-medium">Tidak ada tiket eskalasi saat ini.</p>
            </div>
          ) : null}
        </div>

        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ID Eskalasi</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Aset Bermasalah</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Kuantitas</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Dilaporkan Oleh</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Tanggal Laporan</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      <p className="text-gray-500 font-medium">Memuat data tiket eskalasi...</p>
                    </div>
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium">
                    Tidak ada tiket eskalasi saat ini.
                  </td>
                </tr>
              ) : null}
              {paginatedTickets.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                    {t.id}
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const uniqueNames = Array.from(new Set(t.items.map(i => i.assetName)));
                      const isSingle = uniqueNames.length === 1;
                      const title = isSingle ? uniqueNames[0] : `${uniqueNames.length} Jenis Aset`;
                      
                      let subtitle = '';
                      if (!isSingle) {
                        subtitle = 'Multi-Item Report';
                      } else {
                        const isSer = t.items.length > 0 && t.items[0].isSerialized;
                        if (isSer) {
                          const sns = t.items.map(i => i.serialNumber).filter(Boolean);
                          subtitle = `S/N: ${sns.join(', ')}`;
                        } else {
                          const totalQty = t.items.reduce((acc, curr) => acc + (curr.qty || 1), 0);
                          subtitle = `Qty: ${totalQty}`;
                        }
                      }
                      return (
                        <>
                          <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {title}
                          </p>
                          <p className="text-xs text-gray-500 font-mono mt-0.5 line-clamp-2" title={subtitle}>
                            {subtitle}
                          </p>
                        </>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200">
                      {t.items.reduce((acc, curr) => acc + (curr.isSerialized ? 1 : (curr.qty || 1)), 0)} Unit
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-medium text-gray-900">{t.reporter}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-medium text-gray-900">{t.dateReported}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => { setSelectedTicket(t); setCurrentPhotoIdx(0); }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
                    >
                      Buka Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 0 && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50 flex flex-col lg:flex-row items-center justify-between shrink-0 gap-4 rounded-b-lg">
            <span className="text-xs sm:text-sm text-gray-500 font-medium text-center sm:text-left">
              Menampilkan <span className="font-bold text-gray-900">{Math.min((currentPage - 1) * itemsPerPage + 1, tickets.length)}</span> hingga <span className="font-bold text-gray-900">{Math.min(currentPage * itemsPerPage, tickets.length)}</span> dari <span className="font-bold text-gray-900">{tickets.length}</span> laporan
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
                disabled={currentPage === totalPages || tickets.length === 0}
                className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-gray-200 text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-100 bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Eskalasi Detail Modal ────────────────────────────────────────────────── */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white shadow-2xl flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh]">
            
            <div className="px-5 sm:px-6 py-4 border-b flex items-center justify-between bg-gray-50 shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Detail Laporan Kerusakan</h3>
                <p className="text-[10px] sm:text-xs text-gray-500 font-mono mt-0.5">{selectedTicket.id}</p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0 md:min-h-[400px]">
              {/* Left: Photos & Reporter (Sticky/Full height on Desktop) */}
              <div className="w-full md:w-5/12 bg-gray-900 shrink-0 relative flex flex-col">
                {(() => {
                  const photos = selectedTicket.photos?.length ? selectedTicket.photos : selectedTicket.photoUrl?.split(',') || [];
                  return photos.length > 0 ? (
                    <div className="relative w-full h-48 sm:h-56 md:h-auto md:absolute md:inset-0 flex items-center justify-center bg-black overflow-hidden group">
                      <img 
                        src={photos[currentPhotoIdx]} 
                        alt="Kerusakan" 
                        className="w-full h-full object-contain cursor-zoom-in transition-transform duration-300 group-hover:scale-105" 
                        onClick={() => setZoomedPhoto(photos[currentPhotoIdx])}
                      />
                      {photos.length > 1 && (
                        <>
                          <button onClick={() => setCurrentPhotoIdx(p => Math.max(0, p - 1))} disabled={currentPhotoIdx === 0} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/30 text-white p-1.5 sm:p-2 rounded-full backdrop-blur-sm disabled:opacity-30 transition-all">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                          </button>
                          <button onClick={() => setCurrentPhotoIdx(p => Math.min(photos.length - 1, p + 1))} disabled={currentPhotoIdx === photos.length - 1} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/30 text-white p-1.5 sm:p-2 rounded-full backdrop-blur-sm disabled:opacity-30 transition-all">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                          </button>
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold text-white tracking-widest">
                            {currentPhotoIdx + 1} / {photos.length}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="relative w-full h-48 sm:h-56 md:h-auto md:absolute md:inset-0 flex items-center justify-center text-gray-500 bg-gray-900 font-medium text-sm">
                      Tidak ada foto
                    </div>
                  );
                })()}
                
                <div className="absolute bottom-0 w-full p-3 sm:p-4 bg-gradient-to-t from-black/90 to-transparent pt-12 mt-auto z-10 pointer-events-none">
                  <p className="text-[9px] sm:text-[10px] text-gray-300 uppercase tracking-widest font-semibold mb-0.5">Dilaporkan Oleh</p>
                  <p className="text-xs sm:text-sm font-bold text-white line-clamp-1">{selectedTicket.reporter}</p>
                  <p className="text-[10px] sm:text-xs text-gray-300 mt-1 flex items-center gap-1.5 sm:gap-2">
                    {selectedTicket.dateReported}
                    {selectedTicket.timestamp && (
                      <span className="font-mono bg-white/20 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px]">{selectedTicket.timestamp}</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Right: Items Details & Actions */}
              <div className="w-full md:w-7/12 flex-1 flex flex-col bg-white overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 min-h-0 flex flex-col">
                  <h4 className="text-base sm:text-lg font-extrabold text-gray-900 leading-tight mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    {selectedTicket.items.length} Jenis Aset Dilaporkan
                  </h4>
                  
                  <div className="space-y-3 sm:space-y-4 pb-4">
                    {selectedTicket.items.map((item, idx) => (
                      <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-3 sm:p-4 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-400"></div>
                        <div className="font-bold text-gray-900 text-xs sm:text-sm md:text-base">{item.assetName}</div>
                        <div className="text-[10px] sm:text-xs text-gray-500 font-mono mt-0.5 sm:mt-1 mb-1.5 sm:mb-2">
                          {item.isSerialized ? `S/N: ${item.serialNumber || 'N/A'}` : `Qty: ${item.qty || 1}`}
                        </div>
                        <div className="text-xs sm:text-sm text-red-800 bg-red-50 p-2 sm:p-3 rounded-lg border border-red-100 font-medium">
                          <span className="text-red-900/60 uppercase text-[9px] sm:text-[10px] tracking-wider block mb-0.5 sm:mb-1 font-bold">Kendala Kerusakan:</span>
                          {item.issue || selectedTicket.issue || 'Tidak ada deskripsi'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions Grid */}
                <div className="p-4 sm:p-6 lg:p-8 pt-0 border-t border-gray-100 mt-auto shrink-0 bg-white">
                  {selectedTicket.status === 'Menunggu Tindakan' && (
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <button 
                        onClick={() => handleAction('Dimusnahkan')}
                        className="flex flex-col items-center justify-center gap-1.5 p-2 sm:p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        <span className="text-xs font-bold">Musnahkan (Write-off)</span>
                      </button>
                      <button 
                        onClick={() => handleAction('Selesai')}
                        className="flex flex-col items-center justify-center gap-1.5 p-2 sm:p-3 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        <span className="text-xs font-bold text-center leading-tight mt-1">Selesai &<br/>Kembalikan</span>
                      </button>
                    </div>
                  )}

                  {selectedTicket.status === 'Dimusnahkan' && (
                    <div className="w-full p-4 rounded-xl bg-gray-100 text-gray-500 font-medium text-sm text-center border border-gray-200">
                      Aset ini telah dihapus permanen dari sistem.
                    </div>
                  )}
                </div>
              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* ── Modal Input Temuan Kerusakan ── */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[85vh]">
            <div className="px-3 sm:px-6 py-2.5 sm:py-4 border-b border-gray-100 flex items-center justify-between bg-red-50 shrink-0">
              <h3 className="text-lg font-bold text-red-900 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Catat Temuan Kerusakan
              </h3>
              <button onClick={() => {
                setIsReportModalOpen(false)
                setReportForm({ items: [], notes: '', photos: [] })
                setIsCameraOpen(false)
                setIsScanningBarcode(false)
              }} className="text-red-700 hover:text-red-900">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-3 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto overscroll-y-contain">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pilih Aset <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value=""
                    onChange={e => {
                      const assetId = e.target.value
                      if (!assetId) return
                      const selected = dbAssets.find(a => a.id === assetId)
                      if (!selected) return
                      
                      if (reportForm.items.length > 0 && reportForm.items[0].assetId !== assetId) {
                        toast.error('Satu tiket hanya untuk 1 jenis barang. Silakan buat tiket terpisah untuk barang lainnya.', { id: 'single-asset-err' })
                        return
                      }

                      setReportForm(f => {
                        if (f.items.find(i => i.assetId === assetId)) return f; // Already in cart
                        return { 
                          ...f, 
                          items: [...f.items, { assetId, assetName: selected.name, assetCode: selected.assetCode, isSerialized: selected.isSerialized, qty: 1, damagedSNs: [] }] 
                        }
                      })
                    }}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none bg-white"
                  >
                    <option value="">-- Pilih Manual (Opsional) --</option>
                    {dbAssets.map(a => (
                      <option key={a.id} value={a.id}>{a.assetCode} — {a.name}</option>
                    ))}
                  </select>
                  <button 
                    onClick={() => setIsScanningBarcode(true)}
                    className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md border border-gray-300 transition-colors"
                    title="Scan Barcode Aset"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                  </button>
                </div>
              </div>

              {isScanningBarcode && (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-gray-700">Arahkan kamera ke Barcode/QR</span>
                    <button onClick={() => setIsScanningBarcode(false)} className="text-gray-400 hover:text-gray-600 text-sm font-medium">Batal & Tutup</button>
                  </div>
                  <InlineQRScanner
                    isOpen={isScanningBarcode}
                    onClose={() => setIsScanningBarcode(false)}
                    onScanSuccess={(text) => {
                      // 1. Cek apakah ini Kode Aset (Master)
                      const foundAsset = dbAssets.find(a => a.assetCode.toLowerCase() === text.toLowerCase())
                      if (foundAsset) {
                        if (reportForm.items.length > 0 && reportForm.items[0].assetId !== foundAsset.id) {
                          toast.error('Satu tiket hanya untuk 1 jenis barang.', { id: 'single-asset-scan' })
                          return
                        }
                        const isExist = reportForm.items.find(i => i.assetId === foundAsset.id)
                        if (!isExist) {
                          setReportForm(f => ({ ...f, items: [...f.items, { assetId: foundAsset.id, assetName: foundAsset.name, assetCode: foundAsset.assetCode, isSerialized: foundAsset.isSerialized, qty: 1, damagedSNs: [] }] }))
                          toast.success(`Aset ditambahkan: ${foundAsset.name}`, { id: 'scan-asset' })
                          if (!foundAsset.isSerialized) {
                            setIsScanningBarcode(false)
                          }
                        }
                        return
                      }

                      // 2. Cek apakah ini Serial Number (S/N)
                      let foundUnitAsset: any = null
                      for (const a of dbAssets) {
                        if (a.isSerialized && a.units.some((u:any) => u.serialNumber.toLowerCase() === text.toLowerCase())) {
                          foundUnitAsset = a
                          break
                        }
                      }

                      if (foundUnitAsset) {
                        if (reportForm.items.length > 0 && reportForm.items[0].assetId !== foundUnitAsset.id) {
                          toast.error('Satu tiket hanya untuk 1 jenis barang.', { id: 'single-asset-scan-sn' })
                          return
                        }
                        const existing = reportForm.items.find(i => i.assetId === foundUnitAsset.id)
                        if (existing && existing.damagedSNs.some(d => d.sn === text)) {
                          toast.error(`S/N ${text} sudah ditambahkan!`, { id: `dup-${text}` })
                          return
                        }
                        
                        setReportForm(f => {
                          const exist = f.items.find(i => i.assetId === foundUnitAsset.id)
                          if (exist) {
                            return { ...f, items: f.items.map(i => i.assetId === foundUnitAsset.id ? { ...i, damagedSNs: [...i.damagedSNs, { sn: text, issue: '' }] } : i) }
                          } else {
                            return { ...f, items: [...f.items, { assetId: foundUnitAsset.id, assetName: foundUnitAsset.name, assetCode: foundUnitAsset.assetCode, isSerialized: true, qty: 1, damagedSNs: [{ sn: text, issue: '' }] }] }
                          }
                        })
                        toast.success(`S/N ditambahkan: ${text}`, { id: `scan-sn-${text}` })
                      } else {
                        toast.error(`Kode ${text} tidak dikenali`, { id: 'scan-err' })
                      }
                    }} 
                  />
                  <p className="text-xs text-gray-500 text-center mt-2">Satu tiket hanya berlaku untuk satu jenis aset.</p>
                </div>
              )}

              {reportForm.items.length > 0 && (
                <div className="space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <h4 className="text-sm font-bold text-gray-700">Daftar Aset Dilaporkan:</h4>
                  {reportForm.items.map(item => (
                    <div key={item.assetId} className="bg-white border border-gray-200 rounded-lg p-3 relative">
                      <button 
                        onClick={() => setReportForm(f => ({ ...f, items: f.items.filter(i => i.assetId !== item.assetId) }))}
                        className="absolute top-3 right-3 text-red-400 hover:text-red-600"
                        title="Hapus aset dari daftar"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                      <h5 className="font-bold text-gray-900 text-sm pr-6">{item.assetName}</h5>
                      <div className="mt-2">
                        {item.isSerialized ? (
                          <div className="space-y-2">
                            <div className="flex flex-col gap-2">
                              {item.damagedSNs.map(d => (
                                <div key={d.sn} className="flex flex-col gap-1.5 bg-red-50 p-2.5 rounded-lg border border-red-100 w-full">
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold text-xs text-red-800">S/N: {d.sn}</span>
                                    <button onClick={() => setReportForm(f => ({ ...f, items: f.items.map(i => i.assetId === item.assetId ? { ...i, damagedSNs: i.damagedSNs.filter(s => s.sn !== d.sn) } : i) }))} className="text-red-500 hover:text-red-700 p-0.5">
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                  </div>
                                  <input 
                                    type="text" 
                                    placeholder="Deskripsi kerusakan khusus S/N ini..." 
                                    value={d.issue}
                                    onChange={e => setReportForm(f => ({ ...f, items: f.items.map(i => i.assetId === item.assetId ? { ...i, damagedSNs: i.damagedSNs.map(s => s.sn === d.sn ? { ...s, issue: e.target.value } : s) } : i) }))}
                                    className="w-full text-xs px-2 py-1.5 rounded border border-gray-300 focus:border-red-400 focus:ring-1 focus:ring-red-400 outline-none"
                                  />
                                </div>
                              ))}
                              {item.damagedSNs.length === 0 && (
                                <span className="text-xs text-gray-400 italic py-1">Pilih / Scan S/N di bawah.</span>
                              )}
                            </div>
                            <select
                              value=""
                              onChange={e => {
                                const val = e.target.value
                                if (val && !item.damagedSNs.some(d => d.sn === val)) {
                                  setReportForm(f => ({ ...f, items: f.items.map(i => i.assetId === item.assetId ? { ...i, damagedSNs: [...i.damagedSNs, { sn: val, issue: '' }] } : i) }))
                                }
                              }}
                              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-red-500 outline-none bg-white mt-2"
                            >
                              <option value="">-- Pilih S/N Manual (Opsional) --</option>
                              {dbAssets.find(a => a.id === item.assetId)?.units
                                ?.filter((u: any) => !item.damagedSNs.some(d => d.sn === u.serialNumber))
                                .map((u: any) => (
                                <option key={u.id} value={u.serialNumber}>{u.serialNumber}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-600">Jumlah:</span>
                            <input
                              type="number"
                              min="1"
                              max={dbAssets.find(a => a.id === item.assetId)?.computedAvailableStock || 9999}
                              value={item.qty} 
                              onChange={e => {
                                let newQty = parseInt(e.target.value) || 1
                                const maxQty = dbAssets.find(a => a.id === item.assetId)?.computedAvailableStock || 9999;
                                if (newQty > maxQty) {
                                  newQty = maxQty;
                                  toast.error(`Jumlah maksimal barang tersedia adalah ${maxQty}.`, { id: `max-qty-${item.assetId}` })
                                }
                                setReportForm(f => ({ ...f, items: f.items.map(i => i.assetId === item.assetId ? { ...i, qty: newQty } : i) }))
                              }}
                              className="w-20 border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-red-500 outline-none"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 flex justify-between items-center">
                    <span>Foto Temuan Fisik <span className="text-red-500">*</span> <span className="text-gray-400 font-normal">(Wajib, Maks. 5)</span></span>
                  </label>
                  <span className="text-xs font-bold text-gray-500">{reportForm.photos.length} / 5</span>
                </div>
                
                {reportForm.photos.length > 0 && (
                  <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                    {reportForm.photos.map((p, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-md overflow-hidden shrink-0 border border-gray-200">
                        <img src={p} className="w-full h-full object-cover" alt="Captured" />
                        <button onClick={() => setReportForm(f => ({ ...f, photos: f.photos.filter((_, idx) => idx !== i) }))} className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {reportForm.photos.length < 5 && (
                  <button onClick={() => setIsCameraOpen(true)} className="w-full flex flex-col items-center justify-center h-24 border-2 border-indigo-300 border-dashed rounded-lg cursor-pointer bg-indigo-50/50 hover:bg-indigo-50 transition-colors text-indigo-600">
                    <svg className="w-6 h-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span className="text-sm font-bold">Buka Kamera Langsung</span>
                  </button>
                )}
              </div>

              {!(reportForm.items.length > 0 && reportForm.items[0].isSerialized) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Kerusakan <span className="text-red-500">*</span></label>
                  <textarea 
                    spellCheck={false}
                    value={reportForm.notes} 
                    onChange={e => setReportForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none min-h-[80px]"
                    placeholder="Jelaskan detail temuan fisik secara spesifik..."
                  />
                </div>
              )}
            </div>
            <div className="px-3 sm:px-6 py-2.5 sm:py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2 sm:gap-3 shrink-0">
              <button onClick={() => {
                setIsReportModalOpen(false);
                setReportForm({ items: [], notes: '', photos: [] });
                setIsCameraOpen(false);
                setIsScanningBarcode(false);
              }} className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50">Batal</button>
              <button onClick={handleSaveReport} className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-40"
                disabled={reportForm.items.length === 0 || (!(reportForm.items.length > 0 && reportForm.items[0].isSerialized) && !reportForm.notes)}>
                Simpan & Eskalasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Real Camera Modal ── */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[80] flex flex-col bg-black items-center justify-center">
          <div className="relative w-full max-w-md h-full sm:h-[80vh] sm:rounded-2xl overflow-hidden bg-gray-900 flex flex-col">
            <div className="flex items-center justify-between p-4 bg-black/50 absolute top-0 w-full z-10">
              <span className="text-white font-mono text-sm">KAMERA AKTIF ({reportForm.photos.length}/5)</span>
              <button onClick={() => setIsCameraOpen(false)} className="text-white hover:text-gray-300">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-black">
              <video ref={videoRef} autoPlay playsInline className="absolute min-w-full min-h-full object-cover" />
              {/* Target bracket */}
              <div className="absolute w-48 h-48 border-2 border-white/20 z-10 flex flex-col justify-between pointer-events-none">
                <div className="w-full flex justify-between"><div className="w-4 h-4 border-t-2 border-l-2 border-white"></div><div className="w-4 h-4 border-t-2 border-r-2 border-white"></div></div>
                <div className="w-full flex justify-between"><div className="w-4 h-4 border-b-2 border-l-2 border-white"></div><div className="w-4 h-4 border-b-2 border-r-2 border-white"></div></div>
              </div>
            </div>

            <div className="h-32 bg-black flex items-center justify-between px-8 pb-4 z-10">
              <div className="w-16">
                {reportForm.photos.length > 0 && (
                  <div className="relative">
                    <img src={reportForm.photos[reportForm.photos.length - 1]} className="w-12 h-12 object-cover rounded-md border-2 border-white" alt="Last capture" />
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                      {reportForm.photos.length}
                    </span>
                  </div>
                )}
              </div>
              <button 
                onClick={() => {
                  if (reportForm.photos.length >= 5) {
                    toast.error('Maksimal 5 foto telah tercapai.');
                    return;
                  }
                  if (videoRef.current) {
                    let targetWidth = videoRef.current.videoWidth;
                    let targetHeight = videoRef.current.videoHeight;
                    const MAX_WIDTH = 800;
                    if (targetWidth > MAX_WIDTH) {
                      targetHeight = Math.floor((MAX_WIDTH / targetWidth) * targetHeight);
                      targetWidth = MAX_WIDTH;
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = targetWidth;
                    canvas.height = targetHeight;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                      ctx.drawImage(videoRef.current, 0, 0, targetWidth, targetHeight);
                      const base64 = canvas.toDataURL('image/jpeg', 0.6);
                      setReportForm(f => ({ ...f, photos: [...f.photos, base64] }));
                      toast.success(`Foto ${reportForm.photos.length + 1}/5 berhasil ditangkap!`);
                    }
                  }
                }}
                className={`w-16 h-16 rounded-full border-4 border-white transition-colors ${reportForm.photos.length >= 5 ? 'bg-gray-600' : 'bg-red-500 hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.5)]'}`}
              ></button>
              <div className="w-16 flex justify-end">
                <button onClick={() => setIsCameraOpen(false)} className="text-white font-bold text-sm bg-gray-800 px-4 py-2 rounded-full hover:bg-gray-700 transition-colors">
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Photo Lightbox ────────────────────────────────────────────────── */}
      {zoomedPhoto && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in"
          onClick={() => { setZoomedPhoto(null); setZoomScale(1); }}
        >
          {/* Controls */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 sm:gap-3 z-[70]" onClick={(e) => e.stopPropagation()}>
            <button 
              className="p-2 sm:p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all"
              onClick={() => setZoomScale(s => Math.max(1, s - 0.5))}
              title="Zoom Out"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>
            </button>
            <button 
              className="p-2 sm:p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all"
              onClick={() => setZoomScale(s => Math.min(5, s + 0.5))}
              title="Zoom In"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
            </button>
            <button 
              className="p-2 sm:p-3 text-white/70 hover:text-white bg-red-500/80 hover:bg-red-500 rounded-full transition-all ml-1 sm:ml-2"
              onClick={() => { setZoomedPhoto(null); setZoomScale(1); }}
              title="Tutup"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
            <img 
              src={zoomedPhoto} 
              alt="Zoomed" 
              className="max-w-none rounded-lg shadow-2xl transition-transform duration-200 cursor-zoom-in"
              style={{ 
                transform: `scale(${zoomScale})`, 
                transformOrigin: 'center',
                maxWidth: zoomScale > 1 ? 'none' : '100%',
                maxHeight: zoomScale > 1 ? 'none' : '90vh'
              }}
              onClick={(e) => { 
                e.stopPropagation(); 
                if (zoomScale > 1) {
                  setZoomScale(1);
                } else {
                  setZoomScale(2);
                }
              }}
              onWheel={(e) => {
                e.stopPropagation();
                if (e.deltaY < 0) setZoomScale(s => Math.min(5, s + 0.25));
                else setZoomScale(s => Math.max(1, s - 0.25));
              }}
            />
          </div>
        </div>
      )}

    </div>
  )
}
