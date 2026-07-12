import { prisma } from './lib/prisma'

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, nip: true, jabatan: true }
  })
  console.log(users)
}

main().catch(console.error).finally(() => prisma.$disconnect())
