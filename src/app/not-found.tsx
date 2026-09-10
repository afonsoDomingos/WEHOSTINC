'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar para a página inicial após 3 segundos
    const timer = setTimeout(() => {
      router.push('/');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-400 blur-2xl opacity-20 rounded-full"></div>
            <div className="relative bg-blue-600 rounded-full p-6">
              <AlertCircle className="h-16 w-16 text-white" />
            </div>
          </div>
        </div>

        <h1 className="text-6xl font-black text-gray-900 mb-4">404</h1>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Página Não Encontrada
        </h2>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          A página que você está procurando não existe ou foi movida.
        </p>

        <div className="space-y-4">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <Home className="h-5 w-5" />
            <span>Voltar para a Página Inicial</span>
          </button>

          <p className="text-sm text-gray-500">
            Redirecionando automaticamente em <span id="countdown">3</span> segundos...
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
          let countdown = 3;
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