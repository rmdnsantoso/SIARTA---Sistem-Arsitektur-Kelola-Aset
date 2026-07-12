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
  LabelList,
} from 'recharts'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import StatCard from './StatCard'
import { getAnalyticsDashboardData, getExportData } from '../../actions/core/analytics'
import { AlertTriangle, TrendingUp, TrendingDown, Tag, Clock, CalendarDays, CheckCircle2, Activity } from 'lucide-react'

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
      // Add BOM for Excel UTF-8 support
      let csvContent = "\uFEFF";
      
      const escapeCsvField = (field: any) => {
        if (field === null || field === undefined) return '""';
        let str = String(field);
        // Prevent formula injection
        if (/^[=+\-@]/.test(str)) {
          str = "'" + str;
        }
        // Escape double quotes
        str = str.replace(/"/g, '""');
        return `"${str}"`;
      };

      // Calculate KPI
      const totalJenis = result.data.masterAset.length
      const totalFisik = result.data.masterAset.reduce((acc: number, val: any) => acc + val.Total_Stok, 0)
      const totalTersedia = result.data.masterAset.reduce((acc: number, val: any) => acc + val.Tersedia, 0)
      const totalDipinjam = result.data.masterAset.reduce((acc: number, val: any) => acc + val.Dipinjam, 0)
      
      csvContent += "=== RINGKASAN KPI ===\n"
      csvContent += `Total Jenis Barang,${escapeCsvField(totalJenis)}\n`
      csvContent += `Total Fisik Aset,${escapeCsvField(totalFisik)}\n`
      csvContent += `Total Tersedia,${escapeCsvField(totalTersedia)}\n`
      csvContent += `Total Sedang Dipinjam,${escapeCsvField(totalDipinjam)}\n\n`
      
      // Master Aset
      csvContent += "=== DATA MASTER ASET ===\n"
      csvContent += "Kategori,Kode_Aset,Nama_Barang,Total_Stok,Tersedia,Dipinjam,Kondisi_Stok\n"
      result.data.masterAset.forEach((a: any) => {
        csvContent += `${escapeCsvField(a.Kategori)},${escapeCsvField(a.Kode_Aset)},${escapeCsvField(a.Nama_Barang)},${escapeCsvField(a.Total_Stok)},${escapeCsvField(a.Tersedia)},${escapeCsvField(a.Dipinjam)},${escapeCsvField(a.Kondisi_Stok)}\n`
      })
      csvContent += "\n"

      // Transaksi
      csvContent += "=== RIWAYAT TRANSAKSI (30 HARI TERAKHIR) ===\n"
      csvContent += `ID_Tiket,Nama_Peminjam,Nama_Barang,Tgl_Pinjam,Tgl_Kembali_Batas,Status_Akhir,Alasan_Pinjam\n`
      
      result.data.transaksi.forEach((t: any) => {
        csvContent += `${escapeCsvField(t.ID_Tiket)},${escapeCsvField(t.Nama_Peminjam)},${escapeCsvField(t.Nama_Barang)},${escapeCsvField(t.Tgl_Pinjam)},${escapeCsvField(t.Tgl_Kembali_Batas)},${escapeCsvField(t.Status_Akhir)},${escapeCsvField(t.Alasan_Pinjam)}\n`
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
      
      const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
      const currentMonth = `${monthNames[new Date().getMonth()]} ${new Date().getFullYear()}`

      // --- HALAMAN SAMPUL (COVER PAGE) ---
      doc.setFontSize(24)
      doc.setFont("helvetica", "bold")
      doc.text("LAPORAN INVENTARIS", 105, 120, { align: "center" })
      doc.setFontSize(20)
      doc.text("& PEMINJAMAN BULANAN", 105, 132, { align: "center" })
      
      doc.setFontSize(14)
      doc.setFont("helvetica", "normal")
      doc.text("SIARTA - Sistem Arsitektur Kelola Aset", 105, 145, { align: "center" })
      
      doc.setFontSize(12)
      doc.text(`Periode Laporan: ${currentMonth}`, 105, 160, { align: "center" })
      
      doc.setFontSize(10)
      doc.setTextColor(120)
      doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 105, 270, { align: "center" })
      doc.setTextColor(0)
      
      doc.addPage()
      
      // --- DAFTAR ISI ---
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text("DAFTAR ISI", 105, 30, { align: "center" })
      
      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      const tocItems = [
        { title: "A. Ringkasan Eksekutif", page: "3" },
        { title: "B. Visualisasi Aktivitas & Status", page: "3" },
        { title: "C. Tren Aset Paling Sering Dipinjam", page: "4" },
        { title: "D. Data Master Aset & Kondisi Stok", page: "5" },
        { title: "E. Riwayat Transaksi Peminjaman", page: "5" },
        { title: "F. Top 5 Peminjam Paling Aktif", page: "6" },
        { title: "G. Peringatan Dini Stok Kritis", page: "6" }
      ]
      
      let tocY = 50
      tocItems.forEach(item => {
        doc.text(item.title, 20, tocY)
        doc.text(item.page, 185, tocY, { align: "right" })
        // Dotted line
        const dotCount = Math.floor((175 - doc.getTextWidth(item.title) - 20) / 2)
        let dots = ""
        for(let i = 0; i < dotCount; i++) dots += "."
        doc.text(dots, 25 + doc.getTextWidth(item.title), tocY)
        tocY += 10
      })
      
      doc.addPage()

      // --- HALAMAN 3: RINGKASAN EKSEKUTIF & GRAFIK ---
      
      // Header
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("LAPORAN INVENTARIS & PEMINJAMAN BULANAN", 105, 20, { align: "center" })
      
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
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
      const totalFisik = result.data.masterAset.reduce((acc, val) => acc + val.Total_Stok, 0)
      const totalTersedia = result.data.masterAset.reduce((acc, val) => acc + val.Tersedia, 0)
      const totalDipinjam = result.data.masterAset.reduce((acc, val) => acc + val.Dipinjam, 0)
      const onTimeTickets = result.data.transaksi.filter((t) => t.Status_Akhir === "Sesuai Jadwal").length
      const totalReturned = result.data.transaksi.filter((t) => t.Status_Akhir === "Sesuai Jadwal" || t.Status_Akhir.includes("Melewati Batas")).length
      const onTimeRate = totalReturned > 0 ? Math.round((onTimeTickets / totalReturned) * 100) : 0

      // Hapus penyebutan Tingkat Utilisasi sesuai permintaan
      const summaryText = `Pada periode ${currentMonth}, sistem SIARTA memantau sebanyak ${totalJenis} jenis barang dengan total fisik mencapai ${totalFisik} unit. Dari jumlah tersebut, ${totalTersedia} unit dalam keadaan siap digunakan, sementara ${totalDipinjam} unit sedang beroperasi di lapangan. Dari segi kedisiplinan pengembalian alat, tingkat kepatuhan on-time rate berada pada angka ${onTimeRate}%.`
      
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
      const chartTopAssetsElement = document.getElementById("chart-top-assets-print")

      // HACK: Serialize SVG directly to avoid DOM cloning bugs with Recharts
      const getSvgDataUrl = async (container: HTMLElement) => {
        const svg = container.querySelector('svg')
        if (!svg) return null
        
        const clone = svg.cloneNode(true) as SVGElement
        const rect = svg.getBoundingClientRect()
        const aspectRatio = rect.width / rect.height
        
        clone.setAttribute('width', String(rect.width))
        clone.setAttribute('height', String(rect.height))
        if (!clone.getAttribute('xmlns')) clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
        
        const svgString = new XMLSerializer().serializeToString(clone)
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        
        return new Promise<{url: string, ratio: number} | null>((resolve) => {
          const img = new Image()
          img.onload = () => {
            const canvas = document.createElement('canvas')
            // Skala capture dinaikkan jadi *3 untuk cetak tajam
            canvas.width = rect.width * 3
            canvas.height = rect.height * 3
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.fillStyle = '#ffffff'
              ctx.fillRect(0, 0, canvas.width, canvas.height)
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
              resolve({ url: canvas.toDataURL('image/png'), ratio: aspectRatio })
            } else {
              resolve(null)
            }
          }
          img.onerror = () => resolve(null)
          img.src = url
        })
      }

      if (chartTrendElement) {
        const trendDataUrl = await getSvgDataUrl(chartTrendElement)
        if (trendDataUrl) {
          // Trend legend
          doc.setFontSize(9)
          doc.setFillColor(59, 130, 246)
          doc.rect(14, currentY - 3, 4, 4, 'F')
          doc.text("Dipinjam", 20, currentY)
          doc.setFillColor(147, 197, 253)
          doc.rect(55, currentY - 3, 4, 4, 'F')
          doc.text("Dikembalikan", 61, currentY)
          currentY += 8

          const trendWidth = 180
          const trendHeight = trendWidth / trendDataUrl.ratio
          doc.addImage(trendDataUrl.url, 'PNG', 14, currentY, trendWidth, trendHeight)
          currentY += trendHeight + 15
        }
      }
      
      if (currentY > 230) { doc.addPage(); currentY = 20; }
      
      if (chartStatusElement) {
        const statusDataUrl = await getSvgDataUrl(chartStatusElement)
        if (statusDataUrl) {
          const statusWidth = 140
          const statusHeight = statusWidth / statusDataUrl.ratio
          doc.addImage(statusDataUrl.url, 'PNG', 35, currentY, statusWidth, statusHeight)
          
          // Angka total di tengah donut
          doc.setFontSize(11)
          doc.setFont("helvetica", "bold")
          doc.text(`${totalFisik}`, 35 + statusWidth / 2, currentY + statusHeight / 2 - 2, { align: "center" })
          doc.setFontSize(8)
          doc.setFont("helvetica", "normal")
          doc.text("TOTAL", 35 + statusWidth / 2, currentY + statusHeight / 2 + 3, { align: "center" })

          currentY += statusHeight + 8

          // Legend dengan swatch warna + angka + persentase
          const pctTersedia = totalFisik > 0 ? Math.round((totalTersedia / totalFisik) * 100) : 0
          const pctDipinjam = totalFisik > 0 ? Math.round((totalDipinjam / totalFisik) * 100) : 0
          const legendItems = [
            { color: [16, 185, 129], label: `Tersedia: ${totalTersedia} unit (${pctTersedia}%)` },
            { color: [59, 130, 246], label: `Dipinjam: ${totalDipinjam} unit (${pctDipinjam}%)` },
          ]
          let legendY = currentY
          legendItems.forEach(item => {
            doc.setFillColor(item.color[0], item.color[1], item.color[2])
            doc.rect(14, legendY - 3, 4, 4, 'F')
            doc.setFontSize(9)
            doc.setTextColor(0)
            doc.text(item.label, 20, legendY)
            legendY += 6
          })
          currentY = legendY + 10
          
          // Paragraf Penjelasan Section B
          doc.setFontSize(9)
          doc.setFont("helvetica", "italic")
          doc.setTextColor(100)
          const vizDesc = `Grafik tren di atas memperlihatkan dinamika peminjaman dan pengembalian unit selama 6 bulan terakhir, sementara diagram status menunjukkan proporsi ${pctTersedia}% aset dalam kondisi tersedia dan ${pctDipinjam}% sedang dipinjam. Data ini membantu tim memantau kecukupan stok secara real-time.`
          const splitVizDesc = doc.splitTextToSize(vizDesc, 180)
          doc.text(splitVizDesc, 14, currentY)
          currentY += (splitVizDesc.length * 5) + 10
          doc.setTextColor(0)
        }
      }

      if (chartTopAssetsElement) {
        const topAssetsDataUrl = await getSvgDataUrl(chartTopAssetsElement)
        if (topAssetsDataUrl) {
           doc.addPage(); currentY = 20;
           doc.setFontSize(12)
           doc.setFont("helvetica", "bold")
           doc.text("C. Tren Aset Paling Sering Dipinjam", 14, currentY)
           const topAssetsWidth = 180
           const topAssetsHeight = topAssetsWidth / topAssetsDataUrl.ratio
           doc.addImage(topAssetsDataUrl.url, 'PNG', 14, currentY + 10, topAssetsWidth, topAssetsHeight)
           currentY += topAssetsHeight + 15
           
           doc.setFontSize(9)
           doc.setFont("helvetica", "italic")
           doc.setTextColor(100)
           const topAssetsDesc = "Grafik di atas menampilkan barang dengan rasio peminjaman tertinggi terhadap total stoknya selama periode terpilih, membantu mengidentifikasi aset yang paling diminati dan berpotensi butuh penambahan unit."
           const splitTopAssetsDesc = doc.splitTextToSize(topAssetsDesc, 180)
           doc.text(splitTopAssetsDesc, 14, currentY + 10)
           currentY += (splitTopAssetsDesc.length * 5) + 15
           doc.setTextColor(0)
        }
      }

      // --- HALAMAN TABEL DATA ---
      doc.addPage(); currentY = 20;

      // Section D: Master Aset
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("D. Data Master Aset & Kondisi Stok", 14, currentY)

      const headAset = [['Kode', 'Nama Barang', 'Kategori', 'Stok', 'Tersedia', 'Dipinjam', 'Kondisi Stok']]
      const bodyAset = result.data.masterAset.map((a) => [
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

      currentY = (doc as any).lastAutoTable.finalY + 8
      
      doc.setFontSize(9)
      doc.setFont("helvetica", "italic")
      doc.setTextColor(100)
      const asetDesc = "Tabel ini menunjukkan rincian seluruh inventaris yang diawasi oleh sistem, mencakup pembagian status (tersedia vs. dipinjam) untuk evaluasi kecukupan fisik barang."
      const splitAsetDesc = doc.splitTextToSize(asetDesc, 180)
      doc.text(splitAsetDesc, 14, currentY)
      currentY += (splitAsetDesc.length * 5) + 10
      doc.setTextColor(0)

      if (currentY > 230) { doc.addPage(); currentY = 20; }
      
      // Section E: Riwayat Transaksi
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("E. Riwayat Transaksi Peminjaman", 14, currentY)

      const headTx = [['ID Tiket', 'Peminjam', 'Barang', 'Tgl Pinjam', 'Batas Kembali', 'Status Akhir', 'Alasan']]
      const bodyTx = result.data.transaksi.map((t) => [
        t.ID_Tiket, t.Nama_Peminjam, t.Nama_Barang, t.Tgl_Pinjam, t.Tgl_Kembali_Batas, t.Status_Akhir, t.Alasan_Pinjam
      ])

      autoTable(doc, {
        startY: currentY + 5,
        head: headTx,
        body: bodyTx,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 8 },
        columnStyles: { 6: { cellWidth: 40 } } 
      })

      currentY = (doc as any).lastAutoTable.finalY + 8
      
      doc.setFontSize(9)
      doc.setFont("helvetica", "italic")
      doc.setTextColor(100)
      const txDesc = "Perekaman 30 hari terakhir dari aktivitas keluar-masuk barang, mencakup informasi jadwal pengembalian untuk memonitor tingkat kepatuhan pengguna."
      const splitTxDesc = doc.splitTextToSize(txDesc, 180)
      doc.text(splitTxDesc, 14, currentY)
      currentY += (splitTxDesc.length * 5) + 10
      doc.setTextColor(0)

      // --- HALAMAN ANALISIS KHUSUS ---
      if (currentY > 180) { doc.addPage(); currentY = 20; }

      // Section F: Top 5 Peminjam
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("F. Top 5 Peminjam Paling Aktif", 14, currentY)
      
      const borrowerCounts: Record<string, number> = {}
      result.data.transaksi.forEach((t) => {
        const name = t.Nama_Peminjam
        if (name) {
          borrowerCounts[name] = (borrowerCounts[name] || 0) + 1
        }
      })
      
      const topBorrowers = Object.entries(borrowerCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      if (topBorrowers.length > 0) {
        const headBorrower = [['Peringkat', 'Nama Peminjam', 'Total Transaksi']]
        const bodyBorrower = topBorrowers.map((b, idx) => [idx + 1, b.name, b.count])
        
        autoTable(doc, {
          startY: currentY + 5,
          head: headBorrower,
          body: bodyBorrower,
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246] },
          styles: { fontSize: 9 },
        })
        currentY = (doc as any).lastAutoTable.finalY + 8
      } else {
        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        doc.text("Belum ada data transaksi peminjaman.", 14, currentY + 8)
        currentY += 20
      }

      doc.setFontSize(9)
      doc.setFont("helvetica", "italic")
      doc.setTextColor(100)
      const borrowerDesc = "Tabel di atas menampilkan 5 individu dengan frekuensi peminjaman aset tertinggi selama periode terpilih. Data ini dapat digunakan untuk mengidentifikasi departemen atau personel yang paling bergantung pada inventaris perusahaan, sehingga alokasi aset ke depannya dapat lebih tepat sasaran."
      const splitBorrowerDesc = doc.splitTextToSize(borrowerDesc, 180)
      doc.text(splitBorrowerDesc, 14, currentY)
      currentY += (splitBorrowerDesc.length * 5) + 15
      doc.setTextColor(0)

      if (currentY > 230) { doc.addPage(); currentY = 20; }

      // Section G: Barang Kritis
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("G. Peringatan Dini Stok Kritis", 14, currentY)
      
      const barangKritis = result.data.masterAset.filter((a) => a.Tersedia <= 3)
      if (barangKritis.length > 0) {
        const headKritis = [['Kode', 'Nama Barang', 'Stok Total', 'Sisa Tersedia']]
        const bodyKritis = barangKritis.map((a) => [a.Kode_Aset, a.Nama_Barang, a.Total_Stok, a.Tersedia])
        autoTable(doc, {
          startY: currentY + 5,
          head: headKritis,
          body: bodyKritis,
          theme: 'grid',
          headStyles: { fillColor: [231, 76, 60] },
          styles: { fontSize: 9 }
        })
        currentY = (doc as any).lastAutoTable.finalY + 8
        
        doc.setFontSize(9)
        doc.setFont("helvetica", "italic")
        doc.setTextColor(100)
        const kritisDesc = "Peringatan: Barang-barang di atas memiliki stok sisa 3 unit atau kurang. Direkomendasikan untuk segera melakukan restock agar operasional tidak terhambat."
        const splitKritisDesc = doc.splitTextToSize(kritisDesc, 180)
        doc.text(splitKritisDesc, 14, currentY)
        currentY += (splitKritisDesc.length * 5) + 10
        doc.setTextColor(0)

      } else {
        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        doc.text("Kondisi Sangat Aman: Tidak ada stok barang yang terdeteksi menipis atau perlu restock.", 14, currentY + 8)
        currentY += 20
      }

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
          {summary?.critical && summary.critical.map((item: any, i: number) => (
            <SummaryItem 
              key={`crit-${i}`}
              item={{ category: 'stokKritis', label: item.label, text: item.text }}
            />
          ))}
          
          {summary?.rotating && summary.rotating.length > 0 && (
            <RotatingSummary items={summary.rotating} />
          )}
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
        <div id="chart-status" className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 flex flex-col">
          <h2 className="text-sm sm:text-base font-extrabold text-gray-900 mb-0.5">Status Aset</h2>
          <p className="text-[11px] sm:text-xs text-gray-400 mb-4">Komposisi ketersediaan saat ini</p>
          <div className="flex-1 relative flex items-center justify-center">
            {totalAssets === 0 ? (
               <div className="text-gray-400 text-sm font-medium">Belum ada aset terdaftar</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie 
                    isAnimationActive={false} 
                    data={statusData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60} 
                    outerRadius={85} 
                    paddingAngle={4} 
                    dataKey="value"
                    labelLine={{ strokeWidth: 1 }}
                    label={renderPieLabel}
                  >
                    {statusData.map((entry: any, i: number) => <Cell key={i} fill={entry.fill} />)}
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
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.fill }} />
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
        <div className="h-[240px] sm:h-[280px]">
          {topAssetsData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-400 text-sm font-medium">Belum ada data peminjaman</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topAssetsData} layout="vertical" margin={{ top: 0, right: 35, left: 0, bottom: 0 }}>
                <CartesianGrid horizontal={false} vertical={true} stroke="#e5e7eb" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 11 }} allowDecimals={false} domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={110} axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '12px' }}
                />
                <Bar isAnimationActive={false} dataKey="jumlah" name="Rasio Pinjam (%)" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={16}>
                  <LabelList dataKey="jumlah" position="right" fill="#6b7280" fontSize={11} fontWeight={600} formatter={(val: any) => `${val}%`} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Versi khusus untuk export PDF - disembunyikan dari user, tidak responsive */}
        {topAssetsData.length > 0 && (
          <div 
            id="chart-top-assets-print" 
            style={{ position: 'fixed', left: '-9999px', top: 0, width: '900px', height: '500px', background: '#fff', padding: '24px' }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topAssetsData} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                <CartesianGrid horizontal={false} vertical={true} stroke="#e5e7eb" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 11 }} allowDecimals={false} domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={110} axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 11 }} />
                <Bar isAnimationActive={false} dataKey="jumlah" name="Rasio Pinjam (%)" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={24}>
                  <LabelList dataKey="jumlah" position="right" fill="#6b7280" fontSize={11} fontWeight={600} formatter={(val: any) => `${val}%`} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────


const insightStyles = (category: string, trend?: string) => {
  switch (category) {
    case 'stokKritis': return { color: 'bg-red-400', textCls: 'text-red-600', icon: AlertTriangle };
    case 'peminjaman': return { 
      color: trend === 'Naik' ? 'bg-green-400' : trend === 'Turun' ? 'bg-amber-400' : 'bg-blue-400', 
      textCls: trend === 'Naik' ? 'text-green-600' : trend === 'Turun' ? 'text-amber-600' : 'text-blue-600',
      icon: trend === 'Turun' ? TrendingDown : TrendingUp
    };
    case 'kategoriPopuler': return { color: 'bg-indigo-400', textCls: 'text-indigo-600', icon: Tag };
    case 'durasiRata': return { color: 'bg-teal-400', textCls: 'text-teal-600', icon: Clock };
    case 'hariTersibuk': return { color: 'bg-amber-400', textCls: 'text-amber-600', icon: CalendarDays };
    case 'approvalRate': return { color: 'bg-slate-400', textCls: 'text-slate-600', icon: CheckCircle2 };
    default: return { color: 'bg-blue-400', textCls: 'text-blue-600', icon: Activity };
  }
}

function SummaryItem({ item }: { item: any }) {
  const { category, trend, label, text } = item
  const style = insightStyles(category || 'peminjaman', trend)
  const Icon = style.icon
  
  return (
    <div className="flex items-start gap-2.5 sm:gap-3">
      <span className={`mt-0.5 shrink-0 ${style.textCls}`}>
        <Icon className="w-4 h-4" strokeWidth={2.5} />
      </span>
      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
        <span className={`font-bold ${style.textCls}`}>{label}:</span>{' '}{text}
      </p>
    </div>
  )
}

function RotatingSummary({ items }: { items: any[] }) {
  const [current, setCurrent] = useState(0)
  const [outgoing, setOutgoing] = useState<number | null>(null)
  const [isHovered, setIsHovered] = useState(false)
  
  const goTo = (next: number) => {
    if (next === current) return
    setOutgoing(current)
    setCurrent(next)
  }
  
  useEffect(() => {
    if (!items || items.length <= 1) return
    if (isHovered) return // paused
    
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return
  
    let interval: ReturnType<typeof setInterval> | null = null
    const start = () => {
      if (interval) return
      interval = setInterval(() => {
        setOutgoing(current)
        setCurrent(c => (c + 1) % items.length)
      }, 5000)
    }
    const stop = () => { if (interval) clearInterval(interval); interval = null }
  
    const handleVisibility = () => document.hidden ? stop() : start()
  
    start()
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [items, isHovered, current])

  if (!items || items.length === 0) return null

  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (prefersReducedMotion) {
    return (
      <div className="flex flex-col gap-2.5 sm:gap-3">
        {items.map((item, i) => (
          <SummaryItem key={i} item={item} />
        ))}
      </div>
    )
  }

  return (
    <div 
      className="flex flex-col gap-1.5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-[66px] sm:h-[48px]" aria-live="polite">
        {outgoing !== null && (
          <div
            key={`out-${outgoing}`}
            className="absolute inset-0"
            style={{ animation: 'insight-out 350ms ease-in forwards' }}
            onAnimationEnd={() => setOutgoing(null)}
          >
            <SummaryItem item={items[outgoing]} />
          </div>
        )}
        <div 
          key={`in-${current}`} 
          className="absolute inset-0"
          style={{ animation: 'insight-in 350ms ease-out forwards' }}
        >
          <SummaryItem item={items[current]} />
        </div>
      </div>
      
      {items.length > 1 && (
        <div className="flex gap-1.5 mt-1 ml-6 sm:ml-7 relative z-10">
          {items.map((item, i) => {
            const style = insightStyles(item.category, item.trend)
            return (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === current ? style.color : 'bg-gray-200'}`}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

const renderPieLabel = (props: any) => {
  const { x, y, cx, cy, fill, percent, textAnchor } = props;
  if (percent === 0) return null; // Don't show 0% labels
  
  return (
    <text 
      x={x} 
      y={y} 
      fill={fill} 
      textAnchor={textAnchor} 
      dominantBaseline="central" 
      fontSize={13}
      fontWeight={500}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}
