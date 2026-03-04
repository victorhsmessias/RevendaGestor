import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'

// Eventos do Asaas que nos interessam
// Docs: https://docs.asaas.com/docs/webhooks

interface AsaasWebhookPayload {
  event: string
  payment?: {
    id: string
    subscription: string
    status: string
    billingType: string
    value: number
    invoiceUrl: string
  }
}

export async function webhookAsaasRoutes(fastify: FastifyInstance) {

  fastify.post('/webhooks/asaas', async (request, reply) => {
    // Validar token do webhook
    const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN
    if (webhookToken) {
      const receivedToken = request.headers['asaas-access-token'] as string
      if (receivedToken !== webhookToken) {
        return reply.code(401).send({ error: 'Token inválido' })
      }
    }

    const payload = request.body as AsaasWebhookPayload

    if (!payload.event || !payload.payment?.subscription) {
      return reply.code(200).send({ received: true })
    }

    const subscriptionId = payload.payment.subscription

    // Buscar tenant pela assinatura
    const tenant = await prisma.tenant.findFirst({
      where: { asaasSubscriptionId: subscriptionId },
      select: { id: true, planStatus: true },
    })

    if (!tenant) {
      fastify.log.warn({ subscriptionId }, 'Webhook Asaas: tenant não encontrado para subscription')
      return reply.code(200).send({ received: true })
    }

    const event = payload.event

    // Pagamento confirmado → ativar plano
    if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { planStatus: 'ACTIVE' },
      })
      fastify.log.info({ tenantId: tenant.id, event }, 'Assinatura ativada via webhook')
    }

    // Pagamento atrasado → pausar plano
    if (event === 'PAYMENT_OVERDUE') {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { planStatus: 'PAUSED' },
      })
      fastify.log.warn({ tenantId: tenant.id, event }, 'Assinatura pausada - pagamento atrasado')
    }

    // Pagamento removido/estornado → pausar plano
    if (event === 'PAYMENT_DELETED' || event === 'PAYMENT_REFUNDED') {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { planStatus: 'PAUSED' },
      })
      fastify.log.warn({ tenantId: tenant.id, event }, 'Assinatura pausada - pagamento removido/estornado')
    }

    return reply.code(200).send({ received: true })
  })
}
