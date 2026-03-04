'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useRelatorioVendas,
  useRelatorioFinanceiro,
  useRelatorioProdutos,
  useRelatorioClientes,
} from '@/hooks/useRelatorios'
import {
  ShoppingCart,
  DollarSign,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from 'lucide-react'
import { useValuesVisibility } from '@/providers/ValuesVisibilityProvider'

function getDefaultDates() {
  const now = new Date()
  const inicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const fim = now.toISOString().split('T')[0]
  return { inicio, fim }
}

const fmtRaw = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const formatDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')

const formaLabels: Record<string, string> = {
  DINHEIRO: 'Dinheiro', PIX: 'PIX', CARTAO: 'Cartao', BOLETO: 'Boleto', FIADO: 'Fiado',
}

export default function RelatoriosPage() {
  const { mask } = useValuesVisibility()
  const fmt = (v: number) => mask(fmtRaw(v))
  const defaults = getDefaultDates()
  const [dataInicio, setDataInicio] = useState(defaults.inicio)
  const [dataFim, setDataFim] = useState(defaults.fim)
  const [activeTab, setActiveTab] = useState('vendas')

  const hasValidDates = !!(dataInicio && dataFim && dataInicio <= dataFim)

  const vendas = useRelatorioVendas(dataInicio, dataFim, hasValidDates && activeTab === 'vendas')
  const financeiro = useRelatorioFinanceiro(dataInicio, dataFim, hasValidDates && activeTab === 'financeiro')
  const produtos = useRelatorioProdutos(dataInicio, dataFim, hasValidDates && activeTab === 'produtos')
  const clientes = useRelatorioClientes(dataInicio, dataFim, hasValidDates && activeTab === 'clientes')

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold">Relatorios</h1>

      {/* Filtro de periodo */}
      <Card>
        <CardContent className="pt-4 md:pt-6">
          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end sm:gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="dataInicio" className="text-xs sm:text-sm">Inicio</Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dataFim" className="text-xs sm:text-sm">Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="col-span-2 flex gap-2 sm:col-span-1">
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none text-xs sm:text-sm" onClick={() => {
                const d = getDefaultDates()
                setDataInicio(d.inicio); setDataFim(d.fim)
              }}>
                Mes Atual
              </Button>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none text-xs sm:text-sm" onClick={() => {
                const now = new Date()
                const inicio = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
                const fim = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
                setDataInicio(inicio); setDataFim(fim)
              }}>
                Anterior
              </Button>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none text-xs sm:text-sm" onClick={() => {
                const now = new Date()
                setDataInicio(`${now.getFullYear()}-01-01`); setDataFim(now.toISOString().split('T')[0])
              }}>
                Ano
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="vendas" className="flex items-center gap-1 text-xs sm:text-sm">
            <ShoppingCart className="h-3.5 w-3.5 hidden sm:block" />
            Vendas
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="flex items-center gap-1 text-xs sm:text-sm">
            <DollarSign className="h-3.5 w-3.5 hidden sm:block" />
            <span className="hidden sm:inline">Financeiro</span>
            <span className="sm:hidden">Financ.</span>
          </TabsTrigger>
          <TabsTrigger value="produtos" className="flex items-center gap-1 text-xs sm:text-sm">
            <Package className="h-3.5 w-3.5 hidden sm:block" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="clientes" className="flex items-center gap-1 text-xs sm:text-sm">
            <Users className="h-3.5 w-3.5 hidden sm:block" />
            Clientes
          </TabsTrigger>
        </TabsList>

        {/* === ABA VENDAS === */}
        <TabsContent value="vendas" className="space-y-4 md:space-y-6">
          {vendas.isLoading && <p className="text-muted-foreground">Carregando...</p>}
          {vendas.data && (
            <>
              {/* KPIs */}
              <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
                <KPICard title="Total de Vendas" value={String(vendas.data.resumo.totalVendas)} icon={<ShoppingCart className="h-5 w-5 text-blue-500" />} />
                <KPICard title="Faturamento" value={fmt(vendas.data.resumo.faturamento)} icon={<DollarSign className="h-5 w-5 text-green-500" />} />
                <KPICard title="Ticket Medio" value={fmt(vendas.data.resumo.ticketMedio)} icon={<BarChart3 className="h-5 w-5 text-purple-500" />} />
                <KPICard title="Descontos" value={fmt(vendas.data.resumo.descontos)} icon={<TrendingDown className="h-5 w-5 text-red-500" />} />
              </div>

              {/* Vendas por dia */}
              {vendas.data.vendasPorDia.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Vendas por Dia</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {vendas.data.vendasPorDia.map(d => {
                        const maxTotal = Math.max(...vendas.data!.vendasPorDia.map(x => x.total))
                        const pct = maxTotal > 0 ? (d.total / maxTotal) * 100 : 0
                        return (
                          <div key={d.data} className="text-sm">
                            {/* Mobile: stacked */}
                            <div className="flex items-center justify-between mb-1 sm:hidden">
                              <span className="text-muted-foreground text-xs">{formatDate(d.data)}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{d.qtd}x</span>
                                <span className="font-medium text-xs">{fmt(d.total)}</span>
                              </div>
                            </div>
                            <div className="h-5 bg-muted rounded overflow-hidden sm:hidden">
                              <div className="h-full bg-primary/70 rounded" style={{ width: `${pct}%` }} />
                            </div>
                            {/* Desktop: inline */}
                            <div className="hidden sm:flex items-center gap-3">
                              <span className="w-24 text-muted-foreground">{formatDate(d.data)}</span>
                              <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                                <div className="h-full bg-primary/70 rounded" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="w-28 text-right font-medium">{fmt(d.total)}</span>
                              <span className="w-16 text-right text-muted-foreground">{d.qtd}x</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Por forma de pagamento */}
              {vendas.data.porFormaPagamento.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Por Forma de Pagamento</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid gap-2 sm:gap-3 grid-cols-2 lg:grid-cols-3">
                      {vendas.data.porFormaPagamento.map(fp => (
                        <div key={fp.forma} className="border rounded-lg p-2.5 sm:p-3">
                          <p className="font-medium text-sm">{formaLabels[fp.forma] || fp.forma}</p>
                          <p className="text-base sm:text-lg font-bold">{fmt(fp.total)}</p>
                          <p className="text-xs text-muted-foreground">{fp.qtd} venda(s)</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Lista de vendas */}
              {vendas.data.vendas.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Detalhamento</CardTitle></CardHeader>
                  <CardContent>
                    {/* Mobile: cards */}
                    <div className="space-y-2 md:hidden">
                      {vendas.data.vendas.map(v => (
                        <div key={v.id} className="border rounded-lg p-2.5 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium truncate">{v.cliente.name}</span>
                            <span className="font-medium shrink-0 ml-2">{fmt(v.total)}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            <span>{formatDate(v.createdAt.split('T')[0])}</span>
                            <span>{formaLabels[v.formaPagamento] || v.formaPagamento}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Desktop: table */}
                    <div className="border rounded-lg overflow-hidden hidden md:block">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-2 font-medium">Data</th>
                            <th className="text-left p-2 font-medium">Cliente</th>
                            <th className="text-left p-2 font-medium">Pagamento</th>
                            <th className="text-right p-2 font-medium">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vendas.data.vendas.map(v => (
                            <tr key={v.id} className="border-b last:border-0">
                              <td className="p-2">{formatDate(v.createdAt.split('T')[0])}</td>
                              <td className="p-2">{v.cliente.name}</td>
                              <td className="p-2 text-muted-foreground">{formaLabels[v.formaPagamento] || v.formaPagamento}</td>
                              <td className="p-2 text-right font-medium">{fmt(v.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {vendas.data.resumo.totalVendas === 0 && (
                <p className="text-center text-muted-foreground py-8">Nenhuma venda no periodo selecionado</p>
              )}
            </>
          )}
        </TabsContent>

        {/* === ABA FINANCEIRO === */}
        <TabsContent value="financeiro" className="space-y-4 md:space-y-6">
          {financeiro.isLoading && <p className="text-muted-foreground">Carregando...</p>}
          {financeiro.data && (
            <>
              <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
                <KPICard title="Receitas" value={fmt(financeiro.data.resumo.receitas)} icon={<TrendingUp className="h-5 w-5 text-green-500" />} />
                <KPICard title="Despesas" value={fmt(financeiro.data.resumo.despesasTotal)} icon={<TrendingDown className="h-5 w-5 text-red-500" />} />
                <KPICard
                  title="Lucro Estimado"
                  value={fmt(financeiro.data.resumo.lucroEstimado)}
                  icon={<DollarSign className="h-5 w-5 text-blue-500" />}
                  highlight={financeiro.data.resumo.lucroEstimado >= 0 ? 'positive' : 'negative'}
                />
                <KPICard title="A Receber" value={fmt(financeiro.data.resumo.parcelasPendentes)} icon={<BarChart3 className="h-5 w-5 text-amber-500" />} />
              </div>

              {/* Detalhes */}
              <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle className="text-base">Despesas</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total:</span><span className="font-medium">{fmt(financeiro.data.resumo.despesasTotal)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Pagas:</span><span className="font-medium">{fmt(financeiro.data.resumo.despesasPagas)}</span>
                    </div>
                    <div className="flex justify-between text-amber-600">
                      <span>Pendentes:</span><span className="font-medium">{fmt(financeiro.data.resumo.despesasPendentes)}</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">Parcelas a Receber</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between text-green-600">
                      <span>Recebidas:</span><span className="font-medium">{fmt(financeiro.data.resumo.parcelasRecebidas)}</span>
                    </div>
                    <div className="flex justify-between text-amber-600">
                      <span>Pendentes:</span><span className="font-medium">{fmt(financeiro.data.resumo.parcelasPendentes)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Fluxo por dia */}
              {financeiro.data.fluxoPorDia.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Fluxo de Caixa Diario</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {financeiro.data.fluxoPorDia.map(d => (
                        <div key={d.data} className="text-sm border-b pb-2 last:border-0">
                          {/* Mobile */}
                          <div className="sm:hidden">
                            <div className="flex justify-between mb-0.5">
                              <span className="text-xs text-muted-foreground">{formatDate(d.data)}</span>
                              <span className={`text-xs font-medium ${d.receitas - d.despesas >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {fmt(d.receitas - d.despesas)}
                              </span>
                            </div>
                            <div className="flex gap-3 text-xs">
                              {d.receitas > 0 && <span className="text-green-600">+{fmt(d.receitas)}</span>}
                              {d.despesas > 0 && <span className="text-red-600">-{fmt(d.despesas)}</span>}
                            </div>
                          </div>
                          {/* Desktop */}
                          <div className="hidden sm:flex items-center gap-3">
                            <span className="w-24 text-muted-foreground">{formatDate(d.data)}</span>
                            <div className="flex-1 flex gap-4">
                              {d.receitas > 0 && <span className="text-green-600">+{fmt(d.receitas)}</span>}
                              {d.despesas > 0 && <span className="text-red-600">-{fmt(d.despesas)}</span>}
                            </div>
                            <span className={`font-medium ${d.receitas - d.despesas >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {fmt(d.receitas - d.despesas)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {financeiro.data.fluxoPorDia.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Nenhuma movimentacao no periodo</p>
              )}
            </>
          )}
        </TabsContent>

        {/* === ABA PRODUTOS === */}
        <TabsContent value="produtos" className="space-y-4 md:space-y-6">
          {produtos.isLoading && <p className="text-muted-foreground">Carregando...</p>}
          {produtos.data && (
            <>
              <div className="grid gap-3 md:gap-4 grid-cols-2">
                <KPICard title="Produtos Vendidos" value={String(produtos.data.totalProdutosVendidos)} icon={<Package className="h-5 w-5 text-blue-500" />} />
                <KPICard title="Produtos Diferentes" value={String(produtos.data.ranking.length)} icon={<BarChart3 className="h-5 w-5 text-purple-500" />} />
              </div>

              {produtos.data.ranking.length > 0 ? (
                <Card>
                  <CardHeader><CardTitle className="text-base">Ranking de Produtos</CardTitle></CardHeader>
                  <CardContent>
                    {/* Mobile: cards */}
                    <div className="space-y-2 md:hidden">
                      {produtos.data.ranking.map((p, i) => (
                        <div key={p.id} className="border rounded-lg p-2.5">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-muted-foreground font-mono">#{i + 1}</span>
                                <span className="font-medium text-sm truncate">{p.name}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">{p.code} - {p.qtdVendida} un.</span>
                            </div>
                            <span className={`text-sm font-bold shrink-0 ml-2 ${p.lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {fmt(p.lucro)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Desktop: table */}
                    <div className="border rounded-lg overflow-hidden hidden md:block">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-center p-2 font-medium w-10">#</th>
                            <th className="text-left p-2 font-medium">Produto</th>
                            <th className="text-right p-2 font-medium">Qtd</th>
                            <th className="text-right p-2 font-medium">Faturamento</th>
                            <th className="text-right p-2 font-medium hidden lg:table-cell">Custo</th>
                            <th className="text-right p-2 font-medium">Lucro</th>
                          </tr>
                        </thead>
                        <tbody>
                          {produtos.data.ranking.map((p, i) => (
                            <tr key={p.id} className="border-b last:border-0">
                              <td className="p-2 text-center text-muted-foreground">{i + 1}</td>
                              <td className="p-2">
                                <p className="font-medium">{p.name}</p>
                                <p className="text-xs text-muted-foreground">{p.code}</p>
                              </td>
                              <td className="p-2 text-right">{p.qtdVendida}</td>
                              <td className="p-2 text-right">{fmt(p.faturamento)}</td>
                              <td className="p-2 text-right hidden lg:table-cell text-muted-foreground">{fmt(p.custoTotal)}</td>
                              <td className={`p-2 text-right font-medium ${p.lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {fmt(p.lucro)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhum produto vendido no periodo</p>
              )}
            </>
          )}
        </TabsContent>

        {/* === ABA CLIENTES === */}
        <TabsContent value="clientes" className="space-y-4 md:space-y-6">
          {clientes.isLoading && <p className="text-muted-foreground">Carregando...</p>}
          {clientes.data && (
            <>
              <div className="grid gap-3 md:gap-4 grid-cols-2">
                <KPICard title="Clientes Ativos" value={String(clientes.data.ranking.length)} icon={<Users className="h-5 w-5 text-blue-500" />} />
                <KPICard
                  title="Total Movimentado"
                  value={fmt(clientes.data.ranking.reduce((s, c) => s + c.totalGasto, 0))}
                  icon={<DollarSign className="h-5 w-5 text-green-500" />}
                />
              </div>

              {clientes.data.ranking.length > 0 ? (
                <Card>
                  <CardHeader><CardTitle className="text-base">Ranking de Clientes</CardTitle></CardHeader>
                  <CardContent>
                    {/* Mobile: cards */}
                    <div className="space-y-2 md:hidden">
                      {clientes.data.ranking.map((c, i) => (
                        <div key={c.id} className="border rounded-lg p-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-xs text-muted-foreground font-mono">#{i + 1}</span>
                              <span className="font-medium text-sm truncate">{c.name}</span>
                            </div>
                            <span className="font-bold text-sm shrink-0 ml-2">{fmt(c.totalGasto)}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 ml-5">
                            {c.qtdCompras} compra(s)
                            {c.phone && <span> - {c.phone}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Desktop: table */}
                    <div className="border rounded-lg overflow-hidden hidden md:block">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-center p-2 font-medium w-10">#</th>
                            <th className="text-left p-2 font-medium">Cliente</th>
                            <th className="text-left p-2 font-medium hidden lg:table-cell">Telefone</th>
                            <th className="text-right p-2 font-medium">Compras</th>
                            <th className="text-right p-2 font-medium">Total Gasto</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clientes.data.ranking.map((c, i) => (
                            <tr key={c.id} className="border-b last:border-0">
                              <td className="p-2 text-center text-muted-foreground">{i + 1}</td>
                              <td className="p-2 font-medium">{c.name}</td>
                              <td className="p-2 hidden lg:table-cell text-muted-foreground">{c.phone || '-'}</td>
                              <td className="p-2 text-right">{c.qtdCompras}</td>
                              <td className="p-2 text-right font-medium">{fmt(c.totalGasto)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhuma venda no periodo</p>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Componente KPI reutilizavel
function KPICard({ title, value, icon, highlight }: {
  title: string; value: string; icon: React.ReactNode; highlight?: 'positive' | 'negative'
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 md:p-6 md:pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
        <p className={`text-lg sm:text-2xl font-bold ${
          highlight === 'positive' ? 'text-green-600' :
          highlight === 'negative' ? 'text-red-600' : ''
        }`}>{value}</p>
      </CardContent>
    </Card>
  )
}
