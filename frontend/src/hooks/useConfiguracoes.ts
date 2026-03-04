'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface TenantInfo {
  id: string
  name: string
  planStatus: string
  trialEndsAt: string | null
  createdAt: string
  _count: { users: number; clientes: number; fornecedores: number; produtos: number; vendas: number }
}

export function useTenantInfo() {
  return useQuery({
    queryKey: ['tenant-info'],
    queryFn: () => api.get<TenantInfo>('/configuracoes/tenant'),
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; email: string }) =>
      api.patch('/configuracoes/perfil', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant-info'] }),
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.patch('/configuracoes/senha', data),
  })
}

export function useUpdateTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string }) =>
      api.patch('/configuracoes/tenant', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant-info'] }),
  })
}
