'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { PaginatedResponse } from '@/types'

export interface VendaItem {
  id: string
  produtoId: string
  quantity: number
  unitPrice: number
  total: number
  produto: { id: string; name: string; code: string }
}

export interface Parcela {
  id: string
  numero: number
  valor: number
  dataVencimento: string
  dataPagamento: string | null
  status: 'PENDING' | 'PAID' | 'OVERDUE'
}

export interface Venda {
  id: string
  clienteId: string
  subtotal: number
  discount: number
  total: number
  formaPagamento: string
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED'
  notes: string | null
  createdAt: string
  cliente: { id: string; name: string; phone?: string }
  items?: VendaItem[]
  parcelas?: Parcela[]
  _count?: { items: number; parcelas: number }
}

export interface CreateVendaInput {
  clienteId: string
  items?: { produtoId: string; quantity: number; unitPrice: number }[]
  valorManual?: number
  descricaoManual?: string
  parcelas: number
  formaPagamento: string
  discount: number
  notes?: string
}

export function useVendas(page: number, search: string, status?: string, clienteId?: string) {
  const params = new URLSearchParams({
    page: String(page),
    limit: '10',
    search,
  })
  if (status) params.set('status', status)
  if (clienteId) params.set('clienteId', clienteId)

  return useQuery({
    queryKey: ['vendas', page, search, status, clienteId],
    queryFn: () => api.get<PaginatedResponse<Venda>>(`/vendas?${params}`),
  })
}

export interface ClienteVendaItem {
  id: string
  total: number
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED'
  formaPagamento: string
  createdAt: string
  _count: { items: number; parcelas: number }
  cliente: { id: string; name: string }
}

export interface ClienteVendas {
  clienteId: string
  clienteName: string
  clientePhone: string | null
  totalVendas: number
  totalValor: number
  totalPendente: number
  ultimaVenda: string | null
  vendas: ClienteVendaItem[]
}

export function useVendasPorCliente(page: number, search: string) {
  return useQuery({
    queryKey: ['vendas-por-cliente', page, search],
    queryFn: () => api.get<PaginatedResponse<ClienteVendas>>(
      `/vendas/por-cliente?page=${page}&limit=10&search=${search}`
    ),
  })
}

export function useVenda(id: string) {
  return useQuery({
    queryKey: ['vendas', id],
    queryFn: () => api.get<Venda>(`/vendas/${id}`),
    enabled: !!id,
  })
}

export function useCreateVenda() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateVendaInput) => api.post<Venda>('/vendas', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendas'] })
      qc.invalidateQueries({ queryKey: ['vendas-por-cliente'] })
      qc.invalidateQueries({ queryKey: ['produtos'] })
    },
  })
}

export function usePagarParcela() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ vendaId, parcelaId }: { vendaId: string; parcelaId: string }) =>
      api.patch(`/vendas/${vendaId}/parcelas/${parcelaId}/pagar`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendas'] })
      qc.invalidateQueries({ queryKey: ['vendas-por-cliente'] })
    },
  })
}

export function useCancelarVenda() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/vendas/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendas'] })
      qc.invalidateQueries({ queryKey: ['vendas-por-cliente'] })
      qc.invalidateQueries({ queryKey: ['produtos'] })
    },
  })
}
