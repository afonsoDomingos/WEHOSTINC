'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Users, Server, Mail, Database, TrendingUp, DollarSign,
  LogOut, Settings, Home, CheckCircle, Clock, XCircle, Search,
  ShoppingBag, MessageSquare, ExternalLink
} from 'lucide-react';
import { auth, User } from '@/lib/auth';
import { dataManager, ServiceOrder } from '@/lib/data';

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');

  // Modal Novo Cliente State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('@Admin123@');
  const [newPlan, setNewPlan] = useState<'basic' | 'pro' | 'enterprise'>('pro');
  const [newDueDate, setNewDueDate] = useState<number>(29);
  const [newStatus, setNewStatus] = useState<'active' | 'pending' | 'suspended'>('active');
  const [createError, setCreateError] = useState('');

  const [orders, setOrders] = useState<ServiceOrder[]>([]);

  useEffect(() => {
    // Simulação de admin check
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }

    // Carregar dados
    setUsers(auth.getUsers());
    setSites(dataManager.getSites());
    setEmails(dataManager.getEmails());
    setOrders(dataManager.getOrders());
    setLoading(false);

    // Buscar usuários e pedidos atualizados do servidor via API
    auth.fetchUsersAsync().then((fetched) => {
      if (fetched && fetched.length > 0) {
        setUsers(fetched);
      }
    });

    dataManager.fetchOrdersAsync().then((fetched) => {
      if (fetched && fetched.length > 0) {
        setOrders(fetched);
      }
    });

    // Polling a cada 5s para sincronizar novos cadastros e pedidos em tempo real
    const interval = setInterval(() => {
      auth.fetchUsersAsync().then((fetched) => {
        if (fetched && fetched.length > 0) {
          setUsers(fetched);
        }
      });
      dataManager.fetchOrdersAsync().then((fetched) => {
        if (fetched && fetched.length > 0) {
          setOrders(fetched);
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [router]);

  const handleUpdateOrderStatus = (id: string, newStatus: ServiceOrder['status']) => {
    dataManager.updateOrderStatus(id, newStatus);
    setOrders(dataManager.getOrders());
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    try {
      auth.register(newName, newEmail, newPassword, newPlan, newStatus, newDueDate);
      setUsers(auth.getUsers());
      setShowAddModal(false);
      setNewName('');
      setNewEmail('');
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Erro ao cadastrar cliente.');
    }
  };

  const handleLogout = () => {
    auth.logout();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const totalRevenue = users.reduce((sum, user) => {
    const planPrices = { basic: 1200, pro: 3000, enterprise: 6200 };
    return sum + (planPrices[user.plan as keyof typeof planPrices] || 0);
  }, 0);

  const getUserStatus = (user: User) => {
    if (user.status === 'suspended') return 'suspended';

    const today = new Date();
    const currentDay = today.getDate();
    const dueDay = user.dueDate || 29;

    // Tolerância de 3 dias para pagamento: pendente entre dia 29 e +3 dias, suspenso após +5 dias
    if (currentDay > dueDay + 5) {
      return 'suspended';
    } else if (currentDay > dueDay) {
      return 'pending';
    }

    return user.status || 'active';
  };

  const filteredUsers = users.filter((user) => {
    const status = getUserStatus(user);
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'suspended':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <Server className="h-8 w-8 text-primary-600" />
                <span className="text-2xl font-bold text-gray-900">WEHOSTHERE</span>
              </Link>
              <span className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full border border-purple-200">
                ADMIN
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <Link
                href="/"
                className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 font-medium transition"
              >
                <Home className="h-5 w-5" />
                <span>Ver Site</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-red-600 font-medium transition"
              >
                <LogOut className="h-5 w-5" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 text-primary-600" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{users.length}</p>
            <p className="text-gray-500 text-sm mt-1">Usuários cadastrados</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <Server className="h-8 w-8 text-primary-600" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{sites.length}</p>
            <p className="text-gray-500 text-sm mt-1">Sites ativos</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <Mail className="h-8 w-8 text-primary-600" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{emails.length}</p>
            <p className="text-gray-500 text-sm mt-1">Contas de email</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="h-8 w-8 text-emerald-600" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">MRR</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalRevenue.toLocaleString('pt-MZ')} MT</p>
            <p className="text-gray-500 text-sm mt-1">Receita mensal</p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Usuários Cadastrados</h2>
              <p className="text-sm text-gray-500 mt-1">Gestão de clientes e assinaturas ativas</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">{users.length} usuários</span>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm rounded-lg shadow transition flex items-center space-x-2 cursor-pointer"
              >
                <span>+ Criar Novo Cliente</span>
              </button>
            </div>
          </div>

          {/* Search and Status Filters */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 pt-4 border-t border-gray-100">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cliente por nome ou e-mail..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center space-x-1.5 w-full md:w-auto overflow-x-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Todos ({users.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  statusFilter === 'active'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                Ativos ({users.filter(u => getUserStatus(u) === 'active').length})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  statusFilter === 'pending'
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                Pendentes ({users.filter(u => getUserStatus(u) === 'pending').length})
              </button>
              <button
                onClick={() => setStatusFilter('suspended')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  statusFilter === 'suspended'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                }`}
              >
                Suspensos ({users.filter(u => getUserStatus(u) === 'suspended').length})
              </button>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Nenhum cliente encontrado</h3>
              <p className="text-gray-500">Tente ajustar a busca ou o filtro de status</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Nome</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Email</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Plano</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Vencimento</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Cadastro</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/80 transition">
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-gray-900">{user.name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 font-mono text-sm">{user.email}</td>
                      <td className="py-3.5 px-4">
                        <select
                          value={user.plan}
                          onChange={(e) => {
                            auth.updatePlan(user.id, e.target.value as any);
                            setUsers(auth.getUsers());
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold outline-none border cursor-pointer ${
                            user.plan === 'basic' ? 'bg-gray-100 text-gray-800 border-gray-300' :
                            user.plan === 'pro' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                            'bg-purple-50 text-purple-800 border-purple-300'
                          }`}
                        >
                          <option value="basic">Básico (1.200 MT)</option>
                          <option value="pro">Profissional (3.000 MT)</option>
                          <option value="enterprise">Empresarial (6.200 MT)</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 text-sm font-medium">
                        {user.dueDate ? `Dia ${user.dueDate}` : 'Dia 29'}
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={getUserStatus(user)}
                          onChange={(e) => {
                            auth.updateUserStatus(user.id, e.target.value as any);
                            setUsers(auth.getUsers());
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold outline-none border cursor-pointer ${
                            getUserStatus(user) === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : getUserStatus(user) === 'pending'
                              ? 'bg-amber-50 text-amber-700 border-amber-300'
                              : 'bg-red-50 text-red-700 border-red-300'
                          }`}
                        >
                          <option value="active">Ativo (✓)</option>
                          <option value="pending">Pendente (⏰)</option>
                          <option value="suspended">Suspenso (✗)</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 text-sm">
                        {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => {
                              const newStatus = getUserStatus(user) === 'suspended' ? 'active' : 'suspended';
                              auth.updateUserStatus(user.id, newStatus);
                              setUsers(auth.getUsers());
                            }}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                              getUserStatus(user) === 'suspended'
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                            }`}
                          >
                            {getUserStatus(user) === 'suspended' ? 'Reativar' : 'Suspender'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Gestão de Pedidos de Serviços */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <ShoppingBag className="h-6 w-6 text-primary-600" />
                <span>Gestão de Pedidos & Serviços</span>
              </h2>
              <p className="text-sm text-gray-500 mt-1">Acompanhamento de solicitações de hospedagem e criação de sites</p>
            </div>
            <div className="flex items-center space-x-2 bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-200 text-primary-700 font-semibold text-xs">
              <span>{orders.length} pedidos totais</span>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Nenhum pedido de serviço recebido</h3>
              <p className="text-gray-500">Os pedidos efetuados no checkout aparecerão aqui</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">ID / Data</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Cliente / Contato</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Serviço Solicidado</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Valor / Método</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Status do Pedido</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/80 transition">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-gray-900 text-sm block">{order.id}</span>
                        <span className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-gray-900 block">{order.clientName}</span>
                        <span className="text-xs text-gray-500 block">{order.clientEmail}</span>
                        <span className="text-xs text-emerald-600 font-medium">{order.clientPhone}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-gray-900 text-sm">{order.serviceName}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-emerald-600 block">{order.amount.toLocaleString('pt-MZ')} MT</span>
                        <span className="text-xs font-semibold uppercase text-gray-500">{order.paymentMethod}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as any)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold outline-none border cursor-pointer ${
                            order.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : order.status === 'in_progress'
                              ? 'bg-blue-50 text-blue-700 border-blue-300'
                              : order.status === 'pending'
                              ? 'bg-amber-50 text-amber-700 border-amber-300'
                              : 'bg-red-50 text-red-700 border-red-300'
                          }`}
                        >
                          <option value="pending">Pendente (⏰)</option>
                          <option value="in_progress">Em Desenvolvimento (⚙️)</option>
                          <option value="completed">Concluído (✓)</option>
                          <option value="cancelled">Cancelado (✗)</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4">
                        <a
                          href={`https://wa.me/${order.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${order.clientName}, sobre o seu pedido (${order.serviceName})...`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-lg transition inline-flex items-center space-x-1 border border-emerald-200"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Atividade Recente</h2>
          <div className="space-y-4">
            {users.length > 0 && (
              <div className="flex items-center space-x-4 p-4 bg-gray-50 border border-gray-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Novo usuário cadastrado</p>
                  <p className="text-sm text-gray-600">{users[users.length - 1].name} ({users[users.length - 1].email})</p>
                </div>
                <span className="text-xs font-medium text-gray-400">Agora</span>
              </div>
            )}
            {sites.length > 0 && (
              <div className="flex items-center space-x-4 p-4 bg-gray-50 border border-gray-100 rounded-lg">
                <Server className="h-5 w-5 text-primary-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Novo site adicionado</p>
                  <p className="text-sm text-gray-600">{sites[sites.length - 1].name}</p>
                </div>
                <span className="text-xs font-medium text-gray-400">Recentemente</span>
              </div>
            )}
            {emails.length > 0 && (
              <div className="flex items-center space-x-4 p-4 bg-gray-50 border border-gray-100 rounded-lg">
                <Mail className="h-5 w-5 text-primary-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Nova conta de email criada</p>
                  <p className="text-sm text-gray-600">{emails[emails.length - 1].email}</p>
                </div>
                <span className="text-xs font-medium text-gray-400">Recentemente</span>
              </div>
            )}
            {users.length === 0 && sites.length === 0 && emails.length === 0 && (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Nenhuma atividade recente</p>
              </div>
            )}
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Distribuição de Planos</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-600">Básico</span>
                  <span className="text-sm font-bold text-gray-900">
                    {users.filter(u => u.plan === 'basic').length}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-gray-400 h-2 rounded-full"
                    style={{
                      width: users.length > 0
                        ? `${(users.filter(u => u.plan === 'basic').length / users.length) * 100}%`
                        : '0%'
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-600">Profissional</span>
                  <span className="text-sm font-bold text-gray-900">
                    {users.filter(u => u.plan === 'pro').length}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: users.length > 0
                        ? `${(users.filter(u => u.plan === 'pro').length / users.length) * 100}%`
                        : '0%'
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-600">Empresarial</span>
                  <span className="text-sm font-bold text-gray-900">
                    {users.filter(u => u.plan === 'enterprise').length}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{
                      width: users.length > 0
                        ? `${(users.filter(u => u.plan === 'enterprise').length / users.length) * 100}%`
                        : '0%'
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm md:col-span-2">
            <h3 className="font-bold text-gray-900 mb-4">Ações Rápidas</h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center space-x-3 p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 rounded-xl transition font-medium">
                <Users className="h-5 w-5 text-primary-600" />
                <span>Gerenciar Usuários</span>
              </button>
              <button className="flex items-center space-x-3 p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 rounded-xl transition font-medium">
                <Server className="h-5 w-5 text-primary-600" />
                <span>Gerenciar Sites</span>
              </button>
              <button className="flex items-center space-x-3 p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 rounded-xl transition font-medium">
                <Mail className="h-5 w-5 text-primary-400 text-primary-600" />
                <span>Gerenciar Emails</span>
              </button>
              <button className="flex items-center space-x-3 p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 rounded-xl transition font-medium">
                <Settings className="h-5 w-5 text-primary-600" />
                <span>Configurações</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Criar Novo Cliente */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-1">Cadastrar Novo Cliente</h3>
            <p className="text-sm text-gray-500 mb-6">Preencha as informações para cadastrar o cliente manualmente</p>

            {createError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm mb-4">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nome do Cliente / Empresa</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: MSServices"
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">E-mail</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Ex: info@msservices.co.mz"
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Senha Inicial</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Plano</label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="basic">Básico (1.200 MT)</option>
                    <option value="pro">Profissional (3.000 MT)</option>
                    <option value="enterprise">Empresarial (6.200 MT)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Dia de Vencimento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Status Inicial</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="active">Ativo (✓)</option>
                  <option value="pending">Pendente (⏰)</option>
                  <option value="suspended">Suspenso (✗)</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold shadow transition"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
