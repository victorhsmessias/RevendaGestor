import { FastifyInstance } from 'fastify'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { prisma } from '../lib/prisma'
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../lib/validators'
import { UnauthorizedError, ConflictError, ValidationError } from '../lib/errors'
import { sendPasswordResetEmail } from '../lib/email'

const REFRESH_TOKEN_EXPIRY_DAYS = 7
const ACCESS_TOKEN_EXPIRY = '15m'

function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex')
}

function getRefreshCookieOptions() {
  return {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60, // seconds
  }
}

export async function authRoutes(fastify: FastifyInstance) {

  // POST /api/auth/register
  fastify.post('/auth/register', async (request, reply) => {
    const data = registerSchema.parse(request.body)

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })
    if (existingUser) throw new ConflictError('Email já cadastrado')

    const hashedPassword = await bcrypt.hash(data.password, 10)

    // Criar tenant + user em transação
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.tenantName,
          planStatus: 'TRIAL',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 dias
        },
      })

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: 'OWNER',
        },
      })

      // Criar refresh token
      const refreshTokenValue = generateRefreshToken()
      await tx.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshTokenValue,
          expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
        },
      })

      return { user, tenant, refreshToken: refreshTokenValue }
    })

    // Gerar access token
    const accessToken = fastify.jwt.sign(
      {
        id: result.user.id,
        email: result.user.email,
        tenantId: result.tenant.id,
        role: result.user.role,
      },
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    )

    // Set refresh token cookie
    reply.setCookie('refreshToken', result.refreshToken, getRefreshCookieOptions())

    return reply.code(201).send({
      accessToken,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        planStatus: result.tenant.planStatus,
        trialEndsAt: result.tenant.trialEndsAt,
      },
    })
  })

  // POST /api/auth/login
  fastify.post('/auth/login', async (request, reply) => {
    const data = loginSchema.parse(request.body)

    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { tenant: true },
    })

    if (!user) throw new UnauthorizedError('Email ou senha inválidos')

    const validPassword = await bcrypt.compare(data.password, user.password)
    if (!validPassword) throw new UnauthorizedError('Email ou senha inválidos')

    // Limpar refresh tokens antigos do user
    await prisma.refreshToken.deleteMany({
      where: {
        userId: user.id,
        expiresAt: { lt: new Date() },
      },
    })

    // Criar novo refresh token
    const refreshTokenValue = generateRefreshToken()
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshTokenValue,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      },
    })

    const accessToken = fastify.jwt.sign(
      {
        id: user.id,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role,
      },
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    )

    reply.setCookie('refreshToken', refreshTokenValue, getRefreshCookieOptions())

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        planStatus: user.tenant.planStatus,
        trialEndsAt: user.tenant.trialEndsAt,
      },
    }
  })

  // POST /api/auth/refresh
  fastify.post('/auth/refresh', async (request, reply) => {
    const token = request.cookies.refreshToken
    if (!token) throw new UnauthorizedError('Refresh token não encontrado')

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: {
        user: {
          include: { tenant: true },
        },
      },
    })

    if (!storedToken || storedToken.expiresAt < new Date()) {
      if (storedToken) {
        await prisma.refreshToken.delete({ where: { id: storedToken.id } })
      }
      reply.clearCookie('refreshToken', { path: '/' })
      throw new UnauthorizedError('Refresh token inválido ou expirado')
    }

    // Rotacionar refresh token
    const newRefreshTokenValue = generateRefreshToken()
    await prisma.$transaction([
      prisma.refreshToken.delete({ where: { id: storedToken.id } }),
      prisma.refreshToken.create({
        data: {
          userId: storedToken.userId,
          token: newRefreshTokenValue,
          expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
        },
      }),
    ])

    const accessToken = fastify.jwt.sign(
      {
        id: storedToken.user.id,
        email: storedToken.user.email,
        tenantId: storedToken.user.tenantId,
        role: storedToken.user.role,
      },
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    )

    reply.setCookie('refreshToken', newRefreshTokenValue, getRefreshCookieOptions())

    return { accessToken }
  })

  // POST /api/auth/logout
  fastify.post('/auth/logout', async (request, reply) => {
    const token = request.cookies.refreshToken
    if (token) {
      await prisma.refreshToken.deleteMany({ where: { token } })
    }
    reply.clearCookie('refreshToken', { path: '/' })
    return { message: 'Logout realizado com sucesso' }
  })

  // GET /api/auth/me (protegido)
  fastify.get('/auth/me', async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch {
      throw new UnauthorizedError('Token inválido')
    }

    const user = await prisma.user.findUnique({
      where: { id: request.user.id },
      include: { tenant: true },
    })

    if (!user) throw new UnauthorizedError('Usuário não encontrado')

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        planStatus: user.tenant.planStatus,
        trialEndsAt: user.tenant.trialEndsAt,
      },
    }
  })

  // POST /api/auth/forgot-password
  fastify.post('/auth/forgot-password', async (request) => {
    const { email } = forgotPasswordSchema.parse(request.body)

    const user = await prisma.user.findUnique({ where: { email } })

    // Sempre retorna sucesso (nao revelar se email existe)
    if (!user) return { message: 'Se o email existir, enviaremos um link de recuperacao.' }

    // Limpar tokens antigos
    await prisma.passwordReset.deleteMany({ where: { userId: user.id } })

    // Gerar token
    const token = crypto.randomBytes(32).toString('hex')
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hora
      },
    })

    // Enviar email com link de recuperacao
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`
    await sendPasswordResetEmail(email, user.name, resetUrl)

    return { message: 'Se o email existir, enviaremos um link de recuperacao.' }
  })

  // POST /api/auth/reset-password
  fastify.post('/auth/reset-password', async (request) => {
    const { token, password } = resetPasswordSchema.parse(request.body)

    const resetToken = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!resetToken || resetToken.expiresAt < new Date()) {
      if (resetToken) await prisma.passwordReset.delete({ where: { id: resetToken.id } })
      throw new ValidationError('Link expirado ou invalido. Solicite um novo.')
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordReset.delete({ where: { id: resetToken.id } }),
    ])

    return { message: 'Senha alterada com sucesso.' }
  })
}
