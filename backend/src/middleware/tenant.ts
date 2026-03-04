import { FastifyInstance, FastifyRequest } from 'fastify'
import { prisma } from '../lib/prisma'
import { ForbiddenError, PaymentRequiredError } from '../lib/errors'

export async function tenantMiddleware(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request: FastifyRequest) => {
    const { tenantId } = request.user

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, planStatus: true, trialEndsAt: true },
    })

    if (!tenant) throw new ForbiddenError('Tenant não encontrado')

    if (tenant.planStatus === 'TRIAL' && tenant.trialEndsAt && tenant.trialEndsAt < new Date()) {
      throw new PaymentRequiredError('Período de teste expirado. Assine um plano.')
    }

    if (tenant.planStatus === 'CANCELLED') {
      throw new ForbiddenError('Conta cancelada. Entre em contato com o suporte.')
    }

    request.tenantId = tenant.id
    request.tenantPlan = tenant.planStatus
  })
}
