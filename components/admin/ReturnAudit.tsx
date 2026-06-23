'use client'

import React, { useState } from 'react'

type ReturnTicket = {
  id: string
  aset: string
  asetId: string
  peminjam: string
  tanggalKembali: string
  lokasi: string
  status: 'Belum Kembali' | 'Proses Cek' | 'Selesai'
}

type AuditLog = {
  tanggal: string
  lokasi: string
  totalPindai: number
  totalDatabase: number
  selisih: number
}

const activeLoans: ReturnTicket[] = [
  { id: 'TKT-004', aset: 'Portable O2 Analyzer', asetId: 'AST-006', peminjam: 'Dewi Rahayu', tanggalKembali: '16 Jun 2026', lokasi: 'Control Room Alpha', status: 'Belum Kembali' },
  { id: 'TKT-006', aset: 'Safety Harness Full Body', asetId: 'AST-002', peminjam: 'Agus Wirawan', tanggalKembali: '20 Jun 2026', lokasi: 'Compressor Station B', status: 'Belum Kembali' },
  { id: 'TKT-007', aset: 'Personal H2S Monitor', asetId: 'AST-007', peminjam: 'Roni Haryanto', tanggalKembali: '14 Jun 2026', lokasi: 'Rig Nusantara-12', status: 'Belum Kembali' },
]

const auditHistory: AuditLog[] = [
  { tanggal: '31 Mei 2026', lokasi: 'Gudang Utama', totalPindai: 48, totalDatabase: 48, selisih: 0 },
  { tanggal: '15 Mei 2026', lokasi: 'Rak B & C', totalPindai: 19, totalDatabase: 20, selisih: 1 },
  { tanggal: '30 Apr 2026', lokasi: 'Gudang Utama', totalPindai: 45, totalDatabase: 45, selisih: 0 },
]

type ConditionChoice = 'Baik' | 'Perlu Servis' | 'Rusak Parah'

export default function ReturnAudit() {
  const [activeTab, setActiveTab] = useState<'return' | 'audit'>('return')

  // Return state
  const [loans, setLoans] = useState<ReturnTicket[]>(activeLoans)
  const [manualId, setManualId] = useState('')
  const [checkModal, setCheckModal] = useState<ReturnTicket | null>(null)
  const [condition, setCondition] = useState<ConditionChoice>('Baik')
  const [returnNote, setReturnNote] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  // Audit state
  const [auditRunning, setAuditRunning] = useState(false)
  const [auditProgress, setAuditProgress] = useState(0)
  const [auditResult, setAuditResult] = useState<{ scanned: number; db: number; selisih: number } | null>(null)
  const [history] = useState<AuditLog[]>(auditHistory)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  const handleSearch = () => {
    const found = loans.find(l => l.asetId.toLowerCase() === manualId.trim().toLowerCase() || l.id.toLowerCase() === manualId.trim().toLowerCase())
    if (found) {
      setCheckModal(found)
    } else {
      showToast(`ID "${manualId}" tidak ditemukan dalam daftar pinjaman aktif.`)
    }
    setManualId('')
  }

  const handleConfirmReturn = () => {
    if (!checkModal) return
    setLoans(prev => prev.map(l => l.id === checkModal.id ? { ...l, status: 'Selesai' } : l))
    showToast(`✓ Tiket ${checkModal.id} ditutup. Stok ${checkModal.aset} bertambah kembali.`)
    setCheckModal(null)
    setCondition('Baik')
    setReturnNote('')
  }

  const startAudit = () => {
    setAuditRunning(true)
    setAuditProgress(0)
    setAuditResult(null)
    let p = 0
    const interval = setInterval(() => {
      p += Math.floor(Math.random() * 12) + 4
      if (p >= 100) {
        p = 100
        clearInterval(interval)
        setAuditProgress(100)
        setAuditResult({ scanned: 47, db: 48, selisih: 1 })
        setAuditRunning(false)
      }
      setAuditProgress(p)
    }, 200)
  }

  const overdueLoans = loans.filter(l => {
    const today = new Date('2026-06-15')
    const returnDate = new Date(l.tanggalKembali.replace(' ', '-').replace('Jun', '06').replace('Mei', '05'))
    return returnDate < today && l.status !== 'Selesai'
  })

  return (
    <div className="space-y-6 font-sans">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[99] px-5 py-3 bg-gray-900 text-white rounded-lg shadow-xl text-sm">
          {toast}
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('return')}
          className={`px-5 py-2 text-sm font-semibold rounded-md transition-all ${
            activeTab === 'return' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📦 Pengembalian Barang
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-5 py-2 text-sm font-semibold rounded-md transition-all ${
            activeTab === 'audit' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🔍 Audit & Stock Opname
        </button>
      </div>

      {/* ─── TAB: PENGEMBALIAN ─── */}
      {activeTab === 'return' && (
        <div className="space-y-6">
          {/* Overdue Alert */}
          {overdueLoans.length > 0 && (
            <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="p-1.5 bg-orange-100 rounded-full shrink-0">
                <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-orange-800">Terdapat {overdueLoans.length} aset melewati batas waktu pengembalian!</p>
                <p className="text-xs text-orange-700 mt-0.5">Segera hubungi peminjam untuk menjadwalkan pengembalian.</p>
              </div>
            </div>
          )}

          {/* QR Scan Panel */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Pindai QR Pengembalian</h2>
              <p className="text-sm text-gray-500">Pindai stiker QR pada alat yang dikembalikan dari lapangan, lalu lakukan pengecekan pasca-operasi.</p>
            </div>
            <div className="p-6">
              <div className="border-2 border-dashed border-gray-300 rounded-xl h-44 flex flex-col items-center justify-center bg-gray-50 mb-4">
                <svg className="w-10 h-10 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors">
                  Aktifkan Kamera Pemindai
                </button>
                <p className="mt-2 text-xs text-gray-400">atau input ID Tiket / Aset secara manual di bawah</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualId}
                  onChange={e => setManualId(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Mis. TKT-004 atau AST-006"
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-gray-800 text-white rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
                >
                  Cari
                </button>
              </div>
            </div>
          </div>

          {/* Active Loans Table */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-700">Daftar Aset Belum Kembali</h3>
              <span className="text-xs text-gray-500">{loans.filter(l => l.status !== 'Selesai').length} aset aktif</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tiket & Aset</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Peminjam</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Deadline</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loans.map(loan => (
                    <tr key={loan.id} className={`hover:bg-gray-50 ${loan.status === 'Selesai' ? 'opacity-50' : ''}`}>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-blue-600">{loan.id}</p>
                        <p className="text-sm text-gray-900">{loan.aset}</p>
                        <p className="text-xs text-gray-400 font-mono">{loan.asetId}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{loan.peminjam}</p>
                        <p className="text-xs text-gray-500">{loan.lokasi}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          overdueLoans.find(o => o.id === loan.id) ? 'text-red-600' : 'text-gray-700'
                        }`}>
                          {loan.tanggalKembali}
                          {overdueLoans.find(o => o.id === loan.id) && (
                            <span className="ml-1 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Terlambat</span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded border ${
                          loan.status === 'Selesai'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}>
                          {loan.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {loan.status !== 'Selesai' && (
                          <button
                            onClick={() => setCheckModal(loan)}
                            className="px-3 py-1.5 border border-blue-300 text-blue-700 text-sm rounded hover:bg-blue-50 font-medium transition-colors"
                          >
                            Proses Kembali
                          </button>
                        )}
                        {loan.status === 'Selesai' && (
                          <span className="text-xs text-gray-400">Tiket Ditutup</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: AUDIT ─── */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          {/* Schedule Alert */}
          <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="p-1.5 bg-yellow-100 rounded-full shrink-0">
              <svg className="w-4 h-4 text-yellow-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-yellow-800">Jadwal Stock Opname Bulan Ini</p>
              <p className="text-xs text-yellow-700">Inspeksi Gudang Utama dijadwalkan pada 30 Jun 2026 — tersisa 15 hari.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Start Audit */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Mulai Sesi Inspeksi</h2>
              <p className="text-sm text-gray-500 mb-5">Pindai seluruh QR Code aset di gudang. SIARTA akan mencocokkan hasil pindaian dengan database secara otomatis.</p>

              {!auditRunning && !auditResult && (
                <button
                  onClick={startAudit}
                  className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Mulai Sesi Stock Opname (Simulasi)
                </button>
              )}

              {auditRunning && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 font-medium">Memindai aset di gudang...</p>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-200"
                      style={{ width: `${auditProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-blue-700 font-semibold text-center">{auditProgress}% selesai</p>
                </div>
              )}

              {auditResult && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border-2 ${auditResult.selisih === 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-300'}`}>
                    <p className={`text-lg font-extrabold text-center mb-3 ${auditResult.selisih === 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {auditResult.db - auditResult.scanned > 0
                        ? `⚠️ Ditemukan ${auditResult.db - auditResult.scanned} Selisih Aset!`
                        : '✓ Semua Aset Terhitung'}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                        <p className="text-2xl font-bold text-gray-900">{auditResult.scanned}</p>
                        <p className="text-xs text-gray-500">Terpindai Fisik</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                        <p className="text-2xl font-bold text-gray-900">{auditResult.db}</p>
                        <p className="text-xs text-gray-500">Tercatat di Database</p>
                      </div>
                    </div>
                    {auditResult.db - auditResult.scanned > 0 && (
                      <p className="text-xs text-red-600 mt-3 text-center font-medium">
                        1 aset tidak terpindai. Kemungkinan terselip atau masih di lapangan tanpa tiket aktif.
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setAuditResult(null)}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200"
                  >
                    Ulangi Sesi Baru
                  </button>
                </div>
              )}
            </div>

            {/* Audit History */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Riwayat Audit</h3>
              <div className="space-y-3">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{h.lokasi}</p>
                      <p className="text-xs text-gray-500">{h.tanggal}</p>
                      <p className="text-xs text-gray-400">{h.totalPindai} dari {h.totalDatabase} terpindai</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-bold rounded-md border ${
                      h.selisih === 0
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-red-50 text-red-600 border-red-200'
                    }`}>
                      {h.selisih === 0 ? '100% Cocok' : `${h.selisih} Selisih`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Return Check Modal */}
      {checkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-blue-600 border-b">
              <h3 className="text-lg font-bold text-white">Pengecekan Pasca-Operasi</h3>
              <p className="text-sm text-white/80">Tiket: {checkModal.id}</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                <p className="text-sm font-semibold text-gray-900">{checkModal.aset}</p>
                <p className="text-xs text-gray-500">ID: <span className="font-mono">{checkModal.asetId}</span></p>
                <p className="text-xs text-gray-500">Dipinjam oleh: {checkModal.peminjam}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Kondisi Fisik Alat Saat Kembali</p>
                <div className="flex gap-2">
                  {(['Baik', 'Perlu Servis', 'Rusak Parah'] as ConditionChoice[]).map(c => (
                    <button
                      key={c}
                      onClick={() => setCondition(c)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border-2 transition-all ${
                        condition === c
                          ? c === 'Baik' ? 'bg-green-500 text-white border-green-500' :
                            c === 'Perlu Servis' ? 'bg-yellow-500 text-white border-yellow-500' :
                            'bg-red-500 text-white border-red-500'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan Pengecekan <span className="text-gray-400 font-normal">(opsional)</span>
                </label>
                <textarea
                  rows={2}
                  value={returnNote}
                  onChange={e => setReturnNote(e.target.value)}
                  placeholder="Mis. Alat kembali dalam kondisi bersih. Baterai sekitar 60%."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => { setCheckModal(null); setCondition('Baik'); setReturnNote('') }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReturn}
                className="px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded hover:bg-blue-700"
              >
                Tutup Tiket & Update Stok
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
