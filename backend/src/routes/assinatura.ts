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
    let pixData = null

    if (tenant.asaasSubscriptionId) {
      try {
        subscription = await asaas.getSubscription(tenant.asaasSubscriptionId)

        // Buscar link de pagamento da ultima cobranca pendente
        const payments = await asaas.getSubscriptionPayments(tenant.asaasSubscriptionId)
        const pending = payments.data.find(p => p.status === 'PENDING' || p.status === 'OVERDUE')
        if (pending) {
          paymentUrl = pending.invoiceUrl

          // Se for PIX, buscar QR code
          if (pending.billingType === 'PIX' || subscription.billingType === 'PIX') {
            try {
              const qr = await asaas.getPixQrCode(pending.id)
              pixData = {
                encodedImage: qr.encodedImage,
                payload: qr.payload,
                expirationDate: qr.expirationDate,
              }
            } catch {
              // QR code pode nao estar disponivel ainda
            }
          }
        }
      } catch {
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
      pixData,
    }
  })

  // POST - Criar assinatura
  fastify.post<{ Body: CreateAssinatura }>('/assinatura', async (request, reply) => {
    const { billingType, cpfCnpj, creditCard, creditCardHolderInfo } = createAssinaturaSchema.parse(request.body)

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

    if (!tenant) throw new ForbiddenError('Tenant nao encontrado')

    if (tenant.planStatus === 'ACTIVE' && tenant.asaasSubscriptionId) {
      throw new ValidationError('Voce ja possui uma assinatura ativa')
    }

    // Buscar dados do usuario OWNER para criar customer no Asaas
    const owner = await prisma.user.findFirst({
      where: { tenantId: request.tenantId, role: 'OWNER' },
      select: { name: true, email: true },
    })

    if (!owner) throw new ForbiddenError('Proprietario da conta nao encontrado')

    // Criar customer no Asaas se nao existe
    const customerCpfCnpj = cpfCnpj || creditCardHolderInfo?.cpfCnpj
    let asaasCustomerId = tenant.asaasCustomerId
    if (!asaasCustomerId) {
      const customer = await asaas.createCustomer({
        name: owner.name,
        email: owner.email,
        cpfCnpj: customerCpfCnpj,
      })
      asaasCustomerId = customer.id

      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { asaasCustomerId },
      })
    } else if (customerCpfCnpj) {
      // Atualizar CPF/CNPJ do customer existente
      await asaas.updateCustomer(asaasCustomerId, { cpfCnpj: customerCpfCnpj })
    }

    // Criar assinatura no Asaas (com cartao se fornecido)
    const subscription = await asaas.createSubscription(
      asaasCustomerId,
      billingType,
      creditCard,
      creditCardHolderInfo,
    )

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { asaasSubscriptionId: subscription.id },
    })

    // Buscar dados do primeiro pagamento
    const payments = await asaas.getSubscriptionPayments(subscription.id)
    const firstPayment = payments.data[0]

    let pixData = null
    if (billingType === 'PIX' && firstPayment) {
      // QR code pode nao estar disponivel imediatamente, tentar ate 3 vezes
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const qr = await asaas.getPixQrCode(firstPayment.id)
          pixData = {
            encodedImage: qr.encodedImage,
            payload: qr.payload,
            expirationDate: qr.expirationDate,
          }
          break
        } catch {
          if (attempt < 2) {
            await new Promise(resolve => setTimeout(resolve, 2000))
          }
        }
      }
    }

    // Se pagou com cartao, o Asaas processa automaticamente
    const isPaid = billingType === 'CREDIT_CARD'

    return reply.code(201).send({
      subscriptionId: subscription.id,
      paymentUrl: firstPayment?.invoiceUrl || null,
      pixData,
      paid: isPaid,
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
