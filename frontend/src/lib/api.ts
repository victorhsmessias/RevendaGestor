const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

let accessToken: string | null = null
let refreshPromise: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!response.ok) return false

      const { accessToken: newToken } = await response.json()
      accessToken = newToken
      return true
    } catch {
      return false
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

async function request<T>(method: string, endpoint: string, body?: unknown): Promise<T> {
  const headers: HeadersInit = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'include',
  })

  if (response.status === 401) {
    // Só bloquear refresh na rota /auth/refresh (evita loop infinito)
    // Permitir refresh em /auth/me e demais rotas
    if (endpoint !== '/auth/refresh') {
      const refreshed = await refreshAccessToken()
      if (refreshed) return request(method, endpoint, body)
    }

    throw new Error('Sessão expirada')
  }

  // 402 → plano expirado/pagamento pendente → redirecionar para assinatura
  if (response.status === 402) {
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/configuracoes')) {
      window.location.href = '/configuracoes?tab=assinatura'
    }
    const error = await response.json().catch(() => ({ error: 'Plano expirado' }))
    throw new Error(error.error || 'Assine um plano para continuar usando o sistema.')
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro de rede' }))
    throw new Error(error.error || `Erro ${response.status}`)
  }

  return response.json()
}

export const api = {
  get: <T>(endpoint: string) => request<T>('GET', endpoint),
  post: <T>(endpoint: string, body: unknown) => request<T>('POST', endpoint, body),
  patch: <T>(endpoint: string, body: unknown) => request<T>('PATCH', endpoint, body),
  delete: <T = void>(endpoint: string) => request<T>('DELETE', endpoint),

  setToken(token: string) { accessToken = token },
  clearToken() { accessToken = null },
}
