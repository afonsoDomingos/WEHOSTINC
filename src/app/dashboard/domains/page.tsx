'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Globe, Plus, Copy, CheckCircle, Clock, XCircle,
  ExternalLink, ShieldCheck, AlertTriangle, RefreshCw,
  Server, ArrowRight, Info
} from 'lucide-react';
import { auth, User } from '@/lib/auth';
import { dataManager, Site } from '@/lib/data';
import DashboardNav from '@/components/DashboardNav';

const NS1 = 'ns1.wehosthere.com';
const NS2 = 'ns2.wehosthere.com';

export default function DomainsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) { router.push('/login'); return; }
    setUser(currentUser);
    setSites(dataManager.getSites());
    setLoading(false);
  }, [router]);

  const handleLogout = () => { auth.logout(); router.push('/'); };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const getStatusBadge = (status: Site['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
            <CheckCircle className="h-3 w-3" /><span>Ativo</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="h-3 w-3 text-amber-600 animate-pulse" /><span>Em Processamento</span>
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
            <XCircle className="h-3 w-3" /><span>Suspenso</span>
          </span>
        );
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
    </div>
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav userName={user.name} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar Desktop */}
          <div className="hidden lg:block lg:col-span-1" />

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-5">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 flex items-center space-x-2">
                  <Globe className="h-6 w-6 text-primary-600" />
                  <span>Meus Domínios</span>
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Domínios associados à sua conta — configure DNS e apontamentos
                </p>
              </div>
              <Link
                href="/dashboard/sites"
                className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar Domínio/Site</span>
              </Link>
            </div>

            {/* Lista de Domínios */}
            {sites.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center">
                <Globe className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-500 mb-1">Nenhum domínio registado</h3>
                <p className="text-xs text-gray-400 mb-4">Adicione um site para começar a gerir o seu domínio</p>
                <Link
                  href="/dashboard/sites"
                  className="inline-flex items-center space-x-2 bg-primary-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-primary-700 transition"
                >
                  <Plus className="h-4 w-4" /><span>Adicionar Primeiro Site</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {sites.map((site) => (
                  <div key={site.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Header do domínio */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-gray-100">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-10 h-10 bg-primary-50 border border-primary-100 rounded-xl flex items-center justify-center shrink-0">
                          <Globe className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2 flex-wrap gap-1">
                            <span className="font-extrabold text-gray-900 text-sm sm:text-base truncate">{site.domain}</span>
                            {getStatusBadge(site.status)}
                          </div>
                          <p className="text-xs text-gray-400 truncate">{site.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <a
                          href={`https://${site.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-xs font-semibold text-primary-600 hover:text-primary-800 bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-100 transition"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Visitar</span>
                        </a>
                        <Link
                          href="/dashboard/email"
                          className="inline-flex items-center space-x-1 text-xs font-semibold text-gray-600 hover:text-primary-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 transition"
                        >
                          <span>Email</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>

                    {/* Aviso se o domínio estiver em processamento / aguardando aprovação */}
                    {site.status === 'pending' && (
                      <div className="mx-4 sm:mx-5 mt-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start space-x-2.5">
                        <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <strong className="block font-bold text-amber-950">Domínio em Processamento (Aguardando Aprovação do Administrador):</strong>
                          <span>A nossa equipa técnica está a validar os registos e apontamentos deste domínio. Assim que for aprovado pelo administrador, o estado mudará para Ativo e os serviços ficarão totalmente operacionais.</span>
                        </div>
                      </div>
                    )}

                    {/* Nameservers */}
                    <div className="p-4 sm:p-5 bg-slate-50/60">
                      <div className="flex items-center space-x-2 mb-3">
                        <Server className="h-4 w-4 text-slate-500" />
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Servidores de Nome (Nameservers)</span>
                        {site.status === 'active' ? (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <CheckCircle className="h-3 w-3" /><span>Propagado</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            <RefreshCw className="h-3 w-3 animate-spin" /><span>A propagar...</span>
                          </span>
                        )}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {[NS1, NS2].map((ns, i) => (
                          <div key={ns} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-3 py-2">
                            <div>
                              <span className="text-[10px] text-gray-400 font-semibold block">NS{i + 1}</span>
                              <span className="text-xs font-mono font-bold text-gray-800">{ns}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(ns)}
                              className="text-xs text-primary-600 hover:text-primary-800 font-bold flex items-center space-x-1 shrink-0 ml-2 cursor-pointer"
                            >
                              {copiedText === ns ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                              <span>{copiedText === ns ? 'Copiado' : 'Copiar'}</span>
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-2 flex items-center space-x-1">
                        <Info className="h-3 w-3 shrink-0" />
                        <span>Configure estes nameservers no seu registador de domínio. A propagação pode demorar até 48h.</span>
                      </p>
                    </div>

                    {/* Info adicional */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 sm:p-5 text-xs text-gray-600 border-t border-gray-100">
                      <div>
                        <span className="text-gray-400 block font-medium">Registado em</span>
                        <span className="font-bold text-gray-900">{new Date(site.createdAt).toLocaleDateString('pt-MZ')}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-medium">Armazenamento</span>
                        <span className="font-bold text-gray-900">{site.storage} GB</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-medium">SSL</span>
                        <span className={`font-bold ${site.status === 'active' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {site.status === 'active' ? '✓ Activo' : '⏳ Pendente'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Caixa informativa DNS */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center space-x-2 mb-3">
                <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0" />
                <h3 className="font-bold text-blue-900 text-sm">Como apontar o seu domínio para a WEHOSTHERE</h3>
              </div>
              <ol className="space-y-1.5 text-xs text-blue-800 list-decimal list-inside">
                <li>Aceda ao painel do seu registador de domínio (ex: GoDaddy, Namecheap, Joker.com)</li>
                <li>Vá a <strong>DNS / Nameservers</strong> e escolha <strong>"Usar nameservers personalizados"</strong></li>
                <li>Substitua pelos nossos: <code className="bg-blue-100 px-1 rounded font-mono">ns1.wehosthere.com</code> e <code className="bg-blue-100 px-1 rounded font-mono">ns2.wehosthere.com</code></li>
                <li>Guarde e aguarde até <strong>48 horas</strong> para a propagação completa</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
