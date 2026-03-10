import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getApp, closeApp, registerUser, authRequest, cleanupTestData } from './helpers'

let token: string
let clienteId: string
let vendaId: string

beforeAll(async () => {
  await getApp()
  const user = await registerUser({
    email: `vendas-${Date.now()}@test.com`,
    tenantName: 'Loja Vendas Test',
  })
  token = user.accessToken

  // Criar cliente (sem phone para evitar problemas de regex)
  const clienteRes = await authRequest(token, 'POST', '/api/clientes', {
    name: 'Cliente Venda Test',
  })
  clienteId = JSON.parse(clienteRes.body).id
})

afterAll(async () => {
  await cleanupTestData()
  await closeApp()
})

describe('POST /api/vendas', () => {
  it('deve criar uma venda manual', async () => {
    const res = await authRequest(token, 'POST', '/api/vendas', {
      clienteId,
      formaPagamento: 'FIADO',
      valorManual: 150,
      parcelas: 1,
    })

    expect(res.statusCode).toBe(201)
    const body = JSON.parse(res.body)
    vendaId = body.id
    expect(body.total).toBe(150)
    expect(body.status).toBe('PENDING')
  })

  it('deve rejeitar venda sem cliente', async () => {
    const res = await authRequest(token, 'POST', '/api/vendas', {
      clienteId: '00000000-0000-0000-0000-000000000000',
      formaPagamento: 'PIX',
      valorManual: 100,
      parcelas: 1,
    })

    expect(res.statusCode).toBe(400)
  })

  it('deve rejeitar venda sem valor e sem itens', async () => {
    const res = await authRequest(token, 'POST', '/api/vendas', {
      clienteId,
      formaPagamento: 'PIX',
      parcelas: 1,
    })

    expect(res.statusCode).toBe(400)
  })
})

describe('GET /api/vendas', () => {
  it('deve listar vendas', async () => {
    const res = await authRequest(token, 'GET', '/api/vendas')

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.items).toBeDefined()
    expect(body.items.length).toBeGreaterThanOrEqual(1)
    expect(body.pagination).toBeDefined()
  })
})

describe('GET /api/vendas/:id', () => {
  it('deve retornar detalhes da venda', async () => {
    const res = await authRequest(token, 'GET', `/api/vendas/${vendaId}`)

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.id).toBe(vendaId)
    expect(body.parcelas).toBeDefined()
  })
})

describe('POST /api/vendas/:id/pagamentos', () => {
  it('deve registrar um pagamento parcial', async () => {
    const res = await authRequest(token, 'POST', `/api/vendas/${vendaId}/pagamentos`, {
      valor: 50,
      formaPagamento: 'PIX',
    })

    expect(res.statusCode).toBe(201)
    const body = JSON.parse(res.body)
    expect(body.valorPago).toBe(50)
    expect(body.saldoDevedor).toBe(100)
  })

  it('deve rejeitar pagamento maior que saldo devedor', async () => {
    const res = await authRequest(token, 'POST', `/api/vendas/${vendaId}/pagamentos`, {
      valor: 999,
      formaPagamento: 'PIX',
    })

    expect(res.statusCode).toBe(400)
  })
})
