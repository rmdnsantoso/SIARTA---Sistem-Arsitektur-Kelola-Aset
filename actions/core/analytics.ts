'use server'

import { prisma } from '../../lib/prisma'
import { Role } from '../../app/generated/prisma'
import { requireRole } from '../../lib/auth'

export async function getAnalyticsDashboardData(startDate?: string, endDate?: string) {
  try {
    // Memerlukan otorisasi dari Role yang tepat
    await requireRole([Role.Admin, Role.HSSE, Role.AreaHead])

    const dateFilter = startDate && endDate ? {
      gte: new Date(startDate + "T00:00:00Z"),
      lte: new Date(endDate + "T23:59:59Z")
    } : undefined;
    const ticketsWhere = dateFilter ? { createdAt: dateFilter } : {};

    // ──────────────────────────────────────────────
    // 1. Ambil Semua Data Master & Tiket Aktif
    // ──────────────────────────────────────────────
    const assets = await prisma.asset.findMany({ include: { units: true } })
    const activeTickets = await prisma.ticket.findMany({
      where: { overallStatus: { in: ['Menunggu', 'Disetujui', 'Dipinjam'] } }
    })
    
    // KPI Counters
    let availableCount = 0;
    let borrowedCount = 0;
    let maintenanceCount = 0;
    let totalAssetsCount = 0;
    
    // Ambil data maintenance yang sedang aktif untuk menghitung maint non-serialized
    const activeMaintenanceRecords = await prisma.maintenanceRecord.findMany({
      where: { status: 'Menunggu Tindakan' },
      include: { items: true }
    });

    let criticalAssets: string[] = [];
    let serializedBorrowed = 0;
    let nonSerializedBorrowed = 0;

    assets.forEach(asset => {
      let total = 0, avail = 0, borrowed = 0, maint = 0;
      
      if (asset.isSerialized) {
        total = asset.units.length;
        avail = asset.units.filter(u => u.status === 'Tersedia').length;
        borrowed = asset.units.filter(u => u.status === 'Dipinjam').length;
        maint = asset.units.filter(u => u.status === 'Maintenance').length;
      } else {
        const currentlyBorrowed = activeTickets.filter(t => t.assetId === asset.id).reduce((sum, t) => sum + t.jumlah, 0);
        const currentlyMaint = activeMaintenanceRecords.flatMap(r => r.items).filter(i => i.assetId === asset.id && !i.isSerialized).reduce((sum, i) => sum + i.qty, 0);
        avail = asset.quantity;
        borrowed = currentlyBorrowed;
        maint = currentlyMaint;
        total = avail + borrowed + maint;
      }
      
      totalAssetsCount += total;
      availableCount += avail;
      borrowedCount += borrowed;
      maintenanceCount += maint;
      
      if (asset.isSerialized) {
        serializedBorrowed += borrowed;
      } else {
        nonSerializedBorrowed += borrowed;
      }

      // Jika stok total > 0 tapi yang tersedia tinggal 3 atau kurang, masukkan ke kategori kritis
      if (total > 0 && avail <= 3) {
        criticalAssets.push(asset.name);
      }
    })

    let topType = { name: '-', borrowed: 0 };
    if (serializedBorrowed > nonSerializedBorrowed) {
      topType = { name: 'Serialized (Satuan)', borrowed: serializedBorrowed };
    } else if (nonSerializedBorrowed > serializedBorrowed) {
      topType = { name: 'Non-Serialized (Bulk)', borrowed: nonSerializedBorrowed };
    } else if (serializedBorrowed > 0) {
      topType = { name: 'Seimbang', borrowed: serializedBorrowed };
    }

    // ──────────────────────────────────────────────
    // 2. Perhitungan Summary (Tren, Stok, On-Time)
    // ──────────────────────────────────────────────
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    const currentMonthTickets = await prisma.ticket.count({
      where: { createdAt: { gte: currentMonthStart } }
    });
    
    const lastMonthTickets = await prisma.ticket.count({
      where: {
        createdAt: {
          gte: lastMonthStart,
          lt: currentMonthStart
        }
      }
    });
    
    let peminjamanTrend = "Sama";
    let peminjamanValue = 0;
    
    if (lastMonthTickets === 0) {
      if (currentMonthTickets > 0) {
         peminjamanTrend = "Naik";
         peminjamanValue = 100;
      }
    } else {
      const diff = currentMonthTickets - lastMonthTickets;
      peminjamanValue = Math.round(Math.abs(diff) / lastMonthTickets * 100);
      peminjamanTrend = diff >= 0 ? "Naik" : "Turun";
    }

    // Kalkulasi Rasio On-Time Pengembalian
    const returnedTickets = await prisma.ticket.findMany({
      where: { overallStatus: 'Dikembalikan' },
      select: { updatedAt: true, tanggalKembali: true }
    });
    
    let onTimeCount = 0;
    returnedTickets.forEach(t => {
      // updatedAt merupakan kapan tiket di-set menjadi Dikembalikan.
      // tanggalKembali formatnya "YYYY-MM-DD"
      const returnedDate = new Date(t.updatedAt);
      const expectedDate = new Date(t.tanggalKembali + "T23:59:59Z"); // Batas waktu di akhir hari H
      if (returnedDate <= expectedDate) {
        onTimeCount++;
      }
    });
    const onTimeRate = returnedTickets.length > 0 ? Math.round((onTimeCount / returnedTickets.length) * 100) : 100;

    // ──────────────────────────────────────────────
    // 3. Area Chart - Tren 6 Bulan Terakhir
    // ──────────────────────────────────────────────
    const trendData = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    
    const allRecentTickets = await prisma.ticket.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, overallStatus: true }
    });
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStr = monthNames[d.getMonth()];
      
      const ticketsInMonth = allRecentTickets.filter(t => {
        const tDate = new Date(t.createdAt);
        return tDate.getMonth() === d.getMonth() && tDate.getFullYear() === d.getFullYear();
      });
      
      const pinjam = ticketsInMonth.length;
      const kembali = ticketsInMonth.filter(t => t.overallStatus === 'Dikembalikan').length;
      
      trendData.push({ month: mStr, peminjaman: pinjam, pengembalian: kembali });
    }

    // ──────────────────────────────────────────────
    // 4. Bar Chart - Top 5 Aset Paling Banyak Dipinjam
    // ──────────────────────────────────────────────
    const groupedTickets = await prisma.ticket.groupBy({
      by: ['assetId'],
      where: ticketsWhere,
      _sum: { jumlah: true }
    });

    const assetIds = groupedTickets.map(g => g.assetId);
    const topAssetsRecords = await prisma.asset.findMany({
      where: { id: { in: assetIds } },
      select: { id: true, name: true, quantity: true, isSerialized: true, units: { select: { id: true } } }
    });
    const assetMap = new Map(topAssetsRecords.map(a => [a.id, a]));

    let topAssetsRatio = groupedTickets.map(g => {
      const a = assetMap.get(g.assetId);
      let stock = 1;
      
      if (a) {
        if (a.isSerialized) {
          stock = a.units.length;
        } else {
          const currentlyBorrowed = activeTickets.filter(t => t.assetId === a.id).reduce((sum, t) => sum + t.jumlah, 0);
          const currentlyMaint = activeMaintenanceRecords.flatMap(r => r.items).filter(i => i.assetId === a.id && !i.isSerialized).reduce((sum, i) => sum + (i.qty || 1), 0);
          stock = a.quantity + currentlyBorrowed + currentlyMaint;
        }
      }
      
      const borrowed = g._sum.jumlah || 0;
      let ratio = stock > 0 ? (borrowed / stock) * 100 : 0;
      if (ratio > 100) ratio = 100; // Cap ratio maksimal 100%
      return { 
        name: a?.name || 'Aset Dihapus', 
        jumlah: parseFloat(ratio.toFixed(1)) // Using percentage ratio
      };
    });

    topAssetsRatio.sort((a, b) => b.jumlah - a.jumlah);
    const topAssetsData = topAssetsRatio.slice(0, 5);

    // ──────────────────────────────────────────────
    // 5. User Breakdown (Removed Top Users & Overdue)
    // ──────────────────────────────────────────────
    const filteredTicketsForUsers = await prisma.ticket.findMany({
      where: ticketsWhere,
      include: { peminjam: { select: { name: true } }, asset: { select: { name: true } } }
    });

    return {
      success: true,
      data: {
        kpi: {
          totalJenisAset: assets.length,
          totalAssets: totalAssetsCount,
          available: availableCount,
          borrowed: borrowedCount,
          maintenance: maintenanceCount
        },
        summary: {
          critical: criticalAssets.slice(0, 3).map(assetName => ({
            icon: 'alert-circle',
            label: 'Stok Kritis',
            text: `${assetName} menipis (sisa ≤ 3 unit) — pertimbangkan restock.`
          })),
          rotating: [
            { 
              category: 'peminjaman', 
              trend: peminjamanTrend,
              label: 'Peminjaman', 
              text: `${currentMonthTickets} transaksi bulan ini, ${peminjamanTrend === 'Naik' ? 'naik' : peminjamanTrend === 'Turun' ? 'turun' : 'tetap'} dari ${lastMonthTickets} transaksi bulan lalu (${peminjamanTrend === 'Naik' ? '+' : peminjamanTrend === 'Turun' ? '-' : ''}${peminjamanValue}%).` 
            },
            { 
              category: 'approvalRate', 
              label: 'Pengembalian', 
              text: returnedTickets.length > 0 ? `Rasio on-time mencapai ${onTimeRate}% (${onTimeCount} dari total ${returnedTickets.length} tiket dikembalikan).` : `Belum ada data pengembalian tiket.` 
            },
            { 
              category: 'kategoriPopuler', 
              label: 'Tipe Aset Terpopuler', 
              text: topType.borrowed > 0 ? `Tipe aset ${topType.name} mendominasi ${Math.round((topType.borrowed / (borrowedCount > 0 ? borrowedCount : 1)) * 100)}% dari seluruh peminjaman bulan ini (${topType.borrowed} barang).` : `Belum ada data peminjaman aset.` 
            },
            { 
              category: 'durasiRata', 
              label: 'Utilisasi Aset', 
              text: `${borrowedCount} dari total ${totalAssetsCount} stok inventaris sedang aktif digunakan (${totalAssetsCount > 0 ? Math.round((borrowedCount / totalAssetsCount) * 100) : 0}% utilisasi).` 
            }
          ]
        },
        trendData,
        statusData: [
          { name: 'Tersedia', value: availableCount, fill: '#10b981' },
          { name: 'Dipinjam', value: borrowedCount, fill: '#3b82f6' },
          { name: 'Maintenance', value: maintenanceCount, fill: '#f59e0b' }
        ],
        topAssetsData,
        criticalAssets,
      }
    }
  } catch (err: any) {
    console.error("Error in getAnalyticsDashboardData:", err);
    return { success: false, error: err.message }
  }
}

export async function getExportData(startDate?: string, endDate?: string) {
  await requireRole([Role.Admin, Role.HSSE, Role.AreaHead]);

  try {
    const dateFilter = startDate && endDate ? {
      gte: new Date(startDate + "T00:00:00Z"),
      lte: new Date(endDate + "T23:59:59Z")
    } : undefined;
    const ticketsWhere = dateFilter ? { createdAt: dateFilter } : {};

    // 1. Get Assets Data
    const assets = await prisma.asset.findMany({
      where: { isActive: true },
      include: { units: true }
    });

    // Fetch active tickets and maintenance to calculate non-serialized stock properly
    const activeTickets = await prisma.ticket.findMany({
      where: { overallStatus: { in: ['Menunggu', 'Disetujui', 'Dipinjam'] } }
    });
    
    const activeMaintenanceRecords = await prisma.maintenanceRecord.findMany({
      where: { status: 'Menunggu Tindakan' },
      include: { items: true }
    });

    const masterAset = assets.map(asset => {
      let total = 0, tersedia = 0, dipinjam = 0, maintenance = 0;
      
      if (asset.isSerialized) {
        total = asset.units.length;
        tersedia = asset.units.filter(u => u.status === 'Tersedia').length;
        dipinjam = asset.units.filter(u => u.status === 'Dipinjam').length;
        maintenance = asset.units.filter(u => u.status === 'Maintenance').length;
      } else {
        const currentlyBorrowed = activeTickets.filter(t => t.assetId === asset.id).reduce((sum, t) => sum + t.jumlah, 0);
        const currentlyMaint = activeMaintenanceRecords.flatMap(r => r.items).filter(i => i.assetId === asset.id && !i.isSerialized).reduce((sum, i) => sum + i.qty, 0);
        
        tersedia = asset.quantity; // in db, quantity tracks available units for non-serialized
        dipinjam = currentlyBorrowed;
        maintenance = currentlyMaint;
        total = tersedia + dipinjam + maintenance;
      }
      
      const kondisiStok = tersedia <= 3 ? 'Stok Barang Sedikit' : 'Stok Tersedia';

      return {
        Kategori: asset.category,
        Kode_Aset: asset.assetCode,
        Nama_Barang: asset.name,
        Total_Stok: total,
        Tersedia: tersedia,
        Dipinjam: dipinjam,
        Maintenance: maintenance,
        Kondisi_Stok: kondisiStok
      };
    });

    // 2. Get Tickets Data
    const tickets = await prisma.ticket.findMany({
      where: ticketsWhere,
      include: {
        peminjam: { select: { name: true } },
        asset: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const transaksi = tickets.map(t => {
      let statusAkhir = t.overallStatus.toString();
      if (t.overallStatus === 'Dikembalikan') {
        const pinjamTgl = new Date(t.tanggalPinjam);
        const batasTgl = new Date(t.tanggalKembali);
        const actualTgl = t.updatedAt; // Assuming updatedAt is when it was returned
        if (actualTgl <= batasTgl) {
          statusAkhir = "Sesuai Jadwal";
        } else {
          statusAkhir = "Melewati Batas Waktu";
        }
      } else if (t.overallStatus === 'Dipinjam') {
        statusAkhir = "Belum Dikembalikan";
      }

      return {
        ID_Tiket: t.ticketCode,
        Nama_Peminjam: t.peminjam.name,
        Nama_Barang: t.asset.name,
        Tgl_Pinjam: t.tanggalPinjam,
        Tgl_Kembali_Batas: t.tanggalKembali,
        Status_Akhir: statusAkhir,
        Alasan_Pinjam: t.alasan
      };
    });

    return {
      success: true,
      data: { masterAset, transaksi }
    };
  } catch (error) {
    console.error("Error fetching export data:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal mengambil data untuk export"
    };
  }
}
