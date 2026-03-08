'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface PixData {
  encodedImage: string
  payload: string
  expirationDate: string
}

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
  pixData: PixData | null
}

export interface CreditCardData {
  holderName: string
  number: string
  expiryMonth: string
  expiryYear: string
  ccv: string
}

export interface CreditCardHolderInfo {
  name: string
  email: string
  cpfCnpj: string
  postalCode: string
  addressNumber: string
  phone: string
}

interface CreateAssinaturaPayload {
  billingType: 'PIX' | 'CREDIT_CARD' | 'UNDEFINED'
  cpfCnpj?: string
  creditCard?: CreditCardData
  creditCardHolderInfo?: CreditCardHolderInfo
}

interface CreateAssinaturaResponse {
  subscriptionId: string
  paymentUrl: string | null
  pixData: PixData | null
  paid: boolean
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
    mutationFn: (payload: CreateAssinaturaPayload) =>
      api.post<CreateAssinaturaResponse>('/assinatura', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['assinatura'] })
      await queryClient.invalidateQueries({ queryKey: ['tenant-info'] })
    },
  })
}

export function useCancelAssinatura() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.delete('/assinatura'),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['assinatura'] })
      await queryClient.invalidateQueries({ queryKey: ['tenant-info'] })
    },
  })
}
