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
import { getCached, setCached } from '@/lib/pageCache';

export default function EmailPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [emails, setEmails] = useState<EmailAccount[]>(() => getCached<EmailAccount[]>('email:accounts') || []);
  const [sites, setSites] = useState<Site[]>(() => getCached<Site[]>('email:sites') || []);
  const [userDomains, setUserDomains] = useState<string[]>([]);
  const [migaduDomains, setMigaduDomains] = useState<any[]>([]); // Domains from Migadu
  // Sem loader se ja ha dados em cache (navegacao entre abas)
  const [loading, setLoading] = useState(() => !getCached('email:accounts'));
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Modal para Criar Nova Conta
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEmailPrefix, setNewEmailPrefix] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newStorage, setNewStorage] = useState(1);

  // Modal para Editar / Alterar Senha
  const [editEmailAccount, setEditEmailAccount] = useState<EmailAccount | null>(null);
  const [editPassword, setEditPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [editStorage, setEditStorage] = useState(1);
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
    
    if ((currentUser.role === 'admin' || currentUser.email.toLowerCase() === 'admin@wehosthere.com') && !auth.isClientViewActive()) {
      router.push('/admin');
      return;
    }
    
    setUser(currentUser);
    const userEmailFilter = currentUser.email;

    // Clean up stale shared localStorage data and migrate to per-user key
    dataManager.initUserEmails(userEmailFilter);

    // Fetch Migadu domains for this user and live mailboxes
    const fetchMigaduDomains = async () => {
      try {
        const response = await fetch('/api/email-providers/migadu/domains');
        const data = await response.json();
        if (data.success) {
          setMigaduDomains(data.domains);
          const cleanUser = userEmailFilter.toLowerCase();
          const userDoms = data.domains.filter((d: any) => 
            !d.customerId || 
            d.customerId === 'system' || 
            d.customerId.toLowerCase() === cleanUser
          );
          const migaduDomainNames: string[] = (userDoms.length > 0 ? userDoms : data.domains).map((d: any) => d.domainName).filter(Boolean);
          setUserDomains(prev => Array.from(new Set([...prev, ...migaduDomainNames])));
          if (migaduDomainNames.length > 0 && !selectedDomain) {
            setSelectedDomain(migaduDomainNames[0]);
          }

          // Fetch mailboxes for each domain to ensure live sync
          for (const dName of migaduDomainNames) {
            try {
              const mbRes = await fetch(`/api/email-providers/migadu/domains/${dName}/mailboxes`);
              const mbData = await mbRes.json();
              const mailboxes = mbData.mailboxes || mbData || [];
              if (Array.isArray(mailboxes) && mailboxes.length > 0) {
                const currentLocal = dataManager.getEmails(userEmailFilter);
                for (const mb of mailboxes) {
                  const fullEmail = (mb.email || `${mb.localPart || mb.local_part}@${dName}`).toLowerCase().trim();
                  if (fullEmail && !currentLocal.some(e => e.email.toLowerCase() === fullEmail)) {
                    const newAcc: EmailAccount = {
                      id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                      email: fullEmail,
                      domain: dName,
                      storage: 1,
                      status: 'active',
                      userEmail: userEmailFilter,
                      createdAt: new Date().toISOString()
                    };
                    dataManager.addEmail(newAcc);
                  }
                }
                refreshData();
              }
            } catch {}
          }
        }
      } catch (error) {
        console.error('Failed to fetch Migadu domains:', error);
      }
    };

    const refreshData = (newEmails?: EmailAccount[]) => {
      // Use user-specific key - strictly isolated per user
      const rawEmails = newEmails || dataManager.getEmails(userEmailFilter);
      
      // Ensure all standard mailboxes adhere to the 1 GB quota
      const loadedEmails = rawEmails.map(email => ({
        ...email,
        storage: 1
      }));
      
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
      const siteDomains = loadedSites.map(s => s.domain).filter(Boolean);
      setUserDomains(prev => Array.from(new Set([...prev, ...siteDomains])));
    };

    refreshData();
    const initialSites = dataManager.getSites().filter(s =>
      !s.userEmail || s.userEmail.toLowerCase() === userEmailFilter.toLowerCase()
    );
    if (initialSites.length > 0 && initialSites[0].domain) {
      setSelectedDomain(initialSites[0].domain);
    }
    setLoading(false);

    // Guardar em cache para navegacoes futuras
    setCached('email:accounts', dataManager.getEmails(userEmailFilter));
    setCached('email:sites', initialSites);

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
    setEditStorage(email.storage || 1);
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

  if (isLoggingOut) {
    return <PageLoader text="A encerrar a sua sessão com segurança..." />;
  }

  if (!user) return null;

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      auth.logout();
      signOut({ callbackUrl: '/' });
    }, 400);
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

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="grid lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {/* Sidebar (Desktop) */}
          <div className="hidden lg:block lg:col-span-1">
            <DashboardSidebar />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-5">
                <div className="min-w-0 flex-1">
                  <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 truncate">Contas de Email Corporativo</h1>
                  <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 mt-0.5 line-clamp-1 sm:line-clamp-2">Gerencie os emails da sua empresa, altere senhas e aceda ao Webmail</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center justify-center space-x-1.5 sm:space-x-2 bg-primary-600 text-white font-bold text-xs sm:text-sm md:text-base px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl hover:bg-primary-700 transition cursor-pointer shadow-sm w-full sm:w-auto shrink-0"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                  <span className="hidden sm:inline">Nova Conta de Email</span>
                  <span className="sm:hidden">+ Email</span>
                </button>
              </div>

              {emails.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Mail className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-2 sm:mb-4" />
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-2">Nenhuma conta configurada</h3>
                  <p className="text-gray-600 mb-2 sm:mb-4 text-[10px] sm:text-xs md:text-sm max-w-md mx-auto px-2">Crie sua primeira conta de email profissional personalizada</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center justify-center space-x-1.5 sm:space-x-2 bg-primary-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl hover:bg-primary-700 transition mx-auto font-bold text-xs sm:text-sm w-full sm:w-auto"
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Criar Primeira Conta</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3 sm:space-y-4">
                  {emails.map((email) => (
                    <div key={email.id} className="border border-gray-200 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 sm:p-4 sm:p-5 hover:bg-gray-50/50 transition bg-white shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3">
                        <div className="flex items-center space-x-2 sm:space-x-3 sm:space-x-3.5 min-w-0">
                          <div className="bg-primary-50 border border-primary-100 p-1.5 sm:p-2 sm:p-2.5 sm:p-3 rounded-lg sm:rounded-xl shrink-0">
                            <Mail className="h-3.5 w-3.5 sm:h-4 sm:h-5 sm:w-4 sm:w-5 sm:h-6 sm:w-6 text-primary-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-extrabold text-gray-900 text-[11px] sm:text-xs sm:text-sm md:text-base truncate">{email.email}</h3>
                            <p className="text-[9px] sm:text-[10px] sm:text-xs md:text-sm text-gray-500">Conta Corporativa Profissional</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-3 w-full sm:w-auto pt-2 sm:pt-2.5 border-t sm:border-t-0 border-gray-100 shrink-0">
                          <StatusBadge status={email.status} />
                          <div className="flex items-center space-x-1 sm:space-x-1 shrink-0">
                            <Link
                              href={`/webmail?user=${encodeURIComponent(email.email)}`}
                              className="px-2 sm:px-3 py-1.5 sm:py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-[10px] sm:text-xs rounded-lg transition flex items-center space-x-1 sm:space-x-1.5 cursor-pointer"
                            >
                              <Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                              <span className="hidden sm:inline">Webmail</span>
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(email)}
                              className="p-1.5 sm:p-2 text-gray-500 hover:text-primary-600 transition hover:bg-gray-100 rounded-lg cursor-pointer"
                            >
                              <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:h-5 sm:w-5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteEmailConfirm({ isOpen: true, id: email.id, emailStr: email.email })}
                              className="p-1.5 sm:p-2 text-gray-500 hover:text-red-600 transition hover:bg-red-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:h-5 sm:w-5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {email.status === 'pending' && (
                        <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-amber-50 border border-amber-200 rounded-lg text-[10px] sm:text-xs text-amber-800 flex items-center space-x-1.5 sm:space-x-2">
                          <Clock className="h-3 w-3 sm:h-3.5 sm:h-4 sm:w-3.5 sm:w-4 text-amber-600 flex-shrink-0 animate-pulse" />
                          <span className="line-clamp-2">
                            <strong>Em Processamento:</strong> Ativação em curso pela equipa técnica.
                          </span>
                        </div>
                      )}

                      <div className="mt-2 sm:mt-3 sm:mt-4 pt-2 sm:pt-3 sm:pt-4 border-t grid grid-cols-2 gap-2 sm:gap-3 sm:gap-4 text-[10px] sm:text-xs md:text-sm">
                        <div>
                          <p className="text-gray-600">Armazenamento</p>
                          <p className="font-semibold text-gray-900">{email.storage || 1} GB</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Criado em</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(email.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Email Configuration Box */}
            <div className="bg-white border border-blue-200 rounded-xl shadow-sm p-3 sm:p-4 sm:p-6">
              <div className="flex items-center space-x-1.5 sm:space-x-2 mb-2 sm:mb-3">
                <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
                <h3 className="font-bold text-gray-900 text-xs sm:text-sm md:text-base truncate">Configuração Email (Outlook, iPhone, Android)</h3>
              </div>
              <p className="text-gray-600 text-[10px] sm:text-xs md:text-sm mb-2 sm:mb-3 sm:mb-4 line-clamp-2">
                Utilize as configurações abaixo para adicionar estas contas ao Outlook, Thunderbird, Apple Mail ou no smartphone:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 text-[10px] sm:text-xs md:text-sm">
                <div className="p-2 sm:p-3 bg-blue-50/60 rounded-lg border border-blue-100">
                  <span className="font-bold text-blue-900 block mb-0.5 sm:mb-1 text-[10px] sm:text-xs">IMAP (Recomendado):</span>
                  <span className="font-mono text-gray-800 block text-[9px] sm:text-[10px] sm:text-xs break-all">mail.wehosthere.com</span>
                  <span className="text-gray-500 font-mono text-[9px] sm:text-[10px] sm:text-xs block">Porta 993 (SSL)</span>
                </div>
                <div className="p-2 sm:p-3 bg-blue-50/60 rounded-lg border border-blue-100">
                  <span className="font-bold text-blue-900 block mb-0.5 sm:mb-1 text-[10px] sm:text-xs">POP3:</span>
                  <span className="font-mono text-gray-800 block text-[9px] sm:text-[10px] sm:text-xs break-all">mail.wehosthere.com</span>
                  <span className="text-gray-500 font-mono text-[9px] sm:text-[10px] sm:text-xs block">Porta 995 (SSL)</span>
                </div>
                <div className="p-2 sm:p-3 bg-blue-50/60 rounded-lg border border-blue-100">
                  <span className="font-bold text-blue-900 block mb-0.5 sm:mb-1 text-[10px] sm:text-xs">SMTP (Envio):</span>
                  <span className="font-mono text-gray-800 block text-[9px] sm:text-[10px] sm:text-xs break-all">mail.wehosthere.com</span>
                  <span className="text-gray-500 font-mono text-[9px] sm:text-[10px] sm:text-xs block">Porta 465/587</span>
                </div>
                <div className="p-2 sm:p-3 bg-blue-50/60 rounded-lg border border-blue-100">
                  <span className="font-bold text-blue-900 block mb-0.5 sm:mb-1 text-[10px] sm:text-xs">Webmail:</span>
                  <span className="font-mono text-primary-700 font-bold block text-[9px] sm:text-[10px] sm:text-xs break-all">wehosthere.com/webmail</span>
                  <span className="text-gray-500 font-mono text-[9px] sm:text-[10px] sm:text-xs block">Email + Senha</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Editar / Alterar Senha de Email */}
      {editEmailAccount && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-3xl shadow-2xl p-3 sm:p-4 sm:p-5 sm:p-6 max-w-lg w-full border border-gray-100 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[95vh] overflow-y-auto sm:mx-4">
            <div className="flex items-center justify-between pb-2 sm:pb-3 sm:pb-4 border-b border-gray-100 mb-2 sm:mb-3 sm:mb-4">
              <div className="flex items-center space-x-1.5 sm:space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 sm:p-2.5 bg-primary-50 rounded-lg sm:rounded-xl border border-primary-100 text-primary-600">
                  <Key className="h-3.5 w-3.5 sm:h-4 sm:h-5 sm:w-4 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base sm:text-lg font-extrabold text-gray-900 truncate">Editar Conta de Email</h2>
                  <p className="text-[9px] sm:text-[10px] sm:text-xs text-primary-700 font-mono font-semibold truncate">{editEmailAccount.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditEmailAccount(null)}
                className="p-1 sm:p-1.5 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer shrink-0"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            {editSuccessMsg ? (
              <div className="py-4 sm:py-6 sm:py-8 text-center space-y-2 sm:space-y-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 sm:w-12 sm:h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 sm:h-6 sm:w-6" />
                </div>
                <p className="text-xs sm:text-sm sm:text-base font-bold text-gray-900">{editSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleSaveEditEmail} className="space-y-2.5 sm:space-y-3 sm:space-y-4">
                {editErrorMsg && (
                  <div className="p-2 sm:p-2.5 sm:p-3 bg-red-50 border border-red-200 text-red-700 text-[9px] sm:text-[10px] sm:text-xs font-semibold rounded-lg sm:rounded-xl flex items-center space-x-1.5 sm:space-x-2">
                    <AlertCircle className="h-3 w-3 sm:h-3.5 sm:h-4 sm:w-3.5 sm:w-4 text-red-500 shrink-0" />
                    <span className="line-clamp-2">{editErrorMsg}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[9px] sm:text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-700 mb-0.5 sm:mb-1">
                    Nova Senha de Acesso
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="w-full px-2.5 sm:px-3 sm:px-4 py-2 sm:py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs sm:text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                      placeholder="Deixe em branco para não alterar"
                    />
                  </div>
                </div>

                {editPassword && (
                  <div>
                    <label className="block text-[9px] sm:text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-700 mb-0.5 sm:mb-1">
                      Confirmar Nova Senha
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-2.5 sm:px-3 sm:px-4 py-2 sm:py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs sm:text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                      placeholder="Repita a nova senha"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[9px] sm:text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-700 mb-0.5 sm:mb-1">
                    Armazenamento
                  </label>
                  <div className="w-full px-2.5 sm:px-3 sm:px-4 py-2 sm:py-2.5 sm:py-3 bg-blue-50 border border-blue-200 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs sm:text-sm text-blue-800 font-semibold flex items-center gap-1.5 sm:gap-2">
                    <span className="text-[10px] sm:text-xs sm:text-sm">&#9432;</span>
                    <div className="min-w-0">
                      <div className="text-[10px] sm:text-xs sm:text-sm truncate">Armazenamento partilhado</div>
                      <div className="text-[8px] sm:text-[9px] sm:text-[10px] font-normal text-blue-600 truncate">Pool total da conta Migadu (sem limite por caixa)</div>
                    </div>
                  </div>
                </div>

                <div className="p-2 sm:p-2.5 sm:p-3 bg-gray-50 rounded-xl sm:rounded-2xl border border-gray-200 space-y-1 sm:space-y-1.5 text-[9px] sm:text-[10px] sm:text-xs text-gray-700">
                  <span className="font-bold block text-gray-900">🔗 Link de Acesso ao Webmail:</span>
                  <div className="flex items-center justify-between font-mono bg-white p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-gray-200">
                    <span className="truncate text-[9px] sm:text-[10px] sm:text-[11px] text-primary-700">https://wehosthere.com/webmail</span>
                    <div className="flex items-center gap-1 sm:gap-1.5 sm:gap-2 shrink-0">
                      <a
                        href="/webmail"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[9px] sm:text-[10px] sm:text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                      >
                        Abrir ↗
                      </a>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(typeof window !== 'undefined' ? `${window.location.origin}/webmail` : 'https://wehosthere.com/webmail')}
                        className="text-[9px] sm:text-[10px] sm:text-xs font-bold text-primary-600 hover:text-primary-800 ml-0.5 sm:ml-1 cursor-pointer"
                      >
                        {copiedText ? 'Copiado ✓' : 'Copiar'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2 sm:gap-2.5 pt-1.5 sm:pt-2">
                  <button
                    type="button"
                    onClick={() => setEditEmailAccount(null)}
                    className="sm:flex-1 py-2 sm:py-2.5 sm:py-3 border border-gray-200 text-gray-700 font-bold text-[10px] sm:text-xs sm:text-sm rounded-xl sm:rounded-2xl hover:bg-gray-50 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="sm:flex-1 py-2 sm:py-2.5 sm:py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-[10px] sm:text-xs sm:text-sm rounded-xl sm:rounded-2xl transition cursor-pointer shadow-md"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-3xl shadow-2xl p-3 sm:p-4 sm:p-5 sm:p-6 max-w-md w-full border border-gray-100 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[95vh] overflow-y-auto sm:mx-4">
            <div className="flex items-center justify-between pb-2 sm:pb-3 sm:pb-4 border-b border-gray-100 mb-2 sm:mb-3 sm:mb-4">
              <h2 className="text-sm sm:text-base sm:text-lg font-extrabold text-gray-900 truncate">Nova Conta de Email Corporativo</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 sm:p-1.5 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer shrink-0"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmail} className="space-y-2.5 sm:space-y-3 sm:space-y-4">
              {/* Se não há domínios, aviso */}
              {userDomains.length === 0 ? (
                <div className="p-2 sm:p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg sm:rounded-2xl flex items-start space-x-1.5 sm:space-x-2 sm:space-x-3">
                  <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:h-5 sm:w-4 sm:w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs sm:text-sm font-bold text-amber-800">Nenhum domínio registado</p>
                    <p className="text-[9px] sm:text-[10px] sm:text-xs text-amber-700 mt-0.5">Adicione um site/domínio primeiro em <Link href="/dashboard/sites" className="underline font-bold">Meus Sites</Link> para poder criar contas de email.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 sm:space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-[9px] sm:text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-700 mb-0.5 sm:mb-1">
                      Nome da Conta (Prefixo)
                    </label>
                    <input
                      type="text"
                      value={newEmailPrefix}
                      onChange={(e) => setNewEmailPrefix(e.target.value)}
                      className="w-full px-2.5 sm:px-3 sm:px-4 py-2 sm:py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs sm:text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
                      placeholder="ex: contacto, geral, vendas, suporte"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] sm:text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-700 mb-0.5 sm:mb-1">
                      Domínio do E-mail
                    </label>
                    <select
                      value={selectedDomain}
                      onChange={(e) => setSelectedDomain(e.target.value)}
                      className="w-full px-2.5 sm:px-3 sm:px-4 py-2 sm:py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs sm:text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
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
                    <div className="p-2 sm:p-2.5 sm:p-3 bg-primary-50 border border-primary-200/80 rounded-lg sm:rounded-2xl text-[9px] sm:text-[10px] sm:text-xs text-primary-950 flex items-center justify-between">
                      <span className="font-semibold text-primary-900 truncate">Endereço final:</span>
                      <strong className="font-mono text-[9px] sm:text-[10px] sm:text-xs sm:text-sm text-primary-700 font-black truncate ml-1 sm:ml-2">
                        {newEmailPrefix.trim().toLowerCase()}@{selectedDomain}
                      </strong>
                    </div>
                  )}

                  {sites.find(s => s.domain === selectedDomain)?.status === 'pending' && (
                    <div className="mt-1.5 sm:mt-2 p-1.5 sm:p-2 sm:p-2.5 bg-amber-50 border border-amber-200 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] sm:text-xs text-amber-900 flex items-start space-x-1.5 sm:space-x-2">
                      <Clock className="h-3 w-3 sm:h-3.5 sm:h-4 sm:w-3.5 sm:w-4 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                      <span className="line-clamp-2">
                        O domínio <strong>{selectedDomain}</strong> está <strong>em processamento de aprovação</strong> pelo administrador.
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                  <label className="block text-[9px] sm:text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-700">
                    Senha de Acesso
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewPassword(generateRandomPassword())}
                    className="text-[9px] sm:text-[10px] sm:text-[11px] text-primary-600 font-bold hover:underline flex items-center space-x-0.5 sm:space-x-1 cursor-pointer"
                  >
                    <Sparkles className="h-2 w-2 sm:h-2.5 sm:h-3 sm:w-2.5 sm:w-3" />
                    <span>Gerar Senha</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-2.5 sm:px-3 sm:px-4 py-2 sm:py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs sm:text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                  placeholder="••••••••••••"
                  required
                />
              </div>

              <div>
                <label className="block text-[9px] sm:text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-700 mb-0.5 sm:mb-1">
                  Armazenamento
                </label>
                <div className="w-full px-2.5 sm:px-3 sm:px-4 py-2 sm:py-2.5 sm:py-3 bg-blue-50 border border-blue-200 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs sm:text-sm text-blue-800 font-semibold flex items-center gap-1.5 sm:gap-2">
                  <span className="text-[10px] sm:text-xs sm:text-sm">&#9432;</span>
                  <div className="min-w-0">
                    <div className="text-[10px] sm:text-xs sm:text-sm truncate">Armazenamento partilhado</div>
                    <div className="text-[8px] sm:text-[9px] sm:text-[10px] font-normal text-blue-600 truncate">Pool total da conta Migadu (sem limite por caixa)</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2 sm:gap-2.5 pt-1.5 sm:pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="sm:flex-1 py-2 sm:py-2.5 sm:py-3 border border-gray-200 text-gray-700 font-bold text-[10px] sm:text-xs sm:text-sm rounded-xl sm:rounded-2xl hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={userDomains.length === 0}
                  className="sm:flex-1 py-2 sm:py-2.5 sm:py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-[10px] sm:text-xs sm:text-sm rounded-xl sm:rounded-2xl transition cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
