'use server'

import { prisma } from '../../lib/prisma'
import { Role } from '../../app/generated/prisma'
import { requireRole } from '../../lib/auth'

export async function getAnalyticsDashboardData(startDate?: string, endDate?: string) {
  try {
    await requireRole([Role.Admin, Role.HSSE, Role.AreaHead])

    const dateFilter = startDate && endDate ? {
      gte: new Date(startDate + "T00:00:00Z"),
      lte: new Date(endDate + "T23:59:59Z")
    } : undefined;
    const ticketsWhere = dateFilter ? { createdAt: dateFilter } : {};

    const now = new Date();
    // Gunakan periodStart dan periodEnd dari filter (atau bulan berjalan sebagai default)
    const periodStart = startDate ? new Date(startDate + "T00:00:00Z") : new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = endDate ? new Date(endDate + "T23:59:59Z") : now;

    const diffTime = periodEnd.getTime() - periodStart.getTime();
    const lastPeriodStart = new Date(periodStart.getTime() - diffTime - 1);
    const lastPeriodEnd = new Date(periodStart.getTime() - 1);

    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // ──────────────────────────────────────────────
    // 1. Eksekusi Query Paralel
    // ──────────────────────────────────────────────
    const [
      assets, 
      activeTickets, 
      activeMaintenanceRecords, 
      currentPeriodTickets, 
      lastPeriodTickets, 
      returnedTickets, 
      allRecentTickets
    ] = await Promise.all([
      // assets: hanya yang aktif
      prisma.asset.findMany({ where: { isActive: true }, include: { units: true } }),
      // active tickets (all time) untuk stok fisik
      prisma.ticket.findMany({ where: { overallStatus: { in: ['Menunggu', 'Disetujui', 'Dipinjam'] } } }),
      // active maintenance
      prisma.maintenanceRecord.findMany({ where: { status: 'Menunggu Tindakan' }, include: { items: true } }),
      // trend tickets
      prisma.ticket.count({ where: ticketsWhere }), 
      prisma.ticket.count({
        where: { createdAt: { gte: lastPeriodStart, lte: lastPeriodEnd } }
      }),
      // returned tickets (berdasarkan rentang filter)
      prisma.ticket.findMany({
        where: { overallStatus: 'Dikembalikan', ...ticketsWhere },
        select: { updatedAt: true, tanggalKembali: true }
      }),
      // recent tickets untuk area chart 6 bulan absolut
      prisma.ticket.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true, overallStatus: true }
      })
    ]);

    // ──────────────────────────────────────────────
    // 2. Precompute Map untuk Optimasi O(1) Lookup
    // ──────────────────────────────────────────────
    const ticketsByAsset = new Map<string, number>();
    activeTickets.forEach(t => {
      ticketsByAsset.set(t.assetId, (ticketsByAsset.get(t.assetId) || 0) + t.jumlah);
    });

    const maintByAsset = new Map<string, number>();
    activeMaintenanceRecords.forEach(r => {
      r.items.forEach(i => {
        if (!i.isSerialized) {
          maintByAsset.set(i.assetId, (maintByAsset.get(i.assetId) || 0) + (i.qty || 1));
        }
      });
    });

    // ──────────────────────────────────────────────
    // 3. Kalkulasi Stok dan KPI
    // ──────────────────────────────────────────────
    let availableCount = 0;
    let borrowedCount = 0;
    let maintenanceCount = 0;
    let totalAssetsCount = 0;
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
        const currentlyBorrowed = ticketsByAsset.get(asset.id) || 0;
        const currentlyMaint = maintByAsset.get(asset.id) || 0;
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

      if (total > 0 && avail <= 3) {
        criticalAssets.push(asset.name);
      }
    });

    let topType = { name: '-', borrowed: 0 };
    if (serializedBorrowed > nonSerializedBorrowed) {
      topType = { name: 'Serialized (Satuan)', borrowed: serializedBorrowed };
    } else if (nonSerializedBorrowed > serializedBorrowed) {
      topType = { name: 'Non-Serialized (Bulk)', borrowed: nonSerializedBorrowed };
    } else if (serializedBorrowed > 0) {
      topType = { name: 'Seimbang', borrowed: serializedBorrowed };
    }

    // ──────────────────────────────────────────────
    // 4. Kalkulasi Trend & On-Time Rate
    // ──────────────────────────────────────────────
    let peminjamanTrend = "Sama";
    let peminjamanValue = 0;
    
    if (lastPeriodTickets === 0) {
      if (currentPeriodTickets > 0) {
         peminjamanTrend = "Naik";
         peminjamanValue = 100;
      }
    } else {
      const diff = currentPeriodTickets - lastPeriodTickets;
      peminjamanValue = Math.round(Math.abs(diff) / lastPeriodTickets * 100);
      peminjamanTrend = diff >= 0 ? "Naik" : "Turun";
    }

    let onTimeCount = 0;
    returnedTickets.forEach(t => {
      const returnedDate = new Date(t.updatedAt);
      const expectedDate = new Date(t.tanggalKembali + "T23:59:59Z");
      if (returnedDate <= expectedDate) {
        onTimeCount++;
      }
    });
    const onTimeRate = returnedTickets.length > 0 ? Math.round((onTimeCount / returnedTickets.length) * 100) : 100;

    // ──────────────────────────────────────────────
    // 5. Area Chart - Tren 6 Bulan Absolut
    // ──────────────────────────────────────────────
    const trendData = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    
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
    // 6. Bar Chart - Top 5 Aset (Berdasarkan Rentang)
    // ──────────────────────────────────────────────
    const groupedTickets = await prisma.ticket.groupBy({
      by: ['assetId'],
      where: ticketsWhere,
      _sum: { jumlah: true }
    });

    const assetMap = new Map(assets.map(a => [a.id, a]));

    let topAssetsRatio = groupedTickets.map(g => {
      const a = assetMap.get(g.assetId);
      let stock = 1;
      
      if (a) {
        if (a.isSerialized) {
          stock = a.units.length;
        } else {
          const currentlyBorrowed = ticketsByAsset.get(a.id) || 0;
          const currentlyMaint = maintByAsset.get(a.id) || 0;
          stock = a.quantity + currentlyBorrowed + currentlyMaint;
        }
      }
      
      const borrowed = g._sum.jumlah || 0;
      let ratio = stock > 0 ? (borrowed / stock) * 100 : 0;
      if (ratio > 100) ratio = 100;
      return { 
        name: a?.name || 'Aset Dihapus', 
        jumlah: parseFloat(ratio.toFixed(1)) 
      };
    });

    topAssetsRatio.sort((a, b) => b.jumlah - a.jumlah);
    const topAssetsData = topAssetsRatio.slice(0, 5);

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
              text: `${currentPeriodTickets} transaksi pada periode ini, ${peminjamanTrend === 'Naik' ? 'naik' : peminjamanTrend === 'Turun' ? 'turun' : 'tetap'} dari ${lastPeriodTickets} transaksi periode sebelumnya (${peminjamanTrend === 'Naik' ? '+' : peminjamanTrend === 'Turun' ? '-' : ''}${peminjamanValue}%).` 
            },
            { 
              category: 'approvalRate', 
              label: 'Pengembalian', 
              text: returnedTickets.length > 0 ? `Rasio on-time mencapai ${onTimeRate}% (${onTimeCount} dari total ${returnedTickets.length} tiket dikembalikan pada periode ini).` : `Belum ada data pengembalian tiket pada periode ini.` 
            },
            { 
              category: 'kategoriPopuler', 
              label: 'Tipe Aset Terpopuler', 
              text: topType.borrowed > 0 ? `Tipe aset ${topType.name} mendominasi peminjaman.` : `Belum ada data peminjaman aset.` 
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

    const [assets, activeTickets, activeMaintenanceRecords, tickets] = await Promise.all([
      // 1. Get Assets Data
      prisma.asset.findMany({ where: { isActive: true }, include: { units: true } }),
      // Fetch active tickets and maintenance to calculate non-serialized stock properly
      prisma.ticket.findMany({ where: { overallStatus: { in: ['Menunggu', 'Disetujui', 'Dipinjam'] } } }),
      prisma.maintenanceRecord.findMany({ where: { status: 'Menunggu Tindakan' }, include: { items: true } }),
      // 2. Get Tickets Data
      prisma.ticket.findMany({
        where: ticketsWhere,
        include: {
          peminjam: { select: { name: true } },
          asset: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const ticketsByAsset = new Map<string, number>();
    activeTickets.forEach(t => {
      ticketsByAsset.set(t.assetId, (ticketsByAsset.get(t.assetId) || 0) + t.jumlah);
    });

    const maintByAsset = new Map<string, number>();
    activeMaintenanceRecords.forEach(r => {
      r.items.forEach(i => {
        if (!i.isSerialized) {
          maintByAsset.set(i.assetId, (maintByAsset.get(i.assetId) || 0) + (i.qty || 1));
        }
      });
    });

    const masterAset = assets.map(asset => {
      let total = 0, tersedia = 0, dipinjam = 0, maintenance = 0;
      
      if (asset.isSerialized) {
        total = asset.units.length;
        tersedia = asset.units.filter(u => u.status === 'Tersedia').length;
        dipinjam = asset.units.filter(u => u.status === 'Dipinjam').length;
        maintenance = asset.units.filter(u => u.status === 'Maintenance').length;
      } else {
        const currentlyBorrowed = ticketsByAsset.get(asset.id) || 0;
        const currentlyMaint = maintByAsset.get(asset.id) || 0;
        
        tersedia = asset.quantity; 
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

    const transaksi = tickets.map(t => {
      let statusAkhir = t.overallStatus.toString();
      if (t.overallStatus === 'Dikembalikan') {
        const batasTgl = new Date(t.tanggalKembali + "T23:59:59Z");
        const actualTgl = new Date(t.updatedAt);
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
