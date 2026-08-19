'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bell, BellOff, RefreshCw, ShoppingBag, User as UserIcon, Lock, Shield, ArrowLeft
} from 'lucide-react';
import { auth, User } from '@/lib/auth';
import { useAuth } from '@/lib/useAuth';
import DashboardNav from '@/components/DashboardNav';
import PageLoader from '@/components/PageLoader';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  
  const {
    permission,
    subscription,
    requestPermission,
    unsubscribe,
    isSupported
  } = usePushNotifications();

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const testPushNotification = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        showMessage('User ID não encontrado', 'error');
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
        showMessage('Notificação de teste enviada! Verifique seu dispositivo.', 'success');
      } else {
        showMessage('Erro ao enviar notificação: ' + data.error, 'error');
      }
    } catch (err) {
      showMessage('Erro ao enviar notificação de teste', 'error');
      console.error(err);
    }
  };

  const simulatePayment = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        showMessage('User ID não encontrado', 'error');
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
        showMessage(`Pagamento simulado com sucesso! Pedido: ${data.simulationDetails.orderNumber}`, 'success');
      } else {
        showMessage('Erro ao simular pagamento: ' + data.error, 'error');
      }
    } catch (err) {
      showMessage('Erro ao simular pagamento', 'error');
      console.error(err);
    }
  };

  const handleLogout = () => {
    auth.logout();
    router.push('/');
  };

  if (loading) {
    return <PageLoader text="A carregar configurações..." />;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <DashboardNav userName={user.name} userAvatar={user.avatar} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
        {/* Back Button */}
        <button
          onClick={() => router.push('/admin')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Voltar ao Painel Admin</span>
        </button>

        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            messageType === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <div className="max-w-3xl space-y-6">
          {/* Notification Settings */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Bell className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Notificações Push</h2>
                <p className="text-gray-600">Receba notificações administrativas no seu dispositivo mesmo com a plataforma fechada</p>
              </div>
            </div>
            
            {isSupported ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Status das Notificações</p>
                    <p className="text-sm text-gray-600">
                      {subscription ? 'Ativado' : 'Desativado'}
                    </p>
                  </div>
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
                        <span>Desativar</span>
                      </>
                    ) : (
                      <>
                        <Bell className="h-4 w-4" />
                        <span>Ativar</span>
                      </>
                    )}
                  </button>
                </div>

                {subscription && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={testPushNotification}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg transition"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>Testar Push</span>
                    </button>
                    <button
                      onClick={simulatePayment}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg transition"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      <span>Simular Pagamento</span>
                    </button>
                  </div>
                )}

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Como funciona:</strong> As notificações push aparecem no seu dispositivo mesmo com a plataforma fechada, similar ao Utmify e outras grandes plataformas. Como admin, você recebe notificações de todo o sistema.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600">
                  Seu navegador não suporta notificações push. Por favor, use um navegador moderno como Chrome, Firefox ou Safari.
                </p>
              </div>
            )}
          </div>

          {/* Account Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-primary-100 p-3 rounded-lg">
                <Shield className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Informações da Conta</h2>
                <p className="text-gray-600">Detalhes da sua conta administrativa</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nome</p>
                  <p className="font-semibold text-gray-900">{user.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold text-gray-900">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Função</p>
                  <p className="font-semibold text-purple-600">Administrador</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-semibold text-green-600">Ativo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
