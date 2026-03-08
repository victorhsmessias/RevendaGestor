'use client'

import { useState } from 'react'
import { useContasPagar, usePagarConta, useCancelarConta, type ContaPagar } from '@/hooks/useContasPagar'
import { ContaPagarForm } from '@/components/forms/ContaPagarForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ListSkeleton } from '@/components/ui/list-skeleton'
import { useValuesVisibility } from '@/providers/ValuesVisibilityProvider'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Pencil, Search, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  PAID: { label: 'Pago', color: 'bg-green-100 text-green-800' },
  OVERDUE: { label: 'Vencido', color: 'bg-red-100 text-red-800' },
  CANCELLED: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800' },
}

export default function ContasPagarPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ContaPagar | null>(null)

  const { data, isLoading, error } = useContasPagar(page, search, statusFilter || undefined)
  const pagarMutation = usePagarConta()
  const cancelarMutation = useCancelarConta()

  const handlePagar = (id: string) => {
    if (!confirm('Marcar esta conta como paga?')) return
    toast.promise(pagarMutation.mutateAsync(id), {
      loading: 'Processando pagamento...',
      success: 'Conta marcada como paga',
      error: (err) => err instanceof Error ? err.message : 'Erro',
    })
  }

  const handleCancelar = async (id: string) => {
    if (!confirm('Cancelar esta conta?')) return
    try {
      await cancelarMutation.mutateAsync(id)
      toast.success('Conta cancelada')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro')
    }
  }

  const handleFormSuccess = () => {
    setIsDialogOpen(false)
    setSelectedItem(null)
  }

  const openCreate = () => { setSelectedItem(null); setIsDialogOpen(true) }
  const openEdit = (item: ContaPagar) => { setSelectedItem(item); setIsDialogOpen(true) }

  const { mask } = useValuesVisibility()
  const fmt = (v: number) =>
    mask(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v))

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR')

  const isVencida = (d: string, status: string) =>
    status === 'PENDING' && new Date(d) < new Date()

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold">Contas a Pagar</h1>
        <Button onClick={openCreate} size="sm" className="md:size-default">
          <Plus className="h-4 w-4 mr-1 md:mr-2" />
          <span className="hidden sm:inline">Nova Conta</span>
          <span className="sm:hidden">Nova</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descricao..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">Todos</option>
          <option value="PENDING">Pendente</option>
          <option value="PAID">Pago</option>
          <option value="OVERDUE">Vencido</option>
          <option value="CANCELLED">Cancelado</option>
        </select>
      </div>

      {/* States */}
      {isLoading && <ListSkeleton rows={5} columns={2} />}
      {error && <p className="text-destructive">Erro ao carregar contas</p>}
      {data && data.items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhuma conta encontrada</p>
          <Button variant="outline" className="mt-4" onClick={openCreate}>
            Cadastrar primeira conta
          </Button>
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          {/* Mobile: Cards */}
          <div className="space-y-3 md:hidden">
            {data.items.map((item) => {
              const vencida = isVencida(item.dataVencimento, item.status)
              const st = vencida ? statusLabels.OVERDUE : (statusLabels[item.status] || statusLabels.PENDING)
              return (
                <div key={item.id} className="border rounded-lg p-3 bg-background">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {vencida && <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />}
                        <p className="font-medium truncate">{item.description}</p>
                      </div>
                      {item.fornecedor?.name && (
                        <p className="text-xs text-muted-foreground mt-0.5">{item.fornecedor.name}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Venc: {formatDate(item.dataVencimento)}
                      </p>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ml-2 ${st.color}`}>
                      {st.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t">
                    <span className="font-bold">{fmt(item.valor)}</span>
                    {item.status === 'PENDING' && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-600" onClick={() => handlePagar(item.id)}>
                          <CheckCircle className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleCancelar(item.id)}>
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop: Table */}
          <div className="border rounded-lg overflow-hidden hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Descricao</th>
                  <th className="text-left p-3 font-medium hidden lg:table-cell">Fornecedor</th>
                  <th className="text-right p-3 font-medium">Valor</th>
                  <th className="text-center p-3 font-medium">Vencimento</th>
                  <th className="text-center p-3 font-medium">Status</th>
                  <th className="text-right p-3 font-medium w-32">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => {
                  const vencida = isVencida(item.dataVencimento, item.status)
                  const st = vencida ? statusLabels.OVERDUE : (statusLabels[item.status] || statusLabels.PENDING)
                  return (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 font-medium">
                        <div className="flex items-center gap-1">
                          {vencida && <AlertTriangle className="h-3 w-3 text-destructive" />}
                          {item.description}
                        </div>
                      </td>
                      <td className="p-3 hidden lg:table-cell text-muted-foreground">
                        {item.fornecedor?.name || '-'}
                      </td>
                      <td className="p-3 text-right font-medium">{fmt(item.valor)}</td>
                      <td className="p-3 text-center text-sm">{formatDate(item.dataVencimento)}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1">
                          {item.status === 'PENDING' && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => handlePagar(item.id)} title="Marcar como paga" className="text-green-600 hover:text-green-600">
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => openEdit(item)} title="Editar">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleCancelar(item.id)} title="Cancelar" className="text-destructive hover:text-destructive">
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">{page} / {data.pagination.pages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= data.pagination.pages}>
                Proxima
              </Button>
            </div>
          )}
        </>
      )}

      {/* Dialog Create/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) { setIsDialogOpen(false); setSelectedItem(null) } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedItem ? 'Editar Conta' : 'Nova Conta a Pagar'}</DialogTitle>
          </DialogHeader>
          <ContaPagarForm
            key={selectedItem?.id || 'new'}
            mode={selectedItem ? 'edit' : 'create'}
            initialData={selectedItem || undefined}
            onSuccess={handleFormSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
