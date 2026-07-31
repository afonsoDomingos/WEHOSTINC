'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Globe, Plus, Trash2, Settings, CheckCircle, Clock, XCircle,
  LayoutDashboard, Mail, Database, Settings as SettingsIcon, LogOut, Server, Sparkles, ArrowRight
} from 'lucide-react';
import { auth, User } from '@/lib/auth';
import { dataManager, Site } from '@/lib/data';
import DashboardNav from '@/components/DashboardNav';

export default function SitesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteDomain, setNewSiteDomain] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    setSites(dataManager.getSites());
    setLoading(false);
  }, [router]);

  const handleAddSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteName || !newSiteDomain) return;

    const newSite = dataManager.addSite({
      name: newSiteName,
      domain: newSiteDomain,
      status: 'pending',
      storage: 0,
      bandwidth: 0
    });

    setSites([...sites, newSite]);
    setShowModal(false);
    setNewSiteName('');
    setNewSiteDomain('');
  };

  const handleDeleteSite = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este site?')) {
      dataManager.deleteSite(id);
      setSites(sites.filter(s => s.id !== id));
    }
  };

  const [copiedNS, setCopiedNS] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopiedNS(text);
      setTimeout(() => setCopiedNS(null), 2500);
    }
  };

  const getStatusIcon = (status: Site['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'suspended':
        return <XCircle className="h-5 w-5 text-red-500" />;
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
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
                  className="flex items-center space-x-3 px-4 py-3 bg-primary-50 text-primary-700 rounded-lg font-medium"
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
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition font-medium"
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
            {/* Banner de Promoção */}
            <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 rounded-xl shadow-md p-4 sm:p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="inline-flex items-center space-x-1.5 bg-amber-900/30 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-amber-100">
                  <Sparkles className="h-3.5 w-3.5 shrink-0" />
                  <span>Criação de Sites Chave na Mão</span>
                </div>
                <h2 className="text-lg sm:text-2xl font-extrabold text-white leading-tight">Precisa de um site profissional para o seu negócio?</h2>
                <p className="text-amber-100 text-xs sm:text-sm">Escolha entre 18 categorias (Landing Page, Loja Virtual, ERP, SaaS, etc.) a partir de 12.000 MT.</p>
              </div>
              <Link
                href="/site-quote"
                className="flex items-center space-x-2 bg-white text-gray-900 hover:bg-gray-100 font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow transition whitespace-nowrap cursor-pointer shrink-0 self-start sm:self-auto"
              >
                <span>Consultar &amp; Solicitar</span>
                <ArrowRight className="h-4 w-4 text-amber-600" />
              </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Meus Sites</h1>
                  <p className="text-xs text-gray-500 mt-0.5">Sites e domínios associados à sua conta de hospedagem</p>
                </div>
                <div className="flex items-center space-x-2 flex-wrap gap-2">
                  <Link
                    href="/site-quote"
                    className="flex items-center space-x-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs px-3.5 py-2 rounded-lg transition"
                  >
                    <Sparkles className="h-4 w-4 text-amber-600" />
                    <span>Solicitar Criação</span>
                  </Link>
                  <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center space-x-1.5 bg-primary-600 text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-primary-700 transition"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Adicionar Site</span>
                  </button>
                </div>
              </div>

              {sites.length === 0 ? (
                <div className="text-center py-12">
                  <Globe className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum site configurado</h3>
                  <p className="text-gray-600 mb-4 text-sm">Adicione um site já existente ou solicite a criação de um novo site profissional</p>
                  <div className="flex items-center justify-center space-x-3">
                    <Link
                      href="/site-quote"
                      className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2.5 rounded-lg shadow transition text-sm"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Solicitar Criação de Site</span>
                    </Link>
                    <button
                      onClick={() => setShowModal(true)}
                      className="flex items-center space-x-2 bg-primary-600 text-white font-bold px-5 py-2.5 rounded-lg hover:bg-primary-700 transition text-sm"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Adicionar Site</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {sites.map((site) => (
                    <div key={site.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="bg-primary-100 p-3 rounded-lg">
                            <Globe className="h-6 w-6 text-primary-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{site.name}</h3>
                            <p className="text-sm text-gray-600">{site.domain}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(site.status)}
                            <span className="text-sm text-gray-600">{getStatusText(site.status)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="p-2 text-gray-600 hover:text-primary-600 transition">
                              <Settings className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSite(site.id)}
                              className="p-2 text-gray-600 hover:text-red-600 transition"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Armazenamento</p>
                          <p className="font-semibold text-gray-900">{site.storage} GB</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Tráfego</p>
                          <p className="font-semibold text-gray-900">{site.bandwidth} GB</p>
                        </div>
                      </div>

                      {site.status === 'pending' && (
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-amber-600 flex-shrink-0 animate-pulse" />
                          <span>
                            <strong>Registo de Domínio em Processamento:</strong> A equipe WEHOSTHERE está a configurar os servidores de nomes para activar este domínio.
                          </span>
                        </div>
                      )}

                      {/* Caixa de Apontamento DNS / Name Servers */}
                      <div className="mt-3 pt-3 border-t border-gray-100 bg-gray-50/80 p-3 rounded-xl border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center space-x-1">
                            <Server className="h-3.5 w-3.5 text-primary-600" />
                            <span>Servidores de Nomes da WEHOSTHERE (DNS Pointers)</span>
                          </span>
                          <span className="text-[10px] text-gray-500 font-medium">Use na CIUEM ou Namecheap</span>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-2">
                          <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-mono">
                            <span className="text-gray-800 font-bold">ns1.wehosthere.com</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard('ns1.wehosthere.com')}
                              className="text-primary-600 hover:text-primary-700 font-sans text-[11px] font-bold px-2 py-0.5 rounded bg-primary-50 hover:bg-primary-100 transition cursor-pointer"
                            >
                              {copiedNS === 'ns1.wehosthere.com' ? 'Copiado ✓' : 'Copiar'}
                            </button>
                          </div>
                          <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-mono">
                            <span className="text-gray-800 font-bold">ns2.wehosthere.com</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard('ns2.wehosthere.com')}
                              className="text-primary-600 hover:text-primary-700 font-sans text-[11px] font-bold px-2 py-0.5 rounded bg-primary-50 hover:bg-primary-100 transition cursor-pointer"
                            >
                              {copiedNS === 'ns2.wehosthere.com' ? 'Copiado ✓' : 'Copiar'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Adicionar Novo Site</h2>
            <form onSubmit={handleAddSite} className="space-y-4">
              <div>
                <label htmlFor="siteName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Site
                </label>
                <input
                  id="siteName"
                  type="text"
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="Meu Site Incrível"
                  required
                />
              </div>
              <div>
                <label htmlFor="siteDomain" className="block text-sm font-medium text-gray-700 mb-2">
                  Domínio
                </label>
                <input
                  id="siteDomain"
                  type="text"
                  value={newSiteDomain}
                  onChange={(e) => setNewSiteDomain(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="meusite.com"
                  required
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
