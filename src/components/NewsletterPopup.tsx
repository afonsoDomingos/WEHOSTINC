'use client';

import { useState, useEffect } from 'react';
import { X, Mail, Sparkles, CheckCircle, Loader2 } from 'lucide-react';

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

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('newsletter_popup_dismissed', 'true');
  };

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
          handleClose();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-300 relative">
        {/* Botão de fechar */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
          title="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Cabeçalho */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full mb-4 shadow-lg">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Não perca as novidades!
          </h3>
          <p className="text-sm text-gray-600">
            Subscreva à nossa newsletter e receba ofertas exclusivas e atualizações sobre a WEHOSTHERE.
          </p>
        </div>

        {/* Formulário */}
        {status === 'success' ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="text-emerald-700 font-semibold text-lg mb-2">
              Subscrito com sucesso!
            </p>
            <p className="text-gray-600 text-sm">
              {message}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="space-y-4">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu melhor email"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                disabled={loading}
                required
              />
            </div>

            {message && status !== 'idle' && (
              <p className={`text-sm ${
                status === 'success' ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-200 transition flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>A subscrever...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  <span>Quero receber novidades</span>
                </>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleClose}
                className="text-sm text-gray-500 hover:text-gray-700 transition"
              >
                Não, obrigado
              </button>
            </div>
          </form>
        )}

        {/* Rodapé */}
        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            🎁 Subscritores recebem ofertas exclusivas e descontos especiais
          </p>
        </div>
      </div>
    </div>
  );
}
