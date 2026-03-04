import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import {
  createProdutoSchema,
  updateProdutoSchema,
  paginationSchema,
  type UpdateProduto,
} from '../lib/validators'

export async function produtoRoutes(fastify: FastifyInstance) {

  // POST /api/produtos
  fastify.post('/produtos', async (request, reply) => {
    const data = createProdutoSchema.parse(request.body)

    // Verificar se fornecedor pertence ao tenant
    const fornecedor = await prisma.fornecedor.findFirst({
      where: { id: data.fornecedorId, tenantId: request.tenantId, deletedAt: null },
    })
    if (!fornecedor) return reply.code(400).send({ error: 'Fornecedor não encontrado' })

    const result = await prisma.produto.create({
      data: {
        ...data,
        tenantId: request.tenantId,
      },
      include: { fornecedor: { select: { id: true, name: true } } },
    })

    request.log.info({ produtoId: result.id }, 'Produto criado')
    return reply.code(201).send(result)
  })

  // GET /api/produtos
  fastify.get('/produtos', async (request) => {
    const { page, limit, search } = paginationSchema.parse(request.query)

    const where = {
      tenantId: request.tenantId,
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { code: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [items, total] = await Promise.all([
      prisma.produto.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { fornecedor: { select: { id: true, name: true } } },
      }),
      prisma.produto.count({ where }),
    ])

    return {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    }
  })

  // GET /api/produtos/:id
  fastify.get<{ Params: { id: string } }>('/produtos/:id', async (request, reply) => {
    const item = await prisma.produto.findFirst({
      where: {
        id: request.params.id,
        tenantId: request.tenantId,
        deletedAt: null,
      },
      include: { fornecedor: { select: { id: true, name: true } } },
    })

    if (!item) return reply.code(404).send({ error: 'Produto não encontrado' })
    return item
  })

  // PATCH /api/produtos/:id
  fastify.patch<{ Params: { id: string }; Body: UpdateProduto }>(
    '/produtos/:id',
    async (request, reply) => {
      const data = updateProdutoSchema.parse(request.body)

      const exists = await prisma.produto.findFirst({
        where: { id: request.params.id, tenantId: request.tenantId, deletedAt: null },
      })
      if (!exists) return reply.code(404).send({ error: 'Produto não encontrado' })

      // Se trocou fornecedor, verificar se pertence ao tenant
      if (data.fornecedorId) {
        const fornecedor = await prisma.fornecedor.findFirst({
          where: { id: data.fornecedorId, tenantId: request.tenantId, deletedAt: null },
        })
        if (!fornecedor) return reply.code(400).send({ error: 'Fornecedor não encontrado' })
      }

      const result = await prisma.produto.update({
        where: { id: request.params.id },
        data,
        include: { fornecedor: { select: { id: true, name: true } } },
      })

      return result
    }
  )

  // DELETE /api/produtos/:id (soft delete)
  fastify.delete<{ Params: { id: string } }>('/produtos/:id', async (request, reply) => {
    const exists = await prisma.produto.findFirst({
      where: { id: request.params.id, tenantId: request.tenantId, deletedAt: null },
    })
    if (!exists) return reply.code(404).send({ error: 'Produto não encontrado' })

    // Verificar se tem itens de venda vinculados
    const vendasCount = await prisma.vendaItem.count({
      where: { produtoId: request.params.id },
    })
    if (vendasCount > 0) {
      return reply.code(400).send({
        error: `Não é possível remover. Produto possui ${vendasCount} venda(s) vinculada(s).`,
      })
    }

    await prisma.produto.update({
      where: { id: request.params.id },
      data: { deletedAt: new Date() },
    })

    request.log.info({ produtoId: request.params.id }, 'Produto removido')
    return { message: 'Produto removido com sucesso' }
  })
}
