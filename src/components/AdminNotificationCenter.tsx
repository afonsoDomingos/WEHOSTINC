'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Bell, Check, CheckCheck, Trash2, ExternalLink, UserPlus, ShoppingBag, 
  CreditCard, AlertCircle, MessageSquare, ShieldAlert, X, Filter,
  Wrench
} from 'lucide-react';
import { 
  AdminNotification, 
  getAdminNotifications, 
  markAdminNotificationRead, 
  markAllAdminNotificationsRead, 
  clearAdminNotifications 
} from '@/lib/notifications';

interface AdminNotificationCenterProps {
  onNavigate?: (link: string) => void;
}

export default function AdminNotificationCenter({ onNavigate }: AdminNotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');
  const [maintenanceActive, setMaintenanceActive] = useState(false);
  const [updatingMaintenance, setUpdatingMaintenance] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const fetchNotifs = async () => {
    const data = await getAdminNotifications();
    setNotifications(data);
  };

  const fetchMaintenanceStatus = async () => {
    try {
      const res = await fetch('/api/system/maintenance', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.maintenance) setMaintenanceActive(data.maintenance.active);
      }
    } catch (e) {}
  };

  const toggleMaintenance = async () => {
    setUpdatingMaintenance(true);
    const nextState = !maintenanceActive;
    try {
      const res = await fetch('/api/system/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: nextState })
      });
      if (res.ok) {
        setMaintenanceActive(nextState);
      }
    } catch (e) {
      console.error('Erro ao atualizar modo de manutenção:', e);
    } finally {
      setUpdatingMaintenance(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
    fetchMaintenanceStatus();
    const interval = setInterval(() => {
      fetchNotifs();
      fetchMaintenanceStatus();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await markAdminNotificationRead(id);
    await fetchNotifs();
  };

  const handleMarkAllRead = async () => {
    await markAllAdminNotificationsRead();
    await fetchNotifs();
  };

  const handleClearAll = async () => {
    await clearAdminNotifications();
    await fetchNotifs();
  };

  const handleItemClick = async (n: AdminNotification) => {
    await markAdminNotificationRead(n.id);
    await fetchNotifs();
    setIsOpen(false);
    if (n.link && onNavigate) {
      onNavigate(n.link);
    }
  };

  const filteredNotifs = notifications.filter(n => filter === 'unread' ? !n.read : true);

  const getIcon = (type: AdminNotification['type']) => {
    switch (type) {
      case 'user_signup':
        return <UserPlus className="w-4 h-4 text-blue-400" />;
      case 'order_new':
      case 'order_updated':
        return <ShoppingBag className="w-4 h-4 text-emerald-400" />;
      case 'order_approved':
        return <Check className="w-4 h-4 text-green-400" />;
      case 'order_rejected':
      case 'order_cancelled':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      case 'payment_success':
        return <CreditCard className="w-4 h-4 text-emerald-400" />;
      case 'payment_failed':
      case 'payment_pending':
        return <CreditCard className="w-4 h-4 text-amber-400" />;
      case 'support_ticket':
        return <MessageSquare className="w-4 h-4 text-purple-400" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="relative" ref={drawerRef}>
      {/* Botão de Sino */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        title="Central de Notificações"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-1.5 text-[11px] font-bold text-white shadow-lg animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Drawer Dropdown de Notificações */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Cabeçalho */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-white text-base">Notificações do Sistema</h3>
              {unreadCount > 0 && (
                <span className="text-xs bg-blue-500/20 text-blue-400 font-semibold px-2 py-0.5 rounded-full border border-blue-500/30">
                  {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Filtros e Ações */}
          <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setFilter('unread')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  filter === 'unread' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Não Lidas ({unreadCount})
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  filter === 'all' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todas ({notifications.length})
              </button>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-slate-400 hover:text-blue-400 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-800/80 transition-colors"
                  title="Marcar todas como lidas"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Marcar Lidas</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-slate-400 hover:text-rose-400 p-1 rounded-md hover:bg-slate-800/80 transition-colors"
                  title="Limpar histórico"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Lista de Notificações */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar">
            {filteredNotifs.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">Nenhuma notificação {filter === 'unread' ? 'não lida' : 'encontrada'}.</p>
                <p className="text-xs text-slate-600 mt-1">Os alertas do sistema aparecerão aqui em tempo real.</p>
              </div>
            ) : (
              filteredNotifs.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-slate-800/50 cursor-pointer transition-colors group relative ${
                    !n.read ? 'bg-slate-800/25 border-l-2 border-blue-500' : 'opacity-85'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/50 flex-shrink-0 mt-0.5">
                    {getIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`text-xs font-semibold truncate ${!n.read ? 'text-white' : 'text-slate-300'}`}>
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-slate-500 flex-shrink-0">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>

                    {(n.userName || n.userEmail) && (
                      <span className="inline-block mt-1 text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700/40">
                        👤 {n.userName || n.userEmail}
                      </span>
                    )}
                  </div>

                  {!n.read && (
                    <button
                      onClick={(e) => handleMarkRead(n.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-blue-400 p-1 transition-opacity"
                      title="Marcar como lida"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Rodapé com Link para Histórico Completo */}
          <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                if (onNavigate) onNavigate('/admin/comunicacao?tab=history');
              }}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1.5 transition-colors"
            >
              Ver Central de Comunicação e Histórico →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
