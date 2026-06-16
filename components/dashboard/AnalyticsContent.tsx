'use client'

import React from 'react'
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'

// ─── Data ─────────────────────────────────────────────────────────────────────

const trendData = [
  { month: 'Jan', peminjaman: 45, pengembalian: 30 },
  { month: 'Feb', peminjaman: 52, pengembalian: 48 },
  { month: 'Mar', peminjaman: 38, pengembalian: 40 },
  { month: 'Apr', peminjaman: 65, pengembalian: 55 },
  { month: 'Mei', peminjaman: 48, pengembalian: 50 },
  { month: 'Jun', peminjaman: 75, pengembalian: 60 },
]

const statusData = [
  { name: 'Tersedia',    value: 450, color: '#22c55e' },
  { name: 'Dipinjam',   value: 120, color: '#3b82f6' },
  { name: 'Maintenance',value: 35,  color: '#f59e0b' },
]

const topAssetsData = [
  { name: 'Gas Detector',    jumlah: 85 },
  { name: 'Safety Harness',  jumlah: 72 },
  { name: 'Laptop',          jumlah: 64 },
  { name: 'Proyektor',       jumlah: 45 },
  { name: 'Bor Listrik',     jumlah: 38 },
]

const totalAssets = statusData.reduce((s, d) => s + d.value, 0)

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AnalyticsContent() {
  return (
    <div className="w-full font-sans text-gray-900 space-y-6">

      {/* ── 1. Page Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-500 mb-1">Dashboard</p>
          <h1 className="text-2xl font-bold text-gray-900">Laporan &amp; Analitik</h1>
          <p className="text-sm text-gray-400 mt-0.5">Periode: Januari – Juni 2025</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Laporan
        </button>
      </div>

      {/* ── 2. KPI Row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Aset"        value="605" sub="+12 dari bulan lalu"  accent="text-blue-600"  dot="bg-blue-500" />
        <KpiCard label="Tersedia"          value="450" sub="74% dari total stok"  accent="text-green-600" dot="bg-green-500" />
        <KpiCard label="Sedang Dipinjam"   value="120" sub="20% dari total stok"  accent="text-indigo-600" dot="bg-indigo-500" />
        <KpiCard label="Perlu Maintenance" value="35"  sub="6% perlu perhatian"   accent="text-amber-600" dot="bg-amber-500" />
      </div>

      {/* ── 3. Summary ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-4">Ringkasan Periode Ini</p>
        <div className="flex flex-col gap-3">
          <SummaryItem color="bg-green-400" textCls="text-green-700" label="Peminjaman" text={<>Naik <strong>25%</strong> di Juni, didominasi alat safety &amp; berat.</>} />
          <SummaryItem color="bg-red-400"   textCls="text-red-700"   label="Stok Kritis" text={<><strong>Gas Detector</strong> sisa 3 unit — segera ajukan pengadaan ulang.</>} />
          <SummaryItem color="bg-blue-400"  textCls="text-blue-700"  label="Pengembalian" text={<>Rasio on-time mencapai <strong>92%</strong>, bottleneck teknisi berkurang signifikan.</>} />
        </div>
      </div>

      {/* ── 4. Main Charts Row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Area Chart – Tren (lebar 3/5) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Tren Aktivitas</h2>
              <p className="text-xs text-gray-400 mt-0.5">Peminjaman vs. Pengembalian per bulan</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500"></span>Dipinjam</span>
              <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-200"></span>Dikembalikan</span>
            </div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gPinjam" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gKembali" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#93c5fd" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#93c5fd" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '13px' }} />
                <Area type="monotone" dataKey="peminjaman"   name="Dipinjam"     stroke="#3b82f6" strokeWidth={2.5} fill="url(#gPinjam)" />
                <Area type="monotone" dataKey="pengembalian" name="Dikembalikan" stroke="#93c5fd" strokeWidth={2.5} fill="url(#gKembali)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart – Status (lebar 2/5) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <h2 className="text-base font-semibold text-gray-900 mb-0.5">Status Aset</h2>
          <p className="text-xs text-gray-400 mb-4">Komposisi ketersediaan saat ini</p>
          <div className="flex-1 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '13px' }} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute flex flex-col items-center pointer-events-none">
              <span className="text-2xl font-bold text-gray-900">{totalAssets}</span>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest">Total</span>
            </div>
          </div>
          {/* Legend */}
          <div className="mt-4 space-y-2">
            {statusData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-600">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                  {d.name}
                </span>
                <span className="font-semibold text-gray-800">{d.value} <span className="text-gray-400 font-normal text-xs">({Math.round(d.value/totalAssets*100)}%)</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 5. Bottom Row ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Top 5 Barang Paling Banyak Dipinjam</h2>
            <p className="text-xs text-gray-400 mt-0.5">Berdasarkan total transaksi semester ini</p>
          </div>
        </div>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topAssetsData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#f0f0f0" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis dataKey="name" type="category" width={110} axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 13 }} />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '13px' }}
              />
              <Bar dataKey="jumlah" name="Jumlah Pinjam" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, accent, dot }: { label: string; value: string; sub: string; accent: string; dot: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:-translate-y-0.5 transition-transform duration-200">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${dot}`} />
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-3xl font-extrabold leading-none ${accent}`}>{value}</p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  )
}

function SummaryItem({ color, textCls, label, text }: { color: string; textCls: string; label: string; text: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${color}`} />
      <p className="text-sm text-gray-600 leading-relaxed">
        <span className={`font-bold ${textCls}`}>{label}:</span>{' '}{text}
      </p>
    </div>
  )
}
