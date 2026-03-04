# VendaMax - Regras de Desenvolvimento

## Visão Geral

VendaMax é um SaaS multi-tenant para revendedoras de cosméticos (Natura, Boticário, Avon).
Permite controlar todo o ciclo de vendas: cadastro de clientes/produtos, vendas parceladas,
controle financeiro de contas a pagar/receber, dashboard com KPIs e relatórios.

### Stack

| Camada    | Tecnologia                                      |
|-----------|--------------------------------------------------|
| Frontend  | Next.js 14 (App Router) + TypeScript + TailwindCSS + shadcn/ui |
| Backend   | Fastify + TypeScript                             |
| ORM       | Prisma                                           |
| Database  | PostgreSQL (Supabase)                            |
| Auth      | JWT (access token curto) + httpOnly cookie (refresh token) |
| Cache     | React Query (frontend) + Redis (backend, opcional) |
| Validação | Zod (compartilhado backend/frontend)             |
| State     | Zustand (estado global frontend)                 |
| Deploy    | Vercel (frontend) + Railway/Render (backend)     |

---

## Arquitetura de Pastas

```
vendamax/
├── backend/
│   └── src/
│       ├── server.ts              # Entry point Fastify
│       ├── routes/                # Uma rota por recurso
│       ├── middleware/            # Auth, tenant, plan
│       ├── services/              # Lógica de negócio complexa
│       ├── lib/
│       │   ├── prisma.ts          # Instância Prisma
│       │   ├── validators.ts      # Schemas Zod compartilhados
│       │   └── errors.ts          # Classes de erro customizadas
│       ├── types/                 # Tipos TypeScript
│       └── utils/                 # Helpers puros
│   └── prisma/
│       └── schema.prisma
│
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── (auth)/            # Login, registro (públicas)
│       │   └── (dashboard)/       # Rotas protegidas
│       ├── components/
│       │   ├── ui/                # shadcn/ui base components
│       │   ├── forms/             # Forms por recurso
│       │   ├── charts/            # Gráficos (Recharts)
│       │   └── layout/            # Navbar, Sidebar
│       ├── hooks/                 # React Query hooks
│       ├── lib/
│       │   ├── api.ts             # HTTP client
│       │   ├── validators.ts      # Schemas Zod
│       │   └── utils.ts           # Helpers
│       └── types/                 # Tipos TypeScript
│
└── CLAUDE.md                      # Este arquivo
```

---

## PADRÃO 1: ROTAS BACKEND (Fastify)

As rotas são limpas - sem try/catch repetitivo. Erros são tratados pelo error handler global (Padrão 12).
O tenantId é injetado pelo middleware (Padrão 2). A validação usa schema Fastify integrado com Zod (Padrão 3).

```typescript
// backend/src/routes/clientes.ts
import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import {
  createClienteSchema,
  updateClienteSchema,
  paginationSchema,
  type CreateCliente,
  type UpdateCliente,
} from '../lib/validators'
import { zodToFastifySchema } from '../lib/zod-fastify'

export async function clienteRoutes(fastify: FastifyInstance) {

  // POST - Criar
  fastify.post<{ Body: CreateCliente }>(
    '/clientes',
    { schema: { body: zodToFastifySchema(createClienteSchema) } },
    async (request, reply) => {
      const result = await prisma.cliente.create({
        data: {
          ...request.body,
          tenantId: request.tenantId,
        },
      })
      return reply.code(201).send(result)
    }
  )

  // GET - Listar com paginação
  fastify.get('/clientes', async (request) => {
    const { page, limit, search } = paginationSchema.parse(request.query)

    const where = {
      tenantId: request.tenantId,
      deletedAt: null,
      ...(search && {
        name: { contains: search, mode: 'insensitive' as const },
      }),
    }

    const [items, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.cliente.count({ where }),
    ])

    return {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    }
  })

  // GET - Detalhes
  fastify.get<{ Params: { id: string } }>('/clientes/:id', async (request, reply) => {
    const item = await prisma.cliente.findFirst({
      where: {
        id: request.params.id,
        tenantId: request.tenantId,
        deletedAt: null,
      },
    })

    if (!item) return reply.code(404).send({ error: 'Cliente não encontrado' })
    return item
  })

  // PATCH - Editar
  fastify.patch<{ Params: { id: string }; Body: UpdateCliente }>(
    '/clientes/:id',
    { schema: { body: zodToFastifySchema(updateClienteSchema) } },
    async (request, reply) => {
      const exists = await prisma.cliente.findFirst({
        where: { id: request.params.id, tenantId: request.tenantId, deletedAt: null },
      })
      if (!exists) return reply.code(404).send({ error: 'Cliente não encontrado' })

      return prisma.cliente.update({
        where: { id: request.params.id },
        data: request.body,
      })
    }
  )

  // DELETE - Soft delete
  fastify.delete<{ Params: { id: string } }>('/clientes/:id', async (request, reply) => {
    const exists = await prisma.cliente.findFirst({
      where: { id: request.params.id, tenantId: request.tenantId, deletedAt: null },
    })
    if (!exists) return reply.code(404).send({ error: 'Cliente não encontrado' })

    await prisma.cliente.update({
      where: { id: request.params.id },
      data: { deletedAt: new Date() },
    })

    return { message: 'Cliente removido com sucesso' }
  })
}
```

### Regras obrigatórias para rotas

1. **SEMPRE usar `request.tenantId`** (injetado pelo middleware, nunca do body)
2. **SEMPRE filtrar `deletedAt: null`** em queries de leitura
3. **DELETE faz soft delete** (`update` com `deletedAt: new Date()`)
4. **Sem try/catch** nas rotas - o error handler global trata tudo
5. **Schema Fastify via Zod** para validação automática antes do handler
6. **Tipar generics** `<{ Body, Params, Querystring }>` do Fastify
7. **Status HTTP correto**: 201 create, 404 not found, 400 validation
8. **Usar `findFirst` com tenantId** em vez de `findUnique` para segurança

---

## PADRÃO 2: MIDDLEWARE DE TENANT

Middleware centralizado que injeta `tenantId` em toda request autenticada,
verifica se o tenant existe e se o plano está ativo.

```typescript
// backend/src/middleware/tenant.ts
import { FastifyInstance, FastifyRequest } from 'fastify'
import { prisma } from '../lib/prisma'
import { ForbiddenError, PaymentRequiredError } from '../lib/errors'

declare module 'fastify' {
  interface FastifyRequest {
    tenantId: string
    tenantPlan: 'ACTIVE' | 'TRIAL' | 'PAUSED' | 'CANCELLED'
  }
}

export async function tenantMiddleware(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request: FastifyRequest) => {
    // Rotas públicas não passam por aqui (registradas sem este plugin)
    const { tenantId } = request.user as { tenantId: string }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, planStatus: true, trialEndsAt: true },
    })

    if (!tenant) throw new ForbiddenError('Tenant não encontrado')

    // Verificar se trial expirou
    if (tenant.planStatus === 'TRIAL' && tenant.trialEndsAt && tenant.trialEndsAt < new Date()) {
      throw new PaymentRequiredError('Período de teste expirado. Assine um plano.')
    }

    if (tenant.planStatus === 'CANCELLED') {
      throw new ForbiddenError('Conta cancelada. Entre em contato com o suporte.')
    }

    request.tenantId = tenant.id
    request.tenantPlan = tenant.planStatus
  })
}
```

### Uso no server.ts

```typescript
// backend/src/server.ts
import Fastify from 'fastify'
import { tenantMiddleware } from './middleware/tenant'
import { clienteRoutes } from './routes/clientes'

const app = Fastify({ logger: pinoConfig })

// Rotas públicas (sem tenant middleware)
app.register(authRoutes, { prefix: '/api' })

// Rotas protegidas (com tenant middleware)
app.register(async function protectedRoutes(fastify) {
  fastify.addHook('onRequest', async (request) => {
    await request.jwtVerify()
  })
  fastify.register(tenantMiddleware)
  fastify.register(clienteRoutes, { prefix: '/api' })
  fastify.register(produtoRoutes, { prefix: '/api' })
  // ... demais rotas
})
```

---

## PADRÃO 3: VALIDAÇÃO ZOD

### Schemas reutilizáveis

```typescript
// backend/src/lib/validators.ts (e frontend/src/lib/validators.ts - compartilhados)
import { z } from 'zod'

// === Validadores base ===
export const emailValidator = z.string().email('Email inválido')
export const cpfValidator = z.string().regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, 'CPF inválido')
export const phoneValidator = z.string().regex(/^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/, 'Telefone inválido')
export const currencyValidator = z.number().nonnegative('Valor não pode ser negativo')

// === Paginação (usar em TODA listagem) ===
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional().default(''),
})
export type Pagination = z.infer<typeof paginationSchema>

// === Cliente ===
export const createClienteSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: emailValidator.optional().or(z.literal('')),
  phone: phoneValidator.optional().or(z.literal('')),
  cpf: cpfValidator.optional().or(z.literal('')),
  city: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
})
export const updateClienteSchema = createClienteSchema.partial()
export type CreateCliente = z.infer<typeof createClienteSchema>
export type UpdateCliente = z.infer<typeof updateClienteSchema>

// === Produto ===
export const createProdutoSchema = z.object({
  code: z.string().min(1, 'Código obrigatório'),
  name: z.string().min(2, 'Nome obrigatório'),
  costPrice: currencyValidator.positive('Preço de custo deve ser positivo'),
  salePrice: currencyValidator.positive('Preço de venda deve ser positivo'),
  fornecedorId: z.string().uuid('Fornecedor obrigatório'),
  quantity: z.number().int().nonnegative('Quantidade não pode ser negativa'),
  minStock: z.number().int().nonnegative().default(0),
}).refine(data => data.salePrice > data.costPrice, {
  message: 'Preço de venda deve ser maior que o custo',
  path: ['salePrice'],
})
export const updateProdutoSchema = createProdutoSchema.partial()
export type CreateProduto = z.infer<typeof createProdutoSchema>
export type UpdateProduto = z.infer<typeof updateProdutoSchema>

// === Venda ===
export const createVendaSchema = z.object({
  clienteId: z.string().uuid('Cliente obrigatório'),
  items: z.array(z.object({
    produtoId: z.string().uuid(),
    quantity: z.number().int().positive('Quantidade mínima é 1'),
    unitPrice: currencyValidator.positive(),
  })).min(1, 'Venda deve ter pelo menos 1 item'),
  parcelas: z.number().int().min(1).max(12, 'Máximo 12 parcelas'),
  formaPagamento: z.enum(['DINHEIRO', 'PIX', 'CARTAO', 'BOLETO', 'FIADO']),
  discount: currencyValidator.default(0),
  notes: z.string().optional(),
})
export type CreateVenda = z.infer<typeof createVendaSchema>
```

### Integração Zod → Fastify Schema

```typescript
// backend/src/lib/zod-fastify.ts
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

export function zodToFastifySchema(schema: z.ZodType) {
  return zodToJsonSchema(schema, { target: 'openApi3' })
}
```

### Regras Zod

1. **Um schema por ação** (create, update)
2. **`update = create.partial()`** sempre
3. **Mensagens de erro em português**
4. **`z.coerce`** para query strings (page, limit)
5. **`refine()`** para validações cross-field
6. **Exportar tipo** com `z.infer<typeof schema>`
7. **Campos opcionais**: usar `.optional().or(z.literal(''))` para forms que enviam string vazia

---

## PADRÃO 4: COMPONENTES FRONTEND

```typescript
// frontend/src/components/forms/ClienteForm.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClienteSchema, type CreateCliente } from '@/lib/validators'
import { useCreateCliente, useUpdateCliente } from '@/hooks/useClientes'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ClienteFormProps {
  onSuccess?: () => void
  mode?: 'create' | 'edit'
  initialData?: CreateCliente & { id: string }
}

export function ClienteForm({ onSuccess, mode = 'create', initialData }: ClienteFormProps) {
  const createMutation = useCreateCliente()
  const updateMutation = useUpdateCliente()
  const isLoading = createMutation.isPending || updateMutation.isPending

  const form = useForm<CreateCliente>({
    resolver: zodResolver(createClienteSchema),
    defaultValues: initialData,
  })

  const onSubmit = async (data: CreateCliente) => {
    try {
      if (mode === 'edit' && initialData?.id) {
        await updateMutation.mutateAsync({ id: initialData.id, data })
        toast.success('Cliente atualizado!')
      } else {
        await createMutation.mutateAsync(data)
        toast.success('Cliente criado com sucesso!')
        form.reset()
      }
      onSuccess?.()
    } catch {
      toast.error('Erro ao salvar cliente')
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input placeholder="Nome" {...form.register('name')} disabled={isLoading} />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div>
        <Input placeholder="Email" type="email" {...form.register('email')} disabled={isLoading} />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive mt-1">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div>
        <Input placeholder="Telefone" {...form.register('phone')} disabled={isLoading} />
        {form.formState.errors.phone && (
          <p className="text-sm text-destructive mt-1">{form.formState.errors.phone.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Salvando...' : mode === 'create' ? 'Criar Cliente' : 'Atualizar'}
      </Button>
    </form>
  )
}
```

### Regras de componentes

1. **`'use client'`** em componentes interativos
2. **Props tipadas com interface** (nunca `any`)
3. **react-hook-form + zodResolver** para forms
4. **Usar mutations do hook** em vez de chamar api diretamente
5. **`isPending`** do mutation para loading state
6. **shadcn/ui** para componentes base
7. **TailwindCSS** para estilos - usar classes do design system (`text-destructive` em vez de `text-red-500`)
8. **toast via sonner** para feedback

---

## PADRÃO 5: HOOKS REACT QUERY

Tipagem forte, sem `any`. Cada hook retorna o query/mutation diretamente.

```typescript
// frontend/src/hooks/useClientes.ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { CreateCliente, UpdateCliente } from '@/lib/validators'
import type { PaginatedResponse } from '@/types'

// Tipo da entidade (vem do backend)
interface Cliente {
  id: string
  name: string
  email?: string
  phone?: string
  cpf?: string
  city?: string
  createdAt: string
}

// GET - Listar
export function useClientes(page = 1, search = '') {
  return useQuery({
    queryKey: ['clientes', page, search],
    queryFn: () => api.get<PaginatedResponse<Cliente>>(
      `/clientes?page=${page}&limit=10&search=${search}`
    ),
    staleTime: 1000 * 60 * 5,
  })
}

// GET - Detalhes
export function useCliente(id: string) {
  return useQuery({
    queryKey: ['clientes', id],
    queryFn: () => api.get<Cliente>(`/clientes/${id}`),
    enabled: !!id,
  })
}

// POST - Criar
export function useCreateCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCliente) => api.post<Cliente>('/clientes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
    },
  })
}

// PATCH - Editar
export function useUpdateCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCliente }) =>
      api.patch<Cliente>(`/clientes/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      queryClient.invalidateQueries({ queryKey: ['clientes', variables.id] })
    },
  })
}

// DELETE - Remover
export function useDeleteCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete(`/clientes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
    },
  })
}
```

### Regras de hooks

1. **Tipagem explícita** nos generics de `api.get<T>`, `api.post<T>` - nunca `any`
2. **queryKey hierárquica**: `['recurso']` para lista, `['recurso', id]` para detalhe
3. **Invalidar cache** no `onSuccess` de mutations
4. **staleTime 5 minutos** padrão em queries de listagem
5. **`enabled: !!id`** em queries que dependem de parâmetro
6. **Um hook por operação**: `useClientes`, `useCliente`, `useCreateCliente`, `useUpdateCliente`, `useDeleteCliente`
7. **Update mutation recebe `{ id, data }`** como objeto único

---

## PADRÃO 6: PÁGINAS NEXT.JS

```typescript
// frontend/src/app/(dashboard)/clientes/page.tsx
'use client'

import { useState } from 'react'
import { useClientes, useDeleteCliente } from '@/hooks/useClientes'
import { ClienteForm } from '@/components/forms/ClienteForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

export default function ClientesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)

  const { data, isLoading, error } = useClientes(page, search)
  const deleteMutation = useDeleteCliente()

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este cliente?')) return
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Cliente removido')
    } catch {
      toast.error('Erro ao remover')
    }
  }

  const handleFormSuccess = () => {
    setIsDialogOpen(false)
    setSelectedItem(null)
  }

  const openCreate = () => {
    setSelectedItem(null)
    setIsDialogOpen(true)
  }

  const openEdit = (item: any) => {
    setSelectedItem(item)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Clientes</h1>
        <Button onClick={openCreate}>+ Novo Cliente</Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Buscar cliente..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1) }}
      />

      {/* States */}
      {isLoading && <p className="text-muted-foreground">Carregando...</p>}
      {error && <p className="text-destructive">Erro ao carregar clientes</p>}
      {data && data.items.length === 0 && (
        <p className="text-muted-foreground">Nenhum cliente encontrado</p>
      )}

      {/* Table */}
      {data && data.items.length > 0 && (
        <>
          <div className="border rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Nome</th>
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-left p-3 font-medium">Telefone</th>
                  <th className="text-right p-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="p-3">{item.name}</td>
                    <td className="p-3">{item.email || '-'}</td>
                    <td className="p-3">{item.phone || '-'}</td>
                    <td className="p-3 text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                        Remover
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {page} de {data.pagination.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= data.pagination.pages}
            >
              Próxima
            </Button>
          </div>
        </>
      )}

      {/* Dialog Create/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
          </DialogHeader>
          <ClienteForm
            mode={selectedItem ? 'edit' : 'create'}
            initialData={selectedItem}
            onSuccess={handleFormSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

### Regras de páginas

1. **`'use client'`** no topo
2. **Hooks customizados** para dados (nunca chamar api direto na page)
3. **Estados**: page, search, isDialogOpen, selectedItem
4. **3 estados visuais**: loading, error, empty
5. **Dialog (shadcn)** para create/edit - não Modal customizado
6. **Paginação** com botões e indicador de página
7. **Confirmar antes de deletar** com `confirm()`

---

## PADRÃO 7: API CLIENT

Usa httpOnly cookies para refresh token. Access token em memória (não localStorage).
Mutex para evitar race condition em refresh simultâneo.

```typescript
// frontend/src/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

let accessToken: string | null = null
let refreshPromise: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  // Mutex: se já está fazendo refresh, espera o mesmo
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Envia httpOnly cookie
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
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  })

  // 401 → tenta refresh uma vez
  if (response.status === 401) {
    const refreshed = await refreshAccessToken()
    if (refreshed) return request(method, endpoint, body)

    // Refresh falhou → redirecionar para login
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    throw new Error('Sessão expirada')
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
```

### Diferenças vs versão anterior

- **Sem localStorage** - access token fica em variável de memória (mais seguro contra XSS)
- **Refresh token via httpOnly cookie** - browser envia automaticamente
- **Mutex no refresh** - se 5 requests falham com 401, só 1 refresh é feito
- **Objeto simples** em vez de classe - mais leve, tree-shakeable

---

## PADRÃO 8: TIPOS TYPESCRIPT

```typescript
// Compartilhado entre frontend e backend

export interface User {
  id: string
  email: string
  name: string
  role: 'OWNER' | 'ADMIN' | 'USER'
}

export interface Tenant {
  id: string
  name: string
  planStatus: 'ACTIVE' | 'TRIAL' | 'PAUSED' | 'CANCELLED'
  trialEndsAt?: string
}

export interface AuthContext {
  user: User | null
  tenant: Tenant | null
  isLoading: boolean
  isAuthenticated: boolean
}

// Response padrão de listagem
export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Response padrão de erro (do backend)
export interface ApiError {
  error: string
  statusCode: number
  details?: Record<string, string>
}
```

### Regras de tipos

1. **Nunca usar `any`** - usar tipo concreto ou `unknown`
2. **Interfaces para objetos**, `type` para unions/intersections
3. **Exportar de `types/index.ts`**
4. **Datas como `string`** no frontend (JSON não tem Date)
5. **Enums como union literals** (`'ACTIVE' | 'TRIAL'`) em vez de `enum`

---

## PADRÃO 9: MULTI-TENANT SECURITY

### Regras obrigatórias

1. **TODA query deve incluir `tenantId`**
   ```typescript
   where: { tenantId: request.tenantId, ... }
   ```

2. **NUNCA aceitar tenantId do cliente**
   ```typescript
   // ERRADO: const tenantId = request.body.tenantId
   // CERTO:  const tenantId = request.tenantId  // do middleware
   ```

3. **Validar propriedade antes de update/delete**
   ```typescript
   const exists = await prisma.cliente.findFirst({
     where: { id, tenantId: request.tenantId, deletedAt: null }
   })
   if (!exists) return reply.code(404).send({ error: 'Não encontrado' })
   ```

4. **Frontend nunca armazena dados sensíveis**
   - Access token em memória (variável JS)
   - Refresh token em httpOnly cookie (gerenciado pelo browser)
   - Dados do tenant vêm do backend

5. **Logs de auditoria para operações destrutivas**
   ```typescript
   fastify.log.info({ tenantId, action: 'DELETE', resource: 'Cliente', resourceId: id })
   ```

---

## PADRÃO 10: TRANSAÇÕES PRISMA

Operações que envolvem múltiplas tabelas devem ser atômicas.

```typescript
// Exemplo: Criar venda (venda + itens + parcelas + atualizar estoque)
async function createVenda(tenantId: string, data: CreateVenda) {
  return prisma.$transaction(async (tx) => {
    // 1. Validar estoque de todos os itens
    for (const item of data.items) {
      const produto = await tx.produto.findFirst({
        where: { id: item.produtoId, tenantId, deletedAt: null },
      })
      if (!produto) throw new NotFoundError(`Produto ${item.produtoId} não encontrado`)
      if (produto.quantity < item.quantity) {
        throw new ValidationError(`Estoque insuficiente para ${produto.name}`)
      }
    }

    // 2. Calcular total
    const subtotal = data.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
    const total = subtotal - data.discount

    // 3. Criar venda
    const venda = await tx.venda.create({
      data: {
        tenantId,
        clienteId: data.clienteId,
        subtotal,
        discount: data.discount,
        total,
        formaPagamento: data.formaPagamento,
        status: 'PENDING',
        notes: data.notes,
      },
    })

    // 4. Criar itens da venda
    await tx.vendaItem.createMany({
      data: data.items.map(item => ({
        vendaId: venda.id,
        produtoId: item.produtoId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.unitPrice * item.quantity,
      })),
    })

    // 5. Atualizar estoque
    for (const item of data.items) {
      await tx.produto.update({
        where: { id: item.produtoId },
        data: { quantity: { decrement: item.quantity } },
      })
    }

    // 6. Criar parcelas
    const valorParcela = total / data.parcelas
    const parcelas = Array.from({ length: data.parcelas }, (_, i) => ({
      vendaId: venda.id,
      tenantId,
      numero: i + 1,
      valor: valorParcela,
      dataVencimento: new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000),
      status: 'PENDING' as const,
    }))

    await tx.parcela.createMany({ data: parcelas })

    return venda
  })
}
```

### Regras de transação

1. **Usar `$transaction`** quando a operação modifica mais de uma tabela
2. **Validar tudo antes de criar** dentro da transação
3. **Se qualquer etapa falhar, tudo faz rollback** automaticamente
4. **Usar `tx` (não `prisma`)** dentro da transação

---

## PADRÃO 11: SOFT DELETE

Entidades que têm relacionamentos (clientes, produtos, fornecedores) usam soft delete.
Entidades puramente transacionais (logs) podem usar hard delete.

### Schema Prisma

```prisma
model Cliente {
  id        String    @id @default(uuid())
  tenantId  String
  name      String
  email     String?
  // ...
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?           // ← soft delete

  tenant    Tenant    @relation(fields: [tenantId], references: [id])
  vendas    Venda[]

  @@index([tenantId, deletedAt])  // ← índice para queries filtradas
}
```

### Regras

1. **Adicionar `deletedAt DateTime?`** em: Cliente, Produto, Fornecedor, Venda
2. **TODA query de leitura** deve incluir `deletedAt: null`
3. **DELETE endpoint faz update** → `data: { deletedAt: new Date() }`
4. **Índice composto** `@@index([tenantId, deletedAt])` para performance
5. **Relatórios podem incluir deletados** quando necessário (filtro explícito)

---

## PADRÃO 12: ERROR HANDLING

### Error handler global (Backend)

```typescript
// backend/src/lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public details?: Record<string, string>,
  ) {
    super(message)
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso não encontrado') { super(message, 404) }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acesso negado') { super(message, 403) }
}

export class PaymentRequiredError extends AppError {
  constructor(message = 'Pagamento necessário') { super(message, 402) }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, string>) {
    super(message, 400, details)
  }
}
```

```typescript
// backend/src/server.ts - registrar UMA vez
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { AppError } from './lib/errors'

app.setErrorHandler((error, request, reply) => {
  // Erros de validação Zod
  if (error instanceof z.ZodError) {
    return reply.code(400).send({
      error: 'Validação falhou',
      statusCode: 400,
      details: Object.fromEntries(
        error.errors.map(e => [e.path.join('.'), e.message])
      ),
    })
  }

  // Erros da aplicação (nossos)
  if (error instanceof AppError) {
    return reply.code(error.statusCode).send({
      error: error.message,
      statusCode: error.statusCode,
      details: error.details,
    })
  }

  // Erros do Prisma
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025') {
      return reply.code(404).send({ error: 'Registro não encontrado', statusCode: 404 })
    }
    if (error.code === 'P2002') {
      return reply.code(409).send({ error: 'Registro duplicado', statusCode: 409 })
    }
  }

  // Erro JWT do Fastify
  if (error.statusCode === 401) {
    return reply.code(401).send({ error: 'Não autorizado', statusCode: 401 })
  }

  // Erro inesperado
  request.log.error(error)
  return reply.code(500).send({ error: 'Erro interno do servidor', statusCode: 500 })
})
```

### Frontend

```typescript
// Padrão em mutations:
try {
  await mutation.mutateAsync(data)
  toast.success('Sucesso!')
} catch (error) {
  const message = error instanceof Error ? error.message : 'Erro desconhecido'
  toast.error(message)
}
```

### Resultado

- **Rotas ficam limpas** - sem try/catch, só lógica de negócio
- **Erros consistentes** - mesmo formato JSON sempre
- **Throw direto** - `throw new NotFoundError()` em qualquer lugar

---

## PADRÃO 13: LOGS ESTRUTURADOS

Fastify usa pino por padrão. Configurar com contexto de tenant.

```typescript
// backend/src/server.ts
const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  },
})

// Hook para adicionar contexto em todo log de request
app.addHook('onRequest', async (request) => {
  if (request.user) {
    request.log = request.log.child({
      tenantId: (request.user as any).tenantId,
      userId: (request.user as any).id,
    })
  }
})
```

### Uso nas rotas

```typescript
// Logs automáticos do Fastify (request/response) já incluem tenantId
// Para logs manuais:
request.log.info({ clienteId: id }, 'Cliente criado')
request.log.warn({ produtoId: id, stock: 0 }, 'Estoque zerado')
request.log.error({ error }, 'Falha ao processar pagamento')
```

### Regras

1. **Nunca usar `console.log`** no backend - usar `request.log` ou `fastify.log`
2. **Primeiro argumento: objeto** com dados relevantes
3. **Segundo argumento: mensagem** descritiva
4. **Níveis**: `error` (falhas), `warn` (atenção), `info` (operações), `debug` (desenvolvimento)

---

## PADRÃO 14: NAMING CONVENTIONS

### Código

```typescript
// Booleans: is, has, can
isLoading, isOpen, hasError, canDelete

// Funções: verbo + substantivo
createCliente(), updateProduto(), deleteVenda()

// Hooks: use + substantivo
useClientes(), useCliente(), useCreateCliente()

// Componentes: PascalCase
ClienteForm, ProdutoTable, VendaDialog

// Arquivos de componente: PascalCase
ClienteForm.tsx, ProdutoTable.tsx

// Outros arquivos: kebab-case
src/routes/clientes.ts
src/lib/validators.ts
src/hooks/useClientes.ts
```

### Database (Prisma)

```prisma
// Models: PascalCase singular
model Cliente { }
model Produto { }
model VendaItem { }

// Campos: camelCase
tenantId, createdAt, deletedAt, salePrice, costPrice

// Status/Enums: UPPER_SNAKE_CASE
PENDING, ACTIVE, CANCELLED, PAID

// Foreign keys: [model]Id
clienteId, produtoId, tenantId
```

### API Endpoints

```
POST   /api/clientes          # Criar
GET    /api/clientes          # Listar (paginado)
GET    /api/clientes/:id      # Detalhes
PATCH  /api/clientes/:id      # Editar parcial
DELETE /api/clientes/:id      # Soft delete

# Recursos compostos: kebab-case
GET    /api/contas-pagar
POST   /api/contas-pagar
```

---

## PADRÃO 15: GIT & COMMITS

```bash
# Conventional commits em português
feat: adiciona CRUD de clientes
feat(backend): adiciona POST /clientes com validação Zod
feat(frontend): adiciona página de listagem de clientes
fix: corrige cálculo de parcelas na venda
fix(auth): corrige refresh token expirado
refactor: extrai middleware de tenant
docs: atualiza README com setup
test: adiciona testes de autenticação
chore: atualiza dependências

# Estrutura:
# tipo(escopo opcional): descrição curta em português
```

### Regras Git

1. **Commits pequenos e frequentes** - um feature por commit
2. **Branch por feature**: `feat/crud-clientes`, `fix/calculo-parcelas`
3. **Nunca commitar em main** direto
4. **Nunca commitar**: `.env`, `node_modules/`, `.next/`, `prisma/*.db`

---

## CHECKLIST PARA NOVO CRUD

Ao criar um CRUD de `[Recurso]`, gerar nesta ordem:

1. **Schema Prisma** → `prisma/schema.prisma` (model + migration)
2. **Validators Zod** → `backend/src/lib/validators.ts` (create + update schemas)
3. **Rota backend** → `backend/src/routes/[recurso].ts` (POST, GET, GET/:id, PATCH, DELETE)
4. **Registrar rota** → `backend/src/server.ts` (import + register)
5. **Tipos frontend** → `frontend/src/types/index.ts` (interface do recurso)
6. **Hook React Query** → `frontend/src/hooks/use[Recurso].ts` (5 hooks)
7. **Form component** → `frontend/src/components/forms/[Recurso]Form.tsx`
8. **Page** → `frontend/src/app/(dashboard)/[recurso]/page.tsx`

### Validações obrigatórias em cada item

- [ ] Rota filtra por `tenantId` (do middleware)
- [ ] Rota filtra por `deletedAt: null`
- [ ] DELETE faz soft delete
- [ ] Hooks tipados (sem `any`)
- [ ] Form usa zodResolver
- [ ] Page tem loading, error, empty states
- [ ] Mutations invalidam cache
