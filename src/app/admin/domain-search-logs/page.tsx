'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Search, RefreshCw, Trash2, Globe, CheckCircle, XCircle,
  Clock, TrendingUp, BarChart2, Monitor, Smartphone, AlertTriangle,
  ChevronLeft, ChevronRight, Filter, Activity, Eye, Phone, ShoppingBag,
  MessageCircle, ExternalLink, UserCheck
} from 'lucide-react';
import { auth } from '@/lib/auth';
import PageLoader from '@/components/PageLoader';
import Toast from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';

interface DomainSearchLogEntry {
  _id: string;
  domain: string;
  sld: string;
  extension: string;
  isAvailable: boolean;
  searchCount: number;
  ip: string;
  userAgent: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  hasCheckoutAttempt?: boolean;
  checkoutStatus?: 'pending' | 'completed' | 'failed' | 'abandoned';
  checkoutOrderId?: string;
  firstSearchedAt: string;
  lastSearchedAt: string;
}

interface Stats {
  totalSearches: number;
  totalAvailable: number;
  totalTaken: number;
  totalCheckoutLeads?: number;
  topSearched: DomainSearchLogEntry[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function detectDevice(userAgent?: string | null): 'mobile' | 'tablet' | 'desktop' {
  if (!userAgent || typeof userAgent !== 'string') return 'desktop';
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipod/i.test(ua)) return 'mobile';
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  return 'desktop';
}

function DeviceIcon({ userAgent }: { userAgent?: string | null }) {
  const device = detectDevice(userAgent);
  if (device === 'mobile') {
    return (
      <span title="Dispositivo Móvel (Smartphone)" className="inline-flex items-center">
        <Smartphone className="w-3.5 h-3.5 text-blue-400" />
      </span>
    );
  }
  if (device === 'tablet') {
    return (
      <span title="Tablet" className="inline-flex items-center">
        <Smartphone className="w-3.5 h-3.5 text-purple-400" />
      </span>
    );
  }
  return (
    <span title="Computador (Desktop / Laptop)" className="inline-flex items-center">
      <Monitor className="w-3.5 h-3.5 text-slate-400" />
    </span>
  );
}

function timeAgo(dateStr?: string | Date | null) {
  if (!dateStr) return '—';
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    const time = date.getTime();
    if (isNaN(time)) return '—';
    const diff = Date.now() - time;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'agora mesmo';
    if (mins < 60) return `há ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `há ${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `há ${days}d`;
  } catch {
    return '—';
  }
}

export default function DomainSearchLogsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<DomainSearchLogEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [searchQ, setSearchQ] = useState('');
  const [filterAvailability, setFilterAvailability] = useState<'all' | 'available' | 'taken' | 'checkout'>('all');
  const [sortBy, setSortBy] = useState<'lastSearchedAt' | 'searchCount' | 'domain'>('lastSearchedAt');
  const [refreshing, setRefreshing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchLogs = useCallback(async (page = 1, silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '50',
        filter: filterAvailability,
        sortBy,
        q: searchQ,
      });
      const res = await fetch(`/api/admin/domain-search-logs?${params}`);
      if (!res.ok) throw new Error('Erro ao carregar logs');
      const data = await res.json();
      setLogs(Array.isArray(data.logs) ? data.logs : []);
      setStats(data.stats || null);
      setPagination(data.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 });
    } catch (err) {
      showToast('Erro ao carregar logs de pesquisa', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterAvailability, sortBy, searchQ]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchLogs(pagination.page, true), 30000);
    return () => clearInterval(interval);
  }, [fetchLogs, pagination.page]);

  const handleClearLogs = async () => {
    setClearing(true);
    try {
      const res = await fetch('/api/admin/domain-search-logs', { method: 'DELETE' });
      if (!res.ok) throw new Error();
      showToast('Todos os logs foram apagados', 'success');
      fetchLogs(1);
    } catch {
      showToast('Erro ao apagar logs', 'error');
    } finally {
      setClearing(false);
      setShowClearConfirm(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirm Clear */}
      <ConfirmModal
        isOpen={showClearConfirm}
        title="Apagar todos os logs?"
        message="Esta acção é irreversível. Todos os registos de pesquisa de domínios serão permanentemente apagados."
        confirmText={clearing ? 'A apagar...' : 'Apagar tudo'}
        variant="danger"
        onConfirm={handleClearLogs}
        onCancel={() => setShowClearConfirm(false)}
      />

      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Admin
            </Link>
            <span className="text-slate-700">/</span>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" />
              <h1 className="text-lg font-bold text-white">Pesquisas de Domínios</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLogs(pagination.page, true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-2 rounded-lg transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Limpar</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalSearches.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-0.5">domínios únicos</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Disponíveis</span>
              </div>
              <p className="text-2xl font-bold text-emerald-400">{stats.totalAvailable.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {stats.totalSearches > 0
                  ? `${Math.round((stats.totalAvailable / stats.totalSearches) * 100)}% do total`
                  : '—'}
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Ocupados</span>
              </div>
              <p className="text-2xl font-bold text-red-400">{stats.totalTaken.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-0.5">já registados</p>
            </div>
            <div className="bg-slate-900 border border-purple-800/60 rounded-xl p-4 bg-gradient-to-br from-purple-950/30 to-slate-900">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingBag className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-purple-300 font-medium uppercase tracking-wider">Leads Checkout</span>
              </div>
              <p className="text-2xl font-bold text-purple-300">{(stats.totalCheckoutLeads || 0).toLocaleString()}</p>
              <p className="text-xs text-purple-400/70 mt-0.5">tentaram comprar</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 col-span-2 sm:col-span-4 lg:col-span-1">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Top Pesquisado</span>
              </div>
              {stats.topSearched[0] ? (
                <>
                  <p className="text-sm font-bold text-white truncate">{stats.topSearched[0].domain}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{stats.topSearched[0].searchCount}× pesquisado</p>
                </>
              ) : (
                <p className="text-slate-500 text-sm">—</p>
              )}
            </div>
          </div>
        )}

        {/* Top 5 Mais Pesquisados */}
        {stats && stats.topSearched.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-white">Top 5 Domínios Mais Pesquisados</h2>
            </div>
            <div className="space-y-2">
              {stats.topSearched.map((entry, idx) => (
                <div key={entry._id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-500 w-4 text-right">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">{entry.domain}</span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        entry.isAvailable
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-red-500/15 text-red-400'
                      }`}>
                        {entry.isAvailable ? '✓ Livre' : '✗ Ocupado'}
                      </span>
                    </div>
                    <div
                      className="mt-1 h-1.5 rounded-full bg-slate-800 overflow-hidden"
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                        style={{
                          width: `${Math.min(100, (entry.searchCount / (stats.topSearched[0]?.searchCount || 1)) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-400 whitespace-nowrap">{entry.searchCount}×</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Pesquisar domínio, nome, e-mail, telefone ou IP..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchLogs(1)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <select
              value={filterAvailability}
              onChange={e => setFilterAvailability(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">Todos os Estados</option>
              <option value="available">✓ Disponíveis</option>
              <option value="taken">✕ Ocupados</option>
              <option value="checkout">🛒 Tentaram Comprar (Checkout)</option>
            </select>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="lastSearchedAt">Mais Recentes</option>
              <option value="searchCount">Mais Pesquisados</option>
              <option value="domain">A-Z</option>
            </select>
            <button
              onClick={() => fetchLogs(1)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2.5 rounded-lg font-medium transition-colors"
            >
              Filtrar
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <span className="text-sm text-slate-400">
              {pagination.total.toLocaleString()} registo{pagination.total !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-500">auto-actualiza a cada 30s</span>
            </div>
          </div>

          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
              <Globe className="w-12 h-12 opacity-20" />
              <p className="text-sm">Nenhuma pesquisa de domínio registada com os filtros atuais.</p>
              <p className="text-xs opacity-60">As pesquisas aparecem aqui em tempo real quando os visitantes pesquisam domínios.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                    <th className="text-left px-5 py-3 font-medium">Domínio</th>
                    <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Estado</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Dispositivo / IP</th>
                    <th className="text-left px-4 py-3 font-medium">Cliente &amp; Contacto</th>
                    <th className="text-center px-4 py-3 font-medium">Buscas</th>
                    <th className="text-right px-5 py-3 font-medium">Data / Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {logs.map((log) => {
                    const cleanPhone = (log.userPhone || '').replace(/\D/g, '');
                    const formattedPhone = cleanPhone.startsWith('258') ? cleanPhone : `258${cleanPhone}`;
                    const whatsappMsg = encodeURIComponent(
                      `Olá ${log.userName || ''}! Notámos que pesquisou pelo domínio ${log.domain} na WEHOSTHERE. Podemos ajudar a garantir o registo e ativar o seu website?`
                    );
                    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${whatsappMsg}`;

                    return (
                      <tr
                        key={log._id}
                        className={`hover:bg-slate-800/40 transition-colors group ${
                          log.hasCheckoutAttempt ? 'bg-purple-950/10' : ''
                        }`}
                      >
                        {/* Domain */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <Globe className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                            <span className="font-bold text-white">{log.sld}</span>
                            <span className="text-slate-400 text-xs font-mono">{log.extension}</span>
                          </div>
                          {log.hasCheckoutAttempt && (
                            <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-md border border-purple-500/30">
                              <ShoppingBag className="w-3 h-3" /> Tentativa Checkout
                            </span>
                          )}
                        </td>

                        {/* Available */}
                        <td className="px-4 py-3.5 hidden sm:table-cell">
                          {log.isAvailable ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                              <CheckCircle className="w-3 h-3" /> Disponível
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20">
                              <XCircle className="w-3 h-3" /> Ocupado
                            </span>
                          )}
                        </td>

                        {/* Visitor */}
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <div className="flex items-center gap-1.5">
                            <DeviceIcon userAgent={log.userAgent} />
                            <span className="text-slate-400 font-mono text-xs">{log.ip}</span>
                          </div>
                        </td>

                        {/* Auth User & Customer Info */}
                        <td className="px-4 py-3.5">
                          {log.userName || log.userEmail || log.userPhone ? (
                            <div className="space-y-0.5">
                              {log.userName && (
                                <p className="text-xs font-bold text-white flex items-center gap-1">
                                  <UserCheck className="w-3 h-3 text-blue-400" />
                                  {log.userName}
                                </p>
                              )}
                              {log.userEmail && (
                                <p className="text-[11px] text-blue-400 truncate max-w-[180px]">
                                  {log.userEmail}
                                </p>
                              )}
                              {log.userPhone && (
                                <p className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                                  <Phone className="w-2.5 h-2.5" />
                                  {log.userPhone}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-600 text-xs italic">Visitante Anónimo</span>
                          )}
                        </td>

                        {/* Search count */}
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                            log.searchCount >= 5
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : log.searchCount >= 2
                              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {log.searchCount}
                          </span>
                        </td>

                        {/* Last searched & WhatsApp button */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-slate-400 text-xs font-mono">{timeAgo(log.lastSearchedAt)}</span>
                            {log.userPhone && cleanPhone.length >= 8 && (
                              <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold shadow-xs transition-all hover:scale-105 cursor-pointer"
                                title="Contactar cliente pelo WhatsApp"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>WhatsApp</span>
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchLogs(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => fetchLogs(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
