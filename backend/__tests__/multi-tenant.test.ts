import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getApp, closeApp, registerUser, authRequest, cleanupTestData } from './helpers'

let tenantA: { accessToken: string; tenant: { id: string } }
let tenantB: { accessToken: string; tenant: { id: string } }

beforeAll(async () => {
  await getApp()
  tenantA = await registerUser({ name: 'User A', email: `tenant-a-${Date.now()}@test.com`, tenantName: 'Loja A' })
  tenantB = await registerUser({ name: 'User B', email: `tenant-b-${Date.now()}@test.com`, tenantName: 'Loja B' })
})

afterAll(async () => {
  await cleanupTestData()
  await closeApp()
})

describe('Isolamento multi-tenant', () => {
  let clienteAId: string

  it('tenant A cria um cliente', async () => {
    const res = await authRequest(tenantA.accessToken, 'POST', '/api/clientes', {
      name: 'Cliente do A',
    })

    expect(res.statusCode).toBe(201)
    const body = JSON.parse(res.body)
    clienteAId = body.id
    expect(body.name).toBe('Cliente do A')
  })

  it('tenant B não vê clientes do tenant A', async () => {
    const res = await authRequest(tenantB.accessToken, 'GET', '/api/clientes')

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    const clientes = body.items || body.data || body
    const found = Array.isArray(clientes) && clientes.find((c: { id: string }) => c.id === clienteAId)
    expect(found).toBeFalsy()
  })

  it('tenant A vê seus proprios clientes', async () => {
    const res = await authRequest(tenantA.accessToken, 'GET', '/api/clientes')

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    const clientes = body.items || body.data || body
    const found = Array.isArray(clientes) && clientes.find((c: { id: string }) => c.id === clienteAId)
    expect(found).toBeTruthy()
  })

  it('dashboards retornam dados diferentes', async () => {
    const resA = await authRequest(tenantA.accessToken, 'GET', '/api/dashboard')
    const resB = await authRequest(tenantB.accessToken, 'GET', '/api/dashboard')

    expect(resA.statusCode).toBe(200)
    expect(resB.statusCode).toBe(200)

    const dashA = JSON.parse(resA.body)
    const dashB = JSON.parse(resB.body)

    // Tenant A tem 1 cliente, Tenant B tem 0
    expect(dashA.clientes).toBeGreaterThanOrEqual(1)
    expect(dashB.clientes).toBe(0)
  })
})

describe('Rotas protegidas sem autenticação', () => {
  it('deve rejeitar acesso sem token', async () => {
    const app = await getApp()
    const routes = [
      { method: 'GET' as const, url: '/api/clientes' },
      { method: 'GET' as const, url: '/api/produtos' },
      { method: 'GET' as const, url: '/api/vendas' },
      { method: 'GET' as const, url: '/api/dashboard' },
    ]

    for (const route of routes) {
      const res = await app.inject(route)
      expect(res.statusCode).toBe(401)
    }
  })
})
