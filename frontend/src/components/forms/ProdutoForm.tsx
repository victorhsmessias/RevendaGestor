'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateProduto, useUpdateProduto, type Produto } from '@/hooks/useProdutos'
import { useFornecedoresAll } from '@/hooks/useFornecedores'
import { toast } from 'sonner'

const produtoFormSchema = z.object({
  code: z.string().min(1, 'Codigo obrigatorio'),
  name: z.string().min(2, 'Nome obrigatorio'),
  costPrice: z.number().positive('Preço de custo deve ser positivo'),
  salePrice: z.number().positive('Preço de venda deve ser positivo'),
  fornecedorId: z.string().min(1, 'Selecione um fornecedor'),
  quantity: z.number().int().nonnegative(),
  minStock: z.number().int().nonnegative(),
})

type ProdutoFormData = z.infer<typeof produtoFormSchema>

interface ProdutoFormProps {
  mode: 'create' | 'edit'
  initialData?: Produto
  onSuccess: () => void
}

export function ProdutoForm({ mode, initialData, onSuccess }: ProdutoFormProps) {
  const createMutation = useCreateProduto()
  const updateMutation = useUpdateProduto()
  const { data: fornecedores, isLoading: loadingFornecedores } = useFornecedoresAll()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoFormSchema),
    defaultValues: {
      code: initialData?.code || '',
      name: initialData?.name || '',
      costPrice: initialData?.costPrice || 0,
      salePrice: initialData?.salePrice || 0,
      fornecedorId: initialData?.fornecedorId || '',
      quantity: initialData?.quantity || 0,
      minStock: initialData?.minStock || 0,
    },
  })

  const onSubmit = async (data: ProdutoFormData) => {
    try {
      if (mode === 'edit' && initialData) {
        await updateMutation.mutateAsync({ id: initialData.id, ...data })
        toast.success('Produto atualizado')
      } else {
        await createMutation.mutateAsync(data)
        toast.success('Produto cadastrado')
      }
      onSuccess()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar'
      toast.error(message)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="code">Codigo *</Label>
          <Input id="code" {...register('code')} placeholder="SKU001" />
          {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Nome *</Label>
          <Input id="name" {...register('name')} placeholder="Nome do produto" />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fornecedorId">Fornecedor *</Label>
        <select
          id="fornecedorId"
          {...register('fornecedorId')}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">
            {loadingFornecedores ? 'Carregando...' : 'Selecione um fornecedor'}
          </option>
          {fornecedores?.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
        {errors.fornecedorId && <p className="text-sm text-destructive">{errors.fornecedorId.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="costPrice">Preço de Custo (R$) *</Label>
          <Input id="costPrice" type="number" step="0.01" {...register('costPrice', { valueAsNumber: true })} />
          {errors.costPrice && <p className="text-sm text-destructive">{errors.costPrice.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="salePrice">Preço de Venda (R$) *</Label>
          <Input id="salePrice" type="number" step="0.01" {...register('salePrice', { valueAsNumber: true })} />
          {errors.salePrice && <p className="text-sm text-destructive">{errors.salePrice.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Estoque</Label>
          <Input id="quantity" type="number" {...register('quantity', { valueAsNumber: true })} />
          {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="minStock">Estoque Minimo</Label>
          <Input id="minStock" type="number" {...register('minStock', { valueAsNumber: true })} />
          {errors.minStock && <p className="text-sm text-destructive">{errors.minStock.message}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : mode === 'edit' ? 'Atualizar' : 'Cadastrar'}
        </Button>
      </div>
    </form>
  )
}
