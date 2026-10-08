import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin_blue@exemplo.com' },
    update: {},
    create: {
      email: 'admin_blue@exemplo.com',
      name: 'Admin Bluey',
      role: 'ADMIN',
      password: 'password123',
    },
  })

  const doctor = await prisma.user.upsert({
    where: { email: 'drbruno@exemplo.com' },
    update: {},
    create: {
      email: 'drbruno@exemplo.com',
      name: 'Dr. Bruno',
      role: 'MEDICO',
      password: 'password123',
    },
  })

  const patient = await prisma.user.upsert({
    where: { email: 'victor@exemplo.com' },
    update: {},
    create: {
      email: 'vitor@exemplo.com',
      name: 'Vitor H.',
      role: 'PACIENTE',
      password: 'password123',
      profile: {
        create: {
          age: 28,
          doctorId: doctor.id,
          modulosAtivos: JSON.stringify({
            registroLivre: true,
            dosimetria: true,
            horasSono: true,
            sentimentos: true,
            woop: true
          })
        }
      }
    },
  })

  console.log({ admin, doctor, patient })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
