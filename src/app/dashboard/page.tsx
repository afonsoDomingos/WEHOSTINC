'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Server, Mail, LayoutDashboard, Settings, LogOut, 
  Plus, Globe, Database, TrendingUp, Users, CheckCircle, Sparkles, ArrowRight, Link2
} from 'lucide-react';
import { auth, User } from '@/lib/auth';
import { dataManager } from '@/lib/data';

import DashboardNav from '@/components/DashboardNav';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [siteCount, setSiteCount] = useState(0);
  const [emailCount, setEmailCount] = useState(0);
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageTotal, setStorageTotal] = useState(10);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    // Carregar contadores reais
    const sites = dataManager.getSites();
    const emails = dataManager.getEmails();
    setSiteCount(sites.length);
    setEmailCount(emails.length);
    const usedStorage = sites.reduce((sum, s) => sum + (s.storage || 0), 0)
      + emails.reduce((sum, e) => sum + (e.storage || 0), 0);
    setStorageUsed(usedStorage);
    // limite de armazenamento consoante plano
    const planLimits: Record<string, number> = { basic: 10, pro: 50, enterprise: 200 };
    setStorageTotal(planLimits[currentUser.plan] || 10);
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    auth.logout();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Responsivo do Dashboard */}
      <DashboardNav userName={user.name} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar (Desktop) */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <nav className="space-y-2">
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-3 px-4 py-3 bg-primary-50 text-primary-700 rounded-lg font-medium"
                >
                  <LayoutDashboard className="h-5 w-5" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/dashboard/sites"
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition font-medium"
                >
                  <Globe className="h-5 w-5" />
                  <span>Meus Sites</span>
                </Link>
                <Link
                  href="/site-quote"
                  className="flex items-center space-x-3 px-4 py-3 bg-amber-50 text-amber-900 border border-amber-200/80 rounded-lg font-bold hover:bg-amber-100 transition"
                >
                  <Sparkles className="h-5 w-5 text-amber-600" />
                  <span>Solicitar Site</span>
                </Link>
                <Link
                  href="/dashboard/email"
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition font-medium"
                >
                  <Mail className="h-5 w-5" />
                  <span>Email</span>
                </Link>
                <Link
                  href="/dashboard/billing"
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition font-medium"
                >
                  <Database className="h-5 w-5" />
                  <span>Faturamento</span>
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition font-medium"
                >
                  <Settings className="h-5 w-5" />
                  <span>Configurações</span>
                </Link>
              </nav>

              <div className="mt-8 pt-6 border-t">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">Plano Atual</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${planInfo.color}`}>
                    {planInfo.name}
                  </span>
                </div>
                <Link
                  href="/dashboard/billing"
                  className="block w-full py-2 text-center bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm"
                >
                  Fazer Upgrade
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Welcome Card com Datacenter Background */}
            <div className="relative overflow-hidden bg-slate-950 rounded-2xl shadow-xl p-6 sm:p-8 text-white border border-slate-800">
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-35 mix-blend-luminosity"
                style={{ backgroundImage: "url('/datacenter-bg.jpg')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-primary-950/80" />

              <div className="relative z-10">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-white">Bem-vindo ao Painel, {user.name}!</h1>
                <p className="text-slate-300 mb-6 text-sm sm:text-base max-w-xl font-medium">
                  Sua conta está conectada à nossa infraestrutura Datacenter de alta performance em Moçambique.
                </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/site-quote"
                  className="flex items-center space-x-2 bg-amber-400 hover:bg-amber-300 text-gray-900 px-5 py-3 rounded-lg font-extrabold text-sm shadow-md transition"
                >
                  <Sparkles className="h-5 w-5 text-gray-900" />
                  <span>Solicitar Criação de Site</span>
                </Link>
                <Link
                  href="/dashboard/sites"
                  className="flex items-center space-x-2 bg-white text-primary-600 px-5 py-3 rounded-lg hover:bg-gray-100 transition font-semibold text-sm"
                >
                  <Plus className="h-5 w-5" />
                  <span>Novo Site</span>
                </Link>
                <Link
                  href="/dashboard/email"
                  className="flex items-center space-x-2 bg-primary-500 text-white px-5 py-3 rounded-lg hover:bg-primary-400 transition font-semibold text-sm"
                >
                  <Mail className="h-5 w-5" />
                  <span>Configurar Email</span>
                </Link>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-6">
              <Link href="/dashboard/sites" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition cursor-pointer group">
                <div className="flex items-center justify-between mb-4">
                  <Globe className="h-8 w-8 text-primary-600 group-hover:scale-110 transition-transform" />
                  <span className="text-sm text-gray-500">Sites</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{siteCount}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {siteCount === 0 ? 'Nenhum site configurado' : `${siteCount} site${siteCount > 1 ? 's' : ''} activo${siteCount > 1 ? 's' : ''}`}
                </p>
              </Link>

              <Link href="/dashboard/email" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition cursor-pointer group">
                <div className="flex items-center justify-between mb-4">
                  <Mail className="h-8 w-8 text-primary-600 group-hover:scale-110 transition-transform" />
                  <span className="text-sm text-gray-500">Emails</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{emailCount}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {emailCount === 0 ? 'Nenhuma conta configurada' : `${emailCount} conta${emailCount > 1 ? 's' : ''} activa${emailCount > 1 ? 's' : ''}`}
                </p>
              </Link>

              <Link href="/dashboard/domains" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition cursor-pointer group">
                <div className="flex items-center justify-between mb-4">
                  <Database className="h-8 w-8 text-primary-600 group-hover:scale-110 transition-transform" />
                  <span className="text-sm text-gray-500">Armazenamento</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{storageUsed} GB</p>
                <p className="text-sm text-gray-600 mt-1">de {storageTotal} GB utilizados</p>
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Ações Rápidas</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Link
                  href="/site-quote"
                  className="flex items-center space-x-4 p-4 border-2 border-amber-300 bg-amber-50/60 rounded-xl hover:bg-amber-100/70 transition"
                >
                  <div className="bg-amber-500 p-3 rounded-lg text-white">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 flex items-center gap-1.5">
                      <span>Solicitar Criação de Site</span>
                      <span className="text-[10px] bg-amber-200 text-amber-900 font-extrabold px-2 py-0.5 rounded-full">Novo</span>
                    </h3>
                    <p className="text-xs text-amber-900 font-medium mt-0.5">Catálogo com 18 tipos de sites • a partir de 12.000 MT</p>
                  </div>
                </Link>

                <Link
                  href="/dashboard/sites"
                  className="flex items-center space-x-4 p-4 border rounded-xl hover:bg-gray-50 transition"
                >
                  <div className="bg-primary-100 p-3 rounded-lg">
                    <Globe className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Adicionar Site</h3>
                    <p className="text-sm text-gray-600">Configure um novo site</p>
                  </div>
                </Link>

                <Link
                  href="/dashboard/email"
                  className="flex items-center space-x-4 p-4 border rounded-xl hover:bg-gray-50 transition"
                >
                  <div className="bg-primary-100 p-3 rounded-lg">
                    <Mail className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Criar Email</h3>
                    <p className="text-sm text-gray-600">Nova conta de email</p>
                  </div>
                </Link>

                <Link
                  href="/dashboard/billing"
                  className="flex items-center space-x-4 p-4 border rounded-xl hover:bg-gray-50 transition"
                >
                  <div className="bg-primary-100 p-3 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Upgrade de Plano</h3>
                    <p className="text-sm text-gray-600">Aumente seus recursos</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Atividade Recente</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div className="flex-1">
                    <p className="text-gray-900">Conta criada com sucesso</p>
                    <p className="text-sm text-gray-600">Bem-vindo à WEHOSTHERE!</p>
                  </div>
                  <span className="text-sm text-gray-500">Agora</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
