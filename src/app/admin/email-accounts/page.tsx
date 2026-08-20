'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Mail, Plus, Search, RefreshCw, Trash2, Edit, Key, 
  ShieldCheck, User, CheckCircle2, XCircle, AlertCircle,
  Filter, Download, Upload, Home, Settings
} from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import PageLoader from '@/components/PageLoader';
import Link from 'next/link';
import { googleWorkspaceManager, GoogleEmailAccountResponse } from '@/lib/googleWorkspace';

export default function EmailAccountsPage() {
  const router = useRouter();
  const { user, loading } = useAuth({ redirectToAdmin: false, redirectToLogin: true });
  
  const [accounts, setAccounts] = useState<GoogleEmailAccountResponse[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended'>('all');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  
  // Form states
  const [selectedAccount, setSelectedAccount] = useState<GoogleEmailAccountResponse | null>(null);
  const [formData, setFormData] = useState({
    primaryEmail: '',
    name: '',
    password: '',
    recoveryEmail: '',
    suspended: false,
    isAdmin: false
  });
  
  // Message states
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  
  // Check if Google Workspace is configured
  const [isConfigured, setIsConfigured] = useState(false);
  
  useEffect(() => {
    setIsConfigured(googleWorkspaceManager.isConfigured());
  }, []);
  
  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };
  
  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const response = await fetch('/api/google-workspace/list-accounts');
      const data = await response.json();
      
      if (data.success) {
        setAccounts(data.accounts);
      } else {
        showMessage('Erro ao carregar contas: ' + data.error, 'error');
      }
    } catch (error) {
      showMessage('Erro ao carregar contas', 'error');
      console.error(error);
    } finally {
      setLoadingAccounts(false);
    }
  };
  
  useEffect(() => {
    if (isConfigured) {
      fetchAccounts();
    }
  }, [isConfigured]);
  
  const handleCreateAccount = async () => {
    try {
      const response = await fetch('/api/google-workspace/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        showMessage('Conta criada com sucesso!', 'success');
        setShowCreateModal(false);
        setFormData({ primaryEmail: '', name: '', password: '', recoveryEmail: '', suspended: false, isAdmin: false });
        fetchAccounts();
      } else {
        showMessage('Erro ao criar conta: ' + data.error, 'error');
      }
    } catch (error) {
      showMessage('Erro ao criar conta', 'error');
      console.error(error);
    }
  };
  
  const handleUpdateAccount = async () => {
    if (!selectedAccount) return;
    
    try {
      const response = await fetch('/api/google-workspace/update-account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: selectedAccount.primaryEmail,
          updates: {
            name: formData.name,
            suspended: formData.suspended,
            isAdmin: formData.isAdmin
          }
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showMessage('Conta atualizada com sucesso!', 'success');
        setShowEditModal(false);
        setSelectedAccount(null);
        fetchAccounts();
      } else {
        showMessage('Erro ao atualizar conta: ' + data.error, 'error');
      }
    } catch (error) {
      showMessage('Erro ao atualizar conta', 'error');
      console.error(error);
    }
  };
  
  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;
    
    try {
      const response = await fetch(`/api/google-workspace/delete-account?email=${selectedAccount.primaryEmail}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        showMessage('Conta deletada com sucesso!', 'success');
        setShowDeleteModal(false);
        setSelectedAccount(null);
        fetchAccounts();
      } else {
        showMessage('Erro ao deletar conta: ' + data.error, 'error');
      }
    } catch (error) {
      showMessage('Erro ao deletar conta', 'error');
      console.error(error);
    }
  };
  
  const handleResetPassword = async () => {
    if (!selectedAccount) return;
    
    try {
      const response = await fetch('/api/google-workspace/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: selectedAccount.primaryEmail,
          newPassword: formData.password || undefined
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showMessage('Senha resetada com sucesso!', 'success');
        setShowResetPasswordModal(false);
        setSelectedAccount(null);
        setFormData({ ...formData, password: '' });
      } else {
        showMessage('Erro ao resetar senha: ' + data.error, 'error');
      }
    } catch (error) {
      showMessage('Erro ao resetar senha', 'error');
      console.error(error);
    }
  };
  
  const openEditModal = (account: GoogleEmailAccountResponse) => {
    setSelectedAccount(account);
    setFormData({
      primaryEmail: account.primaryEmail,
      name: account.name,
      password: '',
      recoveryEmail: '',
      suspended: account.suspended,
      isAdmin: account.isAdmin
    });
    setShowEditModal(true);
  };
  
  const openDeleteModal = (account: GoogleEmailAccountResponse) => {
    setSelectedAccount(account);
    setShowDeleteModal(true);
  };
  
  const openResetPasswordModal = (account: GoogleEmailAccountResponse) => {
    setSelectedAccount(account);
    setFormData({ ...formData, password: '' });
    setShowResetPasswordModal(true);
  };
  
  // Filter accounts
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.primaryEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         account.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'active' && !account.suspended) ||
                         (filterStatus === 'suspended' && account.suspended);
    
    return matchesSearch && matchesFilter;
  });
  
  if (loading) return <PageLoader text="A carregar..." />;
  
  if (!user) return null;
  
  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Google Workspace Não Configurado</h2>
            <p className="text-gray-600 mb-6">
              Para gerenciar contas de email, você precisa configurar as credenciais do Google Workspace nas variáveis de ambiente.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
              <h3 className="font-semibold mb-2">Variáveis necessárias:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• GOOGLE_WORKSPACE_CLIENT_ID</li>
                <li>• GOOGLE_WORKSPACE_CLIENT_SECRET</li>
                <li>• GOOGLE_WORKSPACE_ADMIN_EMAIL</li>
                <li>• GOOGLE_WORKSPACE_DOMAIN</li>
              </ul>
            </div>
            <Link 
              href="/admin/settings"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Settings className="h-4 w-4 mr-2" />
              Ir para Configurações
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
              <Home className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Contas de Email</h1>
              <p className="text-gray-600">Gerenciar contas do Google Workspace</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchAccounts}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta
            </button>
          </div>
        </div>
        
        {/* Message */}
        {message && (
          <div className={`mb-4 p-4 rounded-lg ${
            messageType === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message}
          </div>
        )}
        
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por email ou nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativos</option>
              <option value="suspended">Suspensos</option>
            </select>
          </div>
        </div>
        
        {/* Accounts Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Criado em
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loadingAccounts ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                      Carregando contas...
                    </td>
                  </tr>
                ) : filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <Mail className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>Nenhuma conta de email encontrada</p>
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((account) => (
                    <tr key={account.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Mail className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{account.primaryEmail}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {account.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {account.suspended ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="h-3 w-3 mr-1" />
                            Suspenso
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Ativo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {account.isAdmin ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            Admin
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(account.creationTime).toLocaleDateString('pt-MZ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(account)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openResetPasswordModal(account)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Resetar Senha"
                          >
                            <Key className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(account)}
                            className="text-red-600 hover:text-red-900"
                            title="Deletar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-4">Criar Nova Conta de Email</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.primaryEmail}
                    onChange={(e) => setFormData({ ...formData, primaryEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="usuario@dominio.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nome Completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha (opcional)</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Deixe vazio para gerar automaticamente"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email de Recuperação</label>
                  <input
                    type="email"
                    value={formData.recoveryEmail}
                    onChange={(e) => setFormData({ ...formData, recoveryEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="recuperacao@email.com"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isAdmin}
                      onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Administrador</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateAccount}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Criar Conta
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Edit Modal */}
        {showEditModal && selectedAccount && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-4">Editar Conta de Email</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.primaryEmail}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.suspended}
                      onChange={(e) => setFormData({ ...formData, suspended: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Suspender Conta</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isAdmin}
                      onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Administrador</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateAccount}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Delete Modal */}
        {showDeleteModal && selectedAccount && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-4">Deletar Conta de Email</h2>
              <p className="text-gray-600 mb-6">
                Tem certeza que deseja deletar a conta <strong>{selectedAccount.primaryEmail}</strong>? Esta ação não pode ser desfeita.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Deletar
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Reset Password Modal */}
        {showResetPasswordModal && selectedAccount && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-4">Resetar Senha</h2>
              <p className="text-gray-600 mb-4">
                Resetar senha para <strong>{selectedAccount.primaryEmail}</strong>
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha (opcional)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Deixe vazio para gerar automaticamente"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowResetPasswordModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleResetPassword}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  Resetar Senha
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
