'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, type RegisterInput } from '@/lib/validators'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'
import { useState } from 'react'
import Image from 'next/image'
import { Mail } from 'lucide-react'

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', tenantName: '' },
  })

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true)
    try {
      await api.post('/auth/register', data)
      setRegisteredEmail(data.email)
      setRegistered(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar conta'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      await api.post('/auth/resend-verification', { email: registeredEmail })
      toast.success('Email de verificacao reenviado!')
    } catch {
      toast.error('Erro ao reenviar email. Tente novamente.')
    }
  }

  if (registered) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <Mail className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Verifique seu email</CardTitle>
          <CardDescription className="mt-2">
            Enviamos um link de verificacao para <strong>{registeredEmail}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Clique no link enviado para ativar sua conta. O link expira em 24 horas.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
            Nao recebeu? Verifique sua pasta de spam.
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button variant="outline" className="w-full" onClick={handleResend}>
            Reenviar email de verificacao
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            <Link href="/login" className="text-primary hover:underline">
              Voltar para o login
            </Link>
          </p>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Image src="/logo.png" alt="RevendaGestor" width={220} height={50} className="object-contain" priority />
        </div>
        <CardTitle className="text-2xl">Criar Conta</CardTitle>
        <CardDescription>Comece seu trial gratuito de 14 dias</CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Seu nome</Label>
            <Input
              id="name"
              placeholder="Maria Silva"
              {...form.register('name')}
              disabled={isLoading}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tenantName">Nome da sua loja</Label>
            <Input
              id="tenantName"
              placeholder="Cosmeticos da Maria"
              {...form.register('tenantName')}
              disabled={isLoading}
            />
            {form.formState.errors.tenantName && (
              <p className="text-sm text-destructive">{form.formState.errors.tenantName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              {...form.register('email')}
              disabled={isLoading}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimo 6 caracteres"
              {...form.register('password')}
              disabled={isLoading}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="mt-4 flex flex-col gap-4">
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
            {isLoading ? 'Criando conta...' : 'Criar conta gratis'}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Ja tem conta?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Faca login
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
