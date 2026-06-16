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
  assetType?: 'SERIALIZED' | 'BULK'
  allocatedUnits?: string[] // Berisi Serial Number (jika SERIALIZED) atau Catatan (jika BULK)

  // Riwayat Pelacakan Detail
  trackingLogs?: TrackingLog[]
}
