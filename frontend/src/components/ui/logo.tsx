import { cn } from '@/lib/utils'
import Image from 'next/image'

interface LogoProps {
  className?: string
  showText?: boolean
  iconOnly?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'light' | 'dark'
}

export function Logo({ className, showText = true, iconOnly = false, size = 'md', variant = 'dark' }: LogoProps) {
  const imgSize = {
    sm: 28,
    md: 36,
    lg: 44,
  }

  const textSize = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  }

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <Image
        src="/logo-r.png"
        alt="RevendaGestor"
        width={imgSize[size]}
        height={imgSize[size]}
        className="object-contain"
        priority
      />
      {showText && !iconOnly && (
        <span className={cn(
          'font-bold tracking-tight',
          textSize[size],
          variant === 'light' ? 'text-white' : 'text-foreground'
        )}>
          <span>REVENDA</span>
          <span className="text-[#0ecdb9]">GESTOR</span>
        </span>
      )}
    </div>
  )
}
