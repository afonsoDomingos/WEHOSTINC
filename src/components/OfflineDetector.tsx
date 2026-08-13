'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function OfflineDetector() {
  const [isOffline, setIsOffline] = useState(false);
  const [showRestored, setShowRestored] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Definir estado inicial baseado na conetividade do navegador
    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
    }

    const handleOffline = () => {
      setIsOffline(true);
      setShowRestored(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowRestored(true);
      const timer = setTimeout(() => setShowRestored(false), 4000);
      return () => clearTimeout(timer);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const handleManualRetry = async () => {
    setIsRetrying(true);
    try {
      // Tentar ping à API local com timeout rápido
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const res = await fetch('/api/system/maintenance', { 
        method: 'GET', 
        signal: controller.signal,
        cache: 'no-store'
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        setIsOffline(false);
        setShowRestored(true);
        setTimeout(() => setShowRestored(false), 4000);
      } else {
        setIsOffline(true);
      }
    } catch (e) {
      setIsOffline(true);
    } finally {
      setIsRetrying(false);
    }
  };

  if (!isOffline && !showRestored) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:right-6 z-[9999] max-w-md animate-in slide-in-from-bottom-5 duration-300">
      {isOffline ? (
        <div className="bg-amber-500/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-amber-400/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-600/60 rounded-xl shrink-0 animate-pulse">
              <WifiOff className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-sm leading-snug">Sem Ligação à Internet</h4>
              <p className="text-amber-100 text-xs mt-0.5">
                Não conseguimos conectar ao servidor. Verifique a sua rede.
              </p>
            </div>
          </div>
          <button
            onClick={handleManualRetry}
            disabled={isRetrying}
            className="px-3 py-1.5 bg-white text-amber-900 hover:bg-amber-100 font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'A tentar...' : 'Reconectar'}</span>
          </button>
        </div>
      ) : showRestored ? (
        <div className="bg-emerald-600/95 backdrop-blur-md text-white p-3.5 px-4 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-200 shrink-0" />
          <div>
            <h4 className="font-bold text-sm">Conexão Restabelecida!</h4>
            <p className="text-emerald-100 text-xs">Está novamente online na WEHOSTHERE.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
