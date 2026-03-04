import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { asaas } from '../lib/asaas'
import { createAssinaturaSchema, type CreateAssinatura } from '../lib/validators'
import { ForbiddenError, ValidationError } from '../lib/errors'

export async function assinaturaRoutes(fastify: FastifyInstance) {

  // GET - Status da assinatura
  fastify.get('/assinatura', async (request) => {
    const tenant = await prisma.tenant.findUnique({
      where: { id: request.tenantId },
      select: {
        planStatus: true,
        trialEndsAt: true,
        asaasCustomerId: true,
        asaasSubscriptionId: true,
      },
    })

    if (!tenant) return { status: 'NOT_FOUND' }

    let subscription = null
    let paymentUrl = null

    if (tenant.asaasSubscriptionId) {
      try {
        subscription = await asaas.getSubscription(tenant.asaasSubscriptionId)

        // Buscar link de pagamento da última cobrança pendente
        const payments = await asaas.getSubscriptionPayments(tenant.asaasSubscriptionId)
        const pending = payments.data.find(p => p.status === 'PENDING' || p.status === 'OVERDUE')
        if (pending) {
          paymentUrl = pending.invoiceUrl
        }
      } catch {
        // Se a assinatura não existe mais no Asaas, retorna sem ela
        subscription = null
      }
    }

    return {
      planStatus: tenant.planStatus,
      trialEndsAt: tenant.trialEndsAt,
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        value: subscription.value,
        nextDueDate: subscription.nextDueDate,
        billingType: subscription.billingType,
      } : null,
      paymentUrl,
    }
  })

  // POST - Criar assinatura (redireciona para Asaas)
  fastify.post<{ Body: CreateAssinatura }>('/assinatura', async (request, reply) => {
    const { billingType } = createAssinaturaSchema.parse(request.body)

    const tenant = await prisma.tenant.findUnique({
      where: { id: request.tenantId },
      select: {
        id: true,
        name: true,
        planStatus: true,
        asaasCustomerId: true,
        asaasSubscriptionId: true,
      },
    })

    if (!tenant) throw new ForbiddenError('Tenant não encontrado')

    if (tenant.planStatus === 'ACTIVE' && tenant.asaasSubscriptionId) {
      throw new ValidationError('Você já possui uma assinatura ativa')
    }

    // Buscar dados do usuário OWNER para criar customer no Asaas
    const owner = await prisma.user.findFirst({
      where: { tenantId: request.tenantId, role: 'OWNER' },
      select: { name: true, email: true },
    })

    if (!owner) throw new ForbiddenError('Proprietário da conta não encontrado')

    // Criar customer no Asaas se não existe
    let asaasCustomerId = tenant.asaasCustomerId
    if (!asaasCustomerId) {
      const customer = await asaas.createCustomer({
        name: owner.name,
        email: owner.email,
      })
      asaasCustomerId = customer.id

      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { asaasCustomerId },
      })
    }

    // Criar assinatura no Asaas
    const subscription = await asaas.createSubscription(asaasCustomerId, billingType)

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { asaasSubscriptionId: subscription.id },
    })

    // Buscar link de pagamento da primeira cobrança
    const payments = await asaas.getSubscriptionPayments(subscription.id)
    const firstPayment = payments.data[0]

    return reply.code(201).send({
      subscriptionId: subscription.id,
      paymentUrl: firstPayment?.invoiceUrl || null,
    })
  })

  // DELETE - Cancelar assinatura
  fastify.delete('/assinatura', async (request, reply) => {
    const tenant = await prisma.tenant.findUnique({
      where: { id: request.tenantId },
      select: { id: true, asaasSubscriptionId: true },
    })

    if (!tenant?.asaasSubscriptionId) {
      throw new ValidationError('Nenhuma assinatura encontrada')
    }

    // Cancelar no Asaas
    await asaas.cancelSubscription(tenant.asaasSubscriptionId)

    // Atualizar status local
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        planStatus: 'CANCELLED',
        asaasSubscriptionId: null,
      },
    })

    return { message: 'Assinatura cancelada com sucesso' }
  })
}
