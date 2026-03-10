import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { cleanupTestData } from './helpers'
import { buildApp } from '../src/app'
import type { FastifyInstance } from 'fastify'

const ADMIN_EMAIL = `admin-${Date.now()}@test.com`
let app: FastifyInstance
let adminToken: string
let normalToken: string
let tenantId: string

beforeAll(async () => {
  // Setar ADMIN_EMAILS ANTES de importar/construir a app
  process.env.ADMIN_EMAILS = ADMIN_EMAIL
  // Forçar reimport do módulo admin com a env atualizada
  app = await buildApp({ logger: false })

  // Registrar via inject direto nessa app
  const adminRes = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: {
      name: 'Super Admin',
      email: ADMIN_EMAIL,
      password: 'admin123456',
      tenantName: 'Admin Tenant',
    },
  })
  const adminBody = JSON.parse(adminRes.body)
  adminToken = adminBody.accessToken
  tenantId = adminBody.tenant.id

  const normalEmail = `normal-${Date.now()}@test.com`
  const normalRes = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: {
      name: 'Normal User',
      email: normalEmail,
      password: 'normal123456',
      tenantName: 'Normal Tenant',
    },
  })
  normalToken = JSON.parse(normalRes.body).accessToken
})

afterAll(async () => {
  await cleanupTestData()
  if (app) await app.close()
})

function adminRequest(token: string, method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE', url: string, payload?: unknown) {
  return app.inject({
    method,
    url,
    headers: { authorization: `Bearer ${token}` },
    payload: payload as Record<string, unknown>,
  })
}

describe('GET /api/admin/stats', () => {
  it('admin deve ver estatísticas', async () => {
    const res = await adminRequest(adminToken, 'GET', '/api/admin/stats')

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.totalTenants).toBeDefined()
    expect(body.totalUsers).toBeDefined()
    expect(body.totalVendas).toBeDefined()
    expect(body.tenantsByStatus).toBeDefined()
  })

  it('usuário normal não deve ter acesso', async () => {
    const res = await adminRequest(normalToken, 'GET', '/api/admin/stats')
    expect(res.statusCode).toBe(403)
  })
})

describe('GET /api/admin/tenants', () => {
  it('admin deve listar tenants', async () => {
    const res = await adminRequest(adminToken, 'GET', '/api/admin/tenants')

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(Array.isArray(body)).toBe(true)
    expect(body.length).toBeGreaterThanOrEqual(1)
    expect(body[0].name).toBeDefined()
  })

  it('usuário normal não deve ter acesso', async () => {
    const res = await adminRequest(normalToken, 'GET', '/api/admin/tenants')
    expect(res.statusCode).toBe(403)
  })
})

describe('GET /api/admin/tenants/:id', () => {
  it('admin deve ver detalhes do tenant', async () => {
    const res = await adminRequest(adminToken, 'GET', `/api/admin/tenants/${tenantId}`)

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.id).toBe(tenantId)
    expect(body.users).toBeDefined()
    expect(body._count).toBeDefined()
  })
})

describe('PATCH /api/admin/tenants/:id', () => {
  it('admin deve alterar status do tenant', async () => {
    const res = await adminRequest(adminToken, 'PATCH', `/api/admin/tenants/${tenantId}`, {
      planStatus: 'ACTIVE',
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.planStatus).toBe('ACTIVE')
  })

  it('usuário normal não deve ter acesso', async () => {
    const res = await adminRequest(normalToken, 'PATCH', `/api/admin/tenants/${tenantId}`, {
      planStatus: 'PAUSED',
    })
    expect(res.statusCode).toBe(403)
  })
})
