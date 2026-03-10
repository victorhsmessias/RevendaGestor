import { buildApp } from '../src/app'
import { prisma } from '../src/lib/prisma'
import type { FastifyInstance } from 'fastify'

let app: FastifyInstance

export async function getApp() {
  if (!app) {
    app = await buildApp({ logger: false })
  }
  return app
}

export async function closeApp() {
  if (app) {
    await app.close()
  }
}

// Registrar um usuário e retornar token + dados
export async function registerUser(overrides?: {
  name?: string
  email?: string
  password?: string
  tenantName?: string
}) {
  const app = await getApp()
  const data = {
    name: overrides?.name || 'Test User',
    email: overrides?.email || `test-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`,
    password: overrides?.password || 'test123456',
    tenantName: overrides?.tenantName || 'Test Tenant',
  }

  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: data,
  })

  const body = JSON.parse(res.body)
  return {
    ...body,
    password: data.password,
    email: data.email,
    statusCode: res.statusCode,
  }
}

// Helper para fazer requests autenticadas
export async function authRequest(
  token: string,
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  url: string,
  payload?: unknown,
) {
  const app = await getApp()
  return app.inject({
    method,
    url,
    headers: {
      authorization: `Bearer ${token}`,
    },
    payload: payload as Record<string, unknown>,
  })
}

// Limpar dados de teste (por email pattern)
export async function cleanupTestData() {
  const testUsers = await prisma.user.findMany({
    where: { email: { contains: '@test.com' } },
    select: { id: true, tenantId: true },
  })

  const tenantIds = [...new Set(testUsers.map(u => u.tenantId))]
  const userIds = testUsers.map(u => u.id)

  if (tenantIds.length === 0) return

  // Deletar em ordem respeitando foreign keys
  await prisma.pagamento.deleteMany({ where: { tenantId: { in: tenantIds } } })
  await prisma.parcela.deleteMany({ where: { tenantId: { in: tenantIds } } })
  await prisma.venda.deleteMany({ where: { tenantId: { in: tenantIds } } })
  await prisma.contaPagar.deleteMany({ where: { tenantId: { in: tenantIds } } })
  await prisma.produto.deleteMany({ where: { tenantId: { in: tenantIds } } })
  await prisma.cliente.deleteMany({ where: { tenantId: { in: tenantIds } } })
  await prisma.fornecedor.deleteMany({ where: { tenantId: { in: tenantIds } } })
  await prisma.passwordReset.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.refreshToken.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.user.deleteMany({ where: { id: { in: userIds } } })
  await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } })
}
