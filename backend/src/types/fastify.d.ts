import 'fastify'

declare module 'fastify' {
  interface FastifyRequest {
    tenantId: string
    tenantPlan: 'ACTIVE' | 'TRIAL' | 'PAUSED' | 'CANCELLED'
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      id: string
      email: string
      tenantId: string
      role: 'OWNER' | 'ADMIN' | 'USER'
    }
    user: {
      id: string
      email: string
      tenantId: string
      role: 'OWNER' | 'ADMIN' | 'USER'
    }
  }
}
