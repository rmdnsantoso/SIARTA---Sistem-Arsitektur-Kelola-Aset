const { PrismaClient } = require('./app/generated/prisma');
const prisma = new PrismaClient();

async function main() {
  console.log('Menghapus data dummy transaksional...');
  
  // Hapus semua log dan record yang bergantung pada Asset/Ticket
  await prisma.trackingLog.deleteMany({});
  await prisma.maintenancePhoto.deleteMany({});
  await prisma.maintenanceItem.deleteMany({});
  
  // Hapus entitas utama
  await prisma.ticket.deleteMany({});
  await prisma.maintenanceRecord.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.notification.deleteMany({});
  
  // Kita JANGAN menghapus User, agar Anda tetap bisa login ke dalam aplikasi
  // (Jika Anda ingin User juga dihapus, beri tahu saya)
  
  console.log('✅ Seluruh data dummy (Tiket, Aset, Notifikasi, Laporan) berhasil dibersihkan!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
