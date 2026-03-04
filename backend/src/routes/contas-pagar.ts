import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import {
  createContaPagarSchema,
  updateContaPagarSchema,
  paginationSchema,
  type CreateContaPagar,
  type UpdateContaPagar,
} from '../lib/validators'

export async function contaPagarRoutes(fastify: FastifyInstance) {

  // POST /api/contas-pagar
  fastify.post<{ Body: CreateContaPagar }>('/contas-pagar', async (request, reply) => {
    const data = createContaPagarSchema.parse(request.body)

    // Validar fornecedor se informado
    if (data.fornecedorId) {
      const fornecedor = await prisma.fornecedor.findFirst({
        where: { id: data.fornecedorId, tenantId: request.tenantId, deletedAt: null },
      })
      if (!fornecedor) return reply.code(400).send({ error: 'Fornecedor nao encontrado' })
    }

    const result = await prisma.contaPagar.create({
      data: {
        tenantId: request.tenantId,
        fornecedorId: data.fornecedorId || null,
        description: data.description,
        valor: data.valor,
        dataVencimento: new Date(data.dataVencimento),
        notes: data.notes,
      },
      include: { fornecedor: { select: { id: true, name: true } } },
    })

    request.log.info({ contaId: result.id }, 'Conta a pagar criada')
    return reply.code(201).send(result)
  })

  // GET /api/contas-pagar
  fastify.get('/contas-pagar', async (request) => {
    const { page, limit, search } = paginationSchema.parse(request.query)
    const statusFilter = (request.query as Record<string, string>).status

    const where = {
      tenantId: request.tenantId,
      ...(statusFilter && { status: statusFilter as 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' }),
      ...(search && {
        description: { contains: search, mode: 'insensitive' as const },
      }),
    }

    const [items, total] = await Promise.all([
      prisma.contaPagar.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { dataVencimento: 'asc' },
        include: { fornecedor: { select: { id: true, name: true } } },
      }),
      prisma.contaPagar.count({ where }),
    ])

    return {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    }
  })

  // GET /api/contas-pagar/:id
  fastify.get<{ Params: { id: string } }>('/contas-pagar/:id', async (request, reply) => {
    const item = await prisma.contaPagar.findFirst({
      where: { id: request.params.id, tenantId: request.tenantId },
      include: { fornecedor: { select: { id: true, name: true } } },
    })
    if (!item) return reply.code(404).send({ error: 'Conta nao encontrada' })
    return item
  })

  // PATCH /api/contas-pagar/:id
  fastify.patch<{ Params: { id: string }; Body: UpdateContaPagar }>(
    '/contas-pagar/:id',
    async (request, reply) => {
      const data = updateContaPagarSchema.parse(request.body)

      const exists = await prisma.contaPagar.findFirst({
        where: { id: request.params.id, tenantId: request.tenantId },
      })
      if (!exists) return reply.code(404).send({ error: 'Conta nao encontrada' })

      const updateData: Record<string, unknown> = { ...data }
      if (data.dataVencimento) updateData.dataVencimento = new Date(data.dataVencimento)
      if (data.fornecedorId === '') updateData.fornecedorId = null

      const result = await prisma.contaPagar.update({
        where: { id: request.params.id },
        data: updateData,
        include: { fornecedor: { select: { id: true, name: true } } },
      })
      return result
    }
  )

  // PATCH /api/contas-pagar/:id/pagar — Marcar como paga
  fastify.patch<{ Params: { id: string } }>(
    '/contas-pagar/:id/pagar',
    async (request, reply) => {
      const exists = await prisma.contaPagar.findFirst({
        where: { id: request.params.id, tenantId: request.tenantId },
      })
      if (!exists) return reply.code(404).send({ error: 'Conta nao encontrada' })
      if (exists.status === 'PAID') return reply.code(400).send({ error: 'Conta ja esta paga' })

      await prisma.contaPagar.update({
        where: { id: request.params.id },
        data: { status: 'PAID', dataPagamento: new Date() },
      })

      request.log.info({ contaId: request.params.id }, 'Conta paga')
      return { message: 'Conta marcada como paga' }
    }
  )

  // DELETE /api/contas-pagar/:id
  fastify.delete<{ Params: { id: string } }>('/contas-pagar/:id', async (request, reply) => {
    const exists = await prisma.contaPagar.findFirst({
      where: { id: request.params.id, tenantId: request.tenantId },
    })
    if (!exists) return reply.code(404).send({ error: 'Conta nao encontrada' })

    await prisma.contaPagar.update({
      where: { id: request.params.id },
      data: { status: 'CANCELLED' },
    })

    request.log.info({ contaId: request.params.id }, 'Conta cancelada')
    return { message: 'Conta cancelada' }
  })
}
