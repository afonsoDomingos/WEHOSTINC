'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Database, CheckCircle, LayoutDashboard, Globe, Mail, Settings as SettingsIcon, LogOut, Server,
  CreditCard, TrendingUp, Calendar, Zap, Shield, Download, Printer
} from 'lucide-react';
import { auth, User } from '@/lib/auth';
import { hostingPlans } from '@/lib/data';
import DashboardNav from '@/components/DashboardNav';

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

  const handleLogout = () => {
    auth.logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Responsivo */}
      <DashboardNav userName={user.name} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar (Desktop) */}
          <div className="hidden lg:block lg:col-span-1">
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
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{currentPlan?.price ? currentPlan.price.toLocaleString('pt-MZ') : '0'} MT</p>
                      <p className="text-sm text-gray-600">
                        {new Date().toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <button
                      onClick={() => window.print()}
                      className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-xs rounded-lg transition flex items-center space-x-1.5 cursor-pointer border border-gray-200"
                    >
                      <Printer className="h-4 w-4 text-gray-600" />
                      <span>Fatura (PDF)</span>
                    </button>
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
              <h3 className="text-xl font-bold text-gray-900 mb-4">Métodos de Pagamento Suportados</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-xl bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary-100 p-3 rounded-lg">
                      <CreditCard className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">M-Pesa / eMola / Cartão</p>
                      <p className="text-sm text-gray-600">Cobrança automática em Meticais (MT)</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-xl bg-emerald-50/60 border-emerald-200">
                  <div className="flex items-center space-x-4">
                    <div className="bg-emerald-100 p-3 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-emerald-950">Transferência Bancária</p>
                      <p className="text-sm text-emerald-700">Comprovativo com ativação pelo admin</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Banco & Envio de Comprovativo Manual */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Enviar Comprovativo de Pagamento</h3>
              <p className="text-gray-500 text-sm mb-6">
                Efetue a transferência para uma de nossas contas oficiais abaixo e anexe o comprovativo em PDF ou imagem para validação rápida.
              </p>

              <div className="grid md:grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 font-mono text-xs text-gray-800">
                <div className="p-2.5 bg-white rounded-lg border border-gray-200">
                  <strong className="text-gray-900 block font-sans font-bold text-sm">Millennium BIM</strong>
                  NIB: 433372004293948
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-gray-200">
                  <strong className="text-gray-900 block font-sans font-bold text-sm">BCI</strong>
                  <span className="text-gray-400 italic font-sans">NIB em breve</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-gray-200">
                  <strong className="text-gray-900 block font-sans font-bold text-sm">Standard Bank</strong>
                  <span className="text-gray-400 italic font-sans">NIB em breve</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-gray-200">
                  <strong className="text-gray-900 block font-sans font-bold text-sm">M-Pesa Manual</strong>
                  +258 847877405
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-gray-200">
                  <strong className="text-gray-900 block font-sans font-bold text-sm">E-Mola Manual</strong>
                  879642412
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-primary-50/50 rounded-xl border border-primary-100">
                <div className="text-xs text-gray-600">
                  <span className="font-bold text-gray-900 block text-sm">Carregar Novo Comprovativo:</span>
                  <span>Aceites ficheiros em formato PDF, PNG ou JPG (máx. 10MB)</span>
                </div>
                <Link
                  href="/checkout?plan=pro"
                  className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center space-x-2"
                >
                  <Download className="w-4 h-4 rotate-180" />
                  <span>Submeter Comprovativo no Checkout</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
