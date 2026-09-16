'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import PageLoader from '@/components/PageLoader';

export default function TestPaymentPage() {
  const { user, loading: authLoading } = useAdminGuard();
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('1');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'emola'>('mpesa');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  if (authLoading) {
    return <PageLoader text="A verificar permissões de administrador..." />;
  }

  if (!user) {
    return null;
  }

  const testPayment = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const apiUrl = paymentMethod === 'mpesa' 
        ? '/api/payments/mpesa/c2b'
        : '/api/payments/emola/c2b';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msisdn: phone,
          amount: parseFloat(amount),
          reference: `TEST_REF_${Date.now().toString().slice(-6)}`,
          thirdPartyReference: `TEST_ORDER_${Date.now().toString().slice(-6)}`,
          clientName: clientName || user.name || 'Administrador',
          clientEmail: clientEmail || user.email || 'admin@wehosthere.com',
          serviceName: 'Teste de Pagamento (Diagnóstico)'
        })
      });

      const data = await response.json();
      setResult(data);

      if (!response.ok) {
        setError(data.error || 'Erro ao processar pagamento');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-sky-50 py-8 sm:py-12 px-4">
      <div className="max-w-3xl mx-auto">
        
        {/* Top Header com link de retorno ao Admin */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center space-x-2 text-xs sm:text-sm font-bold text-gray-700 hover:text-primary-600 bg-white hover:bg-gray-50 border border-gray-200 px-3.5 py-2 rounded-xl transition shadow-xs cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar ao Painel Admin</span>
          </Link>

          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Ferramenta Interna de Diagnóstico</span>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
            Teste de Gateway de Pagamento
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 max-w-lg mx-auto">
            Ambiente de verificação técnica dos webhooks e processamento M-Pesa e e-Mola.
          </p>
        </div>
        
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8 mb-6">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-5">Dados do Pagamento</h2>
          
          {/* Seleção do Método */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
              Método de Pagamento
            </label>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('mpesa')}
                className={`flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                  paymentMethod === 'mpesa'
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="w-16 h-12 relative mb-2">
                  <Image
                    src="/mpesa.jpg"
                    alt="M-Pesa"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className={`text-xs sm:text-sm font-bold ${
                  paymentMethod === 'mpesa' ? 'text-emerald-800' : 'text-gray-700'
                }`}>
                  M-Pesa (Vodacom)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('emola')}
                className={`flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                  paymentMethod === 'emola'
                    ? 'border-orange-500 bg-orange-50/50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="w-16 h-12 relative mb-2">
                  <Image
                    src="/emola.png"
                    alt="eMola"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className={`text-xs sm:text-sm font-bold ${
                  paymentMethod === 'emola' ? 'text-orange-800' : 'text-gray-700'
                }`}>
                  e-Mola (Movitel)
                </span>
              </button>
            </div>
          </div>

          {/* Valor e Telefone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Valor (MZN)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white text-sm font-medium transition"
                placeholder="1"
                min="1"
                step="0.01"
              />
              <p className="text-[11px] text-gray-500 mt-1">Valor de teste sugerido: 1 a 10 MZN</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Número de Telemóvel
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white text-sm font-medium transition"
                placeholder="84XXXXXXX ou 86XXXXXXX"
              />
              <p className="text-[11px] text-gray-500 mt-1">Número que receberá o prompt PIN no telemóvel</p>
            </div>
          </div>

          {/* Nome e Email do Cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Nome do Cliente
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white text-sm font-medium transition"
                placeholder="Ex: Carlos Mondlane"
              />
              <p className="text-[11px] text-gray-500 mt-1">Identificação do titular no registo</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Email do Cliente
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white text-sm font-medium transition"
                placeholder="Ex: cliente@empresa.co.mz"
              />
              <p className="text-[11px] text-gray-500 mt-1">Email para envio do comprovativo</p>
            </div>
          </div>

          {/* Botão de Disparo */}
          <button
            type="button"
            onClick={testPayment}
            disabled={loading || !phone || !amount}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white py-3.5 rounded-xl font-bold transition-all text-sm shadow-md hover:shadow-lg disabled:from-gray-400 disabled:to-gray-400 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? 'A contactar gateway...' : 'Enviar Pedido de Pagamento'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-5 mb-6 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-900 font-bold text-xs sm:text-sm">Erro no Processamento</h3>
              <p className="text-red-700 text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Resposta da Gateway
            </h3>
            <div className="bg-gray-50 rounded-xl p-3.5 overflow-x-auto border border-gray-100">
              <pre className="text-xs text-gray-800 whitespace-pre-wrap break-all font-mono">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
