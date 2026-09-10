'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Home, AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar para a página inicial após 5 segundos em caso de erro
    const timer = setTimeout(() => {
      router.push('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center px-4">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-red-400 blur-2xl opacity-20 rounded-full"></div>
            <div className="relative bg-red-600 rounded-full p-6">
              <AlertTriangle className="h-16 w-16 text-white" />
            </div>
          </div>
        </div>

        <h1 className="text-4xl font-black text-gray-900 mb-4">
          Ocorreu um Erro
        </h1>
        
        <p className="text-gray-600 mb-6 leading-relaxed">
          Desculpe, algo inesperado aconteceu. Estamos trabalhando para resolver o problema.
        </p>

        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 text-left">
          <p className="text-sm text-red-800 font-mono break-all">
            {error.message || 'Erro desconhecido'}
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => reset()}
            className="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 mr-4"
          >
            <span>Tentar Novamente</span>
          </button>

          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <Home className="h-5 w-5" />
            <span>Voltar para a Página Inicial</span>
          </button>

          <p className="text-sm text-gray-500">
            Redirecionando automaticamente em <span id="countdown">5</span> segundos...
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-xs text-gray-400">
            WEHOSTHERE - Hospedagem de Sites & Email Profissional em Moçambique
          </p>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          let countdown = 5;
          const countdownElement = document.getElementById('countdown');
          const interval = setInterval(() => {
            countdown--;
            if (countdownElement) {
              countdownElement.textContent = countdown;
            }
            if (countdown <= 0) {
              clearInterval(interval);
            }
          }, 1000);
        `
      }} />
    </div>
  );
}