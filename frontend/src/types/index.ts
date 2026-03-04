export interface User {
  id: string
  name: string
  email: string
  role: 'OWNER' | 'ADMIN' | 'USER'
}

export interface Tenant {
  id: string
  name: string
  planStatus: 'ACTIVE' | 'TRIAL' | 'PAUSED' | 'CANCELLED'
  trialEndsAt?: string
}

export interface AuthResponse {
  accessToken: string
  user: User
  tenant: Tenant
}

export interface MeResponse {
  user: User
  tenant: Tenant
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface ApiError {
  error: string
  statusCode: number
  details?: Record<string, string>
}
