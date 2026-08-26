'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bell, BellOff, RefreshCw, ShoppingBag, User as UserIcon, Lock, Shield, ArrowLeft, Home
} from 'lucide-react';
import { auth, User } from '@/lib/auth';
import { useAuth } from '@/lib/useAuth';
import PageLoader from '@/components/PageLoader';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import Link from 'next/link';

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth({ redirectToAdmin: false, redirectToLogin: true });
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
      const currentUser = auth.getCurrentUser();
      if (!currentUser) {
        showMessage('Usuário não autenticado', 'error');
        return;
      }

      const response = await fetch('/api/push/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          email: currentUser.email,
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
      const currentUser = auth.getCurrentUser();
      if (!currentUser) {
        showMessage('Usuário não autenticado', 'error');
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
          userId: currentUser.id,
          email: currentUser.email,
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

  // Verificar se é Super Admin
  if (!auth.isSuperAdmin(user)) {
    router.push('/admin');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Admin Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs">
              <Link
                href="/admin"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 rounded-xl font-bold transition cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar ao Painel</span>
              </Link>
              <span className="text-gray-400">/</span>
              <h1 className="text-sm font-bold text-gray-900">Configurações</h1>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-2 px-3 py-1.5 text-xs font-bold text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
            >
              <UserIcon className="h-4 w-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {message && (
          <div className={`p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 ${
            messageType === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <div className="max-w-3xl space-y-4 sm:space-y-6">
          {/* Notification Settings */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
              <div className="bg-purple-100 p-2 sm:p-3 rounded-lg">
                <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Notificações Push</h2>
                <p className="text-xs sm:text-sm text-gray-600">Receba notificações administrativas no seu dispositivo mesmo com a plataforma fechada</p>
              </div>
            </div>
            
            {isSupported ? (
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-lg gap-3">
                  <div>
                    <p className="font-medium text-gray-900 text-sm sm:text-base">Status das Notificações</p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {subscription ? 'Ativado' : 'Desativado'}
                    </p>
                  </div>
                  <button
                    onClick={subscription ? unsubscribe : requestPermission}
                    className={`flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition font-semibold text-xs sm:text-sm ${
                      subscription 
                        ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200' 
                        : 'bg-emerald-500 text-white hover:bg-emerald-600 border border-emerald-600 shadow-md'
                    }`}
                  >
                    {subscription ? (
                      <>
                        <BellOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span>Desativar</span>
                      </>
                    ) : (
                      <>
                        <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span>Ativar</span>
                      </>
                    )}
                  </button>
                </div>

                {subscription && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <button
                      onClick={testPushNotification}
                      className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg transition text-xs sm:text-sm"
                    >
                      <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span>Testar Push</span>
                    </button>
                    <button
                      onClick={simulatePayment}
                      className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg transition text-xs sm:text-sm"
                    >
                      <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span>Simular Pagamento</span>
                    </button>
                  </div>
                )}

                <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs sm:text-sm text-blue-800">
                    <strong>Como funciona:</strong> As notificações push aparecem no seu dispositivo mesmo com a plataforma fechada, similar ao Utmify e outras grandes plataformas. Como admin, você recebe notificações de todo o sistema.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600">
                  Seu navegador não suporta notificações push. Por favor, use um navegador moderno como Chrome, Firefox ou Safari.
                </p>
              </div>
            )}
          </div>

          {/* Account Info */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
              <div className="bg-primary-100 p-2 sm:p-3 rounded-lg">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Informações da Conta</h2>
                <p className="text-xs sm:text-sm text-gray-600">Detalhes da sua conta administrativa</p>
              </div>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Nome</p>
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">{user.name}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Email</p>
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">{user.email}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Função</p>
                  <p className="font-semibold text-purple-600 text-sm sm:text-base">Administrador</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Status</p>
                  <p className="font-semibold text-green-600 text-sm sm:text-base">Ativo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
