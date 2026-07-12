import { prisma } from './lib/prisma'

async function main() {
  const assets = await prisma.asset.findMany({
    select: { name: true, quantity: true, isSerialized: true }
  })
  console.log(assets)
}

main().catch(console.error).finally(() => prisma.$disconnect())
