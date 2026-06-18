export type ApprovalStage = 'Peminjam' | 'Admin' | 'HSSE' | 'Area Head' | 'Serah Terima'
export type TicketStatus = 'Menunggu' | 'Disetujui' | 'Ditolak' | 'Selesai' | 'Dipinjam' | 'Dikembalikan'

export interface ApprovalFlow {
  stage: ApprovalStage
  status: TicketStatus
}

export interface TrackingLog {
  stage: string
  status: string
  actor: string
  timestamp: string
  notes?: string
}

export interface Ticket {
  id: string
  peminjam: string
  nip?: string
  jabatan: string
  alat: string
  jumlah: number
  stokTersedia: number
  tanggalPinjam: string
  tanggalKembali: string
  lokasi: string
  currentStage: ApprovalStage
  overallStatus: TicketStatus
  flow: ApprovalFlow[]
  conflictWith?: string
  
  // Alokasi Fisik
  assetType?: 'SERIALIZED' | 'NON_SERIALIZED'
  allocatedUnits?: string[] // Berisi array Serial Number unik atau kuantitas

  // Riwayat Pelacakan Detail
  trackingLogs?: TrackingLog[]

  // Laporan Kerusakan (Lapor Mandiri)
  isReportedDamaged?: boolean
  damageReport?: {
    imageUrl: string
    description: string
    timestamp: string
  }
}
