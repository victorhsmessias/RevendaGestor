import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import bcrypt from 'bcrypt'
import {
  updateProfileSchema,
  changePasswordSchema,
  updateTenantSchema,
  type UpdateProfile,
  type ChangePassword,
  type UpdateTenant,
} from '../lib/validators'

export async function configuracaoRoutes(fastify: FastifyInstance) {

  // PATCH /api/configuracoes/perfil — Atualizar nome e email do usuario
  fastify.patch<{ Body: UpdateProfile }>('/configuracoes/perfil', async (request, reply) => {
    const data = updateProfileSchema.parse(request.body)
    const userId = request.user.id

    // Se mudou email, verificar se ja existe
    if (data.email) {
      const existing = await prisma.user.findFirst({
        where: { email: data.email, id: { not: userId } },
      })
      if (existing) return reply.code(409).send({ error: 'Email ja esta em uso' })
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name: data.name, email: data.email },
      select: { id: true, name: true, email: true, role: true },
    })

    request.log.info({ userId }, 'Perfil atualizado')
    return user
  })

  // PATCH /api/configuracoes/senha — Alterar senha
  fastify.patch<{ Body: ChangePassword }>('/configuracoes/senha', async (request, reply) => {
    const data = changePasswordSchema.parse(request.body)
    const userId = request.user.id

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return reply.code(404).send({ error: 'Usuario nao encontrado' })

    const validPassword = await bcrypt.compare(data.currentPassword, user.password)
    if (!validPassword) return reply.code(400).send({ error: 'Senha atual incorreta' })

    const hashedPassword = await bcrypt.hash(data.newPassword, 10)
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    request.log.info({ userId }, 'Senha alterada')
    return { message: 'Senha alterada com sucesso' }
  })

  // GET /api/configuracoes/tenant — Dados do tenant
  fastify.get('/configuracoes/tenant', async (request, reply) => {
    const tenantId = request.tenantId || request.user.tenantId
    if (!tenantId) return reply.code(400).send({ error: 'TenantId nao encontrado' })

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, planStatus: true, trialEndsAt: true, createdAt: true },
    })
    if (!tenant) return reply.code(404).send({ error: 'Tenant nao encontrado' })

    const users = await prisma.user.count({ where: { tenantId } })
    const clientes = await prisma.cliente.count({ where: { tenantId, deletedAt: null } })
    const fornecedores = await prisma.fornecedor.count({ where: { tenantId, deletedAt: null } })
    const produtos = await prisma.produto.count({ where: { tenantId, deletedAt: null } })
    const vendas = await prisma.venda.count({ where: { tenantId, deletedAt: null } })

    return {
      ...tenant,
      _count: { users, clientes, fornecedores, produtos, vendas },
    }
  })

  // PATCH /api/configuracoes/tenant — Atualizar nome do tenant
  fastify.patch<{ Body: UpdateTenant }>('/configuracoes/tenant', async (request, reply) => {
    const data = updateTenantSchema.parse(request.body)

    // Apenas OWNER pode alterar dados do tenant
    if (request.user.role !== 'OWNER') {
      return reply.code(403).send({ error: 'Apenas o proprietario pode alterar configuracoes da loja' })
    }

    const tenant = await prisma.tenant.update({
      where: { id: request.tenantId || request.user.tenantId },
      data: { name: data.name },
      select: { id: true, name: true, planStatus: true },
    })

    request.log.info({ tenantId: tenant.id }, 'Tenant atualizado')
    return tenant
  })
}
