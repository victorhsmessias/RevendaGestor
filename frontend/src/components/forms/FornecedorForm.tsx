'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateFornecedor, useUpdateFornecedor, type Fornecedor } from '@/hooks/useFornecedores'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const fornecedorFormSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido').or(z.literal('')).optional(),
  phone: z.string().optional(),
  cnpj: z.string().optional(),
  notes: z.string().optional(),
})

type FornecedorFormData = z.infer<typeof fornecedorFormSchema>

interface FornecedorFormProps {
  onSuccess?: () => void
  mode?: 'create' | 'edit'
  initialData?: Fornecedor
}

export function FornecedorForm({ onSuccess, mode = 'create', initialData }: FornecedorFormProps) {
  const createMutation = useCreateFornecedor()
  const updateMutation = useUpdateFornecedor()
  const isLoading = createMutation.isPending || updateMutation.isPending

  const form = useForm<FornecedorFormData>({
    resolver: zodResolver(fornecedorFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      cnpj: initialData?.cnpj || '',
      notes: initialData?.notes || '',
    },
  })

  const onSubmit = async (data: FornecedorFormData) => {
    try {
      if (mode === 'edit' && initialData?.id) {
        await updateMutation.mutateAsync({ id: initialData.id, data })
        toast.success('Fornecedor atualizado!')
      } else {
        await createMutation.mutateAsync(data)
        toast.success('Fornecedor criado com sucesso!')
        form.reset()
      }
      onSuccess?.()
    } catch {
      toast.error('Erro ao salvar fornecedor')
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome *</Label>
        <Input id="name" placeholder="Nome do fornecedor" {...form.register('name')} disabled={isLoading} />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="email@exemplo.com" {...form.register('email')} disabled={isLoading} />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" placeholder="(11) 99999-9999" {...form.register('phone')} disabled={isLoading} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cnpj">CNPJ</Label>
        <Input id="cnpj" placeholder="00.000.000/0000-00" {...form.register('cnpj')} disabled={isLoading} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Input id="notes" placeholder="Notas sobre o fornecedor" {...form.register('notes')} disabled={isLoading} />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Salvando...' : mode === 'create' ? 'Criar Fornecedor' : 'Atualizar'}
      </Button>
    </form>
  )
}
