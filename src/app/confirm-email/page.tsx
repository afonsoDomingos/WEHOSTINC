'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, CheckCircle2, ArrowRight, RefreshCw } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

export default function ConfirmEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const emailParam = params.get('email');
      if (emailParam) setEmail(emailParam);
    }
  }, []);

  const handleResendEmail = async () => {
    if (!email) return;
    setResending(true);
    setMessage('');
    try {
      // TODO: Implementar reenvio de email de confirmação
      await new Promise(resolve => setTimeout(resolve, 1500));
      setMessage('Email de confirmação reenviado com sucesso!');
    } catch (err) {
      setMessage('Erro ao reenviar email. Tente novamente.');
    } finally {
      setResending(false);
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
        <div className="text-center mb-5 sm:mb-6">
          <BrandLogo logoHeightClass="h-7 sm:h-8" />
          <h1 className="text-lg sm:text-xl font-bold text-white mt-3 sm:mt-4">Confirme seu email</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Enviamos um link de confirmação para o seu email</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl">
          {/* Icon */}
          <div className="flex justify-center mb-4 sm:mb-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary-600/20 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 sm:h-10 sm:w-10 text-primary-400" />
            </div>
          </div>

          {/* Mensagem */}
          <div className="text-center mb-4 sm:mb-5">
            <p className="text-slate-300 text-xs sm:text-sm mb-2">
              Enviamos um email de confirmação para:
            </p>
            <p className="text-white font-semibold text-sm sm:text-base mb-3">
              {email || 'seu@email.com'}
            </p>
            <p className="text-slate-400 text-[10px] sm:text-xs">
              Clique no link no email para ativar sua conta. Se não receber o email em alguns minutos, verifique sua caixa de spam.
            </p>
          </div>

          {message && (
            <div className={`mb-4 sm:mb-5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-medium ${
              message.includes('sucesso') 
                ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300' 
                : 'bg-red-500/15 border border-red-500/40 text-red-300'
            }`}>
              {message}
            </div>
          )}

          {/* Reenviar */}
          <button
            onClick={handleResendEmail}
            disabled={resending}
            className="w-full py-2 sm:py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg sm:rounded-xl transition border border-white/20 flex items-center justify-center space-x-2 sm:space-x-2.5 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed mb-3 sm:mb-4"
          >
            {resending ? (
              <span className="flex items-center space-x-1.5 sm:space-x-2">
                <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                <span>A enviar...</span>
              </span>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Reenviar email</span>
              </>
            )}
          </button>

          {/* Já confirmou */}
          <div className="text-center">
            <Link
              href="/login"
              className="text-primary-400 hover:text-primary-300 text-[10px] sm:text-xs font-semibold transition flex items-center justify-center space-x-1.5 sm:space-x-2"
            >
              <span>Já confirmou seu email? Faça login</span>
              <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
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
