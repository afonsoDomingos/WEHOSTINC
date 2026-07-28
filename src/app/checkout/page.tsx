'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Server, ShieldCheck, Lock, Check, CreditCard, 
  Smartphone, Bitcoin, ArrowLeft, CheckCircle2, AlertCircle
} from 'lucide-react';
import { hostingPlans, HostingPlan } from '@/lib/data';
import { auth } from '@/lib/auth';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planIdParam = searchParams.get('plan') || 'pro';

  const [selectedPlan, setSelectedPlan] = useState<HostingPlan>(
    hostingPlans.find(p => p.id === planIdParam) || hostingPlans[1]
  );

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [ddi, setDdi] = useState('+258');
  const [whatsapp, setWhatsapp] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'emola' | 'card' | 'crypto'>('mpesa');
  
  // Phone for M-Pesa / eMola push payment
  const [phonePayment, setPhonePayment] = useState('');
  // Card details
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const user = auth.getCurrentUser();
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, []);

  useEffect(() => {
    const plan = hostingPlans.find(p => p.id === planIdParam);
    if (plan) {
      setSelectedPlan(plan);
    }
  }, [planIdParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Por favor, informe seu nome completo.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Por favor, informe um e-mail válido.');
      return;
    }
    if (!whatsapp.trim()) {
      setError('Por favor, informe seu número do WhatsApp.');
      return;
    }

    setLoading(true);

    // Simulação de processamento de pagamento PUSH M-Pesa/eMola ou Cartão
    setTimeout(() => {
      try {
        const user = auth.getCurrentUser();
        if (user) {
          auth.updatePlan(user.id, selectedPlan.id as 'basic' | 'pro' | 'enterprise');
        } else {
          // Registrar usuário se não estiver logado
          const newUser = auth.register(name, email, '@Admin123@', selectedPlan.id as 'basic' | 'pro' | 'enterprise', 'active', 29);
          auth.login(newUser.email, '@Admin123@');
        }
        setLoading(false);
        setSuccess(true);
      } catch (err) {
        setLoading(false);
        setError(err instanceof Error ? err.message : 'Erro ao processar o pagamento.');
      }
    }, 2000);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pagamento Confirmado!</h2>
          <p className="text-gray-600 mb-6">
            Parabéns! Sua assinatura do <span className="font-semibold text-gray-900">{selectedPlan.name}</span> foi ativada com sucesso.
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left border border-gray-200 space-y-2 text-sm text-gray-700">
            <div className="flex justify-between">
              <span className="text-gray-500">Cliente:</span>
              <span className="font-semibold text-gray-900">{name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">E-mail:</span>
              <span className="font-medium text-gray-900">{email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Método:</span>
              <span className="font-semibold text-gray-900 uppercase">{paymentMethod}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-base">
              <span>Total Pago:</span>
              <span className="text-emerald-600">{selectedPlan.price.toLocaleString('pt-MZ')} MT</span>
            </div>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition flex items-center justify-center space-x-2"
          >
            <span>Ir para meu Painel</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Top Brand Accent Line (Inspired by reference) */}
      <div className="h-1.5 bg-red-600 w-full" />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-4xl mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Server className="h-7 w-7 text-primary-600" />
            <span className="text-2xl font-bold tracking-tight text-gray-900">WEHOSTHERE</span>
          </Link>
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Ambiente 100% Seguro</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Link>
          <span className="text-xs text-gray-400 font-mono">Checkout v2.0</span>
        </div>

        {/* Checkout Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-3 text-sm">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. Informações Pessoais */}
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-800 mb-1.5">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition text-gray-900 placeholder-gray-400 shadow-sm"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-1.5">
                  E-mail <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu e-mail"
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition text-gray-900 placeholder-gray-400 shadow-sm"
                />
              </div>

              <div>
                <label htmlFor="whatsapp" className="block text-sm font-semibold text-gray-800 mb-1.5">
                  Número do WhatsApp <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-2">
                  <select
                    value={ddi}
                    onChange={(e) => setDdi(e.target.value)}
                    className="px-3 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 font-semibold shadow-sm cursor-pointer"
                  >
                    <option value="+258">+258 (Moçambique)</option>
                    <option value="+244">+244 (Angola)</option>
                    <option value="+351">+351 (Portugal)</option>
                    <option value="+55">+55 (Brasil)</option>
                    <option value="+1">+1 (EUA)</option>
                  </select>
                  <input
                    id="whatsapp"
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Número sem DDI"
                    required
                    className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition text-gray-900 placeholder-gray-400 shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* 2. Método de Pagamento */}
            <div className="pt-4 border-t border-gray-200">
              <label className="block text-sm font-semibold text-gray-800 mb-3">
                Método de Pagamento
              </label>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* M-Pesa Option */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('mpesa')}
                  className={`p-3 border-2 rounded-xl text-center flex flex-col items-center justify-center transition cursor-pointer ${
                    paymentMethod === 'mpesa'
                      ? 'border-red-600 bg-red-50/50 shadow-sm ring-2 ring-red-500/20'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="w-10 h-7 bg-red-600 text-white rounded flex items-center justify-center font-bold text-xs mb-1">
                    M-Pesa
                  </div>
                  <span className="text-xs font-bold text-gray-800">M-Pesa</span>
                </button>

                {/* eMola Option */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('emola')}
                  className={`p-3 border-2 rounded-xl text-center flex flex-col items-center justify-center transition cursor-pointer ${
                    paymentMethod === 'emola'
                      ? 'border-orange-500 bg-orange-50/50 shadow-sm ring-2 ring-orange-500/20'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="w-10 h-7 bg-orange-500 text-white rounded flex items-center justify-center font-bold text-xs mb-1">
                    eMola
                  </div>
                  <span className="text-xs font-bold text-gray-800">eMola</span>
                </button>

                {/* Credit Card Option */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 border-2 rounded-xl text-center flex flex-col items-center justify-center transition cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-2 ring-blue-500/20'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-1 mb-1 text-blue-600">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-bold text-gray-800">Cartão de Crédito</span>
                </button>

                {/* Crypto Option */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('crypto')}
                  className={`p-3 border-2 rounded-xl text-center flex flex-col items-center justify-center transition cursor-pointer ${
                    paymentMethod === 'crypto'
                      ? 'border-amber-500 bg-amber-50/50 shadow-sm ring-2 ring-amber-500/20'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="w-7 h-7 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-xs mb-1">
                    <Bitcoin className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-gray-800">Criptomoeda</span>
                </button>
              </div>

              {/* Dynamic Payment Details Input */}
              {(paymentMethod === 'mpesa' || paymentMethod === 'emola') && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Número {paymentMethod === 'mpesa' ? 'M-Pesa' : 'eMola'} para cobrança
                  </label>
                  <div className="flex items-center space-x-2">
                    <Smartphone className="h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      value={phonePayment}
                      onChange={(e) => setPhonePayment(e.target.value)}
                      placeholder="84 123 4567 ou 85 123 4567"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Ao clicar em comprar, receberá um pedido PUSH no seu celular para introduzir o PIN do {paymentMethod === 'mpesa' ? 'M-Pesa' : 'eMola'}.
                  </p>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Número do Cartão</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="0000 0000 0000 0000"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Validade</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/AA"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">CVV</label>
                      <input
                        type="text"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        placeholder="123"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Resumo da Compra (Order Summary) */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Resumo da compra</h4>
              
              <div className="space-y-2 text-sm text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Plano {selectedPlan.name}</span>
                  <span className="font-bold text-gray-900">{selectedPlan.price.toLocaleString('pt-MZ')} MT</span>
                </div>
                <div className="text-xs text-gray-500">
                  {selectedPlan.features.sites === -1 ? 'Sites ilimitados' : `${selectedPlan.features.sites} site(s)`} • {selectedPlan.features.storage}GB Armazenamento
                </div>
                
                <div className="flex justify-between items-center border-t border-gray-200 pt-3 mt-3 font-bold text-base text-gray-900">
                  <span>Total</span>
                  <span className="text-xl text-gray-900">{selectedPlan.price.toLocaleString('pt-MZ')} MT</span>
                </div>
              </div>
            </div>

            {/* Security Guarantee Notice */}
            <div className="text-center text-xs text-gray-500 flex items-center justify-center space-x-2 pt-2">
              <Lock className="h-4 w-4 text-gray-400" />
              <span>Nós protegemos seus dados de pagamento com criptografia para garantir segurança em nível bancário.</span>
            </div>

            {/* CTA Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processando...</span>
                </>
              ) : (
                <span>Comprar agora</span>
              )}
            </button>

          </form>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
