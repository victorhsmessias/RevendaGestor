'use client'

import Link from "next/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-[#1a3644] bg-[#0f2027]/95 backdrop-blur-md shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/">
            <Image src="/logo.png" alt="RevendaGestor" width={160} height={40} className="object-contain" priority />
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <Link href="/" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> Voltar ao Inicio
            </Link>
            <Link href="/privacidade" className="hover:text-emerald-400 transition-colors">
              Politica de Privacidade
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-12 max-w-4xl">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-100">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8">Termos de Uso</h1>

          <div className="prose prose-slate max-w-none space-y-6 text-slate-600 leading-relaxed">
            <p><strong>Ultima atualizacao:</strong> {new Date().toLocaleDateString('pt-BR')}</p>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">1. Aceitacao dos Termos</h2>
              <p>Ao se cadastrar e utilizar o RevendaGestor, voce concorda com estes Termos de Uso. Se voce nao concordar com qualquer parte destes termos, nao devera utilizar nosso sistema.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">2. Descricao do Servico</h2>
              <p>O RevendaGestor e um sistema de gestao de vendas em nuvem desenvolvido especificamente para revendedoras de cosmeticos (como Natura, Boticario, Avon, etc.). O sistema permite o controle de estoque, cadastro de clientes, registro de vendas e gestao financeira (contas a pagar e receber).</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">3. Cadastro e Responsabilidade do Usuario</h2>
              <p>Para utilizar o RevendaGestor, voce deve fornecer informacoes precisas e completas. Voce e o unico responsavel por manter a confidencialidade da sua senha e por todas as atividades que ocorrerem em sua conta. Os dados inseridos no sistema sao de sua inteira responsabilidade.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">4. Planos e Pagamento</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Periodo de Teste:</strong> Oferecemos 7 dias de teste gratis para novos usuarios, sem a necessidade de cadastrar cartao de credito.</li>
                <li><strong>Assinatura:</strong> Apos o periodo de teste, o acesso continuo ao sistema requer a assinatura do plano mensal no valor de R$ 34,90/mes.</li>
                <li><strong>Processamento:</strong> Os pagamentos sao processados de forma segura atraves da plataforma Asaas.</li>
                <li><strong>Cancelamento:</strong> Voce pode cancelar sua assinatura a qualquer momento. O cancelamento interrompera cobrancas futuras, mas nao reembolsara valores ja pagos pelo periodo vigente.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">5. Uso Aceitavel</h2>
              <p>Voce concorda em nao usar o RevendaGestor para fins ilegais ou nao autorizados. E proibido tentar violar a seguranca do sistema, acessar dados de outros usuarios ou utilizar o servico de forma que possa danificar, desativar ou sobrecarregar nossos servidores.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">6. Propriedade Intelectual</h2>
              <p>Todo o conteudo, design, codigo e identidade visual do RevendaGestor sao de propriedade exclusiva de seus desenvolvedores. O uso do sistema nao lhe concede nenhum direito de propriedade intelectual sobre o software.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">7. Limitacao de Responsabilidade</h2>
              <p>O RevendaGestor e fornecido &quot;no estado em que se encontra&quot;. Nao garantimos que o servico sera ininterrupto ou livre de erros. Em nenhuma circunstancia seremos responsaveis por lucros cessantes, perda de dados ou danos indiretos decorrentes do uso ou da incapacidade de usar o sistema.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">8. Rescisao</h2>
              <p>Podemos suspender ou encerrar seu acesso ao RevendaGestor a qualquer momento, com ou sem aviso previo, caso voce viole estes Termos de Uso.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">9. Alteracoes nos Termos</h2>
              <p>Reservamo-nos o direito de modificar estes termos a qualquer momento. Alteracoes significativas serao notificadas atraves do sistema ou por e-mail. O uso continuo do servico apos as alteracoes constitui aceitacao dos novos termos.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">10. Contato</h2>
              <p>Se voce tiver alguma duvida sobre estes Termos de Uso, entre em contato conosco atraves do e-mail: <a href="mailto:meurevendedor10@gmail.com" className="text-emerald-600 hover:underline">meurevendedor10@gmail.com</a>.</p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
