'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Server, Mail, LayoutDashboard, Settings, LogOut, 
  Plus, Globe, Database, TrendingUp, Users, CheckCircle 
} from 'lucide-react';
import { auth, User } from '@/lib/auth';

import DashboardNav from '@/components/DashboardNav';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar (Desktop) */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <nav className="space-y-2">
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-3 px-4 py-3 bg-primary-50 text-primary-700 rounded-lg"
                >
                  <LayoutDashboard className="h-5 w-5" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/dashboard/sites"
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition"
                >
                  <Globe className="h-5 w-5" />
                  <span>Meus Sites</span>
                </Link>
                <Link
                  href="/dashboard/email"
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition"
                >
                  <Mail className="h-5 w-5" />
                  <span>Email</span>
                </Link>
                <Link
                  href="/dashboard/billing"
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition"
                >
                  <Database className="h-5 w-5" />
                  <span>Faturamento</span>
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition"
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
            {/* Welcome Card */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg p-8 text-white">
              <h1 className="text-3xl font-bold mb-2">Bem-vindo ao Painel!</h1>
              <p className="text-blue-100 mb-6">
                Gerencie seus sites, emails e configurações em um só lugar.
              </p>
              <div className="flex space-x-4">
                <Link
                  href="/dashboard/sites"
                  className="flex items-center space-x-2 bg-white text-primary-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition font-semibold"
                >
                  <Plus className="h-5 w-5" />
                  <span>Novo Site</span>
                </Link>
                <Link
                  href="/dashboard/email"
                  className="flex items-center space-x-2 bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-400 transition font-semibold"
                >
                  <Mail className="h-5 w-5" />
                  <span>Configurar Email</span>
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <Globe className="h-8 w-8 text-primary-600" />
                  <span className="text-sm text-gray-500">Sites</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-600 mt-1">Nenhum site configurado</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <Mail className="h-8 w-8 text-primary-600" />
                  <span className="text-sm text-gray-500">Emails</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-600 mt-1">Nenhuma conta configurada</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <Database className="h-8 w-8 text-primary-600" />
                  <span className="text-sm text-gray-500">Armazenamento</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">0 GB</p>
                <p className="text-sm text-gray-600 mt-1">de 10 GB utilizados</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Ações Rápidas</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Link
                  href="/dashboard/sites"
                  className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition"
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
                  className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition"
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
                  className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="bg-primary-100 p-3 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Upgrade de Plano</h3>
                    <p className="text-sm text-gray-600">Aumente seus recursos</p>
                  </div>
                </Link>

                <Link
                  href="/dashboard/settings"
                  className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="bg-primary-100 p-3 rounded-lg">
                    <Settings className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Configurações</h3>
                    <p className="text-sm text-gray-600">Gerencie sua conta</p>
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
