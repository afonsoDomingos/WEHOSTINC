'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Settings,
  Mail,
  Globe,
  Copy,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface DNSRecord {
  type: string;
  name: string;
  value: string;
  priority?: number;
  ttl?: number;
  status: 'correct' | 'incorrect' | 'pending' | 'missing';
}

interface DNSDiagnostics {
  mx: { status: string; message: string };
  spf: { status: string; message: string };
  dkim: { status: string; message: string };
  dmarc: { status: string; message: string };
  overall: 'passed' | 'failed' | 'pending';
  checkedAt: string;
}

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
  dnsRecords?: DNSRecord[];
  diagnostics?: DNSDiagnostics;
}

export default function EmailDomainDetailPage() {
  const params = useParams();
  const domainName = params.domain as string;
  
  const [domain, setDomain] = useState<EmailDomain | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCheckingDNS, setIsCheckingDNS] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchDomain();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainName]);

  const fetchDomain = async () => {
    try {
      const response = await fetch(`/api/email-providers/migadu/domains/${domainName}`);
      const data = await response.json();
      if (data.success) {
        setDomain(data.domain);
      }
    } catch (error) {
      console.error('Failed to fetch domain:', error);
      setToast({ type: 'error', message: 'Failed to load domain details' });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckDNS = async () => {
    setIsCheckingDNS(true);
    try {
      const response = await fetch(`/api/email-providers/migadu/domains/${domainName}/diagnostics`);
      const data = await response.json();
      if (data.success) {
        setToast({ type: 'success', message: 'DNS check completed' });
        fetchDomain();
      } else {
        setToast({ type: 'error', message: 'DNS check failed' });
      }
    } catch (error) {
      setToast({ type: 'error', message: 'Failed to check DNS' });
    } finally {
      setIsCheckingDNS(false);
    }
  };

  const handleActivateDomain = async () => {
    setIsActivating(true);
    try {
      const response = await fetch(`/api/email-providers/migadu/domains/${domainName}/activate`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        setToast({ type: 'success', message: 'Domain activated successfully' });
        fetchDomain();
      } else {
        setToast({ type: 'error', message: data.error || 'Failed to activate domain' });
      }
    } catch (error) {
      setToast({ type: 'error', message: 'Failed to activate domain' });
    } finally {
      setIsActivating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setToast({ type: 'success', message: 'Copied to clipboard' });
  };

  const getDNSStatusIcon = (status: string) => {
    switch (status) {
      case 'correct':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'incorrect':
      case 'missing':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-amber-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!domain) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-900 mb-2">Domain not found</h2>
          <Link
            href="/admin/email-domains"
            className="text-primary-600 hover:text-primary-700"
          >
            Back to domains
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/email-domains"
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{domain.domainName}</h1>
                <p className="text-sm text-gray-500 mt-1">{domain.customerId}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCheckDNS}
                disabled={isCheckingDNS}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                <RefreshCw className={`h-5 w-5 ${isCheckingDNS ? 'animate-spin' : ''}`} />
                <span>Check DNS</span>
              </button>
              {domain.status === 'pending_dns' && (
                <button
                  onClick={handleActivateDomain}
                  disabled={isActivating}
                  className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                >
                  <CheckCircle className="h-5 w-5" />
                  <span>{isActivating ? 'Activating...' : 'Activate Domain'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Domain Status */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Domain Status</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Status</div>
                  <div className="font-medium text-gray-900 capitalize">{domain.status.replace('_', ' ')}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Provider</div>
                  <div className="font-medium text-gray-900 capitalize">{domain.provider}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Can Send</div>
                  <div className={`font-medium ${domain.canSend ? 'text-emerald-600' : 'text-red-600'}`}>
                    {domain.canSend ? 'Yes' : 'No'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Can Receive</div>
                  <div className={`font-medium ${domain.canReceive ? 'text-emerald-600' : 'text-red-600'}`}>
                    {domain.canReceive ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>
            </div>

            {/* DNS Records */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">DNS Records</h2>
              {domain.dnsRecords && domain.dnsRecords.length > 0 ? (
                <div className="space-y-3">
                  {domain.dnsRecords.map((record, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded">
                            {record.type}
                          </span>
                          {getDNSStatusIcon(record.status)}
                        </div>
                        <button
                          onClick={() => copyToClipboard(record.value)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Name:</span>
                          <span className="ml-2 font-medium">{record.name}</span>
                        </div>
                        {record.priority && (
                          <div>
                            <span className="text-gray-500">Priority:</span>
                            <span className="ml-2 font-medium">{record.priority}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-2">
                        <span className="text-gray-500 text-sm">Value:</span>
                        <div className="mt-1 p-2 bg-gray-50 rounded text-sm font-mono break-all">
                          {record.value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Globe className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No DNS records available</p>
                  <button
                    onClick={handleCheckDNS}
                    disabled={isCheckingDNS}
                    className="mt-4 text-primary-600 hover:text-primary-700 disabled:opacity-50"
                  >
                    Fetch DNS Records
                  </button>
                </div>
              )}
            </div>

            {/* DNS Diagnostics */}
            {domain.diagnostics && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">DNS Diagnostics</h2>
                <div className="space-y-3">
                  {Object.entries(domain.diagnostics).map(([key, value]) => {
                    if (key === 'checkedAt' || key === 'overall') return null;
                    const diagnostic = value as { status: string; message: string };
                    return (
                      <div key={key} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        {getDNSStatusIcon(diagnostic.status)}
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 capitalize">{key}</div>
                          <div className="text-sm text-gray-600">{diagnostic.message}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Last checked:</span>
                    <span className="text-sm text-gray-900">
                      {new Date(domain.diagnostics.checkedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  href={`/admin/email-domains/${domainName}/mailboxes`}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition"
                >
                  <Mail className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">Manage Mailboxes</span>
                </Link>
                <Link
                  href={`/admin/email-domains/${domainName}/aliases`}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition"
                >
                  <Settings className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">Manage Aliases</span>
                </Link>
                <a
                  href={`https://migadu.com/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition"
                >
                  <ExternalLink className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">Open in Migadu</span>
                </a>
              </div>
            </div>

            {/* Domain Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Domain Information</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Created:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(domain.createdAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Updated:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(domain.updatedAt).toLocaleString()}
                  </span>
                </div>
                {domain.activatedAt && (
                  <div>
                    <span className="text-gray-500">Activated:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(domain.activatedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

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
