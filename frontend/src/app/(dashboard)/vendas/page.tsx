'use client'

import { useState } from 'react'
import {
  useVendasPorCliente,
  useVenda,
  useCancelarVenda,
  useRegistrarPagamento,
  type ClienteVendas,
  type ClienteVendaItem,
} from '@/hooks/useVendas'
import { VendaForm } from '@/components/forms/VendaForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useValuesVisibility } from '@/providers/ValuesVisibilityProvider'
import { Plus, Search, Eye, XCircle, ChevronDown, ChevronRight, DollarSign } from 'lucide-react'

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  PARTIAL: { label: 'Parcial', color: 'bg-blue-100 text-blue-800' },
  PAID: { label: 'Pago', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
}

const formaLabels: Record<string, string> = {
  DINHEIRO: 'Dinheiro',
  PIX: 'PIX',
  CARTAO: 'Cartao',
  BOLETO: 'Boleto',
  FIADO: 'Fiado',
}

export default function VendasPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [expandedClienteId, setExpandedClienteId] = useState<string | null>(null)

  const { data, isLoading, error } = useVendasPorCliente(page, search)
  const cancelMutation = useCancelarVenda()
  const handleCancel = (id: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta venda? O estoque sera devolvido.')) return
    toast.promise(cancelMutation.mutateAsync(id), {
      loading: 'Cancelando venda...',
      success: () => { setDetailId(null); return 'Venda cancelada' },
      error: (err) => err instanceof Error ? err.message : 'Erro ao cancelar',
    })
  }

  const { mask } = useValuesVisibility()
  const fmt = (v: number) =>
    mask(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v))

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR')

  const toggleCliente = (clienteId: string) => {
    setExpandedClienteId(prev => prev === clienteId ? null : clienteId)
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold">Vendas</h1>
        <Button onClick={() => setIsCreateOpen(true)} size="sm" className="md:size-default">
          <Plus className="h-4 w-4 mr-1 md:mr-2" />
          <span className="hidden sm:inline">Nova Venda</span>
          <span className="sm:hidden">Nova</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); setExpandedClienteId(null) }}
          className="pl-10"
        />
      </div>

      {/* States */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          ))}
        </div>
      )}
      {error && <p className="text-destructive">Erro ao carregar vendas</p>}
      {data && data.items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhuma venda encontrada</p>
          <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>
            Registrar primeira venda
          </Button>
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          {/* Mobile: Cards por cliente */}
          <div className="space-y-3 md:hidden">
            {data.items.map((cliente) => (
              <div key={cliente.clienteId} className="border rounded-lg bg-background overflow-hidden">
                {/* Header do cliente */}
                <div
                  className="p-3 cursor-pointer active:bg-muted/50"
                  onClick={() => toggleCliente(cliente.clienteId)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {expandedClienteId === cliente.clienteId
                        ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                        : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      }
                      <div className="min-w-0">
                        <p className="font-medium truncate">{cliente.clienteName}</p>
                        {cliente.clientePhone && (
                          <p className="text-xs text-muted-foreground mt-0.5">{cliente.clientePhone}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="font-bold">{fmt(cliente.totalValor)}</p>
                      <p className="text-xs text-muted-foreground">
                        {cliente.totalVendas} venda{cliente.totalVendas !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  {cliente.totalPendente > 0 && (
                    <div className="mt-2 text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
                      Pendente: {fmt(cliente.totalPendente)}
                    </div>
                  )}
                </div>

                {/* Vendas expandidas do cliente */}
                {expandedClienteId === cliente.clienteId && (
                  <ClienteVendasList
                    vendas={cliente.vendas}
                    onViewDetail={setDetailId}
                    fmt={fmt}
                    formatDate={formatDate}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Desktop: Tabela por cliente */}
          <div className="hidden md:block space-y-0">
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium w-8"></th>
                    <th className="text-left p-3 font-medium">Cliente</th>
                    <th className="text-left p-3 font-medium hidden lg:table-cell">Telefone</th>
                    <th className="text-center p-3 font-medium">Vendas</th>
                    <th className="text-right p-3 font-medium">Total</th>
                    <th className="text-right p-3 font-medium">Pendente</th>
                    <th className="text-center p-3 font-medium hidden lg:table-cell">Ultima Venda</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((cliente) => (
                    <ClienteRow
                      key={cliente.clienteId}
                      cliente={cliente}
                      isExpanded={expandedClienteId === cliente.clienteId}
                      onToggle={() => toggleCliente(cliente.clienteId)}
                      onViewDetail={setDetailId}
                      fmt={fmt}
                      formatDate={formatDate}
                    />
                  ))}
                </tbody>
              </table>
            </div>
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

      {/* Dialog Nova Venda */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Venda</DialogTitle>
          </DialogHeader>
          <VendaForm onSuccess={() => setIsCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Dialog Detalhe */}
      {detailId && (
        <VendaDetailDialog
          vendaId={detailId}
          onClose={() => setDetailId(null)}
          onCancel={handleCancel}
          formatCurrency={fmt}
          formatDate={formatDate}
        />
      )}
    </div>
  )
}

// === Lista de vendas de um cliente (expandido) ===
function ClienteVendasList({
  vendas,
  onViewDetail,
  fmt,
  formatDate,
}: {
  vendas: ClienteVendaItem[]
  onViewDetail: (id: string) => void
  fmt: (v: number) => string
  formatDate: (d: string) => string
}) {
  if (vendas.length === 0) return <div className="p-3 pt-0 text-sm text-muted-foreground">Nenhuma venda</div>

  return (
    <div className="border-t">
      {/* Mobile cards */}
      <div className="md:hidden divide-y">
        {vendas.map((venda) => {
          const st = statusLabels[venda.status] || statusLabels.PENDING
          return (
            <div
              key={venda.id}
              className="p-3 pl-9 cursor-pointer active:bg-muted/50"
              onClick={() => onViewDetail(venda.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm">{formatDate(venda.createdAt)}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {formaLabels[venda.formaPagamento] || venda.formaPagamento}
                  </span>
                </div>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>
                  {st.label}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-muted-foreground">
                  {venda._count?.items || 0} {(venda._count?.items || 0) === 1 ? 'item' : 'itens'}
                </span>
                <span className="font-bold text-sm">{fmt(venda.total)}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop sub-table */}
      <div className="hidden md:block">
        <table className="w-full">
          <tbody>
            {vendas.map((venda) => {
              const st = statusLabels[venda.status] || statusLabels.PENDING
              return (
                <tr key={venda.id} className="border-b last:border-0 bg-muted/10 hover:bg-muted/30">
                  <td className="p-2 pl-10 text-sm">{formatDate(venda.createdAt)}</td>
                  <td className="p-2 text-sm text-muted-foreground">
                    {formaLabels[venda.formaPagamento] || venda.formaPagamento}
                  </td>
                  <td className="p-2 text-sm text-muted-foreground">
                    {venda._count?.items || 0} {(venda._count?.items || 0) === 1 ? 'item' : 'itens'}
                  </td>
                  <td className="p-2 text-right font-medium text-sm">{fmt(venda.total)}</td>
                  <td className="p-2 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>
                      {st.label}
                    </span>
                  </td>
                  <td className="p-2 text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onViewDetail(venda.id)} title="Ver detalhes">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// === Linha de cliente na tabela desktop ===
function ClienteRow({
  cliente,
  isExpanded,
  onToggle,
  onViewDetail,
  fmt,
  formatDate,
}: {
  cliente: ClienteVendas
  isExpanded: boolean
  onToggle: () => void
  onViewDetail: (id: string) => void
  fmt: (v: number) => string
  formatDate: (d: string) => string
}) {
  return (
    <>
      <tr
        className="border-b hover:bg-muted/30 cursor-pointer"
        onClick={onToggle}
      >
        <td className="p-3">
          {isExpanded
            ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
            : <ChevronRight className="h-4 w-4 text-muted-foreground" />
          }
        </td>
        <td className="p-3 font-medium">{cliente.clienteName}</td>
        <td className="p-3 hidden lg:table-cell text-muted-foreground text-sm">
          {cliente.clientePhone || '-'}
        </td>
        <td className="p-3 text-center">{cliente.totalVendas}</td>
        <td className="p-3 text-right font-medium">{fmt(cliente.totalValor)}</td>
        <td className="p-3 text-right">
          {cliente.totalPendente > 0 ? (
            <span className="text-amber-600 font-medium">{fmt(cliente.totalPendente)}</span>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </td>
        <td className="p-3 text-center hidden lg:table-cell text-sm text-muted-foreground">
          {cliente.ultimaVenda ? formatDate(cliente.ultimaVenda) : '-'}
        </td>
      </tr>

      {/* Vendas expandidas */}
      {isExpanded && (
        <tr>
          <td colSpan={7} className="p-0">
            <ClienteVendasList
              vendas={cliente.vendas}
              onViewDetail={onViewDetail}
              fmt={fmt}
              formatDate={formatDate}
            />
          </td>
        </tr>
      )}
    </>
  )
}

// === Dialog de detalhes da venda ===
function VendaDetailDialog({
  vendaId,
  onClose,
  onCancel,
  formatCurrency,
  formatDate,
}: {
  vendaId: string
  onClose: () => void
  onCancel: (id: string) => void
  formatCurrency: (v: number) => string
  formatDate: (d: string) => string
}) {
  const { data: venda, isLoading } = useVenda(vendaId)
  const registrarPagamento = useRegistrarPagamento()
  const [showPagamentoForm, setShowPagamentoForm] = useState(false)
  const [pgValor, setPgValor] = useState('')
  const [pgForma, setPgForma] = useState('PIX')
  const [pgNotes, setPgNotes] = useState('')

  const handleRegistrarPagamento = async () => {
    const valor = parseFloat(pgValor.replace(',', '.'))
    if (!valor || valor <= 0) {
      toast.error('Informe um valor valido')
      return
    }
    try {
      const result = await registrarPagamento.mutateAsync({
        vendaId,
        data: { valor, formaPagamento: pgForma, notes: pgNotes || undefined },
      })
      const msg = (result as { message?: string })?.message || 'Pagamento registrado'
      toast.success(msg)
      setPgValor('')
      setPgNotes('')
      setShowPagamentoForm(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao registrar pagamento')
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Venda</DialogTitle>
        </DialogHeader>

        {isLoading && <p className="text-muted-foreground">Carregando...</p>}

        {venda && (
          <div className="space-y-4 md:space-y-6">
            {/* Info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Cliente:</span>
                <p className="font-medium">{venda.cliente.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Data:</span>
                <p className="font-medium">{formatDate(venda.createdAt)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Pagamento:</span>
                <p className="font-medium">{formaLabels[venda.formaPagamento] || venda.formaPagamento}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <p>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${(statusLabels[venda.status] || statusLabels.PENDING).color}`}>
                    {(statusLabels[venda.status] || statusLabels.PENDING).label}
                  </span>
                </p>
              </div>
            </div>

            {/* Itens */}
            {venda.items && venda.items.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Itens</h3>
                <div className="space-y-2 md:hidden">
                  {venda.items.map(item => (
                    <div key={item.id} className="border rounded-lg p-2.5 text-sm">
                      <p className="font-medium truncate">{item.produto.name}</p>
                      <div className="flex justify-between mt-1 text-muted-foreground">
                        <span>{item.quantity}x {formatCurrency(item.unitPrice)}</span>
                        <span className="font-medium text-foreground">{formatCurrency(item.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border rounded-lg overflow-hidden hidden md:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-2 font-medium">Produto</th>
                        <th className="text-center p-2 font-medium">Qtd</th>
                        <th className="text-right p-2 font-medium">Preco</th>
                        <th className="text-right p-2 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {venda.items.map(item => (
                        <tr key={item.id} className="border-b last:border-0">
                          <td className="p-2">{item.produto.code} - {item.produto.name}</td>
                          <td className="p-2 text-center">{item.quantity}</td>
                          <td className="p-2 text-right">{formatCurrency(item.unitPrice)}</td>
                          <td className="p-2 text-right font-medium">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Totais + Saldo */}
            <div className="bg-muted/50 rounded-lg p-3 md:p-4 space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(venda.subtotal)}</span></div>
              {venda.discount > 0 && (
                <div className="flex justify-between text-destructive"><span>Desconto:</span><span>-{formatCurrency(venda.discount)}</span></div>
              )}
              <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                <span>Total:</span><span>{formatCurrency(venda.total)}</span>
              </div>
              {venda.valorPago !== undefined && (
                <>
                  <div className="flex justify-between text-green-600">
                    <span>Pago:</span><span>{formatCurrency(venda.valorPago)}</span>
                  </div>
                  {(venda.saldoDevedor ?? 0) > 0 && (
                    <div className="flex justify-between font-bold text-amber-600 text-base">
                      <span>Saldo devedor:</span><span>{formatCurrency(venda.saldoDevedor!)}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Historico de Pagamentos */}
            {venda.pagamentos && venda.pagamentos.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Historico de Pagamentos</h3>
                <div className="space-y-2">
                  {venda.pagamentos.map(pg => (
                    <div key={pg.id} className="flex items-center justify-between border rounded-lg p-2.5 text-sm">
                      <div>
                        <span className="text-muted-foreground">{formatDate(pg.createdAt)}</span>
                        <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded">
                          {formaLabels[pg.formaPagamento] || pg.formaPagamento}
                        </span>
                        {pg.notes && <span className="ml-2 text-xs text-muted-foreground">{pg.notes}</span>}
                      </div>
                      <span className="font-medium text-green-600">+{formatCurrency(pg.valor)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Registrar Pagamento */}
            {venda.status !== 'CANCELLED' && venda.status !== 'PAID' && (
              <div>
                {!showPagamentoForm ? (
                  <Button
                    onClick={() => setShowPagamentoForm(true)}
                    className="w-full"
                    variant="outline"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Registrar Pagamento
                  </Button>
                ) : (
                  <div className="border rounded-lg p-3 space-y-3">
                    <h3 className="font-medium">Registrar Pagamento</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-muted-foreground">Valor (R$)</label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder={`Max: ${(venda.saldoDevedor ?? venda.total).toFixed(2)}`}
                          value={pgValor}
                          onChange={(e) => setPgValor(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Forma</label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={pgForma}
                          onChange={(e) => setPgForma(e.target.value)}
                        >
                          <option value="PIX">PIX</option>
                          <option value="DINHEIRO">Dinheiro</option>
                          <option value="CARTAO">Cartao</option>
                          <option value="BOLETO">Boleto</option>
                        </select>
                      </div>
                    </div>
                    <Input
                      placeholder="Observacao (opcional)"
                      value={pgNotes}
                      onChange={(e) => setPgNotes(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleRegistrarPagamento}
                        disabled={registrarPagamento.isPending}
                        className="flex-1"
                      >
                        {registrarPagamento.isPending ? 'Registrando...' : 'Confirmar'}
                      </Button>
                      <Button variant="outline" onClick={() => setShowPagamentoForm(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Acoes */}
            {venda.status !== 'CANCELLED' && venda.status !== 'PAID' && (
              <div className="flex justify-end pt-2">
                <Button variant="destructive" size="sm" onClick={() => onCancel(venda.id)}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancelar Venda
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
