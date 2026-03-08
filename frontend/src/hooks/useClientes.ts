'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { PaginatedResponse } from '@/types'

export interface Cliente {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  cpf?: string | null
  city?: string | null
  address?: string | null
  notes?: string | null
  createdAt: string
}

export function useClientes(page = 1, search = '') {
  return useQuery({
    queryKey: ['clientes', page, search],
    queryFn: () => api.get<PaginatedResponse<Cliente>>(
      `/clientes?page=${page}&limit=10&search=${encodeURIComponent(search)}`
    ),
    staleTime: 1000 * 60 * 5,
  })
}

export function useCliente(id: string) {
  return useQuery({
    queryKey: ['clientes', id],
    queryFn: () => api.get<Cliente>(`/clientes/${id}`),
    enabled: !!id,
  })
}

export function useCreateCliente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post<Cliente>('/clientes', data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['clientes'] })
    },
  })
}

export function useUpdateCliente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.patch<Cliente>(`/clientes/${id}`, data),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['clientes'] }),
        queryClient.invalidateQueries({ queryKey: ['clientes', variables.id] }),
      ])
    },
  })
}

export function useDeleteCliente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/clientes/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['clientes'] })
    },
  })
}
