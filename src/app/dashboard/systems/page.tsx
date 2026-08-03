'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ShoppingBag, Clock, CheckCircle, XCircle, AlertCircle, 
  LayoutDashboard, Globe, Mail, Database, Settings as SettingsIcon, 
  LogOut, FileText, ExternalLink, Play, Star, ArrowRight, Upload
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
  
  const [user, setUser] = useState<User | null>(null);
  const [systems, setSystems] = useState<SystemForRent[]>([]);
  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const [accesses, setAccesses] = useState<SystemAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRentModal, setShowRentModal] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<SystemForRent | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'emola' | 'card' | 'bank_transfer'>('mpesa');
  const [proofFile, setProofFile] = useState<File | null>(null);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
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
  }, [router, rentSystemId]);

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
      clientPhone: user.email, // TODO: Adicionar campo phone ao User
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

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav userName={user.name} onLogout={handleLogout} />

      <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
        <div className="grid lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 w-full">
          {/* Sidebar (Desktop) */}
          <div className="hidden lg:block lg:col-span-1">
            <DashboardSidebar />
          </div>

          {/* Main Content */}
          <div className="col-span-1 lg:col-span-3 space-y-3 sm:space-y-4 md:space-y-6 w-full min-w-0">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 md:p-6 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="min-w-0 flex-1">
                  <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 truncate">Sistemas para Aluguer</h1>
                  <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 mt-0.5 truncate">Solicite e gerencie seus sistemas alugados</p>
                </div>
                <Link
                  href="/systems"
                  className="inline-flex items-center justify-center space-x-1 sm:space-x-1.5 bg-primary-600 text-white font-bold text-[9px] sm:text-[10px] md:text-xs px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-xl hover:bg-primary-700 transition cursor-pointer shadow-xs whitespace-nowrap shrink-0"
                >
                  <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Ver Catálogo</span>
                  <span className="sm:hidden">Catálogo</span>
                </Link>
              </div>
            </div>

            {/* Meus Acessos */}
            {accesses.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 md:p-6 w-full">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Meus Sistemas Ativos</h2>
                <div className="space-y-3 sm:space-y-4">
                  {accesses.map((access) => (
                    <div key={access.id} className="border border-gray-200 rounded-xl p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-1">{access.systemName}</h3>
                          <p className="text-[10px] sm:text-xs text-gray-600 mb-2">
                            Ciclo: {access.billingCycle === 'monthly' ? 'Mensal' : 'Anual'}
                          </p>
                          <div className="bg-white rounded-lg p-2 sm:p-3 border border-green-200">
                            <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-600 mb-1">
                              <strong>URL:</strong> {access.credentials?.url || 'N/A'}
                            </p>
                            <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-600 mb-1">
                              <strong>Utilizador:</strong> {access.credentials?.username || 'N/A'}
                            </p>
                            <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-600">
                              <strong>Senha:</strong> {access.credentials?.password || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-green-100 text-green-800">
                            {access.status === 'active' ? 'Activo' : access.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pedidos de Aluguer */}
            <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 md:p-6 w-full">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Meus Pedidos de Aluguer</h2>
              {requests.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Nenhum pedido de aluguer</h3>
                  <p className="text-gray-600 text-xs sm:text-sm max-w-md mx-auto mb-3 sm:mb-4">
                    Você ainda não solicitou nenhum sistema para aluguer.
                  </p>
                  <Link
                    href="/systems"
                    className="inline-flex items-center space-x-2 bg-primary-600 text-white font-bold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl hover:bg-primary-700 transition text-xs sm:text-sm cursor-pointer"
                  >
                    <span>Ver Sistemas Disponíveis</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {requests.map((request) => (
                    <div key={request.id} className="border border-gray-200 rounded-xl p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">{request.systemName}</h3>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(request.status)}
                              <span className="text-[10px] sm:text-xs font-semibold text-gray-600">
                                {getStatusText(request.status)}
                              </span>
                            </div>
                          </div>
                          <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-600 mb-1">
                            Ciclo: {request.billingCycle === 'monthly' ? 'Mensal' : 'Anual'}
                          </p>
                          <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-600">
                            Valor: {request.amount.toLocaleString('pt-MZ')} MT
                          </p>
                          {request.status === 'rejected' && request.rejectionReason && (
                            <p className="text-[9px] sm:text-[10px] md:text-xs text-red-600 mt-2">
                              Motivo: {request.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Aluguer */}
      {showRentModal && selectedSystem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
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
              <h3 className="font-bold text-gray-900 mb-2">{selectedSystem.name}</h3>
              <p className="text-sm text-gray-600">{selectedSystem.shortDescription}</p>
            </div>

            <form onSubmit={handleRentSubmit} className="space-y-4">
              {(selectedSystem.isFree || selectedSystem.monthlyPrice === 0) ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl space-y-2">
                    <div className="flex items-center space-x-2 text-emerald-950 font-bold">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                      <span>Sistema 100% Gratuito</span>
                    </div>
                    <p className="text-xs text-emerald-800">
                      Este sistema é disponibilizado sem qualquer taxa de mensalidade, anuidade ou taxa de instalação.
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total a pagar:</span>
                      <span className="font-bold text-emerald-600">0 MT (Grátis)</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/20"
                  >
                    <span>Ativar Acesso Gratuito</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ciclo de Pagamento</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setBillingCycle('monthly')}
                        className={`p-3 rounded-xl border-2 transition ${
                          billingCycle === 'monthly'
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-lg font-bold">{selectedSystem.monthlyPrice.toLocaleString('pt-MZ')} MT</div>
                        <div className="text-xs text-gray-600">Mensal</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingCycle('yearly')}
                        className={`p-3 rounded-xl border-2 transition ${
                          billingCycle === 'yearly'
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-lg font-bold">{selectedSystem.yearlyPrice.toLocaleString('pt-MZ')} MT</div>
                        <div className="text-xs text-gray-600">Anual</div>
                      </button>
                    </div>
                    {selectedSystem.setupFee ? (
                      <p className="text-xs text-gray-500 mt-2">
                        + Taxa de configuração: {selectedSystem.setupFee.toLocaleString('pt-MZ')} MT
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pagamento</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="mpesa">M-Pesa</option>
                      <option value="emola">eMola</option>
                      <option value="card">Cartão</option>
                      <option value="bank_transfer">Transferência Bancária</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comprovativo de Pagamento</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-500 transition cursor-pointer">
                      <input
                        type="file"
                        onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="proof-file"
                      />
                      <label htmlFor="proof-file" className="cursor-pointer">
                        {proofFile ? (
                          <div className="flex items-center justify-center space-x-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span className="text-sm text-gray-700">{proofFile.name}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <Upload className="h-8 w-8 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-600">Clique para fazer upload</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total a pagar:</span>
                      <span className="font-bold text-gray-900">
                        {(
                          (billingCycle === 'monthly' ? selectedSystem.monthlyPrice : selectedSystem.yearlyPrice) +
                          (selectedSystem.setupFee || 0)
                        ).toLocaleString('pt-MZ')} MT
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center space-x-2"
                  >
                    <span>Confirmar Solicitação</span>
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
