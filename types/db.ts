/**
 * types/db.ts
 * Adapter/mapper antara tipe Prisma (dari database) dan tipe UI Ticket.
 * Semua komponen UI tidak perlu diubah — cukup data dari DB di-"terjemahkan"
 * lewat fungsi adaptTicket() sebelum di-pass sebagai props.
 */

import type { TicketWithRelations } from '../actions/core/ticket'
import type { Ticket, ApprovalFlow, TicketStatus } from './ticket'

/**
 * Derive flow approval berdasarkan currentStage dan overallStatus.
 * Karena flow tidak disimpan di DB (hanya logs), kita rekonstruksi secara logis.
 */
function deriveFlow(currentStage: string, overallStatus: string): ApprovalFlow[] {
  const stages = ['Peminjam', 'Admin', 'HSSE', 'Area Head', 'Serah Terima'] as const

  const stageIndex: Record<string, number> = {
    'Menunggu Persetujuan Admin': 1,
    'Menunggu Verifikasi HSSE': 2,
    'Menunggu Persetujuan Area Head': 3,
    'Menunggu Pengambilan di Gudang': 4,
    'Dipinjam di Lapangan': 4,
    'Selesai Dikembalikan': 4,
    'Ditolak oleh Admin': 1,
    'Ditolak oleh HSSE': 2,
    'Ditolak oleh Area Head': 3,
    'Dibatalkan oleh Peminjam': 0,
  }

  const reachedIndex = stageIndex[currentStage] ?? 0

  return stages.map((stage, i) => {
    let status: TicketStatus = 'Menunggu'
    if (i < reachedIndex) {
      status = 'Disetujui'
    } else if (i === reachedIndex) {
      if (overallStatus === 'Ditolak') {
        status = 'Ditolak'
      } else if (overallStatus === 'Disetujui' || overallStatus === 'Dipinjam' || overallStatus === 'Dikembalikan') {
        status = 'Disetujui'
      } else {
        status = 'Menunggu'
      }
    }
    return { stage, status }
  })
}

/**
 * Konversi satu baris Prisma Ticket ke format UI Ticket yang dipakai komponen.
 */
export function adaptTicket(t: TicketWithRelations): Ticket {
  return {
    id: t.ticketCode,
    dbId: t.id,
    assetId: t.assetId,
    peminjam: t.peminjam.name,
    jabatan: t.peminjam.role,           // Gunakan role sebagai jabatan
    alat: t.asset.name,
    jumlah: t.jumlah,
    stokTersedia: t.asset.quantity,
    tanggalPinjam: t.tanggalPinjam,
    tanggalKembali: t.tanggalKembali,
    lokasi: t.lokasi,
    currentStage: t.currentStage as any,
    overallStatus: t.overallStatus as unknown as TicketStatus,
    assetType: t.asset.isSerialized ? 'SERIALIZED' : 'NON_SERIALIZED',
    flow: deriveFlow(t.currentStage, t.overallStatus),
    trackingLogs: t.logs.map(l => ({
      stage: l.stage,
      status: l.status,
      actor: l.actor,
      timestamp: l.timestamp,
      notes: l.notes ?? undefined,
    })),
  }
}

/**
 * Konversi array Prisma Ticket ke array UI Ticket.
 */
export function adaptTickets(tickets: TicketWithRelations[]): Ticket[] {
  return tickets.map(adaptTicket)
}
