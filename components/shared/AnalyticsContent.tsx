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
import StatCard from './StatCard'

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
    <div className="w-full font-sans text-gray-900 space-y-4 sm:space-y-6">

      {/* ── 1. Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">Dashboard</p>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">Laporan &amp; Analitik</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Periode: Januari – Juni 2025</p>
        </div>
        <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-all shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Laporan
        </button>
      </div>

      {/* ── 2. KPI Row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-6">
        <StatCard label="Total Aset"        value="605" sub="+12 dari bulan lalu"  colorTheme="blue" iconPath="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        <StatCard label="Tersedia"          value="450" sub="74% dari total stok"  colorTheme="green" iconPath="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        <StatCard label="Sedang Dipinjam"   value="120" sub="20% dari total stok"  colorTheme="purple" iconPath="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        <StatCard label="Perlu Maintenance" value="35"  sub="6% perlu perhatian"   colorTheme="amber" iconPath="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </div>

      {/* ── 3. Summary ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
        <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-gray-400 mb-3 sm:mb-4">Ringkasan Periode Ini</p>
        <div className="flex flex-col gap-2.5 sm:gap-3">
          <SummaryItem color="bg-green-400" textCls="text-green-700" label="Peminjaman" text={<>Naik <strong>25%</strong> di Juni, didominasi alat safety &amp; berat.</>} />
          <SummaryItem color="bg-red-400"   textCls="text-red-700"   label="Stok Kritis" text={<><strong>Gas Detector</strong> sisa 3 unit — segera ajukan pengadaan ulang.</>} />
          <SummaryItem color="bg-blue-400"  textCls="text-blue-700"  label="Pengembalian" text={<>Rasio on-time mencapai <strong>92%</strong>, bottleneck teknisi berkurang signifikan.</>} />
        </div>
      </div>

      {/* ── 4. Main Charts Row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">

        {/* Area Chart – Tren (lebar 3/5) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-4 sm:mb-6">
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-gray-900">Tren Aktivitas</h2>
              <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">Peminjaman vs. Pengembalian per bulan</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] sm:text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500"></span>Dipinjam</span>
              <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-200"></span>Dikembalikan</span>
            </div>
          </div>
          <div className="h-[220px] sm:h-[260px]">
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
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '12px' }} />
                <Area type="monotone" dataKey="peminjaman"   name="Dipinjam"     stroke="#3b82f6" strokeWidth={2.5} fill="url(#gPinjam)" />
                <Area type="monotone" dataKey="pengembalian" name="Dikembalikan" stroke="#93c5fd" strokeWidth={2.5} fill="url(#gKembali)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart – Status (lebar 2/5) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 flex flex-col">
          <h2 className="text-sm sm:text-base font-extrabold text-gray-900 mb-0.5">Status Aset</h2>
          <p className="text-[11px] sm:text-xs text-gray-400 mb-4">Komposisi ketersediaan saat ini</p>
          <div className="flex-1 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute flex flex-col items-center pointer-events-none">
              <span className="text-xl sm:text-2xl font-extrabold text-gray-900">{totalAssets}</span>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest">Total</span>
            </div>
          </div>
          {/* Legend */}
          <div className="mt-4 space-y-1.5 sm:space-y-2">
            {statusData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs sm:text-sm">
                <span className="flex items-center gap-2 text-gray-600">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                  {d.name}
                </span>
                <span className="font-semibold text-gray-800">{d.value} <span className="text-gray-400 font-normal text-[10px] sm:text-xs">({Math.round(d.value/totalAssets*100)}%)</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 5. Bottom Row ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
        <div className="flex items-start justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-gray-900">Top 5 Barang Paling Banyak Dipinjam</h2>
            <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">Berdasarkan total transaksi semester ini</p>
          </div>
        </div>
        <div className="h-[200px] sm:h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topAssetsData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#f0f0f0" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis dataKey="name" type="category" width={95} axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 11 }} />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '12px' }}
              />
              <Bar dataKey="jumlah" name="Jumlah Pinjam" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────


function SummaryItem({ color, textCls, label, text }: { color: string; textCls: string; label: string; text: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 sm:gap-3">
      <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${color}`} />
      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
        <span className={`font-bold ${textCls}`}>{label}:</span>{' '}{text}
      </p>
    </div>
  )
}
