-- Migration: add_datetime_to_history_logs
-- Menambahkan kolom createdAt DateTime ke UnitHistory dan TrackingLog
-- untuk menggantikan timestamp String dalam hal sorting & filtering di DB level.
-- Kolom timestamp String tetap dipertahankan untuk keperluan display label WIB.

-- AlterTable: UnitHistory — tambah createdAt DateTime
ALTER TABLE "UnitHistory" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex: TrackingLog — sort log per tiket berdasarkan waktu
CREATE INDEX "TrackingLog_ticketId_createdAt_idx" ON "TrackingLog"("ticketId", "createdAt");

-- CreateIndex: UnitHistory — sort riwayat unit berdasarkan waktu
CREATE INDEX "UnitHistory_unitId_createdAt_idx" ON "UnitHistory"("unitId", "createdAt");
