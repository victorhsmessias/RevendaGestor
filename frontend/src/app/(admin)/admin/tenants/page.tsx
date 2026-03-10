'use client'

import { useState } from 'react'
import { useAdminTenants, useAdminTenantDetail, useUpdateTenant } from '@/hooks/useAdmin'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Building2,
  Users,
  Package,
  ShoppingCart,
  Truck,
  Receipt,
  Search,
  ChevronRight,
} from 'lucide-react'
import { Input } from '@/components/ui/input'

const statusLabels: Record<string, string> = {
  TRIAL: 'Em teste',
  ACTIVE: 'Ativo',
  PAUSED: 'Pausado',
  CANCELLED: 'Cancelado',
}

const statusColors: Record<string, string> = {
  TRIAL: 'text-blue-600 bg-blue-50',
  ACTIVE: 'text-emerald-600 bg-emerald-50',
  PAUSED: 'text-amber-600 bg-amber-50',
  CANCELLED: 'text-red-600 bg-red-50',
}

export default function AdminTenantsPage() {
  const { data: tenants, isLoading } = useAdminTenants()
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filteredTenants = tenants?.filter(t => {
    const q = search.toLowerCase()
    return t.name.toLowerCase().includes(q) ||
      t.owner?.name?.toLowerCase().includes(q) ||
      t.owner?.email?.toLowerCase().includes(q)
  }) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tenants</h1>
        <p className="text-muted-foreground mt-1">{tenants?.length || 0} conta(s) cadastrada(s)</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredTenants.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center text-muted-foreground">
            Nenhum tenant encontrado
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredTenants.map((tenant) => (
            <Card
              key={tenant.id}
              className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedId(tenant.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-muted">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{tenant.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {tenant.owner?.name || 'Sem proprietario'} — {tenant.owner?.email || ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{tenant._count.users} usr</span>
                      <span>{tenant._count.clientes} cli</span>
                      <span>{tenant._count.vendas} vnd</span>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[tenant.planStatus]}`}>
                      {statusLabels[tenant.planStatus]}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail dialog */}
      {selectedId && (
        <TenantDetailDialog
          id={selectedId}
          open={!!selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}

function TenantDetailDialog({ id, open, onClose }: { id: string; open: boolean; onClose: () => void }) {
  const { data: tenant, isLoading } = useAdminTenantDetail(id)
  const updateTenant = useUpdateTenant()

  function handleChangeStatus(planStatus: string) {
    updateTenant.mutate(
      { id, data: { planStatus } },
      {
        onSuccess: () => {
          toast.success(`Status alterado para ${statusLabels[planStatus]}`)
        },
        onError: () => {
          toast.error('Erro ao alterar status')
        },
      }
    )
  }

  function handleExtendTrial() {
    const newDate = new Date()
    newDate.setDate(newDate.getDate() + 14)
    updateTenant.mutate(
      { id, data: { trialEndsAt: newDate.toISOString(), planStatus: 'TRIAL' } },
      {
        onSuccess: () => {
          toast.success('Trial estendido por mais 14 dias')
        },
        onError: () => {
          toast.error('Erro ao estender trial')
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{tenant?.name || 'Carregando...'}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-5 w-40" />
          </div>
        ) : tenant ? (
          <div className="space-y-5">
            {/* Status */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Status atual</p>
              <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${statusColors[tenant.planStatus]}`}>
                {statusLabels[tenant.planStatus]}
              </span>
              {tenant.trialEndsAt && (
                <p className="text-xs text-muted-foreground mt-2">
                  Trial expira em: {new Date(tenant.trialEndsAt).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>

            {/* Contadores */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Users, label: 'Clientes', value: tenant._count.clientes },
                { icon: Truck, label: 'Fornecedores', value: tenant._count.fornecedores },
                { icon: Package, label: 'Produtos', value: tenant._count.produtos },
                { icon: ShoppingCart, label: 'Vendas', value: tenant._count.vendas },
                { icon: Receipt, label: 'Contas', value: tenant._count.contasPagar },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-semibold">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Usuarios */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Usuarios ({tenant.users.length})</p>
              <div className="space-y-1">
                {tenant.users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50">
                    <div>
                      <span className="font-medium">{u.name}</span>
                      <span className="text-muted-foreground ml-2">{u.email}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{u.role}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Criado em: {new Date(tenant.createdAt).toLocaleDateString('pt-BR')}</p>
              {tenant.asaasSubscriptionId && <p>Asaas: {tenant.asaasSubscriptionId}</p>}
            </div>

            {/* Acoes */}
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3">Acoes</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleChangeStatus('ACTIVE')}
                  disabled={tenant.planStatus === 'ACTIVE' || updateTenant.isPending}
                  className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                >
                  Ativar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleChangeStatus('PAUSED')}
                  disabled={tenant.planStatus === 'PAUSED' || updateTenant.isPending}
                  className="text-amber-600 border-amber-200 hover:bg-amber-50"
                >
                  Pausar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleChangeStatus('CANCELLED')}
                  disabled={tenant.planStatus === 'CANCELLED' || updateTenant.isPending}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExtendTrial}
                  disabled={updateTenant.isPending}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  Estender Trial +14d
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
