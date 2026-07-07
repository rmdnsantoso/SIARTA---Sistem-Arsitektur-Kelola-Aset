const { PrismaClient } = require('./app/generated/prisma');
const prisma = new PrismaClient();

async function main() {
  await prisma.notification.deleteMany({});
  console.log('Cleared notifications');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
