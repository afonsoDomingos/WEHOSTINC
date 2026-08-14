'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import {
  Server, Lock, Mail, User, Eye, EyeOff,
  ArrowRight, ArrowLeft, CheckCircle2, Building2, Phone
} from 'lucide-react';
import { auth } from '@/lib/auth';
import BrandLogo from '@/components/BrandLogo';

const STEPS = [
  { id: 1, label: 'Conta', icon: User },
  { id: 2, label: 'Acesso', icon: Lock },
  { id: 3, label: 'Confirmar', icon: CheckCircle2 },
];

export default function RegisterPage() {
  const router = useRouter();

  // Step state
  const [step, setStep] = useState(1);

  // Form fields
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const emailParam = params.get('email');
      const nameParam = params.get('name');
      if (emailParam) setEmail(emailParam);
      if (nameParam) setName(nameParam);
    }
  }, []);

  // Step 1 validation
  const handleNext1 = async () => {
    setError('');
    const cleanEmail = email.trim().toLowerCase();
    if (!name.trim()) return setError('Por favor, insira o seu nome completo.');
    if (!cleanEmail || !cleanEmail.includes('@')) return setError('Insira um email válido.');

    try {
      setLoading(true);
      const users = await auth.fetchUsersAsync();
      const existing = users.find(u => u.email.trim().toLowerCase() === cleanEmail);
      if (existing) {
        return setError('Este endereço de e-mail já se encontra registado na plataforma WEHOSTHERE. Por favor, faça login.');
      }
      setStep(2);
    } catch {
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  // Step 2 validation
  const handleNext2 = () => {
    setError('');
    if (password.length < 6) return setError('A senha deve ter pelo menos 6 caracteres.');
    if (password !== confirmPassword) return setError('As senhas não coincidem.');
    setStep(3);
  };

  // Final submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!agreed) return setError('Aceite os Termos de Serviço para continuar.');
    setLoading(true);
    try {
      await auth.registerAsync(name, email, password);
      await auth.loginAsync(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      console.log('[Register] Iniciando registro com Google');
      const result = await signIn('google', { 
        callbackUrl: '/dashboard',
        redirect: false 
      });
      
      console.log('[Register] Resultado do signIn:', result);
      
      if (result?.error) {
        console.error('[Register] Erro no registro Google:', result.error);
        setError('Erro ao criar conta com Google. Por favor, tente novamente.');
        setGoogleLoading(false);
        return;
      }
      
      if (result?.ok) {
        console.log('[Register] Registro Google bem-sucedido, redirecionando para dashboard');
        setError('');
        router.push('/dashboard');
      } else {
        console.warn('[Register] Resultado inesperado do signIn:', result);
        setError('Erro inesperado ao criar conta. Por favor, tente novamente.');
        setGoogleLoading(false);
      }
    } catch (err) {
      console.error('[Register] Erro ao processar registro Google:', err);
      setError('Erro ao conectar com Google. Por favor, tente novamente.');
      setGoogleLoading(false);
    }
  };

  const passwordStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };
  const strength = passwordStrength();
  const strengthLabel = ['', 'Fraca', 'Razoável', 'Boa', 'Forte', 'Excelente'][strength];
  const strengthColor = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-400', 'bg-emerald-500'][strength];

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
        <div className="text-center mb-4 sm:mb-6">
          <BrandLogo logoHeightClass="h-7 sm:h-8" />
          <h1 className="text-base sm:text-lg font-bold text-white mt-2 sm:mt-3">Criar conta gratuita</h1>
          <p className="text-slate-400 text-[10px] sm:text-xs mt-1">Comece hoje a sua presença online</p>
        </div>

        {/* Steps Indicator */}
        <div className="flex items-center justify-center mb-4 sm:mb-5 gap-0">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <div key={s.id} className="flex items-center">
                <div className={`flex flex-col items-center`}>
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold border-2 transition-all duration-300 ${
                    isDone ? 'bg-primary-600 border-primary-500 text-white' :
                    isActive ? 'bg-white/10 border-primary-400 text-primary-300' :
                    'bg-white/5 border-white/15 text-slate-500'
                  }`}>
                    {isDone ? <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                  </div>
                  <span className={`text-[9px] sm:text-[10px] mt-1 font-semibold ${isActive ? 'text-primary-300' : isDone ? 'text-primary-400' : 'text-slate-500'}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 sm:w-10 h-0.5 mx-0.5 sm:mx-1 mb-3 sm:mb-4 rounded-full transition-all duration-300 ${step > s.id ? 'bg-primary-500' : 'bg-white/10'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-2xl">

          {error && (
            <div className="bg-red-500/15 border border-red-500/40 text-red-300 px-3 sm:px-3 py-2 rounded-lg sm:rounded-xl mb-3 sm:mb-4 text-[10px] sm:text-xs font-medium">
              {error}
            </div>
          )}

          {/* ───── PASSO 1 — Identificação ───── */}
          {step === 1 && (
            <div className="space-y-3 sm:space-y-4">
              {/* Google Register Button */}
              <button
                type="button"
                onClick={handleGoogleRegister}
                disabled={googleLoading}
                className="w-full py-2 sm:py-2.5 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-lg sm:rounded-xl transition border border-gray-300 flex items-center justify-center space-x-2 sm:space-x-2.5 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {googleLoading ? (
                  <span className="flex items-center space-x-1.5 sm:space-x-2">
                    <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>A conectar com Google...</span>
                  </span>
                ) : (
                  <>
                    <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Criar conta com Google</span>
                  </>
                )}
              </button>

              <div className="flex items-center">
                <div className="flex-1 border-t border-white/10"></div>
                <span className="px-2 sm:px-3 text-[10px] sm:text-xs text-slate-500">ou</span>
                <div className="flex-1 border-t border-white/10"></div>
              </div>
              <div>
                <label className="block text-[10px] sm:text-xs font-semibold text-slate-300 mb-1 sm:mb-1.5 uppercase tracking-wider">Nome Completo *</label>
                <div className="relative">
                  <User className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
                  <input
                    type="text" value={name} onChange={e => setName(e.target.value)}
                    className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-slate-800 border border-slate-600 rounded-lg sm:rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-primary-500/60 focus:border-primary-500/60 outline-none text-xs sm:text-sm transition autofill-dark"
                    placeholder="João Silva" autoFocus
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] sm:text-xs font-semibold text-slate-300 mb-1 sm:mb-1.5 uppercase tracking-wider">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-slate-800 border border-slate-600 rounded-lg sm:rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-primary-500/60 focus:border-primary-500/60 outline-none text-xs sm:text-sm transition autofill-dark"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] sm:text-xs font-semibold text-slate-300 mb-1 sm:mb-1.5 uppercase tracking-wider">Empresa <span className="text-slate-500 normal-case">(opcional)</span></label>
                <div className="relative">
                  <Building2 className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
                  <input
                    type="text" value={company} onChange={e => setCompany(e.target.value)}
                    className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-slate-800 border border-slate-600 rounded-lg sm:rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-primary-500/60 focus:border-primary-500/60 outline-none text-xs sm:text-sm transition autofill-dark"
                    placeholder="Nome da sua empresa"
                  />
                </div>
              </div>
              <button
                type="button" onClick={handleNext1}
                className="w-full py-2 sm:py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-bold rounded-lg sm:rounded-xl transition text-xs sm:text-sm flex items-center justify-center space-x-1.5 sm:space-x-2 mt-1.5 sm:mt-2"
              >
                <span>Continuar</span><ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>
          )}

          {/* ───── PASSO 2 — Senha ───── */}
          {step === 2 && (
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-[10px] sm:text-xs font-semibold text-slate-300 mb-1 sm:mb-1.5 uppercase tracking-wider">Senha *</label>
                <div className="relative">
                  <Lock className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full pl-8 sm:pl-9 pr-9 sm:pr-10 py-2 sm:py-2.5 bg-slate-800 border border-slate-600 rounded-lg sm:rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-primary-500/60 focus:border-primary-500/60 outline-none text-xs sm:text-sm transition autofill-dark"
                    placeholder="Mínimo 6 caracteres" autoFocus
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                    {showPassword ? <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                  </button>
                </div>
                {/* Força da senha */}
                {password.length > 0 && (
                  <div className="mt-1.5 sm:mt-2">
                    <div className="flex space-x-0.5 sm:space-x-1">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={`h-0.5 sm:h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor : 'bg-white/10'}`} />
                      ))}
                    </div>
                    <span className={`text-[9px] sm:text-[10px] font-semibold mt-0.5 sm:mt-1 block ${strengthColor.replace('bg-', 'text-')}`}>{strengthLabel}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[10px] sm:text-xs font-semibold text-slate-300 mb-1 sm:mb-1.5 uppercase tracking-wider">Confirmar Senha *</label>
                <div className="relative">
                  <Lock className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
                  <input
                    type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    className={`w-full pl-8 sm:pl-9 pr-9 sm:pr-10 py-2 sm:py-2.5 bg-slate-800 border rounded-lg sm:rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-primary-500/60 outline-none text-xs sm:text-sm transition autofill-dark ${
                      confirmPassword && confirmPassword !== password ? 'border-red-500/60' : 'border-slate-600 focus:border-primary-500/60'
                    }`}
                    placeholder="Repita a senha"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                    {showConfirm ? <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                  </button>
                </div>
                {confirmPassword && password === confirmPassword && (
                  <p className="text-emerald-400 text-[9px] sm:text-[10px] mt-0.5 sm:mt-1 flex items-center space-x-0.5 sm:space-x-1">
                    <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" /><span>Senhas coincidem</span>
                  </p>
                )}
              </div>
              <div className="flex space-x-1.5 sm:space-x-2 mt-1.5 sm:mt-2">
                <button type="button" onClick={() => setStep(1)} className="flex-1 py-2 sm:py-2.5 bg-white/8 border border-white/15 text-slate-300 font-semibold rounded-lg sm:rounded-xl text-xs sm:text-sm hover:bg-white/12 transition flex items-center justify-center space-x-0.5 sm:space-x-1">
                  <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" /><span>Voltar</span>
                </button>
                <button type="button" onClick={handleNext2} className="flex-2 flex-1 py-2 sm:py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-bold rounded-lg sm:rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-0.5 sm:space-x-1 transition">
                  <span>Continuar</span><ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ───── PASSO 3 — Confirmação ───── */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {/* Resumo */}
              <div className="bg-white/5 border border-white/10 rounded-lg sm:rounded-xl p-2.5 sm:p-3 space-y-1 sm:space-y-1.5">
                <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1.5 sm:mb-2">Resumo da conta</p>
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-400 shrink-0" />
                  <span className="text-xs sm:text-sm text-white font-medium truncate">{name}</span>
                </div>
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-400 shrink-0" />
                  <span className="text-xs sm:text-sm text-slate-300 truncate">{email}</span>
                </div>
                {company && (
                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                    <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-400 shrink-0" />
                    <span className="text-xs sm:text-sm text-slate-300 truncate">{company}</span>
                  </div>
                )}
              </div>

              {/* Termos */}
              <label className="flex items-start space-x-2 sm:space-x-2.5 cursor-pointer group">
                <input
                  type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                  className="mt-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded text-primary-600 border-slate-600 bg-slate-800 focus:ring-primary-500 shrink-0"
                />
                <span className="text-[10px] sm:text-xs text-slate-400 leading-relaxed">
                  Concordo com os{' '}
                  <Link href="#" className="text-primary-400 hover:text-primary-300 underline">Termos de Serviço</Link>
                  {' '}e a{' '}
                  <Link href="#" className="text-primary-400 hover:text-primary-300 underline">Política de Privacidade</Link>
                </span>
              </label>

              <div className="flex space-x-1.5 sm:space-x-2">
                <button type="button" onClick={() => setStep(2)} className="flex-1 py-2 sm:py-2.5 bg-white/8 border border-white/15 text-slate-300 font-semibold rounded-lg sm:rounded-xl text-xs sm:text-sm hover:bg-white/12 transition flex items-center justify-center space-x-0.5 sm:space-x-1">
                  <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" /><span>Voltar</span>
                </button>
                <button
                  type="submit" disabled={loading}
                  className="flex-1 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-600 to-primary-600 hover:from-emerald-500 hover:to-primary-500 text-white font-bold rounded-lg sm:rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-1 sm:space-x-1.5 transition disabled:opacity-50"
                >
                  {loading ? (
                    <svg className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  ) : (
                    <><CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /><span>Criar Conta</span></>
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-white/10 text-center">
            <p className="text-[10px] sm:text-xs text-slate-400">
              Já tem conta?{' '}
              <Link href="/login" className="text-primary-400 hover:text-primary-300 font-semibold transition">
                Entrar agora
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-3 sm:mt-4 text-center">
          <Link href="/" className="text-[10px] sm:text-xs text-slate-500 hover:text-slate-300 transition">
            ← Voltar para a página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
