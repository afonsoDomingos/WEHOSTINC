'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  Globe, Clock, AlertTriangle, CheckCircle2, 
  Plus, Trash2, RefreshCw, Activity, TrendingUp,
  Calendar, BarChart3, ArrowLeft, ShieldCheck, Zap, X
} from 'lucide-react';
import { auth, User } from '@/lib/auth';
import { soundEffects } from '@/lib/soundEffects';
import DashboardNav from '@/components/DashboardNav';
import DashboardSidebar from '@/components/DashboardSidebar';
import PageLoader from '@/components/PageLoader';
import Toast from '@/components/Toast';

interface UptimeMonitor {
  _id: string;
  url: string;
  name: string;
  isActive: boolean;
  checkInterval: number;
  currentStatus: 'online' | 'offline';
  lastCheck: string;
  lastOnline: string;
  lastOffline: string;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  uptimePercentage: number;
  alertsEnabled: boolean;
  lastAlertSent?: string;
  alertCooldown: number;
  createdAt: string;
  updatedAt: string;
}

export default function UptimeDashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [monitors, setMonitors] = useState<UptimeMonitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMonitor, setNewMonitor] = useState({ url: '', name: '', checkInterval: 5 });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [previousStatuses, setPreviousStatuses] = useState<Record<string, 'online' | 'offline'>>({});
  const [checkingId, setCheckingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;

    let currentUser: User | null = null;
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

    if (!currentUser) {
      currentUser = auth.getCurrentUser();
    }

    if (!currentUser) {
      router.push('/login');
      return;
    }

    setUser(currentUser);
    fetchMonitors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router]);

  const fetchMonitors = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/uptime/monitors');
      const data = await response.json();
      
      if (data.success) {
        // Detect status changes and play sounds
        data.monitors.forEach((monitor: UptimeMonitor) => {
          const previousStatus = previousStatuses[monitor._id];
          if (previousStatus && previousStatus !== monitor.currentStatus) {
            if (monitor.currentStatus === 'offline' && previousStatus === 'online') {
              soundEffects.playSiteDownSound();
            } else if (monitor.currentStatus === 'online' && previousStatus === 'offline') {
              soundEffects.playSiteRecoveredSound();
            }
          }
        });
        
        // Update previous statuses
        const newStatuses: Record<string, 'online' | 'offline'> = {};
        data.monitors.forEach((monitor: UptimeMonitor) => {
          newStatuses[monitor._id] = monitor.currentStatus;
        });
        setPreviousStatuses(newStatuses);
        
        setMonitors(data.monitors);
      }
    } catch (err) {
      console.error('Erro ao buscar monitores:', err);
      setError('Erro ao carregar monitores de uptime');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMonitor = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAdding(true);

    try {
      const response = await fetch('/api/uptime/monitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMonitor),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar monitor');
      }

      setMonitors([...monitors, data.monitor]);
      setShowAddModal(false);
      setNewMonitor({ url: '', name: '', checkInterval: 5 });
      setToastMsg({ type: 'success', message: 'Monitor de uptime adicionado com sucesso!' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar monitor');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteMonitor = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este monitor?')) return;

    try {
      const response = await fetch(`/api/uptime/monitors/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMonitors(monitors.filter(m => m._id !== id));
        setToastMsg({ type: 'info', message: 'Monitor removido com sucesso.' });
      }
    } catch (err) {
      console.error('Erro ao excluir monitor:', err);
      setToastMsg({ type: 'error', message: 'Erro ao excluir monitor.' });
    }
  };

  const handleToggleAlerts = async (monitor: UptimeMonitor) => {
    try {
      const response = await fetch(`/api/uptime/monitors/${monitor._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertsEnabled: !monitor.alertsEnabled }),
      });

      if (response.ok) {
        setMonitors(monitors.map(m => 
          m._id === monitor._id 
            ? { ...m, alertsEnabled: !monitor.alertsEnabled }
            : m
        ));
        setToastMsg({
          type: 'success',
          message: !monitor.alertsEnabled ? 'Alertas ativados para este monitor!' : 'Alertas desativados.'
        });
      }
    } catch (err) {
      console.error('Erro ao atualizar alertas:', err);
    }
  };

  const handleCheckNow = async (id: string) => {
    try {
      setCheckingId(id);
      const response = await fetch('/api/uptime/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monitorId: id }),
      });

      if (response.ok) {
        await fetchMonitors();
        setToastMsg({ type: 'success', message: 'Verificação concluída!' });
      }
    } catch (err) {
      console.error('Erro ao verificar uptime:', err);
      setToastMsg({ type: 'error', message: 'Falha na verificação de uptime.' });
    } finally {
      setCheckingId(null);
    }
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      auth.logout();
      signOut({ callbackUrl: '/' });
    }, 400);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleString('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUptimeColor = (percentage: number) => {
    if (percentage >= 99) return 'text-emerald-600';
    if (percentage >= 95) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getUptimeBadge = (status: string) => {
    return status === 'online' 
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-red-50 text-red-700 border-red-200';
  };

  if (loading || status === 'loading') {
    return <PageLoader text="A carregar dados de monitoramento..." />;
  }

  if (isLoggingOut) {
    return <PageLoader text="A encerrar a sua sessão com segurança..." />;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Responsivo */}
      <DashboardNav userName={user.name} userAvatar={user.avatar} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar (Desktop) */}
          <div className="hidden lg:block lg:col-span-1">
            <DashboardSidebar />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Top Navigation / Breadcrumb */}
            <div className="flex items-center justify-between">
              <Link 
                href="/dashboard"
                className="inline-flex items-center space-x-2 text-xs sm:text-sm font-semibold text-gray-600 hover:text-primary-600 transition bg-white px-3 py-1.5 rounded-lg border border-gray-200/80 shadow-xs"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar ao Dashboard</span>
              </Link>

              <button
                onClick={fetchMonitors}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200/80 px-3 py-1.5 rounded-lg transition"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Atualizar Estado</span>
              </button>
            </div>

            {/* Header Banner */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="p-3 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl text-white shadow-md shrink-0">
                    <Activity className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Monitoramento de Uptime</h1>
                    <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Monitore a disponibilidade dos seus sites em tempo real com alertas automáticos</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-md transition shrink-0 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Novo Monitor</span>
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total</p>
                    <p className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">{monitors.length}</p>
                  </div>
                  <div className="p-2.5 bg-primary-50 rounded-xl text-primary-600">
                    <Globe className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Online</p>
                    <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
                      {monitors.filter(m => m.currentStatus === 'online').length}
                    </p>
                  </div>
                  <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-red-600 uppercase tracking-wider">Offline</p>
                    <p className="text-2xl sm:text-3xl font-black text-red-600 mt-1">
                      {monitors.filter(m => m.currentStatus === 'offline').length}
                    </p>
                  </div>
                  <div className="p-2.5 bg-red-50 rounded-xl text-red-600">
                    <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Uptime Médio</p>
                    <p className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
                      {monitors.length > 0 
                        ? (monitors.reduce((acc, m) => acc + m.uptimePercentage, 0) / monitors.length).toFixed(1)
                        : '100'}%
                    </p>
                  </div>
                  <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                </div>
              </div>
            </div>

            {/* Monitors List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">Monitores Configurados</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Verificação contínua da saúde dos seus servidores e páginas web</p>
                </div>
                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                  {monitors.length} {monitors.length === 1 ? 'site' : 'sites'}
                </span>
              </div>
              
              {monitors.length === 0 ? (
                <div className="p-8 sm:p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <Globe className="h-8 w-8" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Nenhum monitor configurado</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                    Comece adicionando a URL do seu site para receber alertas sempre que houver instabilidade ou queda.
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-5 inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl transition shadow-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Adicionar Primeiro Monitor</span>
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {monitors.map((monitor) => {
                    const isCheckingThis = checkingId === monitor._id;

                    return (
                      <div key={monitor._id} className="p-4 sm:p-6 hover:bg-gray-50/80 transition">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {/* Title & Badges */}
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">{monitor.name}</h3>
                              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${getUptimeBadge(monitor.currentStatus)}`}>
                                {monitor.currentStatus === 'online' ? '● Online' : '● Offline'}
                              </span>
                              <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${monitor.alertsEnabled ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-gray-100 text-gray-600'}`}>
                                {monitor.alertsEnabled ? 'Alertas Ativos' : 'Alertas Desativados'}
                              </span>
                              <span className="text-[11px] text-gray-400 font-medium bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md">
                                a cada {monitor.checkInterval}m
                              </span>
                            </div>

                            {/* URL Link */}
                            <a 
                              href={monitor.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 hover:underline break-all inline-block mb-3"
                            >
                              {monitor.url}
                            </a>

                            {/* Meta info chips */}
                            <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-[11px] sm:text-xs text-gray-500">
                              <div className="flex items-center space-x-1.5">
                                <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                <span>Último check: <strong>{formatDate(monitor.lastCheck)}</strong></span>
                              </div>
                              <div className="flex items-center space-x-1.5">
                                <Activity className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                <span>Total checks: <strong>{monitor.totalChecks}</strong></span>
                              </div>
                              <div className={`flex items-center space-x-1.5 font-bold ${getUptimeColor(monitor.uptimePercentage)}`}>
                                <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                                <span>Uptime: {monitor.uptimePercentage.toFixed(2)}%</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-start border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto justify-end">
                            <button
                              onClick={() => handleCheckNow(monitor._id)}
                              disabled={isCheckingThis}
                              className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:text-primary-700 hover:bg-primary-50 border border-gray-200 rounded-lg transition disabled:opacity-50 cursor-pointer"
                              title="Verificar estado agora"
                            >
                              <RefreshCw className={`h-3.5 w-3.5 ${isCheckingThis ? 'animate-spin text-primary-600' : ''}`} />
                              <span className="hidden sm:inline">{isCheckingThis ? 'A verificar...' : 'Verificar'}</span>
                            </button>

                            <button
                              onClick={() => handleToggleAlerts(monitor)}
                              className={`p-2 rounded-lg border transition cursor-pointer ${
                                monitor.alertsEnabled 
                                  ? 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100' 
                                  : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                              }`}
                              title={monitor.alertsEnabled ? 'Desativar alertas por email' : 'Ativar alertas por email'}
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteMonitor(monitor._id)}
                              className="p-2 bg-gray-50 border border-gray-200 text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 rounded-lg transition cursor-pointer"
                              title="Excluir monitor"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
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

      {/* Add Monitor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-primary-100 text-primary-700 rounded-lg">
                  <Plus className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Novo Monitor de Uptime</h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddMonitor} className="p-5 sm:p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-xs font-semibold">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Nome do Site / Serviço
                </label>
                <input
                  type="text"
                  value={newMonitor.name}
                  onChange={(e) => setNewMonitor({ ...newMonitor, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ex: Meu Site Principal"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  URL Completa
                </label>
                <input
                  type="url"
                  value={newMonitor.url}
                  onChange={(e) => setNewMonitor({ ...newMonitor, url: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="https://exemplo.co.mz"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Intervalo de Verificação
                </label>
                <select
                  value={newMonitor.checkInterval}
                  onChange={(e) => setNewMonitor({ ...newMonitor, checkInterval: parseInt(e.target.value) })}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value={1}>A cada 1 minuto (Alta precisão)</option>
                  <option value={5}>A cada 5 minutos (Recomendado)</option>
                  <option value={10}>A cada 10 minutos</option>
                  <option value={15}>A cada 15 minutos</option>
                  <option value={30}>A cada 30 minutos</option>
                  <option value={60}>A cada 1 hora</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-xs sm:text-sm font-semibold rounded-xl hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {adding ? 'A criar...' : 'Adicionar Monitor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <Toast
          type={toastMsg.type}
          message={toastMsg.message}
          onClose={() => setToastMsg(null)}
        />
      )}
    </div>
  );
}
