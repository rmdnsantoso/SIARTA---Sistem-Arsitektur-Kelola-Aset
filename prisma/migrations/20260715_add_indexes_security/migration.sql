-- Migration: add_indexes_security
-- Menambahkan index database untuk optimasi query production

-- CreateIndex: ActivityLog - riwayat log per admin
CREATE INDEX "ActivityLog_actorId_idx" ON "ActivityLog"("actorId");

-- CreateIndex: ActivityLog - lookup riwayat per entitas
CREATE INDEX "ActivityLog_entityType_entityId_idx" ON "ActivityLog"("entityType", "entityId");

-- CreateIndex: ActivityLog - sorting & filter berdasarkan waktu
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex: LoginAttempt - cleanup data expired berdasarkan waktu
CREATE INDEX "LoginAttempt_resetAt_idx" ON "LoginAttempt"("resetAt");

-- CreateIndex: MaintenanceRecord - filter laporan aktif berdasarkan status
CREATE INDEX "MaintenanceRecord_status_idx" ON "MaintenanceRecord"("status");

-- CreateIndex: PhysicalUnit - filter unit tersedia per aset (composite index)
CREATE INDEX "PhysicalUnit_assetId_status_idx" ON "PhysicalUnit"("assetId", "status");
