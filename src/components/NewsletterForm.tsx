'use client';

import { useState } from 'react';
import { Mail, Send, CheckCircle, Loader2 } from 'lucide-react';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
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
        body: JSON.stringify({ email, source: 'footer' })
      });

      const data = await response.json();

      if (response.ok || data.success) {
        setMessage(data.message || 'Subscrito com sucesso!');
        setStatus('success');
        setEmail('');
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

  return (
    <div className="space-y-2 sm:space-y-3">
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="relative">
          <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-[10px] sm:text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/60 focus:border-primary-500/60 transition"
            disabled={loading || status === 'success'}
          />
        </div>
        <button
          type="submit"
          disabled={loading || status === 'success'}
          className="w-full py-2 sm:py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg sm:rounded-xl transition flex items-center justify-center space-x-1.5 sm:space-x-2 text-[10px] sm:text-xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />
              <span>A subscrever...</span>
            </>
          ) : status === 'success' ? (
            <>
              <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>Subscrito!</span>
            </>
          ) : (
            <>
              <Send className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>Subscrever</span>
            </>
          )}
        </button>
      </form>

      {message && (
        <p className={`text-[9px] sm:text-[10px] ${
          status === 'success' ? 'text-emerald-400' : 'text-red-400'
        }`}>
          {message}
        </p>
      )}
    </div>
  );
}
