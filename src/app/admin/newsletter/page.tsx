'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Send, Trash2, RefreshCw, Search, Filter, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import PageLoader from '@/components/PageLoader';
import Toast from '@/components/Toast';

export default function AdminNewsletterPage() {
  const router = useRouter();
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'unsubscribed' | 'bounced'>('all');
  const [toastMsg, setToastMsg] = useState<{ title?: string; message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  const fetchSubscribers = async () => {
    try {
      const response = await fetch('/api/admin/newsletter/send');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSubscribers(data.subscribers || []);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar subscritores:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const handleSendNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) {
      setMessage('Por favor, preencha o assunto e conteúdo.');
      return;
    }

    setSending(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, content })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage(data.message || 'Newsletter enviada com sucesso!');
        setSubject('');
        setContent('');
        setToastMsg({ title: 'Newsletter Enviada', message: data.message, type: 'success' });
      } else {
        setMessage(data.error || 'Erro ao enviar newsletter.');
        setToastMsg({ title: 'Erro', message: data.error, type: 'error' });
      }
    } catch (error) {
      setMessage('Erro ao conectar com servidor.');
      setToastMsg({ title: 'Erro', message: 'Erro ao conectar com servidor.', type: 'error' });
    } finally {
      setSending(false);
    }
  };

  const handleDeleteSubscriber = async (email: string) => {
    try {
      const response = await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        await fetchSubscribers();
        setToastMsg({ title: 'Subscritor Removido', message: 'Subscritor removido com sucesso.', type: 'success' });
      }
    } catch (error) {
      setToastMsg({ title: 'Erro', message: 'Erro ao remover subscritor.', type: 'error' });
    }
  };

  const filteredSubscribers = subscribers.filter(sub => {
    const matchesSearch = sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (sub.name && sub.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <PageLoader text="A carregar gestão de newsletter..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <BrandLogo />
              <span className="bg-purple-100 text-purple-700 text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-purple-200">
                ADMIN
              </span>
              <span className="text-gray-500 text-[10px] sm:text-xs font-medium">/ Newsletter</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={fetchSubscribers}
                className="flex items-center space-x-1.5 px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition cursor-pointer"
              >
                <RefreshCw className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">Atualizar</span>
              </button>
              <button
                onClick={() => router.push('/admin')}
                className="flex items-center space-x-1.5 text-gray-600 hover:text-primary-600 font-medium transition text-[10px] sm:text-xs"
              >
                <span>Voltar ao Admin</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6 sm:mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Mail className="h-4 w-4 text-primary-600" />
              <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase">Total</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{subscribers.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase">Ativos</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-700">{subscribers.filter(s => s.status === 'active').length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase">Cancelados</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-red-700">{subscribers.filter(s => s.status === 'unsubscribed').length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase">Bounced</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-amber-700">{subscribers.filter(s => s.status === 'bounced').length}</p>
          </div>
        </div>

        {/* Send Newsletter Form */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Send className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
            <span>Enviar Newsletter</span>
          </h2>
          <form onSubmit={handleSendNewsletter} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Assunto</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Novidades da WEHOSTHERE - Novembro 2026"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Conteúdo (HTML)</label>
              <textarea
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Digite o conteúdo da newsletter em HTML..."
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                required
              />
            </div>
            {message && (
              <div className={`p-3 rounded-lg text-sm ${message.includes('sucesso') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {message}
              </div>
            )}
            <button
              type="submit"
              disabled={sending}
              className="w-full sm:w-auto px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg shadow transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>A enviar...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Enviar para {subscribers.filter(s => s.status === 'active').length} subscritores ativos</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Subscribers Table */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Subscritores</h2>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por email ou nome..."
                  className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Todos</option>
                <option value="active">Ativos</option>
                <option value="unsubscribed">Cancelados</option>
                <option value="bounced">Bounced</option>
              </select>
            </div>
          </div>

          {filteredSubscribers.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Nenhum subscritor encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Nome</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Origem</th>
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSubscribers.map((sub) => (
                    <tr key={sub.email} className="hover:bg-gray-50 transition">
                      <td className="py-2.5 px-3 font-mono font-medium text-gray-900">{sub.email}</td>
                      <td className="py-2.5 px-3 text-gray-600">{sub.name || '-'}</td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sub.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                          sub.status === 'unsubscribed' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {sub.status === 'active' ? '✓ Ativo' : sub.status === 'unsubscribed' ? '✗ Cancelado' : '⚠️ Bounced'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-600">{sub.source || 'footer'}</td>
                      <td className="py-2.5 px-3 text-gray-500">
                        {sub.subscribedAt ? new Date(sub.subscribedAt).toLocaleDateString('pt-PT') : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {sub.status === 'active' && (
                          <button
                            onClick={() => handleDeleteSubscriber(sub.email)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                            title="Remover subscritor"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

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
