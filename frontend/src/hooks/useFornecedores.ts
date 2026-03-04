'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { PaginatedResponse } from '@/types'

export interface Fornecedor {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  cnpj?: string | null
  notes?: string | null
  createdAt: string
}

export function useFornecedores(page = 1, search = '') {
  return useQuery({
    queryKey: ['fornecedores', page, search],
    queryFn: () => api.get<PaginatedResponse<Fornecedor>>(
      `/fornecedores?page=${page}&limit=10&search=${encodeURIComponent(search)}`
    ),
    staleTime: 1000 * 60 * 5,
  })
}

export function useFornecedoresAll() {
  return useQuery({
    queryKey: ['fornecedores', 'all'],
    queryFn: () => api.get<{ id: string; name: string }[]>('/fornecedores/all'),
    staleTime: 1000 * 60 * 10,
  })
}

export function useFornecedor(id: string) {
  return useQuery({
    queryKey: ['fornecedores', id],
    queryFn: () => api.get<Fornecedor>(`/fornecedores/${id}`),
    enabled: !!id,
  })
}

export function useCreateFornecedor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post<Fornecedor>('/fornecedores', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] })
    },
  })
}

export function useUpdateFornecedor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.patch<Fornecedor>(`/fornecedores/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] })
      queryClient.invalidateQueries({ queryKey: ['fornecedores', variables.id] })
    },
  })
}

export function useDeleteFornecedor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/fornecedores/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] })
    },
  })
}
