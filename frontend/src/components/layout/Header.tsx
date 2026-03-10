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
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  LogOut, Menu, User, Eye, EyeOff, AlertTriangle, ChevronLeft, Shield,
  LayoutDashboard, Users, Package, ShoppingCart, Truck, Receipt, BarChart3, Settings,
} from 'lucide-react'
import { useValuesVisibility } from '@/providers/ValuesVisibilityProvider'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/fornecedores', label: 'Fornecedores', icon: Truck },
  { href: '/produtos', label: 'Produtos', icon: Package },
  { href: '/vendas', label: 'Vendas', icon: ShoppingCart },
  { href: '/contas-pagar', label: 'Pagamentos', icon: Receipt },
  { href: '/relatorios', label: 'Relatorios', icon: BarChart3 },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
]

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)

export function Header() {
  const { user, tenant, logout } = useAuth()
  const isAdmin = user && ADMIN_EMAILS.includes(user.email)
  const { visible, toggle } = useValuesVisibility()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [now] = useState(() => Date.now())

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

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
      const daysLeft = Math.ceil((new Date(tenant.trialEndsAt).getTime() - now) / (1000 * 60 * 60 * 24))
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
    <header className="flex items-center justify-between h-16 px-4 lg:px-6 border-b bg-card">
      {/* Mobile menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" showCloseButton={false} className="w-72 p-0 bg-sidebar border-sidebar-border">
          <div className="flex items-center justify-between h-16 px-4">
            <Image src="/logo.png" alt="RevendaGestor" width={150} height={34} className="object-contain" priority />
            <SheetClose asChild>
              <button className="flex items-center justify-center h-8 w-8 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </button>
            </SheetClose>
            <SheetTitle className="sr-only">Menu</SheetTitle>
          </div>
          <nav className="px-3 py-2 space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="px-3 py-4 mt-auto border-t border-sidebar-border space-y-1">
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-amber-500 hover:bg-sidebar-accent hover:text-amber-400 transition-all duration-200"
              >
                <Shield className="h-5 w-5" />
                Painel Admin
              </Link>
            )}
            <button
              onClick={() => { setMobileMenuOpen(false); logout() }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
            >
              <LogOut className="h-5 w-5" />
              Sair
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={toggle}
          title={visible ? 'Ocultar valores' : 'Mostrar valores'}
        >
          {visible ? <Eye className="h-4 w-4 text-muted-foreground" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
        </Button>

        <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 px-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="hidden lg:flex flex-col items-start">
                <span className="text-sm font-medium leading-none">{user?.name}</span>
                <span className="text-xs text-muted-foreground leading-none mt-0.5">{tenant?.name}</span>
              </div>
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
      </div>
    </header>
    </>
  )
}
