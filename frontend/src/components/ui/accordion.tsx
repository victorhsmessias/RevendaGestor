'use client'

import * as React from "react"
import { ChevronDown } from "lucide-react"

const Accordion = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  return <div className={`space-y-2 ${className}`}>{children}</div>
}

const AccordionItem = ({ children, title }: { children: React.ReactNode, title: string }) => {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <div className="border-b border-slate-200 last:border-0">
      <button
        type="button"
        className="flex w-full items-center justify-between py-4 text-left font-medium transition-all hover:text-emerald-600"
        onClick={() => setIsOpen(!isOpen)}
      >
        {title}
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="pb-4 text-sm text-slate-500 leading-relaxed">
          {children}
        </div>
      )}
    </div>
  )
}

export { Accordion, AccordionItem }
