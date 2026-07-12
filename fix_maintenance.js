const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const result = await prisma.asset.updateMany({
    where: { status: 'Maintenance' },
    data: { status: 'Available' }
  })
  console.log(`Updated ${result.count} assets from Maintenance to Available.`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
