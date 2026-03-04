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
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-background border-r">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b">
        <Link href="/" className="flex items-center gap-2">
          <ShoppingCart className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">RevendaGestor</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
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
    </aside>
  )
}
