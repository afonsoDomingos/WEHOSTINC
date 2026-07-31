'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Server, Lock, Mail, User, Eye, EyeOff,
  ArrowRight, ArrowLeft, CheckCircle2, Building2, Phone
} from 'lucide-react';
import { auth } from '@/lib/auth';

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

  // Step 1 validation
  const handleNext1 = () => {
    setError('');
    if (!name.trim()) return setError('Por favor, insira o seu nome completo.');
    if (!email.trim() || !email.includes('@')) return setError('Insira um email válido.');
    setStep(2);
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
      auth.register(name, email, password);
      auth.login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta.');
    } finally {
      setLoading(false);
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
    <div className="min-h-screen flex items-center justify-center px-4 py-10 relative bg-slate-950">
      {/* Fundo */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: "url('/servidores-banner.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-primary-950/80" />

      <div className="relative z-10 w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="bg-primary-600/20 border border-primary-500/40 p-2.5 rounded-xl">
              <Server className="h-6 w-6 text-primary-400" />
            </div>
            <span className="text-xl font-extrabold text-white tracking-tight">WEHOSTHERE</span>
          </Link>
          <h1 className="text-lg font-bold text-white mt-3">Criar conta gratuita</h1>
          <p className="text-slate-400 text-xs mt-1">Comece hoje a sua presença online</p>
        </div>

        {/* Steps Indicator */}
        <div className="flex items-center justify-center mb-5 gap-0">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <div key={s.id} className="flex items-center">
                <div className={`flex flex-col items-center`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                    isDone ? 'bg-primary-600 border-primary-500 text-white' :
                    isActive ? 'bg-white/10 border-primary-400 text-primary-300' :
                    'bg-white/5 border-white/15 text-slate-500'
                  }`}>
                    {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className={`text-[10px] mt-1 font-semibold ${isActive ? 'text-primary-300' : isDone ? 'text-primary-400' : 'text-slate-500'}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-10 h-0.5 mx-1 mb-4 rounded-full transition-all duration-300 ${step > s.id ? 'bg-primary-500' : 'bg-white/10'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">

          {error && (
            <div className="bg-red-500/15 border border-red-500/40 text-red-300 px-3 py-2 rounded-xl mb-4 text-xs font-medium">
              {error}
            </div>
          )}

          {/* ───── PASSO 1 — Identificação ───── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Nome Completo *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text" value={name} onChange={e => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-primary-500/60 focus:border-primary-500/60 outline-none text-sm transition autofill-dark"
                    placeholder="João Silva" autoFocus
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-primary-500/60 focus:border-primary-500/60 outline-none text-sm transition autofill-dark"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Empresa <span className="text-slate-500 normal-case">(opcional)</span></label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text" value={company} onChange={e => setCompany(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-primary-500/60 focus:border-primary-500/60 outline-none text-sm transition autofill-dark"
                    placeholder="Nome da sua empresa"
                  />
                </div>
              </div>
              <button
                type="button" onClick={handleNext1}
                className="w-full py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-bold rounded-xl transition text-sm flex items-center justify-center space-x-2 mt-2"
              >
                <span>Continuar</span><ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ───── PASSO 2 — Senha ───── */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Senha *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-primary-500/60 focus:border-primary-500/60 outline-none text-sm transition autofill-dark"
                    placeholder="Mínimo 6 caracteres" autoFocus
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {/* Força da senha */}
                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex space-x-1">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor : 'bg-white/10'}`} />
                      ))}
                    </div>
                    <span className={`text-[10px] font-semibold mt-1 block ${strengthColor.replace('bg-', 'text-')}`}>{strengthLabel}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Confirmar Senha *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    className={`w-full pl-9 pr-10 py-2.5 bg-slate-800 border rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-primary-500/60 outline-none text-sm transition autofill-dark ${
                      confirmPassword && confirmPassword !== password ? 'border-red-500/60' : 'border-slate-600 focus:border-primary-500/60'
                    }`}
                    placeholder="Repita a senha"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && password === confirmPassword && (
                  <p className="text-emerald-400 text-[10px] mt-1 flex items-center space-x-1">
                    <CheckCircle2 className="h-3 w-3" /><span>Senhas coincidem</span>
                  </p>
                )}
              </div>
              <div className="flex space-x-2 mt-2">
                <button type="button" onClick={() => setStep(1)} className="flex-1 py-2.5 bg-white/8 border border-white/15 text-slate-300 font-semibold rounded-xl text-sm hover:bg-white/12 transition flex items-center justify-center space-x-1">
                  <ArrowLeft className="h-4 w-4" /><span>Voltar</span>
                </button>
                <button type="button" onClick={handleNext2} className="flex-2 flex-1 py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm flex items-center justify-center space-x-1 transition">
                  <span>Continuar</span><ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ───── PASSO 3 — Confirmação ───── */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Resumo */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-1.5">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">Resumo da conta</p>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-primary-400 shrink-0" />
                  <span className="text-sm text-white font-medium truncate">{name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-primary-400 shrink-0" />
                  <span className="text-sm text-slate-300 truncate">{email}</span>
                </div>
                {company && (
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-primary-400 shrink-0" />
                    <span className="text-sm text-slate-300 truncate">{company}</span>
                  </div>
                )}
              </div>

              {/* Termos */}
              <label className="flex items-start space-x-2.5 cursor-pointer group">
                <input
                  type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-primary-600 border-slate-600 bg-slate-800 focus:ring-primary-500 shrink-0"
                />
                <span className="text-xs text-slate-400 leading-relaxed">
                  Concordo com os{' '}
                  <Link href="#" className="text-primary-400 hover:text-primary-300 underline">Termos de Serviço</Link>
                  {' '}e a{' '}
                  <Link href="#" className="text-primary-400 hover:text-primary-300 underline">Política de Privacidade</Link>
                </span>
              </label>

              <div className="flex space-x-2">
                <button type="button" onClick={() => setStep(2)} className="flex-1 py-2.5 bg-white/8 border border-white/15 text-slate-300 font-semibold rounded-xl text-sm hover:bg-white/12 transition flex items-center justify-center space-x-1">
                  <ArrowLeft className="h-4 w-4" /><span>Voltar</span>
                </button>
                <button
                  type="submit" disabled={loading}
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-primary-600 hover:from-emerald-500 hover:to-primary-500 text-white font-bold rounded-xl text-sm flex items-center justify-center space-x-1.5 transition disabled:opacity-50"
                >
                  {loading ? (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  ) : (
                    <><CheckCircle2 className="h-4 w-4" /><span>Criar Conta</span></>
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="mt-4 pt-3 border-t border-white/10 text-center">
            <p className="text-xs text-slate-400">
              Já tem conta?{' '}
              <Link href="/login" className="text-primary-400 hover:text-primary-300 font-semibold transition">
                Entrar agora
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 transition">
            ← Voltar para a página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
