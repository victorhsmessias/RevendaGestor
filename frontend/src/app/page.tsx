'use client'

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  CheckCircle2,
  Package,
  Users,
  Wallet,
  BarChart3,
  CreditCard,
  ArrowRight,
  Menu,
  X,
  LayoutDashboard,
  Truck,
  ShoppingCart,
  Receipt,
  Settings,
  LogOut,
  Eye,
  AlertTriangle,
  DollarSign
} from "lucide-react"
import { Accordion, AccordionItem } from "@/components/ui/accordion"
import { motion } from "motion/react"

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-[#1a3644] bg-[#0f2027]/95 backdrop-blur-md shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/">
            <Image src="/logo.png" alt="RevendaGestor" width={160} height={40} className="object-contain" priority />
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#funcionalidades" className="hover:text-emerald-400 transition-colors">
              Funcionalidades
            </a>
            <a href="#como-funciona" className="hover:text-emerald-400 transition-colors">
              Como Funciona
            </a>
            <a href="#preco" className="hover:text-emerald-400 transition-colors">
              Preco
            </a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">
              FAQ
            </a>
          </nav>
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-300 hover:text-emerald-400 transition-colors"
            >
              Ja tenho conta
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
            >
              Comece Gratis
            </Link>
          </div>
          <button
            className="md:hidden p-2 text-slate-300 hover:text-emerald-400 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[#1a3644] bg-[#0f2027] px-4 py-4 space-y-4 shadow-lg">
            <nav className="flex flex-col space-y-4 text-sm font-medium text-slate-300">
              <a href="#funcionalidades" className="hover:text-emerald-400 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                Funcionalidades
              </a>
              <a href="#como-funciona" className="hover:text-emerald-400 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                Como Funciona
              </a>
              <a href="#preco" className="hover:text-emerald-400 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                Preco
              </a>
              <a href="#faq" className="hover:text-emerald-400 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                FAQ
              </a>
            </nav>
            <div className="flex flex-col gap-2 pt-4 border-t border-[#1a3644]">
              <Link
                href="/login"
                className="w-full text-center rounded-md text-sm font-medium py-2.5 border border-slate-600 text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Ja tenho conta
              </Link>
              <Link
                href="/register"
                className="w-full text-center rounded-md text-sm font-medium py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Comece Gratis
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-32 md:pt-32 md:pb-40">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-100/50 via-slate-50 to-slate-50 -z-10" />
          <div className="container mx-auto px-4 md:px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl mx-auto space-y-8"
            >
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900">
                A gestao completa para a sua{" "}
                <span className="text-emerald-600">revenda de cosmeticos</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Natura, Boticario, Avon e muito mais. Controle seu estoque,
                clientes e pagamentos em um unico lugar. Simples, rapido e feito
                para voce lucrar mais.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link
                  href="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-md text-base font-medium h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                >
                  Comece Gratis Agora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-md text-base font-medium h-12 px-8 border border-slate-200 bg-white text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Ja tenho conta
                </Link>
              </div>
              <p className="text-sm text-slate-500 pt-4">
                7 dias gratis - Cancele quando quiser - Sem cartao de credito
              </p>
            </motion.div>

            {/* System Screenshot Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-16 max-w-5xl mx-auto relative"
            >
              <div className="rounded-2xl border border-slate-200/60 bg-white/50 backdrop-blur-sm p-2 shadow-2xl shadow-emerald-900/5">
                <div className="rounded-xl overflow-hidden border border-slate-100 bg-white shadow-sm">
                  {/* Browser Chrome */}
                  <div className="h-12 bg-slate-50 border-b border-slate-100 flex items-center px-4 gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                    </div>
                    <div className="ml-4 flex-1 flex justify-center">
                      <div className="h-6 w-64 bg-white rounded-md border border-slate-200 flex items-center px-3">
                        <div className="h-3 w-32 bg-slate-100 rounded-sm"></div>
                      </div>
                    </div>
                  </div>
                  {/* App Content Mockup */}
                  <div className="flex h-[400px] md:h-[600px] bg-slate-50/50">
                    {/* Sidebar */}
                    <div className="w-48 md:w-64 bg-[#0f2027] text-slate-300 flex-col hidden sm:flex">
                      <div className="p-6">
                        <div className="mb-8 flex justify-center">
                          <Image src="/logo.png" alt="RevendaGestor" width={140} height={60} className="object-contain" />
                        </div>
                        <nav className="space-y-1">
                          <div className="flex items-center gap-3 px-3 py-2.5 bg-emerald-500 text-white rounded-lg font-medium text-sm">
                            <LayoutDashboard className="h-4 w-4" /> Dashboard
                          </div>
                          <div className="flex items-center gap-3 px-3 py-2.5 hover:text-white transition-colors text-sm">
                            <Users className="h-4 w-4" /> Clientes
                          </div>
                          <div className="flex items-center gap-3 px-3 py-2.5 hover:text-white transition-colors text-sm">
                            <Truck className="h-4 w-4" /> Fornecedores
                          </div>
                          <div className="flex items-center gap-3 px-3 py-2.5 hover:text-white transition-colors text-sm">
                            <Package className="h-4 w-4" /> Produtos
                          </div>
                          <div className="flex items-center gap-3 px-3 py-2.5 hover:text-white transition-colors text-sm">
                            <ShoppingCart className="h-4 w-4" /> Vendas
                          </div>
                          <div className="flex items-center gap-3 px-3 py-2.5 hover:text-white transition-colors text-sm">
                            <DollarSign className="h-4 w-4" /> Pagamentos
                          </div>
                          <div className="flex items-center gap-3 px-3 py-2.5 hover:text-white transition-colors text-sm">
                            <BarChart3 className="h-4 w-4" /> Relatorios
                          </div>
                          <div className="flex items-center gap-3 px-3 py-2.5 hover:text-white transition-colors text-sm">
                            <Settings className="h-4 w-4" /> Configuracoes
                          </div>
                        </nav>
                      </div>
                      <div className="mt-auto p-6">
                        <div className="flex items-center gap-3 px-3 py-2.5 hover:text-white transition-colors text-sm cursor-pointer">
                          <LogOut className="h-4 w-4" /> Sair
                        </div>
                      </div>
                    </div>
                    {/* Main Content */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-[#f8fafc]">
                      {/* Topbar */}
                      <div className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 md:px-8 shrink-0">
                        <div className="flex items-center gap-2 text-slate-400"></div>
                        <div className="flex items-center gap-4">
                          <Eye className="h-5 w-5 text-slate-400" />
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                              MS
                            </div>
                            <div className="hidden md:block text-left">
                              <div className="text-sm font-semibold text-slate-900 leading-none">Maria Silva</div>
                              <div className="text-xs text-slate-500 mt-1">Maria Cosmeticos</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Dashboard Content */}
                      <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                        <div className="mb-8 text-left">
                          <h2 className="text-2xl font-bold text-slate-900">Dashboard de Desempenho Geral</h2>
                          <p className="text-slate-500 mt-1">Bem-vindo, Maria! Aqui esta o resumo da Maria Cosmeticos</p>
                        </div>

                        {/* Metrics Grid 1 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col text-left">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm text-slate-500 font-medium">Total de Vendas</span>
                              <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                                <DollarSign className="h-4 w-4" />
                              </div>
                            </div>
                            <div className="text-2xl font-bold text-slate-900 mb-1">R$ 1.250,00</div>
                            <div className="text-xs text-slate-400">12 venda(s) no mes</div>
                          </div>
                          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col text-left">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm text-slate-500 font-medium">Novos Clientes</span>
                              <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                                <Users className="h-4 w-4" />
                              </div>
                            </div>
                            <div className="text-2xl font-bold text-slate-900 mb-1">45</div>
                            <div className="text-xs text-slate-400">Clientes cadastrados</div>
                          </div>
                          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col text-left">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm text-slate-500 font-medium">Ticket Medio</span>
                              <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
                                <ShoppingCart className="h-4 w-4" />
                              </div>
                            </div>
                            <div className="text-2xl font-bold text-slate-900 mb-1">R$ 104,16</div>
                            <div className="text-xs text-slate-400">Valor medio por venda</div>
                          </div>
                          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col text-left">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm text-slate-500 font-medium">Pagamentos Pendentes</span>
                              <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                                <Receipt className="h-4 w-4" />
                              </div>
                            </div>
                            <div className="text-2xl font-bold text-red-600 mb-1">R$ 320,00</div>
                            <div className="text-xs text-red-500">2 conta(s) vencida(s)!</div>
                          </div>
                        </div>

                        {/* Metrics Grid 2 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col text-left">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm text-slate-500 font-medium">A Receber</span>
                              <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                                <Receipt className="h-4 w-4" />
                              </div>
                            </div>
                            <div className="text-2xl font-bold text-red-600 mb-1">R$ 450,00</div>
                            <div className="text-xs text-red-500">5 parcela(s) pendente(s)</div>
                          </div>
                          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col text-left">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm text-slate-500 font-medium">Produtos</span>
                              <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                                <Package className="h-4 w-4" />
                              </div>
                            </div>
                            <div className="text-2xl font-bold text-slate-900 mb-1">120</div>
                            <div className="text-xs text-slate-400">Produtos cadastrados</div>
                          </div>
                          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col text-left">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm text-slate-500 font-medium">Estoque Baixo</span>
                              <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                                <AlertTriangle className="h-4 w-4" />
                              </div>
                            </div>
                            <div className="text-2xl font-bold text-slate-900 mb-1">2</div>
                            <div className="text-xs text-slate-400">Itens precisando de reposicao</div>
                          </div>
                        </div>

                        {/* Action Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-8">
                          <div className="bg-emerald-500 text-white p-4 rounded-xl shadow-sm flex items-center justify-between cursor-pointer hover:bg-emerald-600 transition-colors">
                            <div className="flex items-center gap-3 font-medium">
                              <ShoppingCart className="h-5 w-5" /> Nova Venda
                            </div>
                            <ArrowRight className="h-4 w-4 opacity-70" />
                          </div>
                          <div className="bg-white text-slate-700 p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3 font-medium">
                              <Users className="h-5 w-5 text-slate-400" /> Clientes
                            </div>
                            <ArrowRight className="h-4 w-4 text-slate-300" />
                          </div>
                          <div className="bg-white text-slate-700 p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3 font-medium">
                              <Package className="h-5 w-5 text-slate-400" /> Produtos
                            </div>
                            <ArrowRight className="h-4 w-4 text-slate-300" />
                          </div>
                          <div className="bg-white text-slate-700 p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3 font-medium">
                              <Receipt className="h-5 w-5 text-slate-400" /> Contas a Pagar
                            </div>
                            <ArrowRight className="h-4 w-4 text-slate-300" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Funcionalidades */}
        <section id="funcionalidades" className="py-24 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Tudo que voce precisa para crescer
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Esqueca o caderninho. Automatize sua rotina e tenha o controle
                total do seu negocio na palma da mao.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: CheckCircle2,
                  title: "Gestao de Vendas",
                  desc: "Registre vendas em segundos, com baixa automatica no estoque e lancamento no financeiro.",
                },
                {
                  icon: Package,
                  title: "Controle de Estoque",
                  desc: "Saiba exatamente o que voce tem a pronta entrega e evite perder vendas.",
                },
                {
                  icon: Users,
                  title: "Cadastro de Clientes",
                  desc: "Historico de compras, preferencias e dados de contato sempre atualizados.",
                },
                {
                  icon: Wallet,
                  title: "Contas a Pagar/Receber",
                  desc: "Controle financeiro completo. Saiba quem te deve e quando voce precisa pagar seus boletos.",
                },
                {
                  icon: BarChart3,
                  title: "Relatorios Inteligentes",
                  desc: "Descubra quais produtos dao mais lucro e quem sao suas melhores clientes.",
                },
                {
                  icon: CreditCard,
                  title: "Pagamentos Parciais",
                  desc: "Sua cliente quer pagar em duas vezes? Registre pagamentos parciais com facilidade.",
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="h-full border border-slate-100 hover:border-emerald-100 hover:shadow-md transition-all duration-300 rounded-xl bg-white p-0">
                    <div className="flex flex-col space-y-1.5 p-6">
                      <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center mb-4 text-emerald-600">
                        <feature.icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-semibold leading-none tracking-tight">{feature.title}</h3>
                    </div>
                    <div className="p-6 pt-0">
                      <p className="text-slate-600 leading-relaxed">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Como Funciona */}
        <section id="como-funciona" className="py-24 bg-slate-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Como Funciona
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Comecar a usar o RevendaGestor e simples e rapido. Em poucos
                minutos voce ja esta no controle.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12 relative">
              <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-slate-200" />

              {[
                {
                  step: "1",
                  title: "Cadastre-se",
                  desc: "Crie sua conta em menos de 1 minuto. Nao pedimos cartao de credito.",
                },
                {
                  step: "2",
                  title: "Configure seus produtos",
                  desc: "Adicione seu estoque atual e cadastre suas clientes mais fieis.",
                },
                {
                  step: "3",
                  title: "Comece a vender",
                  desc: "Registre suas vendas, acompanhe os pagamentos e veja seu lucro crescer.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="relative flex flex-col items-center text-center space-y-4"
                >
                  <div className="w-24 h-24 rounded-full bg-white border-4 border-emerald-50 flex items-center justify-center text-3xl font-bold text-emerald-600 shadow-sm z-10">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 max-w-xs">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Preco */}
        <section id="preco" className="py-24 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto">
              <div className="overflow-hidden border border-emerald-100 shadow-xl shadow-emerald-900/5 rounded-xl">
                <div className="grid md:grid-cols-2">
                  <div className="p-8 md:p-12 bg-emerald-600 text-white flex flex-col justify-center">
                    <h3 className="text-2xl font-bold mb-2">Plano Unico</h3>
                    <p className="text-emerald-100 mb-8">
                      Tudo que voce precisa, sem complicacoes.
                    </p>
                    <div className="mb-6">
                      <span className="text-5xl font-extrabold">R$ 34,90</span>
                      <span className="text-emerald-200">/mes</span>
                    </div>
                    <Link
                      href="/register"
                      className="inline-flex items-center justify-center rounded-md h-12 text-base font-semibold bg-white text-emerald-700 hover:bg-emerald-50 transition-colors"
                    >
                      Comecar 7 dias gratis
                    </Link>
                    <p className="text-sm text-emerald-200 mt-4 text-center">
                      Cancele a qualquer momento.
                    </p>
                  </div>
                  <div className="p-8 md:p-12 bg-white">
                    <h4 className="text-lg font-semibold text-slate-900 mb-6">
                      O que esta incluso:
                    </h4>
                    <ul className="space-y-4">
                      {[
                        "Produtos e clientes ilimitados",
                        "Controle de estoque completo",
                        "Gestao de fiado e pagamentos parciais",
                        "Relatorios de lucro e vendas",
                        "Acesso pelo celular e computador",
                        "Suporte via WhatsApp",
                      ].map((item, i) => (
                        <li key={i} className="flex items-start">
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 mr-3 shrink-0" />
                          <span className="text-slate-600">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-24 bg-slate-50">
          <div className="container mx-auto px-4 md:px-6 max-w-3xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Perguntas Frequentes
              </h2>
            </div>
            <Accordion className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <AccordionItem title="Preciso de cartao de credito para testar?">
                Nao! Voce pode testar todas as funcionalidades do RevendaGestor
                por 7 dias totalmente gratis, sem precisar cadastrar nenhum
                cartao.
              </AccordionItem>
              <AccordionItem title="Funciona no celular?">
                Sim, o sistema e 100% responsivo e funciona perfeitamente no
                navegador do seu celular, tablet ou computador.
              </AccordionItem>
              <AccordionItem title="Posso cadastrar produtos de qualquer marca?">
                Com certeza. O sistema e flexivel e permite que voce cadastre
                produtos da Natura, Boticario, Avon, Eudora, Mary Kay, ou
                qualquer outra marca que voce revenda.
              </AccordionItem>
              <AccordionItem title="Como funciona o controle de pagamentos parciais?">
                Quando uma cliente compra fiado, voce pode registrar o valor
                total da divida. Conforme ela for pagando (ex: R$ 50 hoje, R$ 30
                semana que vem), voce registra esses pagamentos parciais e o
                sistema calcula automaticamente o saldo devedor.
              </AccordionItem>
            </Accordion>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2">
              <div className="mb-4">
                <Image src="/logo.png" alt="RevendaGestor" width={140} height={50} className="object-contain" />
              </div>
              <p className="max-w-xs text-sm leading-relaxed">
                Simplificando a vida das revendedoras de cosmeticos em todo o
                Brasil.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#funcionalidades" className="hover:text-emerald-400 transition-colors">
                    Funcionalidades
                  </a>
                </li>
                <li>
                  <a href="#preco" className="hover:text-emerald-400 transition-colors">
                    Precos
                  </a>
                </li>
                <li>
                  <Link href="/login" className="hover:text-emerald-400 transition-colors">
                    Entrar
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/termos" className="hover:text-emerald-400 transition-colors">
                    Termos de Uso
                  </Link>
                </li>
                <li>
                  <Link href="/privacidade" className="hover:text-emerald-400 transition-colors">
                    Privacidade
                  </Link>
                </li>
                <li>
                  <a href="mailto:meurevendedor10@gmail.com" className="hover:text-emerald-400 transition-colors">
                    Contato
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between text-sm">
            <p>
              &copy; {new Date().getFullYear()} RevendaGestor. Todos os direitos
              reservados.
            </p>
            <p className="mt-2 md:mt-0">Feito com amor para revendedoras.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
