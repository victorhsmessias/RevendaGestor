'use client'

import { useAuth } from '@/providers/AuthProvider'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useValuesVisibility } from '@/providers/ValuesVisibilityProvider'
import Link from 'next/link'
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Receipt,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'

interface DashboardData {
  clientes: number
  produtos: number
  produtosBaixoEstoque: number
  vendasMes: number
  faturamentoMes: number
  ticketMedio: number
  contasPagar: { total: number; valor: number; vencidas: number }
  parcelasReceber: { total: number; valor: number; vencidas: number }
}

interface KPICardProps {
  title: string
  value: string
  description: string
  icon: React.ReactNode
  alert?: boolean
}

function KPICard({ title, value, description, icon, alert }: KPICardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <p className={`text-xl md:text-2xl font-bold ${alert ? 'text-destructive' : ''}`}>{value}</p>
        <p className={`text-xs mt-1 ${alert ? 'text-destructive' : 'text-muted-foreground'}`}>{description}</p>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { user, tenant } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardData>('/dashboard'),
  })

  const { mask } = useValuesVisibility()
  const fmt = (v: number) =>
    mask(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v))

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">
          Ola, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Bem-vindo ao painel da {tenant?.name}
        </p>
        {tenant?.planStatus === 'TRIAL' && (
          <div className="mt-2 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <AlertTriangle className="h-4 w-4" />
            Voce esta no periodo de teste gratuito
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-5 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-28 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data ? (
        <>
          {/* KPI Cards - Row 1 */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Faturamento do Mes"
              value={fmt(data.faturamentoMes)}
              description={`${data.vendasMes} venda(s) no mes`}
              icon={<DollarSign className="h-5 w-5 text-green-500" />}
            />
            <KPICard
              title="Ticket Medio"
              value={fmt(data.ticketMedio)}
              description="Valor medio por venda"
              icon={<ShoppingCart className="h-5 w-5 text-blue-500" />}
            />
            <KPICard
              title="A Receber"
              value={fmt(data.parcelasReceber.valor)}
              description={`${data.parcelasReceber.total} parcela(s) pendente(s)`}
              icon={<Receipt className="h-5 w-5 text-amber-500" />}
              alert={data.parcelasReceber.vencidas > 0}
            />
            <KPICard
              title="A Pagar"
              value={fmt(data.contasPagar.valor)}
              description={
                data.contasPagar.vencidas > 0
                  ? `${data.contasPagar.vencidas} conta(s) vencida(s)!`
                  : `${data.contasPagar.total} conta(s) pendente(s)`
              }
              icon={<Receipt className="h-5 w-5 text-red-500" />}
              alert={data.contasPagar.vencidas > 0}
            />
          </div>

          {/* KPI Cards - Row 2 */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <KPICard
              title="Clientes"
              value={String(data.clientes)}
              description="Clientes cadastrados"
              icon={<Users className="h-5 w-5 text-muted-foreground" />}
            />
            <KPICard
              title="Produtos"
              value={String(data.produtos)}
              description="Produtos cadastrados"
              icon={<Package className="h-5 w-5 text-muted-foreground" />}
            />
            <KPICard
              title="Estoque Baixo"
              value={String(data.produtosBaixoEstoque)}
              description={
                data.produtosBaixoEstoque > 0
                  ? 'Produto(s) precisam de reposicao!'
                  : 'Tudo em ordem'
              }
              icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
              alert={data.produtosBaixoEstoque > 0}
            />
          </div>

          {/* Quick Links */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: '/vendas', label: 'Nova Venda', icon: ShoppingCart },
              { href: '/clientes', label: 'Clientes', icon: Users },
              { href: '/produtos', label: 'Produtos', icon: Package },
              { href: '/contas-pagar', label: 'Contas a Pagar', icon: Receipt },
            ].map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{label}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
