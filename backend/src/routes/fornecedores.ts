import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import {
  createFornecedorSchema,
  updateFornecedorSchema,
  paginationSchema,
  type CreateFornecedor,
  type UpdateFornecedor,
} from '../lib/validators'

export async function fornecedorRoutes(fastify: FastifyInstance) {

  // POST /api/fornecedores
  fastify.post<{ Body: CreateFornecedor }>('/fornecedores', async (request, reply) => {
    const data = createFornecedorSchema.parse(request.body)

    const result = await prisma.fornecedor.create({
      data: {
        ...data,
        tenantId: request.tenantId,
      },
    })

    request.log.info({ fornecedorId: result.id }, 'Fornecedor criado')
    return reply.code(201).send(result)
  })

  // GET /api/fornecedores
  fastify.get('/fornecedores', async (request) => {
    const { page, limit, search } = paginationSchema.parse(request.query)

    const where = {
      tenantId: request.tenantId,
      deletedAt: null,
      ...(search && {
        name: { contains: search, mode: 'insensitive' as const },
      }),
    }

    const [items, total] = await Promise.all([
      prisma.fornecedor.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.fornecedor.count({ where }),
    ])

    return {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    }
  })

  // GET /api/fornecedores/all (sem paginação, para selects)
  fastify.get('/fornecedores/all', async (request) => {
    const items = await prisma.fornecedor.findMany({
      where: { tenantId: request.tenantId, deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })
    return items
  })

  // GET /api/fornecedores/:id
  fastify.get<{ Params: { id: string } }>('/fornecedores/:id', async (request, reply) => {
    const item = await prisma.fornecedor.findFirst({
      where: {
        id: request.params.id,
        tenantId: request.tenantId,
        deletedAt: null,
      },
    })

    if (!item) return reply.code(404).send({ error: 'Fornecedor não encontrado' })
    return item
  })

  // PATCH /api/fornecedores/:id
  fastify.patch<{ Params: { id: string }; Body: UpdateFornecedor }>(
    '/fornecedores/:id',
    async (request, reply) => {
      const data = updateFornecedorSchema.parse(request.body)

      const exists = await prisma.fornecedor.findFirst({
        where: { id: request.params.id, tenantId: request.tenantId, deletedAt: null },
      })
      if (!exists) return reply.code(404).send({ error: 'Fornecedor não encontrado' })

      const result = await prisma.fornecedor.update({
        where: { id: request.params.id },
        data,
      })

      return result
    }
  )

  // DELETE /api/fornecedores/:id (soft delete)
  fastify.delete<{ Params: { id: string } }>('/fornecedores/:id', async (request, reply) => {
    const exists = await prisma.fornecedor.findFirst({
      where: { id: request.params.id, tenantId: request.tenantId, deletedAt: null },
    })
    if (!exists) return reply.code(404).send({ error: 'Fornecedor não encontrado' })

    // Verificar se tem produtos vinculados
    const produtosCount = await prisma.produto.count({
      where: { fornecedorId: request.params.id, deletedAt: null },
    })
    if (produtosCount > 0) {
      return reply.code(400).send({
        error: `Não é possível remover. Fornecedor possui ${produtosCount} produto(s) vinculado(s).`,
      })
    }

    await prisma.fornecedor.update({
      where: { id: request.params.id },
      data: { deletedAt: new Date() },
    })

    request.log.info({ fornecedorId: request.params.id }, 'Fornecedor removido')
    return { message: 'Fornecedor removido com sucesso' }
  })
}
