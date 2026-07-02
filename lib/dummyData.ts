import { Ticket } from '../types/ticket'
export type { Ticket }

export const initialTickets: Ticket[] = [
  {
    id: 'TKT-001', peminjam: 'Budi Santoso', nip: '19880102001', jabatan: 'Field Technician',
    alat: 'Gas Detector (MSA Altair 4X)', jumlah: 1, stokTersedia: 1, assetType: 'SERIALIZED',
    tanggalPinjam: '16 Jun 2026', tanggalKembali: '18 Jun 2026',
    alasan: 'Platform Delta-7', currentStage: 'Area Head', overallStatus: 'Menunggu',
    conflictWith: 'TKT-002',
    flow: [
      { stage: 'Peminjam', status: 'Disetujui' }, { stage: 'Admin', status: 'Disetujui' },
      { stage: 'HSSE', status: 'Disetujui' }, { stage: 'Area Head', status: 'Menunggu' },
    ],
  },
  {
    id: 'TKT-002', peminjam: 'Rina Kusuma', nip: '19900315002', jabatan: 'Safety Officer',
    alat: 'Gas Detector (MSA Altair 4X)', jumlah: 1, stokTersedia: 1, assetType: 'SERIALIZED',
    tanggalPinjam: '16 Jun 2026', tanggalKembali: '17 Jun 2026',
    alasan: 'Wellpad Charlie-3', currentStage: 'Admin', overallStatus: 'Menunggu',
    conflictWith: 'TKT-001',
    flow: [
      { stage: 'Peminjam', status: 'Disetujui' }, { stage: 'Admin', status: 'Menunggu' },
      { stage: 'HSSE', status: 'Menunggu' }, { stage: 'Area Head', status: 'Menunggu' },
    ],
  },
  {
    id: 'TKT-003', peminjam: 'Agus Wirawan', jabatan: 'Maintenance Eng.',
    alat: 'Safety Harness Full Body', jumlah: 2, stokTersedia: 5, assetType: 'NON_SERIALIZED',
    tanggalPinjam: '17 Jun 2026', tanggalKembali: '20 Jun 2026',
    alasan: 'Compressor Station B', currentStage: 'Admin', overallStatus: 'Menunggu',
    flow: [
      { stage: 'Peminjam', status: 'Disetujui' }, { stage: 'Admin', status: 'Menunggu' },
      { stage: 'HSSE', status: 'Menunggu' }, { stage: 'Area Head', status: 'Menunggu' },
    ],
  },
  {
    id: 'TKT-004', peminjam: 'Dewi Rahayu', nip: '19920708004', jabatan: 'Instrument Tech.',
    alat: 'Portable O2 Analyzer', jumlah: 1, stokTersedia: 3, assetType: 'SERIALIZED', allocatedUnits: ['SN-O2-001'],
    tanggalPinjam: '15 Jun 2026', tanggalKembali: '16 Jun 2026',
    alasan: 'Control Room Alpha', currentStage: 'Serah Terima', overallStatus: 'Disetujui',
    flow: [
      { stage: 'Peminjam', status: 'Disetujui' }, { stage: 'Admin', status: 'Disetujui' },
      { stage: 'HSSE', status: 'Disetujui' }, { stage: 'Area Head', status: 'Disetujui' }, { stage: 'Serah Terima', status: 'Menunggu' }
    ],
    trackingLogs: [
      { stage: 'Peminjam', status: 'Pengajuan dibuat oleh pekerja.', actor: 'Dewi Rahayu', timestamp: '14 Jun 2026, 08:30 WIB' },
      { stage: 'Admin', status: 'Pengecekan stok dan alokasi fisik unit (SN-O2-001) selesai.', actor: 'Siti Aminah (Admin)', timestamp: '14 Jun 2026, 09:15 WIB' },
      { stage: 'HSSE', status: 'Disetujui. Alat sesuai standar K3 untuk area Control Room.', actor: 'Budi Santoso (HSSE)', timestamp: '14 Jun 2026, 11:00 WIB' },
      { stage: 'Area Head', status: 'Disetujui untuk operasi lapangan.', actor: 'Pak Joko (Area Head)', timestamp: '14 Jun 2026, 14:20 WIB', notes: 'Harap dikembalikan tepat waktu' }
    ]
  },
  {
    id: 'TKT-005', peminjam: 'Hendra Putra', nip: '19890510005', jabatan: 'Drilling Operator',
    alat: 'Personal H2S Monitor', jumlah: 3, stokTersedia: 2, assetType: 'SERIALIZED',
    tanggalPinjam: '18 Jun 2026', tanggalKembali: '22 Jun 2026',
    alasan: 'Rig Nusantara-12', currentStage: 'Admin', overallStatus: 'Ditolak',
    flow: [
      { stage: 'Peminjam', status: 'Disetujui' }, { stage: 'Admin', status: 'Ditolak' },
      { stage: 'HSSE', status: 'Menunggu' }, { stage: 'Area Head', status: 'Menunggu' },
    ],
    trackingLogs: [
      { stage: 'Peminjam', status: 'Pengajuan dibuat oleh pekerja.', actor: 'Hendra Putra', timestamp: '17 Jun 2026, 10:10 WIB' },
      { stage: 'Admin', status: 'Ditolak karena stok fisik tidak mencukupi (rusak/maintenance).', actor: 'Siti Aminah (Admin)', timestamp: '17 Jun 2026, 10:45 WIB', notes: '2 unit sedang kalibrasi' }
    ]
  },
  {
    id: 'TKT-006', peminjam: 'Fajar Nugroho', nip: '19951230006', jabatan: 'Welder',
    alat: 'Welding Mask Pro', jumlah: 1, stokTersedia: 0, assetType: 'NON_SERIALIZED', allocatedUnits: ['AST-006-01'],
    tanggalPinjam: '10 Jun 2026', tanggalKembali: '25 Jun 2026',
    alasan: 'Area Fabrikasi', currentStage: 'Serah Terima', overallStatus: 'Dipinjam',
    flow: [
      { stage: 'Peminjam', status: 'Disetujui' }, { stage: 'Admin', status: 'Disetujui' },
      { stage: 'HSSE', status: 'Disetujui' }, { stage: 'Area Head', status: 'Disetujui' }, { stage: 'Serah Terima', status: 'Disetujui' }
    ],
    trackingLogs: [
      { stage: 'Serah Terima', status: 'Barang telah diserahkan dan sedang dipinjam.', actor: 'Siti Aminah (Admin)', timestamp: '10 Jun 2026, 09:00 WIB' }
    ],
    isReportedDamaged: true,
    damageReport: {
      imageUrl: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=500&q=80',
      description: 'Kaca pelindung retak saat dipakai mengelas, pandangan terhalang.',
      timestamp: '18 Jun 2026 08:15:22'
    }
  },
  {
    id: 'TKT-007', peminjam: 'Lina Marlina', jabatan: 'QC Inspector',
    alat: 'Digital Caliper', jumlah: 2, stokTersedia: 1, assetType: 'NON_SERIALIZED', allocatedUnits: ['BULK_QTY_2'],
    tanggalPinjam: '12 Jun 2026', tanggalKembali: '19 Jun 2026',
    alasan: 'Lab QC', currentStage: 'Serah Terima', overallStatus: 'Dipinjam',
    flow: [
      { stage: 'Peminjam', status: 'Disetujui' }, { stage: 'Admin', status: 'Disetujui' },
      { stage: 'HSSE', status: 'Disetujui' }, { stage: 'Area Head', status: 'Disetujui' }, { stage: 'Serah Terima', status: 'Disetujui' }
    ],
    trackingLogs: [
      { stage: 'Serah Terima', status: 'Barang telah diserahkan dan sedang dipinjam.', actor: 'Siti Aminah (Admin)', timestamp: '12 Jun 2026, 08:15 WIB' }
    ]
  },
  {
    id: 'TKT-008', peminjam: 'Rudi Hartono', nip: '19930412008', jabatan: 'Electrical Eng.',
    alat: 'Multimeter Digital', jumlah: 1, stokTersedia: 4, assetType: 'SERIALIZED',
    tanggalPinjam: '20 Jun 2026', tanggalKembali: '22 Jun 2026',
    alasan: 'Substation C', currentStage: 'Admin', overallStatus: 'Menunggu',
    flow: [ { stage: 'Peminjam', status: 'Disetujui' }, { stage: 'Admin', status: 'Menunggu' } ]
  },
  {
    id: 'TKT-009', peminjam: 'Andi Setiawan', nip: '19870514009', jabatan: 'Mechanic',
    alat: 'Impact Wrench', jumlah: 2, stokTersedia: 2, assetType: 'NON_SERIALIZED',
    tanggalPinjam: '20 Jun 2026', tanggalKembali: '25 Jun 2026',
    alasan: 'Workshop', currentStage: 'Admin', overallStatus: 'Menunggu',
    flow: [ { stage: 'Peminjam', status: 'Disetujui' }, { stage: 'Admin', status: 'Menunggu' } ]
  },
  {
    id: 'TKT-010', peminjam: 'Siska Amanda', nip: '19960228010', jabatan: 'HSE Inspector',
    alat: 'Noise Dosimeter', jumlah: 1, stokTersedia: 1, assetType: 'SERIALIZED',
    tanggalPinjam: '21 Jun 2026', tanggalKembali: '23 Jun 2026',
    alasan: 'Area Produksi 1', currentStage: 'Admin', overallStatus: 'Menunggu',
    flow: [ { stage: 'Peminjam', status: 'Disetujui' }, { stage: 'Admin', status: 'Menunggu' } ]
  },
  {
    id: 'TKT-011', peminjam: 'Tomi Kurniawan', nip: '19901105011', jabatan: 'Civil Eng.',
    alat: 'Theodolite', jumlah: 1, stokTersedia: 1, assetType: 'SERIALIZED',
    tanggalPinjam: '22 Jun 2026', tanggalKembali: '28 Jun 2026',
    alasan: 'Proyek Ekspansi', currentStage: 'Admin', overallStatus: 'Menunggu',
    flow: [ { stage: 'Peminjam', status: 'Disetujui' }, { stage: 'Admin', status: 'Menunggu' } ]
  },
  {
    id: 'TKT-012', peminjam: 'Maya Sari', nip: '19940822012', jabatan: 'Lab Analyst',
    alat: 'pH Meter Portable', jumlah: 1, stokTersedia: 3, assetType: 'SERIALIZED',
    tanggalPinjam: '19 Jun 2026', tanggalKembali: '20 Jun 2026',
    alasan: 'Water Treatment', currentStage: 'Admin', overallStatus: 'Menunggu',
    flow: [ { stage: 'Peminjam', status: 'Disetujui' }, { stage: 'Admin', status: 'Menunggu' } ]
  },
  {
    id: 'TKT-013', peminjam: 'Wahyu Hidayat', nip: '19860930013', jabatan: 'Rigger',
    alat: 'Chain Block 2T', jumlah: 2, stokTersedia: 0, assetType: 'NON_SERIALIZED',
    tanggalPinjam: '23 Jun 2026', tanggalKembali: '26 Jun 2026',
    alasan: 'Dermaga', currentStage: 'Admin', overallStatus: 'Menunggu', conflictWith: 'TKT-014',
    flow: [ { stage: 'Peminjam', status: 'Disetujui' }, { stage: 'Admin', status: 'Menunggu' } ]
  },
  {
    id: 'TKT-014', peminjam: 'Eko Prasetyo', nip: '19910115014', jabatan: 'Scaffolder',
    alat: 'Chain Block 2T', jumlah: 1, stokTersedia: 0, assetType: 'NON_SERIALIZED',
    tanggalPinjam: '24 Jun 2026', tanggalKembali: '27 Jun 2026',
    alasan: 'Menara Flare', currentStage: 'Admin', overallStatus: 'Menunggu', conflictWith: 'TKT-013',
    flow: [ { stage: 'Peminjam', status: 'Disetujui' }, { stage: 'Admin', status: 'Menunggu' } ]
  },
  {
    id: 'TKT-015', peminjam: 'Rizky Ramadhan', nip: '19980303015', jabatan: 'IT Support',
    alat: 'Splicer Fiber Optic', jumlah: 1, stokTersedia: 1, assetType: 'SERIALIZED',
    tanggalPinjam: '20 Jun 2026', tanggalKembali: '21 Jun 2026',
    alasan: 'Server Room B', currentStage: 'Serah Terima', overallStatus: 'Disetujui',
    flow: [ { stage: 'Peminjam', status: 'Disetujui' }, { stage: 'Admin', status: 'Disetujui' }, { stage: 'HSSE', status: 'Disetujui' }, { stage: 'Area Head', status: 'Disetujui' }, { stage: 'Serah Terima', status: 'Menunggu' } ]
  },
  {
    id: 'TKT-016', peminjam: 'Doni Tata', nip: '19850707016', jabatan: 'Driver',
    alat: 'Dongkrak Buaya 3T', jumlah: 1, stokTersedia: 2, assetType: 'NON_SERIALIZED',
    tanggalPinjam: '21 Jun 2026', tanggalKembali: '21 Jun 2026',
    alasan: 'Pool Kendaraan', currentStage: 'Admin', overallStatus: 'Menunggu',
    flow: [ { stage: 'Peminjam', status: 'Disetujui' }, { stage: 'Admin', status: 'Menunggu' } ]
  },
  {
    id: 'TKT-017', peminjam: 'Siti Nurhaliza', nip: '19971010017', jabatan: 'Surveyor',
    alat: 'GPS Geodetik Trimble', jumlah: 1, stokTersedia: 1, assetType: 'SERIALIZED',
    tanggalPinjam: '25 Jun 2026', tanggalKembali: '30 Jun 2026',
    alasan: 'Area Eksplorasi', currentStage: 'Admin', overallStatus: 'Menunggu',
    flow: [ { stage: 'Peminjam', status: 'Disetujui' }, { stage: 'Admin', status: 'Menunggu' } ]
  },
  // ===== Data Dummy Khusus Peminjam (Ahmad) =====
  {
    id: 'TKT-101', peminjam: 'Ahmad', nip: '19950214021', jabatan: 'Teknisi Operasional',
    alat: 'Helm Safety Pro (Class G)', jumlah: 1, stokTersedia: 10, assetType: 'NON_SERIALIZED', allocatedUnits: ['HLM-PRO-05'],
    tanggalPinjam: '14 Jun 2026', tanggalKembali: '28 Jun 2026',
    alasan: 'Area Fabrikasi Utama', currentStage: 'Serah Terima', overallStatus: 'Dipinjam',
    flow: [
      { stage: 'Peminjam', status: 'Disetujui' }, { stage: 'Admin', status: 'Disetujui' },
      { stage: 'HSSE', status: 'Disetujui' }, { stage: 'Area Head', status: 'Disetujui' }, { stage: 'Serah Terima', status: 'Disetujui' }
    ],
    trackingLogs: [
      { stage: 'Serah Terima', status: 'Barang telah diserahkan dan sedang dipinjam oleh Ahmad.', actor: 'Siti Aminah (Admin)', timestamp: '14 Jun 2026, 09:30 WIB' }
    ]
  },
  {
    id: 'TKT-102', peminjam: 'Ahmad', nip: '19950214021', jabatan: 'Teknisi Operasional',
    alat: 'Gas Detector (MSA Altair 4X)', jumlah: 1, stokTersedia: 2, assetType: 'SERIALIZED', allocatedUnits: ['GD-MSA-004'],
    tanggalPinjam: '20 Jun 2026', tanggalKembali: '25 Jun 2026',
    alasan: 'Wellpad Alpha', currentStage: 'Serah Terima', overallStatus: 'Disetujui',
    flow: [
      { stage: 'Peminjam', status: 'Disetujui' }, { stage: 'Admin', status: 'Disetujui' },
      { stage: 'HSSE', status: 'Disetujui' }, { stage: 'Area Head', status: 'Disetujui' }, { stage: 'Serah Terima', status: 'Menunggu' }
    ],
    trackingLogs: [
      { stage: 'Peminjam', status: 'Pengajuan pinjam dibuat.', actor: 'Ahmad', timestamp: '19 Jun 2026, 08:15 WIB' },
      { stage: 'Admin', status: 'Stok tersedia, unit GD-MSA-004 dialokasikan.', actor: 'Siti Aminah (Admin)', timestamp: '19 Jun 2026, 09:00 WIB' },
      { stage: 'HSSE', status: 'Telah lolos verifikasi keselamatan kerja.', actor: 'Hendra (HSSE)', timestamp: '19 Jun 2026, 11:20 WIB' },
      { stage: 'Area Head', status: 'Disetujui untuk operasi wellpad.', actor: 'Pak Joko (Area Head)', timestamp: '19 Jun 2026, 14:00 WIB' }
    ]
  },
  {
    id: 'TKT-103', peminjam: 'Ahmad', nip: '19950214021', jabatan: 'Teknisi Operasional',
    alat: 'Safety Harness Full Body', jumlah: 2, stokTersedia: 5, assetType: 'NON_SERIALIZED',
    tanggalPinjam: '22 Jun 2026', tanggalKembali: '26 Jun 2026',
    alasan: 'Platform Delta-7', currentStage: 'Admin', overallStatus: 'Menunggu',
    flow: [
      { stage: 'Peminjam', status: 'Disetujui' }, { stage: 'Admin', status: 'Menunggu' },
      { stage: 'HSSE', status: 'Menunggu' }, { stage: 'Area Head', status: 'Menunggu' }
    ],
    trackingLogs: [
      { stage: 'Peminjam', status: 'Pengajuan dibuat dan menunggu pemeriksaan Admin.', actor: 'Ahmad', timestamp: '21 Jun 2026, 16:10 WIB' }
    ]
  },
  {
    id: 'TKT-104', peminjam: 'Ahmad', nip: '19950214021', jabatan: 'Teknisi Operasional',
    alat: 'Multimeter Digital Fluke', jumlah: 1, stokTersedia: 0, assetType: 'SERIALIZED',
    tanggalPinjam: '15 Jun 2026', tanggalKembali: '18 Jun 2026',
    alasan: 'Substation C', currentStage: 'Admin', overallStatus: 'Ditolak',
    flow: [
      { stage: 'Peminjam', status: 'Disetujui' }, { stage: 'Admin', status: 'Ditolak' },
      { stage: 'HSSE', status: 'Menunggu' }, { stage: 'Area Head', status: 'Menunggu' }
    ],
    trackingLogs: [
      { stage: 'Peminjam', status: 'Pengajuan pinjam dibuat.', actor: 'Ahmad', timestamp: '14 Jun 2026, 10:00 WIB' },
      { stage: 'Admin', status: 'Ditolak karena seluruh unit Multimeter sedang dalam jadwal kalibrasi tahunan.', actor: 'Siti Aminah (Admin)', timestamp: '14 Jun 2026, 11:30 WIB', notes: 'Bisa mengajukan kembali minggu depan' }
    ]
  },
  {
    id: 'TKT-105', peminjam: 'Ahmad', nip: '19950214021', jabatan: 'Teknisi Operasional',
    alat: 'Chain Block 2T Heavy Duty', jumlah: 1, stokTersedia: 4, assetType: 'NON_SERIALIZED', allocatedUnits: ['CB-2T-08'],
    tanggalPinjam: '01 Jun 2026', tanggalKembali: '05 Jun 2026',
    alasan: 'Dermaga Loading', currentStage: 'Selesai', overallStatus: 'Selesai',
    flow: [
      { stage: 'Peminjam', status: 'Disetujui' }, { stage: 'Admin', status: 'Disetujui' },
      { stage: 'HSSE', status: 'Disetujui' }, { stage: 'Area Head', status: 'Disetujui' }, { stage: 'Serah Terima', status: 'Disetujui' }
    ],
    trackingLogs: [
      { stage: 'Peminjam', status: 'Pengajuan dibuat.', actor: 'Ahmad', timestamp: '31 Mei 2026, 09:00 WIB' },
      { stage: 'Admin', status: 'Disetujui.', actor: 'Siti Aminah', timestamp: '31 Mei 2026, 10:00 WIB' },
      { stage: 'Serah Terima', status: 'Aset dikembalikan dalam kondisi lengkap dan baik.', actor: 'Siti Aminah (Admin)', timestamp: '05 Jun 2026, 15:20 WIB', notes: 'Pengembalian tepat waktu' }
    ]
  }
]

export const navItems = [
  { label: 'Persetujuan' },
  { label: 'Aset' },
  { label: 'Analitik' },
]
