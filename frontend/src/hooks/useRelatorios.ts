'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface RelatorioVendas {
  periodo: { inicio: string; fim: string }
  resumo: { totalVendas: number; faturamento: number; descontos: number; ticketMedio: number }
  vendasPorDia: { data: string; total: number; qtd: number }[]
  porFormaPagamento: { forma: string; total: number; qtd: number }[]
  vendas: {
    id: string; total: number; discount: number; formaPagamento: string; status: string; createdAt: string
    cliente: { id: string; name: string }
    items: { quantity: number; unitPrice: number; total: number; produto: { name: string; code: string } }[]
  }[]
}

export interface RelatorioFinanceiro {
  periodo: { inicio: string; fim: string }
  resumo: {
    receitas: number; despesasTotal: number; despesasPagas: number; despesasPendentes: number
    lucroEstimado: number; parcelasRecebidas: number; parcelasPendentes: number
  }
  fluxoPorDia: { data: string; receitas: number; despesas: number }[]
}

export interface RelatorioProdutos {
  periodo: { inicio: string; fim: string }
  ranking: {
    id: string; code: string; name: string
    qtdVendida: number; faturamento: number; custoTotal: number; lucro: number
  }[]
  totalProdutosVendidos: number
}

export interface RelatorioClientes {
  periodo: { inicio: string; fim: string }
  ranking: {
    id: string; name: string; phone: string | null
    qtdCompras: number; totalGasto: number
  }[]
}

export function useRelatorioVendas(dataInicio: string, dataFim: string, enabled: boolean) {
  return useQuery({
    queryKey: ['relatorio-vendas', dataInicio, dataFim],
    queryFn: () => api.get<RelatorioVendas>(`/relatorios/vendas?dataInicio=${dataInicio}&dataFim=${dataFim}`),
    enabled,
  })
}

export function useRelatorioFinanceiro(dataInicio: string, dataFim: string, enabled: boolean) {
  return useQuery({
    queryKey: ['relatorio-financeiro', dataInicio, dataFim],
    queryFn: () => api.get<RelatorioFinanceiro>(`/relatorios/financeiro?dataInicio=${dataInicio}&dataFim=${dataFim}`),
    enabled,
  })
}

export function useRelatorioProdutos(dataInicio: string, dataFim: string, enabled: boolean) {
  return useQuery({
    queryKey: ['relatorio-produtos', dataInicio, dataFim],
    queryFn: () => api.get<RelatorioProdutos>(`/relatorios/produtos?dataInicio=${dataInicio}&dataFim=${dataFim}`),
    enabled,
  })
}

export function useRelatorioClientes(dataInicio: string, dataFim: string, enabled: boolean) {
  return useQuery({
    queryKey: ['relatorio-clientes', dataInicio, dataFim],
    queryFn: () => api.get<RelatorioClientes>(`/relatorios/clientes?dataInicio=${dataInicio}&dataFim=${dataFim}`),
    enabled,
  })
}
