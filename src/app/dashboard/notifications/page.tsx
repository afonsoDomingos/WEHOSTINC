'use client';

import { useState, useEffect } from 'react';
import { 
  Bell, CheckCircle2, Archive, Trash2, RefreshCw, 
  ShoppingBag, RefreshCw as Renewal, ArrowUp, 
  AlertCircle, DollarSign, Filter, X, BellOff
} from 'lucide-react';
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

export default function SalesNotificationsPage() {
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

      const response = await fetch(`/api/notifications/sales?userId=${userId}&status=${filter}&limit=50`);
      const data = await response.json();
      
      if (data.success) {
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
        body: JSON.stringify({ action: 'read' }),
      });

      if (response.ok) {
        setNotifications(notifications.map(n => 
          n._id === id ? { ...n, status: 'read' as const, readAt: new Date().toISOString() } : n
        ));
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (err) {
      console.error('Erro ao marcar como lida:', err);
    }
  };

  const archiveNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/sales/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive' }),
      });

      if (response.ok) {
        setNotifications(notifications.filter(n => n._id !== id));
        if (notifications.find(n => n._id === id)?.status === 'unread') {
          setUnreadCount(Math.max(0, unreadCount - 1));
        }
      }
    } catch (err) {
      console.error('Erro ao arquivar:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/sales/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications(notifications.filter(n => n._id !== id));
        if (notifications.find(n => n._id === id)?.status === 'unread') {
          setUnreadCount(Math.max(0, unreadCount - 1));
        }
      }
    } catch (err) {
      console.error('Erro ao excluir:', err);
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
        fetchNotifications(); // Atualizar lista de notificações
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

      {/* Filters */}
      <div className="flex items-center space-x-2 bg-white rounded-lg p-1 border border-gray-200">
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-md transition ${
            filter === 'unread' ? 'bg-primary-100 text-primary-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Não lidas {unreadCount > 0 && `(${unreadCount})`}
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`px-4 py-2 rounded-md transition ${
            filter === 'read' ? 'bg-primary-100 text-primary-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Lidas
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md transition ${
            filter === 'all' ? 'bg-primary-100 text-primary-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Todas
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhuma notificação encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`bg-white rounded-lg border p-4 transition hover:shadow-md ${
                notification.status === 'unread' ? 'border-l-4 border-l-primary-500' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className={`p-2 rounded-lg ${getBackgroundColorForType(notification.type)}`}>
                    {getIconForType(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                      {notification.status === 'unread' && (
                        <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Pedido #{notification.orderNumber}</span>
                      <span className="font-semibold text-gray-900">
                        {notification.amount.toLocaleString('pt-MZ')} {notification.currency}
                      </span>
                      <span>{formatDate(notification.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {notification.status === 'unread' && (
                    <button
                      onClick={() => markAsRead(notification._id)}
                      className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                      title="Marcar como lida"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={() => archiveNotification(notification._id)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Arquivar"
                  >
                    <Archive className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => deleteNotification(notification._id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Excluir"
                  >
                    <Trash2 className="h-5 w-5" />
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
