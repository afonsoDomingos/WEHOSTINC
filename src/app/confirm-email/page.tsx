'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, CheckCircle2, ArrowRight, RefreshCw, XCircle } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

export default function ConfirmEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const emailParam = params.get('email');
      const success = params.get('success');
      const error = params.get('error');

      if (emailParam) setEmail(emailParam);

      if (success === 'true') {
        setStatus('success');
        setMessage('Email confirmado com sucesso! Sua conta está ativa.');
      } else if (error) {
        setStatus('error');
        switch (error) {
          case 'missing_params':
            setMessage('Parâmetros inválidos. Tente novamente.');
            break;
          case 'invalid_code':
            setMessage('Código inválido. Verifique o código no email e tente novamente.');
            break;
          case 'confirmation_failed':
            setMessage('Erro ao confirmar email. Tente novamente.');
            break;
          case 'server_error':
            setMessage('Erro no servidor. Tente novamente mais tarde.');
            break;
          default:
            setMessage('Erro desconhecido. Tente novamente.');
        }
      }
    }
  }, []);

  const handleConfirmCode = async () => {
    if (!code || code.length !== 6) {
      setMessage('Por favor, insira o código de 6 dígitos.');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/auth/confirm-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        setMessage('Email confirmado com sucesso! Sua conta está ativa.');
      } else {
        setStatus('error');
        setMessage(data.error || 'Erro ao confirmar código.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Erro ao conectar com servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

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

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-3 sm:px-4 py-6 sm:py-10 relative bg-slate-950">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: "url('/servidores-banner.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-primary-950/80" />

        <div className="relative z-10 w-full max-w-sm">
          <div className="text-center mb-5 sm:mb-6">
            <BrandLogo logoHeightClass="h-7 sm:h-8" />
            <h1 className="text-lg sm:text-xl font-bold text-white mt-3 sm:mt-4">Email Confirmado!</h1>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl">
            <div className="flex justify-center mb-4 sm:mb-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-400" />
              </div>
            </div>

            <div className="text-center mb-4 sm:mb-5">
              <p className="text-slate-300 text-xs sm:text-sm mb-2">
                Sua conta foi ativada com sucesso!
              </p>
              <p className="text-slate-400 text-[10px] sm:text-xs">
                Agora você pode fazer login e acessar todas as funcionalidades da plataforma.
              </p>
            </div>

            <Link
              href="/login"
              className="w-full py-2 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg sm:rounded-xl transition flex items-center justify-center space-x-2 sm:space-x-2.5 text-xs sm:text-sm"
            >
              <span>Fazer Login</span>
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-3 sm:px-4 py-6 sm:py-10 relative bg-slate-950">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: "url('/servidores-banner.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-primary-950/80" />

        <div className="relative z-10 w-full max-w-sm">
          <div className="text-center mb-5 sm:mb-6">
            <BrandLogo logoHeightClass="h-7 sm:h-8" />
            <h1 className="text-lg sm:text-xl font-bold text-white mt-3 sm:mt-4">Erro na Confirmação</h1>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl">
            <div className="flex justify-center mb-4 sm:mb-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500/20 rounded-full flex items-center justify-center">
                <XCircle className="h-8 w-8 sm:h-10 sm:w-10 text-red-400" />
              </div>
            </div>

            <div className="text-center mb-4 sm:mb-5">
              <p className="text-red-300 text-xs sm:text-sm mb-2">
                {message}
              </p>
            </div>

            <button
              onClick={() => setStatus('pending')}
              className="w-full py-2 sm:py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg sm:rounded-xl transition border border-white/20 flex items-center justify-center space-x-2 sm:space-x-2.5 text-xs sm:text-sm mb-3 sm:mb-4"
            >
              Tentar novamente
            </button>

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

            <div className="text-center">
              <Link
                href="/login"
                className="text-primary-400 hover:text-primary-300 text-[10px] sm:text-xs font-semibold transition"
              >
                Voltar para login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-3 sm:px-4 py-6 sm:py-10 relative bg-slate-950">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: "url('/servidores-banner.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-primary-950/80" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-5 sm:mb-6">
          <BrandLogo logoHeightClass="h-7 sm:h-8" />
          <h1 className="text-lg sm:text-xl font-bold text-white mt-3 sm:mt-4">Confirme seu email</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Insira o código de 6 dígitos enviado para seu email</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl">
          <div className="flex justify-center mb-4 sm:mb-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary-600/20 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 sm:h-10 sm:w-10 text-primary-400" />
            </div>
          </div>

          <div className="text-center mb-4 sm:mb-5">
            <p className="text-slate-300 text-xs sm:text-sm mb-2">
              Enviamos um código para:
            </p>
            <p className="text-white font-semibold text-sm sm:text-base mb-3">
              {email || 'seu@email.com'}
            </p>
            <p className="text-slate-400 text-[10px] sm:text-xs">
              Insira o código de 6 dígitos abaixo para ativar sua conta.
            </p>
          </div>

          <div className="mb-4 sm:mb-5">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg sm:rounded-xl text-white text-center text-xl sm:text-2xl font-bold tracking-widest placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              maxLength={6}
            />
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

          <button
            onClick={handleConfirmCode}
            disabled={loading || code.length !== 6}
            className="w-full py-2 sm:py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg sm:rounded-xl transition flex items-center justify-center space-x-2 sm:space-x-2.5 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed mb-3 sm:mb-4"
          >
            {loading ? (
              <span className="flex items-center space-x-1.5 sm:space-x-2">
                <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                <span>A verificar...</span>
              </span>
            ) : (
              <span>Confirmar Código</span>
            )}
          </button>

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
                <span>Reenviar código</span>
              </>
            )}
          </button>

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
