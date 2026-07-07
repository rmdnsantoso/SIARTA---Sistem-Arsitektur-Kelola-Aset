import { PrismaClient, Role, AssetStatus, TicketStatus } from '../app/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Mulai seeding database SIARTA...')

  // ============================================================
  // 1. HAPUS DATA LAMA (urutan penting karena ada relasi FK)
  // ============================================================
  await prisma.trackingLog.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.ticket.deleteMany()
  await prisma.maintenanceRecord.deleteMany()
  await prisma.asset.deleteMany()
  await prisma.user.deleteMany()
  console.log('🗑️  Data lama berhasil dihapus.')

  // ============================================================
  // 2. SEED USERS
  // ============================================================
  const admin = await prisma.user.create({
    data: {
      id: 'usr-admin-01',
      email: 'siti@siarta.com',
      name: 'Siti Aminah',
      role: Role.Admin,
      nip: '100234',
      wa: '085544433322',
      jabatan: 'Admin Logistik',
      office: 'Gudang Pusat',
      regional: 'Jawa Bagian Barat',
      isActive: true,
    }
  })

  const areaHead = await prisma.user.create({
    data: {
      id: 'usr-areahead-01',
      email: 'joko@siarta.com',
      name: 'Pak Joko',
      role: Role.AreaHead,
      nip: '100236',
      wa: '081112223334',
      jabatan: 'Operation Manager',
      office: 'HO Jakarta',
      regional: 'Nasional',
      isActive: true,
    }
  })

  const hsse = await prisma.user.create({
    data: {
      id: 'usr-hsse-01',
      email: 'hendra@siarta.com',
      name: 'Hendra',
      role: Role.HSSE,
      nip: '100235',
      wa: '081298765432',
      jabatan: 'Safety Officer',
      office: 'Site Alpha',
      regional: 'Jawa Bagian Timur',
      isActive: true,
    }
  })

  const ahmad = await prisma.user.create({
    data: {
      id: 'usr-peminjam-01',
      email: 'ahmad@siarta.com',
      name: 'Ahmad',
      role: Role.Peminjam,
      nip: '100240',
      wa: '081234567890',
      jabatan: 'Field Technician',
      office: 'Site Alpha',
      regional: 'Jawa Bagian Timur',
      isActive: true,
    }
  })

  // Peminjam lainnya
  const budi = await prisma.user.create({ data: { email: 'budi@siarta.com', name: 'Budi Santoso', role: Role.Peminjam, nip: '100241', wa: '081298765432', jabatan: 'Driller', office: 'Site Beta', regional: 'Kalimantan', isActive: true } })
  const rina = await prisma.user.create({ data: { email: 'rina@siarta.com', name: 'Rina Kusuma', role: Role.Peminjam, nip: '100242', wa: '081111111111', jabatan: 'Surveyor', office: 'Site Alpha', regional: 'Jawa Bagian Timur', isActive: true } })
  const agus = await prisma.user.create({ data: { email: 'agus@siarta.com', name: 'Agus Wirawan', role: Role.Peminjam, nip: '100243', wa: '082222222222', jabatan: 'Maintenance Crew', office: 'Site Gamma', regional: 'Sumatera', isActive: true } })
  const dewi = await prisma.user.create({ data: { email: 'dewi@siarta.com', name: 'Dewi Rahayu', role: Role.Peminjam, nip: '100244', wa: '083333333333', jabatan: 'Quality Control', office: 'HO Jakarta', regional: 'Nasional', isActive: true } })
  const hendra = await prisma.user.create({ data: { email: 'hendra.p@siarta.com', name: 'Hendra Putra', role: Role.Peminjam, nip: '100245', wa: '084444444444', jabatan: 'Welder', office: 'Site Beta', regional: 'Kalimantan', isActive: false } })

  console.log('👥 Users berhasil dibuat.')

  // ============================================================
  // 3. SEED ASSETS (dari katalog alat dummy)
  // ============================================================
  const gasDetector = await prisma.asset.create({
    data: {
      assetCode: 'AST-001',
      name: 'Gas Detector MSA Altair 4X',
      category: 'Keselamatan Kerja',
      isSerialized: true,

      quantity: 3,
      status: AssetStatus.Available,
      spec: 'Deteksi gas O2, CO, H2S, LEL. Tahan ledakan ATEX.',
    }
  })

  const safetyHarness = await prisma.asset.create({
    data: {
      assetCode: 'AST-002',
      name: 'Safety Harness Full Body',
      category: 'Keselamatan Kerja',
      isSerialized: false,

      quantity: 5,
      status: AssetStatus.Available,
      spec: 'Full body harness standar EN 361. Kapasitas 140 kg.',
    }
  })

  const o2Analyzer = await prisma.asset.create({
    data: {
      assetCode: 'AST-003',
      name: 'Portable O2 Analyzer',
      category: 'Alat Ukur',
      isSerialized: true,

      quantity: 3,
      status: AssetStatus.Available,
      spec: 'Mengukur kadar oksigen 0-25%. Akurasi ±0.1%.',
    }
  })

  const multimeter = await prisma.asset.create({
    data: {
      assetCode: 'AST-004',
      name: 'Multimeter Digital Fluke',
      category: 'Alat Ukur',
      isSerialized: true,

      quantity: 4,
      status: AssetStatus.Maintenance,
      spec: 'Fluke 87V. True RMS, ukur AC/DC, resistansi, kapasitansi.',
    }
  })

  const chainBlock = await prisma.asset.create({
    data: {
      assetCode: 'AST-005',
      name: 'Chain Block 2T Heavy Duty',
      category: 'Alat Angkat',
      isSerialized: false,

      quantity: 4,
      status: AssetStatus.Available,
      spec: 'Kapasitas angkat 2 Ton. Rantai baja grade 80.',
    }
  })

  const weldingMask = await prisma.asset.create({
    data: {
      assetCode: 'AST-006',
      name: 'Welding Mask Pro',
      category: 'Alat Pelindung',
      isSerialized: false,

      quantity: 2,
      status: AssetStatus.Borrowed,
      spec: 'Auto-darkening lens DIN 9-13. Tahan cipratan api.',
    }
  })

  const helmet = await prisma.asset.create({
    data: {
      assetCode: 'AST-007',
      name: 'Helm Safety Pro Class G',
      category: 'Alat Pelindung',
      isSerialized: false,

      quantity: 10,
      status: AssetStatus.Borrowed,
      spec: 'ANSI/ISEA Z89.1 Class G. Pelindung kepala industri.',
    }
  })

  const h2sMonitor = await prisma.asset.create({
    data: {
      assetCode: 'AST-008',
      name: 'Personal H2S Monitor',
      category: 'Keselamatan Kerja',
      isSerialized: true,

      quantity: 2,
      status: AssetStatus.Available,
      spec: 'Deteksi tunggal H2S. Alarm visual dan getar. Clip-on.',
    }
  })

  const gps = await prisma.asset.create({
    data: {
      assetCode: 'AST-009',
      name: 'GPS Geodetik Trimble',
      category: 'Alat Survey',
      isSerialized: true,

      quantity: 1,
      status: AssetStatus.Available,
      spec: 'Trimble R12i. Akurasi horizontal 3mm. RTK support.',
    }
  })

  const apar = await prisma.asset.create({
    data: {
      assetCode: 'AST-010',
      name: 'APAR CO2 6kg',
      category: 'Keselamatan Kebakaran',
      isSerialized: true,

      quantity: 3,
      status: AssetStatus.Available,
      spec: 'Media CO2. Efektif untuk kebakaran kelas B dan C.',
    }
  })

  console.log('🧰 Assets berhasil dibuat.')

  // ============================================================
  // 4. SEED TICKETS + TRACKING LOGS
  // ============================================================

  // TKT-001: Budi - Gas Detector - Menunggu Verifikasi HSSE
  await prisma.ticket.create({
    data: {
      ticketCode: 'TKT-001',
      peminjamId: budi.id,
      assetId: gasDetector.id,
      jumlah: 1,
      tanggalPinjam: '16 Jun 2026',
      tanggalKembali: '18 Jun 2026',
      alasan: 'Platform Delta-7',
      overallStatus: TicketStatus.Menunggu,
      currentStage: 'Menunggu Verifikasi HSSE',
      logs: {
        create: [
          { stage: 'Peminjam', status: 'Pengajuan dibuat.', actor: 'Budi Santoso (Peminjam)', timestamp: '15 Jun 2026, 08:00 WIB' },
          { stage: 'Admin', status: 'Verifikasi stok fisik OK. Meneruskan ke HSSE untuk inspeksi K3.', actor: 'Siti Aminah (Admin)', timestamp: '15 Jun 2026, 09:00 WIB' },
        ]
      }
    }
  })


  // TKT-002: Rina - Gas Detector - Menunggu Admin
  await prisma.ticket.create({
    data: {
      ticketCode: 'TKT-002',
      peminjamId: rina.id,
      assetId: gasDetector.id,
      jumlah: 1,
      tanggalPinjam: '16 Jun 2026',
      tanggalKembali: '17 Jun 2026',
      alasan: 'Wellpad Charlie-3',
      overallStatus: TicketStatus.Menunggu,
      currentStage: 'Menunggu Persetujuan Admin',
      logs: {
        create: [
          { stage: 'Peminjam', status: 'Pengajuan dibuat.', actor: 'Rina Kusuma (Peminjam)', timestamp: '15 Jun 2026, 10:00 WIB' },
        ]
      }
    }
  })

  // TKT-003: Agus - Safety Harness - Menunggu Admin
  await prisma.ticket.create({
    data: {
      ticketCode: 'TKT-003',
      peminjamId: agus.id,
      assetId: safetyHarness.id,
      jumlah: 2,
      tanggalPinjam: '17 Jun 2026',
      tanggalKembali: '20 Jun 2026',
      alasan: 'Compressor Station B',
      overallStatus: TicketStatus.Menunggu,
      currentStage: 'Menunggu Persetujuan Admin',
      logs: {
        create: [
          { stage: 'Peminjam', status: 'Pengajuan dibuat.', actor: 'Agus Wirawan (Peminjam)', timestamp: '16 Jun 2026, 13:00 WIB' },
        ]
      }
    }
  })

  // TKT-004: Dewi - O2 Analyzer - Disetujui, siap diambil
  await prisma.ticket.create({
    data: {
      ticketCode: 'TKT-004',
      peminjamId: dewi.id,
      assetId: o2Analyzer.id,
      jumlah: 1,
      tanggalPinjam: '15 Jun 2026',
      tanggalKembali: '16 Jun 2026',
      alasan: 'Control Room Alpha',
      overallStatus: TicketStatus.Disetujui,
      currentStage: 'Menunggu Pengambilan di Gudang',
      logs: {
        create: [
          { stage: 'Peminjam', status: 'Pengajuan dibuat.', actor: 'Dewi Rahayu', timestamp: '14 Jun 2026, 08:30 WIB' },
          { stage: 'Admin', status: 'Stok tersedia, unit SN-O2-001 dialokasikan.', actor: 'Siti Aminah (Admin)', timestamp: '14 Jun 2026, 09:15 WIB' },
          { stage: 'Area Head', status: 'Disetujui untuk operasi lapangan.', actor: 'Pak Joko (Area Head)', timestamp: '14 Jun 2026, 14:20 WIB', notes: 'Harap dikembalikan tepat waktu' }
        ]
      }
    }
  })

  // TKT-005: Hendra Putra - H2S Monitor - Ditolak Admin
  await prisma.ticket.create({
    data: {
      ticketCode: 'TKT-005',
      peminjamId: hendra.id,
      assetId: h2sMonitor.id,
      jumlah: 3,
      tanggalPinjam: '18 Jun 2026',
      tanggalKembali: '22 Jun 2026',
      alasan: 'Rig Nusantara-12',
      overallStatus: TicketStatus.Ditolak,
      currentStage: 'Ditolak oleh Admin',
      logs: {
        create: [
          { stage: 'Peminjam', status: 'Pengajuan dibuat.', actor: 'Hendra Putra', timestamp: '17 Jun 2026, 10:10 WIB' },
          { stage: 'Admin', status: 'Ditolak: stok tidak mencukupi (2 unit sedang maintenance).', actor: 'Siti Aminah (Admin)', timestamp: '17 Jun 2026, 10:45 WIB', notes: '2 unit sedang maintenance' }
        ]
      }
    }
  })

  // ===== TIKET KHUSUS AHMAD =====

  // TKT-101: Ahmad - Helm Safety - Sedang dipinjam
  await prisma.ticket.create({
    data: {
      ticketCode: 'TKT-101',
      peminjamId: ahmad.id,
      assetId: helmet.id,
      jumlah: 1,
      tanggalPinjam: '14 Jun 2026',
      tanggalKembali: '28 Jun 2026',
      alasan: 'Area Fabrikasi Utama',
      overallStatus: TicketStatus.Dipinjam,
      currentStage: 'Dipinjam di Lapangan',
      logs: {
        create: [
          { stage: 'Peminjam', status: 'Pengajuan dibuat.', actor: 'Ahmad', timestamp: '13 Jun 2026, 08:00 WIB' },
          { stage: 'Admin', status: 'Disetujui. Unit HLM-PRO-05 dialokasikan.', actor: 'Siti Aminah (Admin)', timestamp: '13 Jun 2026, 09:00 WIB' },
          { stage: 'Area Head', status: 'Disetujui.', actor: 'Pak Joko (Area Head)', timestamp: '13 Jun 2026, 11:00 WIB' },
          { stage: 'Admin', status: 'Barang diserahkan ke Ahmad.', actor: 'Siti Aminah (Admin)', timestamp: '14 Jun 2026, 09:30 WIB' }
        ]
      }
    }
  })

  // TKT-102: Ahmad - Gas Detector - Disetujui, menunggu pengambilan
  await prisma.ticket.create({
    data: {
      ticketCode: 'TKT-102',
      peminjamId: ahmad.id,
      assetId: gasDetector.id,
      jumlah: 1,
      tanggalPinjam: '20 Jun 2026',
      tanggalKembali: '25 Jun 2026',
      alasan: 'Wellpad Alpha',
      overallStatus: TicketStatus.Disetujui,
      currentStage: 'Menunggu Pengambilan di Gudang',
      logs: {
        create: [
          { stage: 'Peminjam', status: 'Pengajuan pinjam dibuat.', actor: 'Ahmad', timestamp: '19 Jun 2026, 08:15 WIB' },
          { stage: 'Admin', status: 'Stok tersedia, unit GD-MSA-004 dialokasikan.', actor: 'Siti Aminah (Admin)', timestamp: '19 Jun 2026, 09:00 WIB' },
          { stage: 'Area Head', status: 'Disetujui untuk operasi wellpad.', actor: 'Pak Joko (Area Head)', timestamp: '19 Jun 2026, 14:00 WIB' }
        ]
      }
    }
  })

  // TKT-103: Ahmad - Safety Harness - Menunggu Admin
  await prisma.ticket.create({
    data: {
      ticketCode: 'TKT-103',
      peminjamId: ahmad.id,
      assetId: safetyHarness.id,
      jumlah: 2,
      tanggalPinjam: '22 Jun 2026',
      tanggalKembali: '26 Jun 2026',
      alasan: 'Platform Delta-7',
      overallStatus: TicketStatus.Menunggu,
      currentStage: 'Menunggu Persetujuan Admin',
      logs: {
        create: [
          { stage: 'Peminjam', status: 'Pengajuan dibuat dan menunggu pemeriksaan Admin.', actor: 'Ahmad', timestamp: '21 Jun 2026, 16:10 WIB' }
        ]
      }
    }
  })

  // TKT-104: Ahmad - Multimeter - Ditolak (Maintenance)
  await prisma.ticket.create({
    data: {
      ticketCode: 'TKT-104',
      peminjamId: ahmad.id,
      assetId: multimeter.id,
      jumlah: 1,
      tanggalPinjam: '15 Jun 2026',
      tanggalKembali: '18 Jun 2026',
      alasan: 'Substation C',
      overallStatus: TicketStatus.Ditolak,
      currentStage: 'Ditolak oleh Admin',
      logs: {
        create: [
          { stage: 'Peminjam', status: 'Pengajuan pinjam dibuat.', actor: 'Ahmad', timestamp: '14 Jun 2026, 10:00 WIB' },
          { stage: 'Admin', status: 'Ditolak: seluruh unit Multimeter sedang dalam jadwal maintenance.', actor: 'Siti Aminah (Admin)', timestamp: '14 Jun 2026, 11:30 WIB', notes: 'Bisa mengajukan kembali minggu depan' }
        ]
      }
    }
  })

  // TKT-105: Ahmad - Chain Block - Selesai dikembalikan
  await prisma.ticket.create({
    data: {
      ticketCode: 'TKT-105',
      peminjamId: ahmad.id,
      assetId: chainBlock.id,
      jumlah: 1,
      tanggalPinjam: '01 Jun 2026',
      tanggalKembali: '05 Jun 2026',
      alasan: 'Dermaga Loading',
      overallStatus: TicketStatus.Dikembalikan,
      currentStage: 'Selesai Dikembalikan',
      logs: {
        create: [
          { stage: 'Peminjam', status: 'Pengajuan dibuat.', actor: 'Ahmad', timestamp: '31 Mei 2026, 09:00 WIB' },
          { stage: 'Admin', status: 'Disetujui.', actor: 'Siti Aminah', timestamp: '31 Mei 2026, 10:00 WIB' },
          { stage: 'Admin', status: 'Aset dikembalikan dalam kondisi lengkap dan baik.', actor: 'Siti Aminah (Admin)', timestamp: '05 Jun 2026, 15:20 WIB', notes: 'Pengembalian tepat waktu' }
        ]
      }
    }
  })

  console.log('🎟️  Tickets & Tracking Logs berhasil dibuat.')

  // ============================================================
  // 5. SEED MAINTENANCE RECORDS
  // ============================================================
  await prisma.maintenanceRecord.create({
    data: {
      recordCode: 'ESC-A01', 
      issue: 'Layar LCD bergaris, pembacaan tidak terbaca jelas.',
      status: 'Menunggu Tindakan', resolution: 'Menunggu Tindakan',
      reporterId: admin.id, reporterName: 'Siti Aminah (Admin)',
      dateReported: '15 Jun 2026',
      items: {
        create: [{
          assetId: multimeter.id, assetName: multimeter.name, assetCode: multimeter.assetCode,
          serialNumber: 'FLK-112', isSerialized: true
        }]
      }
    }
  })

  await prisma.maintenanceRecord.create({
    data: {
      recordCode: 'ESC-H01',
      issue: 'Retak struktural pada crown, tidak aman untuk digunakan.',
      status: 'Selesai Diperbaiki', resolution: 'Selesai Diperbaiki',
      reporterId: hsse.id, reporterName: 'Hendra (HSSE)',
      dateReported: '10 Jun 2026', dateResolved: '12 Jun 2026',
      notes: 'Helm diganti unit baru dari stok cadangan.',
      items: {
        create: [{
          assetId: helmet.id, assetName: helmet.name, assetCode: helmet.assetCode,
          qty: 1, isSerialized: false
        }]
      }
    }
  })

  await prisma.maintenanceRecord.create({
    data: {
      recordCode: 'ESC-H02',
      issue: 'Auto-darkening tidak berfungsi, lensa macet di posisi gelap.',
      status: 'Dimusnahkan', resolution: 'Dimusnahkan',
      reporterId: admin.id, reporterName: 'Siti Aminah (Admin)',
      dateReported: '08 Jun 2026', dateResolved: '09 Jun 2026',
      notes: 'Komponen sensor tidak tersedia di pasaran. Write-off.',
      items: {
        create: [{
          assetId: weldingMask.id, assetName: weldingMask.name, assetCode: weldingMask.assetCode,
          serialNumber: 'WM-002', isSerialized: true
        }]
      }
    }
  })
  console.log('🔧 Maintenance Records berhasil dibuat.')

  // ============================================================
  // 5. SEED NOTIFICATIONS
  // ============================================================
  await prisma.notification.createMany({
    data: [
      { title: 'Pembaruan Sistem SIARTA v2.0', desc: 'Arsitektur backend baru dengan Prisma & Server Actions berhasil diluncurkan.', type: 'info', targetRole: 'Semua', unread: false, time: '1 jam lalu' },
      { title: 'Verifikasi Pengembalian Selesai', desc: 'Ahmad telah mengembalikan 1 unit Chain Block 2T dalam kondisi baik.', type: 'success', targetRole: 'Admin', unread: true, time: '30 mnt lalu' },
      { title: 'Stok Aset Kritis: APAR CO2', desc: 'Stok APAR CO2 di Gudang Timur tersisa 3 unit. Segera ajukan pengadaan.', type: 'urgent', targetRole: 'Admin', unread: true, time: '2 jam lalu' },
      { title: 'Menunggu Persetujuan Anda', desc: 'Tiket TKT-001 (Gas Detector) dari Budi Santoso menunggu verifikasi HSSE.', type: 'urgent', targetRole: 'HSSE', unread: true, time: '1 jam lalu' },
      { title: 'Pengajuan Disetujui!', desc: 'Tiket TKT-102 (Gas Detector) telah disetujui Area Head. Ambil di Gudang Utama.', type: 'success', targetRole: 'Peminjam', unread: true, time: '2 jam lalu' },
      { title: 'Peringatan Masa Aktif Pinjaman', desc: 'Tiket TKT-101 (Helm Safety) akan jatuh tempo besok. Harap kembalikan tepat waktu.', type: 'warning', targetRole: 'Peminjam', unread: true, time: '3 jam lalu' },
      { title: 'Laporan Kerusakan Baru', desc: 'Multimeter Fluke (AST-004) dilaporkan rusak oleh Admin. Status: Menunggu Tindakan.', type: 'urgent', targetRole: 'HSSE', unread: true, time: '20 mnt lalu' },
    ]
  })
  console.log('🔔 Notifications berhasil dibuat.')

  console.log('\n✅ Seeding database SIARTA selesai!')
  console.log(`   👥 ${await prisma.user.count()} Users`)
  console.log(`   🧰 ${await prisma.asset.count()} Assets`)
  console.log(`   🎟️  ${await prisma.ticket.count()} Tickets`)
  console.log(`   📋 ${await prisma.trackingLog.count()} Tracking Logs`)
  console.log(`   🔔 ${await prisma.notification.count()} Notifications`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding gagal:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
