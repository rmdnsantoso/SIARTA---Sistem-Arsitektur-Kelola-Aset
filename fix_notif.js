const { PrismaClient } = require('./app/generated/prisma');
const prisma = new PrismaClient();

async function main() {
  const notifs = await prisma.notification.findMany();
  for (const n of notifs) {
    let newMsg = n.message;
    
    // Fix "Role: Name" -> "Name (Role)"
    const roles = ['Admin', 'HSSE', 'Area Head', 'AreaHead', 'Peminjam'];
    for (const r of roles) {
      const regex = new RegExp(`${r}:\\s*([A-Za-z0-9\\s]+?)(?=\\s+dan|\\.\\s|$)`, 'g');
      newMsg = newMsg.replace(regex, (match, name) => {
        const displayRole = r === 'AreaHead' ? 'Area Head' : r;
        return `${name.trim()} (${displayRole})`;
      });
    }

    // Fix the specific case of Muhammad Romadhon S missing role
    if (newMsg.includes('diselesaikan oleh Muhammad Romadhon S') && !newMsg.includes('(Admin)')) {
      newMsg = newMsg.replace('diselesaikan oleh Muhammad Romadhon S', 'diselesaikan oleh Muhammad Romadhon S (Admin)');
    }

    // Fix any remaining old formats like "oleh Admin: Nama"
    newMsg = newMsg.replace(/oleh Admin:\s+([A-Za-z0-9\s]+?)(?=\s+dan|\.\s|$)/g, 'oleh $1 (Admin)');
    newMsg = newMsg.replace(/oleh HSSE:\s+([A-Za-z0-9\s]+?)(?=\s+dan|\.\s|$)/g, 'oleh $1 (HSSE)');
    newMsg = newMsg.replace(/oleh Area Head:\s+([A-Za-z0-9\s]+?)(?=\s+dan|\.\s|$)/g, 'oleh $1 (Area Head)');

    if (newMsg !== n.message) {
      await prisma.notification.update({
        where: { id: n.id },
        data: { message: newMsg }
      });
      console.log(`Updated: ${n.message} \n-> ${newMsg}\n`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
