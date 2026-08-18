'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  ShoppingBag, Clock, CheckCircle, XCircle, AlertCircle, 
  FileText, ExternalLink, Play, Star, ArrowRight, Upload, Search, Filter, Sparkles, Check
} from 'lucide-react';
import { auth, User } from '@/lib/auth';
import { dataManager, SystemForRent, RentalRequest, SystemAccess } from '@/lib/data';
import DashboardNav from '@/components/DashboardNav';
import DashboardSidebar from '@/components/DashboardSidebar';
import PageLoader from '@/components/PageLoader';

export default function DashboardSystemsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rentSystemId = searchParams.get('rent');
  const { data: session, status } = useSession();
  
  const [user, setUser] = useState<User | null>(null);
  const [systems, setSystems] = useState<SystemForRent[]>([]);
  const [filteredSystems, setFilteredSystems] = useState<SystemForRent[]>([]);
  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const [accesses, setAccesses] = useState<SystemAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRentModal, setShowRentModal] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<SystemForRent | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'emola' | 'card' | 'bank_transfer'>('mpesa');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    // Aguardar NextAuth carregar
    if (status === 'loading') return;
    
    let currentUser: User | null = null;
    
    // Tentar NextAuth primeiro
    if (status === 'authenticated' && session?.user) {
      currentUser = {
        id: (session.user as any)?.id || session.user.email || '',
        name: session.user.name || '',
        email: session.user.email || '',
        plan: (session.user as any)?.plan || 'none',
        status: (session.user as any)?.status || 'active',
        role: (session.user as any)?.role || 'user',
        avatar: session.user.image || undefined,
        dueDate: (session.user as any)?.dueDate,
        createdAt: (session.user as any)?.createdAt || new Date().toISOString()
      };
    }
    
    // Fallback para sistema customizado (se NextAuth falhar ou não estiver autenticado)
    if (!currentUser) {
      currentUser = auth.getCurrentUser();
    }
    
    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (currentUser.role === 'admin' || currentUser.email.toLowerCase() === 'admin@wehosthere.com') {
      router.push('/admin');
      return;
    }
    setUser(currentUser);

    // Carregar dados
    const loadData = async () => {
      const [fetchedSystems, fetchedRequests, fetchedAccesses] = await Promise.all([
        dataManager.fetchSystemsForRentAsync(),
        dataManager.fetchRentalRequestsAsync(),
        dataManager.fetchSystemAccessesAsync()
      ]);

      const activeSystems = fetchedSystems.filter((s: SystemForRent) => s.isActive && s.approvalStatus === 'approved');
      setSystems(activeSystems);
      setFilteredSystems(activeSystems);
      setRequests(fetchedRequests.filter((r: RentalRequest) => 
        r.clientEmail.toLowerCase() === currentUser.email.toLowerCase()
      ));
      setAccesses(dataManager.getClientSystemAccesses(currentUser.email));
      setLoading(false);

      // Se houver parâmetro rent, abrir modal
      if (rentSystemId) {
        const systemToRent = activeSystems.find((s: SystemForRent) => s.id === rentSystemId);
        if (systemToRent) {
          setSelectedSystem(systemToRent);
          setShowRentModal(true);
        }
      }
    };

    loadData();
  }, [router, rentSystemId, session, status]);

  // Filtragem de sistemas
  useEffect(() => {
    let filtered = systems;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.shortDescription.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(s => s.category === selectedCategory);
    }
    setFilteredSystems(filtered);
  }, [searchQuery, selectedCategory, systems]);

  const handleLogout = () => {
    auth.logout();
    router.push('/');
  };

  const handleRentClick = (system: SystemForRent) => {
    setSelectedSystem(system);
    setShowRentModal(true);
  };

  const handleRentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSystem || !user) return;

    const isFree = selectedSystem.isFree || selectedSystem.monthlyPrice === 0;
    const amount = isFree ? 0 : (billingCycle === 'monthly' ? selectedSystem.monthlyPrice : selectedSystem.yearlyPrice);
    const totalAmount = (isFree || !selectedSystem.setupFee) ? amount : amount + selectedSystem.setupFee;

    const requestData: Omit<RentalRequest, 'id' | 'createdAt'> = {
      systemId: selectedSystem.id,
      systemName: selectedSystem.name,
      clientName: user.name,
      clientEmail: user.email,
      clientPhone: user.email,
      billingCycle,
      amount: totalAmount,
      paymentMethod,
      proofUrl: proofFile ? URL.createObjectURL(proofFile) : undefined,
      proofName: proofFile ? proofFile.name : undefined,
      status: 'pending'
    };

    dataManager.addRentalRequest(requestData);
    setShowRentModal(false);
    setSelectedSystem(null);
    setProofFile(null);

    // Recarregar pedidos
    const updatedRequests = await dataManager.fetchRentalRequestsAsync();
    setRequests(updatedRequests.filter(r => 
      r.clientEmail.toLowerCase() === user.email.toLowerCase()
    ));
  };

  const getStatusIcon = (status: RentalRequest['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-gray-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprovado';
      case 'rejected':
        return 'Rejeitado';
      case 'cancelled':
        return 'Cancelado';
      case 'pending':
        return 'Pendente';
      default:
        return status;
    }
  };

  if (loading) {
    return <PageLoader text="A carregar sistemas..." />;
  }

  if (!user) return null;

  const categories = [
    { value: 'all', label: 'Todas Categorias' },
    { value: 'Finanças & Contabilidade', label: 'Finanças' },
    { value: 'Educação & Eventos', label: 'Educação' },
    { value: 'Marketing & Vendas', label: 'Marketing' },
    { value: 'Gestão', label: 'Gestão' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav userName={user.name} userAvatar={user.avatar} onLogout={handleLogout} />

      <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
        <div className="grid lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 w-full">
          {/* Sidebar (Desktop) */}
          <div className="hidden lg:block lg:col-span-1">
            <DashboardSidebar />
          </div>

          {/* Main Content */}
          <div className="col-span-1 lg:col-span-3 space-y-4 sm:space-y-6 w-full min-w-0">
            {/* Header Banner Interno */}
            <div className="bg-gradient-to-r from-primary-600 via-purple-600 to-indigo-700 rounded-2xl p-4 sm:p-6 text-white shadow-md">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">Sistemas Prontos para Aluguer</h1>
                  <p className="text-xs sm:text-sm text-purple-100 mt-1 max-w-xl">
                    Escolha soluções digitais completas por assinatura. Alugue e gerencie tudo diretamente pelo seu painel.
                  </p>
                </div>
                <a
                  href="#catalogo-disponivel"
                  className="inline-flex items-center space-x-2 bg-white text-primary-700 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl hover:bg-purple-50 transition shadow-sm shrink-0"
                >
                  <Sparkles className="h-4 w-4 text-primary-600" />
                  <span>Explorar Catálogo</span>
                </a>
              </div>
            </div>

            {/* Meus Acessos Ativos */}
            {accesses.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 w-full">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <span>Meus Sistemas Ativos</span>
                </h2>
                <div className="space-y-4">
                  {accesses.map((access) => (
                    <div key={access.id} className="border border-green-200 rounded-xl p-4 bg-gradient-to-r from-green-50 to-emerald-50 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-base mb-1">{access.systemName}</h3>
                          <p className="text-xs text-gray-600 mb-3">
                            Ciclo de Pagamento: <strong>{access.billingCycle === 'monthly' ? 'Mensal' : 'Anual'}</strong>
                          </p>
                          <div className="bg-white rounded-xl p-3 border border-green-200 shadow-2xs space-y-1">
                            <p className="text-xs text-gray-700">
                              <strong>URL de Acesso:</strong> <a href={access.credentials?.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 font-medium hover:underline">{access.credentials?.url || 'N/A'}</a>
                            </p>
                            <p className="text-xs text-gray-700">
                              <strong>Usuário:</strong> <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800 font-mono">{access.credentials?.username || 'N/A'}</code>
                            </p>
                            <p className="text-xs text-gray-700">
                              <strong>Senha:</strong> <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800 font-mono">{access.credentials?.password || 'N/A'}</code>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                            Ativo
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pedidos de Aluguer Pendentes / Histórico */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 w-full">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Meus Pedidos de Aluguer</h2>
              {requests.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-xl">
                  <ShoppingBag className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-xs sm:text-sm font-medium">Você ainda não realizou nenhum pedido de aluguer.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((request) => (
                    <div key={request.id} className="border border-gray-200 rounded-xl p-3.5 bg-gray-50/50">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-900 text-sm truncate">{request.systemName}</h3>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(request.status)}
                              <span className="text-xs font-semibold text-gray-600">
                                {getStatusText(request.status)}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600">
                            Plano: {request.billingCycle === 'monthly' ? 'Mensal' : 'Anual'} | Valor: <strong>{request.amount.toLocaleString('pt-MZ')} MT</strong>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Seção Catálogo de Sistemas Disponíveis (Interno no Dashboard) */}
            <div id="catalogo-disponivel" className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Catálogo de Sistemas Disponíveis</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Selecione um sistema abaixo para solicitar a ativação imediata na sua conta.
                </p>
              </div>

              {/* Busca e Filtros */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Buscar sistemas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Grid de Sistemas */}
              {filteredSystems.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500 text-sm">Nenhum sistema encontrado com os filtros selecionados.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {filteredSystems.map((system) => {
                    const isFree = system.isFree || system.monthlyPrice === 0;

                    return (
                      <div
                        key={system.id}
                        className="bg-white border border-gray-200 hover:border-primary-300 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md group"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="text-[10px] font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                              {system.category}
                            </span>
                            {isFree && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                GRÁTIS
                              </span>
                            )}
                          </div>

                          <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-2 group-hover:text-primary-600 transition">
                            {system.name}
                          </h3>
                          <p className="text-xs text-gray-600 line-clamp-3 mb-4">
                            {system.shortDescription}
                          </p>

                          {/* Recursos Principais */}
                          {system.features && system.features.length > 0 && (
                            <ul className="space-y-1.5 mb-4 border-t border-gray-100 pt-3">
                              {system.features.slice(0, 3).map((feat, idx) => (
                                <li key={idx} className="flex items-center text-[11px] text-gray-700">
                                  <Check className="h-3.5 w-3.5 text-emerald-500 mr-1.5 shrink-0" />
                                  <span className="truncate">{feat}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {/* Preço e Ação */}
                        <div className="border-t border-gray-100 pt-4 mt-2">
                          <div className="flex items-baseline justify-between mb-3">
                            <div>
                              {isFree ? (
                                <span className="text-lg font-extrabold text-emerald-600">Grátis</span>
                              ) : (
                                <div>
                                  <span className="text-lg font-extrabold text-gray-900">{system.monthlyPrice.toLocaleString('pt-MZ')} MT</span>
                                  <span className="text-xs text-gray-500"> /mês</span>
                                </div>
                              )}
                            </div>
                            {system.demoUrl && (
                              <a
                                href={system.demoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-semibold text-primary-600 hover:underline inline-flex items-center"
                              >
                                <span>Demo</span>
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            )}
                          </div>

                          <button
                            onClick={() => handleRentClick(system)}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition flex items-center justify-center space-x-1.5 shadow-sm"
                          >
                            <span>{isFree ? 'Ativar Agora' : 'Alugar Sistema'}</span>
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Aluguer */}
      {showRentModal && selectedSystem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Solicitar Aluguer</h2>
              <button
                onClick={() => {
                  setShowRentModal(false);
                  setSelectedSystem(null);
                  setProofFile(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <XCircle className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="mb-4">
              <h3 className="font-bold text-gray-900 mb-1">{selectedSystem.name}</h3>
              <p className="text-xs text-gray-600">{selectedSystem.shortDescription}</p>
            </div>

            <form onSubmit={handleRentSubmit} className="space-y-4">
              {(selectedSystem.isFree || selectedSystem.monthlyPrice === 0) ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl space-y-2">
                    <div className="flex items-center space-x-2 text-emerald-950 font-bold text-sm">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                      <span>Sistema 100% Gratuito</span>
                    </div>
                    <p className="text-xs text-emerald-800">
                      Este sistema é disponibilizado sem qualquer taxa de mensalidade, anuidade ou taxa de instalação.
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-600">Total a pagar:</span>
                      <span className="font-bold text-emerald-600">0 MT (Grátis)</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center space-x-2 text-sm shadow-md"
                  >
                    <span>Ativar Acesso Gratuito</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Ciclo de Pagamento</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setBillingCycle('monthly')}
                        className={`p-3 rounded-xl border-2 transition text-left ${
                          billingCycle === 'monthly'
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-base font-bold">{selectedSystem.monthlyPrice.toLocaleString('pt-MZ')} MT</div>
                        <div className="text-xs text-gray-600">Mensal</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingCycle('yearly')}
                        className={`p-3 rounded-xl border-2 transition text-left ${
                          billingCycle === 'yearly'
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-base font-bold">{selectedSystem.yearlyPrice.toLocaleString('pt-MZ')} MT</div>
                        <div className="text-xs text-gray-600">Anual</div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Método de Pagamento</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="mpesa">M-Pesa</option>
                      <option value="emola">eMola</option>
                      <option value="card">Cartão</option>
                      <option value="bank_transfer">Transferência Bancária</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Comprovativo de Pagamento (Opcional)</label>
                    <input
                      type="file"
                      onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center space-x-2 text-sm shadow-md"
                  >
                    <span>Enviar Pedido de Aluguer</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
