import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import {
  createClienteSchema,
  updateClienteSchema,
  paginationSchema,
  type CreateCliente,
  type UpdateCliente,
} from '../lib/validators'

export async function clienteRoutes(fastify: FastifyInstance) {

  // POST /api/clientes
  fastify.post<{ Body: CreateCliente }>('/clientes', async (request, reply) => {
    const data = createClienteSchema.parse(request.body)

    const result = await prisma.cliente.create({
      data: {
        ...data,
        tenantId: request.tenantId,
      },
    })

    request.log.info({ clienteId: result.id }, 'Cliente criado')
    return reply.code(201).send(result)
  })

  // GET /api/clientes
  fastify.get('/clientes', async (request) => {
    const { page, limit, search } = paginationSchema.parse(request.query)

    const where = {
      tenantId: request.tenantId,
      deletedAt: null,
      ...(search && {
        name: { contains: search, mode: 'insensitive' as const },
      }),
    }

    const [items, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.cliente.count({ where }),
    ])

    return {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    }
  })

  // GET /api/clientes/:id
  fastify.get<{ Params: { id: string } }>('/clientes/:id', async (request, reply) => {
    const item = await prisma.cliente.findFirst({
      where: {
        id: request.params.id,
        tenantId: request.tenantId,
        deletedAt: null,
      },
    })

    if (!item) return reply.code(404).send({ error: 'Cliente não encontrado' })
    return item
  })

  // PATCH /api/clientes/:id
  fastify.patch<{ Params: { id: string }; Body: UpdateCliente }>(
    '/clientes/:id',
    async (request, reply) => {
      const data = updateClienteSchema.parse(request.body)

      const exists = await prisma.cliente.findFirst({
        where: { id: request.params.id, tenantId: request.tenantId, deletedAt: null },
      })
      if (!exists) return reply.code(404).send({ error: 'Cliente não encontrado' })

      const result = await prisma.cliente.update({
        where: { id: request.params.id },
        data,
      })

      return result
    }
  )

  // DELETE /api/clientes/:id (soft delete)
  fastify.delete<{ Params: { id: string } }>('/clientes/:id', async (request, reply) => {
    const exists = await prisma.cliente.findFirst({
      where: { id: request.params.id, tenantId: request.tenantId, deletedAt: null },
    })
    if (!exists) return reply.code(404).send({ error: 'Cliente não encontrado' })

    await prisma.cliente.update({
      where: { id: request.params.id },
      data: { deletedAt: new Date() },
    })

    request.log.info({ clienteId: request.params.id }, 'Cliente removido')
    return { message: 'Cliente removido com sucesso' }
  })
}
