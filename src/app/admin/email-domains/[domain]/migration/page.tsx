'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  DownloadCloud, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Server, 
  Lock, 
  Mail, 
  FolderArchive, 
  ShieldCheck, 
  AlertCircle,
  Play,
  Terminal,
  Clock,
  Sparkles,
  HelpCircle,
  ExternalLink,
  Info,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function DomainEmailMigrationPage() {
  const params = useParams();
  const domainName = params.domain as string;

  // Form states
  const [sourceHost, setSourceHost] = useState('');
  const [sourcePort, setSourcePort] = useState(993);
  const [sourceSecure, setSourceSecure] = useState(true);
  const [sourceEmail, setSourceEmail] = useState('');
  const [sourcePassword, setSourcePassword] = useState('');

  const [targetEmail, setTargetEmail] = useState('');
  const [targetPassword, setTargetPassword] = useState('');

  // Execution states
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; folders?: string[]; inboxMessages?: number } | null>(null);
  
  const [isStarting, setIsStarting] = useState(false);
  const [activeMigrationId, setActiveMigrationId] = useState<string | null>(null);
  const [activeMigration, setActiveMigration] = useState<any | null>(null);
  const [recentMigrations, setRecentMigrations] = useState<any[]>([]);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchRecentMigrations();
    // Default source host suggestion based on domain
    if (domainName) {
      setSourceHost(`mail.${domainName}`);
      setSourceEmail(`info@${domainName}`);
      setTargetEmail(`info@${domainName}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainName]);

  // Polling active migration
  useEffect(() => {
    if (!activeMigrationId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/webmail/migrate?id=${activeMigrationId}`);
        const data = await res.json();
        if (data.success && data.migration) {
          setActiveMigration(data.migration);
          if (data.migration.status === 'completed' || data.migration.status === 'failed') {
            fetchRecentMigrations();
            if (data.migration.status === 'completed') {
              setToast({ type: 'success', message: 'Migração de e-mails concluída com sucesso!' });
            } else {
              setToast({ type: 'error', message: data.migration.errorMessage || 'Falha durante a migração' });
            }
          }
        }
      } catch (e) {
        console.error('Error polling migration:', e);
      }
    }, 2500);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMigrationId]);

  const fetchRecentMigrations = async () => {
    try {
      const res = await fetch(`/api/webmail/migrate?domain=${domainName}`);
      const data = await res.json();
      if (data.success) {
        setRecentMigrations(data.migrations || []);
      }
    } catch {}
  };

  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/webmail/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          domain: domainName,
          sourceHost,
          sourcePort,
          sourceSecure,
          sourceEmail,
          sourcePassword
        })
      });

      const data = await res.json();
      if (data.success) {
        setTestResult(data);
        setToast({ type: 'success', message: 'Servidor antigo acessado com sucesso!' });
      } else {
        setTestResult({ success: false, message: data.error || 'Falha ao conectar' });
        setToast({ type: 'error', message: data.error || 'Falha na conexão' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: 'Erro de comunicação ao testar conexão' });
      setToast({ type: 'error', message: 'Erro ao testar conexão' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleStartMigration = async () => {
    if (!targetEmail || !targetPassword) {
      setToast({ type: 'error', message: 'Informe a senha da caixa de destino na WEHOSTHERE' });
      return;
    }

    setIsStarting(true);
    try {
      const res = await fetch('/api/webmail/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          domain: domainName,
          sourceHost,
          sourcePort,
          sourceSecure,
          sourceEmail,
          sourcePassword,
          targetEmail,
          targetPassword
        })
      });

      const data = await res.json();
      if (data.success && data.migrationId) {
        setActiveMigrationId(data.migrationId);
        setToast({ type: 'success', message: 'Migração iniciada com sucesso!' });
      } else {
        setToast({ type: 'error', message: data.error || 'Falha ao iniciar migração' });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Erro ao iniciar migração' });
    } finally {
      setIsStarting(false);
    }
  };

  const calculateProgressPercent = () => {
    if (!activeMigration || !activeMigration.totalMessages) return 5;
    const pct = Math.round((activeMigration.migratedMessages / activeMigration.totalMessages) * 100);
    return Math.min(Math.max(pct, 5), 100);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-16">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-xs mb-3">
            <Link
              href="/admin/email-domains"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 rounded-xl font-bold transition cursor-pointer"
              title="Voltar à lista de domínios"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Domínios</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
            <Link href={`/admin/email-domains/${domainName}`} className="text-gray-500 hover:text-gray-900 font-medium transition">{domainName}</Link>
            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-gray-900 font-bold">Migração IMAP</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-gray-900">Migração de E-mails IMAP</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                  Importador
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Trazer histórico de mensagens antigas da cPanel / TurboHost para {domainName}</p>
            </div>

            <Link
              href={`/admin/email-domains/${domainName}/mailboxes`}
              className="inline-flex items-center space-x-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3.5 py-2 rounded-xl text-xs transition cursor-pointer"
            >
              <Mail className="h-4 w-4 text-primary-600" />
              <span>Ver Caixas</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Hero Explanation Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-primary-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-2.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-white backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-blue-300" />
              <span>Transferência Direta IMAP-to-IMAP</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Traga todos os seus e-mails antigos sem perder nada
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
              O nosso importador conecta diretamente ao seu provedor antigo (ex: <strong>TurboHost</strong>, <strong>cPanel</strong>, <strong>Gmail</strong> ou <strong>Hostinger</strong>), copia todas as pastas (Caixa de Entrada, Enviados, Rascunhos) e injeta nas novas caixas na velocidade máxima.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column: Form (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">

            {/* STEP 1: DADOS DO PROVEDOR ANTIGO */}
            <div className="bg-white rounded-3xl shadow-xs border border-gray-200 p-6 space-y-5">
              <div className="flex items-center space-x-3 border-b border-gray-100 pb-4">
                <div className="h-9 w-9 rounded-2xl bg-blue-50 text-blue-600 font-black flex items-center justify-center text-sm border border-blue-100">
                  1
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Provedor Antigo (De Onde Copiar)</h3>
                  <p className="text-xs text-gray-500">Insira os dados de acesso do servidor de e-mail anterior</p>
                </div>
              </div>

              <form onSubmit={handleTestConnection} className="space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Servidor IMAP Antigo (Host)
                    </label>
                    <input
                      type="text"
                      value={sourceHost}
                      onChange={(e) => setSourceHost(e.target.value)}
                      placeholder="mail.seudominio.com ou imap.provedor.com"
                      required
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Porta &amp; SSL
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={sourcePort}
                        onChange={(e) => setSourcePort(Number(e.target.value))}
                        className="w-20 px-3 py-2.5 border border-gray-300 rounded-xl text-sm font-mono"
                      />
                      <label className="flex items-center space-x-1.5 text-xs text-gray-600 font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sourceSecure}
                          onChange={(e) => setSourceSecure(e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <span>SSL/TLS</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      E-mail Antigo
                    </label>
                    <input
                      type="email"
                      value={sourceEmail}
                      onChange={(e) => setSourceEmail(e.target.value)}
                      placeholder="info@seudominio.com"
                      required
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Senha Antiga
                    </label>
                    <input
                      type="password"
                      value={sourcePassword}
                      onChange={(e) => setSourcePassword(e.target.value)}
                      placeholder="Senha do e-mail antigo"
                      required
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-gray-500 flex items-center space-x-1">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>Conexão criptografada ponto-a-ponto</span>
                  </span>

                  <button
                    type="submit"
                    disabled={isTesting}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition disabled:opacity-50 shadow-xs"
                  >
                    {isTesting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    <span>{isTesting ? 'Testando Conexão...' : 'Testar Conexão Antiga'}</span>
                  </button>
                </div>
              </form>

              {/* Test Result Feedback */}
              {testResult && (
                <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
                  testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
                }`}>
                  <div className="flex items-center space-x-2 font-bold">
                    {testResult.success ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
                    <span>{testResult.message}</span>
                  </div>

                  {testResult.success && testResult.folders && (
                    <div className="pt-2 border-t border-emerald-200 space-y-1">
                      <div>• <strong>Mensagens na Caixa de Entrada:</strong> ~{testResult.inboxMessages || 0} e-mails</div>
                      <div>• <strong>Pastas encontradas:</strong> {testResult.folders.join(', ')}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* STEP 2: CAIXA DE DESTINO NA WEHOSTHERE */}
            <div className="bg-white rounded-3xl shadow-xs border border-gray-200 p-6 space-y-5">
              <div className="flex items-center space-x-3 border-b border-gray-100 pb-4">
                <div className="h-9 w-9 rounded-2xl bg-emerald-50 text-emerald-600 font-black flex items-center justify-center text-sm border border-emerald-100">
                  2
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Caixa de Destino (Para Onde Transferir)</h3>
                  <p className="text-xs text-gray-500">Selecione para qual conta na WEHOSTHERE as mensagens serão salvas</p>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      E-mail de Destino
                    </label>
                    <input
                      type="email"
                      value={targetEmail}
                      onChange={(e) => setTargetEmail(e.target.value)}
                      placeholder="info@seudominio.com"
                      required
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Senha da Nova Caixa
                    </label>
                    <input
                      type="password"
                      value={targetPassword}
                      onChange={(e) => setTargetPassword(e.target.value)}
                      placeholder="Senha da caixa criada na WEHOSTHERE"
                      required
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 text-xs text-gray-600 border border-gray-100 space-y-1">
                  <div className="font-bold text-gray-800 flex items-center space-x-1.5">
                    <Info className="h-4 w-4 text-primary-600" />
                    <span>Como funciona a migração:</span>
                  </div>
                  <p>
                    As mensagens são duplicadas de forma segura. Nada é apagado do servidor antigo durante este processo.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleStartMigration}
                  disabled={isStarting || !sourceEmail || !sourcePassword || !targetPassword}
                  className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition disabled:opacity-50 shadow-sm"
                >
                  {isStarting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <DownloadCloud className="h-4 w-4" />}
                  <span>{isStarting ? 'Iniciando Processo...' : 'Iniciar Migração Completa Agora'}</span>
                </button>
              </div>
            </div>

            {/* LIVE PROGRESS MONITOR */}
            {activeMigration && (
              <div className="bg-gray-900 text-white rounded-3xl p-6 space-y-4 shadow-xl border border-gray-800 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
                    <h3 className="font-bold text-base">Progresso da Migração em Tempo Real</h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    activeMigration.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    activeMigration.status === 'failed' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                    'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {activeMigration.status.toUpperCase()}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-gray-300 font-medium">
                    <span>{activeMigration.migratedMessages} de {activeMigration.totalMessages || '?'} mensagens transferidas</span>
                    <span>{calculateProgressPercent()}%</span>
                  </div>
                  <div className="h-3 bg-gray-800 rounded-full overflow-hidden p-0.5 border border-gray-700">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${calculateProgressPercent()}%` }}
                    />
                  </div>
                </div>

                {/* Current folder & stats */}
                <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-gray-800">
                  <div className="bg-gray-800/60 p-2.5 rounded-xl">
                    <span className="text-gray-400 block text-[10px]">Pasta Atual:</span>
                    <span className="font-bold font-mono text-emerald-300 truncate block">{activeMigration.currentFolder || 'INBOX'}</span>
                  </div>
                  <div className="bg-gray-800/60 p-2.5 rounded-xl">
                    <span className="text-gray-400 block text-[10px]">Transferidas:</span>
                    <span className="font-bold text-white">{activeMigration.migratedMessages}</span>
                  </div>
                  <div className="bg-gray-800/60 p-2.5 rounded-xl">
                    <span className="text-gray-400 block text-[10px]">Falhas/Ignoradas:</span>
                    <span className="font-bold text-amber-400">{activeMigration.failedMessages || 0}</span>
                  </div>
                </div>

                {/* Logs terminal */}
                <div className="bg-black/60 rounded-2xl p-3 font-mono text-[11px] text-gray-300 max-h-36 overflow-y-auto space-y-1 border border-gray-800">
                  <div className="text-gray-500 text-[10px] pb-1 border-b border-gray-800 flex items-center space-x-1">
                    <Terminal className="h-3 w-3" />
                    <span>Log de Execução</span>
                  </div>
                  {activeMigration.logs?.map((log: string, idx: number) => (
                    <div key={idx} className="leading-tight text-gray-300">
                      &gt; {log}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right Column: History & Quick Tips (1 Col) */}
          <div className="space-y-6">

            {/* Quick Helper */}
            <div className="bg-white rounded-3xl shadow-xs border border-gray-200 p-6 space-y-3">
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
                Exemplos de Servidores Antigos
              </h3>
              
              <div className="space-y-2.5 text-xs text-gray-600">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                  <strong className="text-gray-900 block">TurboHost / cPanel:</strong>
                  <div>Host: <code className="font-mono font-bold text-blue-700">mail.{domainName}</code></div>
                  <div>Porta: <code className="font-mono">993</code> (SSL) ou <code className="font-mono">143</code></div>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                  <strong className="text-gray-900 block">Gmail / Google Workspace:</strong>
                  <div>Host: <code className="font-mono font-bold text-blue-700">imap.gmail.com</code></div>
                  <div>Porta: <code className="font-mono">993</code> (SSL)</div>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                  <strong className="text-gray-900 block">Outlook / Office 365:</strong>
                  <div>Host: <code className="font-mono font-bold text-blue-700">outlook.office365.com</code></div>
                  <div>Porta: <code className="font-mono">993</code> (SSL)</div>
                </div>
              </div>
            </div>

            {/* Recent Migrations History */}
            <div className="bg-white rounded-3xl shadow-xs border border-gray-200 p-6 space-y-4">
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
                Histórico Recente
              </h3>

              {recentMigrations.length === 0 ? (
                <p className="text-xs text-gray-400">Nenhuma migração executada ainda.</p>
              ) : (
                <div className="space-y-3">
                  {recentMigrations.map((m: any) => (
                    <div key={m._id} className="p-3 rounded-xl border border-gray-200 bg-gray-50/50 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900 truncate max-w-[130px]">{m.sourceEmail}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          m.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                          m.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {m.status}
                        </span>
                      </div>
                      <div className="text-gray-500 text-[11px]">
                        {m.migratedMessages} msgs • {new Date(m.createdAt).toLocaleDateString('pt-PT')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Toast Feedback */}
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
