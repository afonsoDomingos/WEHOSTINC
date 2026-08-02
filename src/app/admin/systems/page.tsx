'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Star, CheckCircle, XCircle, Clock, Plus, Edit, Trash2, 
  ExternalLink, Search, Filter, Check, AlertCircle, ShoppingBag
} from 'lucide-react';
import { auth, User } from '@/lib/auth';
import { dataManager, SystemForRent, RentalRequest, SystemAccess } from '@/lib/data';
import PageLoader from '@/components/PageLoader';
import Toast from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';

export default function AdminSystemsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [systems, setSystems] = useState<SystemForRent[]>([]);
  const [rentalRequests, setRentalRequests] = useState<RentalRequest[]>([]);
  const [systemAccesses, setSystemAccesses] = useState<SystemAccess[]>([]);
  const [activeTab, setActiveTab] = useState<'systems' | 'requests' | 'accesses'>('systems');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RentalRequest | null>(null);
  const [accessUsername, setAccessUsername] = useState('');
  const [accessPassword, setAccessPassword] = useState('');
  const [accessUrl, setAccessUrl] = useState('');
  
  const [showAddSystemModal, setShowAddSystemModal] = useState(false);
  const [editingSystem, setEditingSystem] = useState<SystemForRent | null>(null);
  const [newSystem, setNewSystem] = useState({
    name: '',
    shortDescription: '',
    description: '',
    category: '',
    monthlyPrice: 0,
    yearlyPrice: 0,
    setupFee: 0,
    features: [] as string[],
    demoUrl: '',
    image: ''
  });
  const [newFeature, setNewFeature] = useState('');
  
  const [toastMsg, setToastMsg] = useState<{ title?: string; message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [confirmModalData, setConfirmModalData] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info' | 'success';
  } | null>(null);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (currentUser.role !== 'admin' && currentUser.email.toLowerCase() !== 'admin@wehosthere.com') {
      router.push('/dashboard');
      return;
    }
    setUser(currentUser);

    const loadData = async () => {
      const [fetchedSystems, fetchedRequests, fetchedAccesses] = await Promise.all([
        dataManager.fetchSystemsForRentAsync(),
        dataManager.fetchRentalRequestsAsync(),
        dataManager.fetchSystemAccessesAsync()
      ]);
      setSystems(fetchedSystems);
      setRentalRequests(fetchedRequests);
      setSystemAccesses(fetchedAccesses);
      setLoading(false);
    };

    loadData();

    // Polling
    const interval = setInterval(() => {
      Promise.all([
        dataManager.fetchSystemsForRentAsync().then(s => setSystems(s)),
        dataManager.fetchRentalRequestsAsync().then(r => setRentalRequests(r)),
        dataManager.fetchSystemAccessesAsync().then(a => setSystemAccesses(a))
      ]);
    }, 5000);

    return () => clearInterval(interval);
  }, [router]);

  const handleApproveSystem = (systemId: string) => {
    dataManager.updateSystemForRent(systemId, { approvalStatus: 'approved', isActive: true });
    setSystems(systems.map(s => s.id === systemId ? { ...s, approvalStatus: 'approved', isActive: true } : s));
    setToastMsg({ title: 'Sistema Aprovado', message: 'O sistema foi aprovado e está disponível para aluguer.', type: 'success' });
  };

  const handleRejectSystem = (systemId: string, reason: string) => {
    dataManager.updateSystemForRent(systemId, { approvalStatus: 'rejected', rejectionReason: reason, isActive: false });
    setSystems(systems.map(s => s.id === systemId ? { ...s, approvalStatus: 'rejected', rejectionReason: reason, isActive: false } : s));
    setToastMsg({ title: 'Sistema Rejeitado', message: 'O sistema foi rejeitado.', type: 'warning' });
  };

  const handleDeleteSystem = (systemId: string) => {
    dataManager.deleteSystemForRent(systemId);
    setSystems(systems.filter(s => s.id !== systemId));
    setToastMsg({ title: 'Sistema Removido', message: 'O sistema foi removido com sucesso.', type: 'success' });
  };

  const handleApproveRentalRequest = (requestId: string) => {
    const request = rentalRequests.find(r => r.id === requestId);
    if (!request) return;

    dataManager.updateRentalRequest(requestId, { status: 'approved', approvedAt: new Date().toISOString() });
    setRentalRequests(rentalRequests.map(r => r.id === requestId ? { ...r, status: 'approved', approvedAt: new Date().toISOString() } : r));
    setSelectedRequest(request);
    setShowAccessModal(true);
    setToastMsg({ title: 'Pedido Aprovado', message: 'Agora forneça as credenciais de acesso ao cliente.', type: 'success' });
  };

  const handleRejectRentalRequest = (requestId: string, reason: string) => {
    dataManager.updateRentalRequest(requestId, { status: 'rejected', rejectedAt: new Date().toISOString(), rejectionReason: reason });
    setRentalRequests(rentalRequests.map(r => r.id === requestId ? { ...r, status: 'rejected', rejectedAt: new Date().toISOString(), rejectionReason: reason } : r));
    setToastMsg({ title: 'Pedido Rejeitado', message: 'O pedido foi rejeitado.', type: 'warning' });
  };

  const handleCreateSystemAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (selectedRequest.billingCycle === 'yearly' ? 12 : 1));

    const accessData: Omit<SystemAccess, 'id' | 'createdAt'> = {
      systemId: selectedRequest.systemId,
      systemName: selectedRequest.systemName,
      clientEmail: selectedRequest.clientEmail,
      username: accessUsername,
      password: accessPassword,
      accessUrl: accessUrl,
      status: 'active',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      billingCycle: selectedRequest.billingCycle
    };

    dataManager.addSystemAccess(accessData);
    dataManager.updateRentalRequest(selectedRequest.id, { status: 'completed' });
    
    Promise.all([
      dataManager.fetchSystemAccessesAsync().then(a => setSystemAccesses(a)),
      dataManager.fetchRentalRequestsAsync().then(r => setRentalRequests(r))
    ]);

    setShowAccessModal(false);
    setSelectedRequest(null);
    setAccessUsername('');
    setAccessPassword('');
    setAccessUrl('');
    setToastMsg({ title: 'Acesso Criado', message: 'As credenciais foram enviadas ao cliente.', type: 'success' });
  };

  const handleAddSystem = (e: React.FormEvent) => {
    e.preventDefault();
    
    const systemData: Omit<SystemForRent, 'id' | 'createdAt' | 'updatedAt'> = {
      name: newSystem.name,
      shortDescription: newSystem.shortDescription,
      description: newSystem.description,
      category: newSystem.category,
      monthlyPrice: newSystem.monthlyPrice,
      yearlyPrice: newSystem.yearlyPrice,
      setupFee: newSystem.setupFee,
      features: newSystem.features,
      demoUrl: newSystem.demoUrl,
      image: newSystem.image,
      isActive: true,
      approvalStatus: 'approved',
      developerEmail: 'admin@wehosthere.com',
      developerName: 'WeHostHere'
    };

    dataManager.addSystemForRent(systemData);
    dataManager.fetchSystemsForRentAsync().then(s => setSystems(s));
    
    setShowAddSystemModal(false);
    setNewSystem({
      name: '',
      shortDescription: '',
      description: '',
      category: '',
      monthlyPrice: 0,
      yearlyPrice: 0,
      setupFee: 0,
      features: [],
      demoUrl: '',
      image: ''
    });
    setNewFeature('');
    setToastMsg({ title: 'Sistema Adicionado', message: 'O sistema foi adicionado com sucesso.', type: 'success' });
  };

  const handleEditSystem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSystem) return;

    dataManager.updateSystemForRent(editingSystem.id, {
      name: newSystem.name,
      shortDescription: newSystem.shortDescription,
      description: newSystem.description,
      category: newSystem.category,
      monthlyPrice: newSystem.monthlyPrice,
      yearlyPrice: newSystem.yearlyPrice,
      setupFee: newSystem.setupFee,
      features: newSystem.features,
      demoUrl: newSystem.demoUrl,
      image: newSystem.image
    });
    
    dataManager.fetchSystemsForRentAsync().then(s => setSystems(s));
    
    setShowAddSystemModal(false);
    setEditingSystem(null);
    setNewSystem({
      name: '',
      shortDescription: '',
      description: '',
      category: '',
      monthlyPrice: 0,
      yearlyPrice: 0,
      setupFee: 0,
      features: [],
      demoUrl: '',
      image: ''
    });
    setNewFeature('');
    setToastMsg({ title: 'Sistema Atualizado', message: 'O sistema foi atualizado com sucesso.', type: 'success' });
  };

  const openEditModal = (system: SystemForRent) => {
    setEditingSystem(system);
    setNewSystem({
      name: system.name,
      shortDescription: system.shortDescription,
      description: system.description,
      category: system.category,
      monthlyPrice: system.monthlyPrice,
      yearlyPrice: system.yearlyPrice,
      setupFee: system.setupFee || 0,
      features: system.features,
      demoUrl: system.demoUrl || '',
      image: system.image
    });
    setShowAddSystemModal(true);
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setNewSystem(prev => ({ ...prev, features: [...prev.features, newFeature.trim()] }));
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setNewSystem(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }));
  };

  const filteredSystems = systems.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         s.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.approvalStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'active':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />{status === 'approved' ? 'Aprovado' : 'Activo'}</span>;
      case 'rejected':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejeitado</span>;
      case 'pending':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pendente</span>;
      case 'expired':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800"><XCircle className="h-3 w-3 mr-1" />Expirado</span>;
      case 'suspended':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800"><AlertCircle className="h-3 w-3 mr-1" />Suspenso</span>;
      case 'completed':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800"><CheckCircle className="h-3 w-3 mr-1" />Concluído</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  if (loading) {
    return <PageLoader text="A carregar sistemas..." />;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg transition">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Gestão de Sistemas</h1>
                <p className="text-xs text-gray-500">Sistemas para aluguer, pedidos e acessos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('systems')}
              className={`px-3 sm:px-4 py-2 sm:py-3 text-sm font-medium border-b-2 transition ${
                activeTab === 'systems'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Star className="h-4 w-4 inline mr-1" />
              Sistemas ({systems.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-3 sm:px-4 py-2 sm:py-3 text-sm font-medium border-b-2 transition ${
                activeTab === 'requests'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Pedidos ({rentalRequests.filter(r => r.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('accesses')}
              className={`px-3 sm:px-4 py-2 sm:py-3 text-sm font-medium border-b-2 transition ${
                activeTab === 'accesses'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Acessos ({systemAccesses.length})
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Sistemas Tab */}
        {activeTab === 'systems' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
              <div className="flex gap-2 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar sistemas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendentes</option>
                  <option value="approved">Aprovados</option>
                  <option value="rejected">Rejeitados</option>
                </select>
              </div>
              <button
                onClick={() => setShowAddSystemModal(true)}
                className="inline-flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar Sistema</span>
              </button>
            </div>

            {filteredSystems.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum sistema encontrado</h3>
                <p className="text-gray-600 text-sm">Não há sistemas que correspondam aos filtros.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSystems.map((system) => (
                  <div key={system.id} className="bg-whiterounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{system.name}</h3>
                        <p className="text-xs text-gray-500">{system.category}</p>
                      </div>
                      {getStatusBadge(system.approvalStatus)}
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{system.shortDescription}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>Mensal: {system.monthlyPrice.toLocaleString('pt-MZ')} MT</span>
                      <span>Anual: {system.yearlyPrice.toLocaleString('pt-MZ')} MT</span>
                    </div>
                    {system.developerName && (
                      <p className="text-xs text-gray-500 mb-3">Por: {system.developerName}</p>
                    )}
                    <div className="flex gap-2">
                      {system.approvalStatus === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApproveSystem(system.id)}
                            className="flex-1 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition text-xs font-medium"
                          >
                            Aprovar
                          </button>
                          <button
                            onClick={() => setConfirmModalData({
                              isOpen: true,
                              title: 'Rejeitar Sistema',
                              message: 'Qual o motivo da rejeição?',
                              variant: 'warning',
                              onConfirm: () => {
                                const reason = prompt('Motivo da rejeição:');
                                if (reason) handleRejectSystem(system.id, reason);
                                setConfirmModalData(null);
                              }
                            })}
                            className="flex-1 bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition text-xs font-medium"
                          >
                            Rejeitar
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => openEditModal(system)}
                        className="flex-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition text-xs font-medium"
                      >
                        Editar
                      </button>
                      {system.approvalStatus === 'approved' && system.demoUrl && (
                        <Link
                          href={system.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center space-x-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition text-xs font-medium"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Demo</span>
                        </Link>
                      )}
                      <button
                        onClick={() => setConfirmModalData({
                          isOpen: true,
                          title: 'Eliminar Sistema',
                          message: `Tem certeza que deseja eliminar "${system.name}"?`,
                          variant: 'danger',
                          onConfirm: () => {
                            handleDeleteSystem(system.id);
                            setConfirmModalData(null);
                          }
                        })}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pedidos Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {rentalRequests.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum pedido de aluguer</h3>
                <p className="text-gray-600 text-sm">Não há pedidos de aluguer de sistemas.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rentalRequests.map((request) => (
                  <div key={request.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-gray-900">{request.systemName}</h3>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Cliente: {request.clientName} ({request.clientEmail})</p>
                        <p className="text-sm text-gray-600 mb-1">Ciclo: {request.billingCycle === 'monthly' ? 'Mensal' : 'Anual'}</p>
                        <p className="text-sm text-gray-600">Valor: {request.amount.toLocaleString('pt-MZ')} MT</p>
                        {request.status === 'rejected' && request.rejectionReason && (
                          <p className="text-sm text-red-600 mt-2">Motivo: {request.rejectionReason}</p>
                        )}
                      </div>
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveRentalRequest(request.id)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium"
                          >
                            Aprovar
                          </button>
                          <button
                            onClick={() => setConfirmModalData({
                              isOpen: true,
                              title: 'Rejeitar Pedido',
                              message: 'Qual o motivo da rejeição?',
                              variant: 'warning',
                              onConfirm: () => {
                                const reason = prompt('Motivo da rejeição:');
                                if (reason) handleRejectRentalRequest(request.id, reason);
                                setConfirmModalData(null);
                              }
                            })}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium"
                          >
                            Rejeitar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Acessos Tab */}
        {activeTab === 'accesses' && (
          <div className="space-y-4">
            {systemAccesses.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum acesso activo</h3>
                <p className="text-gray-600 text-sm">Não há acessos de sistemas activos.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {systemAccesses.map((access) => (
                  <div key={access.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-gray-900">{access.systemName}</h3>
                          {getStatusBadge(access.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Cliente: {access.clientEmail}</p>
                        <p className="text-sm text-gray-600 mb-1">Utilizador: {access.username}</p>
                        <p className="text-sm text-gray-600 mb-1">Senha: {access.password}</p>
                        <p className="text-sm text-gray-600 mb-1">URL: {access.accessUrl}</p>
                        <p className="text-xs text-gray-500">Válido até: {new Date(access.endDate).toLocaleDateString('pt-MZ')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Adicionar Sistema */}
      {showAddSystemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 my-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingSystem ? 'Editar Sistema' : 'Adicionar Novo Sistema'}
            </h2>
            <form onSubmit={editingSystem ? handleEditSystem : handleAddSystem} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Sistema *</label>
                  <input
                    type="text"
                    value={newSystem.name}
                    onChange={(e) => setNewSystem(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Curta *</label>
                  <input
                    type="text"
                    value={newSystem.shortDescription}
                    onChange={(e) => setNewSystem(prev => ({ ...prev, shortDescription: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Completa *</label>
                  <textarea
                    value={newSystem.description}
                    onChange={(e) => setNewSystem(prev => ({ ...prev, description: e.target.value }))}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                  <select
                    value={newSystem.category}
                    onChange={(e) => setNewSystem(prev => ({ ...prev, category: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Selecione...</option>
                    <option value="ecommerce">E-commerce</option>
                    <option value="gestao">Gestão</option>
                    <option value="educacao">Educação</option>
                    <option value="saude">Saúde</option>
                    <option value="financeiro">Financeiro</option>
                    <option value="marketing">Marketing</option>
                    <option value="rh">Recursos Humanos</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL da Imagem</label>
                  <input
                    type="url"
                    value={newSystem.image}
                    onChange={(e) => setNewSystem(prev => ({ ...prev, image: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço Mensal (MT) *</label>
                  <input
                    type="number"
                    value={newSystem.monthlyPrice}
                    onChange={(e) => setNewSystem(prev => ({ ...prev, monthlyPrice: Number(e.target.value) }))}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço Anual (MT) *</label>
                  <input
                    type="number"
                    value={newSystem.yearlyPrice}
                    onChange={(e) => setNewSystem(prev => ({ ...prev, yearlyPrice: Number(e.target.value) }))}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Taxa de Setup (MT)</label>
                  <input
                    type="number"
                    value={newSystem.setupFee}
                    onChange={(e) => setNewSystem(prev => ({ ...prev, setupFee: Number(e.target.value) }))}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL de Demo</label>
                  <input
                    type="url"
                    value={newSystem.demoUrl}
                    onChange={(e) => setNewSystem(prev => ({ ...prev, demoUrl: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Funcionalidades</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="Adicionar funcionalidade..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                    >
                      Adicionar
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {newSystem.features.map((feature, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                      >
                        {feature}
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(index)}
                          className="ml-2 text-primary-600 hover:text-primary-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSystemModal(false);
                    setNewSystem({
                      name: '',
                      shortDescription: '',
                      description: '',
                      category: '',
                      monthlyPrice: 0,
                      yearlyPrice: 0,
                      setupFee: 0,
                      features: [],
                      demoUrl: '',
                      image: ''
                    });
                    setNewFeature('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
                >
                  {editingSystem ? 'Atualizar Sistema' : 'Adicionar Sistema'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Credenciais */}
      {showAccessModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Fornecer Credenciais</h2>
            <p className="text-sm text-gray-600 mb-4">
              Sistema: {selectedRequest.systemName}<br />
              Cliente: {selectedRequest.clientEmail}
            </p>
            <form onSubmit={handleCreateSystemAccess} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Utilizador</label>
                <input
                  type="text"
                  value={accessUsername}
                  onChange={(e) => setAccessUsername(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <input
                  type="text"
                  value={accessPassword}
                  onChange={(e) => setAccessPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL de Acesso</label>
                <input
                  type="url"
                  value={accessUrl}
                  onChange={(e) => setAccessUrl(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAccessModal(false);
                    setSelectedRequest(null);
                    setAccessUsername('');
                    setAccessPassword('');
                    setAccessUrl('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
                >
                  Criar Acesso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <Toast
          title={toastMsg.title}
          message={toastMsg.message}
          type={toastMsg.type}
          onClose={() => setToastMsg(null)}
        />
      )}

      {/* Confirm Modal */}
      {confirmModalData && (
        <ConfirmModal
          isOpen={confirmModalData.isOpen}
          title={confirmModalData.title}
          message={confirmModalData.message}
          variant={confirmModalData.variant}
          onConfirm={confirmModalData.onConfirm}
          onCancel={() => setConfirmModalData(null)}
        />
      )}
    </div>
  );
}
