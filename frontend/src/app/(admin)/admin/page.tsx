'use client'

import { useAdminStats, useAdminTenants } from '@/hooks/useAdmin'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, ShoppingCart, Building2, UserCheck } from 'lucide-react'
import Link from 'next/link'

const statusLabels: Record<string, string> = {
  TRIAL: 'Em teste',
  ACTIVE: 'Ativos',
  PAUSED: 'Pausados',
  CANCELLED: 'Cancelados',
}

const statusColors: Record<string, string> = {
  TRIAL: 'text-blue-600 bg-blue-50',
  ACTIVE: 'text-emerald-600 bg-emerald-50',
  PAUSED: 'text-amber-600 bg-amber-50',
  CANCELLED: 'text-red-600 bg-red-50',
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading: loadingStats } = useAdminStats()
  const { data: tenants, isLoading: loadingTenants } = useAdminTenants()

  const recentTenants = tenants?.slice(0, 5) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Painel Administrativo</h1>
        <p className="text-muted-foreground mt-1">Visao geral do sistema</p>
      </div>

      {/* Stats */}
      {loadingStats ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-5">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-7 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Tenants</p>
                  <p className="text-2xl font-bold mt-1">{stats.totalTenants}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Usuarios</p>
                  <p className="text-2xl font-bold mt-1">{stats.totalUsers}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                  <UserCheck className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Vendas</p>
                  <p className="text-2xl font-bold mt-1">{stats.totalVendas}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                  <ShoppingCart className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tenants Ativos</p>
                  <p className="text-2xl font-bold mt-1">{(stats.tenantsByStatus['ACTIVE'] || 0) + (stats.tenantsByStatus['TRIAL'] || 0)}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                  <Users className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Status breakdown */}
      {stats && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h2 className="font-semibold mb-3">Tenants por Status</h2>
            <div className="flex flex-wrap gap-3">
              {Object.entries(statusLabels).map(([key, label]) => (
                <div key={key} className={`px-3 py-2 rounded-lg ${statusColors[key]}`}>
                  <span className="text-sm font-medium">{label}: </span>
                  <span className="text-sm font-bold">{stats.tenantsByStatus[key] || 0}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent tenants */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Ultimos Tenants</h2>
            <Link href="/admin/tenants" className="text-sm text-primary hover:underline">
              Ver todos
            </Link>
          </div>

          {loadingTenants ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {recentTenants.map((tenant) => (
                <Link
                  key={tenant.id}
                  href={`/admin/tenants?id=${tenant.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">{tenant.name}</p>
                    <p className="text-xs text-muted-foreground">{tenant.owner?.email || 'Sem proprietario'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[tenant.planStatus]}`}>
                      {statusLabels[tenant.planStatus]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {tenant._count.vendas} vendas
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
