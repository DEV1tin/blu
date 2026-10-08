'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

// Simulação de Autenticação: Assumindo que o Victor está logado
const MOCK_USER_EMAIL = 'vitor@exemplo.com'

export async function authenticate(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return { success: false, message: 'Email não encontrado' }
  if (user.password !== password) return { success: false, message: 'Senha incorreta' }
  
  return { success: true, user: { id: user.id, name: user.name, email: user.email } }
}

export async function getCurrentUser() {
  const user = await prisma.user.findUnique({
    where: { email: MOCK_USER_EMAIL },
    include: { profile: true }
  })
  return user
}

export async function getConfigMedico() {
  const user = await getCurrentUser()
  if (!user) return null;
  
  const doctor = await prisma.user.findUnique({
    where: { id: user.profile?.doctorId || '' }
  })

  return {
    nomeMedico: doctor?.name || "Dr. Bruno",
    paciente: user.name || "Vitor H.",
    modulosAtivos: user.profile?.modulosAtivos ? JSON.parse(user.profile.modulosAtivos) : {},
    sentimentosConfigurados: [
      { label: "Ansiedade", color: "text-red-400 border-red-500/30", activeBg: "bg-red-500/20" },
      { label: "Taquicardia", color: "text-orange-400 border-orange-500/30", activeBg: "bg-orange-500/20" },
      { label: "Eufórico/Acelerado", color: "text-purple-400 border-purple-500/30", activeBg: "bg-purple-500/20" },
      { label: "Irritabilidade", color: "text-yellow-400 border-yellow-500/30", activeBg: "bg-yellow-500/20" },
      { label: "Fadiga", color: "text-gray-400 border-slate-500/30", activeBg: "bg-slate-500/20" }
    ]
  }
}

export async function addRegistro(data: {
  tipo: string;
  titulo: string;
  detalhe?: string;
  emoji?: string;
  qualidade?: string;
  hora?: string;
}) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Usuário não encontrado')

  const registro = await prisma.registro.create({
    data: {
      ...data,
      patientId: user.id
    }
  })

  revalidatePath('/')
  revalidatePath('/registros')
  return registro
}

export async function getRegistros() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Usuário não encontrado')

  const registros = await prisma.registro.findMany({
    where: { patientId: user.id }
  })
  
  // Ordena por horário (do mais cedo pro mais tarde), colocando SONO primeiro
  registros.sort((a, b) => {
    if (a.tipo === 'SONO' && b.tipo !== 'SONO') return -1;
    if (b.tipo === 'SONO' && a.tipo !== 'SONO') return 1;
    
    const timeA = a.hora || '00:00';
    const timeB = b.hora || '00:00';
    return timeA.localeCompare(timeB);
  })

  return registros
}

export async function addWoop(data: {
  wish: string;
  outcome: string;
  obstacle: string;
  plan: string;
}) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Usuário não encontrado')

  const woop = await prisma.woop.create({
    data: {
      ...data,
      patientId: user.id
    }
  })

  revalidatePath('/woop')
  return woop
}

export async function getWoops() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Usuário não encontrado')

  const woops = await prisma.woop.findMany({
    where: { patientId: user.id, active: true },
    orderBy: { createdAt: 'desc' }
  })
  
  return woops
}
