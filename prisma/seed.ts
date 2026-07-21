import { PrismaClient, Role } from '../app/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Mulai seeding database SIARTA untuk Production...')

  console.log('✅ Skrip seeding selesai. Tabel sudah bersih dan siap digunakan.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
