import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

// Adicionar connection_limit na URL do Supabase para melhor performance
function getDatasourceUrl() {
  const url = process.env.DATABASE_URL || ''
  // Se já tem connection_limit, não modifica
  if (url.includes('connection_limit')) return url
  // Adicionar pool size otimizado
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}connection_limit=10&pool_timeout=20`
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasourceUrl: getDatasourceUrl(),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
