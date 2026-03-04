'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateContaPagar, useUpdateContaPagar, type ContaPagar } from '@/hooks/useContasPagar'
import { useFornecedoresAll } from '@/hooks/useFornecedores'
import { toast } from 'sonner'

const contaFormSchema = z.object({
  description: z.string().min(2, 'Descricao obrigatoria'),
  valor: z.number().positive('Valor deve ser positivo'),
  dataVencimento: z.string().min(1, 'Data obrigatoria'),
  fornecedorId: z.string().optional(),
  notes: z.string().optional(),
})

type ContaFormData = z.infer<typeof contaFormSchema>

interface ContaPagarFormProps {
  mode: 'create' | 'edit'
  initialData?: ContaPagar
  onSuccess: () => void
}

export function ContaPagarForm({ mode, initialData, onSuccess }: ContaPagarFormProps) {
  const createMutation = useCreateContaPagar()
  const updateMutation = useUpdateContaPagar()
  const { data: fornecedores, isLoading: loadingFornecedores } = useFornecedoresAll()

  const formatDateForInput = (d: string | undefined) => {
    if (!d) return ''
    return new Date(d).toISOString().split('T')[0]
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContaFormData>({
    resolver: zodResolver(contaFormSchema),
    defaultValues: {
      description: initialData?.description || '',
      valor: initialData?.valor || 0,
      dataVencimento: formatDateForInput(initialData?.dataVencimento),
      fornecedorId: initialData?.fornecedorId || '',
      notes: initialData?.notes || '',
    },
  })

  const onSubmit = async (data: ContaFormData) => {
    try {
      if (mode === 'edit' && initialData) {
        await updateMutation.mutateAsync({ id: initialData.id, ...data })
        toast.success('Conta atualizada')
      } else {
        await createMutation.mutateAsync(data)
        toast.success('Conta cadastrada')
      }
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="description">Descricao *</Label>
        <Input id="description" {...register('description')} placeholder="Ex: Compra de produtos" />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="valor">Valor (R$) *</Label>
          <Input id="valor" type="number" step="0.01" {...register('valor', { valueAsNumber: true })} />
          {errors.valor && <p className="text-sm text-destructive">{errors.valor.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="dataVencimento">Vencimento *</Label>
          <Input id="dataVencimento" type="date" {...register('dataVencimento')} />
          {errors.dataVencimento && <p className="text-sm text-destructive">{errors.dataVencimento.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fornecedorId">Fornecedor</Label>
        <select
          id="fornecedorId"
          {...register('fornecedorId')}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">{loadingFornecedores ? 'Carregando...' : 'Nenhum (opcional)'}</option>
          {fornecedores?.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observacoes</Label>
        <Input id="notes" {...register('notes')} placeholder="Opcional" />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : mode === 'edit' ? 'Atualizar' : 'Cadastrar'}
        </Button>
      </div>
    </form>
  )
}
