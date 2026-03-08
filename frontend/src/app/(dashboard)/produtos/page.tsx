'use client'

import { useState } from 'react'
import { useProdutos, useDeleteProduto, type Produto } from '@/hooks/useProdutos'
import { ProdutoForm } from '@/components/forms/ProdutoForm'
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
import { Plus, Pencil, Trash2, Search, AlertTriangle } from 'lucide-react'

export default function ProdutosPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Produto | null>(null)

  const { data, isLoading, error } = useProdutos(page, search)
  const deleteMutation = useDeleteProduto()

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja remover o produto "${name}"?`)) return
    toast.promise(deleteMutation.mutateAsync(id), {
      loading: "Removendo produto...",
      success: "Produto removido",
      error: "Erro ao remover produto",
    })
  }

  const handleFormSuccess = () => {
    setIsDialogOpen(false)
    setSelectedItem(null)
  }

  const openCreate = () => {
    setSelectedItem(null)
    setIsDialogOpen(true)
  }

  const openEdit = (item: Produto) => {
    setSelectedItem(item)
    setIsDialogOpen(true)
  }

  const { mask } = useValuesVisibility()
  const fmt = (value: number) =>
    mask(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value))

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold">Produtos</h1>
        <Button onClick={openCreate} size="sm" className="md:size-default">
          <Plus className="h-4 w-4 mr-1 md:mr-2" />
          <span className="hidden sm:inline">Novo Produto</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou codigo..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="pl-10"
        />
      </div>

      {/* States */}
      {isLoading && <ListSkeleton rows={5} columns={3} />}
      {error && <p className="text-destructive">Erro ao carregar produtos</p>}
      {data && data.items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum produto encontrado</p>
          <Button variant="outline" className="mt-4" onClick={openCreate}>
            Cadastrar primeiro produto
          </Button>
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          {/* Mobile: Cards */}
          <div className="space-y-3 md:hidden">
            {data.items.map((item) => (
              <div key={item.id} className="border rounded-lg p-3 bg-background">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{item.code}</span>
                      {item.quantity <= item.minStock && (
                        <span className="text-destructive flex items-center gap-0.5 text-xs">
                          <AlertTriangle className="h-3 w-3" /> Baixo
                        </span>
                      )}
                    </div>
                    <p className="font-medium truncate">{item.name}</p>
                    {item.fornecedor?.name && (
                      <p className="text-xs text-muted-foreground">{item.fornecedor.name}</p>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(item.id, item.name)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t text-sm">
                  <span className="text-muted-foreground">Estoque: {item.quantity}</span>
                  <div className="flex gap-3">
                    <span className="text-muted-foreground">Custo: {fmt(item.costPrice)}</span>
                    <span className="font-medium">{fmt(item.salePrice)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table */}
          <div className="border rounded-lg overflow-hidden hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Codigo</th>
                  <th className="text-left p-3 font-medium">Nome</th>
                  <th className="text-left p-3 font-medium hidden lg:table-cell">Fornecedor</th>
                  <th className="text-right p-3 font-medium">Custo</th>
                  <th className="text-right p-3 font-medium">Venda</th>
                  <th className="text-right p-3 font-medium">Estoque</th>
                  <th className="text-right p-3 font-medium w-28">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-mono text-sm">{item.code}</td>
                    <td className="p-3 font-medium">{item.name}</td>
                    <td className="p-3 hidden lg:table-cell text-muted-foreground">
                      {item.fornecedor?.name || '-'}
                    </td>
                    <td className="p-3 text-right text-muted-foreground">{fmt(item.costPrice)}</td>
                    <td className="p-3 text-right font-medium">{fmt(item.salePrice)}</td>
                    <td className="p-3 text-right">
                      <span className={item.quantity <= item.minStock ? 'text-destructive flex items-center justify-end gap-1' : ''}>
                        {item.quantity <= item.minStock && <AlertTriangle className="h-3 w-3" />}
                        {item.quantity}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id, item.name)} title="Remover" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
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
            <DialogTitle>
              {selectedItem ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
          </DialogHeader>
          <ProdutoForm
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
