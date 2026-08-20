'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  Mail, Plus, Trash2, Settings, CheckCircle, Clock, XCircle,
  LayoutDashboard, Globe, Database, Settings as SettingsIcon, LogOut, Server, ExternalLink,
  Key, ShieldCheck, Copy, Sparkles, AlertCircle, X, Check, Lock
} from 'lucide-react';
import { auth, User } from '@/lib/auth';
import { dataManager, EmailAccount, Site } from '@/lib/data';

import DashboardNav from '@/components/DashboardNav';
import DashboardSidebar from '@/components/DashboardSidebar';
import PageLoader from '@/components/PageLoader';
import StatusBadge from '@/components/StatusBadge';
import ApprovalCelebration from '@/components/ApprovalCelebration';
import ConfirmModal from '@/components/ConfirmModal';
import Toast from '@/components/Toast';

export default function EmailPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [emails, setEmails] = useState<EmailAccount[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [userDomains, setUserDomains] = useState<string[]>([]);
  const [migaduDomains, setMigaduDomains] = useState<any[]>([]); // Domains from Migadu
  const [loading, setLoading] = useState(true);

  // Modal para Criar Nova Conta
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEmailPrefix, setNewEmailPrefix] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newStorage, setNewStorage] = useState(5);

  // Modal para Editar / Alterar Senha
  const [editEmailAccount, setEditEmailAccount] = useState<EmailAccount | null>(null);
  const [editPassword, setEditPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [editStorage, setEditStorage] = useState(5);
  const [editSuccessMsg, setEditSuccessMsg] = useState('');
  const [editErrorMsg, setEditErrorMsg] = useState('');

  // Modal para Acessar Webmail
  const [webmailAccount, setWebmailAccount] = useState<EmailAccount | null>(null);

  // Feedback de cópia de texto
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Celebration state (when admin approves email)
  const [celebration, setCelebration] = useState<{ show: boolean; name: string } | null>(null);
  const prevEmailStatusRef = useRef<Record<string, string>>({});

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
    const userEmailFilter = currentUser.email;

    // Clean up stale shared localStorage data and migrate to per-user key
    dataManager.initUserEmails(userEmailFilter);

    // Fetch Migadu domains for this user
    const fetchMigaduDomains = async () => {
      try {
        const response = await fetch('/api/email-providers/migadu/domains');
        const data = await response.json();
        if (data.success) {
          setMigaduDomains(data.domains);
          // Update user domains with Migadu domains
          const migaduDomainNames = data.domains.map((d: any) => d.domainName);
          setUserDomains(migaduDomainNames);
          if (migaduDomainNames.length > 0 && !selectedDomain) {
            setSelectedDomain(migaduDomainNames[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch Migadu domains:', error);
      }
    };

    const refreshData = (newEmails?: EmailAccount[]) => {
      // Use user-specific key - strictly isolated per user
      const loadedEmails = newEmails || dataManager.getEmails(userEmailFilter);
      
      // Detect pending → active transitions to trigger celebration
      loadedEmails.forEach(email => {
        const prevStatus = prevEmailStatusRef.current[email.email];
        if (prevStatus === 'pending' && email.status === 'active') {
          setCelebration({ show: true, name: email.email });
        }
        prevEmailStatusRef.current[email.email] = email.status;
      });

      setEmails(loadedEmails);
      const loadedSites = dataManager.getSites().filter(s =>
        !s.userEmail || s.userEmail.toLowerCase() === userEmailFilter.toLowerCase()
      );
      setSites(loadedSites);
      const domains = loadedSites.map(s => s.domain).filter(Boolean);
      setUserDomains(domains);
    };

    refreshData();
    const initialSites = dataManager.getSites().filter(s =>
      !s.userEmail || s.userEmail.toLowerCase() === userEmailFilter.toLowerCase()
    );
    if (initialSites.length > 0 && initialSites[0].domain) {
      setSelectedDomain(initialSites[0].domain);
    }
    setLoading(false);

    // Fetch Migadu domains
    fetchMigaduDomains();

    dataManager.fetchEmailsAsync(userEmailFilter).then(emails => refreshData(emails));
    dataManager.fetchSitesAsync().then(() => refreshData());

    const syncAllData = () => {
      dataManager.fetchEmailsAsync(userEmailFilter).then(emails => refreshData(emails));
      dataManager.fetchSitesAsync().then(() => refreshData());
      fetchMigaduDomains();
    };

    const interval = setInterval(syncAllData, 10000);
    window.addEventListener('focus', syncAllData);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', syncAllData);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router]);

  const copyToClipboard = (text: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 2500);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$&';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmailPrefix || !newPassword) return;

    const fullEmail = newEmailPrefix.includes('@')
      ? newEmailPrefix.trim().toLowerCase()
      : `${newEmailPrefix.trim().toLowerCase()}@${selectedDomain.toLowerCase()}`;

    // Verificação de duplicados
    const existing = emails.find(e => e.email.trim().toLowerCase() === fullEmail);
    if (existing) {
      setToastMsg({
        type: 'error',
        title: 'E-mail Já Existente',
        message: `A conta de e-mail "${fullEmail}" já se encontra registada no sistema. Escolha outro prefixo.`
      });
      return;
    }

    const initialStatus: EmailAccount['status'] = 'pending';

    try {
      const newEmailAccount = await dataManager.addEmailAsync({
        email: fullEmail,
        domain: selectedDomain,
        status: initialStatus,
        storage: newStorage,
        userEmail: user?.email
      });

      setEmails([...emails, newEmailAccount]);
      setShowCreateModal(false);
      setNewEmailPrefix('');
      setNewPassword('');
      setToastMsg({
        type: 'warning',
        title: 'Conta de E-mail Solicitada',
        message: `A conta ${fullEmail} foi gravada com sucesso e está em processamento de ativação.`
      });
    } catch (err: any) {
      setToastMsg({
        type: 'error',
        title: 'Erro ao Criar E-mail',
        message: err?.message || `Não foi possível criar a conta de e-mail "${fullEmail}".`
      });
    }
  };

  const handleOpenEditModal = (email: EmailAccount) => {
    setEditEmailAccount(email);
    setEditPassword('');
    setConfirmPassword('');
    setEditStorage(email.storage || 5);
    setEditSuccessMsg('');
    setEditErrorMsg('');
  };

  const handleSaveEditEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmailAccount) return;

    if (editPassword && editPassword !== confirmPassword) {
      setEditErrorMsg('As senhas não coincidem. Por favor verifique.');
      return;
    }

    if (editPassword && editPassword.length < 6) {
      setEditErrorMsg('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    const updates: Partial<EmailAccount> = {
      storage: editStorage
    };

    dataManager.updateEmail(editEmailAccount.id, updates);
    setEmails(emails.map(e => e.id === editEmailAccount.id ? { ...e, ...updates } : e));

    setEditErrorMsg('');
    setEditSuccessMsg('Configurações e senha atualizadas com sucesso!');
    setTimeout(() => {
      setEditEmailAccount(null);
      setEditSuccessMsg('');
    }, 1800);
  };

  // State de confirmação de exclusão de email
  const [deleteEmailConfirm, setDeleteEmailConfirm] = useState<{ isOpen: boolean; id: string; emailStr?: string } | null>(null);
  const [toastMsg, setToastMsg] = useState<{ title?: string; message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);

  const confirmDeleteEmail = () => {
    if (!deleteEmailConfirm) return;
    try {
      const { id, emailStr } = deleteEmailConfirm;
      const userEmailFilter = user?.email;
      dataManager.deleteEmail(id, userEmailFilter, emailStr);
      setEmails(prev => prev.filter(e => e.id !== id && e.email !== emailStr));
      setDeleteEmailConfirm(null);
      setToastMsg({ title: 'E-mail Removido', message: `A conta de e-mail ${emailStr || ''} foi eliminada com sucesso.`, type: 'success' });
    } catch (err) {
      console.error('Erro ao eliminar e-mail:', err);
      setToastMsg({ title: 'Erro ao Eliminar', message: 'Não foi possível eliminar o e-mail. Tente novamente.', type: 'error' });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'suspended':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'pending':
        return 'Em Processamento';
      case 'suspended':
        return 'Suspenso';
      default:
        return status;
    }
  };

  if (loading) {
    return <PageLoader text="A carregar as suas contas de email..." />;
  }

  if (!user) return null;

  const handleLogout = () => {
    auth.logout();
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Celebration effect when email gets approved */}
      {celebration && (
        <ApprovalCelebration
          show={celebration.show}
          type="email"
          name={celebration.name}
          onDone={() => setCelebration(null)}
        />
      )}

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
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Contas de Email Corporativo</h1>
                  <p className="text-xs text-gray-500 mt-0.5">Gerencie os emails da sua empresa, altere senhas e aceda ao Webmail</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center space-x-2 bg-primary-600 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl hover:bg-primary-700 transition cursor-pointer shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nova Conta de Email</span>
                </button>
              </div>

              {emails.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma conta configurada</h3>
                  <p className="text-gray-600 mb-4 text-sm">Crie sua primeira conta de email profissional personalizada</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 transition mx-auto font-bold text-sm"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Criar Primeira Conta</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {emails.map((email) => (
                    <div key={email.id} className="border rounded-2xl p-4 sm:p-5 hover:bg-gray-50/80 transition bg-white shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
                          <div className="bg-primary-50 p-2.5 sm:p-3 rounded-2xl border border-primary-100 shrink-0">
                            <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-gray-900 text-sm sm:text-base flex items-center space-x-2">
                              <span className="truncate">{email.email}</span>
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">Conta Corporativa Profissional</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                          <StatusBadge status={email.status} />

                          {/* Botão Acessar Webmail Integrado */}
                          <Link
                            href={`/webmail?user=${encodeURIComponent(email.email)}`}
                            className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-[10px] sm:text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-sm shrink-0"
                          >
                            <Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            <span className="hidden sm:inline">Abrir Webmail</span>
                            <span className="sm:hidden">Webmail</span>
                          </Link>

                          {/* Botão Configurações / Editar Senha */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(email)}
                            className="p-1.5 sm:p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-xl transition cursor-pointer border border-gray-200 shrink-0"
                            title="Editar Conta & Alterar Senha"
                          >
                            <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>

                          {/* Botão Excluir */}
                          <button
                            type="button"
                            onClick={() => setDeleteEmailConfirm({ isOpen: true, id: email.id, emailStr: email.email })}
                            className="p-1.5 sm:p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer border border-gray-200 shrink-0"
                            title="Excluir Conta"
                          >
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                      </div>

                      {email.status === 'pending' && (
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-amber-600 shrink-0 animate-pulse" />
                          <span>
                            <strong>Conta de Email em Processamento:</strong> Esta conta está a ser ativada e provisionada nos servidores pela equipa técnica/administrador.
                          </span>
                        </div>
                      )}

                      <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 text-[10px] sm:text-xs text-gray-600">
                        <div>
                          <span className="text-gray-400 block font-medium">Armazenamento</span>
                          <span className="font-bold text-gray-900">{email.storage} GB</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block font-medium">Criado em</span>
                          <span className="font-bold text-gray-900 block">
                            {new Date(email.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(email)}
                            className="text-primary-600 hover:text-primary-800 font-bold underline cursor-pointer flex items-center space-x-1 text-[10px] sm:text-xs"
                          >
                            <Key className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            <span className="truncate">Alterar Senha</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Email Configuration Box */}
            <div className="bg-white border border-blue-200 rounded-2xl p-4 sm:p-6 shadow-sm">
              <div className="flex items-center space-x-2 mb-3">
                <ShieldCheck className="h-5 w-5 text-primary-600" />
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">Parâmetros de Configuração de Email (Outlook, iPhone, Android)</h3>
              </div>
              <p className="text-gray-600 text-xs sm:text-sm mb-4">
                Utilize as configurações abaixo para adicionar estas contas ao Outlook, Thunderbird, Apple Mail ou no smartphone:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <span className="font-bold text-blue-900 block mb-1 text-[11px] sm:text-xs">Servidor IMAP (Recomendado):</span>
                  <span className="font-mono text-gray-800 block text-[10px] sm:text-xs break-all">mail.wehosthere.com</span>
                  <span className="text-gray-500 font-mono text-[10px] sm:text-[11px] block">Porta 993 (SSL)</span>
                </div>
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <span className="font-bold text-blue-900 block mb-1 text-[11px] sm:text-xs">Servidor POP3:</span>
                  <span className="font-mono text-gray-800 block text-[10px] sm:text-xs break-all">mail.wehosthere.com</span>
                  <span className="text-gray-500 font-mono text-[10px] sm:text-[11px] block">Porta 995 (SSL)</span>
                </div>
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <span className="font-bold text-blue-900 block mb-1 text-[11px] sm:text-xs">Servidor SMTP (Envio):</span>
                  <span className="font-mono text-gray-800 block text-[10px] sm:text-xs break-all">mail.wehosthere.com</span>
                  <span className="text-gray-500 font-mono text-[10px] sm:text-[11px] block">Porta 465 (SSL) / 587 (TLS)</span>
                </div>
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <span className="font-bold text-blue-900 block mb-1 text-[11px] sm:text-xs">URL Direto do Webmail:</span>
                  <span className="font-mono text-primary-700 font-bold block text-[10px] sm:text-xs break-all">webmail.wehosthere.com</span>
                  <span className="text-gray-500 font-mono text-[10px] sm:text-[11px] block">Login: Email + Senha</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Editar / Alterar Senha de Email */}
      {editEmailAccount && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-lg w-full border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-primary-50 rounded-xl border border-primary-100 text-primary-600">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900">Editar Conta de Email</h2>
                  <p className="text-xs text-primary-700 font-mono font-semibold">{editEmailAccount.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditEmailAccount(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {editSuccessMsg ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <Check className="h-6 w-6" />
                </div>
                <p className="text-base font-bold text-gray-900">{editSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleSaveEditEmail} className="space-y-4">
                {editErrorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                    <span>{editErrorMsg}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Nova Senha de Acesso
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                      placeholder="Deixe em branco para não alterar"
                    />
                  </div>
                </div>

                {editPassword && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                      Confirmar Nova Senha
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                      placeholder="Repita a nova senha"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Cota de Armazenamento (GB)
                  </label>
                  <select
                    value={editStorage}
                    onChange={(e) => setEditStorage(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
                  >
                    <option value={2}>2 GB</option>
                    <option value={5}>5 GB (Padrão)</option>
                    <option value={10}>10 GB</option>
                    <option value={25}>25 GB</option>
                  </select>
                </div>

                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-1.5 text-xs text-gray-700">
                  <span className="font-bold block text-gray-900">🔗 Link de Acesso Rápido ao Webmail:</span>
                  <div className="flex items-center justify-between font-mono bg-white p-2 rounded-xl border border-gray-200">
                    <span className="truncate text-[11px] text-primary-700">https://webmail.wehosthere.com</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('https://webmail.wehosthere.com')}
                      className="text-xs font-bold text-primary-600 hover:text-primary-800 ml-2 shrink-0 cursor-pointer"
                    >
                      {copiedText === 'https://webmail.wehosthere.com' ? 'Copiado ✓' : 'Copiar'}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditEmailAccount(null)}
                    className="flex-1 py-3 border border-gray-200 text-gray-700 font-bold text-sm rounded-2xl hover:bg-gray-50 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-2xl transition cursor-pointer shadow-md"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Criar Nova Conta de Email */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h2 className="text-lg font-extrabold text-gray-900">Nova Conta de Email Corporativo</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmail} className="space-y-4">
              {/* Se não há domínios, aviso */}
              {userDomains.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-amber-800">Nenhum domínio registado</p>
                    <p className="text-xs text-amber-700 mt-0.5">Adicione um site/domínio primeiro em <Link href="/dashboard/sites" className="underline font-bold">Meus Sites</Link> para poder criar contas de email.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                      Nome da Conta (Prefixo)
                    </label>
                    <input
                      type="text"
                      value={newEmailPrefix}
                      onChange={(e) => setNewEmailPrefix(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
                      placeholder="ex: contacto, geral, vendas, suporte"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                      Domínio do E-mail
                    </label>
                    <select
                      value={selectedDomain}
                      onChange={(e) => setSelectedDomain(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                    >
                      {userDomains.map(domain => {
                        const isPending = sites.find(s => s.domain === domain)?.status === 'pending';
                        return (
                          <option key={domain} value={domain}>
                            @{domain} {isPending ? '⏳ (Em Processamento pelo Admin)' : '✓ (Ativo)'}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Pré-visualização do E-mail Completo */}
                  {newEmailPrefix.trim() && (
                    <div className="p-3 bg-primary-50 border border-primary-200/80 rounded-2xl text-xs text-primary-950 flex items-center justify-between">
                      <span className="font-semibold text-primary-900">Endereço final:</span>
                      <strong className="font-mono text-xs sm:text-sm text-primary-700 font-black truncate ml-2">
                        {newEmailPrefix.trim().toLowerCase()}@{selectedDomain}
                      </strong>
                    </div>
                  )}

                  {sites.find(s => s.domain === selectedDomain)?.status === 'pending' && (
                    <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start space-x-2">
                      <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                      <span>
                        O domínio <strong>{selectedDomain}</strong> está <strong>em processamento de aprovação</strong> pelo administrador. A conta de email será ativada automaticamente assim que o domínio for aprovado.
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Senha de Acesso
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewPassword(generateRandomPassword())}
                    className="text-[11px] text-primary-600 font-bold hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Gerar Senha Segura</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                  placeholder="••••••••••••"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Cota de Armazenamento Inicial
                </label>
                <select
                  value={newStorage}
                  onChange={(e) => setNewStorage(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
                >
                  <option value={2}>2 GB</option>
                  <option value={5}>5 GB (Recomendado)</option>
                  <option value={10}>10 GB</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 font-bold text-sm rounded-2xl hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={userDomains.length === 0}
                  className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-2xl transition cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Criar Conta de E-mail
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteEmailConfirm?.isOpen}
        title="Eliminar Conta de E-mail"
        message={`Tem certeza que deseja ELIMINAR permanentemente a caixa de correio "${deleteEmailConfirm?.emailStr}"?`}
        confirmText="Sim, Eliminar E-mail"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={confirmDeleteEmail}
        onCancel={() => setDeleteEmailConfirm(null)}
      />

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
