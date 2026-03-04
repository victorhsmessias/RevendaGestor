'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { PaginatedResponse } from '@/types'

export interface ContaPagar {
  id: string
  description: string
  valor: number
  dataVencimento: string
  dataPagamento: string | null
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  notes: string | null
  fornecedorId: string | null
  fornecedor: { id: string; name: string } | null
  createdAt: string
}

export function useContasPagar(page: number, search: string, status?: string) {
  const params = new URLSearchParams({ page: String(page), limit: '10', search })
  if (status) params.set('status', status)

  return useQuery({
    queryKey: ['contas-pagar', page, search, status],
    queryFn: () => api.get<PaginatedResponse<ContaPagar>>(`/contas-pagar?${params}`),
  })
}

export function useCreateContaPagar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { description: string; valor: number; dataVencimento: string; fornecedorId?: string; notes?: string }) =>
      api.post<ContaPagar>('/contas-pagar', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contas-pagar'] }),
  })
}

export function useUpdateContaPagar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<{ description: string; valor: number; dataVencimento: string; fornecedorId: string; notes: string }>) =>
      api.patch<ContaPagar>(`/contas-pagar/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contas-pagar'] }),
  })
}

export function usePagarConta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.patch(`/contas-pagar/${id}/pagar`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contas-pagar'] }),
  })
}

export function useCancelarConta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/contas-pagar/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contas-pagar'] }),
  })
}
