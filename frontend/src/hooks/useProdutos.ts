'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { PaginatedResponse } from '@/types'

export interface Produto {
  id: string
  code: string
  name: string
  costPrice: number
  salePrice: number
  quantity: number
  minStock: number
  fornecedorId: string
  fornecedor: { id: string; name: string }
  createdAt: string
}

export function useProdutos(page: number, search: string) {
  return useQuery({
    queryKey: ['produtos', page, search],
    queryFn: () =>
      api.get<PaginatedResponse<Produto>>(
        `/produtos?page=${page}&limit=10&search=${encodeURIComponent(search)}`
      ),
  })
}

export function useProduto(id: string) {
  return useQuery({
    queryKey: ['produtos', id],
    queryFn: () => api.get<Produto>(`/produtos/${id}`),
    enabled: !!id,
  })
}

export function useCreateProduto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Produto, 'id' | 'fornecedor' | 'createdAt'>) =>
      api.post<Produto>('/produtos', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['produtos'] }),
  })
}

export function useUpdateProduto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Omit<Produto, 'id' | 'fornecedor' | 'createdAt'>>) =>
      api.patch<Produto>(`/produtos/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['produtos'] }),
  })
}

export function useDeleteProduto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/produtos/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['produtos'] }),
  })
}
