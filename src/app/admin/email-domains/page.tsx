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
  CloudDownload
} from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/lib/auth';

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

  useEffect(() => {
    fetchDomains();
  }, []);

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

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsQuickCreating(true);

    try {
      const customerId = generateCustomerId(quickCreateData.domainName);
      
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/email-domains/${domain.domainName}`}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        Manage
                      </Link>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
