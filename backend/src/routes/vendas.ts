import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { createVendaSchema, paginationSchema, type CreateVenda } from '../lib/validators'

export async function vendaRoutes(fastify: FastifyInstance) {

  // POST /api/vendas — Cria venda (com produtos OU valor manual)
  fastify.post<{ Body: CreateVenda }>('/vendas', async (request, reply) => {
    const data = createVendaSchema.parse(request.body)

    const isManual = !data.items || data.items.length === 0
    const hasItems = data.items && data.items.length > 0

    // Validar: precisa ter itens OU valor manual
    if (isManual && !data.valorManual) {
      return reply.code(400).send({ error: 'Informe os produtos ou o valor manual da venda' })
    }

    // Verificar se cliente pertence ao tenant
    const cliente = await prisma.cliente.findFirst({
      where: { id: data.clienteId, tenantId: request.tenantId, deletedAt: null },
    })
    if (!cliente) return reply.code(400).send({ error: 'Cliente nao encontrado' })

    let subtotal: number
    let produtos: { id: string; name: string; quantity: number }[] = []

    if (hasItems) {
      // Modo com produtos: validar estoque
      const produtoIds = data.items!.map(i => i.produtoId)
      produtos = await prisma.produto.findMany({
        where: { id: { in: produtoIds }, tenantId: request.tenantId, deletedAt: null },
        select: { id: true, name: true, quantity: true },
      })

      if (produtos.length !== produtoIds.length) {
        return reply.code(400).send({ error: 'Um ou mais produtos nao encontrados' })
      }

      for (const item of data.items!) {
        const produto = produtos.find(p => p.id === item.produtoId)!
        if (produto.quantity < item.quantity) {
          return reply.code(400).send({
            error: `Estoque insuficiente para "${produto.name}". Disponivel: ${produto.quantity}`,
          })
        }
      }

      subtotal = data.items!.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
    } else {
      // Modo manual: usar valor informado
      subtotal = data.valorManual!
    }

    const total = subtotal - (data.discount || 0)

    if (total <= 0) {
      return reply.code(400).send({ error: 'Total da venda deve ser maior que zero' })
    }

    // Gerar parcelas
    const valorParcela = Math.round((total / data.parcelas) * 100) / 100
    const hoje = new Date()
    const parcelasData = Array.from({ length: data.parcelas }, (_, i) => {
      const dataVencimento = new Date(hoje)
      dataVencimento.setMonth(dataVencimento.getMonth() + i + 1)
      const valor = i === data.parcelas - 1
        ? Math.round((total - valorParcela * (data.parcelas - 1)) * 100) / 100
        : valorParcela

      return {
        tenantId: request.tenantId,
        numero: i + 1,
        valor,
        dataVencimento,
        status: 'PENDING' as const,
      }
    })

    const isAVista = data.formaPagamento === 'DINHEIRO' || data.formaPagamento === 'PIX'

    // Montar notes (inclui descricao manual se houver)
    const notes = [data.descricaoManual, data.notes].filter(Boolean).join(' | ') || undefined

    const result = await prisma.$transaction(async (tx) => {
      const venda = await tx.venda.create({
        data: {
          tenantId: request.tenantId,
          clienteId: data.clienteId,
          subtotal,
          discount: data.discount || 0,
          total,
          formaPagamento: data.formaPagamento,
          status: isAVista ? 'PAID' : 'PENDING',
          notes,
          ...(hasItems && {
            items: {
              create: data.items!.map(item => ({
                produtoId: item.produtoId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.unitPrice * item.quantity,
              })),
            },
          }),
          parcelas: {
            create: parcelasData.map(p => ({
              ...p,
              status: isAVista ? 'PAID' as const : 'PENDING' as const,
              dataPagamento: isAVista ? hoje : null,
            })),
          },
        },
        include: {
          cliente: { select: { id: true, name: true } },
          items: { include: { produto: { select: { id: true, name: true, code: true } } } },
          parcelas: true,
        },
      })

      // Descontar estoque apenas se tem itens
      if (hasItems) {
        for (const item of data.items!) {
          await tx.produto.update({
            where: { id: item.produtoId },
            data: { quantity: { decrement: item.quantity } },
          })
        }
      }

      return venda
    })

    request.log.info({ vendaId: result.id, total, manual: isManual }, 'Venda criada')
    return reply.code(201).send(result)
  })

  // GET /api/vendas — Lista paginada (suporta filtro por clienteId)
  fastify.get('/vendas', async (request) => {
    const { page, limit, search } = paginationSchema.parse(request.query)
    const query = request.query as Record<string, string>
    const statusFilter = query.status
    const clienteIdFilter = query.clienteId

    const where = {
      tenantId: request.tenantId,
      deletedAt: null,
      ...(statusFilter && { status: statusFilter as 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED' }),
      ...(clienteIdFilter && { clienteId: clienteIdFilter }),
      ...(search && {
        cliente: { name: { contains: search, mode: 'insensitive' as const } },
      }),
    }

    const [items, total] = await Promise.all([
      prisma.venda.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          cliente: { select: { id: true, name: true } },
          _count: { select: { items: true, parcelas: true } },
        },
      }),
      prisma.venda.count({ where }),
    ])

    return {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    }
  })

  // GET /api/vendas/por-cliente — Vendas agrupadas por cliente (com vendas incluídas)
  fastify.get('/vendas/por-cliente', async (request) => {
    const { page, limit, search } = paginationSchema.parse(request.query)

    const whereCliente = {
      tenantId: request.tenantId,
      deletedAt: null,
      vendas: {
        some: { deletedAt: null },
      },
      ...(search && {
        name: { contains: search, mode: 'insensitive' as const },
      }),
    }

    const [clientes, total] = await Promise.all([
      prisma.cliente.findMany({
        where: whereCliente,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          phone: true,
          _count: {
            select: { vendas: { where: { deletedAt: null } } },
          },
          vendas: {
            where: { deletedAt: null },
            select: {
              id: true,
              total: true,
              status: true,
              formaPagamento: true,
              createdAt: true,
              _count: { select: { items: true, parcelas: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      }),
      prisma.cliente.count({ where: whereCliente }),
    ])

    const items = clientes.map(c => {
      const totalValor = c.vendas.reduce((sum, v) => sum + v.total, 0)
      const totalPendente = c.vendas
        .filter(v => v.status === 'PENDING' || v.status === 'PARTIAL')
        .reduce((sum, v) => sum + v.total, 0)

      return {
        clienteId: c.id,
        clienteName: c.name,
        clientePhone: c.phone,
        totalVendas: c._count.vendas,
        totalValor,
        totalPendente,
        ultimaVenda: c.vendas[0]?.createdAt || null,
        vendas: c.vendas.map(v => ({
          id: v.id,
          total: v.total,
          status: v.status,
          formaPagamento: v.formaPagamento,
          createdAt: v.createdAt,
          _count: v._count,
          cliente: { id: c.id, name: c.name },
        })),
      }
    })

    return {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    }
  })

  // GET /api/vendas/:id — Detalhe completo
  fastify.get<{ Params: { id: string } }>('/vendas/:id', async (request, reply) => {
    const venda = await prisma.venda.findFirst({
      where: {
        id: request.params.id,
        tenantId: request.tenantId,
        deletedAt: null,
      },
      include: {
        cliente: { select: { id: true, name: true, phone: true } },
        items: {
          include: { produto: { select: { id: true, name: true, code: true } } },
        },
        parcelas: { orderBy: { numero: 'asc' } },
      },
    })

    if (!venda) return reply.code(404).send({ error: 'Venda nao encontrada' })
    return venda
  })

  // PATCH /api/vendas/:id/parcelas/:parcelaId/pagar — Marcar parcela como paga
  fastify.patch<{ Params: { id: string; parcelaId: string } }>(
    '/vendas/:id/parcelas/:parcelaId/pagar',
    async (request, reply) => {
      const venda = await prisma.venda.findFirst({
        where: { id: request.params.id, tenantId: request.tenantId, deletedAt: null },
        include: { parcelas: true },
      })
      if (!venda) return reply.code(404).send({ error: 'Venda nao encontrada' })

      const parcela = venda.parcelas.find(p => p.id === request.params.parcelaId)
      if (!parcela) return reply.code(404).send({ error: 'Parcela nao encontrada' })
      if (parcela.status === 'PAID') return reply.code(400).send({ error: 'Parcela ja esta paga' })

      await prisma.$transaction(async (tx) => {
        // Marcar parcela como paga
        await tx.parcela.update({
          where: { id: parcela.id },
          data: { status: 'PAID', dataPagamento: new Date() },
        })

        // Verificar se todas parcelas estao pagas
        const pendentes = venda.parcelas.filter(
          p => p.id !== parcela.id && p.status !== 'PAID'
        ).length

        // Atualizar status da venda
        await tx.venda.update({
          where: { id: venda.id },
          data: { status: pendentes === 0 ? 'PAID' : 'PARTIAL' },
        })
      })

      request.log.info({ vendaId: venda.id, parcelaId: parcela.id }, 'Parcela paga')
      return { message: 'Parcela marcada como paga' }
    }
  )

  // DELETE /api/vendas/:id — Cancelar venda (soft delete + devolver estoque)
  fastify.delete<{ Params: { id: string } }>('/vendas/:id', async (request, reply) => {
    const venda = await prisma.venda.findFirst({
      where: { id: request.params.id, tenantId: request.tenantId, deletedAt: null },
      include: { items: true },
    })
    if (!venda) return reply.code(404).send({ error: 'Venda nao encontrada' })

    await prisma.$transaction(async (tx) => {
      // Cancelar venda
      await tx.venda.update({
        where: { id: venda.id },
        data: { deletedAt: new Date(), status: 'CANCELLED' },
      })

      // Devolver estoque
      for (const item of venda.items) {
        await tx.produto.update({
          where: { id: item.produtoId },
          data: { quantity: { increment: item.quantity } },
        })
      }

      // Cancelar parcelas pendentes
      await tx.parcela.updateMany({
        where: { vendaId: venda.id, status: 'PENDING' },
        data: { status: 'PAID' },
      })
    })

    request.log.info({ vendaId: venda.id }, 'Venda cancelada')
    return { message: 'Venda cancelada com sucesso' }
  })
}
