import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface TenantOwner {
  name: string
  email: string
}

interface TenantListItem {
  id: string
  name: string
  planStatus: 'TRIAL' | 'ACTIVE' | 'PAUSED' | 'CANCELLED'
  trialEndsAt: string | null
  asaasSubscriptionId: string | null
  createdAt: string
  owner: TenantOwner | null
  _count: {
    users: number
    clientes: number
    produtos: number
    vendas: number
  }
}

interface TenantDetail {
  id: string
  name: string
  planStatus: 'TRIAL' | 'ACTIVE' | 'PAUSED' | 'CANCELLED'
  trialEndsAt: string | null
  asaasCustomerId: string | null
  asaasSubscriptionId: string | null
  createdAt: string
  users: {
    id: string
    name: string
    email: string
    role: 'OWNER' | 'ADMIN' | 'USER'
    createdAt: string
  }[]
  _count: {
    clientes: number
    fornecedores: number
    produtos: number
    vendas: number
    contasPagar: number
  }
}

interface AdminStats {
  totalTenants: number
  totalUsers: number
  totalVendas: number
  tenantsByStatus: Record<string, number>
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => api.get<AdminStats>('/admin/stats'),
  })
}

export function useAdminTenants() {
  return useQuery({
    queryKey: ['admin', 'tenants'],
    queryFn: () => api.get<TenantListItem[]>('/admin/tenants'),
  })
}

export function useAdminTenantDetail(id: string) {
  return useQuery({
    queryKey: ['admin', 'tenants', id],
    queryFn: () => api.get<TenantDetail>(`/admin/tenants/${id}`),
    enabled: !!id,
  })
}

export function useUpdateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { planStatus?: string; trialEndsAt?: string } }) =>
      api.patch(`/admin/tenants/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] })
    },
  })
}
