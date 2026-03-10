'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Truck,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { useAuth } from '@/providers/AuthProvider'

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)

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

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const isAdmin = user && ADMIN_EMAILS.includes(user.email)

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-sidebar">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-5">
        <Link href="/dashboard">
          <Image
            src="/logo.png"
            alt="RevendaGestor"
            width={180}
            height={40}
            className="object-contain"
            priority
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/25'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Admin + Logout */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-amber-500 hover:bg-sidebar-accent hover:text-amber-400 transition-all duration-200"
          >
            <Shield className="h-5 w-5" />
            Painel Admin
          </Link>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
        >
          <LogOut className="h-5 w-5" />
          Sair
        </button>
      </div>
    </aside>
  )
}
