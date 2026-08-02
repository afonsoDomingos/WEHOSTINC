'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, Clock, CheckCircle, XCircle, AlertCircle, 
  LayoutDashboard, Globe, Mail, Database, Settings as SettingsIcon, 
  LogOut, FileText, Download, ExternalLink
} from 'lucide-react';
import { auth, User } from '@/lib/auth';
import { dataManager, ServiceOrder } from '@/lib/data';
import DashboardNav from '@/components/DashboardNav';
import PageLoader from '@/components/PageLoader';
import StatusBadge from '@/components/StatusBadge';

export default function OrdersPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);

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
    
    // Carregar pedidos do usuário atual
    const userOrders = dataManager.getOrders(currentUser.email);
    setOrders(userOrders);
    setLoading(false);

    // Busca assíncrona inicial dos dados do servidor
    dataManager.fetchOrdersAsync().then((fetched) => {
      const myOrders = fetched.filter(o => 
        !o.clientEmail || o.clientEmail.toLowerCase() === currentUser.email.toLowerCase()
      );
      setOrders(myOrders);
    });

    // Polling a cada 5s para sincronizar alterações de status do Admin em tempo real
    const interval = setInterval(() => {
      dataManager.fetchOrdersAsync().then((fetched) => {
        const myOrders = fetched.filter(o => 
          !o.clientEmail || o.clientEmail.toLowerCase() === currentUser.email.toLowerCase()
        );
        setOrders(myOrders);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [router]);

  const getStatusIcon = (status: ServiceOrder['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'suspended':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluído';
      case 'in_progress':
        return 'Em Desenvolvimento';
      case 'pending':
        return 'Pendente';
      case 'cancelled':
        return 'Cancelado';
      case 'suspended':
        return 'Suspenso';
      default:
        return status;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'mpesa':
        return 'M-Pesa';
      case 'emola':
        return 'eMola';
      case 'card':
        return 'Cartão';
      case 'bank_transfer':
        return 'Transferência Bancária';
      default:
        return method;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-MZ', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <PageLoader text="A carregar os seus pedidos..." />;
  }

  if (!user) return null;

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
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition font-medium"
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
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition font-medium"
                >
                  <ShoppingBag className="h-5 w-5" />
                  <span>Solicitar Site</span>
                </Link>
                <Link
                  href="/dashboard/orders"
                  className="flex items-center space-x-3 px-4 py-3 bg-primary-50 text-primary-700 rounded-lg font-medium"
                >
                  <FileText className="h-5 w-5" />
                  <span>Meus Pedidos</span>
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
                  <SettingsIcon className="h-5 w-5" />
                  <span>Configurações</span>
                </Link>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Meus Pedidos de Serviços</h1>
                  <p className="text-xs text-gray-500 mt-0.5">Acompanhe o status dos seus pedidos de criação de sites e outros serviços</p>
                </div>
                <Link
                  href="/site-quote"
                  className="inline-flex items-center justify-center space-x-1.5 bg-primary-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-primary-700 transition cursor-pointer shadow-xs whitespace-nowrap"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>Novo Pedido</span>
                </Link>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum pedido encontrado</h3>
                  <p className="text-gray-600 mb-4 text-sm max-w-md mx-auto">Você ainda não fez nenhum pedido de serviço. Solicite a criação de um site profissional ou outros serviços.</p>
                  <Link
                    href="/site-quote"
                    className="inline-flex items-center space-x-2 bg-primary-600 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-primary-700 transition text-sm cursor-pointer"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>Fazer Primeiro Pedido</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-2xl p-4 sm:p-5 hover:bg-gray-50/50 transition bg-white shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-start space-x-3.5 min-w-0 flex-1">
                          <div className="bg-primary-50 border border-primary-100 p-2.5 sm:p-3 rounded-xl shrink-0">
                            <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-extrabold text-gray-900 text-sm sm:text-base truncate">{order.serviceName}</h3>
                              <StatusBadge status={order.status} />
                            </div>
                            <p className="text-xs text-gray-500 font-mono">{order.id}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Pedido em {formatDate(order.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 w-full sm:w-auto pt-2.5 sm:pt-0 border-t sm:border-t-0 border-gray-100 shrink-0">
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">
                              {(order.valorPorFaturar || 0) > 0 
                                ? `${(order.valorPorFaturar || 0).toLocaleString('pt-MZ')} MT (por faturar)` 
                                : `${(order.valorFaturado || 0).toLocaleString('pt-MZ')} MT (faturado)`
                              }
                            </p>
                            <p className="text-[10px] text-gray-500">{getPaymentMethodText(order.paymentMethod)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Cliente</p>
                          <p className="font-semibold text-gray-900">{order.clientName}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Contacto</p>
                          <p className="font-semibold text-gray-900">{order.clientPhone}</p>
                        </div>
                      </div>

                      {order.status === 'pending' && (
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-amber-600 flex-shrink-0 animate-pulse" />
                          <span>
                            <strong>Pagamento Pendente:</strong> O seu pedido está aguardando confirmação do pagamento.
                          </span>
                        </div>
                      )}

                      {order.status === 'in_progress' && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-blue-600 flex-shrink-0 animate-pulse" />
                          <span>
                            <strong>Em Desenvolvimento:</strong> A equipa WEHOSTHERE está a trabalhar no seu projeto. Você será notificado quando estiver concluído.
                          </span>
                        </div>
                      )}

                      {order.status === 'completed' && (
                        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                          <span>
                            <strong>Concluído:</strong> O seu pedido foi concluído com sucesso! Verifique a secção &quot;Meus Sites&quot; para aceder ao seu projeto.
                          </span>
                        </div>
                      )}

                      {order.proofUrl && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center space-x-1 mb-2">
                            <FileText className="h-3.5 w-3.5 text-primary-600" />
                            <span>Comprovativo de Pagamento</span>
                          </span>
                          <a
                            href={order.proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-2 px-3 py-2 bg-gray-50 hover:bg-primary-50 rounded-lg border border-gray-200 text-xs font-bold text-gray-700 hover:text-primary-700 transition cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>{order.proofName || 'Ver comprovativo'}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
