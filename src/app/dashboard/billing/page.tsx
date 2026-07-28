'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Database, CheckCircle, LayoutDashboard, Globe, Mail, Settings as SettingsIcon, LogOut, Server,
  CreditCard, TrendingUp, Calendar, Zap, Shield
} from 'lucide-react';
import { auth, User } from '@/lib/auth';
import { hostingPlans } from '@/lib/data';

export default function BillingPage() {
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

  const handleUpgrade = (planId: string) => {
    if (user) {
      auth.updatePlan(user.id, planId as 'basic' | 'pro' | 'enterprise');
      setUser({ ...user, plan: planId as 'basic' | 'pro' | 'enterprise' });
      alert('Plano atualizado com sucesso!');
    }
  };

  const getCurrentPlan = () => {
    if (!user) return null;
    return hostingPlans.find(p => p.id === user.plan) || hostingPlans[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) return null;

  const currentPlan = getCurrentPlan();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2">
              <Server className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">WEHOSTHERE</span>
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Olá, {user.name}</span>
              <button
                onClick={() => { auth.logout(); router.push('/'); }}
                className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition"
              >
                <LogOut className="h-5 w-5" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <nav className="space-y-2">
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition"
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
                  className="flex items-center space-x-3 px-4 py-3 bg-primary-50 text-primary-700 rounded-lg"
                >
                  <Database className="h-5 w-5" />
                  <span>Faturamento</span>
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition"
                >
                  <SettingsIcon className="h-5 w-5" />
                  <span>Configurações</span>
                </Link>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Current Plan */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg p-8 text-white">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Plano Atual</h2>
                  <p className="text-blue-100">Gerencie sua assinatura</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold">{currentPlan?.price ? currentPlan.price.toLocaleString('pt-MZ') : '0'} MT</p>
                  <p className="text-blue-100">/mês</p>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white/10 rounded-lg p-4">
                  <Globe className="h-6 w-6 mb-2" />
                  <p className="font-semibold">{currentPlan?.features.sites === -1 ? 'Ilimitados' : currentPlan?.features.sites}</p>
                  <p className="text-sm text-blue-100">Sites</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <Mail className="h-6 w-6 mb-2" />
                  <p className="font-semibold">{currentPlan?.features.emails === -1 ? 'Ilimitados' : currentPlan?.features.emails}</p>
                  <p className="text-sm text-blue-100">Emails</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <Database className="h-6 w-6 mb-2" />
                  <p className="font-semibold">{currentPlan?.features.storage} GB</p>
                  <p className="text-sm text-blue-100">Armazenamento</p>
                </div>
              </div>
            </div>

            {/* Billing History */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Histórico de Pagamentos</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="bg-green-100 p-3 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Plano {currentPlan?.name}</p>
                      <p className="text-sm text-gray-600">Pagamento mensal</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{currentPlan?.price ? currentPlan.price.toLocaleString('pt-MZ') : '0'} MT</p>
                    <p className="text-sm text-gray-600">
                      {new Date().toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upgrade Plans */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Fazer Upgrade</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {hostingPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`border-2 rounded-xl p-6 ${
                      plan.id === user.plan
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    {plan.id === user.plan && (
                      <span className="inline-block bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
                        ATUAL
                      </span>
                    )}
                    <h4 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h4>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-gray-900">{plan.price.toLocaleString('pt-MZ')} MT</span>
                      <span className="text-gray-600">/mês</span>
                    </div>
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-center text-gray-700">
                        <Globe className="h-4 w-4 text-primary-600 mr-2" />
                        {plan.features.sites === -1 ? 'Sites ilimitados' : `${plan.features.sites} site${plan.features.sites > 1 ? 's' : ''}`}
                      </li>
                      <li className="flex items-center text-gray-700">
                        <Mail className="h-4 w-4 text-primary-600 mr-2" />
                        {plan.features.emails === -1 ? 'Emails ilimitados' : `${plan.features.emails} email${plan.features.emails > 1 ? 's' : ''}`}
                      </li>
                      <li className="flex items-center text-gray-700">
                        <Database className="h-4 w-4 text-primary-600 mr-2" />
                        {plan.features.storage} GB Armazenamento
                      </li>
                      <li className="flex items-center text-gray-700">
                        <Zap className="h-4 w-4 text-primary-600 mr-2" />
                        Tráfego {plan.features.bandwidth}
                      </li>
                      {plan.features.ssl && (
                        <li className="flex items-center text-gray-700">
                          <Shield className="h-4 w-4 text-primary-600 mr-2" />
                          SSL Grátis
                        </li>
                      )}
                      {plan.features.cdn && (
                        <li className="flex items-center text-gray-700">
                          <TrendingUp className="h-4 w-4 text-primary-600 mr-2" />
                          CDN Grátis
                        </li>
                      )}
                    </ul>
                    {plan.id !== user.plan ? (
                      <button
                        onClick={() => handleUpgrade(plan.id)}
                        className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
                      >
                        Fazer Upgrade
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full py-3 bg-gray-300 text-gray-700 rounded-lg cursor-not-allowed font-semibold"
                      >
                        Plano Atual
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Método de Pagamento</h3>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="bg-primary-100 p-3 rounded-lg">
                    <CreditCard className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Cartão de Crédito</p>
                    <p className="text-sm text-gray-600">•••• •••• •••• 4242</p>
                  </div>
                </div>
                <button className="text-primary-600 hover:text-primary-700 font-semibold">
                  Alterar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
