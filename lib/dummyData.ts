import { Ticket } from '../types/ticket'

export const initialTickets: Ticket[] = [
  {
    id: 'TKT-001', peminjam: 'Budi Santoso', jabatan: 'Field Technician',
    alat: 'Gas Detector (MSA Altair 4X)', jumlah: 1, stokTersedia: 1, assetType: 'SERIALIZED',
    tanggalPinjam: '16 Jun 2026', tanggalKembali: '18 Jun 2026',
    lokasi: 'Platform Delta-7', currentStage: 'Area Head', overallStatus: 'Menunggu',
    conflictWith: 'TKT-002',
    flow: [
      { stage: 'Peminjam', status: 'Disetujui' }, { stage: 'Admin', status: 'Disetujui' },
      { stage: 'HSSE', status: 'Disetujui' }, { stage: 'Area Head', status: 'Menunggu' },
    ],
  },
  {
    id: 'TKT-002', peminjam: 'Rina Kusuma', jabatan: 'Safety Officer',
    alat: 'Gas Detector (MSA Altair 4X)', jumlah: 1, stokTersedia: 1, assetType: 'SERIALIZED',
    tanggalPinjam: '16 Jun 2026', tanggalKembali: '17 Jun 2026',
    lokasi: 'Wellpad Charlie-3', currentStage: 'Admin', overallStatus: 'Menunggu',
    conflictWith: 'TKT-001',
    flow: [
      { stage: 'Peminjam', status: 'Disetujui' }, { stage: 'Admin', status: 'Menunggu' },
      { stage: 'HSSE', status: 'Menunggu' }, { stage: 'Area Head', status: 'Menunggu' },
    ],
  },
  {
    id: 'TKT-003', peminjam: 'Agus Wirawan', jabatan: 'Maintenance Eng.',
    alat: 'Safety Harness Full Body', jumlah: 2, stokTersedia: 5, assetType: 'BULK',
    tanggalPinjam: '17 Jun 2026', tanggalKembali: '20 Jun 2026',
    lokasi: 'Compressor Station B', currentStage: 'Admin', overallStatus: 'Menunggu',
    flow: [
      { stage: 'Peminjam', status: 'Disetujui' }, { stage: 'Admin', status: 'Menunggu' },
      { stage: 'HSSE', status: 'Menunggu' }, { stage: 'Area Head', status: 'Menunggu' },
    ],
  },
  {
    id: 'TKT-004', peminjam: 'Dewi Rahayu', jabatan: 'Instrument Tech.',
    alat: 'Portable O2 Analyzer', jumlah: 1, stokTersedia: 3, assetType: 'SERIALIZED', allocatedUnits: ['SN-O2-001'],
    tanggalPinjam: '15 Jun 2026', tanggalKembali: '16 Jun 2026',
    lokasi: 'Control Room Alpha', currentStage: 'Serah Terima', overallStatus: 'Disetujui',
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
    id: 'TKT-005', peminjam: 'Hendra Putra', jabatan: 'Drilling Operator',
    alat: 'Personal H2S Monitor', jumlah: 3, stokTersedia: 2, assetType: 'SERIALIZED',
    tanggalPinjam: '18 Jun 2026', tanggalKembali: '22 Jun 2026',
    lokasi: 'Rig Nusantara-12', currentStage: 'Admin', overallStatus: 'Ditolak',
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
    id: 'TKT-006', peminjam: 'Fajar Nugroho', jabatan: 'Welder',
    alat: 'Welding Mask Pro', jumlah: 1, stokTersedia: 0, assetType: 'SERIALIZED', allocatedUnits: ['SN-WLD-005'],
    tanggalPinjam: '10 Jun 2026', tanggalKembali: '25 Jun 2026',
    lokasi: 'Area Fabrikasi', currentStage: 'Serah Terima', overallStatus: 'Dipinjam',
    flow: [
      { stage: 'Peminjam', status: 'Disetujui' }, { stage: 'Admin', status: 'Disetujui' },
      { stage: 'HSSE', status: 'Disetujui' }, { stage: 'Area Head', status: 'Disetujui' }, { stage: 'Serah Terima', status: 'Disetujui' }
    ],
    trackingLogs: [
      { stage: 'Serah Terima', status: 'Barang telah diserahkan dan sedang dipinjam.', actor: 'Siti Aminah (Admin)', timestamp: '10 Jun 2026, 09:00 WIB' }
    ]
  },
  {
    id: 'TKT-007', peminjam: 'Lina Marlina', jabatan: 'QC Inspector',
    alat: 'Digital Caliper', jumlah: 2, stokTersedia: 1, assetType: 'BULK', allocatedUnits: ['BULK_QTY_2'],
    tanggalPinjam: '12 Jun 2026', tanggalKembali: '19 Jun 2026',
    lokasi: 'Lab QC', currentStage: 'Serah Terima', overallStatus: 'Dipinjam',
    flow: [
      { stage: 'Peminjam', status: 'Disetujui' }, { stage: 'Admin', status: 'Disetujui' },
      { stage: 'HSSE', status: 'Disetujui' }, { stage: 'Area Head', status: 'Disetujui' }, { stage: 'Serah Terima', status: 'Disetujui' }
    ],
    trackingLogs: [
      { stage: 'Serah Terima', status: 'Barang telah diserahkan dan sedang dipinjam.', actor: 'Siti Aminah (Admin)', timestamp: '12 Jun 2026, 08:15 WIB' }
    ]
  },
]

export const navItems = [
  { label: 'Persetujuan' },
  { label: 'Aset' },
  { label: 'Analitik' },
]
