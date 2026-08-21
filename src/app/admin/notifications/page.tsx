'use client';

import { useState, useEffect } from 'react';
import { 
  Bell, CheckCircle2, Archive, Trash2, RefreshCw, 
  ShoppingBag, RefreshCw as Renewal, ArrowUp, 
  AlertCircle, DollarSign, Filter, X, BellOff, ArrowLeft, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface SalesNotification {
  _id: string;
  type: 'new_sale' | 'subscription_renewal' | 'upgrade' | 'refund' | 'payment_failed';
  status: 'unread' | 'read' | 'archived';
  title: string;
  message: string;
  amount: number;
  currency: string;
  orderNumber: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  metadata: {
    customerName?: string;
    customerEmail?: string;
    paymentMethod?: string;
    planName?: string;
    renewalDate?: string;
    failureReason?: string;
  };
  createdAt: string;
  readAt?: string;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<SalesNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('unread');
  const [unreadCount, setUnreadCount] = useState(0);
  
  const {
    permission,
    subscription,
    requestPermission,
    unsubscribe,
    isSupported
  } = usePushNotifications();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      const response = await fetch(`/api/notifications/sales?userId=${userId}&status=${filter === 'all' ? 'all' : filter}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/sales/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'read' })
      });
      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('[Admin Notifications] Erro ao marcar como lida:', error);
    }
  };

  const archiveNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/sales/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' })
      });
      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('[Admin Notifications] Erro ao arquivar:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/sales/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('[Admin Notifications] Erro ao excluir:', error);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => n.status === 'unread');
    for (const notification of unreadNotifications) {
      await markAsRead(notification._id);
    }
  };

  const testPushNotification = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert('User ID não encontrado');
        return;
      }

      const response = await fetch('/api/push/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title: '🔔 Teste de Notificação',
          message: 'Se você recebeu esta notificação, o sistema push está funcionando!'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Notificação de teste enviada! Verifique seu dispositivo.');
      } else {
        alert('Erro ao enviar notificação: ' + data.error);
      }
    } catch (err) {
      alert('Erro ao enviar notificação de teste');
      console.error(err);
    }
  };

  const simulatePayment = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert('User ID não encontrado');
        return;
      }

      const amount = prompt('Valor do pagamento (MZN):', '5000');
      if (!amount) return;

      const planName = prompt('Nome do plano:', 'Plano Pro');
      if (!planName) return;

      const response = await fetch('/api/test/simulate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: parseInt(amount),
          planName
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Pagamento simulado com sucesso!\n\nPedido: ${data.simulationDetails.orderNumber}\nValor: ${data.simulationDetails.amount.toLocaleString('pt-MZ')} MZN\n\nVerifique suas notificações (email e push).`);
        fetchNotifications();
      } else {
        alert('Erro ao simular pagamento: ' + data.error);
      }
    } catch (err) {
      alert('Erro ao simular pagamento');
      console.error(err);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'new_sale':
        return <ShoppingBag className="h-5 w-5 text-emerald-600" />;
      case 'subscription_renewal':
        return <Renewal className="h-5 w-5 text-blue-600" />;
      case 'upgrade':
        return <ArrowUp className="h-5 w-5 text-purple-600" />;
      case 'refund':
        return <DollarSign className="h-5 w-5 text-orange-600" />;
      case 'payment_failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getBackgroundColorForType = (type: string) => {
    switch (type) {
      case 'new_sale':
        return 'bg-emerald-50 border-emerald-200';
      case 'subscription_renewal':
        return 'bg-blue-50 border-blue-200';
      case 'upgrade':
        return 'bg-purple-50 border-purple-200';
      case 'refund':
        return 'bg-orange-50 border-orange-200';
      case 'payment_failed':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-MZ');
  };

  return (
    <div className="space-y-6">
      {/* Navegação de Retorno */}
      <div className="flex items-center space-x-2 text-xs">
        <Link
          href="/admin"
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 rounded-xl font-bold transition cursor-pointer"
          title="Voltar ao Painel de Administração"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar ao Painel</span>
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
        <span className="text-gray-900 font-bold">Notificações</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificações de Vendas</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 ? `${unreadCount} notificação(ões) não lida(s)` : 'Todas as notificações lidas'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isSupported && (
            <button
              onClick={subscription ? unsubscribe : requestPermission}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition font-semibold ${
                subscription 
                  ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200' 
                  : 'bg-emerald-500 text-white hover:bg-emerald-600 border border-emerald-600 shadow-md'
              }`}
            >
              {subscription ? (
                <>
                  <BellOff className="h-4 w-4" />
                  <span>Desativar Push</span>
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4" />
                  <span>Ativar Push</span>
                </>
              )}
            </button>
          )}
          {subscription && (
            <button
              onClick={testPushNotification}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg transition"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Testar Push</span>
            </button>
          )}
          <button
            onClick={simulatePayment}
            className="flex items-center space-x-2 px-4 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg transition"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Simular Pagamento</span>
          </button>
          <button
            onClick={fetchNotifications}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Atualizar</span>
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Marcar todas como lidas</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            filter === 'unread' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Não lidas ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            filter === 'read' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Lidas
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            filter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Todas ({notifications.length})
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma notificação</h3>
          <p className="text-gray-600">
            {filter === 'unread' ? 'Você não tem notificações não lidas.' : 'Nenhuma notificação encontrada.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`p-4 rounded-xl border ${getBackgroundColorForType(notification.type)} ${
                notification.status === 'unread' ? 'border-l-4 border-l-primary-600' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="p-2 rounded-lg bg-white border border-gray-200">
                    {getIconForType(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <h3 className={`font-semibold text-gray-900 ${notification.status === 'unread' ? 'font-bold' : ''}`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs text-gray-500 ml-2">{formatDate(notification.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{notification.message}</p>
                    {notification.amount > 0 && (
                      <p className="text-sm font-semibold text-gray-900 mt-2">
                        Valor: {notification.amount.toLocaleString('pt-MZ')} {notification.currency}
                      </p>
                    )}
                    {notification.metadata.customerName && (
                      <p className="text-xs text-gray-600 mt-1">
                        Cliente: {notification.metadata.customerName} ({notification.metadata.customerEmail})
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {notification.status === 'unread' && (
                    <button
                      onClick={() => markAsRead(notification._id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                      title="Marcar como lida"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => archiveNotification(notification._id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Arquivar"
                  >
                    <Archive className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteNotification(notification._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
