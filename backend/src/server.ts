import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'
import rateLimit from '@fastify/rate-limit'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { AppError, ForbiddenError, PaymentRequiredError } from './lib/errors'
import { prisma } from './lib/prisma'
import { authRoutes } from './routes/auth'
import { clienteRoutes } from './routes/clientes'
import { fornecedorRoutes } from './routes/fornecedores'
import { produtoRoutes } from './routes/produtos'
import { vendaRoutes } from './routes/vendas'
import { contaPagarRoutes } from './routes/contas-pagar'
import { dashboardRoutes } from './routes/dashboard'
import { relatorioRoutes } from './routes/relatorios'
import { configuracaoRoutes } from './routes/configuracoes'
import { assinaturaRoutes } from './routes/assinatura'
import { webhookAsaasRoutes } from './routes/webhook-asaas'

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  },
})

async function bootstrap() {
  // === PLUGINS ===
  await app.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  await app.register(cookie)

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  })

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  })

  // === ERROR HANDLER GLOBAL ===
  app.setErrorHandler((err: unknown, request, reply) => {
    // Zod validation errors
    if (err instanceof z.ZodError) {
      return reply.code(400).send({
        error: 'Validação falhou',
        statusCode: 400,
        details: Object.fromEntries(
          err.issues.map((e) => [e.path.join('.'), e.message])
        ),
      })
    }

    // Application errors
    if (err instanceof AppError) {
      return reply.code(err.statusCode).send({
        error: err.message,
        statusCode: err.statusCode,
        details: err.details,
      })
    }

    // Prisma errors
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        return reply.code(404).send({ error: 'Registro não encontrado', statusCode: 404 })
      }
      if (err.code === 'P2002') {
        return reply.code(409).send({ error: 'Registro duplicado', statusCode: 409 })
      }
    }

    // JWT / auth errors from Fastify
    const fastifyError = err as { statusCode?: number; message?: string }
    if (fastifyError.statusCode === 401) {
      return reply.code(401).send({ error: 'Não autorizado', statusCode: 401 })
    }

    // Rate limit
    if (fastifyError.statusCode === 429) {
      return reply.code(429).send({ error: 'Muitas requisições. Tente novamente em breve.', statusCode: 429 })
    }

    // Unexpected error
    request.log.error(err)
    const debugMsg = process.env.NODE_ENV !== 'production' && err instanceof Error ? err.message : undefined
    return reply.code(500).send({ error: 'Erro interno do servidor', statusCode: 500, debug: debugMsg })
  })

  // === HEALTH CHECK ===
  app.get('/api/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  // === ROTAS PÚBLICAS ===
  app.register(authRoutes, { prefix: '/api' })
  app.register(webhookAsaasRoutes, { prefix: '/api' })

  // === ROTAS PROTEGIDAS ===
  app.register(async function protectedRoutes(fastify) {
    // Verificar JWT em toda request
    fastify.addHook('onRequest', async (request) => {
      await request.jwtVerify()
    })

    // Injetar tenantId diretamente (sem register para evitar encapsulação)
    fastify.addHook('preHandler', async (request) => {
      const user = request.user
      if (!user || !user.tenantId) {
        request.log.error({ user }, 'JWT payload sem tenantId')
        throw new ForbiddenError('Token inválido - tenantId ausente')
      }
      const { tenantId } = user

      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, planStatus: true, trialEndsAt: true },
      })

      if (!tenant) throw new ForbiddenError('Tenant não encontrado')

      // Rotas de assinatura sempre permitidas (para poder assinar/pagar)
      const isAssinaturaRoute = request.url.includes('/assinatura') || request.url.includes('/configuracoes')

      if (tenant.planStatus === 'TRIAL' && tenant.trialEndsAt && tenant.trialEndsAt < new Date()) {
        if (!isAssinaturaRoute) {
          throw new PaymentRequiredError('Período de teste expirado. Assine um plano.')
        }
      }

      if (tenant.planStatus === 'PAUSED') {
        if (!isAssinaturaRoute) {
          throw new PaymentRequiredError('Pagamento pendente. Regularize sua assinatura.')
        }
      }

      if (tenant.planStatus === 'CANCELLED') {
        if (!isAssinaturaRoute) {
          throw new ForbiddenError('Conta cancelada. Entre em contato com o suporte.')
        }
      }

      request.tenantId = tenant.id
      request.tenantPlan = tenant.planStatus
    })

    // Rotas protegidas
    fastify.register(clienteRoutes, { prefix: '/api' })
    fastify.register(fornecedorRoutes, { prefix: '/api' })
    fastify.register(produtoRoutes, { prefix: '/api' })
    fastify.register(vendaRoutes, { prefix: '/api' })
    fastify.register(contaPagarRoutes, { prefix: '/api' })
    fastify.register(dashboardRoutes, { prefix: '/api' })
    fastify.register(relatorioRoutes, { prefix: '/api' })
    fastify.register(configuracaoRoutes, { prefix: '/api' })
    fastify.register(assinaturaRoutes, { prefix: '/api' })
  })

  // === START ===
  const port = parseInt(process.env.PORT || '3001')
  const host = '0.0.0.0'

  try {
    await app.listen({ port, host })
    app.log.info(`RevendaGestor API rodando em http://localhost:${port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

bootstrap()
