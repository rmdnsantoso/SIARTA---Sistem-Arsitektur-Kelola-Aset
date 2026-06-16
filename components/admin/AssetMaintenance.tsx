'use client'

import React, { useState } from 'react'

type Priority = 'Tinggi' | 'Sedang' | 'Rendah'
type MaintenanceStatus = 'Dilaporkan' | 'Sedang Diservis' | 'Selesai'

interface MaintenanceTicket {
  id: string
  assetName: string
  serialNumber?: string
  issue: string
  reporter: string
  dateReported: string
  priority: Priority
  status: MaintenanceStatus
}

const initialTickets: MaintenanceTicket[] = [
  { id: 'MNT-001', assetName: 'Gas Detector MSA Altair', serialNumber: 'SN-002', issue: 'Sensor O2 error saat kalibrasi, pembacaan tidak stabil.', reporter: 'Budi (Teknisi)', dateReported: '14 Jun 2026', priority: 'Tinggi', status: 'Sedang Diservis' },
  { id: 'MNT-002', assetName: 'Bor Listrik Makita', serialNumber: 'BR-014', issue: 'Kabel power terkelupas, berbahaya bila digunakan.', reporter: 'Agus (Gudang)', dateReported: '15 Jun 2026', priority: 'Sedang', status: 'Dilaporkan' },
  { id: 'MNT-003', assetName: 'Safety Harness Full Body', issue: 'Tali utama mulai berserabut, perlu pengecekan menyeluruh.', reporter: 'Siti (Admin)', dateReported: '16 Jun 2026', priority: 'Tinggi', status: 'Dilaporkan' },
  { id: 'MNT-004', assetName: 'Proyektor Epson', serialNumber: 'PRJ-05', issue: 'Lampu proyektor mati, perlu penggantian unit.', reporter: 'Rina (Admin)', dateReported: '10 Jun 2026', priority: 'Rendah', status: 'Selesai' },
]

const PRIORITY_STYLE: Record<Priority, { badge: string; dot: string }> = {
  Tinggi:  { badge: 'bg-red-50 text-red-700 ring-1 ring-red-200',    dot: 'bg-red-500' },
  Sedang:  { badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200', dot: 'bg-amber-500' },
  Rendah:  { badge: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',      dot: 'bg-sky-500' },
}

const STATUS_META: Record<MaintenanceStatus, { label: string; headerCls: string; dotCls: string; countCls: string }> = {
  'Dilaporkan':     { label: 'Dilaporkan',     headerCls: 'border-l-red-400',   dotCls: 'bg-red-400',   countCls: 'bg-red-50 text-red-700' },
  'Sedang Diservis':{ label: 'Sedang Diservis', headerCls: 'border-l-blue-400',  dotCls: 'bg-blue-400',  countCls: 'bg-blue-50 text-blue-700' },
  'Selesai':        { label: 'Selesai',          headerCls: 'border-l-green-400', dotCls: 'bg-green-400', countCls: 'bg-green-50 text-green-700' },
}

export default function AssetMaintenance() {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>(initialTickets)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [form, setForm] = useState({ assetName: '', serialNumber: '', issue: '', priority: 'Sedang' as Priority })

  const [isScanning, setIsScanning] = useState(false)

  const handleUpdateStatus = (id: string, newStatus: MaintenanceStatus) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t))
  }

  const handleAddTicket = () => {
    if (!form.assetName || !form.issue) return
    const newId = `MNT-${String(tickets.length + 1).padStart(3, '0')}`
    setTickets([{ id: newId, ...form, reporter: 'Admin', dateReported: '16 Jun 2026', status: 'Dilaporkan' }, ...tickets])
    setForm({ assetName: '', serialNumber: '', issue: '', priority: 'Sedang' })
    setIsAddModalOpen(false)
  }

  const handleScanQR = () => {
    setIsScanning(true)
    // Simulate a 1.5s scan delay
    setTimeout(() => {
      setForm(f => ({
        ...f,
        assetName: 'Gas Detector MSA Altair 4X',
        serialNumber: 'SN-MSA-9902'
      }))
      setIsScanning(false)
    }, 1500)
  }

  const COLUMNS: MaintenanceStatus[] = ['Dilaporkan', 'Sedang Diservis', 'Selesai']
  const dilaporkan   = tickets.filter(t => t.status === 'Dilaporkan').length
  const diservis     = tickets.filter(t => t.status === 'Sedang Diservis').length
  const selesai      = tickets.filter(t => t.status === 'Selesai').length

  return (
    <div className="space-y-6 font-sans">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-1">Manajemen Aset</p>
          <h1 className="text-2xl font-bold text-gray-900">Pemeliharaan Alat</h1>
          <p className="text-sm text-gray-400 mt-0.5">Pantau progres servis dan perbaikan aset secara real-time.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Buat Tiket Servis
        </button>
      </div>

      {/* ── KPI Bar ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Dilaporkan</p>
            <p className="text-2xl font-extrabold text-red-600">{dilaporkan}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Sedang Diservis</p>
            <p className="text-2xl font-extrabold text-blue-600">{diservis}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Selesai (Bulan Ini)</p>
            <p className="text-2xl font-extrabold text-green-600">{selesai}</p>
          </div>
        </div>
      </div>

      {/* ── Kanban Board ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        {COLUMNS.map(status => {
          const meta = STATUS_META[status]
          const colTickets = tickets.filter(t => t.status === status)
          return (
            <div key={status} className="flex flex-col gap-0 rounded-2xl bg-gray-50 border border-gray-200 overflow-hidden shadow-sm">

              {/* Column Header */}
              <div className={`flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 border-l-4 ${meta.headerCls}`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${meta.dotCls}`} />
                  <h3 className="text-sm font-bold text-gray-800">{meta.label}</h3>
                </div>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${meta.countCls}`}>{colTickets.length} tiket</span>
              </div>

              {/* Cards */}
              <div className="p-3 flex flex-col gap-3 min-h-[260px]">
                {colTickets.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center py-12 text-gray-300">
                    <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    <p className="text-xs font-medium">Tidak ada tiket</p>
                  </div>
                )}
                {colTickets.map(t => {
                  const pStyle = PRIORITY_STYLE[t.priority]
                  return (
                    <div key={t.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">

                      {/* Card Top */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-mono text-gray-400 mb-1">{t.id}</p>
                          <h4 className="font-bold text-gray-900 text-sm leading-snug truncate">{t.assetName}</h4>
                          {t.serialNumber && (
                            <p className="text-[11px] text-gray-400 font-mono mt-0.5">S/N: {t.serialNumber}</p>
                          )}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${pStyle.badge}`}>
                          {t.priority}
                        </span>
                      </div>

                      {/* Issue */}
                      <div className="flex items-start gap-2">
                        <svg className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p className="text-xs text-gray-500 leading-relaxed">{t.issue}</p>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-50 text-[11px] text-gray-400">
                        <span>Dicatat oleh <span className="text-gray-600 font-medium">{t.reporter}</span></span>
                        <span>{t.dateReported}</span>
                      </div>

                      {/* Action */}
                      <div>
                        {t.status === 'Dilaporkan' && (
                          <button
                            onClick={() => handleUpdateStatus(t.id, 'Sedang Diservis')}
                            className="w-full py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
                          >
                            Mulai Proses Servis
                          </button>
                        )}
                        {t.status === 'Sedang Diservis' && (
                          <button
                            onClick={() => handleUpdateStatus(t.id, 'Selesai')}
                            className="w-full py-2 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition-colors"
                          >
                            Tandai Selesai
                          </button>
                        )}
                        {t.status === 'Selesai' && (
                          <div className="w-full py-2 rounded-lg bg-green-50 text-green-700 text-xs font-bold flex items-center justify-center gap-1.5 border border-green-100">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                            Selesai &amp; Dikembalikan
                          </div>
                        )}
                      </div>

                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Add Ticket Modal ────────────────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
            
            {/* Scan Overlay */}
            {isScanning && (
              <div className="absolute inset-0 z-10 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center">
                <div className="w-24 h-24 border-2 border-indigo-500 rounded-lg relative overflow-hidden mb-4">
                  <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,1)] animate-[scan_1.5s_ease-in-out_infinite]" />
                  <svg className="w-full h-full text-indigo-100" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h4v2H6v2H4V4zm16 0h-4v2h2v2h2V4zM4 20h4v-2H6v-2H4v4zm16 0h-4v-2h2v-2h2v4zM9 9h6v6H9V9z"/></svg>
                </div>
                <p className="text-sm font-bold text-gray-800">Memindai QR Code...</p>
                <p className="text-xs text-gray-500 mt-1">Arahkan kamera ke QR di fisik alat</p>
                <style jsx>{`
                  @keyframes scan {
                    0% { top: 0; }
                    50% { top: 100%; }
                    100% { top: 0; }
                  }
                `}</style>
              </div>
            )}

            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Buat Tiket Servis Baru</h3>
                <p className="text-xs text-gray-400 mt-0.5">Isi detail kerusakan barang yang perlu diservis.</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Scan Button Action */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-bold text-indigo-900">Scan QR Barang</p>
                  <p className="text-xs text-indigo-700/70 mt-0.5">Isi form otomatis dari QR fisik.</p>
                </div>
                <button
                  onClick={handleScanQR}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 transition shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18" /></svg>
                  Scan Sekarang
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Barang <span className="text-red-500">*</span></label>
                <input
                  type="text" value={form.assetName}
                  onChange={e => setForm(f => ({ ...f, assetName: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="Mis. Gas Detector MSA Altair"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Serial Number <span className="text-gray-400 font-normal">(Opsional)</span></label>
                <input
                  type="text" value={form.serialNumber}
                  onChange={e => setForm(f => ({ ...f, serialNumber: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition uppercase"
                  placeholder="Mis. SN-001"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Deskripsi Kerusakan <span className="text-red-500">*</span></label>
                <textarea
                  value={form.issue}
                  onChange={e => setForm(f => ({ ...f, issue: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
                  placeholder="Jelaskan kerusakan atau kendala yang dialami..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tingkat Prioritas</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Rendah', 'Sedang', 'Tinggi'] as Priority[]).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, priority: p }))}
                      className={`py-2 rounded-lg text-xs font-bold border transition-all ${form.priority === p
                        ? PRIORITY_STYLE[p].badge + ' ring-2'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Batal
              </button>
              <button
                onClick={handleAddTicket}
                disabled={!form.assetName || !form.issue}
                className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Simpan Tiket
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
