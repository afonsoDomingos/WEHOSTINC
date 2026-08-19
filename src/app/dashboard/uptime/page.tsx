'use client';

import { useState, useEffect } from 'react';
import { 
  Globe, Clock, AlertTriangle, CheckCircle2, 
  Plus, Trash2, RefreshCw, Activity, TrendingUp,
  Calendar, BarChart3
} from 'lucide-react';

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
  const [monitors, setMonitors] = useState<UptimeMonitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMonitor, setNewMonitor] = useState({ url: '', name: '', checkInterval: 5 });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMonitors();
  }, []);

  const fetchMonitors = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/uptime/monitors');
      const data = await response.json();
      
      if (data.success) {
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
      }
    } catch (err) {
      console.error('Erro ao excluir monitor:', err);
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
      }
    } catch (err) {
      console.error('Erro ao atualizar alertas:', err);
    }
  };

  const handleCheckNow = async (id: string) => {
    try {
      const response = await fetch('/api/uptime/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monitorId: id }),
      });

      if (response.ok) {
        fetchMonitors();
      }
    } catch (err) {
      console.error('Erro ao verificar uptime:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-MZ');
  };

  const getUptimeColor = (percentage: number) => {
    if (percentage >= 99) return 'text-emerald-400';
    if (percentage >= 95) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getUptimeBadge = (status: string) => {
    return status === 'online' 
      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
      : 'bg-red-500/20 text-red-400 border-red-500/40';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monitoramento de Uptime</h1>
          <p className="text-gray-600 mt-1">Monitore a disponibilidade dos seus sites em tempo real</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus className="h-5 w-5" />
          <span>Novo Monitor</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Monitores</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{monitors.length}</p>
            </div>
            <Globe className="h-10 w-10 text-primary-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Online</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">
                {monitors.filter(m => m.currentStatus === 'online').length}
              </p>
            </div>
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Offline</p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                {monitors.filter(m => m.currentStatus === 'offline').length}
              </p>
            </div>
            <AlertTriangle className="h-10 w-10 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Uptime Médio</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {monitors.length > 0 
                  ? (monitors.reduce((acc, m) => acc + m.uptimePercentage, 0) / monitors.length).toFixed(1)
                  : '0'}%
              </p>
            </div>
            <Activity className="h-10 w-10 text-primary-600" />
          </div>
        </div>
      </div>

      {/* Monitors List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Monitores Ativos</h2>
        </div>
        
        {monitors.length === 0 ? (
          <div className="p-12 text-center">
            <Globe className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum monitor configurado</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-primary-600 hover:text-primary-700 font-semibold"
            >
              Adicionar primeiro monitor
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {monitors.map((monitor) => (
              <div key={monitor._id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{monitor.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getUptimeBadge(monitor.currentStatus)}`}>
                        {monitor.currentStatus === 'online' ? 'Online' : 'Offline'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${monitor.alertsEnabled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                        {monitor.alertsEnabled ? 'Alertas Ativos' : 'Alertas Inativos'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{monitor.url}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>Última verificação: {formatDate(monitor.lastCheck)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Activity className="h-4 w-4" />
                        <span>Total de checks: {monitor.totalChecks}</span>
                      </div>
                      <div className={`flex items-center space-x-1 font-semibold ${getUptimeColor(monitor.uptimePercentage)}`}>
                        <TrendingUp className="h-4 w-4" />
                        <span>Uptime: {monitor.uptimePercentage.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleCheckNow(monitor._id)}
                      className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                      title="Verificar agora"
                    >
                      <RefreshCw className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleToggleAlerts(monitor)}
                      className={`p-2 rounded-lg transition ${
                        monitor.alertsEnabled 
                          ? 'text-blue-600 hover:bg-blue-50' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      title={monitor.alertsEnabled ? 'Desativar alertas' : 'Ativar alertas'}
                    >
                      <AlertTriangle className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMonitor(monitor._id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Excluir monitor"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Monitor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Adicionar Novo Monitor</h3>
            </div>
            <form onSubmit={handleAddMonitor} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Site</label>
                <input
                  type="text"
                  value={newMonitor.name}
                  onChange={(e) => setNewMonitor({ ...newMonitor, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Meu Site"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL do Site</label>
                <input
                  type="url"
                  value={newMonitor.url}
                  onChange={(e) => setNewMonitor({ ...newMonitor, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="https://exemplo.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Intervalo de Verificação (minutos)</label>
                <select
                  value={newMonitor.checkInterval}
                  onChange={(e) => setNewMonitor({ ...newMonitor, checkInterval: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value={1}>1 minuto</option>
                  <option value={5}>5 minutos</option>
                  <option value={10}>10 minutos</option>
                  <option value={15}>15 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={60}>1 hora</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {adding ? 'Adicionando...' : 'Adicionar Monitor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
