-- CreateTable
CREATE TABLE "TesKoneksi" (
    "id" SERIAL NOT NULL,
    "pesan" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TesKoneksi_pkey" PRIMARY KEY ("id")
);
