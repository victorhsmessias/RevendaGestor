import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { z } from 'zod'

const periodoSchema = z.object({
  dataInicio: z.string().min(1, 'Data inicio obrigatoria'),
  dataFim: z.string().min(1, 'Data fim obrigatoria'),
})

export async function relatorioRoutes(fastify: FastifyInstance) {

  // GET /api/relatorios/vendas — Relatorio de vendas por periodo
  fastify.get('/relatorios/vendas', async (request) => {
    const { dataInicio, dataFim } = periodoSchema.parse(request.query)
    const tenantId = request.tenantId
    const inicio = new Date(dataInicio)
    const fim = new Date(dataFim + 'T23:59:59')

    const vendas = await prisma.venda.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: { not: 'CANCELLED' },
        createdAt: { gte: inicio, lte: fim },
      },
      include: {
        cliente: { select: { id: true, name: true } },
        items: { include: { produto: { select: { id: true, name: true, code: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Totais
    const totalVendas = vendas.length
    const faturamento = vendas.reduce((sum, v) => sum + v.total, 0)
    const descontos = vendas.reduce((sum, v) => sum + v.discount, 0)
    const ticketMedio = totalVendas > 0 ? faturamento / totalVendas : 0

    // Vendas por dia (para grafico)
    const vendasPorDia: Record<string, { data: string; total: number; qtd: number }> = {}
    for (const v of vendas) {
      const dia = v.createdAt.toISOString().split('T')[0]
      if (!vendasPorDia[dia]) vendasPorDia[dia] = { data: dia, total: 0, qtd: 0 }
      vendasPorDia[dia].total += v.total
      vendasPorDia[dia].qtd += 1
    }

    // Vendas por forma de pagamento
    const porFormaPagamento: Record<string, { forma: string; total: number; qtd: number }> = {}
    for (const v of vendas) {
      if (!porFormaPagamento[v.formaPagamento]) {
        porFormaPagamento[v.formaPagamento] = { forma: v.formaPagamento, total: 0, qtd: 0 }
      }
      porFormaPagamento[v.formaPagamento].total += v.total
      porFormaPagamento[v.formaPagamento].qtd += 1
    }

    return {
      periodo: { inicio: dataInicio, fim: dataFim },
      resumo: { totalVendas, faturamento, descontos, ticketMedio },
      vendasPorDia: Object.values(vendasPorDia).sort((a, b) => a.data.localeCompare(b.data)),
      porFormaPagamento: Object.values(porFormaPagamento),
      vendas,
    }
  })

  // GET /api/relatorios/financeiro — Receitas vs Despesas
  fastify.get('/relatorios/financeiro', async (request) => {
    const { dataInicio, dataFim } = periodoSchema.parse(request.query)
    const tenantId = request.tenantId
    const inicio = new Date(dataInicio)
    const fim = new Date(dataFim + 'T23:59:59')

    const [vendasPeriodo, contasPeriodo, parcelasPeriodo] = await Promise.all([
      // Receitas: vendas no periodo
      prisma.venda.findMany({
        where: {
          tenantId,
          deletedAt: null,
          status: { not: 'CANCELLED' },
          createdAt: { gte: inicio, lte: fim },
        },
        select: { total: true, createdAt: true },
      }),

      // Despesas: contas a pagar no periodo
      prisma.contaPagar.findMany({
        where: {
          tenantId,
          status: { not: 'CANCELLED' },
          dataVencimento: { gte: inicio, lte: fim },
        },
        select: { valor: true, status: true, dataVencimento: true },
        orderBy: { dataVencimento: 'asc' },
      }),

      // Parcelas recebidas/pendentes no periodo
      prisma.parcela.findMany({
        where: {
          tenantId,
          dataVencimento: { gte: inicio, lte: fim },
        },
        select: { valor: true, status: true, dataVencimento: true },
      }),
    ])

    const receitas = vendasPeriodo.reduce((sum, v) => sum + v.total, 0)
    const despesasTotal = contasPeriodo.reduce((sum, c) => sum + c.valor, 0)
    const despesasPagas = contasPeriodo.filter(c => c.status === 'PAID').reduce((sum, c) => sum + c.valor, 0)
    const despesasPendentes = despesasTotal - despesasPagas

    const parcelasRecebidas = parcelasPeriodo.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.valor, 0)
    const parcelasPendentes = parcelasPeriodo.filter(p => p.status !== 'PAID').reduce((sum, p) => sum + p.valor, 0)

    const lucroEstimado = receitas - despesasTotal

    // Fluxo por dia
    const fluxoPorDia: Record<string, { data: string; receitas: number; despesas: number }> = {}

    for (const v of vendasPeriodo) {
      const dia = v.createdAt.toISOString().split('T')[0]
      if (!fluxoPorDia[dia]) fluxoPorDia[dia] = { data: dia, receitas: 0, despesas: 0 }
      fluxoPorDia[dia].receitas += v.total
    }
    for (const c of contasPeriodo) {
      const dia = c.dataVencimento.toISOString().split('T')[0]
      if (!fluxoPorDia[dia]) fluxoPorDia[dia] = { data: dia, receitas: 0, despesas: 0 }
      fluxoPorDia[dia].despesas += c.valor
    }

    return {
      periodo: { inicio: dataInicio, fim: dataFim },
      resumo: {
        receitas,
        despesasTotal,
        despesasPagas,
        despesasPendentes,
        lucroEstimado,
        parcelasRecebidas,
        parcelasPendentes,
      },
      fluxoPorDia: Object.values(fluxoPorDia).sort((a, b) => a.data.localeCompare(b.data)),
    }
  })

  // GET /api/relatorios/produtos — Ranking de produtos mais vendidos
  fastify.get('/relatorios/produtos', async (request) => {
    const { dataInicio, dataFim } = periodoSchema.parse(request.query)
    const tenantId = request.tenantId
    const inicio = new Date(dataInicio)
    const fim = new Date(dataFim + 'T23:59:59')

    const vendaItems = await prisma.vendaItem.findMany({
      where: {
        venda: {
          tenantId,
          deletedAt: null,
          status: { not: 'CANCELLED' },
          createdAt: { gte: inicio, lte: fim },
        },
      },
      include: {
        produto: { select: { id: true, name: true, code: true, costPrice: true, salePrice: true } },
      },
    })

    // Agrupar por produto
    const porProduto: Record<string, {
      id: string; code: string; name: string
      qtdVendida: number; faturamento: number; custoTotal: number; lucro: number
    }> = {}

    for (const item of vendaItems) {
      const pid = item.produtoId
      if (!porProduto[pid]) {
        porProduto[pid] = {
          id: pid,
          code: item.produto.code,
          name: item.produto.name,
          qtdVendida: 0,
          faturamento: 0,
          custoTotal: 0,
          lucro: 0,
        }
      }
      porProduto[pid].qtdVendida += item.quantity
      porProduto[pid].faturamento += item.total
      porProduto[pid].custoTotal += item.produto.costPrice * item.quantity
    }

    // Calcular lucro
    const ranking = Object.values(porProduto)
      .map(p => ({ ...p, lucro: p.faturamento - p.custoTotal }))
      .sort((a, b) => b.faturamento - a.faturamento)

    return {
      periodo: { inicio: dataInicio, fim: dataFim },
      ranking,
      totalProdutosVendidos: vendaItems.reduce((sum, i) => sum + i.quantity, 0),
    }
  })

  // GET /api/relatorios/clientes — Ranking de clientes
  fastify.get('/relatorios/clientes', async (request) => {
    const { dataInicio, dataFim } = periodoSchema.parse(request.query)
    const tenantId = request.tenantId
    const inicio = new Date(dataInicio)
    const fim = new Date(dataFim + 'T23:59:59')

    const vendas = await prisma.venda.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: { not: 'CANCELLED' },
        createdAt: { gte: inicio, lte: fim },
      },
      select: {
        total: true,
        clienteId: true,
        cliente: { select: { id: true, name: true, phone: true } },
      },
    })

    // Agrupar por cliente
    const porCliente: Record<string, {
      id: string; name: string; phone: string | null
      qtdCompras: number; totalGasto: number
    }> = {}

    for (const v of vendas) {
      const cid = v.clienteId
      if (!porCliente[cid]) {
        porCliente[cid] = {
          id: cid,
          name: v.cliente.name,
          phone: v.cliente.phone ?? null,
          qtdCompras: 0,
          totalGasto: 0,
        }
      }
      porCliente[cid].qtdCompras += 1
      porCliente[cid].totalGasto += v.total
    }

    const ranking = Object.values(porCliente).sort((a, b) => b.totalGasto - a.totalGasto)

    return {
      periodo: { inicio: dataInicio, fim: dataFim },
      ranking,
    }
  })
}
