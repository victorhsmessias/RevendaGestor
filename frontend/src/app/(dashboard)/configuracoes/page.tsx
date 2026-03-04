'use client'

import { useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { useTenantInfo, useUpdateProfile, useChangePassword, useUpdateTenant } from '@/hooks/useConfiguracoes'
import { useAssinatura, useCreateAssinatura, useCancelAssinatura } from '@/hooks/useAssinatura'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { User, Lock, Store, Users, Package, ShoppingCart, Truck, CreditCard, ExternalLink } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

export default function ConfiguracoesPage() {
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') || 'perfil'

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold">Configuracoes</h1>

      <Tabs defaultValue={defaultTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="perfil" className="flex items-center gap-1 text-xs sm:text-sm">
            <User className="h-4 w-4 hidden sm:block" /> Perfil
          </TabsTrigger>
          <TabsTrigger value="senha" className="flex items-center gap-1 text-xs sm:text-sm">
            <Lock className="h-4 w-4 hidden sm:block" /> Senha
          </TabsTrigger>
          <TabsTrigger value="loja" className="flex items-center gap-1 text-xs sm:text-sm">
            <Store className="h-4 w-4 hidden sm:block" /> Loja
          </TabsTrigger>
          <TabsTrigger value="assinatura" className="flex items-center gap-1 text-xs sm:text-sm">
            <CreditCard className="h-4 w-4 hidden sm:block" /> Plano
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perfil"><ProfileTab /></TabsContent>
        <TabsContent value="senha"><PasswordTab /></TabsContent>
        <TabsContent value="loja"><TenantTab /></TabsContent>
        <TabsContent value="assinatura"><AssinaturaTab /></TabsContent>
      </Tabs>
    </div>
  )
}

// === ABA PERFIL ===
function ProfileTab() {
  const { user, refreshUser } = useAuth()
  const updateProfile = useUpdateProfile()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) { toast.error('Preencha todos os campos'); return }
    setSaving(true)
    try {
      await updateProfile.mutateAsync({ name, email })
      await refreshUser()
      toast.success('Perfil atualizado')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados do Perfil</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Funcao</Label>
            <Input value={user?.role === 'OWNER' ? 'Proprietario' : user?.role === 'ADMIN' ? 'Administrador' : 'Usuario'} disabled />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Alteracoes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// === ABA SENHA ===
function PasswordTab() {
  const changePassword = useChangePassword()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword) { toast.error('Preencha todos os campos'); return }
    if (newPassword.length < 6) { toast.error('Nova senha deve ter no minimo 6 caracteres'); return }
    if (newPassword !== confirmPassword) { toast.error('As senhas nao conferem'); return }

    setSaving(true)
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword })
      toast.success('Senha alterada com sucesso')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao alterar senha')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alterar Senha</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Senha Atual</Label>
            <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Senha</Label>
            <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? 'Alterando...' : 'Alterar Senha'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// === ABA LOJA ===
function TenantTab() {
  const { data: tenantInfo, isLoading } = useTenantInfo()
  const updateTenant = useUpdateTenant()
  const { refreshUser } = useAuth()
  const [tenantName, setTenantName] = useState('')
  const [saving, setSaving] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Inicializar o nome quando os dados carregarem
  if (tenantInfo && !initialized) {
    setTenantName(tenantInfo.name)
    setInitialized(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantName.trim()) { toast.error('Nome da loja obrigatorio'); return }
    setSaving(true)
    try {
      await updateTenant.mutateAsync({ name: tenantName })
      await refreshUser()
      toast.success('Dados da loja atualizados')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar')
    } finally {
      setSaving(false)
    }
  }

  const planLabels: Record<string, string> = {
    TRIAL: 'Teste Gratuito',
    ACTIVE: 'Ativo',
    PAUSED: 'Pausado',
    CANCELLED: 'Cancelado',
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR')

  if (isLoading) return <p className="text-muted-foreground">Carregando...</p>

  return (
    <div className="space-y-6">
      {/* Dados da loja */}
      <Card>
        <CardHeader>
          <CardTitle>Dados da Loja</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="tenantName">Nome da Loja</Label>
              <Input id="tenantName" value={tenantName} onChange={(e) => setTenantName(e.target.value)} />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Info do plano */}
      {tenantInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Informacoes do Plano</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Plano:</span>
                <p className="font-medium">{planLabels[tenantInfo.planStatus] || tenantInfo.planStatus}</p>
              </div>
              {tenantInfo.trialEndsAt && (
                <div>
                  <span className="text-muted-foreground">Teste expira em:</span>
                  <p className="font-medium">{formatDate(tenantInfo.trialEndsAt)}</p>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Conta criada em:</span>
                <p className="font-medium">{formatDate(tenantInfo.createdAt)}</p>
              </div>
            </div>

            {/* Estatisticas */}
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3">Resumo da conta</p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
                <StatCard icon={<Users className="h-4 w-4" />} label="Usuarios" value={tenantInfo._count.users} />
                <StatCard icon={<Users className="h-4 w-4" />} label="Clientes" value={tenantInfo._count.clientes} />
                <StatCard icon={<Truck className="h-4 w-4" />} label="Fornecedores" value={tenantInfo._count.fornecedores} />
                <StatCard icon={<Package className="h-4 w-4" />} label="Produtos" value={tenantInfo._count.produtos} />
                <StatCard icon={<ShoppingCart className="h-4 w-4" />} label="Vendas" value={tenantInfo._count.vendas} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="border rounded-lg p-3 text-center">
      <div className="flex justify-center text-muted-foreground mb-1">{icon}</div>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

// === ABA ASSINATURA ===
function AssinaturaTab() {
  const { data, isLoading } = useAssinatura()
  const createMutation = useCreateAssinatura()
  const cancelMutation = useCancelAssinatura()

  const handleAssinar = async (billingType: 'PIX' | 'CREDIT_CARD' | 'UNDEFINED') => {
    try {
      const result = await createMutation.mutateAsync(billingType)
      if (result.paymentUrl) {
        window.open(result.paymentUrl, '_blank')
        toast.success('Redirecionando para pagamento...')
      } else {
        toast.success('Assinatura criada! Verifique seu email.')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar assinatura')
    }
  }

  const handleCancelar = async () => {
    if (!confirm('Tem certeza que deseja cancelar sua assinatura? Voce perdera o acesso ao sistema.')) return
    try {
      await cancelMutation.mutateAsync()
      toast.success('Assinatura cancelada')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao cancelar')
    }
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR')

  const planLabels: Record<string, { label: string; color: string }> = {
    TRIAL: { label: 'Teste Gratuito', color: 'bg-blue-100 text-blue-800' },
    ACTIVE: { label: 'Ativo', color: 'bg-green-100 text-green-800' },
    PAUSED: { label: 'Pagamento Pendente', color: 'bg-yellow-100 text-yellow-800' },
    CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
  }

  const billingLabels: Record<string, string> = {
    PIX: 'PIX',
    CREDIT_CARD: 'Cartao de Credito',
    BOLETO: 'Boleto',
    UNDEFINED: 'A definir',
  }

  if (isLoading) return <p className="text-muted-foreground">Carregando...</p>

  const plan = data ? planLabels[data.planStatus] || planLabels.TRIAL : planLabels.TRIAL

  return (
    <div className="space-y-6">
      {/* Status atual */}
      <Card>
        <CardHeader>
          <CardTitle>Sua Assinatura</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Status:</span>
            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${plan.color}`}>
              {plan.label}
            </span>
          </div>

          {data?.planStatus === 'TRIAL' && data.trialEndsAt && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Seu periodo de teste expira em <strong>{formatDate(data.trialEndsAt)}</strong>.
                Assine para continuar usando o RevendaGestor.
              </p>
            </div>
          )}

          {data?.planStatus === 'PAUSED' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                Seu pagamento esta pendente. Regularize para continuar acessando o sistema.
              </p>
            </div>
          )}

          {data?.planStatus === 'CANCELLED' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                Sua assinatura foi cancelada. Assine novamente para voltar a usar o sistema.
              </p>
            </div>
          )}

          {/* Info da assinatura ativa */}
          {data?.subscription && (
            <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
              <div>
                <span className="text-muted-foreground">Valor:</span>
                <p className="font-medium">R$ {data.subscription.value.toFixed(2).replace('.', ',')}/mes</p>
              </div>
              <div>
                <span className="text-muted-foreground">Forma de pagamento:</span>
                <p className="font-medium">{billingLabels[data.subscription.billingType] || data.subscription.billingType}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Proxima cobranca:</span>
                <p className="font-medium">{formatDate(data.subscription.nextDueDate)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ações */}
      {(data?.planStatus === 'TRIAL' || data?.planStatus === 'CANCELLED') && (
        <Card>
          <CardHeader>
            <CardTitle>Assinar RevendaGestor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-lg font-bold">R$ 34,90 <span className="text-sm font-normal text-muted-foreground">/ mes</span></p>
              <p className="text-sm text-muted-foreground mt-1">
                Acesso completo a todas as funcionalidades do RevendaGestor
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => handleAssinar('PIX')}
                disabled={createMutation.isPending}
                className="flex-1"
              >
                {createMutation.isPending ? 'Criando...' : 'Pagar com PIX'}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAssinar('CREDIT_CARD')}
                disabled={createMutation.isPending}
                className="flex-1"
              >
                {createMutation.isPending ? 'Criando...' : 'Pagar com Cartao'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Link de pagamento pendente */}
      {data?.paymentUrl && data.planStatus === 'PAUSED' && (
        <Card>
          <CardHeader>
            <CardTitle>Regularizar Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.open(data.paymentUrl!, '_blank')} className="w-full sm:w-auto">
              <ExternalLink className="h-4 w-4 mr-2" />
              Pagar agora
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Cancelar */}
      {data?.planStatus === 'ACTIVE' && data.subscription && (
        <Card>
          <CardContent className="pt-6">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCancelar}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'Cancelando...' : 'Cancelar assinatura'}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Ao cancelar, voce perdera o acesso ao sistema ao final do periodo pago.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
