'use client';

import { useState } from 'react';

export default function TestPaymentPage() {
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('1');
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
          thirdPartyReference: `TEST_ORDER_${Date.now().toString().slice(-6)}`
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
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Teste de Pagamento Kivora</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Configuração do Teste</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de Pagamento
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setPaymentMethod('mpesa')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  paymentMethod === 'mpesa'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                M-Pesa
              </button>
              <button
                onClick={() => setPaymentMethod('emola')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  paymentMethod === 'emola'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                eMola
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor (MZN)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="1"
              min="1"
              step="0.01"
            />
            <p className="text-sm text-gray-500 mt-1">Use valores baixos para teste (ex: 1 MZN)</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Telefone
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="+258 84 123 4567"
            />
            <p className="text-sm text-gray-500 mt-1">Formato: +258 XX XXX XXXX</p>
          </div>

          <button
            onClick={testPayment}
            disabled={loading || !phone || !amount}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Processando...' : 'Testar Pagamento'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold mb-2">Erro</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Resultado do Teste</h3>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
          <h3 className="text-yellow-800 font-semibold mb-2">Instruções</h3>
          <ul className="text-yellow-700 list-disc list-inside space-y-1">
            <li>Use valores baixos (1-10 MZN) para teste</li>
            <li>Confirme o pagamento no seu telemóvel</li>
            <li>Verifique os logs do Vercel para eventos do webhook</li>
            <li>Verifique se o pedido foi atualizado automaticamente</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
