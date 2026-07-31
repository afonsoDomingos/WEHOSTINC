/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Users, Server, Mail, Database, TrendingUp, DollarSign,
  LogOut, Settings, Home, CheckCircle, Clock, XCircle, Search,
  ShoppingBag, MessageSquare, ExternalLink, Trash2, LifeBuoy, Send, ShieldCheck, CheckCircle2, AlertCircle,
  Paperclip, FileText, Image as ImageIcon, Download, File, X, Loader2, Tag, Shield, AlertTriangle,
  Activity, Eye, Globe, Wifi, WifiOff, BarChart2, RefreshCw
} from 'lucide-react';
import { auth, User } from '@/lib/auth';
import { dataManager, ServiceOrder, SupportTicket, TicketMessage, TicketAttachment, SecurityLog } from '@/lib/data';
import BrandLogo from '@/components/BrandLogo';
import PageLoader from '@/components/PageLoader';
import ConfirmModal from '@/components/ConfirmModal';
import Toast from '@/components/Toast';

const ADMIN_CANNED_RESPONSES = [
  {
    label: '✅ DNS Propagado',
    text: 'Olá! Confirmamos que o seu domínio já se encontra devidamente apontado e propagado para os nossos NameServers oficiais (ns1.wehosthere.com e ns2.wehosthere.com). O seu serviço está 100% ativo.',
    suggestedStatus: 'answered' as const
  },
  {
    label: '💳 Pagamento Confirmado',
    text: 'Olá! Confirmamos a recepção do pagamento. A sua fatura foi marcada como liquidada no nosso sistema e o seu plano/serviço foi totalmente ativado com sucesso.',
    suggestedStatus: 'answered' as const
  },
  {
    label: '📧 Acesso Webmail & SSL',
    text: 'Para aceder ao seu e-mail corporativo via navegador, utilize o endereço webmail.seudominio.co.mz (Porta 2096 com SSL). Para configurar no Outlook ou telemóvel, utilize servidor IMAP porta 993 e SMTP porta 465.',
    suggestedStatus: 'answered' as const
  },
  {
    label: '⚙️ VPS Provisionada',
    text: 'A sua máquina VPS foi provisionada com sucesso no painel. O IP dedicado atribuído e os acessos do utilizador root já se encontram ativos na secção de servidores.',
    suggestedStatus: 'answered' as const
  },
  {
    label: '🔒 SSL Re-emitido',
    text: 'O certificado SSL gratuito Let\'s Encrypt foi re-emitido e instalado com sucesso para o seu domínio e subdomínios. O tráfego HTTPS agora está seguro.',
    suggestedStatus: 'answered' as const
  },
  {
    label: '⚙️ Em Análise Técnica',
    text: 'Olá! A nossa equipa de engenharia de sistemas recebeu o seu chamado e já está a analisar a questão técnica. Voltararemos a contactar com novidades em breve.',
    suggestedStatus: 'in_progress' as const
  }
];

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncingData, setIsSyncingData] = useState(true);

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
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [domainLogs, setDomainLogs] = useState<Array<{ id: string; domain: string; extension: string; isAvailable: boolean; timestamp: string; searchCount?: number }>>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Analytics State
  const [onlineUsers, setOnlineUsers] = useState<Array<{ userEmail: string; userName: string; lastSeen: string; currentPage: string; isOnline: boolean }>>([]);
  const [recentPresence, setRecentPresence] = useState<Array<{ userEmail: string; userName: string; lastSeen: string; currentPage: string; isOnline: boolean }>>([]);
  const [visitStats, setVisitStats] = useState<{ total: number; uniqueVisitors: number; topPages: Array<{ page: string; count: number }> }>({ total: 0, uniqueVisitors: 0, topPages: [] });
  const [visitStatsPeriod, setVisitStatsPeriod] = useState<'today' | 'week' | 'month'>('today');

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      auth.logout();
      router.push('/');
    }, 400);
  };
  // Planos pendentes de guardar (chave: userId, valor: novo plano)
  const [pendingPlanChanges, setPendingPlanChanges] = useState<Record<string, 'basic' | 'pro' | 'enterprise'>>({});

  // Tickets de Suporte State
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [adminReplyMessage, setAdminReplyMessage] = useState('');
  const [ticketSearchTerm, setTicketSearchTerm] = useState('');
  const [ticketFilterStatus, setTicketFilterStatus] = useState<'all' | 'open' | 'answered' | 'closed'>('all');
  
  // Anexos Admin
  const [adminReplyAttachments, setAdminReplyAttachments] = useState<TicketAttachment[]>([]);
  const [adminUploading, setAdminUploading] = useState(false);

  // States para Alertas e Modais de Confirmação Customizados
  const [toastMsg, setToastMsg] = useState<{ title?: string; message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [confirmModalData, setConfirmModalData] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info' | 'success';
  } | null>(null);

  const handleAdminFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setAdminUploading(true);
    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          const newAtt: TicketAttachment = {
            url: data.url,
            name: data.name || file.name,
            type: data.type || (file.type.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'pdf' : 'file'),
            bytes: data.bytes || file.size
          };
          setAdminReplyAttachments(prev => [...prev, newAtt]);
        }
      }
    } catch (err) {
      console.error('Erro no upload de anexo do admin:', err);
    } finally {
      setAdminUploading(false);
      e.target.value = '';
    }
  };

  const fetchDomainLogs = async () => {
    try {
      const res = await fetch('/api/domains/history');
      if (res.ok) {
        const data = await res.json();
        if (data.logs) setDomainLogs(data.logs);
      }
    } catch (e) {}
  };

  const fetchAnalytics = async (period: 'today' | 'week' | 'month' = 'today') => {
    try {
      const [presenceRes, visitsRes] = await Promise.all([
        fetch('/api/analytics/presence'),
        fetch(`/api/analytics/visits?period=${period}`),
      ]);
      if (presenceRes.ok) {
        const data = await presenceRes.json();
        setOnlineUsers(data.online || []);
        setRecentPresence(data.recent || []);
      }
      if (visitsRes.ok) {
        const data = await visitsRes.json();
        setVisitStats({ total: data.total || 0, uniqueVisitors: data.uniqueVisitors || 0, topPages: data.topPages || [] });
      }
    } catch (e) {}
  };

  const [isRefreshingAdmin, setIsRefreshingAdmin] = useState(false);

  const handleRefreshAdminData = async () => {
    setIsRefreshingAdmin(true);
    try {
      const [u, o, s, e, t, sec] = await Promise.all([
        auth.fetchUsersAsync(),
        dataManager.fetchOrdersAsync(),
        dataManager.fetchSitesAsync(),
        dataManager.fetchEmailsAsync(),
        dataManager.fetchTicketsAsync(),
        dataManager.fetchSecurityLogsAsync()
      ]);
      if (u) setUsers(u);
      if (o) setOrders(o);
      if (s) setSites(s);
      if (e) setEmails(e);
      if (t) setTickets(t);
      if (sec) setSecurityLogs(sec);
      await Promise.all([fetchDomainLogs(), fetchAnalytics()]);
      setToastMsg({ title: 'Dados Atualizados', message: 'Os dados do servidor MongoDB foram sincronizados com sucesso.', type: 'success' });
    } catch (err) {
      setToastMsg({ title: 'Erro de Sincronização', message: 'Não foi possível atualizar os dados do servidor.', type: 'error' });
    } finally {
      setTimeout(() => setIsRefreshingAdmin(false), 800);
    }
  };

  useEffect(() => {
    // Simulação de admin check
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }

    if (currentUser.role !== 'admin' && currentUser.email.toLowerCase() !== 'admin@wehosthere.com') {
      router.push('/dashboard');
      return;
    }

    // Carregar dados
    setUsers(auth.getUsers());
    setSites(dataManager.getSites());
    setEmails(dataManager.getEmails());
    setOrders(dataManager.getOrders());
    setTickets(dataManager.getTickets());
    setSecurityLogs(dataManager.getSecurityLogs());
    fetchDomainLogs();
    fetchAnalytics();
    setLoading(false);

    // Buscar dados atualizados do servidor via API
    Promise.all([
      auth.fetchUsersAsync().then(u => { if (u) setUsers(u); }),
      dataManager.fetchOrdersAsync().then(o => { if (o) setOrders(o); }),
      dataManager.fetchSitesAsync().then(s => { if (s) setSites(s); }),
      dataManager.fetchEmailsAsync().then(e => { if (e) setEmails(e); }),
      dataManager.fetchTicketsAsync().then(t => { if (t) setTickets(t); })
    ]).finally(() => {
      setIsSyncingData(false);
    });

    // Polling a cada 5s para sincronizar usuários, pedidos, sites, e-mails, tickets e pesquisas em tempo real
    const interval = setInterval(() => {
      auth.fetchUsersAsync().then((fetched) => {
        if (fetched && fetched.length > 0) setUsers(fetched);
      });
      dataManager.fetchOrdersAsync().then((fetched) => {
        if (fetched && fetched.length > 0) setOrders(fetched);
      });
      dataManager.fetchSitesAsync().then((fetched) => {
        if (fetched && fetched.length > 0) setSites(fetched);
      });
      dataManager.fetchEmailsAsync().then((fetched) => {
        if (fetched && fetched.length > 0) setEmails(fetched);
      });
      dataManager.fetchTicketsAsync().then((fetched) => {
        if (fetched && fetched.length > 0) {
          setTickets(fetched);
          setSelectedTicket(prev => prev ? fetched.find(t => t.id === prev.id) || prev : null);
        }
      });
      fetchDomainLogs();
      fetchAnalytics();
      dataManager.fetchSecurityLogsAsync().then((fetched) => {
        if (fetched) setSecurityLogs(fetched);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [router]);

  // Refresh analytics when period changes
  useEffect(() => {
    fetchAnalytics(visitStatsPeriod);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitStatsPeriod]);

  const handleAdminSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || (!adminReplyMessage.trim() && adminReplyAttachments.length === 0)) return;

    const updated = dataManager.addTicketReply(
      selectedTicket.id,
      'support',
      'Equipa de Suporte WeHostHere',
      adminReplyMessage.trim(),
      'answered',
      adminReplyAttachments
    );

    if (updated) {
      setSelectedTicket(updated);
      setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
      setAdminReplyMessage('');
      setAdminReplyAttachments([]);
    }
  };

  const handleAdminUpdateTicketStatus = (ticketId: string, status: SupportTicket['status'], priority?: SupportTicket['priority']) => {
    dataManager.updateTicketStatus(ticketId, status, priority);
    const updatedTickets = dataManager.getTickets();
    setTickets(updatedTickets);
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket(prev => prev ? { ...prev, status, priority: priority || prev.priority } : null);
    }
  };

  const handleUpdateOrderStatus = (id: string, newStatus: ServiceOrder['status']) => {
    dataManager.updateOrderStatus(id, newStatus);
    setOrders(dataManager.getOrders());
  };

  const handleUpdateSiteStatus = (id: string, newStatus: 'active' | 'pending' | 'suspended') => {
    dataManager.updateSiteStatus(id, newStatus);
    const targetSite = sites.find(s => s.id === id);
    if (targetSite) {
      // Auto-atualizar e-mails associados a este domínio
      const domainEmails = emails.filter(e => 
        (e.domain || '').toLowerCase() === targetSite.domain.toLowerCase() || 
        e.email.toLowerCase().endsWith(`@${targetSite.domain.toLowerCase()}`)
      );
      domainEmails.forEach(e => {
        dataManager.updateEmailStatus(e.id, newStatus);
      });
      setEmails(dataManager.getEmails());

      if (newStatus === 'active') {
        fetch('/api/vps/provision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: targetSite.domain,
            clientEmail: 'cliente@wehosthere.co.mz',
            planId: 'pro'
          })
        }).catch(err => console.error('Erro de provisionamento VPS:', err));
      }
    }
    setSites(dataManager.getSites());
  };

  const handleAdminDeleteSite = (id: string, domain: string) => {
    setConfirmModalData({
      isOpen: true,
      title: 'Eliminar Domínio & Site',
      message: `Tem certeza que deseja ELIMINAR permanentemente o domínio "${domain}"? Todos os e-mails associados também serão removidos.`,
      variant: 'danger',
      onConfirm: () => {
        try {
          dataManager.deleteSite(id, domain);
          setSites(prev => prev.filter(s => s.id !== id && s.domain !== domain));
          setEmails(prev => prev.filter(e => (e.domain || '').toLowerCase() !== domain.toLowerCase() && !e.email.toLowerCase().endsWith(`@${domain.toLowerCase()}`)));
          setConfirmModalData(null);
          setToastMsg({ title: 'Domínio Removido', message: `O domínio ${domain} foi totalmente eliminado.`, type: 'success' });
        } catch (err) {
          console.error('Erro ao eliminar site no admin:', err);
          setToastMsg({ title: 'Erro de Eliminação', message: `Não foi possível eliminar o domínio ${domain}.`, type: 'error' });
        }
      }
    });
  };

  const handleAdminDeleteEmail = (id: string, userEmail?: string, emailStr?: string) => {
    const displayEmail = emailStr || id;
    setConfirmModalData({
      isOpen: true,
      title: 'Eliminar Conta de E-mail',
      message: `Tem certeza que deseja ELIMINAR a conta de e-mail "${displayEmail}"?`,
      variant: 'danger',
      onConfirm: () => {
        try {
          dataManager.deleteEmail(id, userEmail, emailStr);
          setEmails(prev => prev.filter(e => e.id !== id && e.email !== displayEmail));
          setConfirmModalData(null);
          setToastMsg({ title: 'E-mail Removido', message: `A conta ${displayEmail} foi eliminada com sucesso.`, type: 'success' });
        } catch (err) {
          console.error('Erro ao eliminar e-mail no admin:', err);
          setToastMsg({ title: 'Erro de Eliminação', message: `Não foi possível eliminar a conta ${displayEmail}.`, type: 'error' });
        }
      }
    });
  };

  const handleAdminDeleteOrder = (orderId: string) => {
    setConfirmModalData({
      isOpen: true,
      title: 'Eliminar Pedido de Serviço',
      message: `Tem certeza que deseja ELIMINAR permanentemente o pedido "${orderId}"? Esta ação removerá a fatura do sistema.`,
      variant: 'danger',
      onConfirm: () => {
        try {
          dataManager.deleteOrder(orderId);
          setOrders(prev => prev.filter(o => o.id !== orderId));
          setConfirmModalData(null);
          setToastMsg({ title: 'Pedido Removido', message: `O pedido ${orderId} foi totalmente eliminado.`, type: 'success' });
        } catch (err) {
          console.error('Erro ao eliminar pedido no admin:', err);
          setToastMsg({ title: 'Erro de Eliminação', message: `Não foi possível eliminar o pedido ${orderId}.`, type: 'error' });
        }
      }
    });
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    try {
      await auth.registerAsync(newName, newEmail, newPassword, newPlan, newStatus, newDueDate);
      setUsers(auth.getUsers());
      setShowAddModal(false);
      setNewName('');
      setNewEmail('');
      setToastMsg({ title: 'Cliente Cadastrado', message: `O cliente ${newName} (${newEmail}) foi cadastrado com sucesso.`, type: 'success' });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Erro ao cadastrar cliente.');
    }
  };

  const handleSavePlanChange = (userId: string, userName: string, userEmail: string) => {
    const newPlanId = pendingPlanChanges[userId];
    if (!newPlanId) return;

    const planPrices: Record<string, number> = { basic: 550, pro: 2500, enterprise: 6200 };
    const planNames: Record<string, string> = { basic: 'Básico', pro: 'Profissional', enterprise: 'Empresarial' };

    // Actualiza o plano do utilizador
    auth.updatePlan(userId, newPlanId);
    setUsers(auth.getUsers());

    // Cria uma fatura de upgrade no sistema de pedidos
    dataManager.addOrder({
      clientName: userName,
      clientEmail: userEmail,
      clientPhone: '',
      serviceName: `Alteração de Plano → ${planNames[newPlanId] || newPlanId}`,
      amount: planPrices[newPlanId] || 0,
      paymentMethod: 'bank_transfer',
      status: 'pending',
    });

    // Limpa o registo de alteração pendente
    setPendingPlanChanges(prev => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });

    setToastMsg({
      title: 'Plano Alterado com Sucesso',
      message: `Plano de "${userName}" alterado para ${planNames[newPlanId]}!\nFatura de ${planPrices[newPlanId].toLocaleString('pt-MZ')} MT gerada.`,
      type: 'success'
    });
  };

  const handleUpdateEmailStatus = (emailId: string, status: 'active' | 'pending' | 'suspended') => {
    dataManager.updateEmailStatus(emailId, status);
    setEmails(dataManager.getEmails());
  };

  const handleDeleteEmail = (emailId: string, emailAddr: string, ownerEmail?: string) => {
    setConfirmModalData({
      isOpen: true,
      title: 'Eliminar Conta de E-mail',
      message: `Tem certeza que deseja ELIMINAR permanentemente a conta de e-mail "${emailAddr}"?`,
      variant: 'danger',
      onConfirm: () => {
        dataManager.deleteEmail(emailId, ownerEmail, emailAddr);
        setEmails(prev => prev.filter(e => e.id !== emailId && e.email !== emailAddr));
        setConfirmModalData(null);
        setToastMsg({ title: 'E-mail Removido', message: `Conta ${emailAddr} eliminada com sucesso.`, type: 'success' });
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const actualOrdersRevenue = orders.reduce((acc, order) => acc + (order.status !== 'cancelled' ? order.amount : 0), 0);

  const clientUsers = users.filter(u => u.role !== 'admin' && u.email.toLowerCase() !== 'admin@wehosthere.com');

  const mrr = clientUsers.reduce((acc, user) => {
    const planPrices = { basic: 1200, pro: 3000, enterprise: 6200 };
    return acc + (planPrices[user.plan as keyof typeof planPrices] || 0);
  }, 0);

  const totalRevenue = actualOrdersRevenue > 0 ? actualOrdersRevenue : mrr;

  const averageTicket = orders.length > 0 ? Math.round(totalRevenue / orders.length) : (clientUsers.length > 0 ? Math.round(mrr / clientUsers.length) : 0);

  const mpesaRevenue = orders.filter(o => o.paymentMethod === 'mpesa' && o.status !== 'cancelled').reduce((acc, o) => acc + o.amount, 0);
  const emolaRevenue = orders.filter(o => o.paymentMethod === 'emola' && o.status !== 'cancelled').reduce((acc, o) => acc + o.amount, 0);
  const cardRevenue = orders.filter(o => o.paymentMethod === 'card' && o.status !== 'cancelled').reduce((acc, o) => acc + o.amount, 0);
  const validOrdersTotal = (mpesaRevenue + emolaRevenue + cardRevenue) || 1;

  const getUserStatus = (user: User) => {
    // Respeitar decisão explícita do Administrador
    if (user.status === 'active') return 'active';
    if (user.status === 'suspended') return 'suspended';
    if (user.status === 'pending') return 'pending';

    const today = new Date();
    const currentDay = today.getDate();
    const dueDay = user.dueDate || 29;

    if (currentDay > dueDay + 5) {
      return 'suspended';
    } else if (currentDay > dueDay) {
      return 'pending';
    }

    return 'active';
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

  if (loading) {
    return <PageLoader text="A carregar painel de administração..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {isLoggingOut && <PageLoader text="A encerrar a sua sessão com segurança... Até breve!" />}
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <BrandLogo />
              <span className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full border border-purple-200">
                ADMIN
              </span>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                type="button"
                onClick={handleRefreshAdminData}
                disabled={isRefreshingAdmin}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 rounded-lg transition shadow-sm cursor-pointer disabled:opacity-50"
                title="Sincronizar dados em tempo real com o MongoDB Atlas"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-purple-600 ${isRefreshingAdmin ? 'animate-spin' : ''}`} />
                <span>{isRefreshingAdmin ? 'A atualizar...' : 'Atualizar Dados'}</span>
              </button>

              <Link
                href="/"
                className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 font-medium transition text-xs sm:text-sm"
              >
                <Home className="h-4 w-4 text-gray-500" />
                <span>Ver Site</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-red-600 font-medium transition text-xs sm:text-sm"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ───── ANALYTICS — Quem está Online & Visitantes ───── */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">

          {/* Painel: Utilizadores Online Agora */}
          <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                <h3 className="font-bold text-gray-900 text-sm">Online Agora</h3>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${onlineUsers.length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                {onlineUsers.length} utilizador{onlineUsers.length !== 1 ? 'es' : ''}
              </span>
            </div>

            <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
              {onlineUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <WifiOff className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">Nenhum utilizador online</p>
                </div>
              ) : (
                onlineUsers.map(u => (
                  <div key={u.userEmail} className="flex items-center space-x-3 px-5 py-3 hover:bg-gray-50 transition">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {u.userName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{u.userName}</p>
                      <p className="text-xs text-gray-500 truncate">{u.currentPage}</p>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-full whitespace-nowrap">ONLINE</span>
                  </div>
                ))
              )}
            </div>

            {/* Histórico Recente de Presença */}
            {recentPresence.filter(p => !onlineUsers.find(o => o.userEmail === p.userEmail)).length > 0 && (
              <div className="border-t border-gray-100">
                <p className="px-5 py-2 text-[10px] uppercase tracking-wider text-gray-400 font-semibold bg-gray-50">Vistos recentemente</p>
                <div className="divide-y divide-gray-50 max-h-40 overflow-y-auto">
                  {recentPresence
                    .filter(p => !onlineUsers.find(o => o.userEmail === p.userEmail))
                    .slice(0, 5)
                    .map(u => {
                      const lastSeenDate = new Date(u.lastSeen);
                      const diffMin = Math.floor((Date.now() - lastSeenDate.getTime()) / 60000);
                      const timeLabel = diffMin < 60 ? `${diffMin}m atrás` : `${Math.floor(diffMin / 60)}h atrás`;
                      return (
                        <div key={u.userEmail} className="flex items-center space-x-3 px-5 py-2.5 hover:bg-gray-50 transition">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs flex-shrink-0">
                            {u.userName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-700 truncate">{u.userName}</p>
                            <p className="text-[10px] text-gray-400 truncate">{u.currentPage}</p>
                          </div>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap">{timeLabel}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Painel: Visitantes do Site */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center space-x-2">
                <BarChart2 className="h-5 w-5 text-primary-600" />
                <h3 className="font-bold text-gray-900 text-sm">Visitantes do Site</h3>
              </div>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-semibold">
                {(['today', 'week', 'month'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setVisitStatsPeriod(p)}
                    className={`px-3 py-1.5 transition ${visitStatsPeriod === p ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    {p === 'today' ? 'Hoje' : p === 'week' ? '7 dias' : '30 dias'}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 grid grid-cols-2 gap-4 border-b border-gray-100">
              <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
                <div className="flex items-center space-x-2 mb-1">
                  <Eye className="h-4 w-4 text-primary-600" />
                  <span className="text-xs text-primary-600 font-semibold uppercase tracking-wider">Visualizações</span>
                </div>
                <p className="text-3xl font-extrabold text-primary-700">{visitStats.total.toLocaleString('pt-MZ')}</p>
                <p className="text-xs text-primary-500 mt-0.5">páginas vistas</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <div className="flex items-center space-x-2 mb-1">
                  <Users className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">Visitantes Únicos</span>
                </div>
                <p className="text-3xl font-extrabold text-emerald-700">{visitStats.uniqueVisitors.toLocaleString('pt-MZ')}</p>
                <p className="text-xs text-emerald-500 mt-0.5">sessões distintas</p>
              </div>
            </div>

            {/* Top Páginas */}
            <div className="p-5">
              <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3">Top Páginas</p>
              {visitStats.topPages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                  <Globe className="h-7 w-7 mb-2 opacity-40" />
                  <p className="text-sm">Sem dados de visitas ainda</p>
                  <p className="text-xs text-gray-400 mt-1">As visitas aparecerão aqui em tempo real</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {visitStats.topPages.map((pg, i) => {
                    const maxCount = visitStats.topPages[0]?.count || 1;
                    const pct = Math.round((pg.count / maxCount) * 100);
                    return (
                      <div key={pg.page} className="flex items-center space-x-3">
                        <span className="text-xs text-gray-400 w-4 text-right font-bold">{i + 1}</span>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-gray-700 truncate max-w-[200px]">{pg.page}</span>
                            <span className="text-xs text-gray-500 font-semibold ml-2">{pg.count}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div className="bg-primary-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
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

        {/* Top KPIs */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 text-primary-600" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total</span>
            </div>
            {isSyncingData ? (
              <div className="flex items-center space-x-2 text-primary-600 my-1 font-semibold">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-sm text-gray-500">A processar...</span>
              </div>
            ) : (
              <p className="text-3xl font-bold text-gray-900">{users.length}</p>
            )}
            <p className="text-gray-500 text-sm mt-1">Usuários cadastrados</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <Server className="h-8 w-8 text-primary-600" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total</span>
            </div>
            {isSyncingData ? (
              <div className="flex items-center space-x-2 text-primary-600 my-1 font-semibold">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-sm text-gray-500">A processar...</span>
              </div>
            ) : (
              <p className="text-3xl font-bold text-gray-900">{sites.length}</p>
            )}
            <p className="text-gray-500 text-sm mt-1">Sites ativos</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="h-8 w-8 text-emerald-600" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Faturamento</span>
            </div>
            {isSyncingData ? (
              <div className="flex items-center space-x-2 text-emerald-600 my-1 font-semibold">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-sm text-gray-500">A processar...</span>
              </div>
            ) : (
              <p className="text-3xl font-bold text-emerald-600">{totalRevenue.toLocaleString('pt-MZ')} MT</p>
            )}
            <p className="text-gray-500 text-sm mt-1">Receita total acumulada</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-700">MRR Mensal</span>
            </div>
            {isSyncingData ? (
              <div className="flex items-center space-x-2 text-purple-600 my-1 font-semibold">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-sm text-gray-500">A processar...</span>
              </div>
            ) : (
              <p className="text-3xl font-bold text-purple-700">{mrr.toLocaleString('pt-MZ')} MT</p>
            )}
            <p className="text-gray-500 text-sm mt-1">Receita recorrente garantida</p>
          </div>
        </div>

        {/* Módulo de Análise Financeira & Métricas Recorrentes */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <DollarSign className="h-6 w-6 text-emerald-600" />
                <span>Análise Financeira & Desempenho de Vendas (WEHOSTINC)</span>
              </h2>
              <p className="text-gray-500 text-sm mt-0.5">Métricas de faturamento em Meticais, ticket médio e liquidação via M-Pesa / eMola</p>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-3 py-1.5 rounded-full border border-emerald-300">
              Projeção Anual: {(mrr * 12).toLocaleString('pt-MZ')} MT
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-6 pt-2">
            {/* Ticket Médio */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Ticket Médio por Cliente</span>
              <span className="text-2xl font-black text-gray-900 block mt-1">{averageTicket.toLocaleString('pt-MZ')} MT</span>
              <span className="text-xs text-gray-500 mt-1 block">Média de gasto por contratação na plataforma</span>
            </div>

            {/* Faturamento M-Pesa */}
            <div className="p-4 bg-red-50/70 border border-red-200 rounded-xl">
              <span className="text-xs font-bold text-red-900 uppercase tracking-wider block">Faturamento via M-Pesa (Vodacom)</span>
              <span className="text-2xl font-black text-red-700 block mt-1">{mpesaRevenue.toLocaleString('pt-MZ')} MT</span>
              <div className="w-full bg-red-200 h-2 rounded-full mt-2">
                <div className="bg-red-600 h-2 rounded-full" style={{ width: `${Math.round((mpesaRevenue / validOrdersTotal) * 100)}%` }}></div>
              </div>
              <span className="text-[11px] font-semibold text-red-700 mt-1 block">{Math.round((mpesaRevenue / validOrdersTotal) * 100)}% do volume de vendas</span>
            </div>

            {/* Faturamento eMola / Cartão */}
            <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-xl">
              <span className="text-xs font-bold text-orange-900 uppercase tracking-wider block">eMola (Movitel) & Cartão</span>
              <span className="text-2xl font-black text-orange-700 block mt-1">{(emolaRevenue + cardRevenue).toLocaleString('pt-MZ')} MT</span>
              <div className="w-full bg-orange-200 h-2 rounded-full mt-2">
                <div className="bg-orange-600 h-2 rounded-full" style={{ width: `${Math.round(((emolaRevenue + cardRevenue) / validOrdersTotal) * 100)}%` }}></div>
              </div>
              <span className="text-[11px] font-semibold text-orange-700 mt-1 block">{Math.round(((emolaRevenue + cardRevenue) / validOrdersTotal) * 100)}% do volume de vendas</span>
            </div>
          </div>
        </div>

        {/* Módulo de Alertas Críticos & Auditoria de Segurança */}
        <div className="bg-white border border-red-200 rounded-xl p-6 shadow-sm mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Shield className="h-6 w-6 text-red-600" />
                <span>Central de Alertas Críticos & Auditoria de Segurança</span>
              </h2>
              <p className="text-gray-500 text-sm mt-0.5">Registo em tempo real de tentativas maliciosas de login, bloqueios por força bruta e alertas da plataforma</p>
            </div>
            <span className="bg-red-100 text-red-800 text-xs font-extrabold px-3 py-1.5 rounded-full border border-red-300 flex items-center space-x-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
              <span>{securityLogs.filter(l => l.type === 'account_locked').length} Bloqueios Críticos</span>
            </span>
          </div>

          {securityLogs.length === 0 ? (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <span>Nenhum alerta crítico de invasão ou tentativa incorreta de login detetado recentemente. O sistema está seguro.</span>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-64 overflow-y-auto border border-gray-100 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-3">E-mail Alvo</th>
                    <th className="py-2.5 px-3">Evento / Tipo</th>
                    <th className="py-2.5 px-3">Descrição do Alerta</th>
                    <th className="py-2.5 px-3 text-right">Data & Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {securityLogs.slice(0, 15).map((log) => (
                    <tr key={log.id} className="hover:bg-red-50/40 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-gray-900">{log.email}</td>
                      <td className="py-2.5 px-3">
                        {log.type === 'account_locked' && (
                          <span className="bg-red-600 text-white font-extrabold px-2 py-0.5 rounded text-[10px] tracking-wide uppercase">
                            🔒 Conta Bloqueada (15m)
                          </span>
                        )}
                        {log.type === 'failed_login' && (
                          <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px]">
                            ⚠️ Senha Incorreta
                          </span>
                        )}
                        {log.type === 'suspended_attempt' && (
                          <span className="bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded text-[10px]">
                            ⛔ Tentativa Conta Suspensa
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-gray-700">{log.message}</td>
                      <td className="py-2.5 px-3 text-right text-gray-500 font-mono">
                        {new Date(log.createdAt).toLocaleString('pt-MZ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
                        {user.role === 'admin' || user.email.toLowerCase() === 'admin@wehosthere.com' ? (
                          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">
                            👑 Administrador
                          </span>
                        ) : (
                          <>
                            <select
                              value={pendingPlanChanges[user.id] ?? user.plan}
                              onChange={(e) => {
                                const newVal = e.target.value as 'basic' | 'pro' | 'enterprise';
                                if (newVal === user.plan) {
                                  // Voltou ao original — remove alteração pendente
                                  setPendingPlanChanges(prev => {
                                    const next = { ...prev };
                                    delete next[user.id];
                                    return next;
                                  });
                                } else {
                                  setPendingPlanChanges(prev => ({ ...prev, [user.id]: newVal }));
                                }
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold outline-none border cursor-pointer ${
                                (pendingPlanChanges[user.id] ?? user.plan) === 'basic' ? 'bg-gray-100 text-gray-800 border-gray-300' :
                                (pendingPlanChanges[user.id] ?? user.plan) === 'pro' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                                'bg-purple-50 text-purple-800 border-purple-300'
                              }`}
                            >
                              <option value="basic">Básico (550 MT/mês)</option>
                              <option value="pro">Profissional (2.500 MT/mês)</option>
                              <option value="enterprise">Empresarial (6.200 MT/mês)</option>
                            </select>
                            {pendingPlanChanges[user.id] && (
                              <button
                                type="button"
                                onClick={() => handleSavePlanChange(user.id, user.name, user.email)}
                                className="mt-1 w-full px-2 py-0.5 bg-primary-600 hover:bg-primary-700 text-white text-[10px] font-extrabold rounded-md transition cursor-pointer"
                              >
                                💾 Guardar
                              </button>
                            )}
                          </>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 text-sm font-medium">
                        {user.dueDate ? `Dia ${user.dueDate}` : 'Dia 29'}
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={user.status || 'active'}
                          onChange={(e) => {
                            const newSt = e.target.value as 'active' | 'pending' | 'suspended';
                            auth.updateUserStatus(user.id, newSt);
                            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newSt } : u));
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold outline-none border cursor-pointer ${
                            (user.status || 'active') === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : (user.status || 'active') === 'pending'
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
                              const currentSt = user.status || 'active';
                              const newStatus = currentSt === 'suspended' ? 'active' : 'suspended';
                              auth.updateUserStatus(user.id, newStatus);
                              setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
                            }}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                              (user.status || 'active') === 'suspended'
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                            }`}
                          >
                            {(user.status || 'active') === 'suspended' ? 'Reativar' : 'Suspender'}
                          </button>

                          <button
                            onClick={() => {
                              setConfirmModalData({
                                isOpen: true,
                                title: 'Eliminar Cliente',
                                message: `Tem certeza que deseja eliminar permanentemente o cliente "${user.name}" (${user.email})?`,
                                variant: 'danger',
                                onConfirm: () => {
                                  auth.deleteUser(user.id, user.email);
                                  setUsers(auth.getUsers());
                                  setConfirmModalData(null);
                                  setToastMsg({ title: 'Cliente Eliminado', message: `O cliente ${user.name} foi removido da plataforma.`, type: 'success' });
                                }
                              });
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
                            title="Eliminar cliente"
                          >
                            <Trash2 className="h-4 w-4" />
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
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Cliente / Contacto</th>
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
                        <span className="text-xs font-semibold uppercase text-gray-500">
                          {order.paymentMethod === 'bank_transfer' ? 'Transferência' : order.paymentMethod}
                        </span>
                        {order.proofUrl && (
                          <a
                            href={order.proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold hover:bg-emerald-200 transition"
                            title={order.proofName || 'Ver Comprovativo'}
                          >
                            <FileText className="w-3 h-3 text-emerald-700" />
                            <span>📄 Ver Comprovativo</span>
                          </a>
                        )}
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
                              : order.status === 'suspended'
                              ? 'bg-red-50 text-red-700 border-red-300'
                              : 'bg-gray-100 text-gray-700 border-gray-300'
                          }`}
                        >
                          <option value="pending">Pendente (⏰)</option>
                          <option value="in_progress">Em Desenvolvimento (⚙️)</option>
                          <option value="completed">Concluído / Ativo (✓)</option>
                          <option value="suspended">Suspenso (🛑)</option>
                          <option value="cancelled">Cancelado (✗)</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          {order.proofUrl && order.status !== 'completed' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-md shadow transition flex items-center space-x-1 cursor-pointer"
                              title="Aprovar Comprovativo de Pagamento"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              <span>Aprovar</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              const newStatus = order.status === 'suspended' ? 'completed' : 'suspended';
                              handleUpdateOrderStatus(order.id, newStatus);
                            }}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                              order.status === 'suspended'
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                            }`}
                          >
                            {order.status === 'suspended' ? 'Reativar Serviço' : 'Suspender Serviço'}
                          </button>

                          <a
                            href={`https://wa.me/${order.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${order.clientName}, referente ao seu pedido de serviço ${order.serviceName} na WEHOSTHERE:`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-md transition"
                            title="Contacto via WhatsApp"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </a>

                          <button
                            onClick={() => handleAdminDeleteOrder(order.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
                            title="Eliminar Pedido / Fatura"
                          >
                            <Trash2 className="h-4 w-4" />
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

        {/* Gestão e Aprovação de Contas de E-mail Corporativo */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Mail className="h-6 w-6 text-primary-600" />
                <span>Aprovação & Gestão de E-mails Corporativos</span>
              </h2>
              <p className="text-sm text-gray-500 mt-1">Aprove ou suspenda solicitações de caixas de e-mail corporativo criadas pelos clientes</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-300">
                {emails.filter(e => e.status === 'pending' || !e.status).length} Pendente(s)
              </span>
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-300">
                {emails.length} Totais
              </span>
            </div>
          </div>

          {emails.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Nenhuma conta de email criada</h3>
              <p className="text-gray-500">As contas criadas pelos clientes no painel aparecerão aqui para aprovação</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">E-mail Corporativo</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Cliente / Utilizador</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Armazenamento</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Data de Criação</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Estado / Aprovação</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {emails.map((emailAcc) => {
                    const isPending = emailAcc.status === 'pending' || !emailAcc.status;
                    return (
                      <tr key={emailAcc.id} className="hover:bg-gray-50/80 transition">
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-gray-900 text-sm block">{emailAcc.email}</span>
                          <span className="text-xs text-primary-600 font-semibold">@{emailAcc.domain || emailAcc.email.split('@')[1]}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-gray-900 text-sm block">{emailAcc.userEmail || 'Cliente Plataforma'}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-gray-700 text-xs">{emailAcc.quotaGB || 5} GB</span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-gray-500">
                          {emailAcc.createdAt ? new Date(emailAcc.createdAt).toLocaleDateString('pt-BR') : 'Hoje'}
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={emailAcc.status || 'pending'}
                            onChange={(e) => handleUpdateEmailStatus(emailAcc.id, e.target.value as any)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold outline-none border cursor-pointer ${
                              emailAcc.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : emailAcc.status === 'suspended'
                                ? 'bg-red-50 text-red-700 border-red-300'
                                : 'bg-amber-50 text-amber-700 border-amber-300'
                            }`}
                          >
                            <option value="pending">Em Processamento (⏰)</option>
                            <option value="active">Ativo (✓)</option>
                            <option value="suspended">Suspenso (🛑)</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-2">
                            {isPending && (
                              <button
                                onClick={() => handleUpdateEmailStatus(emailAcc.id, 'active')}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs transition flex items-center space-x-1.5 cursor-pointer"
                                title="Aprovar e Ativar Conta de Email"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                <span>Aprovar Conta</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteEmail(emailAcc.id, emailAcc.email, emailAcc.userEmail)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="Eliminar Conta de E-mail"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Gestão de Tickets de Suporte (Helpdesk) */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <LifeBuoy className="h-6 w-6 text-primary-600" />
                <span>Central de Tickets de Suporte (Helpdesk)</span>
              </h2>
              <p className="text-sm text-gray-500 mt-1">Atendimento ao cliente, resposta a chamados técnicos e faturamento</p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-300">
                {tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length} Pendente(s)
              </span>
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-300">
                {tickets.length} Totais
              </span>
            </div>
          </div>

          {/* Filtros e Busca de Tickets */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 pt-4 border-t border-gray-100">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={ticketSearchTerm}
                onChange={(e) => setTicketSearchTerm(e.target.value)}
                placeholder="Buscar por ID, cliente, e-mail ou assunto..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center space-x-1.5 w-full md:w-auto overflow-x-auto">
              <button
                onClick={() => setTicketFilterStatus('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  ticketFilterStatus === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Todos ({tickets.length})
              </button>
              <button
                onClick={() => setTicketFilterStatus('open')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  ticketFilterStatus === 'open' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                Abertos ({tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length})
              </button>
              <button
                onClick={() => setTicketFilterStatus('answered')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  ticketFilterStatus === 'answered' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                Respondidos ({tickets.filter(t => t.status === 'answered').length})
              </button>
              <button
                onClick={() => setTicketFilterStatus('closed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  ticketFilterStatus === 'closed' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Fechados ({tickets.filter(t => t.status === 'closed').length})
              </button>
            </div>
          </div>

          {tickets.length === 0 ? (
            <div className="text-center py-12">
              <LifeBuoy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Nenhum ticket registrado</h3>
              <p className="text-gray-500">Os chamados abertos pelos clientes aparecerão aqui</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">ID / Data</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Cliente / Contacto</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Assunto / Categoria</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Prioridade</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tickets
                    .filter(t => {
                      const matchesSearch = 
                        t.subject.toLowerCase().includes(ticketSearchTerm.toLowerCase()) ||
                        t.userName.toLowerCase().includes(ticketSearchTerm.toLowerCase()) ||
                        t.userEmail.toLowerCase().includes(ticketSearchTerm.toLowerCase()) ||
                        t.id.toLowerCase().includes(ticketSearchTerm.toLowerCase());
                      if (ticketFilterStatus === 'open') return matchesSearch && (t.status === 'open' || t.status === 'in_progress');
                      if (ticketFilterStatus === 'answered') return matchesSearch && t.status === 'answered';
                      if (ticketFilterStatus === 'closed') return matchesSearch && t.status === 'closed';
                      return matchesSearch;
                    })
                    .map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-gray-50/80 transition">
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-gray-900 text-sm block">{ticket.id}</span>
                          <span className="text-xs text-gray-400">{new Date(ticket.createdAt).toLocaleDateString('pt-MZ')}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-gray-900 block">{ticket.userName}</span>
                          <span className="text-xs text-gray-500 font-mono block">{ticket.userEmail}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-gray-900 text-sm block">{ticket.subject}</span>
                          <span className="text-[11px] font-semibold text-gray-500 uppercase">{ticket.category}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={ticket.priority}
                            onChange={(e) => handleAdminUpdateTicketStatus(ticket.id, ticket.status, e.target.value as any)}
                            className={`px-2 py-1 rounded text-xs font-bold border outline-none cursor-pointer ${
                              ticket.priority === 'urgent' ? 'bg-red-100 text-red-700 border-red-300' :
                              ticket.priority === 'high' ? 'bg-orange-100 text-orange-700 border-orange-300' :
                              ticket.priority === 'medium' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                              'bg-gray-100 text-gray-700 border-gray-300'
                            }`}
                          >
                            <option value="low">Baixa</option>
                            <option value="medium">Média</option>
                            <option value="high">Alta</option>
                            <option value="urgent">Urgente 🔥</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={ticket.status}
                            onChange={(e) => handleAdminUpdateTicketStatus(ticket.id, e.target.value as any)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold outline-none border cursor-pointer ${
                              ticket.status === 'answered' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                              ticket.status === 'in_progress' ? 'bg-purple-50 text-purple-700 border-purple-300' :
                              ticket.status === 'open' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                              'bg-gray-100 text-gray-700 border-gray-300'
                            }`}
                          >
                            <option value="open">Aberto (⏰)</option>
                            <option value="in_progress">Em Análise (⚙️)</option>
                            <option value="answered">Respondido (✓)</option>
                            <option value="closed">Fechado (🛑)</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => setSelectedTicket(ticket)}
                            className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-lg shadow transition flex items-center space-x-1.5 cursor-pointer"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>Atender / Responder</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Gestão de Domínios e Sites */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Gestão de Domínios e Sites</h2>
              <p className="text-gray-500 text-sm">Aprove registros e gerencie o status dos domínios dos clientes em tempo real</p>
            </div>
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-300">
              {sites.filter(s => s.status === 'pending').length} Domínio(s) Pendente(s)
            </span>
          </div>

          {/* Banner de Name Servers para cópia pelo Admin */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-blue-900 block">🌐 Servidores de Nomes Oficiais WEHOSTHERE para Apontamento:</span>
              <span className="text-blue-700">Insira na CIUEM ou Namecheap ao registrar o domínio do cliente:</span>
            </div>
            <div className="flex items-center space-x-2 font-mono font-bold text-blue-900 bg-white px-3 py-1.5 rounded-lg border border-blue-200">
              <span>ns1.wehosthere.com</span>
              <span className="text-gray-300">|</span>
              <span>ns2.wehosthere.com</span>
            </div>
          </div>

          {sites.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Nenhum domínio ou site cadastrado até o momento.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Domínio</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Status Atual</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Data de Cadastro</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Ação do Administrador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sites.map((site) => (
                    <tr key={site.id} className="hover:bg-gray-50/80 transition">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-gray-900 block">{site.domain}</span>
                        <span className="text-xs text-gray-500">{site.name}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                          site.status === 'active' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                          site.status === 'pending' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                          'bg-red-50 text-red-800 border-red-300'
                        }`}>
                          <span>{site.status === 'active' ? '🟢 Ativo' : site.status === 'pending' ? '🟡 Pendente (Processando)' : '🔴 Suspenso'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-500 font-mono">
                        {new Date(site.createdAt).toLocaleDateString('pt-MZ')}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          {site.status === 'pending' ? (
                            <button
                              onClick={() => handleUpdateSiteStatus(site.id, 'active')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow transition flex items-center space-x-1.5 cursor-pointer"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              <span>Ativar Domínio Agora</span>
                            </button>
                          ) : (
                            <select
                              value={site.status}
                              onChange={(e) => handleUpdateSiteStatus(site.id, e.target.value as any)}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-gray-300 bg-white outline-none cursor-pointer"
                            >
                              <option value="active">🟢 Ativo</option>
                              <option value="pending">🟡 Pendente</option>
                              <option value="suspended">🔴 Suspenso</option>
                            </select>
                          )}
                          <button
                            onClick={() => handleAdminDeleteSite(site.id, site.domain)}
                            title="Eliminar Domínio"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
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

        {/* Gestão Global de Contas de E-mail Corporativo */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Mail className="h-5 w-5 text-primary-600" />
                <span>Gestão Global de Contas de E-mail Corporativo</span>
              </h2>
              <p className="text-gray-500 text-sm">Visualize, altere status e elimine qualquer conta de e-mail criada por clientes</p>
            </div>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-300">
              {emails.length} Conta(s) Registrada(s)
            </span>
          </div>

          {emails.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Nenhuma conta de e-mail corporativo cadastrada.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">E-mail Corporativo</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Cliente Proprietário</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {emails.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-900 text-sm">
                        {item.email}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-600">
                        {item.userEmail || 'Desconhecido'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          item.status === 'active' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}>
                          <span>{item.status === 'active' ? '🟢 Ativo' : '🟡 Pendente (Processando)'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              const newStatus = item.status === 'active' ? 'pending' : 'active';
                              dataManager.updateEmailStatus(item.id, newStatus);
                              setEmails(dataManager.getEmails());
                            }}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition cursor-pointer ${
                              item.status === 'active' ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                          >
                            {item.status === 'active' ? 'Suspender/Pendente' : 'Aprovar E-mail'}
                          </button>
                          <button
                            onClick={() => handleAdminDeleteEmail(item.id, item.userEmail, item.email)}
                            title="Eliminar E-mail Permanentemente"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
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

        {/* Histórico de Pesquisas de Domínio em Tempo Real */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Search className="h-5 w-5 text-primary-600" />
                <span>Histórico de Pesquisas de Domínio (Tempo Real)</span>
              </h2>
              <p className="text-gray-500 text-sm">Acompanhe os nomes de domínio que os visitantes estão buscando no site</p>
            </div>

            <div className="flex items-center space-x-3">
              <span className="bg-primary-50 text-primary-800 text-xs font-bold px-3 py-1.5 rounded-full border border-primary-200">
                {domainLogs.length} Buscas Registradas
              </span>
              <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200">
                {domainLogs.filter(l => l.isAvailable).length} Livres ({domainLogs.length > 0 ? Math.round((domainLogs.filter(l => l.isAvailable).length / domainLogs.length) * 100) : 0}%)
              </span>
            </div>
          </div>

          {domainLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Nenhuma pesquisa realizada no site ainda. As buscas dos clientes aparecerão aqui em tempo real!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Domínio Consultado</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Extensão</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Resultado da Busca</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Horário da Busca</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {domainLogs.slice(0, 15).map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/80 transition">
                      <td className="py-3 px-4 font-mono text-sm font-bold text-gray-900 flex items-center space-x-2">
                        <span>{log.domain}</span>
                        {log.searchCount && log.searchCount > 1 && (
                          <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full" title={`Pesquisado ${log.searchCount} vezes`}>
                            🔥 {log.searchCount}x buscas
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2 py-0.5 rounded">
                          {log.extension}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {log.isAvailable ? (
                          <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                            <span>LIVRE PARA REGISTRO</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 bg-red-50 text-red-800 border border-red-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                            <XCircle className="h-3.5 w-3.5 text-red-600" />
                            <span>INDISPONÍVEL / OCUPADO</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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
                    <option value="basic">Básico (550 MT/mês)</option>
                    <option value="pro">Profissional (2.500 MT/mês)</option>
                    <option value="enterprise">Empresarial (6.200 MT/mês)</option>
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

      {/* Modal / Thread de Atendimento do Ticket no Admin */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full flex flex-col max-h-[90vh] shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header da Conversa */}
            <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50 rounded-t-3xl">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-gray-500">{selectedTicket.id}</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    Cliente: {selectedTicket.userName} ({selectedTicket.userEmail})
                  </span>
                </div>
                <h2 className="text-xl font-black text-gray-900">{selectedTicket.subject}</h2>
              </div>

              <div className="flex items-center space-x-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Alterar Status</label>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleAdminUpdateTicketStatus(selectedTicket.id, e.target.value as any)}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg border border-gray-300 bg-white outline-none cursor-pointer"
                  >
                    <option value="open">Aberto (⏰)</option>
                    <option value="in_progress">Em Análise (⚙️)</option>
                    <option value="answered">Respondido (✓)</option>
                    <option value="closed">Fechado (🛑)</option>
                  </select>
                </div>

                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Corpo das Mensagens */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-gray-50/30">
              {selectedTicket.messages.map((msg) => {
                const isClient = msg.sender === 'client';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isClient ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-bold text-gray-700">
                        {isClient ? msg.senderName : (
                          <span className="flex items-center space-x-1 text-primary-700 font-bold">
                            <ShieldCheck className="w-3.5 h-3.5 text-primary-600" />
                            <span>{msg.senderName} (Suporte)</span>
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(msg.timestamp).toLocaleDateString('pt-PT')} às {new Date(msg.timestamp).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div
                      className={`max-w-xl p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                        !isClient
                          ? 'bg-primary-600 text-white rounded-br-none shadow-sm'
                          : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none shadow-sm'
                      }`}
                    >
                      {msg.message}

                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-3 space-y-2 border-t border-gray-100/30 pt-2">
                          {msg.attachments.map((att, idx) => (
                            <div key={idx} className="flex items-center space-x-2">
                              {att.type === 'image' ? (
                                <div className="group relative rounded-xl overflow-hidden border border-gray-200 bg-black/5 mt-1">
                                  <img src={att.url} alt={att.name} className="max-h-48 max-w-full rounded-xl object-cover" />
                                  <a
                                    href={att.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute bottom-2 right-2 bg-black/70 hover:bg-black text-white p-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 backdrop-blur-sm transition"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span>Ver Imagem</span>
                                  </a>
                                </div>
                              ) : (
                                <a
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={att.name}
                                  className={`inline-flex items-center space-x-2.5 p-3 rounded-xl border text-xs font-bold transition ${
                                    !isClient
                                      ? 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                                      : 'bg-gray-50 hover:bg-gray-100 text-gray-800 border-gray-200'
                                  }`}
                                >
                                  <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                                  <span className="truncate max-w-[200px]">{att.name}</span>
                                  <Download className="w-3.5 h-3.5 opacity-70" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Formulário de Resposta pelo Admin */}
            <div className="p-4 sm:p-6 border-t border-gray-200 bg-white rounded-b-3xl">
              <form onSubmit={handleAdminSendReply} className="flex flex-col gap-3">
                {/* Respostas Rápidas / Canned Responses */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center space-x-1">
                    <Tag className="w-3.5 h-3.5 text-primary-600" />
                    <span>Respostas Rápidas do Atendimento</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {ADMIN_CANNED_RESPONSES.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setAdminReplyMessage(item.text);
                          if (selectedTicket) {
                            handleAdminUpdateTicketStatus(selectedTicket.id, item.suggestedStatus);
                          }
                        }}
                        className="px-2.5 py-1 bg-gray-100 hover:bg-primary-50 hover:text-primary-800 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {adminReplyAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {adminReplyAttachments.map((att, idx) => (
                      <div key={idx} className="flex items-center space-x-1.5 bg-primary-50 text-primary-900 border border-primary-200 px-3 py-1.5 rounded-xl text-xs font-semibold">
                        {att.type === 'image' ? <ImageIcon className="w-3.5 h-3.5 text-primary-600" /> : <FileText className="w-3.5 h-3.5 text-red-500" />}
                        <span className="truncate max-w-[150px]">{att.name}</span>
                        <button
                          type="button"
                          onClick={() => setAdminReplyAttachments(prev => prev.filter((_, i) => i !== idx))}
                          className="p-0.5 text-gray-400 hover:text-red-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <textarea
                  rows={3}
                  placeholder="Escreva a resposta oficial do suporte para o cliente..."
                  value={adminReplyMessage}
                  onChange={(e) => setAdminReplyMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                ></textarea>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <label className="cursor-pointer inline-flex items-center space-x-2 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition border border-gray-200">
                      {adminUploading ? <Loader2 className="w-4 h-4 animate-spin text-primary-600" /> : <Paperclip className="w-4 h-4" />}
                      <span>Anexar Imagem/PDF</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={handleAdminFileUpload}
                        disabled={adminUploading}
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={!adminReplyMessage.trim() && adminReplyAttachments.length === 0}
                    className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow transition flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar Resposta ao Cliente</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Custom Confirm Modal */}
      {confirmModalData && (
        <ConfirmModal
          isOpen={confirmModalData.isOpen}
          title={confirmModalData.title}
          message={confirmModalData.message}
          confirmText="Sim, Confirmar"
          cancelText="Cancelar"
          variant={confirmModalData.variant || 'danger'}
          onConfirm={confirmModalData.onConfirm}
          onCancel={() => setConfirmModalData(null)}
        />
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <Toast
          type={toastMsg.type}
          title={toastMsg.title}
          message={toastMsg.message}
          onClose={() => setToastMsg(null)}
        />
      )}
    </div>
  );
}
