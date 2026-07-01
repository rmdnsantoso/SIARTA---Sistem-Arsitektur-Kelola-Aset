import { PrismaClient } from '../app/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log("Wiping dummy data...")
  await prisma.trackingLog.deleteMany({})
  await prisma.ticket.deleteMany({})
  await prisma.asset.deleteMany({})
  console.log("All dummy data wiped.")
}

main().catch(console.error).finally(() => prisma.$disconnect())
