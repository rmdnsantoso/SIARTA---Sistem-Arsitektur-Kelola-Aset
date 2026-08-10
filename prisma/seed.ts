import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('ðŸŒ± Mulai seeding database SIARTA untuk Production...')

  console.log('âœ… Skrip seeding selesai. Tabel sudah bersih dan siap digunakan.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
