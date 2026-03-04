'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateVenda } from '@/hooks/useVendas'
import { useProdutos, type Produto } from '@/hooks/useProdutos'
import { useClientes, type Cliente } from '@/hooks/useClientes'
import { toast } from 'sonner'
import { Trash2, Package, DollarSign } from 'lucide-react'

type VendaMode = 'produtos' | 'manual'

interface VendaItem {
  produtoId: string
  produtoName: string
  quantity: number
  unitPrice: number
  maxStock: number
}

interface VendaFormProps {
  onSuccess: () => void
}

export function VendaForm({ onSuccess }: VendaFormProps) {
  const createMutation = useCreateVenda()

  // Modo da venda
  const [mode, setMode] = useState<VendaMode>('produtos')

  // Selects data
  const [clienteSearch, setClienteSearch] = useState('')
  const [produtoSearch, setProdutoSearch] = useState('')
  const { data: clientesData } = useClientes(1, clienteSearch)
  const { data: produtosData } = useProdutos(1, produtoSearch)

  // Form state
  const [clienteId, setClienteId] = useState('')
  const [clienteName, setClienteName] = useState('')
  const [items, setItems] = useState<VendaItem[]>([])
  const [valorManual, setValorManual] = useState(0)
  const [descricaoManual, setDescricaoManual] = useState('')
  const [formaPagamento, setFormaPagamento] = useState('PIX')
  const [parcelas, setParcelas] = useState(1)
  const [discount, setDiscount] = useState(0)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Dropdowns
  const [showClienteDropdown, setShowClienteDropdown] = useState(false)
  const [showProdutoDropdown, setShowProdutoDropdown] = useState(false)

  const subtotal = mode === 'produtos'
    ? items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
    : valorManual
  const total = subtotal - discount

  const isFormValid = mode === 'produtos'
    ? clienteId && items.length > 0 && total > 0
    : clienteId && valorManual > 0 && total > 0

  const addItem = (produto: Produto) => {
    if (items.some(i => i.produtoId === produto.id)) {
      toast.error('Produto ja adicionado')
      return
    }
    setItems([...items, {
      produtoId: produto.id,
      produtoName: `${produto.code} - ${produto.name}`,
      quantity: 1,
      unitPrice: produto.salePrice,
      maxStock: produto.quantity,
    }])
    setProdutoSearch('')
    setShowProdutoDropdown(false)
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItemQty = (index: number, qty: number) => {
    const updated = [...items]
    updated[index].quantity = Math.max(1, Math.min(qty, updated[index].maxStock))
    setItems(updated)
  }

  const updateItemPrice = (index: number, price: number) => {
    const updated = [...items]
    updated[index].unitPrice = Math.max(0, price)
    setItems(updated)
  }

  const selectCliente = (cliente: Cliente) => {
    setClienteId(cliente.id)
    setClienteName(cliente.name)
    setClienteSearch('')
    setShowClienteDropdown(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!clienteId) { toast.error('Selecione um cliente'); return }
    if (mode === 'produtos' && items.length === 0) { toast.error('Adicione pelo menos um produto'); return }
    if (mode === 'manual' && valorManual <= 0) { toast.error('Informe o valor da venda'); return }
    if (total <= 0) { toast.error('Total deve ser maior que zero'); return }

    setIsSubmitting(true)
    try {
      await createMutation.mutateAsync({
        clienteId,
        ...(mode === 'produtos' ? {
          items: items.map(i => ({
            produtoId: i.produtoId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        } : {
          valorManual,
          descricaoManual: descricaoManual || undefined,
        }),
        parcelas,
        formaPagamento,
        discount,
        notes: notes || undefined,
      })
      toast.success('Venda registrada com sucesso!')
      onSuccess()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao registrar venda'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Toggle modo */}
      <div className="flex rounded-lg border overflow-hidden">
        <button
          type="button"
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
            mode === 'produtos' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
          }`}
          onClick={() => setMode('produtos')}
        >
          <Package className="h-4 w-4" />
          Com Produtos
        </button>
        <button
          type="button"
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
            mode === 'manual' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
          }`}
          onClick={() => setMode('manual')}
        >
          <DollarSign className="h-4 w-4" />
          Valor Manual
        </button>
      </div>

      {/* Cliente */}
      <div className="space-y-2">
        <Label>Cliente *</Label>
        {clienteId ? (
          <div className="flex items-center gap-2">
            <span className="flex-1 p-2 border rounded-md bg-muted/50">{clienteName}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setClienteId(''); setClienteName('') }}>
              Trocar
            </Button>
          </div>
        ) : (
          <div className="relative">
            <Input
              placeholder="Buscar cliente..."
              value={clienteSearch}
              onChange={(e) => { setClienteSearch(e.target.value); setShowClienteDropdown(true) }}
              onFocus={() => setShowClienteDropdown(true)}
            />
            {showClienteDropdown && clientesData && clientesData.items.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-40 overflow-y-auto">
                {clientesData.items.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                    onClick={() => selectCliente(c)}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* === MODO PRODUTOS === */}
      {mode === 'produtos' && (
        <>
          <div className="space-y-2">
            <Label>Produtos *</Label>
            <div className="relative">
              <Input
                placeholder="Buscar produto por nome ou codigo..."
                value={produtoSearch}
                onChange={(e) => { setProdutoSearch(e.target.value); setShowProdutoDropdown(true) }}
                onFocus={() => setShowProdutoDropdown(true)}
              />
              {showProdutoDropdown && produtosData && produtosData.items.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {produtosData.items
                    .filter(p => !items.some(i => i.produtoId === p.id))
                    .map(p => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex justify-between"
                        onClick={() => addItem(p)}
                      >
                        <span>{p.code} - {p.name}</span>
                        <span className="text-muted-foreground">{formatCurrency(p.salePrice)} (est: {p.quantity})</span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          {items.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2 font-medium">Produto</th>
                    <th className="text-center p-2 font-medium w-20">Qtd</th>
                    <th className="text-right p-2 font-medium w-28">Preço</th>
                    <th className="text-right p-2 font-medium w-28">Subtotal</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.produtoId} className="border-b last:border-0">
                      <td className="p-2">{item.produtoName}</td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min={1}
                          max={item.maxStock}
                          value={item.quantity}
                          onChange={(e) => updateItemQty(index, parseInt(e.target.value) || 1)}
                          className="w-20 text-center h-8"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={item.unitPrice}
                          onChange={(e) => updateItemPrice(index, parseFloat(e.target.value) || 0)}
                          className="w-28 text-right h-8"
                        />
                      </td>
                      <td className="p-2 text-right font-medium">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </td>
                      <td className="p-2">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(index)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* === MODO MANUAL === */}
      {mode === 'manual' && (
        <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
          <p className="text-sm text-muted-foreground">
            Informe o valor total da venda sem selecionar produtos. O estoque nao sera alterado.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valorManual">Valor da Venda (R$) *</Label>
              <Input
                id="valorManual"
                type="number"
                step="0.01"
                min={0}
                value={valorManual || ''}
                onChange={(e) => setValorManual(parseFloat(e.target.value) || 0)}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricaoManual">Descricao</Label>
              <Input
                id="descricaoManual"
                value={descricaoManual}
                onChange={(e) => setDescricaoManual(e.target.value)}
                placeholder="Ex: Revenda Natura ciclo 03"
              />
            </div>
          </div>
        </div>
      )}

      {/* Pagamento */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
          <select
            id="formaPagamento"
            value={formaPagamento}
            onChange={(e) => {
              setFormaPagamento(e.target.value)
              if (e.target.value === 'DINHEIRO' || e.target.value === 'PIX') setParcelas(1)
            }}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="PIX">PIX</option>
            <option value="DINHEIRO">Dinheiro</option>
            <option value="CARTAO">Cartao</option>
            <option value="BOLETO">Boleto</option>
            <option value="FIADO">Fiado</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="parcelas">Parcelas</Label>
          <Input
            id="parcelas"
            type="number"
            min={1}
            max={12}
            value={parcelas}
            onChange={(e) => setParcelas(Math.max(1, Math.min(12, parseInt(e.target.value) || 1)))}
            disabled={formaPagamento === 'DINHEIRO' || formaPagamento === 'PIX'}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="discount">Desconto (R$)</Label>
          <Input
            id="discount"
            type="number"
            step="0.01"
            min={0}
            value={discount}
            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Observacoes</Label>
          <Input
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Opcional"
          />
        </div>
      </div>

      {/* Totais */}
      {(items.length > 0 || (mode === 'manual' && valorManual > 0)) && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-destructive">
              <span>Desconto:</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
            <span>Total:</span>
            <span>{formatCurrency(total)}</span>
          </div>
          {parcelas > 1 && (
            <div className="flex justify-between text-muted-foreground">
              <span>{parcelas}x de:</span>
              <span>{formatCurrency(total / parcelas)}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={isSubmitting || !isFormValid}>
          {isSubmitting ? 'Registrando...' : 'Registrar Venda'}
        </Button>
      </div>
    </form>
  )
}
