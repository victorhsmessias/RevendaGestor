'use client'

import Link from "next/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"

export default function PrivacidadePage() {
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
            <Link href="/termos" className="hover:text-emerald-400 transition-colors">
              Termos de Uso
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-12 max-w-4xl">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-100">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8">Politica de Privacidade</h1>

          <div className="prose prose-slate max-w-none space-y-6 text-slate-600 leading-relaxed">
            <p><strong>Ultima atualizacao:</strong> {new Date().toLocaleDateString('pt-BR')}</p>

            <p>A sua privacidade e importante para nos. Esta Politica de Privacidade explica como o RevendaGestor coleta, usa, compartilha e protege as suas informacoes pessoais e os dados do seu negocio, em conformidade com a Lei Geral de Protecao de Dados (LGPD - Lei n 13.709/2018).</p>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">1. Dados Coletados</h2>
              <p>Coletamos os seguintes tipos de informacoes:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Dados de Cadastro:</strong> Nome, e-mail, CPF/CNPJ e senha (criptografada).</li>
                <li><strong>Dados do Negocio:</strong> Informacoes sobre seus clientes (nome, telefone, endereco), produtos, estoque e registros de vendas.</li>
                <li><strong>Dados de Pagamento:</strong> Informacoes necessarias para processar sua assinatura.</li>
                <li><strong>Dados de Uso:</strong> Informacoes sobre como voce interage com o sistema (logs de acesso, endereco IP, tipo de navegador).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">2. Finalidade do Uso dos Dados</h2>
              <p>Utilizamos seus dados para:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Fornecer, operar e manter o sistema RevendaGestor.</li>
                <li>Processar pagamentos e gerenciar sua assinatura.</li>
                <li>Enviar comunicacoes importantes sobre o servico, atualizacoes e suporte.</li>
                <li>Melhorar a seguranca e prevenir fraudes.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">3. Compartilhamento com Terceiros</h2>
              <p>Nao vendemos seus dados. Compartilhamos informacoes apenas com parceiros essenciais para o funcionamento do servico:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Asaas:</strong> Para processamento seguro de pagamentos e emissao de cobrancas.</li>
                <li><strong>Resend:</strong> Para o envio de e-mails transacionais (recuperacao de senha, avisos do sistema).</li>
                <li><strong>Supabase:</strong> Para armazenamento seguro dos dados em nuvem.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">4. Armazenamento e Seguranca</h2>
              <p>Seus dados sao armazenados de forma segura na infraestrutura em nuvem do Supabase, que utiliza padroes rigorosos de seguranca e criptografia. Implementamos medidas tecnicas e organizacionais para proteger suas informacoes contra acesso nao autorizado, alteracao ou destruicao.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">5. Direitos do Titular (LGPD)</h2>
              <p>Voce tem o direito de:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Acessar os dados que temos sobre voce.</li>
                <li>Solicitar a correcao de dados incompletos ou incorretos.</li>
                <li>Solicitar a exclusao da sua conta e dos seus dados (sujeito a obrigacoes legais de retencao).</li>
                <li>Solicitar a portabilidade dos seus dados.</li>
                <li>Revogar o consentimento para o processamento de dados.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">6. Cookies</h2>
              <p>Utilizamos cookies essenciais para manter sua sessao ativa e garantir o funcionamento correto do sistema. Nao utilizamos cookies de rastreamento de terceiros para fins de publicidade direcionada.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">7. Retencao de Dados</h2>
              <p>Manteremos seus dados enquanto sua conta estiver ativa. Se voce cancelar sua assinatura, seus dados poderao ser retidos por um periodo adicional para cumprimento de obrigacoes legais, resolucao de disputas ou conforme exigido por lei.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">8. Contato do Encarregado (DPO)</h2>
              <p>Para exercer seus direitos ou tirar duvidas sobre esta Politica de Privacidade, entre em contato com nosso Encarregado de Protecao de Dados atraves do e-mail: <a href="mailto:meurevendedor10@gmail.com" className="text-emerald-600 hover:underline">meurevendedor10@gmail.com</a>.</p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
