'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateCliente, useUpdateCliente, type Cliente } from '@/hooks/useClientes'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const clienteFormSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido').or(z.literal('')).optional(),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
})

type ClienteFormData = z.infer<typeof clienteFormSchema>

interface ClienteFormProps {
  onSuccess?: () => void
  mode?: 'create' | 'edit'
  initialData?: Cliente
}

export function ClienteForm({ onSuccess, mode = 'create', initialData }: ClienteFormProps) {
  const createMutation = useCreateCliente()
  const updateMutation = useUpdateCliente()
  const isLoading = createMutation.isPending || updateMutation.isPending

  const form = useForm<ClienteFormData>({
    resolver: zodResolver(clienteFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      cpf: initialData?.cpf || '',
      city: initialData?.city || '',
      address: initialData?.address || '',
      notes: initialData?.notes || '',
    },
  })

  const onSubmit = async (data: ClienteFormData) => {
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
      <div className="space-y-2">
        <Label htmlFor="name">Nome *</Label>
        <Input id="name" placeholder="Nome do cliente" {...form.register('name')} disabled={isLoading} />
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cpf">CPF</Label>
          <Input id="cpf" placeholder="000.000.000-00" {...form.register('cpf')} disabled={isLoading} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">Cidade</Label>
          <Input id="city" placeholder="São Paulo" {...form.register('city')} disabled={isLoading} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Endereço</Label>
        <Input id="address" placeholder="Rua, número, bairro" {...form.register('address')} disabled={isLoading} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Input id="notes" placeholder="Notas sobre o cliente" {...form.register('notes')} disabled={isLoading} />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Salvando...' : mode === 'create' ? 'Criar Cliente' : 'Atualizar'}
      </Button>
    </form>
  )
}
