'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  MoreVertical, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Mail,
  User,
  Key
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface EmailMailbox {
  _id: string;
  domainId: string;
  customerId: string;
  localPart: string;
  email: string;
  name: string;
  status: 'active' | 'suspended' | 'cancelled';
  provider: string;
  maySend: boolean;
  mayReceive: boolean;
  mayAccessImap: boolean;
  mayAccessPop3: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  storageUsed?: number;
  storageLimit?: number;
}

export default function DomainMailboxesPage() {
  const params = useParams();
  const domainName = params.domain as string;
  
  const [mailboxes, setMailboxes] = useState<EmailMailbox[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMailboxData, setNewMailboxData] = useState({
    name: '',
    localPart: '',
    password: '',
    passwordMethod: 'generated' as 'generated' | 'invitation',
    passwordRecoveryEmail: '',
    customerId: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchMailboxes();
  }, [domainName]);

  const fetchMailboxes = async () => {
    try {
      const response = await fetch(`/api/email-providers/migadu/domains/${domainName}/mailboxes`);
      const data = await response.json();
      if (data.success) {
        setMailboxes(data.mailboxes);
      }
    } catch (error) {
      console.error('Failed to fetch mailboxes:', error);
      setToast({ type: 'error', message: 'Failed to load mailboxes' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMailbox = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await fetch(`/api/email-providers/migadu/domains/${domainName}/mailboxes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMailboxData)
      });

      const data = await response.json();
      
      if (data.success) {
        setToast({ type: 'success', message: 'Mailbox created successfully' });
        setShowCreateModal(false);
        setNewMailboxData({
          name: '',
          localPart: '',
          password: '',
          passwordMethod: 'generated',
          passwordRecoveryEmail: '',
          customerId: ''
        });
        fetchMailboxes();
      } else {
        setToast({ type: 'error', message: data.error || 'Failed to create mailbox' });
      }
    } catch (error) {
      setToast({ type: 'error', message: 'Failed to create mailbox' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleResetPassword = async (localPart: string) => {
    if (!confirm('Are you sure you want to reset the password for this mailbox?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/email-providers/migadu/domains/${domainName}/mailboxes/${localPart}/reset-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setToast({ type: 'success', message: 'Password reset successfully' });
      } else {
        setToast({ type: 'error', message: data.error || 'Failed to reset password' });
      }
    } catch (error) {
      setToast({ type: 'error', message: 'Failed to reset password' });
    }
  };

  const handleSuspendMailbox = async (localPart: string) => {
    if (!confirm('Are you sure you want to suspend this mailbox?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/email-providers/migadu/domains/${domainName}/mailboxes/${localPart}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ maySend: false, mayReceive: false })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setToast({ type: 'success', message: 'Mailbox suspended successfully' });
        fetchMailboxes();
      } else {
        setToast({ type: 'error', message: data.error || 'Failed to suspend mailbox' });
      }
    } catch (error) {
      setToast({ type: 'error', message: 'Failed to suspend mailbox' });
    }
  };

  const handleActivateMailbox = async (localPart: string) => {
    try {
      const response = await fetch(
        `/api/email-providers/migadu/domains/${domainName}/mailboxes/${localPart}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ maySend: true, mayReceive: true })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setToast({ type: 'success', message: 'Mailbox activated successfully' });
        fetchMailboxes();
      } else {
        setToast({ type: 'error', message: data.error || 'Failed to activate mailbox' });
      }
    } catch (error) {
      setToast({ type: 'error', message: 'Failed to activate mailbox' });
    }
  };

  const handleDeleteMailbox = async (localPart: string) => {
    if (!confirm('Are you sure you want to delete this mailbox? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/email-providers/migadu/domains/${domainName}/mailboxes/${localPart}`,
        {
          method: 'DELETE'
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setToast({ type: 'success', message: 'Mailbox deleted successfully' });
        fetchMailboxes();
      } else {
        setToast({ type: 'error', message: data.error || 'Failed to delete mailbox' });
      }
    } catch (error) {
      setToast({ type: 'error', message: 'Failed to delete mailbox' });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'suspended':
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <RefreshCw className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; className: string }> = {
      active: { text: 'Active', className: 'bg-emerald-100 text-emerald-800' },
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

  const formatStorage = (bytes?: number) => {
    if (!bytes) return '0 GB';
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  const filteredMailboxes = mailboxes.filter(mailbox => {
    const matchesSearch = 
      mailbox.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mailbox.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || mailbox.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href={`/admin/email-domains/${domainName}`}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mailboxes</h1>
                <p className="text-sm text-gray-500 mt-1">{domainName}</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
            >
              <Plus className="h-5 w-5" />
              <span>Add Mailbox</span>
            </button>
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
                  placeholder="Search mailboxes..."
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
              <option value="suspended">Suspended</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Mailboxes List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 text-primary-600 animate-spin" />
          </div>
        ) : filteredMailboxes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No mailboxes found</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first mailbox</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
            >
              Add Mailbox
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mailbox
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Storage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMailboxes.map((mailbox) => (
                  <tr key={mailbox._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{mailbox.email}</div>
                          <div className="text-sm text-gray-500">{mailbox.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(mailbox.status)}
                        <span className="ml-2">{getStatusBadge(mailbox.status)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatStorage(mailbox.storageUsed)} / {formatStorage(mailbox.storageLimit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {mailbox.lastLoginAt 
                        ? new Date(mailbox.lastLoginAt).toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {mailbox.status === 'active' ? (
                          <>
                            <button
                              onClick={() => handleResetPassword(mailbox.localPart)}
                              className="text-gray-400 hover:text-gray-600"
                              title="Reset Password"
                            >
                              <Key className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleSuspendMailbox(mailbox.localPart)}
                              className="text-gray-400 hover:text-red-600"
                              title="Suspend"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleActivateMailbox(mailbox.localPart)}
                            className="text-gray-400 hover:text-emerald-600"
                            title="Activate"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteMailbox(mailbox.localPart)}
                          className="text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <XCircle className="h-4 w-4" />
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

      {/* Create Mailbox Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Mailbox</h2>
              <form onSubmit={handleCreateMailbox}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={newMailboxData.name}
                    onChange={(e) => setNewMailboxData({ ...newMailboxData, name: e.target.value })}
                    placeholder="John Doe"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (local part)
                  </label>
                  <input
                    type="text"
                    value={newMailboxData.localPart}
                    onChange={(e) => setNewMailboxData({ ...newMailboxData, localPart: e.target.value })}
                    placeholder="john"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Full email will be: {newMailboxData.localPart}@{domainName}</p>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password Method
                  </label>
                  <select
                    value={newMailboxData.passwordMethod}
                    onChange={(e) => setNewMailboxData({ ...newMailboxData, passwordMethod: e.target.value as 'generated' | 'invitation' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="generated">Generate Password</option>
                    <option value="invitation">Send Invitation</option>
                  </select>
                </div>
                {newMailboxData.passwordMethod === 'generated' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password (optional - will be generated if empty)
                    </label>
                    <input
                      type="password"
                      value={newMailboxData.password}
                      onChange={(e) => setNewMailboxData({ ...newMailboxData, password: e.target.value })}
                      placeholder="Leave empty to auto-generate"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                )}
                {newMailboxData.passwordMethod === 'invitation' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recovery Email
                    </label>
                    <input
                      type="email"
                      value={newMailboxData.passwordRecoveryEmail}
                      onChange={(e) => setNewMailboxData({ ...newMailboxData, passwordRecoveryEmail: e.target.value })}
                      placeholder="user@example.com"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                )}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer ID
                  </label>
                  <input
                    type="text"
                    value={newMailboxData.customerId}
                    onChange={(e) => setNewMailboxData({ ...newMailboxData, customerId: e.target.value })}
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
                    {isCreating ? 'Creating...' : 'Create Mailbox'}
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
