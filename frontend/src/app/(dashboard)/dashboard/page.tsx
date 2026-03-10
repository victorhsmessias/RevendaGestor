'use client'

import { useAuth } from '@/providers/AuthProvider'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
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
  color?: 'teal' | 'blue' | 'amber' | 'red' | 'purple'
}

const colorMap = {
  teal: 'bg-primary/10 text-primary',
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600',
}

function KPICard({ title, value, description, icon, alert, color = 'teal' }: KPICardProps) {
  return (
    <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold tracking-tight ${alert ? 'text-destructive' : ''}`}>{value}</p>
            <p className={`text-xs ${alert ? 'text-destructive' : 'text-muted-foreground'}`}>{description}</p>
          </div>
          <div className={`p-2.5 rounded-xl ${colorMap[color]}`}>
            {icon}
          </div>
        </div>
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
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard de Desempenho Geral</h1>
        <p className="text-muted-foreground mt-1">
          Bem-vindo, {user?.name?.split(' ')[0]}! Aqui esta o resumo da {tenant?.name}
        </p>
        {tenant?.planStatus === 'TRIAL' && (
          <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
            <AlertTriangle className="h-4 w-4" />
            Voce esta no periodo de teste gratuito
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-7 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data ? (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Total de Vendas"
              value={fmt(data.faturamentoMes)}
              description={`${data.vendasMes} venda(s) no mes`}
              icon={<DollarSign className="h-5 w-5" />}
              color="teal"
            />
            <KPICard
              title="Novos Clientes"
              value={String(data.clientes)}
              description="Clientes cadastrados"
              icon={<Users className="h-5 w-5" />}
              color="blue"
            />
            <KPICard
              title="Ticket Medio"
              value={fmt(data.ticketMedio)}
              description="Valor medio por venda"
              icon={<ShoppingCart className="h-5 w-5" />}
              color="purple"
            />
            <KPICard
              title="Pagamentos Pendentes"
              value={fmt(data.contasPagar.valor)}
              description={
                data.contasPagar.vencidas > 0
                  ? `${data.contasPagar.vencidas} conta(s) vencida(s)!`
                  : `${data.contasPagar.total} conta(s) pendente(s)`
              }
              icon={<Receipt className="h-5 w-5" />}
              alert={data.contasPagar.vencidas > 0}
              color="amber"
            />
          </div>

          {/* Secondary Stats */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <KPICard
              title="A Receber"
              value={fmt(data.parcelasReceber.valor)}
              description={`${data.parcelasReceber.total} parcela(s) pendente(s)`}
              icon={<Receipt className="h-5 w-5" />}
              alert={data.parcelasReceber.vencidas > 0}
              color="teal"
            />
            <KPICard
              title="Produtos"
              value={String(data.produtos)}
              description="Produtos cadastrados"
              icon={<Package className="h-5 w-5" />}
              color="blue"
            />
            <KPICard
              title="Estoque Baixo"
              value={String(data.produtosBaixoEstoque)}
              description={
                data.produtosBaixoEstoque > 0
                  ? 'Produto(s) precisam de reposicao!'
                  : 'Tudo em ordem'
              }
              icon={<AlertTriangle className="h-5 w-5" />}
              alert={data.produtosBaixoEstoque > 0}
              color="amber"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: '/vendas', label: 'Nova Venda', icon: ShoppingCart, primary: true },
              { href: '/clientes', label: 'Clientes', icon: Users, primary: false },
              { href: '/produtos', label: 'Produtos', icon: Package, primary: false },
              { href: '/contas-pagar', label: 'Contas a Pagar', icon: Receipt, primary: false },
            ].map(({ href, label, icon: Icon, primary }) => (
              <Link key={href} href={href}>
                <Card className={`border-0 shadow-sm cursor-pointer transition-all duration-200 ${
                  primary
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                    : 'bg-card hover:bg-muted/50'
                }`}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{label}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 opacity-50" />
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
