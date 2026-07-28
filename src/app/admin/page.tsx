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
  const [sites, setSites] = useState(dataManager.getSites());
  const [emails, setEmails] = useState(dataManager.getEmails());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulação de admin check - em produção, verificar permissões reais
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const totalRevenue = users.reduce((sum, user) => {
    const planPrices = { basic: 19, pro: 49, enterprise: 99 };
    return sum + (planPrices[user.plan as keyof typeof planPrices] || 0);
  }, 0);

  const getUserStatus = (user: User) => {
    // Simulação de status do usuário
    return 'active';
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

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <Server className="h-8 w-8 text-primary-400" />
                <span className="text-2xl font-bold">WEHOSTHERE</span>
              </Link>
              <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                ADMIN
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition"
              >
                <Home className="h-5 w-5" />
                <span>Ver Site</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition"
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
          <div className="bg-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 text-primary-400" />
              <span className="text-sm text-gray-400">Total</span>
            </div>
            <p className="text-3xl font-bold">{users.length}</p>
            <p className="text-gray-400 text-sm">Usuários cadastrados</p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Server className="h-8 w-8 text-primary-400" />
              <span className="text-sm text-gray-400">Total</span>
            </div>
            <p className="text-3xl font-bold">{sites.length}</p>
            <p className="text-gray-400 text-sm">Sites ativos</p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Mail className="h-8 w-8 text-primary-400" />
              <span className="text-sm text-gray-400">Total</span>
            </div>
            <p className="text-3xl font-bold">{emails.length}</p>
            <p className="text-gray-400 text-sm">Contas de email</p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="h-8 w-8 text-green-400" />
              <span className="text-sm text-gray-400">MRR</span>
            </div>
            <p className="text-3xl font-bold">R$ {totalRevenue}</p>
            <p className="text-gray-400 text-sm">Receita mensal</p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Usuários Cadastrados</h2>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-gray-400" />
              <span className="text-gray-400">{users.length} usuários</span>
            </div>
          </div>

          {users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum usuário cadastrado</h3>
              <p className="text-gray-400">Os usuários aparecerão aqui quando se cadastrarem</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Nome</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Email</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Plano</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Cadastro</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                      <td className="py-3 px-4">
                        <span className="font-medium">{user.name}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-300">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.plan === 'basic' ? 'bg-gray-600 text-gray-200' :
                          user.plan === 'pro' ? 'bg-primary-600 text-white' :
                          'bg-purple-600 text-white'
                        }`}>
                          {user.plan === 'basic' ? 'Básico' : user.plan === 'pro' ? 'Profissional' : 'Empresarial'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(getUserStatus(user))}
                          <span className="text-sm">Ativo</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-gray-400 hover:text-white transition">
                            <Settings className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-red-400 transition">
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
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-6">Atividade Recente</h2>
          <div className="space-y-4">
            {users.length > 0 && (
              <div className="flex items-center space-x-4 p-4 bg-gray-700/50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <div className="flex-1">
                  <p className="font-medium">Novo usuário cadastrado</p>
                  <p className="text-sm text-gray-400">{users[users.length - 1].name} ({users[users.length - 1].email})</p>
                </div>
                <span className="text-sm text-gray-400">Agora</span>
              </div>
            )}
            {sites.length > 0 && (
              <div className="flex items-center space-x-4 p-4 bg-gray-700/50 rounded-lg">
                <Server className="h-5 w-5 text-primary-400" />
                <div className="flex-1">
                  <p className="font-medium">Novo site adicionado</p>
                  <p className="text-sm text-gray-400">{sites[sites.length - 1].name}</p>
                </div>
                <span className="text-sm text-gray-400">Recentemente</span>
              </div>
            )}
            {emails.length > 0 && (
              <div className="flex items-center space-x-4 p-4 bg-gray-700/50 rounded-lg">
                <Mail className="h-5 w-5 text-primary-400" />
                <div className="flex-1">
                  <p className="font-medium">Nova conta de email criada</p>
                  <p className="text-sm text-gray-400">{emails[emails.length - 1].email}</p>
                </div>
                <span className="text-sm text-gray-400">Recentemente</span>
              </div>
            )}
            {users.length === 0 && sites.length === 0 && emails.length === 0 && (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Nenhuma atividade recente</p>
              </div>
            )}
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="font-bold mb-4">Distribuição de Planos</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-400">Básico</span>
                  <span className="text-sm font-medium">
                    {users.filter(u => u.plan === 'basic').length}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gray-500 h-2 rounded-full"
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
                  <span className="text-sm text-gray-400">Profissional</span>
                  <span className="text-sm font-medium">
                    {users.filter(u => u.plan === 'pro').length}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full"
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
                  <span className="text-sm text-gray-400">Empresarial</span>
                  <span className="text-sm font-medium">
                    {users.filter(u => u.plan === 'enterprise').length}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
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

          <div className="bg-gray-800 rounded-xl p-6 md:col-span-2">
            <h3 className="font-bold mb-4">Ações Rápidas</h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center space-x-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition">
                <Users className="h-5 w-5 text-primary-400" />
                <span>Gerenciar Usuários</span>
              </button>
              <button className="flex items-center space-x-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition">
                <Server className="h-5 w-5 text-primary-400" />
                <span>Gerenciar Sites</span>
              </button>
              <button className="flex items-center space-x-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition">
                <Mail className="h-5 w-5 text-primary-400" />
                <span>Gerenciar Emails</span>
              </button>
              <button className="flex items-center space-x-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition">
                <Settings className="h-5 w-5 text-primary-400" />
                <span>Configurações</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
