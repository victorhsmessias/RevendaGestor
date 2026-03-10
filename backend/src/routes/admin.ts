import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { ForbiddenError } from '../lib/errors'
import { z } from 'zod'

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)
}

function requireSuperAdmin(email: string) {
  if (!getAdminEmails().includes(email)) {
    throw new ForbiddenError('Acesso restrito a administradores do sistema')
  }
}

export async function adminRoutes(fastify: FastifyInstance) {

  // GET /api/admin/stats - Estatísticas gerais do sistema
  fastify.get('/admin/stats', async (request) => {
    requireSuperAdmin(request.user.email)

    const [totalTenants, tenantsByStatus, totalUsers, totalVendas] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.groupBy({
        by: ['planStatus'],
        _count: true,
      }),
      prisma.user.count(),
      prisma.venda.count({ where: { deletedAt: null } }),
    ])

    const statusMap: Record<string, number> = {}
    for (const s of tenantsByStatus) {
      statusMap[s.planStatus] = s._count
    }

    return {
      totalTenants,
      totalUsers,
      totalVendas,
      tenantsByStatus: statusMap,
    }
  })

  // GET /api/admin/tenants - Listar todos os tenants
  fastify.get('/admin/tenants', async (request) => {
    requireSuperAdmin(request.user.email)

    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            users: true,
            clientes: true,
            produtos: true,
            vendas: true,
          },
        },
        users: {
          where: { role: 'OWNER' },
          select: { name: true, email: true },
          take: 1,
        },
      },
    })

    return tenants.map(t => ({
      id: t.id,
      name: t.name,
      planStatus: t.planStatus,
      trialEndsAt: t.trialEndsAt,
      asaasSubscriptionId: t.asaasSubscriptionId,
      createdAt: t.createdAt,
      owner: t.users[0] || null,
      _count: t._count,
    }))
  })

  // GET /api/admin/tenants/:id - Detalhes de um tenant
  fastify.get('/admin/tenants/:id', async (request) => {
    requireSuperAdmin(request.user.email)

    const { id } = request.params as { id: string }

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true, createdAt: true },
        },
        _count: {
          select: {
            clientes: true,
            fornecedores: true,
            produtos: true,
            vendas: true,
            contasPagar: true,
          },
        },
      },
    })

    if (!tenant) throw new ForbiddenError('Tenant não encontrado')

    return tenant
  })

  // PATCH /api/admin/tenants/:id - Alterar status do tenant
  fastify.patch('/admin/tenants/:id', async (request) => {
    requireSuperAdmin(request.user.email)

    const { id } = request.params as { id: string }
    const schema = z.object({
      planStatus: z.enum(['TRIAL', 'ACTIVE', 'PAUSED', 'CANCELLED']).optional(),
      trialEndsAt: z.string().datetime().optional(),
    })

    const data = schema.parse(request.body)

    const updated = await prisma.tenant.update({
      where: { id },
      data: {
        ...(data.planStatus && { planStatus: data.planStatus }),
        ...(data.trialEndsAt && { trialEndsAt: new Date(data.trialEndsAt) }),
      },
      select: {
        id: true,
        name: true,
        planStatus: true,
        trialEndsAt: true,
      },
    })

    return updated
  })
}
