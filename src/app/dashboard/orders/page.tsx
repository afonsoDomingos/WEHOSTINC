'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  ShoppingBag, Clock, CheckCircle, XCircle, AlertCircle, 
  LayoutDashboard, Globe, Mail, Database, Settings as SettingsIcon, 
  LogOut, FileText, Download, ExternalLink
} from 'lucide-react';
import { auth, User } from '@/lib/auth';
import { dataManager, ServiceOrder } from '@/lib/data';
import DashboardNav from '@/components/DashboardNav';
import DashboardSidebar from '@/components/DashboardSidebar';
import PageLoader from '@/components/PageLoader';
import StatusBadge from '@/components/StatusBadge';

export default function OrdersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Aguardar NextAuth carregar
    if (status === 'loading') return;
    
    let currentUser: User | null = null;
    
    // Tentar NextAuth primeiro
    if (status === 'authenticated' && session?.user) {
      currentUser = {
        id: (session.user as any)?.id || session.user.email || '',
        name: session.user.name || '',
        email: session.user.email || '',
        plan: (session.user as any)?.plan || 'none',
        status: (session.user as any)?.status || 'active',
        role: (session.user as any)?.role || 'user',
        avatar: session.user.image || undefined,
        dueDate: (session.user as any)?.dueDate,
        createdAt: (session.user as any)?.createdAt || new Date().toISOString()
      };
    }
    
    // Fallback para sistema customizado (se NextAuth falhar ou não estiver autenticado)
    if (!currentUser) {
      currentUser = auth.getCurrentUser();
    }
    
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

    // Polling a cada 30s para sincronizar alterações de status do Admin em tempo real
    const interval = setInterval(() => {
      dataManager.fetchOrdersAsync().then((fetched) => {
        const myOrders = fetched.filter(o => 
          !o.userEmail || o.userEmail.toLowerCase() === currentUser.email.toLowerCase()
        );
        setOrders(myOrders);
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [router, session, status]);

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
      <DashboardNav userName={user.name} userAvatar={user.avatar} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {/* Sidebar (Desktop) */}
          <div className="hidden lg:block lg:col-span-1">
            <DashboardSidebar />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-2 sm:p-3 md:p-4 lg:p-6 w-full overflow-x-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-5">
                <div className="min-w-0 flex-1">
                  <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 truncate">Meus Pedidos de Serviços</h1>
                  <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 mt-0.5 truncate">Acompanhe o status dos seus pedidos de criação de sites e outros serviços</p>
                </div>
                <Link
                  href="/dashboard/site-quote"
                  className="inline-flex items-center justify-center space-x-1 sm:space-x-1.5 bg-primary-600 text-white font-bold text-[9px] sm:text-[10px] md:text-xs px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-xl hover:bg-primary-700 transition cursor-pointer shadow-xs whitespace-nowrap shrink-0"
                >
                  <ShoppingBag className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Novo Pedido</span>
                  <span className="sm:hidden">Novo</span>
                </Link>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-6 sm:py-8 md:py-12 px-2">
                  <ShoppingBag className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 text-gray-300 mx-auto mb-2 sm:mb-3 md:mb-4" />
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Nenhum pedido encontrado</h3>
                  <p className="text-gray-600 mb-2 sm:mb-3 md:mb-4 text-[10px] sm:text-xs md:text-sm max-w-md mx-auto">Você ainda não fez nenhum pedido de serviço. Solicite a criação de um site profissional ou outros serviços.</p>
                  <Link
                    href="/dashboard/site-quote"
                    className="inline-flex items-center space-x-1.5 sm:space-x-2 bg-primary-600 text-white font-bold px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-xl hover:bg-primary-700 transition text-[10px] sm:text-xs md:text-sm cursor-pointer"
                  >
                    <ShoppingBag className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    <span>Fazer Primeiro Pedido</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3 md:space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-xl sm:rounded-2xl p-2 sm:p-3 md:p-4 lg:p-5 hover:bg-gray-50/50 transition bg-white shadow-xs w-full overflow-hidden min-w-0">
                      <div className="flex flex-col gap-1.5 sm:gap-2">
                        <div className="flex items-start gap-2 sm:gap-2.5 md:gap-3.5 min-w-0">
                          <div className="bg-primary-50 border border-primary-100 p-1.5 sm:p-2 md:p-2.5 lg:p-3 rounded-xl shrink-0">
                            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-primary-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 mb-0.5 sm:mb-1 flex-wrap">
                              <h3 className="font-extrabold text-gray-900 text-[11px] sm:text-xs md:text-sm lg:text-base truncate flex-1">{order.serviceName}</h3>
                              <StatusBadge status={order.status} />
                            </div>
                            <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 font-mono truncate">{order.id}</p>
                            <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 mt-0.5">
                              Pedido em {formatDate(order.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 sm:gap-3 pt-1.5 sm:pt-2 border-t border-gray-100">
                          <div className="text-right min-w-0 flex-1">
                            <p className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-gray-900 truncate">
                              {(order.valorPorFaturar || 0) > 0 
                                ? `${(order.valorPorFaturar || 0).toLocaleString('pt-MZ')} MT (por faturar)` 
                                : `${(order.valorFaturado || 0).toLocaleString('pt-MZ')} MT (faturado)`
                              }
                            </p>
                            <p className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs text-gray-500 truncate">{getPaymentMethodText(order.paymentMethod)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 sm:mt-3 md:mt-4 pt-2 sm:pt-3 md:pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 text-[9px] sm:text-[10px] md:text-xs lg:text-sm">
                        <div>
                          <p className="text-gray-600 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs">Cliente</p>
                          <p className="font-semibold text-gray-900 text-[9px] sm:text-[10px] md:text-xs lg:text-sm truncate">{order.clientName}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs">Contacto</p>
                          <p className="font-semibold text-gray-900 text-[9px] sm:text-[10px] md:text-xs lg:text-sm">{order.clientPhone}</p>
                        </div>
                      </div>

                      {order.status === 'pending' && (
                        <div className="mt-1.5 sm:mt-2 md:mt-3 p-1.5 sm:p-2 md:p-2.5 lg:p-3 bg-amber-50 border border-amber-200 rounded-lg text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs text-amber-800 flex items-center gap-1 sm:gap-1.5 md:gap-2">
                          <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-amber-600 flex-shrink-0 animate-pulse" />
                          <span className="line-clamp-2 sm:line-clamp-1">
                            <strong>Pagamento Pendente:</strong> O seu pedido está aguardando confirmação do pagamento.
                          </span>
                        </div>
                      )}

                      {order.status === 'in_progress' && (
                        <div className="mt-1.5 sm:mt-2 md:mt-3 p-1.5 sm:p-2 md:p-2.5 lg:p-3 bg-blue-50 border border-blue-200 rounded-lg text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs text-blue-800 flex items-center gap-1 sm:gap-1.5 md:gap-2">
                          <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-blue-600 flex-shrink-0 animate-pulse" />
                          <span className="line-clamp-2 sm:line-clamp-1">
                            <strong>Em Desenvolvimento:</strong> A equipa WEHOSTHERE está a trabalhar no seu projeto. Você será notificado quando estiver concluído.
                          </span>
                        </div>
                      )}

                      {order.status === 'completed' && (
                        <div className="mt-1.5 sm:mt-2 md:mt-3 p-1.5 sm:p-2 md:p-2.5 lg:p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs text-emerald-800 flex items-center gap-1 sm:gap-1.5 md:gap-2">
                          <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-emerald-600 flex-shrink-0" />
                          <span className="line-clamp-2 sm:line-clamp-1">
                            <strong>Concluído:</strong> O seu pedido foi concluído com sucesso! Verifique a secção &quot;Meus Sites&quot; para aceder ao seu projeto.
                          </span>
                        </div>
                      )}

                      {order.proofUrl && (
                        <div className="mt-1.5 sm:mt-2 md:mt-3 pt-1.5 sm:pt-2 md:pt-3 border-t border-gray-100">
                          <span className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1 mb-1 sm:mb-1.5 md:mb-2">
                            <FileText className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 lg:h-3.5 lg:w-3.5 text-primary-600" />
                            <span>Comprovativo de Pagamento</span>
                          </span>
                          <a
                            href={order.proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 sm:gap-1 md:gap-1.5 lg:gap-2 px-1.5 sm:px-2 md:px-2.5 lg:px-3 py-0.5 sm:py-1 md:py-1.5 lg:py-2 bg-gray-50 hover:bg-primary-50 rounded-lg border border-gray-200 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs font-bold text-gray-700 hover:text-primary-700 transition cursor-pointer"
                          >
                            <Download className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 lg:h-3.5 lg:w-3.5" />
                            <span className="truncate max-w-[80px] sm:max-w-[100px] md:max-w-[120px] lg:max-w-[200px]">{order.proofName || 'Ver comprovativo'}</span>
                            <ExternalLink className="h-1.5 w-1.5 sm:h-2 sm:w-2 md:h-2.5 md:w-2.5 lg:h-3 lg:w-3" />
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
