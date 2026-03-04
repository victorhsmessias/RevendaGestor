'use client'

import { useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { LogOut, Menu, User, ShoppingCart, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { useValuesVisibility } from '@/providers/ValuesVisibilityProvider'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Package,
  Truck,
  Receipt,
  BarChart3,
  Settings,
} from 'lucide-react'

const menuItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/fornecedores', label: 'Fornecedores', icon: Truck },
  { href: '/produtos', label: 'Produtos', icon: Package },
  { href: '/vendas', label: 'Vendas', icon: ShoppingCart },
  { href: '/contas-pagar', label: 'Contas a Pagar', icon: Receipt },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
]

export function Header() {
  const { user, tenant, logout } = useAuth()
  const { visible, toggle } = useValuesVisibility()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  // Banner de trial/pagamento
  const trialBanner = (() => {
    if (!tenant) return null

    if (tenant.planStatus === 'PAUSED') {
      return (
        <div className="bg-red-600 text-white text-center py-2 px-4 text-sm flex items-center justify-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span>Pagamento pendente.</span>
          <Link href="/configuracoes?tab=assinatura" className="underline font-medium">Regularizar agora</Link>
        </div>
      )
    }

    if (tenant.planStatus === 'TRIAL' && tenant.trialEndsAt) {
      const daysLeft = Math.ceil((new Date(tenant.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      if (daysLeft <= 5 && daysLeft > 0) {
        return (
          <div className="bg-amber-500 text-white text-center py-2 px-4 text-sm flex items-center justify-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Seu teste expira em {daysLeft} dia{daysLeft !== 1 ? 's' : ''}.</span>
            <Link href="/configuracoes?tab=assinatura" className="underline font-medium">Assinar agora</Link>
          </div>
        )
      }
      if (daysLeft <= 0) {
        return (
          <div className="bg-red-600 text-white text-center py-2 px-4 text-sm flex items-center justify-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Seu periodo de teste expirou.</span>
            <Link href="/configuracoes?tab=assinatura" className="underline font-medium">Assinar agora</Link>
          </div>
        )
      }
    }

    return null
  })()

  return (
    <>
    {trialBanner}
    <header className="flex items-center justify-between h-14 px-3 md:h-16 md:px-6 border-b bg-background">
      {/* Mobile menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex items-center h-14 px-6 border-b">
            <ShoppingCart className="h-6 w-6 text-primary" />
            <SheetTitle className="text-xl font-bold ml-2">Meu Revendedor</SheetTitle>
          </div>
          <nav className="px-3 py-4 space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Tenant name + eye toggle */}
      <div className="flex items-center gap-2 flex-1 justify-center md:justify-start md:flex-none">
        <p className="text-sm text-muted-foreground truncate">
          {tenant?.name}
        </p>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={toggle}
          title={visible ? 'Ocultar valores' : 'Mostrar valores'}
        >
          {visible ? <Eye className="h-4 w-4 text-muted-foreground" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
        </Button>
      </div>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 px-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden md:inline text-sm">{user?.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/configuracoes" className="flex items-center gap-2 cursor-pointer">
              <User className="h-4 w-4" />
              Minha conta
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={logout}
            className="flex items-center gap-2 cursor-pointer text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
    </>
  )
}
