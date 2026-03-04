import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { QueryProvider } from "@/providers/QueryProvider"
import { AuthProvider } from "@/providers/AuthProvider"
import { ValuesVisibilityProvider } from "@/providers/ValuesVisibilityProvider"
import { Toaster } from "sonner"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Meu Revendedor - Gestão de Vendas",
  description: "Sistema completo de gestão de vendas para revendedoras",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <QueryProvider>
          <AuthProvider>
            <ValuesVisibilityProvider>
              {children}
              <Toaster richColors position="bottom-right" />
            </ValuesVisibilityProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
