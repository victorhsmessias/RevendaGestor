'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface ValuesVisibilityContextType {
  visible: boolean
  toggle: () => void
  mask: (value: string) => string
}

const ValuesVisibilityContext = createContext<ValuesVisibilityContextType | null>(null)

export function ValuesVisibilityProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('revendagestor-values-visible')
    if (saved === 'false') setVisible(false)
  }, [])

  const toggle = useCallback(() => {
    setVisible(prev => {
      const next = !prev
      localStorage.setItem('revendagestor-values-visible', String(next))
      return next
    })
  }, [])

  const mask = useCallback((value: string) => {
    if (visible) return value
    return '•••••'
  }, [visible])

  return (
    <ValuesVisibilityContext.Provider value={{ visible, toggle, mask }}>
      {children}
    </ValuesVisibilityContext.Provider>
  )
}

export function useValuesVisibility() {
  const context = useContext(ValuesVisibilityContext)
  if (!context) {
    throw new Error('useValuesVisibility deve ser usado dentro de ValuesVisibilityProvider')
  }
  return context
}
