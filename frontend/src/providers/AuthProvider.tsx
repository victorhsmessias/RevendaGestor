'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import type { User, Tenant, MeResponse } from '@/types'

interface AuthContextType {
  user: User | null
  tenant: Tenant | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (accessToken: string, user: User, tenant: Tenant) => void
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.get<MeResponse>('/auth/me')
      setUser(data.user)
      setTenant(data.tenant)
    } catch {
      // Se /auth/me falhou (mesmo após tentativa automática de refresh no api.ts),
      // a sessão realmente expirou
      setUser(null)
      setTenant(null)
      api.clearToken()
    }
  }, [])

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false))
  }, [refreshUser])

  const login = useCallback((accessToken: string, userData: User, tenantData: Tenant) => {
    api.setToken(accessToken)
    setUser(userData)
    setTenant(tenantData)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout', {})
    } catch {
      // Ignora erro no logout
    }
    api.clearToken()
    setUser(null)
    setTenant(null)
    router.push('/login')
  }, [router])

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
