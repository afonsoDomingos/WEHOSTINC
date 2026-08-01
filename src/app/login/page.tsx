'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Server, Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import { auth } from '@/lib/auth';
import BrandLogo from '@/components/BrandLogo';
import PageLoader from '@/components/PageLoader';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const emailParam = params.get('email');
        if (emailParam) setEmail(emailParam);
      }
      // Sincroniza do servidor caso o utilizador tenha limpo os cookies/cache do navegador
      auth.fetchUsersAsync().catch((err) => {
        console.error('Erro ao buscar usuários:', err);
      });
    } catch (err) {
      console.error('Erro no useEffect:', err);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await auth.loginAsync(email, password);
      if (user.role === 'admin' || user.email === 'admin@wehosthere.com') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Erro de login:', err);
      setError(err instanceof Error ? err.message : 'Credenciais inválidas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-3 sm:px-4 py-6 sm:py-10 relative bg-slate-950"
    >
      {loading && <PageLoader text="A autenticar a sua conta com segurança..." />}
      {/* Fundo Datacenter */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{ backgroundImage: "url('/servidores-banner.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-primary-950/80" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-5 sm:mb-7">
          <BrandLogo logoHeightClass="h-7 sm:h-8" />
          <h1 className="text-lg sm:text-xl font-bold text-white mt-3 sm:mt-4">Bem-vindo de volta</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Acesse o seu painel de controlo</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl">

          {error && (
            <div className="bg-red-500/15 border border-red-500/40 text-red-300 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl mb-4 sm:mb-5 text-[10px] sm:text-sm font-medium flex items-center space-x-1.5 sm:space-x-2">
              <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

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
                  className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-slate-800 border border-slate-600 rounded-lg sm:rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-primary-500/60 focus:border-primary-500/60 outline-none text-xs sm:text-sm transition autofill-dark"
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                <label htmlFor="password" className="block text-[10px] sm:text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Senha
                </label>
                <Link href="#" className="text-[10px] sm:text-xs text-primary-400 hover:text-primary-300 transition">
                  Esqueceu?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-8 sm:pl-9 pr-9 sm:pr-10 py-2 sm:py-2.5 bg-slate-800 border border-slate-600 rounded-lg sm:rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-primary-500/60 focus:border-primary-500/60 outline-none text-xs sm:text-sm transition autofill-dark"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                </button>
              </div>
            </div>

            {/* Lembrar-me */}
            <label className="flex items-center space-x-1.5 sm:space-x-2 cursor-pointer">
              <input type="checkbox" className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded text-primary-600 border-slate-600 bg-slate-800 focus:ring-primary-500" />
              <span className="text-xs sm:text-sm text-slate-400">Manter sessão iniciada</span>
            </label>

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-bold rounded-lg sm:rounded-xl transition shadow-lg hover:shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm mt-1.5 sm:mt-2"
            >
              {loading ? (
                <span className="flex items-center space-x-1.5 sm:space-x-2">
                  <svg className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>A entrar...</span>
                </span>
              ) : (
                <>
                  <span>Entrar na conta</span>
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-white/10 text-center">
            <p className="text-xs sm:text-sm text-slate-400">
              Não tem conta?{' '}
              <Link href="/register" className="text-primary-400 hover:text-primary-300 font-semibold transition">
                Criar conta gratuita
              </Link>
            </p>
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
