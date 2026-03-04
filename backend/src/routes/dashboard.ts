import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'

export async function dashboardRoutes(fastify: FastifyInstance) {

  // GET /api/dashboard
  fastify.get('/dashboard', async (request) => {
    const tenantId = request.tenantId

    // Periodo: mes atual
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    const [
      totalClientes,
      totalProdutos,
      produtosBaixoEstoque,
      vendasMes,
      contasPendentes,
      parcelasPendentes,
    ] = await Promise.all([
      // Total de clientes ativos
      prisma.cliente.count({
        where: { tenantId, deletedAt: null },
      }),

      // Total de produtos ativos
      prisma.produto.count({
        where: { tenantId, deletedAt: null },
      }),

      // Produtos com estoque baixo
      prisma.produto.count({
        where: {
          tenantId,
          deletedAt: null,
          quantity: { lte: prisma.produto.fields.minStock },
        },
      }).catch(() => {
        // Fallback: buscar manualmente se a query com fields nao funcionar
        return prisma.produto.findMany({
          where: { tenantId, deletedAt: null },
          select: { quantity: true, minStock: true },
        }).then(items => items.filter(p => p.quantity <= p.minStock).length)
      }),

      // Vendas do mes
      prisma.venda.findMany({
        where: {
          tenantId,
          deletedAt: null,
          createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
        select: { total: true, status: true },
      }),

      // Contas a pagar pendentes
      prisma.contaPagar.findMany({
        where: {
          tenantId,
          status: { in: ['PENDING', 'OVERDUE'] },
        },
        select: { valor: true, dataVencimento: true },
      }),

      // Parcelas a receber pendentes
      prisma.parcela.findMany({
        where: {
          tenantId,
          status: { in: ['PENDING', 'OVERDUE'] },
        },
        select: { valor: true, dataVencimento: true },
      }),
    ])

    // Calcular KPIs
    const vendasAtivas = vendasMes.filter(v => v.status !== 'CANCELLED')
    const faturamentoMes = vendasAtivas.reduce((sum, v) => sum + v.total, 0)
    const qtdVendasMes = vendasAtivas.length
    const ticketMedio = qtdVendasMes > 0 ? faturamentoMes / qtdVendasMes : 0

    const totalContasPendentes = contasPendentes.reduce((sum, c) => sum + c.valor, 0)
    const contasVencidas = contasPendentes.filter(c => new Date(c.dataVencimento) < now).length

    const totalParcelasReceber = parcelasPendentes.reduce((sum, p) => sum + p.valor, 0)
    const parcelasVencidas = parcelasPendentes.filter(p => new Date(p.dataVencimento) < now).length

    return {
      clientes: totalClientes,
      produtos: totalProdutos,
      produtosBaixoEstoque,
      vendasMes: qtdVendasMes,
      faturamentoMes,
      ticketMedio,
      contasPagar: {
        total: contasPendentes.length,
        valor: totalContasPendentes,
        vencidas: contasVencidas,
      },
      parcelasReceber: {
        total: parcelasPendentes.length,
        valor: totalParcelasReceber,
        vencidas: parcelasVencidas,
      },
    }
  })
}
