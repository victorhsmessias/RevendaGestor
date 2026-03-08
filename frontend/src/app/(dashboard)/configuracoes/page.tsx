'use client'

import { useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { useTenantInfo, useUpdateProfile, useChangePassword, useUpdateTenant } from '@/hooks/useConfiguracoes'
import { useAssinatura, useCreateAssinatura, useCancelAssinatura, type PixData } from '@/hooks/useAssinatura'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { User, Lock, Store, Users, Package, ShoppingCart, Truck, CreditCard, Copy, Check, ArrowLeft, QrCode } from 'lucide-react'
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
  const [paymentStep, setPaymentStep] = useState<'choose' | 'pix-cpf' | 'pix' | 'card'>('choose')
  const [pixResult, setPixResult] = useState<PixData | null>(null)
  const [copied, setCopied] = useState(false)
  const [pixCpf, setPixCpf] = useState('')

  const [cardForm, setCardForm] = useState({
    holderName: '',
    number: '',
    expiryMonth: '',
    expiryYear: '',
    ccv: '',
    cpfCnpj: '',
    email: '',
    phone: '',
    postalCode: '',
    addressNumber: '',
  })

  const handlePixPayment = async () => {
    if (!pixCpf || pixCpf.replace(/\D/g, '').length < 11) {
      toast.error('Informe um CPF ou CNPJ valido')
      return
    }
    setPaymentStep('pix')
    try {
      const result = await createMutation.mutateAsync({ billingType: 'PIX', cpfCnpj: pixCpf.replace(/\D/g, '') })
      if (result.pixData) {
        setPixResult(result.pixData)
      } else {
        toast.error('QR Code PIX nao disponivel no momento. Tente novamente.')
        setPaymentStep('choose')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar assinatura')
      setPaymentStep('choose')
    }
  }

  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cardForm.holderName || !cardForm.number || !cardForm.expiryMonth || !cardForm.expiryYear || !cardForm.ccv) {
      toast.error('Preencha todos os dados do cartao')
      return
    }
    if (!cardForm.cpfCnpj || !cardForm.email || !cardForm.phone || !cardForm.postalCode || !cardForm.addressNumber) {
      toast.error('Preencha todos os dados do titular')
      return
    }

    try {
      const result = await createMutation.mutateAsync({
        billingType: 'CREDIT_CARD',
        creditCard: {
          holderName: cardForm.holderName,
          number: cardForm.number.replace(/\s/g, ''),
          expiryMonth: cardForm.expiryMonth,
          expiryYear: cardForm.expiryYear,
          ccv: cardForm.ccv,
        },
        creditCardHolderInfo: {
          name: cardForm.holderName,
          email: cardForm.email,
          cpfCnpj: cardForm.cpfCnpj.replace(/[.\-/]/g, ''),
          postalCode: cardForm.postalCode.replace(/\D/g, ''),
          addressNumber: cardForm.addressNumber,
          phone: cardForm.phone.replace(/\D/g, ''),
        },
      })

      if (result.paid) {
        toast.success('Pagamento aprovado! Sua assinatura esta ativa.')
      } else {
        toast.success('Assinatura criada! O pagamento sera processado.')
      }
      setPaymentStep('choose')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao processar pagamento')
    }
  }

  const handleCopyPix = async (payload: string) => {
    await navigator.clipboard.writeText(payload)
    setCopied(true)
    toast.success('Codigo PIX copiado!')
    setTimeout(() => setCopied(false), 3000)
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
  const showPayment = data?.planStatus === 'TRIAL' || data?.planStatus === 'CANCELLED'

  // PIX CPF step
  if (paymentStep === 'pix-cpf') {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setPaymentStep('choose')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" /> Pagamento via PIX
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Para gerar o QR Code PIX, precisamos do seu CPF ou CNPJ.
            </p>
            <div className="space-y-2 max-w-sm">
              <Label htmlFor="pixCpf">CPF ou CNPJ</Label>
              <Input
                id="pixCpf"
                placeholder="000.000.000-00"
                value={pixCpf}
                onChange={(e) => setPixCpf(e.target.value)}
              />
            </div>
            <Button onClick={handlePixPayment} disabled={createMutation.isPending} className="w-full max-w-sm">
              {createMutation.isPending ? 'Gerando QR Code...' : 'Gerar QR Code PIX'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // PIX QR Code display for pending payments
  if (data?.pixData && data.planStatus === 'PAUSED') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Sua Assinatura</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Status:</span>
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${plan.color}`}>
                {plan.label}
              </span>
            </div>
          </CardContent>
        </Card>
        <PixQrCodeCard pixData={data.pixData} copied={copied} onCopy={handleCopyPix} />
      </div>
    )
  }

  // PIX result after creating subscription
  if (paymentStep === 'pix' && pixResult) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setPaymentStep('choose')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <PixQrCodeCard pixData={pixResult} copied={copied} onCopy={handleCopyPix} />
        <p className="text-sm text-muted-foreground text-center">
          Apos o pagamento, sua assinatura sera ativada automaticamente.
        </p>
      </div>
    )
  }

  // Loading PIX
  if (paymentStep === 'pix' && createMutation.isPending) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setPaymentStep('choose')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <QrCode className="h-12 w-12 mx-auto text-muted-foreground animate-pulse mb-4" />
            <p className="text-muted-foreground">Gerando QR Code PIX...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Credit card form
  if (paymentStep === 'card') {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setPaymentStep('choose')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" /> Pagamento com Cartao de Credito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCardPayment} className="space-y-6">
              <div className="space-y-4">
                <p className="text-sm font-medium text-muted-foreground">Dados do cartao</p>
                <div className="space-y-2">
                  <Label htmlFor="holderName">Nome no cartao</Label>
                  <Input id="holderName" placeholder="NOME COMO ESTA NO CARTAO" value={cardForm.holderName}
                    onChange={(e) => setCardForm(f => ({ ...f, holderName: e.target.value.toUpperCase() }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Numero do cartao</Label>
                  <Input id="cardNumber" placeholder="0000 0000 0000 0000" maxLength={19} value={cardForm.number}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim()
                      setCardForm(f => ({ ...f, number: v }))
                    }} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="expiryMonth">Mes</Label>
                    <Input id="expiryMonth" placeholder="MM" maxLength={2} value={cardForm.expiryMonth}
                      onChange={(e) => setCardForm(f => ({ ...f, expiryMonth: e.target.value.replace(/\D/g, '') }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiryYear">Ano</Label>
                    <Input id="expiryYear" placeholder="AAAA" maxLength={4} value={cardForm.expiryYear}
                      onChange={(e) => setCardForm(f => ({ ...f, expiryYear: e.target.value.replace(/\D/g, '') }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ccv">CVV</Label>
                    <Input id="ccv" placeholder="000" maxLength={4} type="password" value={cardForm.ccv}
                      onChange={(e) => setCardForm(f => ({ ...f, ccv: e.target.value.replace(/\D/g, '') }))} />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <p className="text-sm font-medium text-muted-foreground">Dados do titular</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="cardEmail">Email</Label>
                    <Input id="cardEmail" type="email" placeholder="email@exemplo.com" value={cardForm.email}
                      onChange={(e) => setCardForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
                    <Input id="cpfCnpj" placeholder="000.000.000-00" value={cardForm.cpfCnpj}
                      onChange={(e) => setCardForm(f => ({ ...f, cpfCnpj: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" placeholder="(00) 00000-0000" value={cardForm.phone}
                      onChange={(e) => setCardForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">CEP</Label>
                    <Input id="postalCode" placeholder="00000-000" value={cardForm.postalCode}
                      onChange={(e) => setCardForm(f => ({ ...f, postalCode: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addressNumber">Numero do endereco</Label>
                    <Input id="addressNumber" placeholder="123" value={cardForm.addressNumber}
                      onChange={(e) => setCardForm(f => ({ ...f, addressNumber: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">Total mensal:</span>
                  <span className="text-lg font-bold">R$ 34,90</span>
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Processando pagamento...' : 'Pagar R$ 34,90'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main view
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Sua Assinatura</CardTitle></CardHeader>
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

      {showPayment && (
        <Card>
          <CardHeader><CardTitle>Assinar RevendaGestor</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-lg font-bold">R$ 34,90 <span className="text-sm font-normal text-muted-foreground">/ mes</span></p>
              <p className="text-sm text-muted-foreground mt-1">
                Acesso completo a todas as funcionalidades do RevendaGestor
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => setPaymentStep('pix-cpf')} disabled={createMutation.isPending} className="flex-1">
                <QrCode className="h-4 w-4 mr-2" /> Pagar com PIX
              </Button>
              <Button variant="outline" onClick={() => setPaymentStep('card')} disabled={createMutation.isPending} className="flex-1">
                <CreditCard className="h-4 w-4 mr-2" /> Pagar com Cartao
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {data?.planStatus === 'ACTIVE' && data.subscription && (
        <Card>
          <CardContent className="pt-6">
            <Button variant="destructive" size="sm" onClick={handleCancelar} disabled={cancelMutation.isPending}>
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

// === PIX QR CODE CARD ===
function PixQrCodeCard({ pixData, copied, onCopy }: { pixData: PixData; copied: boolean; onCopy: (payload: string) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" /> Pagamento via PIX
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-lg border-2 border-dashed border-muted">
            <img
              src={`data:image/png;base64,${pixData.encodedImage}`}
              alt="QR Code PIX"
              width={250}
              height={250}
              className="mx-auto"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Ou copie o codigo PIX:</Label>
          <div className="flex gap-2">
            <Input value={pixData.payload} readOnly className="font-mono text-xs" />
            <Button variant="outline" size="icon" onClick={() => onCopy(pixData.payload)} className="shrink-0">
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            Abra o app do seu banco, escaneie o QR Code ou cole o codigo acima.
            Apos o pagamento, sua assinatura sera ativada automaticamente.
          </p>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Valor: <strong>R$ 34,90</strong> | Assinatura mensal
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
