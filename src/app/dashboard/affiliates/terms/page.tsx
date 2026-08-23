'use client';

import Link from 'next/link';
import { 
  FileText, ArrowLeft, CheckCircle2, XCircle, AlertTriangle, 
  DollarSign, Users, Shield, Clock
} from 'lucide-react';

export default function AffiliateTermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/dashboard/affiliates" className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition font-medium">
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Termos e Condições</h1>
                <p className="text-gray-600">Programa de Afiliados WEHOSTHERE</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <FileText className="h-6 w-6 text-primary-600" />
              <span>1. Aceitação dos Termos</span>
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Ao se registrar no Programa de Afiliados da WEHOSTHERE, você concorda com estes termos e condições. 
              Se você não concordar com qualquer parte destes termos, não deve participar do programa.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <DollarSign className="h-6 w-6 text-emerald-600" />
              <span>2. Comissões</span>
            </h2>
            <div className="space-y-3 text-gray-600">
              <p><strong className="text-gray-900">Taxa de Comissão:</strong> 30% do valor de cada venda qualificada.</p>
              <p><strong className="text-gray-900">Venda Qualificada:</strong> Venda realizada por um cliente que clicou no seu link de afiliado e completou a compra dentro de 30 dias.</p>
              <p><strong className="text-gray-900">Pagamento de Comissão:</strong> As comissões são pagas após aprovação da venda pela administração.</p>
              <p><strong className="text-gray-900">Mínimo para Saque:</strong> O saldo mínimo para solicitar saque é de 1.000 MZN.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Users className="h-6 w-6 text-blue-600" />
              <span>3. Responsabilidades do Afiliado</span>
            </h2>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">Promover os serviços da WEHOSTHERE de forma ética e profissional.</p>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">Não fazer declarações falsas ou enganosas sobre os serviços.</p>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">Respeitar as leis e regulamentações locais de marketing.</p>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">Manter suas informações de contato atualizadas.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <XCircle className="h-6 w-6 text-red-600" />
              <span>4. Práticas Proibidas</span>
            </h2>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">Uso de spam, email não solicitado ou marketing agressivo.</p>
              </div>
              <div className="flex items-start space-x-3">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">Criação de contas falsas ou uso de métodos próprios para gerar comissões.</p>
              </div>
              <div className="flex items-start space-x-3">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">Oferecer incentivos ou descontos não autorizados.</p>
              </div>
              <div className="flex items-start space-x-3">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">Usar o link de afiliado em sites com conteúdo ilegal ou ofensivo.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Shield className="h-6 w-6 text-purple-600" />
              <span>5. Proteção de Dados</span>
            </h2>
            <p className="text-gray-600 leading-relaxed">
              O afiliado concorda em proteger as informações dos clientes e não compartilhar, vender ou usar indevidamente 
              quaisquer dados obtidos através do programa de afiliados.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Clock className="h-6 w-6 text-orange-600" />
              <span>6. Duração e Término</span>
            </h2>
            <div className="space-y-3 text-gray-600">
              <p><strong className="text-gray-900">Duração:</strong> O programa continua indefinidamente até que seja encerrado por qualquer uma das partes.</p>
              <p><strong className="text-gray-900">Término pela WEHOSTHERE:</strong> Reservamo-nos o direito de encerrar a participação de qualquer afiliado a qualquer momento, com ou sem motivo.</p>
              <p><strong className="text-gray-900">Término pelo Afiliado:</strong> Você pode encerrar sua participação a qualquer momento através do painel de afiliados.</p>
              <p><strong className="text-gray-900">Comissões Pendentes:</strong> Após o término, comissões pendentes podem ser pagas se as vendas forem aprovadas.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
              <span>7. Modificações</span>
            </h2>
            <p className="text-gray-600 leading-relaxed">
              A WEHOSTHERE reserva-se o direito de modificar estes termos a qualquer momento. 
              As modificações entram em vigor imediatamente após a publicação. 
              É responsabilidade do afiliado revisar estes termos periodicamente.
            </p>
          </section>

          <section className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6 border border-primary-200">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Contato</h2>
            <p className="text-gray-600">
              Para dúvidas sobre estes termos ou o programa de afiliados, entre em contato:
            </p>
            <div className="mt-3 space-y-2">
              <p className="text-gray-700">📧 Email: info@wehosthere.com</p>
              <p className="text-gray-700">📱 WhatsApp: +258 84 833 5618</p>
            </div>
          </section>

          <section className="text-center text-sm text-gray-500 pt-6 border-t border-gray-200">
            <p>Última atualização: Agosto 2024</p>
            <p className="mt-2">© 2024 WEHOSTHERE. Todos os direitos reservados.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
