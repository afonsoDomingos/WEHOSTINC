'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Server, Mail, LayoutDashboard, Settings, LogOut, 
  Plus, Globe, Database, TrendingUp, Users, CheckCircle, Sparkles, ArrowRight, Link2, Loader2, ShoppingBag,
  Activity, Cpu, HardDrive, Wifi, ShieldCheck, Zap, Star
} from 'lucide-react';
import { auth, User } from '@/lib/auth';
import { dataManager } from '@/lib/data';

import DashboardNav from '@/components/DashboardNav';
import PageLoader from '@/components/PageLoader';

function CircularProgress({ percentage, colorClass, size = 64, strokeWidth = 6 }: { percentage: number; colorClass: string; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200"
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className={`${colorClass} transition-all duration-1000 ease-out`}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-xs font-black text-gray-900">{Math.round(percentage)}%</span>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncingCounts, setIsSyncingCounts] = useState(true);
  const [siteCount, setSiteCount] = useState(0);
  const [emailCount, setEmailCount] = useState(0);
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageTotal, setStorageTotal] = useState(10);
  const [bandwidthUsed, setBandwidthUsed] = useState(2.4);
  const [bandwidthTotal, setBandwidthTotal] = useState(100);
  const [ramUsed, setRamUsed] = useState(0.5);
  const [ramTotal, setRamTotal] = useState(2);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (currentUser.role === 'admin' || currentUser.email.toLowerCase() === 'admin@wehosthere.com') {
      router.push('/admin');
      return;
    }
    setUser(currentUser);
    // Carregar contadores iniciais
    const userEmail = currentUser.email;
    const sites = dataManager.getSites(userEmail);
    const emails = dataManager.getEmails(userEmail);
    setSiteCount(sites.length);
    setEmailCount(emails.length);
    const usedStorage = sites.reduce((sum, s) => sum + (s.storage || 0), 0)
      + emails.reduce((sum, e) => sum + (e.storage || 0), 0);
    setStorageUsed(usedStorage);
    const planLimits: Record<string, { storage: number; bandwidth: number; ram: number }> = {
      basic: { storage: 10, bandwidth: 100, ram: 2 },
      pro: { storage: 50, bandwidth: 500, ram: 8 },
      enterprise: { storage: 200, bandwidth: 2000, ram: 16 }
    };
    const limits = planLimits[currentUser.plan] || planLimits.basic;
    setStorageTotal(limits.storage);
    setBandwidthTotal(limits.bandwidth);
    setRamTotal(limits.ram);

    const initialBw = Math.min(limits.bandwidth, Math.round((sites.length * 4.2 + emails.length * 0.5 + 1.2) * 10) / 10);
    const initialRam = Math.min(limits.ram, Math.round((0.4 + sites.length * 0.3) * 10) / 10);
    setBandwidthUsed(initialBw);
    setRamUsed(initialRam);
    setLoading(false);

    // Sincronizar assincronamente os contadores via API MongoDB
    Promise.all([
      dataManager.fetchSitesAsync(userEmail),
      dataManager.fetchEmailsAsync(userEmail)
    ]).then(([fetchedSites, fetchedEmails]) => {
      setSiteCount(fetchedSites.length);
      setEmailCount(fetchedEmails.length);
      const used = fetchedSites.reduce((sum, s) => sum + (s.storage || 0), 0)
        + fetchedEmails.reduce((sum, e) => sum + (e.storage || 0), 0);
      setStorageUsed(used);
      const bw = Math.min(limits.bandwidth, Math.round((fetchedSites.length * 4.2 + fetchedEmails.length * 0.5 + 1.2) * 10) / 10);
      const r = Math.min(limits.ram, Math.round((0.4 + fetchedSites.length * 0.3) * 10) / 10);
      setBandwidthUsed(bw);
      setRamUsed(r);
      setIsSyncingCounts(false);
    }).catch(() => {
      setIsSyncingCounts(false);
    });
  }, [router]);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      auth.logout();
      router.push('/');
    }, 400);
  };

  if (loading) {
    return <PageLoader text="A carregar o seu painel..." />;
  }

  if (!user) {
    return null;
  }

  const getPlanInfo = (plan: string) => {
    const plans = {
      basic: { name: 'Básico', color: 'bg-gray-100 text-gray-800' },
      pro: { name: 'Profissional', color: 'bg-primary-100 text-primary-800' },
      enterprise: { name: 'Empresarial', color: 'bg-purple-100 text-purple-800' }
    };
    return plans[plan as keyof typeof plans] || plans.basic;
  };

  const planInfo = getPlanInfo(user.plan);

  // Calcular dias até expiração do plano
  const getDaysUntilExpiry = () => {
    if (!user.dueDate || user.status !== 'active') return null;
    const today = new Date();
    const currentDay = today.getDate();
    const dueDay = user.dueDate;

    if (typeof dueDay !== 'number') return null;

    if (dueDay >= currentDay) {
      return dueDay - currentDay;
    } else {
      // Se o dia de vencimento já passou neste mês, calcula para o próximo mês
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
      const diffTime = nextMonth.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
  };

  const daysUntilExpiry = getDaysUntilExpiry();
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Responsivo do Dashboard */}
      <DashboardNav userName={user.name} userAvatar={user.avatar} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {/* Sidebar (Desktop) */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <nav className="space-y-1.5 sm:space-y-2">
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-primary-50 text-primary-700 rounded-lg font-medium text-xs sm:text-sm"
                >
                  <LayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/dashboard/sites"
                  className="flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium text-xs sm:text-sm"
                >
                  <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Meus Sites</span>
                </Link>
                <Link
                  href="/dashboard/orders"
                  className="flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium text-xs sm:text-sm"
                >
                  <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Meus Pedidos</span>
                </Link>
                <Link
                  href="/dashboard/systems"
                  className="flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium text-xs sm:text-sm"
                >
                  <Star className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Sistemas Prontos</span>
                </Link>
                <Link
                  href="/dashboard/submit-system"
                  className="flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium text-xs sm:text-sm"
                >
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Submeter Sistema</span>
                </Link>
                <Link
                  href="/site-quote"
                  className="flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-amber-50 text-amber-900 border border-amber-200/80 rounded-lg font-bold hover:bg-amber-100 transition text-xs sm:text-sm"
                >
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                  <span>Solicitar Site</span>
                </Link>
                <Link
                  href="/dashboard/email"
                  className="flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition font-medium text-xs sm:text-sm"
                >
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Email</span>
                </Link>
                <Link
                  href="/dashboard/billing"
                  className="flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition font-medium text-xs sm:text-sm"
                >
                  <Database className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Faturamento</span>
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition font-medium text-xs sm:text-sm"
                >
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Configurações</span>
                </Link>
              </nav>

              <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t">
                <div className="mb-3 sm:mb-4">
                  <p className="text-[10px] sm:text-sm text-gray-600 mb-1">Status da Conta</p>
                  <span className={`inline-block px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold ${
                    user.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {user.status === 'active' ? '✓ Conta Ativa' : '⏰ Sem Assinatura'}
                  </span>
                </div>

                {user.plan !== 'none' && user.status === 'active' && (
                  <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-[10px] sm:text-xs text-gray-600 mb-1">Plano Atual</p>
                    <p className="text-xs sm:text-sm font-bold text-gray-900">{planInfo.name}</p>
                    {user.dueDate && (
                      <div className="mt-1.5 sm:mt-2">
                        <p className="text-[10px] sm:text-xs text-gray-600">Vencimento</p>
                        <p className="text-[10px] sm:text-xs font-semibold text-gray-900">
                          Dia {user.dueDate} de cada mês
                          {daysUntilExpiry !== null && (
                            <span className="text-primary-600 ml-1">
                              ({daysUntilExpiry} {daysUntilExpiry === 1 ? 'dia' : 'dias'} restantes)
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <Link
                  href="/dashboard/billing"
                  className="block w-full py-1.5 sm:py-2 text-center bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-[10px] sm:text-sm font-semibold shadow-xs"
                >
                  Ver Faturamento & Planos →
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            {/* Banner de Status Pendente - Só mostra se não tiver plano ativo */}
            {user.status === 'pending' && user.plan === 'none' && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-xl sm:rounded-2xl p-3 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 text-amber-900 shadow-sm">
                <div className="flex items-start gap-2 sm:gap-3">
                  <span className="text-xl sm:text-2xl">⏳</span>
                  <div>
                    <h3 className="font-bold text-amber-950 text-xs sm:text-base">Conta Registada (Aguardando Escolha de Plano)</h3>
                    <p className="text-[10px] sm:text-sm text-amber-800 mt-0.5">
                      O seu registo foi concluído com sucesso! Para escolher o seu plano de hospedagem e serviços, aceda à área de Faturamento.
                    </p>
                  </div>
                </div>
                <Link
                  href="/dashboard/billing"
                  className="px-3 sm:px-4 py-2 sm:py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold whitespace-nowrap shadow transition"
                >
                  Escolher Plano em Faturamento →
                </Link>
              </div>
            )}

            {/* Banner de Aviso de Expiração */}
            {isExpiringSoon && (
              <div className="bg-orange-50 border-2 border-orange-300 rounded-xl sm:rounded-2xl p-3 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 text-orange-900 shadow-sm">
                <div className="flex items-start gap-2 sm:gap-3">
                  <span className="text-xl sm:text-2xl">⚠️</span>
                  <div>
                    <h3 className="font-bold text-orange-950 text-xs sm:text-base">Plano Próximo da Expiração</h3>
                    <p className="text-[10px] sm:text-sm text-orange-800 mt-0.5">
                      O seu plano {planInfo.name} expira em <strong>{daysUntilExpiry} dia{daysUntilExpiry === 1 ? '' : 's'}</strong>. Renove agora para evitar interrupções no serviço.
                    </p>
                  </div>
                </div>
                <Link
                  href="/dashboard/billing"
                  className="px-3 sm:px-4 py-2 sm:py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold whitespace-nowrap shadow transition"
                >
                  Renovar Plano →
                </Link>
              </div>
            )}

            {/* Welcome Card com Datacenter Background */}
            <div className="relative overflow-hidden bg-slate-950 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 text-white border border-slate-800">
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-35 mix-blend-luminosity"
                style={{ backgroundImage: "url('/datacenter-bg.jpg')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-primary-950/80" />

              <div className="relative z-10">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 text-white">Bem-vindo ao Painel, {user.name}!</h1>
                <p className="text-slate-300 mb-4 sm:mb-6 text-xs sm:text-sm md:text-base max-w-xl font-medium">
                  Sua conta está conectada à nossa infraestrutura Datacenter de alta performance em Moçambique.
                </p>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <Link
                  href="/site-quote"
                  className="flex items-center space-x-1.5 sm:space-x-2 bg-amber-400 hover:bg-amber-300 text-gray-900 px-3 sm:px-5 py-2 sm:py-3 rounded-lg font-extrabold text-[10px] sm:text-sm shadow-md transition"
                >
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-gray-900" />
                  <span>Solicitar Criação de Site</span>
                </Link>
                <Link
                  href="/dashboard/sites"
                  className="flex items-center space-x-1.5 sm:space-x-2 bg-white text-primary-600 px-3 sm:px-5 py-2 sm:py-3 rounded-lg hover:bg-gray-100 transition font-semibold text-[10px] sm:text-sm"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Novo Site</span>
                </Link>
                <Link
                  href="/dashboard/systems"
                  className="flex items-center space-x-1.5 sm:space-x-2 bg-purple-500 text-white px-3 sm:px-5 py-2 sm:py-3 rounded-lg hover:bg-purple-400 transition font-semibold text-[10px] sm:text-sm"
                >
                  <Star className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Sistemas Prontos</span>
                </Link>
                <Link
                  href="/dashboard/email"
                  className="flex items-center space-x-1.5 sm:space-x-2 bg-primary-500 text-white px-3 sm:px-5 py-2 sm:py-3 rounded-lg hover:bg-primary-400 transition font-semibold text-[10px] sm:text-sm"
                >
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Configurar Email</span>
                </Link>
                </div>
              </div>
            </div>

            {/* Seção de Saúde do Servidor & Recursos (estilo cPanel / Cloudflare) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-5 border-b border-gray-100 gap-2">
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-emerald-600" />
                    <span>Recursos & Saúde do Servidor</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Monitoramento em tempo real do seu plano e limites de hardware.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Servidor Online (99.98% Uptime)</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Latência: 12ms</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                {/* 1. Armazenamento SSD */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-1">
                      <HardDrive className="h-4 w-4 text-blue-600" />
                      <span>Disco SSD NVMe</span>
                    </div>
                    <p className="text-xl font-black text-gray-900">
                      {storageUsed} GB <span className="text-xs font-normal text-gray-500">/ {storageTotal} GB</span>
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">
                      {storageTotal - storageUsed} GB livres
                    </p>
                  </div>
                  <CircularProgress
                    percentage={Math.min(100, (storageUsed / storageTotal) * 100)}
                    colorClass="text-blue-600"
                    size={58}
                  />
                </div>

                {/* 2. Tráfego Mensal (Bandwidth) */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-1">
                      <Wifi className="h-4 w-4 text-purple-600" />
                      <span>Tráfego Mensal</span>
                    </div>
                    <p className="text-xl font-black text-gray-900">
                      {bandwidthUsed} GB <span className="text-xs font-normal text-gray-500">/ {bandwidthTotal} GB</span>
                    </p>
                    <p className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      <span>Tráfego ilimitado</span>
                    </p>
                  </div>
                  <CircularProgress
                    percentage={Math.min(100, (bandwidthUsed / bandwidthTotal) * 100)}
                    colorClass="text-purple-600"
                    size={58}
                  />
                </div>

                {/* 3. Memória RAM / vCPU */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-1">
                      <Cpu className="h-4 w-4 text-emerald-600" />
                      <span>RAM / vCPU Alocada</span>
                    </div>
                    <p className="text-xl font-black text-gray-900">
                      {ramUsed} GB <span className="text-xs font-normal text-gray-500">/ {ramTotal} GB RAM</span>
                    </p>
                    <p className="text-[10px] text-emerald-600 font-semibold mt-1">
                      ⚡ Desempenho Máximo
                    </p>
                  </div>
                  <CircularProgress
                    percentage={Math.min(100, (ramUsed / ramTotal) * 100)}
                    colorClass="text-emerald-600"
                    size={58}
                  />
                </div>
              </div>
            </div>

            {/* Stats RÁPIDOS */}
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              <Link href="/dashboard/sites" className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition cursor-pointer group border border-gray-100">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <Globe className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] sm:text-sm text-gray-500">Sites</span>
                </div>
                {isSyncingCounts ? (
                  <div className="flex items-center space-x-2 text-primary-600 my-1 font-semibold">
                    <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                    <span className="text-[10px] sm:text-sm text-gray-600">A processar...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{siteCount}</p>
                    <p className="text-[10px] sm:text-sm text-gray-600 mt-1">
                      {siteCount === 0 ? 'Nenhum site configurado' : `${siteCount} site${siteCount > 1 ? 's' : ''} activo${siteCount > 1 ? 's' : ''}`}
                    </p>
                  </>
                )}
              </Link>

              <Link href="/dashboard/email" className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition cursor-pointer group border border-gray-100">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] sm:text-sm text-gray-500">Emails</span>
                </div>
                {isSyncingCounts ? (
                  <div className="flex items-center space-x-2 text-primary-600 my-1 font-semibold">
                    <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                    <span className="text-[10px] sm:text-sm text-gray-600">A processar...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{emailCount}</p>
                    <p className="text-[10px] sm:text-sm text-gray-600 mt-1">
                      {emailCount === 0 ? 'Nenhuma conta configurada' : `${emailCount} conta${emailCount > 1 ? 's' : ''} activa${emailCount > 1 ? 's' : ''}`}
                    </p>
                  </>
                )}
              </Link>

              <Link href="/dashboard/billing" className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition cursor-pointer group border border-gray-100">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] sm:text-sm text-gray-500">Plano</span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{planInfo.name}</p>
                <p className="text-[10px] sm:text-sm text-emerald-600 font-semibold mt-1">✓ Status Ativo</p>
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Ações Rápidas</h2>
              <div className="grid sm:grid-cols-2 gap-2 sm:gap-4">
                <Link
                  href="/site-quote"
                  className="flex items-center space-x-2 sm:space-x-4 p-3 sm:p-4 border-2 border-amber-300 bg-amber-50/60 rounded-xl hover:bg-amber-100/70 transition"
                >
                  <div className="bg-amber-500 p-2 sm:p-3 rounded-lg text-white">
                    <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm">
                      <span>Solicitar Criação de Site</span>
                      <span className="text-[9px] sm:text-[10px] bg-amber-200 text-amber-900 font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full">Novo</span>
                    </h3>
                    <p className="text-[9px] sm:text-xs text-amber-900 font-medium mt-0.5">Catálogo com 18 tipos de sites • a partir de 12.000 MT</p>
                  </div>
                </Link>

                <Link
                  href="/dashboard/sites"
                  className="flex items-center space-x-2 sm:space-x-4 p-3 sm:p-4 border rounded-xl hover:bg-gray-50 transition"
                >
                  <div className="bg-primary-100 p-2 sm:p-3 rounded-lg">
                    <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-xs sm:text-sm">Adicionar Site</h3>
                    <p className="text-[10px] sm:text-sm text-gray-600">Configure um novo site</p>
                  </div>
                </Link>

                <Link
                  href="/dashboard/email"
                  className="flex items-center space-x-2 sm:space-x-4 p-3 sm:p-4 border rounded-xl hover:bg-gray-50 transition"
                >
                  <div className="bg-primary-100 p-2 sm:p-3 rounded-lg">
                    <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-xs sm:text-sm">Criar Email</h3>
                    <p className="text-[10px] sm:text-sm text-gray-600">Nova conta de email</p>
                  </div>
                </Link>

                <Link
                  href="/dashboard/billing"
                  className="flex items-center space-x-2 sm:space-x-4 p-3 sm:p-4 border rounded-xl hover:bg-gray-50 transition"
                >
                  <div className="bg-primary-100 p-2 sm:p-3 rounded-lg">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-xs sm:text-sm">Upgrade de Plano</h3>
                    <p className="text-[10px] sm:text-sm text-gray-600">Aumente seus recursos</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Atividade Recente</h2>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                  <div className="flex-1">
                    <p className="text-gray-900 text-xs sm:text-sm">Conta criada com sucesso</p>
                    <p className="text-[10px] sm:text-sm text-gray-600">Bem-vindo à WEHOSTHERE!</p>
                  </div>
                  <span className="text-[10px] sm:text-sm text-gray-500">Agora</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
