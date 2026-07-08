'use client'

import React, { useEffect, useState } from 'react'
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
  Legend,
  LineChart,
  Line,
} from 'recharts'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import StatCard from './StatCard'
import { getAnalyticsDashboardData, getExportData } from '../../actions/core/analytics'

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AnalyticsContent() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await getAnalyticsDashboardData()
        if (res.success && res.data) {
          setData(res.data)
        } else {
          setError(res.error || 'Gagal memuat data analitik')
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleExportCSV = async () => {
    try {
      setExporting(true)
      setShowExportMenu(false)
      const result = await getExportData()
      if (!result.success || !result.data) {
        alert(result.message || 'Gagal mengekspor data')
        return
      }

      // Format CSV
      let csvContent = "Laporan,Kategori,Kode_Aset,Nama_Barang,Total_Stok,Tersedia,Dipinjam,Kondisi_Stok\n"
      
      // Master Aset
      result.data.masterAset.forEach((a: any) => {
        csvContent += `"Master Aset","${a.Kategori}","${a.Kode_Aset}","${a.Nama_Barang}","${a.Total_Stok}","${a.Tersedia}","${a.Dipinjam}","${a.Kondisi_Stok}"\n`
      })

      csvContent += `\nLaporan,ID_Tiket,Nama_Peminjam,Nama_Barang,Tgl_Pinjam,Tgl_Kembali_Batas,Status_Akhir,Alasan_Pinjam\n`
      
      // Transaksi
      result.data.transaksi.forEach((t: any) => {
        csvContent += `"Transaksi","${t.ID_Tiket}","${t.Nama_Peminjam}","${t.Nama_Barang}","${t.Tgl_Pinjam}","${t.Tgl_Kembali_Batas}","${t.Status_Akhir}","${t.Alasan_Pinjam}"\n`
      })

      // Download trigger
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `SIARTA_Laporan_Inventaris_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error(error)
      alert("Terjadi kesalahan saat mengunduh laporan.")
    } finally {
      setExporting(false)
    }
  }

  const handleExportPDF = async () => {
    try {
      setExporting(true)
      setShowExportMenu(false)
      const result = await getExportData()
      if (!result.success || !result.data) {
        alert(result.message || 'Gagal mengekspor data')
        return
      }

      const doc = new jsPDF()

      // --- HALAMAN 1: RINGKASAN EKSEKUTIF & GRAFIK ---
      
      // Header
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("LAPORAN INVENTARIS & PEMINJAMAN BULANAN", 105, 20, { align: "center" })
      
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
      const currentMonth = `${monthNames[new Date().getMonth()]} ${new Date().getFullYear()}`
      doc.text(`Periode: ${currentMonth} | Dibuat Oleh: SIARTA (Sistem Arsitektur Kelola Aset)`, 105, 28, { align: "center" })

      doc.setLineWidth(0.5)
      doc.line(14, 32, 196, 32)

      // Section A: Ringkasan Eksekutif
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("A. Ringkasan Eksekutif", 14, 42)

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      
      // Calculate basic stats
      const totalJenis = result.data.masterAset.length
      const totalFisik = result.data.masterAset.reduce((acc: number, val: any) => acc + val.Total_Stok, 0)
      const totalTersedia = result.data.masterAset.reduce((acc: number, val: any) => acc + val.Tersedia, 0)
      const totalDipinjam = result.data.masterAset.reduce((acc: number, val: any) => acc + val.Dipinjam, 0)
      const utilization = totalFisik > 0 ? Math.round((totalDipinjam / totalFisik) * 100) : 0
      const onTimeTickets = result.data.transaksi.filter((t: any) => t.Status_Akhir === "Sesuai Jadwal").length
      const totalReturned = result.data.transaksi.filter((t: any) => t.Status_Akhir === "Sesuai Jadwal" || t.Status_Akhir.includes("Melewati Batas")).length
      const onTimeRate = totalReturned > 0 ? Math.round((onTimeTickets / totalReturned) * 100) : 0

      const summaryText = `Pada periode ${currentMonth}, sistem SIARTA memantau sebanyak ${totalJenis} jenis barang dengan total fisik mencapai ${totalFisik} unit. Dari jumlah tersebut, ${totalTersedia} unit dalam keadaan siap digunakan, sementara ${totalDipinjam} unit sedang beroperasi di lapangan. Tingkat utilisasi aset secara keseluruhan adalah ${utilization}%. Dari segi kedisiplinan pengembalian alat, tingkat kepatuhan on-time rate berada pada angka ${onTimeRate}%.`
      
      const splitSummary = doc.splitTextToSize(summaryText, 180)
      doc.text(splitSummary, 14, 50)

      let currentY = 50 + (splitSummary.length * 6) + 10

      // Section B: Visualisasi Data (Ambil Screenshot Chart)
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("B. Visualisasi Aktivitas & Status", 14, currentY)
      currentY += 10

      // Capture charts using html2canvas
      const chartTrendElement = document.getElementById("chart-trend")
      const chartStatusElement = document.getElementById("chart-status")

      if (chartTrendElement && chartStatusElement) {
        // HACK: Serialize SVG directly to avoid DOM cloning bugs with Recharts
        const getSvgDataUrl = async (container: HTMLElement): Promise<string | null> => {
          const svg = container.querySelector('svg')
          if (!svg) return null
          
          const clone = svg.cloneNode(true) as SVGSVGElement
          const rect = svg.getBoundingClientRect()
          clone.setAttribute('width', String(rect.width))
          clone.setAttribute('height', String(rect.height))
          if (!clone.getAttribute('xmlns')) clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
          
          const svgString = new XMLSerializer().serializeToString(clone)
          const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
          const url = URL.createObjectURL(blob)
          
          return new Promise((resolve) => {
            const img = new Image()
            img.onload = () => {
              const canvas = document.createElement('canvas')
              canvas.width = rect.width * 2
              canvas.height = rect.height * 2
              const ctx = canvas.getContext('2d')
              if (ctx) {
                ctx.fillStyle = '#ffffff'
                ctx.fillRect(0, 0, canvas.width, canvas.height)
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                resolve(canvas.toDataURL('image/png'))
              } else {
                resolve(null)
              }
            }
            img.onerror = () => resolve(null)
            img.src = url
          })
        }

        const imgTrend = await getSvgDataUrl(chartTrendElement)
        if (imgTrend) {
          const trendWidth = 180
          const trendHeight = 70 
          doc.addImage(imgTrend, 'PNG', 14, currentY, trendWidth, trendHeight)
          currentY += trendHeight + 15
        }
        
        if (currentY > 230) { doc.addPage(); currentY = 20; }
        
        const imgStatus = await getSvgDataUrl(chartStatusElement)
        if (imgStatus) {
          const statusWidth = 110
          const statusHeight = 60
          doc.addImage(imgStatus, 'PNG', 50, currentY, statusWidth, statusHeight)
          currentY += statusHeight + 15
        }
      }

      // --- HALAMAN 2: ANALISIS KHUSUS & LAMPIRAN ---
      doc.addPage()
      currentY = 20

      // Section C: Barang Kritis & Top Aset
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("C. Peringatan Dini Stok Kritis", 14, currentY)
      
      const barangKritis = result.data.masterAset.filter((a: any) => a.Tersedia <= 3)
      if (barangKritis.length > 0) {
        const headKritis = [['Kode', 'Nama Barang', 'Stok Total', 'Sisa Tersedia']]
        const bodyKritis = barangKritis.map((a: any) => [a.Kode_Aset, a.Nama_Barang, a.Total_Stok, a.Tersedia])
        autoTable(doc, {
          startY: currentY + 5,
          head: headKritis,
          body: bodyKritis,
          theme: 'grid',
          headStyles: { fillColor: [231, 76, 60] },
          styles: { fontSize: 9 }
        })
        currentY = (doc as any).lastAutoTable.finalY + 15
      } else {
        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        doc.text("Kondisi Sangat Aman: Tidak ada stok barang yang terdeteksi menipis atau perlu restock.", 14, currentY + 8)
        currentY += 20
      }

      // Section D: Lampiran Data Mentah (Seperti yang sebelumnya)
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("D. Lampiran: Rekapitulasi Stok Aset (Master)", 14, currentY)

      const headAset = [['Kode', 'Nama Barang', 'Kategori', 'Stok', 'Tersedia', 'Dipinjam', 'Kondisi Stok']]
      const bodyAset = result.data.masterAset.map((a: any) => [
        a.Kode_Aset, a.Nama_Barang, a.Kategori, a.Total_Stok, a.Tersedia, a.Dipinjam, a.Kondisi_Stok
      ])

      autoTable(doc, {
        startY: currentY + 5,
        head: headAset,
        body: bodyAset,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 9 },
      })

      currentY = (doc as any).lastAutoTable.finalY + 15
      
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("E. Lampiran: Aktivitas Transaksi Peminjaman", 14, currentY)

      const headTx = [['ID Tiket', 'Peminjam', 'Barang', 'Tgl Pinjam', 'Batas Kembali', 'Status Akhir', 'Alasan']]
      const bodyTx = result.data.transaksi.map((t: any) => [
        t.ID_Tiket, t.Nama_Peminjam, t.Nama_Barang, t.Tgl_Pinjam, t.Tgl_Kembali_Batas, t.Status_Akhir, t.Alasan_Pinjam
      ])

      autoTable(doc, {
        startY: currentY + 5,
        head: headTx,
        body: bodyTx,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 8 },
        columnStyles: { 6: { cellWidth: 40 } } // Limit alasan width
      })

      doc.save(`SIARTA_Laporan_Eksekutif_${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error(error)
      alert("Terjadi kesalahan saat mengunduh laporan PDF.")
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium animate-pulse">Menghimpun data analitik...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <p className="text-gray-600 font-medium">{error || 'Data tidak tersedia'}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold">Coba Lagi</button>
      </div>
    )
  }

  const { kpi, summary, trendData, statusData, topAssetsData } = data
  const totalAssets = kpi.totalAssets

  return (
    <div className="w-full font-sans text-gray-900 space-y-4 sm:space-y-6">

      {/* ── 1. Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">Laporan &amp; Analitik</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
            Data real-time &amp; ringkasan tren aktivitas sistem
          </p>
        </div>
        
        {/* Dropdown Export */}
        <div className="relative">
          <button 
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={exporting}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-all shrink-0 disabled:opacity-50 disabled:cursor-not-allowed" 
            title="Download Laporan"
          >
            <svg className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 ${exporting ? 'animate-bounce' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {exporting ? 'Menyiapkan Data...' : 'Export Laporan'}
            <svg className="w-4 h-4 ml-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showExportMenu && !exporting && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)}></div>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                <button 
                  onClick={handleExportPDF}
                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Export as PDF
                </button>
                <button 
                  onClick={handleExportCSV}
                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Export as CSV
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── 2. KPI Row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-6">
        <StatCard label="Jenis Aset"        value={kpi.totalJenisAset.toString()} sub={`${kpi.totalAssets} total unit fisik`}  colorTheme="blue" iconPath="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        <StatCard label="Tersedia"          value={kpi.available.toString()}   sub={`${totalAssets > 0 ? Math.round((kpi.available/totalAssets)*100) : 0}% dari total fisik`}  colorTheme="green" iconPath="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        <StatCard label="Sedang Dipinjam"   value={kpi.borrowed.toString()}    sub={`${totalAssets > 0 ? Math.round((kpi.borrowed/totalAssets)*100) : 0}% dari total fisik`}  colorTheme="purple" iconPath="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        <StatCard label="Perlu Maintenance" value={kpi.maintenance.toString()} sub={`${totalAssets > 0 ? Math.round((kpi.maintenance/totalAssets)*100) : 0}% perlu perhatian`}   colorTheme="amber" iconPath="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </div>

      {/* ── 3. Summary ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
        <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-gray-400 mb-3 sm:mb-4">Ringkasan Periode Ini</p>
        <div className="flex flex-col gap-2.5 sm:gap-3">
          <SummaryItem 
            color={summary.peminjamanTrend === 'Naik' ? 'bg-green-400' : summary.peminjamanTrend === 'Turun' ? 'bg-amber-400' : 'bg-blue-400'} 
            textCls={summary.peminjamanTrend === 'Naik' ? 'text-green-700' : summary.peminjamanTrend === 'Turun' ? 'text-amber-700' : 'text-blue-700'} 
            label="Peminjaman" 
            text={<>{summary.peminjamanTrend} <strong>{summary.peminjamanValue}%</strong> dibandingkan bulan lalu.</>} 
          />
          <SummaryItem 
            color={summary.stokKritisItems.length > 0 ? 'bg-red-400' : 'bg-green-400'}   
            textCls={summary.stokKritisItems.length > 0 ? 'text-red-700' : 'text-green-700'}   
            label="Stok Kritis" 
            text={<>
              {summary.stokKritisItems.length > 0 
                ? <><strong>{summary.stokKritisItems.join(', ')}</strong> menipis (sisa $\le$ 3 unit) — pertimbangkan restock.</>
                : <>Stok dalam keadaan aman, tidak ada barang menipis.</>
              }
            </>} 
          />
          <SummaryItem 
            color={summary.onTimeRate >= 80 ? 'bg-blue-400' : 'bg-amber-400'}  
            textCls={summary.onTimeRate >= 80 ? 'text-blue-700' : 'text-amber-700'}  
            label="Pengembalian" 
            text={<>Rasio on-time mencapai <strong>{summary.onTimeRate}%</strong> dari total tiket yang dikembalikan.</>} 
          />
        </div>
      </div>

      {/* ── 4. Main Charts Row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">

        {/* Trend Chart (Line) */}
        <div id="chart-trend" className="lg:col-span-3 bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-gray-900">Tren Aktivitas</h2>
              <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">Peminjaman vs. Pengembalian 6 bulan terakhir</p>
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
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '12px' }} />
                <Area isAnimationActive={false} type="monotone" dataKey="peminjaman"   name="Dipinjam"     stroke="#3b82f6" strokeWidth={2.5} fill="url(#gPinjam)" />
                <Area isAnimationActive={false} type="monotone" dataKey="pengembalian" name="Dikembalikan" stroke="#93c5fd" strokeWidth={2.5} fill="url(#gKembali)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart – Status (lebar 2/5) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 flex flex-col">
          <h2 className="text-sm sm:text-base font-extrabold text-gray-900 mb-0.5">Status Aset</h2>
          <p className="text-[11px] sm:text-xs text-gray-400 mb-4">Komposisi ketersediaan saat ini</p>
          <div className="flex-1 relative flex items-center justify-center">
            {totalAssets === 0 ? (
               <div className="text-gray-400 text-sm font-medium">Belum ada aset terdaftar</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie isAnimationActive={false} data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                    {statusData.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
            {/* Center label */}
            {totalAssets > 0 && (
              <div className="absolute flex flex-col items-center pointer-events-none">
                <span className="text-xl sm:text-2xl font-extrabold text-gray-900">{totalAssets}</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest">Total</span>
              </div>
            )}
          </div>
          {/* Legend */}
          <div className="mt-4 space-y-1.5 sm:space-y-2">
            {statusData.map((d: any) => (
              <div key={d.name} className="flex items-center justify-between text-xs sm:text-sm">
                <span className="flex items-center gap-2 text-gray-600">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                  {d.name}
                </span>
                <span className="font-semibold text-gray-800">{d.value} <span className="text-gray-400 font-normal text-[10px] sm:text-xs">({totalAssets > 0 ? Math.round(d.value/totalAssets*100) : 0}%)</span></span>
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
            <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">Berdasarkan total peminjaman sepanjang masa</p>
          </div>
        </div>
        <div className="h-[200px] sm:h-[220px]">
          {topAssetsData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-400 text-sm font-medium">Belum ada data peminjaman</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topAssetsData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#f0f0f0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={110} axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '12px' }}
                />
                <Bar isAnimationActive={false} dataKey="jumlah" name="Jumlah Pinjam" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          )}
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
