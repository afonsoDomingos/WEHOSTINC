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
  Check,
  ExternalLink,
  Zap,
  ShieldCheck,
  HelpCircle,
  Server,
  KeyRound,
  FileCheck,
  Smartphone,
  Laptop
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
  const [isForcingActive, setIsForcingActive] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
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
      setToast({ type: 'error', message: 'Falha ao carregar detalhes do domínio' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCheckDNS = async () => {
    setIsCheckingDNS(true);
    try {
      const response = await fetch(`/api/email-providers/migadu/domains/${domainName}/diagnostics`);
      const data = await response.json();
      if (data.success) {
        setToast({ type: 'success', message: 'Verificação DNS concluída com sucesso!' });
        fetchDomain();
      } else {
        setToast({ type: 'error', message: 'Verificação DNS falhou ou registos ainda não propagados' });
      }
    } catch (error) {
      setToast({ type: 'error', message: 'Falha ao conectar com o verificador DNS' });
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
        if (data.activated) {
          setToast({ type: 'success', message: '✅ Domínio ativado com sucesso! Já pode criar caixas de e-mail.' });
        } else {
          setToast({ type: 'error', message: `⏳ ${data.message || 'DNS ainda não propagado. Aguarde 5-15 min e tente novamente.'}` });
        }
        fetchDomain();
      } else {
        setToast({ type: 'error', message: data.error || 'Falha ao ativar domínio' });
      }
    } catch (error) {
      setToast({ type: 'error', message: 'Falha na requisição de ativação' });
    } finally {
      setIsActivating(false);
    }
  };

  const handleForceActive = async () => {
    if (!confirm(`Tem certeza que quer marcar ${domainName} como ATIVO sem verificação DNS? Use apenas se você já confirmou que o DNS está correto no seu provedor.`)) return;
    setIsForcingActive(true);
    try {
      const response = await fetch(`/api/email-providers/migadu/domains/${domainName}/diagnostics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceActive: true })
      });
      const data = await response.json();
      if (data.success) {
        setToast({ type: 'success', message: `${domainName} marcado como ATIVO com sucesso!` });
        fetchDomain();
      } else {
        setToast({ type: 'error', message: data.error || 'Falha ao ativar' });
      }
    } catch (error) {
      setToast({ type: 'error', message: 'Erro ao forçar ativação' });
    } finally {
      setIsForcingActive(false);
    }
  };

  const getDNSStatusBadge = (status?: string) => {
    switch (status) {
      case 'correct':
      case 'passed':
      case 'ok':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Configurado</span>
          </span>
        );
      case 'incorrect':
      case 'missing':
      case 'failed':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <XCircle className="h-3.5 w-3.5" />
            <span>Pendente</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="h-3.5 w-3.5" />
            <span>Aguardando</span>
          </span>
        );
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-200 max-w-md w-full">
          <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Domínio não encontrado</h2>
          <p className="text-gray-500 text-sm mb-6">Não foi possível carregar as informações do domínio {domainName}.</p>
          <Link
            href="/admin/email-domains"
            className="inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium transition"
          >
            Voltar aos Domínios
          </Link>
        </div>
      </div>
    );
  }

  // Extract verification record if present in dnsRecords
  const foundVerifyRecord = domain.dnsRecords?.find(r => r.value && r.value.includes('hosted-email-verify'));
  const verifyRecord = {
    type: 'TXT',
    name: '@',
    value: foundVerifyRecord ? foundVerifyRecord.value : (domainName === 'abnafrobiznetwork.com' ? 'hosted-email-verify=rjmjxiun' : 'hosted-email-verify=...')
  };

  // Pre-formatted records if API returns generic or empty
  const mxRecords = [
    { type: 'MX', name: '@', priority: 10, value: 'aspmx1.migadu.com.' },
    { type: 'MX', name: '@', priority: 20, value: 'aspmx2.migadu.com.' },
  ];

  const spfRecord = {
    type: 'TXT',
    name: '@',
    value: 'v=spf1 include:spf.migadu.com ~all'
  };

  const dmarcRecord = {
    type: 'TXT',
    name: '_dmarc',
    value: 'v=DMARC1; p=none;'
  };

  const dkimRecords = [
    { type: 'CNAME', name: 'key1._domainkey', value: `key1.${domainName}._domainkey.migadu.com.` },
    { type: 'CNAME', name: 'key2._domainkey', value: `key2.${domainName}._domainkey.migadu.com.` },
    { type: 'CNAME', name: 'key3._domainkey', value: `key3.${domainName}._domainkey.migadu.com.` },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 pb-16">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/email-domains"
                className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-900 transition"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-black text-gray-900 tracking-tight">{domain.domainName}</h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    domain.status === 'active' 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {domain.status === 'active' ? 'Ativo / Active' : 'Pendente DNS'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 font-medium">
                  Configuração de DNS e Autenticação de E-mail
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2.5">
              <button
                onClick={handleCheckDNS}
                disabled={isCheckingDNS}
                className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-50 transition shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 text-primary-600 ${isCheckingDNS ? 'animate-spin' : ''}`} />
                <span>{isCheckingDNS ? 'A verificar DNS...' : 'Verificar DNS'}</span>
              </button>
              
              {domain.status !== 'active' && (
                <>
                  <button
                    onClick={handleActivateDomain}
                    disabled={isActivating}
                    className="flex items-center space-x-2 bg-emerald-600 text-white font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition shadow-xs disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>{isActivating ? 'A ativar...' : 'Ativar Domínio'}</span>
                  </button>
                  <button
                    onClick={handleForceActive}
                    disabled={isForcingActive}
                    title="Forçar ativação manual caso o DNS já esteja correto no provedor"
                    className="flex items-center space-x-1.5 bg-amber-500 text-white font-semibold text-sm px-3.5 py-2.5 rounded-xl hover:bg-amber-600 transition shadow-xs disabled:opacity-50"
                  >
                    <Zap className="h-4 w-4" />
                    <span>{isForcingActive ? '...' : 'Forçar Ativo'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Banner Didático de Instruções */}
        <div className="bg-gradient-to-r from-primary-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-3">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-md">
              <HelpCircle className="h-3.5 w-3.5 text-primary-200" />
              <span>Instruções Passo a Passo para Leigos</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Como configurar o DNS do seu domínio em 4 passos simples
            </h2>
            <p className="text-primary-100 text-sm leading-relaxed">
              Aceda ao painel onde comprou o domínio (ex: <strong>TurboHost</strong>, <strong>cPanel</strong>, <strong>Cloudflare</strong> ou <strong>Namecheap</strong>), vá até a seção <strong>Zona DNS / Editor DNS</strong> e copie exatamente os valores abaixo em sequência:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* DNS Steps (Col 1 & 2) */}
          <div className="lg:col-span-2 space-y-6">

            {/* PASSO 0: REGISTO DE VERIFICAÇÃO */}
            <div className="bg-white rounded-2xl shadow-xs border border-blue-200 p-6 space-y-4 ring-2 ring-blue-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm">
                    ★
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                      <span>Passo Essencial: Registo de Verificação TXT</span>
                    </h3>
                    <p className="text-xs text-gray-500">
                      Vincula este domínio à sua conta Migadu para autorizar a ativação.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-blue-700 text-white text-[11px] font-bold rounded-md">
                    {verifyRecord.type}
                  </span>
                  <span className="text-xs font-bold text-blue-900">
                    Obrigatório para Ativação
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="sm:col-span-1">
                    <span className="text-gray-400 block font-medium mb-1">Nome / Host:</span>
                    <div className="flex items-center justify-between bg-white border border-gray-200 px-3 py-2 rounded-lg font-mono text-gray-800">
                      <span>{verifyRecord.name}</span>
                      <button
                        onClick={() => handleCopy(verifyRecord.name, 'verify_name')}
                        className="text-gray-400 hover:text-gray-700"
                        title="Copiar Nome"
                      >
                        {copiedKey === 'verify_name' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-gray-400 block font-medium mb-1">Valor / Conteúdo TXT:</span>
                    <div className="flex items-center justify-between bg-white border border-gray-200 px-3 py-2 rounded-lg font-mono text-gray-800">
                      <span className="truncate mr-2 font-bold text-blue-900">{verifyRecord.value}</span>
                      <button
                        onClick={() => handleCopy(verifyRecord.value, 'verify_val')}
                        className="text-gray-400 hover:text-gray-700 shrink-0"
                        title="Copiar Valor"
                      >
                        {copiedKey === 'verify_val' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PASSO 1: REGISTOS MX */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-xl bg-primary-100 text-primary-700 font-black flex items-center justify-center text-sm">
                    1
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                      <span>Passo 1: Registos MX (Recebimento de E-mails)</span>
                    </h3>
                    <p className="text-xs text-gray-500">
                      Diz para onde os e-mails enviados para <strong>@{domainName}</strong> devem ser entregues.
                    </p>
                  </div>
                </div>
                {getDNSStatusBadge(domain.diagnostics?.mx?.status)}
              </div>

              <div className="space-y-3">
                {mxRecords.map((rec, idx) => (
                  <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-primary-700 text-white text-[11px] font-bold rounded-md">
                          {rec.type}
                        </span>
                        <span className="text-xs font-semibold text-gray-700">
                          Prioridade: <strong className="text-primary-600">{rec.priority}</strong>
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400 block font-medium mb-1">Nome / Host:</span>
                        <div className="flex items-center justify-between bg-white border border-gray-200 px-3 py-2 rounded-lg font-mono text-gray-800">
                          <span>{rec.name}</span>
                          <button
                            onClick={() => handleCopy(rec.name, `mx_name_${idx}`)}
                            className="text-gray-400 hover:text-gray-700"
                            title="Copiar Nome"
                          >
                            {copiedKey === `mx_name_${idx}` ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-medium mb-1">Valor / Destino:</span>
                        <div className="flex items-center justify-between bg-white border border-gray-200 px-3 py-2 rounded-lg font-mono text-gray-800">
                          <span className="truncate mr-2">{rec.value}</span>
                          <button
                            onClick={() => handleCopy(rec.value, `mx_val_${idx}`)}
                            className="text-gray-400 hover:text-gray-700 shrink-0"
                            title="Copiar Valor"
                          >
                            {copiedKey === `mx_val_${idx}` ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PASSO 2: REGISTO SPF */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-700 font-black flex items-center justify-center text-sm">
                    2
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      Passo 2: Registo SPF (Autorização de Envio TXT)
                    </h3>
                    <p className="text-xs text-gray-500">
                      Autoriza o envio de e-mails em nome do seu domínio para evitar cair no SPAM.
                    </p>
                  </div>
                </div>
                {getDNSStatusBadge(domain.diagnostics?.spf?.status)}
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-emerald-600 text-white text-[11px] font-bold rounded-md">
                    {spfRecord.type}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="sm:col-span-1">
                    <span className="text-gray-400 block font-medium mb-1">Nome / Host:</span>
                    <div className="flex items-center justify-between bg-white border border-gray-200 px-3 py-2 rounded-lg font-mono text-gray-800">
                      <span>{spfRecord.name}</span>
                      <button
                        onClick={() => handleCopy(spfRecord.name, 'spf_name')}
                        className="text-gray-400 hover:text-gray-700"
                        title="Copiar Nome"
                      >
                        {copiedKey === 'spf_name' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-gray-400 block font-medium mb-1">Valor / Conteúdo TXT:</span>
                    <div className="flex items-center justify-between bg-white border border-gray-200 px-3 py-2 rounded-lg font-mono text-gray-800">
                      <span className="truncate mr-2">{spfRecord.value}</span>
                      <button
                        onClick={() => handleCopy(spfRecord.value, 'spf_val')}
                        className="text-gray-400 hover:text-gray-700 shrink-0"
                        title="Copiar Valor"
                      >
                        {copiedKey === 'spf_val' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PASSO 3: REGISTO DMARC */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-xl bg-purple-100 text-purple-700 font-black flex items-center justify-center text-sm">
                    3
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      Passo 3: Registo DMARC (Proteção Anti-Fraude TXT)
                    </h3>
                    <p className="text-xs text-gray-500">
                      Protege o domínio contra golpistas tentando falsificar o seu e-mail.
                    </p>
                  </div>
                </div>
                {getDNSStatusBadge(domain.diagnostics?.dmarc?.status)}
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-purple-600 text-white text-[11px] font-bold rounded-md">
                    {dmarcRecord.type}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="sm:col-span-1">
                    <span className="text-gray-400 block font-medium mb-1">Nome / Host:</span>
                    <div className="flex items-center justify-between bg-white border border-gray-200 px-3 py-2 rounded-lg font-mono text-gray-800">
                      <span>{dmarcRecord.name}</span>
                      <button
                        onClick={() => handleCopy(dmarcRecord.name, 'dmarc_name')}
                        className="text-gray-400 hover:text-gray-700"
                        title="Copiar Nome"
                      >
                        {copiedKey === 'dmarc_name' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-gray-400 block font-medium mb-1">Valor / Conteúdo TXT:</span>
                    <div className="flex items-center justify-between bg-white border border-gray-200 px-3 py-2 rounded-lg font-mono text-gray-800">
                      <span className="truncate mr-2">{dmarcRecord.value}</span>
                      <button
                        onClick={() => handleCopy(dmarcRecord.value, 'dmarc_val')}
                        className="text-gray-400 hover:text-gray-700 shrink-0"
                        title="Copiar Valor"
                      >
                        {copiedKey === 'dmarc_val' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PASSO 4: REGISTOS DKIM */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-xl bg-amber-100 text-amber-800 font-black flex items-center justify-center text-sm">
                    4
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      Passo 4: Registos DKIM (Assinaturas Criptográficas)
                    </h3>
                    <p className="text-xs text-gray-500">
                      3 Chaves CNAME para garantir que o e-mail não foi adulterado no caminho.
                    </p>
                  </div>
                </div>
                {getDNSStatusBadge(domain.diagnostics?.dkim?.status)}
              </div>

              <div className="space-y-3">
                {dkimRecords.map((rec, idx) => (
                  <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2.5">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 bg-amber-600 text-white text-[11px] font-bold rounded-md">
                        {rec.type}
                      </span>
                      <span className="text-xs font-semibold text-gray-700">
                        Chave {idx + 1}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div className="sm:col-span-1">
                        <span className="text-gray-400 block font-medium mb-1">Nome / Host:</span>
                        <div className="flex items-center justify-between bg-white border border-gray-200 px-3 py-2 rounded-lg font-mono text-gray-800">
                          <span className="truncate mr-2">{rec.name}</span>
                          <button
                            onClick={() => handleCopy(rec.name, `dkim_name_${idx}`)}
                            className="text-gray-400 hover:text-gray-700 shrink-0"
                            title="Copiar Nome"
                          >
                            {copiedKey === `dkim_name_${idx}` ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-gray-400 block font-medium mb-1">Valor / Destino CNAME:</span>
                        <div className="flex items-center justify-between bg-white border border-gray-200 px-3 py-2 rounded-lg font-mono text-gray-800">
                          <span className="truncate mr-2">{rec.value}</span>
                          <button
                            onClick={() => handleCopy(rec.value, `dkim_val_${idx}`)}
                            className="text-gray-400 hover:text-gray-700 shrink-0"
                            title="Copiar Valor"
                          >
                            {copiedKey === `dkim_val_${idx}` ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Sidebar (Col 3) */}
          <div className="space-y-6">

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 space-y-3">
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
                Ações Rápidas
              </h3>
              <div className="space-y-2">
                <Link
                  href={`/admin/email-domains/${domainName}/mailboxes`}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 hover:bg-primary-50 hover:text-primary-700 text-gray-700 font-semibold text-sm transition border border-gray-200 hover:border-primary-200"
                >
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-primary-600" />
                    <span>Gerenciar Caixas de E-mail</span>
                  </div>
                  <span className="text-xs bg-white px-2 py-0.5 rounded-md border border-gray-200 font-bold">
                    Abrir
                  </span>
                </Link>

                <Link
                  href={`/admin/email-domains/${domainName}/mailboxes`}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50/70 hover:bg-blue-100 hover:text-blue-900 text-blue-800 font-semibold text-sm transition border border-blue-200"
                >
                  <div className="flex items-center space-x-3">
                    <Smartphone className="h-5 w-5 text-blue-600" />
                    <span>Conectar Outlook & Apps</span>
                  </div>
                  <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-md font-bold">
                    Guia
                  </span>
                </Link>

                <a
                  href="https://migadu.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-sm transition border border-gray-200"
                >
                  <div className="flex items-center space-x-3">
                    <ExternalLink className="h-5 w-5 text-gray-500" />
                    <span>Painel Migadu</span>
                  </div>
                </a>
              </div>
            </div>

            {/* Status Card */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 space-y-4">
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
                Status do Domínio
              </h3>
              
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">Estado DNS:</span>
                  <span className="font-bold text-gray-900 capitalize">{domain.status.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">Pode Enviar:</span>
                  <span className={`font-bold ${domain.canSend ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {domain.canSend ? 'Sim (Ativado)' : 'Pendente DNS'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">Pode Receber:</span>
                  <span className={`font-bold ${domain.canReceive ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {domain.canReceive ? 'Sim (Ativado)' : 'Pendente DNS'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-500 font-medium">Provedor:</span>
                  <span className="font-bold text-primary-600 uppercase">Migadu Cloud</span>
                </div>
              </div>
            </div>

            {/* Dica TurboHost */}
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 space-y-2 text-xs text-amber-900">
              <div className="flex items-center space-x-2 font-bold text-amber-900">
                <ShieldCheck className="h-4 w-4 text-amber-600" />
                <span>Dica para a TurboHost</span>
              </div>
              <p className="leading-relaxed text-amber-800">
                Se já existirem registos <strong>MX</strong> antigos apontando para outro servidor, apague-os antes de salvar para evitar conflitos na entrega de mensagens.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Toast Feedback */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-xl ${
          toast.type === 'success' ? 'bg-gray-900 text-white border border-gray-800' : 'bg-red-600 text-white'
        } text-sm font-semibold flex items-center space-x-2 animate-bounce`}>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
