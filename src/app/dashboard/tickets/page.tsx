/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  LifeBuoy, Plus, Search, Filter, MessageSquare, Clock, CheckCircle2, 
  AlertCircle, ChevronRight, X, Send, User as UserIcon, ShieldCheck, Tag,
  Paperclip, FileText, Image as ImageIcon, Download, ExternalLink, File, Trash2, Loader2
} from 'lucide-react';
import DashboardNav from '@/components/DashboardNav';
import DashboardSidebar from '@/components/DashboardSidebar';
import PageLoader from '@/components/PageLoader';
import { auth, User } from '@/lib/auth';
import { dataManager, SupportTicket, TicketMessage, TicketAttachment } from '@/lib/data';
import { apiEndpoint } from '@/lib/siteConfig';
import { soundEffects } from '@/lib/soundEffects';

const CLIENT_TICKET_TEMPLATES = [
  {
    title: '🌐 Apontamento de DNS',
    subject: 'Apontamento de DNS e Propagação de NameServers',
    category: 'domain' as const,
    priority: 'medium' as const,
    message: 'Olá, configurei o meu domínio na plataforma mas gostaria de confirmar se os NameServers ns1.wehosthere.com e ns2.wehosthere.com já propagaram corretamente.'
  },
  {
    title: '💳 Confirmação M-Pesa',
    subject: 'Confirmação de Pagamento via M-Pesa',
    category: 'billing' as const,
    priority: 'high' as const,
    message: 'Efetuei o pagamento via M-Pesa para a contratação/renovação do meu serviço. Segue em anexo o comprovante da transação para validação e ativação rápida.'
  },
  {
    title: '📧 Configurar E-mail',
    subject: 'Ajuda para configurar E-mail Corporativo (Webmail / Outlook)',
    category: 'technical' as const,
    priority: 'medium' as const,
    message: 'Preciso de assistência técnica para configurar a minha conta de e-mail corporativo no Outlook / telemóvel (portas IMAP 993 / SMTP 465 com SSL).'
  },
  {
    title: '⚡ Upgrade de VPS',
    subject: 'Solicitação de Upgrade de Recursos no Servidor VPS',
    category: 'vps' as const,
    priority: 'high' as const,
    message: 'Gostaria de solicitar informações e orçamento sobre o aumento de memória RAM, núcleos de CPU e espaço em disco SSD para o meu servidor VPS.'
  },
  {
    title: '🔐 Ativação de SSL',
    subject: 'Solicitação de Ativação do Certificado SSL Let\'s Encrypt',
    category: 'technical' as const,
    priority: 'medium' as const,
    message: 'O meu site está a apresentar um aviso de conexão não segura no navegador. Solicito a emissão e instalação do certificado SSL gratuito Let\'s Encrypt.'
  }
];

export default function ClientTicketsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'answered' | 'closed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal Novo Ticket
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<SupportTicket['category']>('technical');
  const [priority, setPriority] = useState<SupportTicket['priority']>('medium');
  const [message, setMessage] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Modal Detalhes/Conversa do Ticket
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replying, setReplying] = useState(false);

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
    if ((currentUser.role === 'admin' || currentUser.email.toLowerCase() === 'admin@wehosthere.com') && !auth.isClientViewActive()) {
      router.push('/admin');
      return;
    }
    setUser(currentUser);
    setLoading(false);

    // Carregar tickets do usuário
    const loadTickets = async () => {
      const allTickets = await dataManager.fetchTicketsAsync();
      const myTickets = allTickets.filter(t => 
        t.userEmail.toLowerCase() === currentUser.email.toLowerCase()
      );
      setTickets(myTickets);
    };
    loadTickets();
  }, [session, status, router]);

  // Anexos
  const [createAttachments, setCreateAttachments] = useState<TicketAttachment[]>([]);
  const [replyAttachments, setReplyAttachments] = useState<TicketAttachment[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isReply: boolean = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(apiEndpoint('/api/upload'), {
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
          if (isReply) {
            setReplyAttachments(prev => [...prev, newAtt]);
          } else {
            setCreateAttachments(prev => [...prev, newAtt]);
          }
        }
      }
    } catch (err) {
      console.error('Erro no upload de anexo:', err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

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

    // Carregar tickets do cliente
    const allTickets = dataManager.getTickets();
    const userTickets = allTickets.filter(t => t.userId === currentUser.id || t.userEmail === currentUser.email);
    setTickets(userTickets);
    setLoading(false);

    // Sincronizar via API
    dataManager.fetchTicketsAsync().then(fetched => {
      if (fetched) {
        const filtered = fetched.filter(t => t.userId === currentUser.id || t.userEmail === currentUser.email);
        setTickets(filtered);
      }
    });

    // Polling a cada 5s
    const interval = setInterval(() => {
      dataManager.fetchTicketsAsync().then(fetched => {
        if (fetched) {
          const filtered = fetched.filter(t => t.userId === currentUser.id || t.userEmail === currentUser.email);
          setTickets(filtered);
          // Se houver um ticket aberto no modal, atualizar conversa
          setSelectedTicket(prev => prev ? filtered.find(t => t.id === prev.id) || prev : null);
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [router]);

  const handleLogout = () => {
    auth.logout();
    router.push('/login');
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setCreateError('Por favor preencha o assunto e a mensagem inicial.');
      return;
    }

    if (!user) return;
    setCreating(true);
    setCreateError('');

    try {
      const newTicket = dataManager.addTicket({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        subject: subject.trim(),
        category,
        priority,
        status: 'open',
        initialMessage: message.trim(),
        initialAttachments: createAttachments
      });

      soundEffects.playCreateTicketSound();
      setTickets(prev => [newTicket, ...prev]);
      setSubject('');
      setMessage('');
      setCreateAttachments([]);
      setShowCreateModal(false);
    } catch (err) {
      setCreateError('Ocorreu um erro ao criar o ticket.');
    } finally {
      setCreating(false);
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || (!replyMessage.trim() && replyAttachments.length === 0) || !user) return;

    setReplying(true);
    const updated = dataManager.addTicketReply(
      selectedTicket.id,
      'client',
      user.name,
      replyMessage.trim(),
      'open',
      replyAttachments
    );

    if (updated) {
      soundEffects.playReplyTicketSound();
      setSelectedTicket(updated);
      setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
      setReplyMessage('');
      setReplyAttachments([]);
    }
    setReplying(false);
  };

  const handleCloseTicket = (ticketId: string) => {
    soundEffects.playCloseTicketSound();
    dataManager.updateTicketStatus(ticketId, 'closed');
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'closed' } : t));
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket(prev => prev ? { ...prev, status: 'closed' } : null);
    }
  };

  // Filtragem
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'open') return matchesSearch && (ticket.status === 'open' || ticket.status === 'in_progress');
    if (filterStatus === 'answered') return matchesSearch && ticket.status === 'answered';
    if (filterStatus === 'closed') return matchesSearch && ticket.status === 'closed';
    return matchesSearch;
  });

  const countOpen = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const countAnswered = tickets.filter(t => t.status === 'answered').length;
  const countClosed = tickets.filter(t => t.status === 'closed').length;

  const getStatusBadge = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" /> Aberto</span>;
      case 'in_progress':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800"><Clock className="w-3 h-3 mr-1" /> Em Análise</span>;
      case 'answered':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3 h-3 mr-1" /> Respondido</span>;
      case 'closed':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">Fechado</span>;
    }
  };

  const getPriorityBadge = (priority: SupportTicket['priority']) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-200">Urgente</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">Alta</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">Média</span>;
      case 'low':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">Baixa</span>;
    }
  };

  const getCategoryLabel = (category: SupportTicket['category']) => {
    switch (category) {
      case 'technical': return 'Suporte Técnico';
      case 'billing': return 'Faturação & Pagamentos';
      case 'domain': return 'Domínios & DNS';
      case 'vps': return 'Servidores VPS';
      default: return 'Geral / Outro';
    }
  };

  if (loading) {
    return <PageLoader text="A carregar os seus tickets de suporte..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav userName={user?.name} userAvatar={user?.avatar} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-1.5 sm:px-3 lg:px-8 py-3 sm:py-6">
        <div className="grid lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-8">
          {/* Sidebar (Desktop) */}
          <div className="hidden lg:block lg:col-span-1">
            <DashboardSidebar />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-3 sm:space-y-6">
        {/* Cabeçalho da Página */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 sm:gap-3 mb-2 sm:mb-3 sm:mb-5">
          <div className="flex-1">
            <div className="flex items-center space-x-1 sm:space-x-1.5 sm:space-x-2 text-primary-600 font-semibold text-[10px] sm:text-xs md:text-sm mb-1">
              <LifeBuoy className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:w-5 sm:h-5" />
              <span>Central de Atendimento</span>
            </div>
            <h1 className="text-sm sm:text-base md:text-lg lg:text-2xl font-black text-gray-900 tracking-tight">
              Tickets de Suporte
            </h1>
            <p className="text-gray-600 text-[8px] sm:text-[10px] md:text-sm mt-0.5 line-clamp-2">
              Abra chamados para tirar dúvidas técnicas, resolver problemas de hospedagem ou pagamentos.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center space-x-1 sm:space-x-1.5 sm:space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-[10px] sm:text-xs md:text-base px-2 sm:px-3 sm:px-4 py-1.5 sm:py-2 sm:py-2.5 rounded-xl shadow-md transition cursor-pointer w-full sm:w-auto shrink-0"
          >
            <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3 sm:w-4 sm:h-5" />
            <span>Abrir Novo Ticket</span>
          </button>
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2 sm:gap-3 sm:gap-4 md:gap-5 mb-2 sm:mb-3 sm:mb-4 md:mb-6">
          <div className="bg-white p-2 sm:p-2.5 sm:p-3 sm:p-4 md:p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[9px] sm:text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">Total de Chamados</p>
              <h3 className="text-lg sm:text-xl sm:text-2xl font-black text-gray-900 mt-1">{tickets.length}</h3>
            </div>
            <div className="p-1.5 sm:p-2 sm:p-3 bg-blue-50 text-blue-600 rounded-xl">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          <div className="bg-white p-2 sm:p-2.5 sm:p-3 sm:p-4 md:p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[9px] sm:text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">Abertos / Em Análise</p>
              <h3 className="text-lg sm:text-xl sm:text-2xl font-black text-blue-600 mt-1">{countOpen}</h3>
            </div>
            <div className="p-1.5 sm:p-2 sm:p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          <div className="bg-white p-2 sm:p-2.5 sm:p-3 sm:p-4 md:p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[9px] sm:text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">Respondidos</p>
              <h3 className="text-lg sm:text-xl sm:text-2xl font-black text-emerald-600 mt-1">{countAnswered}</h3>
            </div>
            <div className="p-1.5 sm:p-2 sm:p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="bg-white p-2 sm:p-3 sm:p-4 rounded-xl border border-gray-200 shadow-sm mb-2 sm:mb-3 sm:mb-4 md:mb-6 flex flex-col md:flex-row items-center justify-between gap-2 sm:gap-3 sm:gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por ID ou assunto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[10px] sm:text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 placeholder-gray-400"
            />
          </div>

          <div className="flex items-center space-x-1 sm:space-x-1.5 sm:space-x-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2 sm:px-3 sm:px-4 py-1 sm:py-1.5 sm:py-2 rounded-xl text-[9px] sm:text-[10px] sm:text-xs font-bold transition whitespace-nowrap ${
                filterStatus === 'all' ? 'bg-primary-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos ({tickets.length})
            </button>
            <button
              onClick={() => setFilterStatus('open')}
              className={`px-2 sm:px-3 sm:px-4 py-1 sm:py-1.5 sm:py-2 rounded-xl text-[9px] sm:text-[10px] sm:text-xs font-bold transition whitespace-nowrap ${
                filterStatus === 'open' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Abertos ({countOpen})
            </button>
            <button
              onClick={() => setFilterStatus('answered')}
              className={`px-2 sm:px-3 sm:px-4 py-1 sm:py-1.5 sm:py-2 rounded-xl text-[9px] sm:text-[10px] sm:text-xs font-bold transition whitespace-nowrap ${
                filterStatus === 'answered' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Respondidos ({countAnswered})
            </button>
            <button
              onClick={() => setFilterStatus('closed')}
              className={`px-2 sm:px-3 sm:px-4 py-1 sm:py-1.5 sm:py-2 rounded-xl text-[9px] sm:text-[10px] sm:text-xs font-bold transition whitespace-nowrap ${
                filterStatus === 'closed' ? 'bg-gray-700 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Fechados ({countClosed})
            </button>
          </div>
        </div>

        {/* Lista de Tickets */}
        {filteredTickets.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 sm:p-12 text-center shadow-sm">
            <div className="w-10 h-10 sm:w-12 sm:h-12 sm:w-16 sm:h-16 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 sm:mb-4">
              <LifeBuoy className="w-5 h-5 sm:w-6 sm:h-6 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-xs sm:text-sm md:text-lg font-bold text-gray-900">Nenhum ticket encontrado</h3>
            <p className="text-gray-500 text-[8px] sm:text-[10px] md:text-sm mt-1 max-w-md mx-auto px-1.5 sm:px-2">
              {searchTerm || filterStatus !== 'all'
                ? 'Tente ajustar os seus filtros de pesquisa para visualizar outros resultados.'
                : 'Precisa de ajuda com o seu serviço? Abra um ticket e nossa equipa responderá em breve.'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="mt-3 sm:mt-4 sm:mt-6 inline-flex items-center space-x-1 sm:space-x-2 bg-primary-600 text-white font-bold px-2 sm:px-3 sm:px-4 sm:px-5 py-1.5 sm:py-2 sm:py-2.5 rounded-xl shadow transition"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-[10px] sm:text-xs sm:text-sm">Criar Primeiro Ticket</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1.5 sm:space-y-2 sm:space-y-3 sm:space-y-4">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="bg-white p-2 sm:p-3 sm:p-4 md:p-5 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-1.5 sm:gap-2 sm:gap-3 sm:gap-4"
              >
                <div className="space-y-1 sm:space-y-1.5 sm:space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-0.5 sm:gap-1 sm:gap-2">
                    <span className="text-[9px] sm:text-[10px] sm:text-xs font-mono font-bold text-gray-400">{ticket.id}</span>
                    {getStatusBadge(ticket.status)}
                    {getPriorityBadge(ticket.priority)}
                    <span className="text-[9px] sm:text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 sm:px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                      {getCategoryLabel(ticket.category)}
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm sm:text-base font-bold text-gray-900 hover:text-primary-600 transition line-clamp-2">
                    {ticket.subject}
                  </h3>
                  <p className="text-[8px] sm:text-[10px] sm:text-xs text-gray-500 line-clamp-2">
                    {ticket.messages[ticket.messages.length - 1]?.message || 'Sem conteúdo.'}
                  </p>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-1.5 sm:gap-2 sm:gap-3 sm:gap-4 border-t md:border-t-0 pt-1.5 sm:pt-2 sm:pt-3 md:pt-0 border-gray-100">
                  <div className="text-right text-[9px] sm:text-[10px] sm:text-xs text-gray-500">
                    <div>{ticket.messages.length} {ticket.messages.length === 1 ? 'mensagem' : 'mensagens'}</div>
                    <div className="text-[8px] sm:text-[9px] sm:text-[11px] text-gray-400 mt-0.5">
                      {new Date(ticket.updatedAt).toLocaleDateString('pt-PT')}
                    </div>
                  </div>
                  <div className="p-1 sm:p-1.5 sm:p-2 rounded-xl bg-gray-50 text-gray-400 group-hover:text-primary-600 group-hover:bg-primary-50 transition shrink-0">
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
          </div>
        </div>
      </div>

      {/* Modal Criar Novo Ticket */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-primary-50 text-primary-600 rounded-xl">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Abrir Novo Ticket de Suporte</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTicket} className="mt-6 space-y-4">
              {/* Atalhos de Modelos Rápidos */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center space-x-1">
                  <Tag className="w-3.5 h-3.5 text-primary-600" />
                  <span>Problemas Frequentes (Preenchimento Rápido)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CLIENT_TICKET_TEMPLATES.map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSubject(tpl.subject);
                        setCategory(tpl.category);
                        setPriority(tpl.priority);
                        setMessage(tpl.message);
                      }}
                      className="px-3 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-800 border border-primary-200/80 rounded-xl text-xs font-semibold transition text-left cursor-pointer"
                    >
                      {tpl.title}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Assunto do Chamado
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dúvida sobre configuração de DNS do domínio"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as SupportTicket['category'])}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                  >
                    <option value="technical">Suporte Técnico</option>
                    <option value="billing">Faturação & Pagamentos</option>
                    <option value="domain">Domínios & DNS</option>
                    <option value="vps">Servidores VPS</option>
                    <option value="other">Outro Assunto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Prioridade
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as SupportTicket['priority'])}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Mensagem Detalhada
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Descreva detalhadamente a sua solicitação ou problema enfrentado..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5 flex items-center justify-between">
                  <span>Anexar Ficheiro (Imagem ou PDF)</span>
                  {uploading && (
                    <span className="text-primary-600 font-normal flex items-center space-x-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>A carregar no Cloudinary...</span>
                    </span>
                  )}
                </label>
                <div className="flex items-center space-x-3">
                  <label className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition border border-gray-200">
                    <Paperclip className="w-4 h-4" />
                    <span>Escolher Ficheiro</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, false)}
                      disabled={uploading}
                    />
                  </label>
                  <span className="text-[11px] text-gray-400">PDF, PNG, JPG, WebP até 10MB</span>
                </div>

                {createAttachments.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {createAttachments.map((att, idx) => (
                      <div key={idx} className="flex items-center space-x-1.5 bg-primary-50 text-primary-900 border border-primary-200 px-3 py-1.5 rounded-xl text-xs font-semibold">
                        {att.type === 'image' ? <ImageIcon className="w-3.5 h-3.5 text-primary-600" /> : <FileText className="w-3.5 h-3.5 text-red-500" />}
                        <span className="truncate max-w-[150px]">{att.name}</span>
                        <button
                          type="button"
                          onClick={() => setCreateAttachments(prev => prev.filter((_, i) => i !== idx))}
                          className="p-0.5 text-gray-400 hover:text-red-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow transition flex items-center space-x-2"
                >
                  {creating ? 'Submetendo...' : 'Submeter Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal / Thread de Conversa do Ticket */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full flex flex-col max-h-[90vh] shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header da Conversa */}
            <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50 rounded-t-3xl">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-gray-500">{selectedTicket.id}</span>
                  {getStatusBadge(selectedTicket.status)}
                  {getPriorityBadge(selectedTicket.priority)}
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                    {getCategoryLabel(selectedTicket.category)}
                  </span>
                </div>
                <h2 className="text-xl font-black text-gray-900">{selectedTicket.subject}</h2>
              </div>

              <div className="flex items-center space-x-2">
                {selectedTicket.status !== 'closed' && (
                  <button
                    type="button"
                    onClick={() => handleCloseTicket(selectedTicket.id)}
                    className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition"
                  >
                    Fechar Ticket
                  </button>
                )}
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                >
                  <X className="w-6 h-6" />
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
                    className={`flex flex-col ${isClient ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-bold text-gray-700">
                        {isClient ? 'Você (' + msg.senderName + ')' : (
                          <span className="flex items-center space-x-1 text-primary-700 font-bold">
                            <ShieldCheck className="w-3.5 h-3.5 text-primary-600" />
                            <span>{msg.senderName}</span>
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(msg.timestamp).toLocaleDateString('pt-PT')} às {new Date(msg.timestamp).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div
                      className={`max-w-xl p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                        isClient
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
                                    isClient
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

            {/* Formulário de Resposta */}
            <div className="p-4 sm:p-6 border-t border-gray-200 bg-white rounded-b-3xl">
              {selectedTicket.status === 'closed' ? (
                <div className="p-3 bg-gray-100 text-gray-600 text-xs font-semibold rounded-xl text-center">
                  Este ticket foi marcado como **Fechado**. Para abrir um novo pedido, crie um novo ticket de suporte.
                </div>
              ) : (
                <form onSubmit={handleSendReply} className="flex flex-col gap-3">
                  {replyAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {replyAttachments.map((att, idx) => (
                        <div key={idx} className="flex items-center space-x-1.5 bg-primary-50 text-primary-900 border border-primary-200 px-3 py-1.5 rounded-xl text-xs font-semibold">
                          {att.type === 'image' ? <ImageIcon className="w-3.5 h-3.5 text-primary-600" /> : <FileText className="w-3.5 h-3.5 text-red-500" />}
                          <span className="truncate max-w-[150px]">{att.name}</span>
                          <button
                            type="button"
                            onClick={() => setReplyAttachments(prev => prev.filter((_, i) => i !== idx))}
                            className="p-0.5 text-gray-400 hover:text-red-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <textarea
                      rows={2}
                      placeholder="Escreva a sua resposta para a equipa de suporte..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                    ></textarea>

                    <div className="flex flex-col gap-2 justify-end">
                      <label className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition cursor-pointer flex items-center justify-center border border-gray-200" title="Anexar Imagem ou PDF">
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin text-primary-600" /> : <Paperclip className="w-4 h-4" />}
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, true)}
                          disabled={uploading}
                        />
                      </label>

                      <button
                        type="submit"
                        disabled={replying || (!replyMessage.trim() && replyAttachments.length === 0)}
                        className="px-5 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition flex items-center space-x-2 self-end disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                        <span className="hidden sm:inline">Enviar</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
