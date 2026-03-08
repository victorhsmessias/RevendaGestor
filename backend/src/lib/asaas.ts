const ASAAS_BASE_URL = process.env.ASAAS_BASE_URL || 'https://sandbox.asaas.com/api/v3'
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || ''

interface AsaasCustomer {
  id: string
  name: string
  email: string
  cpfCnpj: string
}

interface AsaasSubscription {
  id: string
  customer: string
  billingType: string
  value: number
  nextDueDate: string
  cycle: string
  status: string
  description: string
}

interface AsaasPayment {
  id: string
  subscription: string
  billingType: string
  value: number
  status: string
  invoiceUrl: string
  dueDate: string
}

interface AsaasPixQrCode {
  encodedImage: string
  payload: string
  expirationDate: string
}

export interface AsaasCreditCard {
  holderName: string
  number: string
  expiryMonth: string
  expiryYear: string
  ccv: string
}

export interface AsaasCreditCardHolderInfo {
  name: string
  email: string
  cpfCnpj: string
  postalCode: string
  addressNumber: string
  phone: string
}

async function asaasRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    access_token: ASAAS_API_KEY,
  }

  const response = await fetch(`${ASAAS_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ errors: [{ description: 'Erro na API Asaas' }] })) as { errors?: { description?: string }[] }
    const message = error.errors?.[0]?.description || `Erro Asaas: ${response.status}`
    throw new Error(message)
  }

  return response.json() as Promise<T>
}

export const asaas = {
  async createCustomer(data: { name: string; email: string; cpfCnpj?: string }): Promise<AsaasCustomer> {
    return asaasRequest<AsaasCustomer>('POST', '/customers', {
      name: data.name,
      email: data.email,
      cpfCnpj: data.cpfCnpj || undefined,
    })
  },

  async updateCustomer(customerId: string, data: { cpfCnpj?: string }): Promise<AsaasCustomer> {
    return asaasRequest<AsaasCustomer>('PUT', `/customers/${customerId}`, data)
  },

  async createSubscription(
    customerId: string,
    billingType: 'PIX' | 'CREDIT_CARD' | 'UNDEFINED',
    creditCard?: AsaasCreditCard,
    creditCardHolderInfo?: AsaasCreditCardHolderInfo,
  ): Promise<AsaasSubscription> {
    const nextDueDate = new Date()
    nextDueDate.setDate(nextDueDate.getDate() + 1)
    const dueDateStr = nextDueDate.toISOString().split('T')[0]

    const payload: Record<string, unknown> = {
      customer: customerId,
      billingType,
      value: 34.90,
      nextDueDate: dueDateStr,
      cycle: 'MONTHLY',
      description: 'RevendaGestor - Assinatura Mensal',
    }

    if (billingType === 'CREDIT_CARD' && creditCard && creditCardHolderInfo) {
      payload.creditCard = creditCard
      payload.creditCardHolderInfo = creditCardHolderInfo
    }

    return asaasRequest<AsaasSubscription>('POST', '/subscriptions', payload)
  },

  async getSubscription(subscriptionId: string): Promise<AsaasSubscription> {
    return asaasRequest<AsaasSubscription>('GET', `/subscriptions/${subscriptionId}`)
  },

  async getSubscriptionPayments(subscriptionId: string): Promise<{ data: AsaasPayment[] }> {
    return asaasRequest<{ data: AsaasPayment[] }>('GET', `/subscriptions/${subscriptionId}/payments`)
  },

  async getPixQrCode(paymentId: string): Promise<AsaasPixQrCode> {
    return asaasRequest<AsaasPixQrCode>('GET', `/payments/${paymentId}/pixQrCode`)
  },

  async cancelSubscription(subscriptionId: string): Promise<AsaasSubscription> {
    return asaasRequest<AsaasSubscription>('DELETE', `/subscriptions/${subscriptionId}`)
  },
}
