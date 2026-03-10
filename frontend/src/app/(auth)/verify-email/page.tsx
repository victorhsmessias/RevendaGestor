'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Link de verificacao invalido.')
      return
    }

    api.get(`/auth/verify-email?token=${token}`)
      .then((data: any) => {
        setStatus('success')
        setMessage(data.message || 'Email verificado com sucesso!')
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err instanceof Error ? err.message : 'Erro ao verificar email.')
      })
  }, [token])

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          {status === 'loading' && (
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
            </div>
          )}
          {status === 'success' && (
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
          )}
          {status === 'error' && (
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          )}
        </div>
        <CardTitle className="text-2xl">
          {status === 'loading' && 'Verificando...'}
          {status === 'success' && 'Email verificado!'}
          {status === 'error' && 'Erro na verificacao'}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
      {status !== 'loading' && (
        <CardFooter className="flex justify-center">
          <Button asChild className="w-full">
            <Link href="/login">Ir para o login</Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
            </div>
          </div>
          <CardTitle className="text-2xl">Verificando...</CardTitle>
        </CardHeader>
      </Card>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
