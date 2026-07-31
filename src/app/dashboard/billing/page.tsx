'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Database, CheckCircle, LayoutDashboard, Globe, Mail, Settings as SettingsIcon, LogOut, Server,
  CreditCard, TrendingUp, Calendar, Zap, Shield, Download, Printer
} from 'lucide-react';
import { auth, User } from '@/lib/auth';
import { hostingPlans, dataManager, ServiceOrder } from '@/lib/data';
import DashboardNav from '@/components/DashboardNav';
import PageLoader from '@/components/PageLoader';
import ReceiptModal, { ReceiptData } from '@/components/ReceiptModal';
import Toast from '@/components/Toast';
import { Clock, XCircle, FileText } from 'lucide-react';

export default function BillingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [userOrders, setUserOrders] = useState<ServiceOrder[]>([]);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error' | 'info'; title?: string; message: string } | null>(null);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);

    const refreshOrders = (fetchedOrders?: ServiceOrder[]) => {
      const allOrders = fetchedOrders || dataManager.getOrders();
      const myOrders = allOrders.filter(
        o => o.clientEmail.toLowerCase() === currentUser.email.toLowerCase() ||
             o.clientName.toLowerCase() === currentUser.name.toLowerCase()
      );
      setUserOrders(myOrders);
    };

    refreshOrders();
    setLoading(false);

    dataManager.fetchOrdersAsync().then((fetched) => refreshOrders(fetched));

    const interval = setInterval(() => {
      dataManager.fetchOrdersAsync().then((fetched) => refreshOrders(fetched));
    }, 3000);

    return () => clearInterval(interval);
  }, [router]);

  const handleUpgrade = (planId: string) => {
    if (!user) return;

    const newPlan = hostingPlans.find(p => p.id === planId);
    if (!newPlan) return;

    // Atualiza o plano do utilizador no auth
    auth.updatePlan(user.id, planId as 'basic' | 'pro' | 'enterprise');
    setUser({ ...user, plan: planId as 'basic' | 'pro' | 'enterprise' });

    // Cria um ServiceOrder real com o valor e plano novo
    const newOrder = dataManager.addOrder({
      clientName: user.name,
      clientEmail: user.email,
      clientPhone: '',
      serviceName: `Upgrade de Plano → ${newPlan.name}`,
      amount: newPlan.price,
      paymentMethod: 'bank_transfer',
      status: 'pending',
    });

    // Atualiza a lista de faturas imediatamente na UI
    setUserOrders(prev => [newOrder, ...prev]);

    setToastMsg({
      type: 'success',
      title: `Plano atualizado para ${newPlan.name}!`,
      message: `Fatura ${newOrder.id} gerada (${newPlan.price.toLocaleString('pt-MZ')} MT/mês). Estado: Pagamento Pendente — envie o comprovativo para ativação.`
    });
  };

  const getCurrentPlan = () => {
    if (!user) return null;
    return hostingPlans.find(p => p.id === user.plan) || hostingPlans[0];
  };

  if (loading) {
    return <PageLoader text="A carregar os seus dados de faturamento..." />;
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

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
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
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg p-4 sm:p-8 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold mb-1">Plano Atual</h2>
                  <p className="text-blue-100 text-sm">Gerencie sua assinatura</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-3xl sm:text-4xl font-bold">{currentPlan?.price ? currentPlan.price.toLocaleString('pt-MZ') : '0'} MT</p>
                  <p className="text-blue-100 text-sm">/mês</p>
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
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Histórico de Pagamentos & Faturas</h3>
                  <p className="text-xs text-gray-500">Sincronizado em tempo real com o estado dos seus pedidos</p>
                </div>
                <span className="bg-primary-50 text-primary-700 text-xs font-bold px-3 py-1 rounded-full border border-primary-200">
                  {userOrders.length} {userOrders.length === 1 ? 'Fatura' : 'Faturas'}
                </span>
              </div>

              {userOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Nenhum histórico de fatura registado ainda.
                </div>
              ) : (
                <div className="space-y-3">
                  {userOrders.map((order) => {
                    const statusConfig = {
                      completed: { label: 'Pago / Ativo', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: CheckCircle, iconColor: 'text-emerald-600', iconBg: 'bg-emerald-100' },
                      in_progress: { label: 'Em Processamento', bg: 'bg-blue-50 text-blue-800 border-blue-200', icon: Clock, iconColor: 'text-blue-600', iconBg: 'bg-blue-100' },
                      pending: { label: 'Pagamento Pendente', bg: 'bg-amber-50 text-amber-800 border-amber-200', icon: Clock, iconColor: 'text-amber-600', iconBg: 'bg-amber-100' },
                      suspended: { label: 'Suspenso', bg: 'bg-rose-50 text-rose-800 border-rose-200', icon: XCircle, iconColor: 'text-rose-600', iconBg: 'bg-rose-100' },
                      cancelled: { label: 'Cancelado', bg: 'bg-gray-100 text-gray-700 border-gray-200', icon: XCircle, iconColor: 'text-gray-500', iconBg: 'bg-gray-200' },
                    }[order.status] || { label: order.status, bg: 'bg-gray-50 text-gray-800 border-gray-200', icon: Clock, iconColor: 'text-gray-600', iconBg: 'bg-gray-100' };

                    const StatusIcon = statusConfig.icon;

                    return (
                      <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-primary-200 transition gap-4">
                        <div className="flex items-center space-x-3.5">
                          <div className={`${statusConfig.iconBg} p-2.5 rounded-xl shrink-0`}>
                            <StatusIcon className={`h-5 w-5 ${statusConfig.iconColor}`} />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 flex-wrap gap-1">
                              <span className="font-bold text-gray-900 text-sm sm:text-base">{order.serviceName}</span>
                              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${statusConfig.bg}`}>
                                {statusConfig.label}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 flex items-center space-x-2 flex-wrap">
                              <span>Ref: <strong className="font-mono text-gray-700">{order.id}</strong></span>
                              <span>•</span>
                              <span className="capitalize">Via {order.paymentMethod === 'mpesa' ? 'M-Pesa' : order.paymentMethod === 'emola' ? 'eMola' : order.paymentMethod === 'card' ? 'Cartão de Crédito/Débito' : 'Transferência Bancária'}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end space-x-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                          <div className="text-left sm:text-right">
                            <p className="font-black text-gray-900 text-base">{order.amount.toLocaleString('pt-MZ')} MT</p>
                            <p className="text-[11px] text-gray-400">
                              {new Date(order.createdAt).toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedReceipt(order)}
                            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer border border-emerald-200 shrink-0 shadow-2xs"
                            title="Ver e Imprimir Recibo Oficial (PDF)"
                          >
                            <FileText className="h-4 w-4 text-emerald-600" />
                            <span>Recibo (PDF)</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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

      {/* Modal de Recibo Oficial PDF */}
      <ReceiptModal
        receipt={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <Toast
          type={toastMsg.type}
          title={toastMsg.title}
          message={toastMsg.message}
          onClose={() => setToastMsg(null)}
        />
      )}
    </div>
  );
}
