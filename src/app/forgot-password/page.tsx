'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao solicitar recuperação de senha');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao solicitar recuperação de senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-3 sm:px-4 py-6 sm:py-10 relative bg-slate-950">
      {/* Fundo */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: "url('/servidores-banner.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-primary-950/80" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-5 sm:mb-7">
          <BrandLogo logoHeightClass="h-7 sm:h-8" />
          <h1 className="text-lg sm:text-xl font-bold text-white mt-3 sm:mt-4">Recuperar Senha</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            {success ? 'Email enviado!' : 'Insira seu email para recuperar sua senha'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl">

          {error && (
            <div className="bg-red-500/15 border border-red-500/40 text-red-300 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl mb-4 sm:mb-5 text-[10px] sm:text-sm font-medium">
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center py-6 sm:py-8">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <h2 className="text-white font-semibold text-base sm:text-lg mb-2">Email Enviado!</h2>
              <p className="text-slate-400 text-xs sm:text-sm mb-4">
                Enviamos um link de recuperação para <strong>{email}</strong>. Verifique sua caixa de entrada.
              </p>
              <p className="text-slate-500 text-[10px] sm:text-xs">
                O link expira em 1 hora por segurança.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-[10px] sm:text-xs font-semibold text-slate-300 mb-1 sm:mb-1.5 uppercase tracking-wider">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-slate-800 border border-slate-600 rounded-lg sm:rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-primary-500/60 focus:border-primary-500/60 outline-none text-xs sm:text-sm transition"
                    placeholder="seu@email.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Botão */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-lg sm:rounded-xl transition shadow-lg hover:shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm mt-1.5 sm:mt-2"
              >
                {loading ? (
                  <span className="flex items-center space-x-1.5 sm:space-x-2">
                    <svg className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Enviando...</span>
                  </span>
                ) : (
                  <span>Enviar Link de Recuperação</span>
                )}
              </button>
            </form>
          )}

          <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-white/10 text-center">
            <Link
              href="/login"
              className="text-[10px] sm:text-xs text-slate-400 hover:text-slate-300 transition flex items-center justify-center space-x-1"
            >
              <ArrowLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>Voltar para Login</span>
            </Link>
          </div>
        </div>

        <div className="mt-4 sm:mt-5 text-center">
          <Link href="/" className="text-[10px] sm:text-xs text-slate-500 hover:text-slate-300 transition">
            ← Voltar para a página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
