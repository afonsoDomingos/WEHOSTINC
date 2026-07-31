'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Settings as SettingsIcon, LayoutDashboard, Globe, Mail, Database, LogOut, Server,
  User as UserIcon, Lock, Bell, Shield, Key
} from 'lucide-react';
import { auth, User } from '@/lib/auth';
import DashboardNav from '@/components/DashboardNav';
import PageLoader from '@/components/PageLoader';
import ConfirmModal from '@/components/ConfirmModal';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [deleteAccountConfirm, setDeleteAccountConfirm] = useState(false);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    setName(currentUser.name);
    setEmail(currentUser.email);
    setLoading(false);
  }, [router]);

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      // Update user data in localStorage
      const userData = JSON.parse(localStorage.getItem(`user_${user.id}`) || '{}');
      userData.name = name;
      userData.email = email;
      localStorage.setItem(`user_${user.id}`, JSON.stringify(userData));

      // Update session
      const session = localStorage.getItem('wehosthere_auth');
      if (session) {
        const parsed = JSON.parse(session);
        parsed.user.name = name;
        parsed.user.email = email;
        localStorage.setItem('wehosthere_auth', JSON.stringify(parsed));
      }

      setUser({ ...user, name, email });
      showMessage('Perfil atualizado com sucesso!', 'success');
    }
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      showMessage('As senhas não coincidem', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showMessage('A senha deve ter pelo menos 6 caracteres', 'error');
      return;
    }

    if (user) {
      const userData = JSON.parse(localStorage.getItem(`user_${user.id}`) || '{}');
      
      if (userData.password !== currentPassword) {
        showMessage('Senha atual incorreta', 'error');
        return;
      }

      userData.password = newPassword;
      localStorage.setItem(`user_${user.id}`, JSON.stringify(userData));

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showMessage('Senha atualizada com sucesso!', 'success');
    }
  };

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  if (loading) {
    return <PageLoader text="A carregar as suas configurações..." />;
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
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition"
                >
                  <Database className="h-5 w-5" />
                  <span>Faturamento</span>
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center space-x-3 px-4 py-3 bg-primary-50 text-primary-700 rounded-lg"
                >
                  <SettingsIcon className="h-5 w-5" />
                  <span>Configurações</span>
                </Link>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {message && (
              <div className={`p-4 rounded-lg ${
                messageType === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {message}
              </div>
            )}

            {/* Profile Settings */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-primary-100 p-3 rounded-lg">
                  <UserIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Perfil</h2>
                  <p className="text-gray-600">Atualize suas informações pessoais</p>
                </div>
              </div>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
                >
                  Salvar Alterações
                </button>
              </form>
            </div>

            {/* Password Settings */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-primary-100 p-3 rounded-lg">
                  <Lock className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Senha</h2>
                  <p className="text-gray-600">Alterar sua senha de acesso</p>
                </div>
              </div>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Senha Atual
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Nova Senha
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Nova Senha
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
                >
                  Atualizar Senha
                </button>
              </form>
            </div>

            {/* Account Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-primary-100 p-3 rounded-lg">
                  <Shield className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Informações da Conta</h2>
                  <p className="text-gray-600">Detalhes da sua conta</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">ID da Conta</p>
                    <p className="font-semibold text-gray-900">{user.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Plano</p>
                    <p className="font-semibold text-gray-900 capitalize">{user.plan}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Membro desde</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-semibold text-green-600">Ativo</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="bg-red-100 p-3 rounded-lg">
                  <Key className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-red-900">Zona de Perigo</h2>
                  <p className="text-red-700">Ações irreversíveis</p>
                </div>
              </div>
              <div className="space-y-4">
                <button
                  onClick={() => setDeleteAccountConfirm(true)}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold cursor-pointer"
                >
                  Excluir Conta Permanentemente
                </button>
                <p className="text-sm text-red-700">
                  Esta ação não pode ser desfeita. Todos os seus dados serão permanentemente removidos.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Confirm Modal Excluir Conta */}
      <ConfirmModal
        isOpen={deleteAccountConfirm}
        title="Excluir Conta Permanentemente"
        message="Tem certeza que deseja ELIMINAR permanentemente a sua conta? Todos os seus dados (sites, emails, faturas) serão removidos e esta ação NÃO pode ser desfeita."
        confirmText="Sim, Eliminar Minha Conta"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={() => {
          if (user) {
            auth.deleteUser(user.id);
            auth.logout();
            router.push('/');
          }
        }}
        onCancel={() => setDeleteAccountConfirm(false)}
      />
    </div>
  );
}
