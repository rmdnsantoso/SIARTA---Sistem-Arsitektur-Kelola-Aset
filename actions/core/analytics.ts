'use server'

import { prisma } from '../../lib/prisma'
import { Role } from '../../app/generated/prisma'
import { requireRole } from '../../lib/auth'

export async function getAnalyticsDashboardData() {
  try {
    // Memerlukan otorisasi dari Role yang tepat
    await requireRole([Role.Admin, Role.HSSE, Role.AreaHead])

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
      
      // Jika stok total > 0 tapi yang tersedia tinggal 3 atau kurang, masukkan ke kategori kritis
      if (total > 0 && avail <= 3) {
        criticalAssets.push(asset.name);
      }
    })

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
      _sum: { jumlah: true },
      orderBy: { _sum: { jumlah: 'desc' } },
      take: 5
    });
    
    const topAssetsData = await Promise.all(groupedTickets.map(async (g) => {
      const a = await prisma.asset.findUnique({ where: { id: g.assetId }, select: { name: true } });
      return { name: a?.name || 'Aset Dihapus', jumlah: g._sum.jumlah || 0 };
    }));

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
          peminjamanTrend,
          peminjamanValue,
          stokKritisItems: criticalAssets.slice(0, 3), // Maksimal tampil 3 barang
          onTimeRate,
          pendingTickets: await prisma.ticket.count({ where: { overallStatus: 'Menunggu' } }),
          activeMaintenance: await prisma.maintenanceRecord.count({ where: { status: { notIn: ['Selesai Diperbaiki', 'Dimusnahkan'] } } }),
          utilizationRate: totalAssetsCount > 0 ? Math.round((borrowedCount / totalAssetsCount) * 100) : 0
        },
        trendData,
        statusData: [
          { name: 'Tersedia',    value: availableCount, color: '#22c55e' },
          { name: 'Dipinjam',   value: borrowedCount, color: '#3b82f6' },
          { name: 'Maintenance',value: maintenanceCount,  color: '#f59e0b' },
        ],
        topAssetsData
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getExportData() {
  await requireRole([Role.Admin, Role.HSSE, Role.AreaHead]);

  try {
    // 1. Get Assets Data
    const assets = await prisma.asset.findMany({
      where: { isActive: true },
      include: { units: true }
    });

    const masterAset = assets.map(asset => {
      const total = asset.isSerialized ? asset.units.length : asset.quantity;
      const tersedia = asset.isSerialized 
        ? asset.units.filter(u => u.status === 'Tersedia').length 
        : (asset.status === 'Available' ? asset.quantity : 0);
      const dipinjam = asset.isSerialized 
        ? asset.units.filter(u => u.status === 'Dipinjam').length 
        : (asset.status === 'Borrowed' ? asset.quantity : 0);
      
      const kondisiStok = tersedia <= 3 ? 'Stok Barang Sedikit' : 'Stok Tersedia';

      return {
        Kategori: asset.category,
        Kode_Aset: asset.assetCode,
        Nama_Barang: asset.name,
        Total_Stok: total,
        Tersedia: tersedia,
        Dipinjam: dipinjam,
        Kondisi_Stok: kondisiStok
      };
    });

    // 2. Get Tickets Data
    const tickets = await prisma.ticket.findMany({
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
