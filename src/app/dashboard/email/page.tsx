'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Mail, Plus, Trash2, Settings, CheckCircle, Clock, XCircle,
  LayoutDashboard, Globe, Database, Settings as SettingsIcon, LogOut, Server, ExternalLink,
  Key, ShieldCheck, Copy, Sparkles, AlertCircle, X, Check, Lock
} from 'lucide-react';
import { auth, User } from '@/lib/auth';
import { dataManager, EmailAccount, Site } from '@/lib/data';

import DashboardNav from '@/components/DashboardNav';
import PageLoader from '@/components/PageLoader';
import StatusBadge from '@/components/StatusBadge';

export default function EmailPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [emails, setEmails] = useState<EmailAccount[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [userDomains, setUserDomains] = useState<string[]>([]);
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

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);

    const refreshData = () => {
      const loadedEmails = dataManager.getEmails();
      setEmails(loadedEmails);
      const loadedSites = dataManager.getSites();
      setSites(loadedSites);
      const domains = loadedSites.map(s => s.domain).filter(Boolean);
      setUserDomains(domains);
    };

    refreshData();
    const initialSites = dataManager.getSites();
    if (initialSites.length > 0 && initialSites[0].domain) {
      setSelectedDomain(initialSites[0].domain);
    }
    setLoading(false);

    dataManager.fetchEmailsAsync().then(refreshData);
    dataManager.fetchSitesAsync().then(refreshData);

    const interval = setInterval(() => {
      dataManager.fetchEmailsAsync().then(refreshData);
      dataManager.fetchSitesAsync().then(refreshData);
    }, 3000);

    return () => clearInterval(interval);
  }, [router]);

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

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmailPrefix || !newPassword) return;

    const fullEmail = newEmailPrefix.includes('@')
      ? newEmailPrefix.trim()
      : `${newEmailPrefix.trim()}@${selectedDomain}`;

    const domainSite = sites.find(s => s.domain === selectedDomain);
    const initialStatus: EmailAccount['status'] = domainSite?.status === 'pending' ? 'pending' : 'active';

    const newEmailAccount = dataManager.addEmail({
      email: fullEmail,
      status: initialStatus,
      storage: newStorage
    });

    setEmails([...emails, newEmailAccount]);
    setShowCreateModal(false);
    setNewEmailPrefix('');
    setNewPassword('');
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

  const handleDeleteEmail = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta conta de email?')) {
      dataManager.deleteEmail(id);
      setEmails(emails.filter(e => e.id !== id));
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
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Responsivo */}
      <DashboardNav userName={user.name} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar (Desktop) */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <nav className="space-y-2">
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition font-medium"
                >
                  <LayoutDashboard className="h-5 w-5" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/dashboard/sites"
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition font-medium"
                >
                  <Globe className="h-5 w-5" />
                  <span>Meus Sites</span>
                </Link>
                <Link
                  href="/site-quote"
                  className="flex items-center space-x-3 px-4 py-3 bg-amber-50 text-amber-900 border border-amber-200/80 rounded-lg font-bold hover:bg-amber-100 transition"
                >
                  <Sparkles className="h-5 w-5 text-amber-600" />
                  <span>Solicitar Site</span>
                </Link>
                <Link
                  href="/dashboard/email"
                  className="flex items-center space-x-3 px-4 py-3 bg-primary-50 text-primary-700 rounded-lg font-medium"
                >
                  <Mail className="h-5 w-5" />
                  <span>Email</span>
                </Link>
                <Link
                  href="/dashboard/billing"
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition font-medium"
                >
                  <Database className="h-5 w-5" />
                  <span>Faturamento</span>
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition font-medium"
                >
                  <SettingsIcon className="h-5 w-5" />
                  <span>Configurações</span>
                </Link>
              </nav>
            </div>
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
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center space-x-4">
                          <div className="bg-primary-50 p-3 rounded-2xl border border-primary-100">
                            <Mail className="h-6 w-6 text-primary-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-base flex items-center space-x-2">
                              <span>{email.email}</span>
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">Conta Corporativa Profissional</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={email.status} />

                          {/* Botão Acessar Webmail Integrado */}
                          <Link
                            href={`/webmail?user=${encodeURIComponent(email.email)}`}
                            className="px-3.5 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                          >
                            <Mail className="h-3.5 w-3.5" />
                            <span>Abrir Webmail</span>
                          </Link>

                          {/* Botão Configurações / Editar Senha */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(email)}
                            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-xl transition cursor-pointer border border-gray-200"
                            title="Editar Conta & Alterar Senha"
                          >
                            <Settings className="h-4 w-4" />
                          </button>

                          {/* Botão Excluir */}
                          <button
                            type="button"
                            onClick={() => handleDeleteEmail(email.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer border border-gray-200"
                            title="Excluir Conta"
                          >
                            <Trash2 className="h-4 w-4" />
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

                      <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-gray-600">
                        <div>
                          <span className="text-gray-400 block font-medium">Armazenamento</span>
                          <span className="font-bold text-gray-900">{email.storage} GB</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block font-medium">Criado em</span>
                          <span className="font-bold text-gray-900">
                            {new Date(email.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(email)}
                            className="text-primary-600 hover:text-primary-800 font-bold underline cursor-pointer flex items-center space-x-1"
                          >
                            <Key className="h-3 w-3" />
                            <span>Alterar Senha de Acesso</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Email Configuration Box */}
            <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center space-x-2 mb-3">
                <ShieldCheck className="h-5 w-5 text-primary-600" />
                <h3 className="font-bold text-gray-900 text-base">Parâmetros de Configuração de Email (Outlook, iPhone, Android)</h3>
              </div>
              <p className="text-gray-600 text-xs sm:text-sm mb-4">
                Utilize as configurações abaixo para adicionar estas contas ao Outlook, Thunderbird, Apple Mail ou no smartphone:
              </p>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <span className="font-bold text-blue-900 block mb-1">Servidor IMAP (Recomendado):</span>
                  <span className="font-mono text-gray-800 block">mail.wehosthere.com</span>
                  <span className="text-gray-500 font-mono text-[11px]">Porta 993 (SSL)</span>
                </div>
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <span className="font-bold text-blue-900 block mb-1">Servidor POP3:</span>
                  <span className="font-mono text-gray-800 block">mail.wehosthere.com</span>
                  <span className="text-gray-500 font-mono text-[11px]">Porta 995 (SSL)</span>
                </div>
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <span className="font-bold text-blue-900 block mb-1">Servidor SMTP (Envio):</span>
                  <span className="font-mono text-gray-800 block">mail.wehosthere.com</span>
                  <span className="text-gray-500 font-mono text-[11px]">Porta 465 (SSL) / 587 (TLS)</span>
                </div>
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <span className="font-bold text-blue-900 block mb-1">URL Direto do Webmail:</span>
                  <span className="font-mono text-primary-700 font-bold block truncate">webmail.wehosthere.com</span>
                  <span className="text-gray-500 font-mono text-[11px]">Login: Email + Senha</span>
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
                  className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-2xl transition cursor-pointer shadow-md"
                >
                  Criar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
