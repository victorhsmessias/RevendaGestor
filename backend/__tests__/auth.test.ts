import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getApp, closeApp, registerUser, cleanupTestData } from './helpers'

beforeAll(async () => {
  await getApp()
})

afterAll(async () => {
  await cleanupTestData()
  await closeApp()
})

describe('POST /api/auth/register', () => {
  it('deve registrar um novo usuário com sucesso', async () => {
    const result = await registerUser()

    expect(result.statusCode).toBe(201)
    expect(result.accessToken).toBeDefined()
    expect(result.user).toBeDefined()
    expect(result.user.role).toBe('OWNER')
    expect(result.tenant).toBeDefined()
    expect(result.tenant.planStatus).toBe('TRIAL')
  })

  it('deve rejeitar email duplicado', async () => {
    const email = `dup-${Date.now()}@test.com`
    await registerUser({ email })

    const app = await getApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: 'Outro',
        email,
        password: 'test123456',
        tenantName: 'Outra Loja',
      },
    })

    expect(res.statusCode).toBe(409)
  })

  it('deve rejeitar dados inválidos', async () => {
    const app = await getApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: '',
        email: 'invalido',
        password: '12',
        tenantName: '',
      },
    })

    expect(res.statusCode).toBe(400)
  })
})

describe('POST /api/auth/login', () => {
  const email = `login-${Date.now()}@test.com`
  const password = 'minhasenha123'

  beforeAll(async () => {
    await registerUser({ email, password })
  })

  it('deve fazer login com credenciais corretas', async () => {
    const app = await getApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email, password },
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.accessToken).toBeDefined()
    expect(body.user.email).toBe(email)
  })

  it('deve rejeitar senha incorreta', async () => {
    const app = await getApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email, password: 'senhaerrada' },
    })

    expect(res.statusCode).toBe(401)
  })

  it('deve rejeitar email inexistente', async () => {
    const app = await getApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'naoexiste@test.com', password: 'qualquer' },
    })

    expect(res.statusCode).toBe(401)
  })
})

describe('GET /api/auth/me', () => {
  it('deve retornar dados do usuário autenticado', async () => {
    const { accessToken } = await registerUser()
    const app = await getApp()

    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${accessToken}` },
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.user).toBeDefined()
    expect(body.tenant).toBeDefined()
  })

  it('deve rejeitar sem token', async () => {
    const app = await getApp()
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
    })

    expect(res.statusCode).toBe(401)
  })

  it('deve rejeitar token inválido', async () => {
    const app = await getApp()
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: 'Bearer tokeninvalido123' },
    })

    expect(res.statusCode).toBe(401)
  })
})

describe('POST /api/auth/logout', () => {
  it('deve fazer logout com sucesso', async () => {
    const app = await getApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
    })

    expect(res.statusCode).toBe(200)
  })
})

describe('GET /api/health', () => {
  it('deve retornar status ok', async () => {
    const app = await getApp()
    const res = await app.inject({
      method: 'GET',
      url: '/api/health',
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.status).toBe('ok')
  })
})
