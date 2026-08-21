'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Shuffle, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Mail, 
  ArrowRight, 
  Sparkles, 
  Copy, 
  Check, 
  Info, 
  X,
  Send
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface EmailAliasItem {
  _id: string;
  domain: string;
  alias: string;
  destination: string;
  type: string;
  status: string;
  createdAt: string;
}

export default function DomainAliasesPage() {
  const params = useParams();
  const domainName = params.domain as string;

  const [aliases, setAliases] = useState<EmailAliasItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [newAlias, setNewAlias] = useState('');
  const [newDestination, setNewDestination] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchAliases();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainName]);

  const fetchAliases = async () => {
    try {
      const res = await fetch(`/api/email-providers/migadu/domains/${domainName}/aliases`);
      const data = await res.json();
      if (data.success) {
        setAliases(data.aliases || []);
      }
    } catch (err) {
      console.error('Failed to fetch aliases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlias = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const res = await fetch(`/api/email-providers/migadu/domains/${domainName}/aliases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alias: newAlias,
          destination: newDestination
        })
      });

      const data = await res.json();
      if (data.success) {
        setToast({ type: 'success', message: 'Pseudónimo criado com sucesso!' });
        setShowCreateModal(false);
        setNewAlias('');
        setNewDestination('');
        fetchAliases();
      } else {
        setToast({ type: 'error', message: data.error || 'Falha ao criar pseudónimo' });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Erro ao criar pseudónimo' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteAlias = async (alias: string, destination: string) => {
    if (!confirm(`Tem certeza que deseja remover o pseudónimo ${alias}@${domainName}?`)) return;

    try {
      const res = await fetch(
        `/api/email-providers/migadu/domains/${domainName}/aliases?alias=${encodeURIComponent(alias)}&destination=${encodeURIComponent(destination)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (data.success) {
        setToast({ type: 'success', message: 'Pseudónimo removido com sucesso!' });
        fetchAliases();
      } else {
        setToast({ type: 'error', message: data.error || 'Falha ao remover' });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Erro ao remover pseudónimo' });
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const filteredAliases = aliases.filter(a => 
    a.alias.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50/50 pb-16">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href={`/admin/email-domains/${domainName}`}
                className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-900 transition"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold text-gray-900">Pseudónimos &amp; Redirecionamentos</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                    {aliases.length} {aliases.length === 1 ? 'alias' : 'aliases'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Criar endereços virtuais como vendas@{domainName} que entregam na sua caixa principal</p>
              </div>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Adicionar Pseudónimo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Hero Explanation Banner */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-gray-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-2.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-white backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-purple-300" />
              <span>Economize Caixas e Centralize Mensagens</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              O que são Pseudónimos (Aliases)?
            </h2>
            <p className="text-purple-100 text-xs sm:text-sm leading-relaxed">
              Um pseudónimo é um endereço de e-mail virtual. Por exemplo, pode criar <strong>vendas@{domainName}</strong>, <strong>suporte@{domainName}</strong> e <strong>financeiro@{domainName}</strong> e fazer com que todos cheguem à mesma caixa <strong>info@{domainName}</strong> ou ao seu e-mail pessoal.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar pseudónimos ou destinatários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Aliases List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-200">
            <RefreshCw className="h-8 w-8 text-purple-600 animate-spin mb-3" />
            <p className="text-sm font-medium text-gray-500">Carregando pseudónimos...</p>
          </div>
        ) : filteredAliases.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-12 text-center space-y-4">
            <div className="h-16 w-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto text-purple-600 border border-purple-100">
              <Shuffle className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Nenhum pseudónimo configurado</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Crie pseudónimos como <code>comercial@{domainName}</code> ou <code>geral@{domainName}</code> que redirecionam para a sua caixa principal.
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Criar Primeiro Pseudónimo</span>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50/75 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5 text-left">Endereço Virtual (Alias)</th>
                  <th className="px-6 py-3.5 text-center">Encaminha Para</th>
                  <th className="px-6 py-3.5 text-left">Destino Real</th>
                  <th className="px-6 py-3.5 text-left">Estado</th>
                  <th className="px-6 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredAliases.map((item) => (
                  <tr key={item._id} className="hover:bg-purple-50/20 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2.5 font-bold text-gray-900">
                        <span className="font-mono text-purple-700">{item.alias}@{domainName}</span>
                        <button
                          onClick={() => copyToClipboard(`${item.alias}@${domainName}`, `alias_${item._id}`)}
                          className="p-1 text-gray-400 hover:text-gray-700 rounded"
                          title="Copiar"
                        >
                          {copiedKey === `alias_${item._id}` ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-center text-gray-400">
                      <ArrowRight className="h-4 w-4 mx-auto text-purple-400" />
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-700">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="font-mono text-xs">{item.destination}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        Ativo
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleDeleteAlias(item.alias, item.destination)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                        title="Eliminar Pseudónimo"
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

      </div>

      {/* CREATE ALIAS MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-purple-900 to-gray-900 text-white p-6 relative flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">Criar Pseudónimo / Redirecionamento</h2>
                <p className="text-xs text-purple-200 mt-1">Domínio: <strong>@{domainName}</strong></p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAlias} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Endereço do Pseudónimo (Alias)
                </label>
                <div className="flex rounded-xl overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent">
                  <input
                    type="text"
                    value={newAlias}
                    onChange={(e) => setNewAlias(e.target.value.replace(/@.*/, '').toLowerCase())}
                    placeholder="vendas, suporte, comercial"
                    required
                    className="flex-1 px-3.5 py-2.5 text-sm focus:outline-none"
                  />
                  <span className="px-3.5 py-2.5 bg-gray-100 text-gray-600 text-sm font-semibold border-l border-gray-300 flex items-center">
                    @{domainName}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">Digite apenas o prefixo desejado</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Entregar Para (Destino Real)
                </label>
                <input
                  type="email"
                  value={newDestination}
                  onChange={(e) => setNewDestination(e.target.value.toLowerCase())}
                  placeholder={`info@${domainName} ou seu-email@gmail.com`}
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-[11px] text-gray-500 mt-1">Pode ser uma caixa no mesmo domínio ou qualquer e-mail externo</p>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-700 font-semibold text-xs transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition disabled:opacity-50 shadow-sm"
                >
                  {isCreating ? 'Criando...' : 'Salvar Pseudónimo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-xl font-medium text-sm flex items-center space-x-2 ${
          toast.type === 'success' ? 'bg-gray-900 text-white border border-gray-800' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-white" />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
