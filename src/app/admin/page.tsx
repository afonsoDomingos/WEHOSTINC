'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Users, Server, Mail, Database, TrendingUp, DollarSign,
  LogOut, Settings, Home, CheckCircle, Clock, XCircle
} from 'lucide-react';
import { auth, User } from '@/lib/auth';
import { dataManager } from '@/lib/data';

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    setLoading(false);
  }, [router]);

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
    const planPrices = { basic: 19, pro: 49, enterprise: 99 };
    return sum + (planPrices[user.plan as keyof typeof planPrices] || 0);
  }, 0);

  const getUserStatus = (user: User) => {
    return user.status || 'active';
  };

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
            <p className="text-3xl font-bold text-gray-900">${totalRevenue} USD</p>
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
            <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">{users.length} usuários</span>
            </div>
          </div>

          {users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Nenhum usuário cadastrado</h3>
              <p className="text-gray-500">Os usuários aparecerão aqui quando se cadastrarem</p>
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
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/80 transition">
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-gray-900">{user.name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 font-mono text-sm">{user.email}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          user.plan === 'basic' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                          user.plan === 'pro' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-purple-50 text-purple-700 border-purple-200'
                        }`}>
                          {user.plan === 'basic' ? 'Básico' : user.plan === 'pro' ? 'Profissional' : 'Empresarial'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 text-sm font-medium">
                        {user.dueDate ? `Dia ${user.dueDate}` : 'Dia 29'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(getUserStatus(user))}
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {getUserStatus(user) === 'active' ? 'Ativo' : getUserStatus(user)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 text-sm">
                        {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition" title="Configurações">
                            <Settings className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Suspender">
                            <XCircle className="h-4 w-4" />
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
    </div>
  );
}
