import { z } from 'zod'

// === Validadores base ===
export const emailValidator = z.string().email('Email inválido')
export const cpfValidator = z.string().regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, 'CPF inválido')
export const phoneValidator = z.string().regex(/^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/, 'Telefone inválido')
export const currencyValidator = z.number().nonnegative('Valor não pode ser negativo')

// === Paginação ===
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional().default(''),
})
export type Pagination = z.infer<typeof paginationSchema>

// === Auth ===
export const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: emailValidator,
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  tenantName: z.string().min(2, 'Nome da loja deve ter no mínimo 2 caracteres'),
})
export type RegisterInput = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  email: emailValidator,
  password: z.string().min(1, 'Senha é obrigatória'),
})
export type LoginInput = z.infer<typeof loginSchema>

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

// === Fornecedor ===
export const createFornecedorSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: emailValidator.optional().or(z.literal('')),
  phone: phoneValidator.optional().or(z.literal('')),
  cnpj: z.string().optional().or(z.literal('')),
  notes: z.string().optional(),
})
export const updateFornecedorSchema = createFornecedorSchema.partial()
export type CreateFornecedor = z.infer<typeof createFornecedorSchema>
export type UpdateFornecedor = z.infer<typeof updateFornecedorSchema>

// === Produto ===
const produtoBaseSchema = z.object({
  code: z.string().min(1, 'Código obrigatório'),
  name: z.string().min(2, 'Nome obrigatório'),
  costPrice: z.number().positive('Preço de custo deve ser positivo'),
  salePrice: z.number().positive('Preço de venda deve ser positivo'),
  fornecedorId: z.string().uuid('Fornecedor obrigatório'),
  quantity: z.number().int().nonnegative('Quantidade não pode ser negativa').default(0),
  minStock: z.number().int().nonnegative().default(0),
})
export const createProdutoSchema = produtoBaseSchema.refine(
  data => data.salePrice > data.costPrice,
  { message: 'Preço de venda deve ser maior que o custo', path: ['salePrice'] }
)
export const updateProdutoSchema = produtoBaseSchema.partial()
export type CreateProduto = z.infer<typeof createProdutoSchema>
export type UpdateProduto = z.infer<typeof updateProdutoSchema>

// === Venda ===
export const createVendaSchema = z.object({
  clienteId: z.string().uuid('Cliente obrigatório'),
  items: z.array(z.object({
    produtoId: z.string().uuid(),
    quantity: z.number().int().positive('Quantidade mínima é 1'),
    unitPrice: z.number().positive('Preço deve ser positivo'),
  })).optional().default([]),
  valorManual: z.number().positive('Valor deve ser positivo').optional(),
  descricaoManual: z.string().optional(),
  parcelas: z.number().int().min(1).max(12, 'Máximo 12 parcelas'),
  formaPagamento: z.enum(['DINHEIRO', 'PIX', 'CARTAO', 'BOLETO', 'FIADO']),
  discount: currencyValidator.default(0),
  notes: z.string().optional(),
})
export type CreateVenda = z.infer<typeof createVendaSchema>

// === Contas a Pagar ===
export const createContaPagarSchema = z.object({
  fornecedorId: z.string().uuid().optional().or(z.literal('')),
  description: z.string().min(2, 'Descricao obrigatoria'),
  valor: z.number().positive('Valor deve ser positivo'),
  dataVencimento: z.string().min(1, 'Data de vencimento obrigatoria'),
  notes: z.string().optional(),
})
export const updateContaPagarSchema = createContaPagarSchema.partial()
export type CreateContaPagar = z.infer<typeof createContaPagarSchema>
export type UpdateContaPagar = z.infer<typeof updateContaPagarSchema>

// === Configuracoes ===
export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no minimo 2 caracteres'),
  email: emailValidator,
})
export type UpdateProfile = z.infer<typeof updateProfileSchema>

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual obrigatoria'),
  newPassword: z.string().min(6, 'Nova senha deve ter no minimo 6 caracteres'),
})
export type ChangePassword = z.infer<typeof changePasswordSchema>

export const updateTenantSchema = z.object({
  name: z.string().min(2, 'Nome da loja deve ter no minimo 2 caracteres'),
})
export type UpdateTenant = z.infer<typeof updateTenantSchema>

// === Recuperacao de senha ===
export const forgotPasswordSchema = z.object({
  email: emailValidator,
})
export type ForgotPassword = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token obrigatorio'),
  password: z.string().min(6, 'Senha deve ter no minimo 6 caracteres'),
})
export type ResetPassword = z.infer<typeof resetPasswordSchema>

// === Assinatura ===
export const createAssinaturaSchema = z.object({
  billingType: z.enum(['PIX', 'CREDIT_CARD', 'UNDEFINED']).default('UNDEFINED'),
  cpfCnpj: z.string().min(11, 'CPF/CNPJ obrigatorio').optional(),
  creditCard: z.object({
    holderName: z.string(),
    number: z.string(),
    expiryMonth: z.string(),
    expiryYear: z.string(),
    ccv: z.string(),
  }).optional(),
  creditCardHolderInfo: z.object({
    name: z.string(),
    email: z.string().email(),
    cpfCnpj: z.string(),
    postalCode: z.string(),
    addressNumber: z.string(),
    phone: z.string(),
  }).optional(),
})
export type CreateAssinatura = z.infer<typeof createAssinaturaSchema>
