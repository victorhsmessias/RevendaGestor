'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface AssinaturaInfo {
  planStatus: 'TRIAL' | 'ACTIVE' | 'PAUSED' | 'CANCELLED'
  trialEndsAt: string | null
  subscription: {
    id: string
    status: string
    value: number
    nextDueDate: string
    billingType: string
  } | null
  paymentUrl: string | null
}

interface CreateAssinaturaResponse {
  subscriptionId: string
  paymentUrl: string | null
}

export function useAssinatura() {
  return useQuery({
    queryKey: ['assinatura'],
    queryFn: () => api.get<AssinaturaInfo>('/assinatura'),
    staleTime: 1000 * 60 * 2,
  })
}

export function useCreateAssinatura() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (billingType: 'PIX' | 'CREDIT_CARD' | 'UNDEFINED') =>
      api.post<CreateAssinaturaResponse>('/assinatura', { billingType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assinatura'] })
      queryClient.invalidateQueries({ queryKey: ['tenant-info'] })
    },
  })
}

export function useCancelAssinatura() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.delete('/assinatura'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assinatura'] })
      queryClient.invalidateQueries({ queryKey: ['tenant-info'] })
    },
  })
}
