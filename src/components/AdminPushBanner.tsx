'use client';

import { useState, useEffect } from 'react';
import { Bell, BellRing, CheckCircle2, Smartphone, X, Send, AlertTriangle } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useSession } from 'next-auth/react';
import { auth } from '@/lib/auth';

export default function AdminPushBanner() {
  const { data: session } = useSession();
  const { permission, subscription, requestPermission, loading } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDismissed = localStorage.getItem('admin_push_banner_dismissed') === 'true';
      setDismissed(isDismissed);

      // Detectar iOS e se já está instalado como PWA
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIOS(isIosDevice);

      const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      setIsStandalone(standalone);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_push_banner_dismissed', 'true');
    }
  };

  const handleActivate = async () => {
    setTestResult(null);
    const currentUser = auth.getCurrentUser();
    const userEmail = session?.user?.email || currentUser?.email;
    const userName = session?.user?.name || currentUser?.name;
    const userId = (session?.user as any)?.id || currentUser?.id;

    const granted = await requestPermission({
      userId,
      userEmail,
      userName,
      isAdmin: true
    });

    if (granted) {
      setTestResult('✅ Notificações ativadas com sucesso!');
      setTimeout(() => setTestResult(null), 5000);
    }
  };

  const handleTestPush = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/push/test', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setTestResult('📲 Alerta enviado! Verifique o seu telemóvel/ecrã.');
      } else {
        setTestResult(`⚠️ ${data.error || 'Erro ao enviar teste'}`);
      }
    } catch (err: any) {
      setTestResult('⚠️ Falha de comunicação com o servidor.');
    } finally {
      setTesting(false);
      setTimeout(() => setTestResult(null), 6000);
    }
  };

  // Se já tiver permissão concedida, mostra barra compacta informativa com botão de teste
  if (permission === 'granted' || subscription) {
    return (
      <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-4 py-2.5 mb-6 text-emerald-200 text-xs flex flex-wrap items-center justify-between gap-3 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <p className="font-medium">
            <strong className="text-white">Alertas Push Ativos no Telemóvel:</strong> Receberá avisos instantâneos de novos pagamentos e tentativas de compra.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {testResult && (
            <span className="text-[11px] font-semibold text-emerald-300 animate-in fade-in">
              {testResult}
            </span>
          )}
          <button
            onClick={handleTestPush}
            disabled={testing}
            className="px-3 py-1 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{testing ? 'A disparar...' : 'Testar no Telemóvel'}</span>
          </button>
        </div>
      </div>
    );
  }

  // Se o admin dispensou o banner temporariamente
  if (dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-blue-900/95 via-indigo-900/95 to-slate-900/95 border border-blue-500/40 rounded-2xl p-4 sm:p-5 text-white shadow-xl backdrop-blur-xl mb-6 relative overflow-hidden transition-all animate-in fade-in duration-300">
      {/* Glow de fundo */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center flex-shrink-0 relative">
            <BellRing className="w-5 h-5 sm:w-6 sm:h-6 text-blue-300 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-white">
                Ativar Notificações de Vendas no Telemóvel
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Recomendado
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Ative com 1 clique para o seu telemóvel tocar e vibrar quando houver <strong>novos pagamentos M-Pesa</strong>, <strong>tentativas de compra</strong> ou <strong>pedidos</strong>, mesmo com o ecrã bloqueado!
            </p>

            {isIOS && !isStandalone && (
              <p className="text-[11px] text-amber-300/90 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                No iPhone, toque em Partilhar ➔ <strong>&quot;Adicionar ao Ecrã Principal&quot;</strong> para ativar as notificações.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0 self-end sm:self-center">
          <button
            onClick={handleActivate}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-[11px] shadow-md shadow-blue-500/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{loading ? 'A autorizar...' : 'Ativar Alertas'}</span>
          </button>

          <button
            onClick={handleDismiss}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
            title="Lembrar mais tarde"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
