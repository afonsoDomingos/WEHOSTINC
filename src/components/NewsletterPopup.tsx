'use client';

import { useState, useEffect } from 'react';
import { Mail, Sparkles, CheckCircle, Loader2 } from 'lucide-react';

export default function NewsletterPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    // Verificar se o usuário já fechou o popup anteriormente
    const dismissed = localStorage.getItem('newsletter_popup_dismissed');
    if (dismissed) return;

    // Verificar se o usuário já está subscrito
    const checkSubscription = async () => {
      try {
        const response = await fetch('/api/newsletter/subscribe?check=true');
        if (response.ok) {
          const data = await response.json();
          if (data.subscribed) {
            setIsSubscribed(true);
            localStorage.setItem('newsletter_popup_dismissed', 'true');
            return;
          }
        }
      } catch (error) {
        console.error('Erro ao verificar subscrição:', error);
      }
    };

    checkSubscription();

    // Mostrar popup após 10 segundos
    const timer = setTimeout(() => {
      if (!isSubscribed) {
        setIsVisible(true);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [isSubscribed]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setMessage('Por favor, insira um email válido.');
      setStatus('error');
      return;
    }

    setLoading(true);
    setMessage('');
    setStatus('idle');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'popup' })
      });

      const data = await response.json();

      if (response.ok || data.success) {
        setMessage(data.message || 'Subscrito com sucesso!');
        setStatus('success');
        setEmail('');
        setTimeout(() => {
          setIsVisible(false);
          localStorage.setItem('newsletter_popup_dismissed', 'true');
        }, 2000);
      } else {
        setMessage(data.error || 'Erro ao subscrever. Tente novamente.');
        setStatus('error');
      }
    } catch (err) {
      setMessage('Erro ao conectar. Tente novamente.');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible || isSubscribed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 to-indigo-600 shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Texto de incentivo */}
          <div className="flex items-center space-x-3 text-white">
            <div className="p-2 bg-white/20 rounded-full">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm sm:text-base">
                🎁 Receba ofertas exclusivas e novidades!
              </p>
              <p className="text-xs text-purple-100 hidden sm:block">
                Subscreva à newsletter WEHOSTHERE
              </p>
            </div>
          </div>

          {/* Formulário de subscrição */}
          {status === 'success' ? (
            <div className="flex items-center space-x-2 text-white">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold text-sm">Subscrito com sucesso!</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex items-center space-x-2 w-full sm:w-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu email"
                className="flex-1 sm:flex-none px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition text-sm"
                disabled={loading}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-white text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Subscrever</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {message && status !== 'idle' && (
          <p className={`text-xs mt-2 text-center ${
            status === 'success' ? 'text-emerald-200' : status === 'error' ? 'text-red-200' : 'text-white'
          }`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
