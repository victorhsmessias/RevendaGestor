import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
})
export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  tenantName: z.string().min(2, 'Nome da loja deve ter no mínimo 2 caracteres'),
})
export type RegisterInput = z.infer<typeof registerSchema>
