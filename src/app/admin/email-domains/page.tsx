'use client';
import { useState, useEffect } from 'react';

import { 
  Plus, 
  Search, 
  MoreVertical, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Settings, 
  Mail, 
  Globe, 
  Zap, 
  CloudDownload, 
  Rocket, 
  Trash2, 
  ExternalLink, 
  Inbox, 
  Lock 
} from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { dataManager, EmailAccount } from '@/lib/data';

interface EmailDomain {
  _id: string;
  domainName: string;
  customerId: string;
  status: 'active' | 'pending_dns' | 'provisioning' | 'provisioning_failed' | 'suspended' | 'cancelled';
  provider: string;
  canSend: boolean;
  canReceive: boolean;
  activatedAt?: string;
  createdAt: string;
  updatedAt: string;
  diagnostics?: {
    overall: 'passed' | 'failed' | 'pending';
    checkedAt: string;
  };
}

export default function EmailDomainsPage() {
  const [domains, setDomains] = useState<EmailDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQuickCreateModal, setShowQuickCreateModal] = useState(false);
  const [newDomainName, setNewDomainName] = useState('');
  const [newCustomerId, setNewCustomerId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Quick Create State
  const [quickCreateData, setQuickCreateData] = useState({
    domainName: '',
    mailboxName: '', // e.g., info, suporte
    mailboxPassword: '',
    mailboxFullName: ''
  });
  const [isQuickCreating, setIsQuickCreating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [emailSearchTerm, setEmailSearchTerm] = useState('');
  const [loadingEmails, setLoadingEmails] = useState(true);

  useEffect(() => {
    fetchDomains();
    fetchEmailAccounts();
    
    // Auto-initialize wehosthere.com for admin if it doesn't exist
    const autoInitialize = async () => {
      const user = auth.getCurrentUser();
      if (user && user.role === 'admin') {
        // Check if wehosthere.com already exists
        try {
          const response = await fetch('/api/email-providers/migadu/domains');
          const data = await response.json();
          if (data.success && data.domains) {
            const hasWehosthere = data.domains.some((d: any) => d.domainName === 'wehosthere.com');
            if (!hasWehosthere) {
              console.log('[Auto-init] wehosthere.com not found, initializing...');
              await handleInitializeDefault();
            }
          }
        } catch (error) {
          console.error('[Auto-init] Error checking for wehosthere.com:', error);
        }
      }
    };
    
    // Delay auto-init to avoid conflicts with initial fetch
    setTimeout(autoInitialize, 2000);

    const interval = setInterval(() => {
      fetchDomains();
      fetchEmailAccounts();
    }, 10000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEmailAccounts = async () => {
    try {
      const res = await fetch('/api/emails');
      if (res.ok) {
        const data = await res.json();
        if (data.emails && Array.isArray(data.emails)) {
          setEmailAccounts(data.emails);
        }
      }
    } catch (e) {
      console.error('Erro ao buscar contas de email:', e);
    } finally {
      setLoadingEmails(false);
    }
  };

  const handleApproveEmail = async (emailAcc: EmailAccount) => {
    try {
      dataManager.updateEmailStatus(emailAcc.id, 'active');
      setEmailAccounts(prev => prev.map(e => e.id === emailAcc.id ? { ...e, status: 'active' } : e));
      setToast({ type: 'success', message: `E-mail ${emailAcc.email} ativado com sucesso!` });
    } catch (err) {
      setToast({ type: 'error', message: 'Erro ao ativar e-mail.' });
    }
  };

  const handleToggleEmailStatus = (emailAcc: EmailAccount) => {
    const newStatus = emailAcc.status === 'active' ? 'pending' : 'active';
    dataManager.updateEmailStatus(emailAcc.id, newStatus);
    setEmailAccounts(prev => prev.map(e => e.id === emailAcc.id ? { ...e, status: newStatus } : e));
    setToast({ type: 'success', message: `Status de ${emailAcc.email} atualizado para ${newStatus}.` });
  };

  const handleDeleteEmailAccount = (emailAcc: EmailAccount) => {
    if (!window.confirm(`Tem a certeza que deseja eliminar a conta de e-mail ${emailAcc.email}?`)) return;
    dataManager.deleteEmail(emailAcc.id, emailAcc.userEmail, emailAcc.email);
    setEmailAccounts(prev => prev.filter(e => e.id !== emailAcc.id));
    setToast({ type: 'success', message: `Conta ${emailAcc.email} eliminada.` });
  };

  const fetchDomains = async () => {
    try {
      const response = await fetch('/api/email-providers/migadu/domains');
      const data = await response.json();
      if (data.success) {
        setDomains(data.domains);
      }
    } catch (error) {
      console.error('Failed to fetch domains:', error);
      setToast({ type: 'error', message: 'Failed to load domains' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await fetch('/api/email-providers/migadu/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainName: newDomainName,
          customerId: newCustomerId,
          createDefaultAddresses: false
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setToast({ type: 'success', message: 'Domain created successfully' });
        setShowCreateModal(false);
        setNewDomainName('');
        setNewCustomerId('');
        fetchDomains();
      } else {
        setToast({ type: 'error', message: data.error || 'Failed to create domain' });
      }
    } catch (error) {
      setToast({ type: 'error', message: 'Failed to create domain' });
    } finally {
      setIsCreating(false);
    }
  };

  // Generate automatic customer ID
  const generateCustomerId = (domainName: string) => {
    const cleanDomain = domainName.replace(/\./g, '-').toLowerCase();
    const timestamp = Date.now().toString(36);
    return `${cleanDomain}-${timestamp}`;
  };

  const handleSyncFromMigadu = async () => {
    setIsSyncing(true);
    try {
      // This would call an API to sync all domains from Migadu to our database
      // For now, just refresh the list
      await fetchDomains();
      setToast({ 
        type: 'success', 
        message: 'Domínios sincronizados com sucesso!' 
      });
    } catch (error) {
      console.error('Sync error:', error);
      setToast({ type: 'error', message: 'Erro ao sincronizar domínios.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteDomain = async (domainName: string) => {
    if (!window.confirm(`Tem a certeza que deseja apagar o domínio ${domainName}? Esta ação é irreversível e apagará todas as caixas de correio associadas.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/email-providers/migadu/domains/${domainName}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        setToast({ type: 'success', message: 'Domínio apagado com sucesso.' });
        fetchDomains();
      } else {
        setToast({ type: 'error', message: data.error || 'Erro ao apagar o domínio.' });
      }
    } catch (error) {
      console.error('Delete domain error:', error);
      setToast({ type: 'error', message: 'Erro ao apagar o domínio.' });
    }
  };

  const handleInitializeDefault = async () => {
    setIsInitializing(true);
    try {
      const response = await fetch('/api/email-providers/migadu/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainName: 'wehosthere.com',
          createDefaultEmails: true
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setToast({ 
          type: 'success', 
          message: `Domínio wehosthere.com inicializado com sucesso! ${data.emails.length} emails criados.` 
        });
        fetchDomains();
      } else {
        setToast({ type: 'error', message: data.error || 'Failed to initialize' });
      }
    } catch (error) {
      console.error('Initialize error:', error);
      setToast({ type: 'error', message: 'Erro ao inicializar domínio padrão.' });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsQuickCreating(true);

    try {
      // Use user's ID as customerId if user is logged in
      const currentUser = auth.getCurrentUser();
      const customerId = currentUser?.id || generateCustomerId(quickCreateData.domainName);
      
      // Step 1: Check if domain already exists in our database
      const checkDomainResponse = await fetch('/api/email-providers/migadu/domains');
      const checkDomainData = await checkDomainResponse.json();
      
      if (checkDomainData.success && checkDomainData.domains) {
        const existingDomain = checkDomainData.domains.find((d: any) => d.domainName === quickCreateData.domainName);
        if (existingDomain) {
          // Domain exists, try to create mailbox directly
          const mailboxResponse = await fetch(
            `/api/email-providers/migadu/domains/${quickCreateData.domainName}/mailboxes`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                localPart: quickCreateData.mailboxName,
                password: quickCreateData.mailboxPassword,
                name: quickCreateData.mailboxFullName,
                customerId: existingDomain.customerId,
                passwordMethod: 'generated'
              })
            }
          );

          const mailboxData = await mailboxResponse.json();
          
          if (mailboxData.success) {
            setToast({ 
              type: 'success', 
              message: `Mailbox ${quickCreateData.mailboxName}@${quickCreateData.domainName} created successfully! (Domain already existed)` 
            });
            setShowQuickCreateModal(false);
            setQuickCreateData({
              domainName: '',
              mailboxName: '',
              mailboxPassword: '',
              mailboxFullName: ''
            });
            fetchDomains();
          } else if (mailboxData.error && mailboxData.error.includes('already exists')) {
            setToast({ 
              type: 'error', 
              message: `O email ${quickCreateData.mailboxName}@${quickCreateData.domainName} já existe na Migadu. Por favor, escolha outro nome.` 
            });
          } else {
            setToast({ type: 'error', message: mailboxData.error || 'Failed to create mailbox' });
          }
          setIsQuickCreating(false);
          return;
        }
      }

      // Step 2: Create Domain (if doesn't exist)
      const domainResponse = await fetch('/api/email-providers/migadu/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainName: quickCreateData.domainName,
          customerId,
          createDefaultAddresses: false
        })
      });

      const domainData = await domainResponse.json();
      
      if (!domainData.success) {
        if (domainData.error && domainData.error.includes('already exists')) {
          setToast({ 
            type: 'error', 
            message: `O domínio ${quickCreateData.domainName} já existe na Migadu mas não está sincronizado. Por favor, contacte o suporte.` 
          });
        } else {
          setToast({ type: 'error', message: domainData.error || 'Failed to create domain' });
        }
        setIsQuickCreating(false);
        return;
      }

      // Step 3: Create Mailbox
      const mailboxResponse = await fetch(
        `/api/email-providers/migadu/domains/${quickCreateData.domainName}/mailboxes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            localPart: quickCreateData.mailboxName,
            password: quickCreateData.mailboxPassword,
            name: quickCreateData.mailboxFullName,
            customerId,
            passwordMethod: 'generated'
          })
        }
      );

      const mailboxData = await mailboxResponse.json();
      
      if (mailboxData.success) {
        setToast({ 
          type: 'success', 
          message: `Domain ${quickCreateData.domainName} e mailbox ${quickCreateData.mailboxName}@${quickCreateData.domainName} criados com sucesso!` 
        });
        setShowQuickCreateModal(false);
        setQuickCreateData({
          domainName: '',
          mailboxName: '',
          mailboxPassword: '',
          mailboxFullName: ''
        });
        fetchDomains();
      } else if (mailboxData.error && mailboxData.error.includes('already exists')) {
        setToast({ 
          type: 'error', 
          message: `O email ${quickCreateData.mailboxName}@${quickCreateData.domainName} já existe. Por favor, escolha outro nome.` 
        });
      } else {
        setToast({ type: 'error', message: mailboxData.error || 'Failed to create mailbox' });
      }
    } catch (error) {
      console.error('Quick Create error:', error);
      setToast({ type: 'error', message: 'Erro ao criar domínio e mailbox. Por favor, tente novamente.' });
    } finally {
      setIsQuickCreating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'pending_dns':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'provisioning':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'provisioning_failed':
      case 'suspended':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; className: string }> = {
      active: { text: 'Active', className: 'bg-emerald-100 text-emerald-800' },
      pending_dns: { text: 'Pending DNS', className: 'bg-amber-100 text-amber-800' },
      provisioning: { text: 'Provisioning', className: 'bg-blue-100 text-blue-800' },
      provisioning_failed: { text: 'Failed', className: 'bg-red-100 text-red-800' },
      suspended: { text: 'Suspended', className: 'bg-red-100 text-red-800' },
      cancelled: { text: 'Cancelled', className: 'bg-gray-100 text-gray-800' }
    };
    
    const config = statusMap[status] || statusMap.cancelled;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.text}
      </span>
    );
  };

  const filteredDomains = domains.filter(domain => {
    const matchesSearch = domain.domainName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || domain.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Email Domains</h1>
              <p className="text-sm text-gray-500 mt-1">Manage email domains and DNS configuration</p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/admin"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition"
              >
                <Settings className="h-5 w-5" />
                <span className="hidden sm:inline">Admin Dashboard</span>
              </Link>
              <button
                onClick={handleInitializeDefault}
                disabled={isInitializing}
                className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition shadow-md"
              >
                <Rocket className={`h-5 w-5 ${isInitializing ? 'animate-pulse' : ''}`} />
                <span>{isInitializing ? 'Inicializando...' : 'Inicializar wehosthere.com'}</span>
              </button>
              <button
                onClick={handleSyncFromMigadu}
                disabled={isSyncing}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition"
              >
                <CloudDownload className={`h-5 w-5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync'}</span>
              </button>
              <button
                onClick={() => setShowQuickCreateModal(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition shadow-md"
              >
                <Zap className="h-5 w-5" />
                <span>Quick Create</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
              >
                <Plus className="h-5 w-5" />
                <span>Add Domain</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search domains..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending_dns">Pending DNS</option>
              <option value="provisioning">Provisioning</option>
              <option value="provisioning_failed">Failed</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Domains List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 text-primary-600 animate-spin" />
          </div>
        ) : filteredDomains.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No domains found</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first email domain</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
            >
              Add Domain
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Domain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DNS Check
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDomains.map((domain) => (
                  <tr key={domain._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Globe className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{domain.domainName}</div>
                          <div className="text-sm text-gray-500">{domain.customerId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(domain.status)}
                        <span className="ml-2">{getStatusBadge(domain.status)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {domain.diagnostics ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          domain.diagnostics.overall === 'passed' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : domain.diagnostics.overall === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {domain.diagnostics.overall.toUpperCase()}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">Not checked</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(domain.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Link
                        href={`/admin/email-domains/${domain.domainName}/mailboxes`}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-semibold border border-purple-200 transition"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        <span>Caixas ({emailAccounts.filter(e => e.email.toLowerCase().endsWith(`@${domain.domainName.toLowerCase()}`)).length})</span>
                      </Link>
                      <Link
                        href={`/admin/email-domains/${domain.domainName}`}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-semibold border border-gray-200 transition"
                      >
                        <Settings className="h-3.5 w-3.5" />
                        <span>DNS & Config</span>
                      </Link>
                      <button 
                        onClick={() => handleDeleteDomain(domain.domainName)}
                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Eliminar Domínio"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ───── TABELA COMPLETA DE CAIXAS DE E-MAIL (ADMIN & CLIENTES) ───── */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <Inbox className="h-6 w-6 text-primary-600" />
                <h2 className="text-xl font-bold text-gray-900">Todas as Contas de E-mail Criadas</h2>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Acesse o Webmail, altere senhas, aprove ou suspenda contas de e-mail de todos os domínios
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar e-mail..."
                  value={emailSearchTerm}
                  onChange={(e) => setEmailSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <button
                onClick={() => setShowQuickCreateModal(true)}
                className="flex items-center space-x-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow hover:from-purple-700 hover:to-indigo-700 transition"
              >
                <Plus className="h-4 w-4" />
                <span>Nova Caixa</span>
              </button>
            </div>
          </div>

          {loadingEmails ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 text-primary-600 animate-spin" />
            </div>
          ) : emailAccounts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Mail className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="font-semibold text-gray-700">Nenhuma conta de e-mail criada ainda.</p>
              <p className="text-xs text-gray-400 mt-1">Use o botão &quot;Quick Create&quot; para criar o primeiro e-mail corporativo.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Endereço de E-mail
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dono / Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Espaço
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações Rápidas
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {emailAccounts
                    .filter(e => !emailSearchTerm || e.email.toLowerCase().includes(emailSearchTerm.toLowerCase()) || (e.userEmail && e.userEmail.toLowerCase().includes(emailSearchTerm.toLowerCase())))
                    .map((acc) => {
                      const isPending = acc.status === 'pending' || !acc.status;
                      const isAdminEmail = acc.email.toLowerCase().includes('wehosthere.com');
                      return (
                        <tr key={acc.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <div className={`p-1.5 rounded-lg ${isAdminEmail ? 'bg-amber-100 text-amber-800' : 'bg-primary-50 text-primary-600'}`}>
                                <Mail className="h-4 w-4" />
                              </div>
                              <div>
                                <span className="font-mono font-bold text-gray-900 text-sm">{acc.email}</span>
                                {isAdminEmail && (
                                  <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded">
                                    ADMIN
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {acc.userEmail || (isAdminEmail ? 'Administrador' : 'Cliente Plataforma')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">
                            {acc.storage || (acc as any).quotaGB || 5} GB
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                              acc.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : acc.status === 'suspended'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {acc.status === 'active' ? '✓ Ativo' : acc.status === 'suspended' ? '🛑 Suspenso' : '⏰ Pendente'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            {isPending && (
                              <button
                                onClick={() => handleApproveEmail(acc)}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                <span>Aprovar</span>
                              </button>
                            )}
                            <a
                              href="https://webmail.wehosthere.com"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold border border-blue-200 transition"
                              title="Abrir Webmail Oficial"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              <span>Webmail</span>
                            </a>
                            <button
                              onClick={() => handleToggleEmailStatus(acc)}
                              className="px-2 py-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-200 transition"
                            >
                              {acc.status === 'active' ? 'Suspender' : 'Ativar'}
                            </button>
                            <button
                              onClick={() => handleDeleteEmailAccount(acc)}
                              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Eliminar Conta de E-mail"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Domain Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Domain</h2>
              <form onSubmit={handleCreateDomain}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Domain Name
                  </label>
                  <input
                    type="text"
                    value={newDomainName}
                    onChange={(e) => setNewDomainName(e.target.value)}
                    placeholder="example.com"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer ID
                  </label>
                  <input
                    type="text"
                    value={newCustomerId}
                    onChange={(e) => setNewCustomerId(e.target.value)}
                    placeholder="customer-123"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                  >
                    {isCreating ? 'Creating...' : 'Create Domain'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Quick Create Modal */}
      {showQuickCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-2 rounded-lg">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Quick Create Email</h2>
                  <p className="text-sm text-gray-500">Create domain + mailbox in one step</p>
                </div>
              </div>
              <form onSubmit={handleQuickCreate}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Domain Name
                  </label>
                  <input
                    type="text"
                    value={quickCreateData.domainName}
                    onChange={(e) => setQuickCreateData({...quickCreateData, domainName: e.target.value})}
                    placeholder="empresa.co.mz"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mailbox Name (e.g., info, suporte, admin)
                  </label>
                  <input
                    type="text"
                    value={quickCreateData.mailboxName}
                    onChange={(e) => setQuickCreateData({...quickCreateData, mailboxName: e.target.value})}
                    placeholder="info"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email will be: {quickCreateData.mailboxName}@{quickCreateData.domainName || 'dominio.com'}</p>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={quickCreateData.mailboxFullName}
                    onChange={(e) => setQuickCreateData({...quickCreateData, mailboxFullName: e.target.value})}
                    placeholder="João Silva"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={quickCreateData.mailboxPassword}
                    onChange={(e) => setQuickCreateData({...quickCreateData, mailboxPassword: e.target.value})}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowQuickCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isQuickCreating}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-50 shadow-md"
                  >
                    {isQuickCreating ? 'Creating...' : 'Create Email'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
        } text-white`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
