'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Mail, Plus, Trash2, Settings, CheckCircle, Clock, XCircle,
  LayoutDashboard, Globe, Database, Settings as SettingsIcon, LogOut, Server
} from 'lucide-react';
import { auth, User } from '@/lib/auth';
import { dataManager, EmailAccount } from '@/lib/data';

export default function EmailPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [emails, setEmails] = useState<EmailAccount[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    setEmails(dataManager.getEmails());
    setLoading(false);
  }, [router]);

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) return;

    const newEmailAccount = dataManager.addEmail({
      email: newEmail,
      status: 'pending',
      storage: 0
    });

    setEmails([...emails, newEmailAccount]);
    setShowModal(false);
    setNewEmail('');
    setNewPassword('');
  };

  const handleDeleteEmail = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta conta de email?')) {
      dataManager.deleteEmail(id);
      setEmails(emails.filter(e => e.id !== id));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'suspended':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'pending':
        return 'Pendente';
      case 'suspended':
        return 'Suspenso';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) return null;

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
                  className="flex items-center space-x-3 px-4 py-3 bg-primary-50 text-primary-700 rounded-lg"
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
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition"
                >
                  <SettingsIcon className="h-5 w-5" />
                  <span>Configurações</span>
                </Link>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Contas de Email</h1>
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
                >
                  <Plus className="h-5 w-5" />
                  <span>Nova Conta</span>
                </button>
              </div>

              {emails.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma conta configurada</h3>
                  <p className="text-gray-600 mb-4">Crie sua primeira conta de email profissional</p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition mx-auto"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Nova Conta</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {emails.map((email) => (
                    <div key={email.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="bg-primary-100 p-3 rounded-lg">
                            <Mail className="h-6 w-6 text-primary-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{email.email}</h3>
                            <p className="text-sm text-gray-600">Conta profissional</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(email.status)}
                            <span className="text-sm text-gray-600">{getStatusText(email.status)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="p-2 text-gray-600 hover:text-primary-600 transition">
                              <Settings className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteEmail(email.id)}
                              className="p-2 text-gray-600 hover:text-red-600 transition"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Armazenamento</p>
                          <p className="font-semibold text-gray-900">{email.storage} GB</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Criado em</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(email.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Email Configuration Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
              <h3 className="font-semibold text-blue-900 mb-2">Configuração de Email</h3>
              <p className="text-blue-800 text-sm mb-4">
                Configure seu cliente de email preferido usando as seguintes informações:
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-blue-900">Servidor POP3:</p>
                  <p className="text-blue-800">mail.wehosthere.com</p>
                </div>
                <div>
                  <p className="font-medium text-blue-900">Servidor IMAP:</p>
                  <p className="text-blue-800">mail.wehosthere.com</p>
                </div>
                <div>
                  <p className="font-medium text-blue-900">Servidor SMTP:</p>
                  <p className="text-blue-800">smtp.wehosthere.com</p>
                </div>
                <div>
                  <p className="font-medium text-blue-900">Porta:</p>
                  <p className="text-blue-800">587 (TLS)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Nova Conta de Email</h2>
            <form onSubmit={handleAddEmail} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço de Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="contato@seusite.com"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                  Criar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
