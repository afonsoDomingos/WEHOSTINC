'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function TestPaymentPage() {
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('1');
  const [clientName, setClientName] = useState('Teste Admin');
  const [clientEmail, setClientEmail] = useState('admin@wehosthere.com');
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'emola'>('mpesa');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

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
          clientName: clientName || 'Teste Admin',
          clientEmail: clientEmail || 'admin@wehosthere.com',
          serviceName: 'Teste de Pagamento'
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 sm:py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2">Teste de Pagamento</h1>
          <p className="text-sm sm:text-base text-gray-600">Teste a integração de pagamentos com valores baixos</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-6 text-gray-900">Configuração do Teste</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Método de Pagamento
            </label>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button
                onClick={() => setPaymentMethod('mpesa')}
                className={`flex flex-col items-center justify-center p-4 sm:p-6 rounded-xl border-2 transition-all ${
                  paymentMethod === 'mpesa'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 mb-2 relative">
                  <Image
                    src="/mpesa.jpg"
                    alt="M-Pesa"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className={`text-sm sm:text-base font-medium ${
                  paymentMethod === 'mpesa' ? 'text-green-700' : 'text-gray-700'
                }`}>
                  M-Pesa
                </span>
              </button>
              <button
                onClick={() => setPaymentMethod('emola')}
                className={`flex flex-col items-center justify-center p-4 sm:p-6 rounded-xl border-2 transition-all ${
                  paymentMethod === 'emola'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 mb-2 relative">
                  <Image
                    src="/emola.png"
                    alt="eMola"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className={`text-sm sm:text-base font-medium ${
                  paymentMethod === 'emola' ? 'text-orange-700' : 'text-gray-700'
                }`}>
                  eMola
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Valor (MZN)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="1"
                min="1"
                step="0.01"
              />
              <p className="text-xs sm:text-sm text-gray-500 mt-1.5">Use valores baixos (1-10 MZN)</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Número de Telefone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="+258 84 123 4567"
              />
              <p className="text-xs sm:text-sm text-gray-500 mt-1.5">Formato: +258 XX XXX XXXX</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nome do Cliente (para Painel e Kivora)
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Ex: João da Silva"
              />
              <p className="text-xs sm:text-sm text-gray-500 mt-1.5">Aparece na coluna CLIENTE da Kivora e Admin</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email do Cliente (para Painel e Kivora)
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Ex: joao@exemplo.com"
              />
              <p className="text-xs sm:text-sm text-gray-500 mt-1.5">Aparece na coluna EMAIL da Kivora e Admin</p>
            </div>
          </div>

          <button
            onClick={testPayment}
            disabled={loading || !phone || !amount}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 sm:py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-400 transition-all text-sm sm:text-base shadow-md hover:shadow-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processando...
              </span>
            ) : 'Testar Pagamento'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6 mb-6">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-red-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-red-800 font-semibold mb-1 text-sm sm:text-base">Erro</h3>
                <p className="text-red-700 text-xs sm:text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
            <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900">Resultado do Teste</h3>
            <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs sm:text-xs text-gray-800 whitespace-pre-wrap break-all">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
          <h3 className="text-blue-800 font-semibold mb-3 text-sm sm:text-base flex items-center">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Instruções
          </h3>
          <ul className="text-blue-700 text-xs sm:text-sm space-y-2">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Use valores baixos (1-10 MZN) para teste</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Confirme o pagamento no seu telemóvel</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Verifique os eventos do webhook no painel admin</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Verifique se o pedido foi atualizado automaticamente</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
