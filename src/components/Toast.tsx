'use client';

import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X, Sparkles } from 'lucide-react';

export interface ToastProps {
  id?: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  onClose: () => void;
  duration?: number;
}

export default function Toast({
  type = 'success',
  title,
  message,
  onClose,
  duration = 4500
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const config = {
    success: {
      bg: 'bg-gradient-to-r from-[#075985]/95 via-[#0369a1]/95 to-[#0284c7]/95 text-white border-white/30 shadow-[0_20px_50px_rgba(2,132,199,0.35),0_0_0_1px_rgba(255,255,255,0.25)_inset]',
      badgeBg: 'bg-white/20 border-white/35 text-emerald-300',
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" />,
      glow: 'from-sky-400 via-emerald-300 to-amber-300'
    },
    error: {
      bg: 'bg-gradient-to-r from-rose-950/95 via-rose-900/95 to-red-900/95 text-white border-rose-400/30 shadow-[0_20px_50px_rgba(225,29,72,0.35),0_0_0_1px_rgba(255,255,255,0.2)_inset]',
      badgeBg: 'bg-rose-500/20 border-rose-400/30 text-rose-300',
      icon: <AlertCircle className="h-4 w-4 text-rose-300 shrink-0" />,
      glow: 'from-rose-500 via-pink-500 to-amber-500'
    },
    warning: {
      bg: 'bg-gradient-to-r from-amber-950/95 via-amber-900/95 to-orange-900/95 text-white border-amber-400/30 shadow-[0_20px_50px_rgba(217,119,6,0.35),0_0_0_1px_rgba(255,255,255,0.2)_inset]',
      badgeBg: 'bg-amber-500/20 border-amber-400/30 text-amber-300',
      icon: <AlertTriangle className="h-4 w-4 text-amber-300 shrink-0" />,
      glow: 'from-amber-400 via-orange-400 to-yellow-300'
    },
    info: {
      bg: 'bg-gradient-to-r from-slate-900/95 via-sky-950/95 to-slate-900/95 text-white border-sky-400/30 shadow-[0_20px_50px_rgba(14,165,233,0.35),0_0_0_1px_rgba(255,255,255,0.2)_inset]',
      badgeBg: 'bg-sky-500/20 border-sky-400/30 text-sky-300',
      icon: <Info className="h-4 w-4 text-sky-300 shrink-0" />,
      glow: 'from-sky-400 via-indigo-400 to-cyan-300'
    }
  }[type];

  return (
    <div className="fixed top-6 sm:top-8 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-md sm:max-w-lg pointer-events-none animate-in fade-in slide-in-from-top-6 zoom-in-95 duration-300">
      <div className="relative group pointer-events-auto">
        {/* Glow dinâmico multicolorido e suave */}
        <div className={`absolute -inset-0.5 rounded-2xl sm:rounded-full blur-md opacity-75 group-hover:opacity-100 transition-opacity bg-gradient-to-r ${config.glow}`} />

        {/* Caixa do Toast com Glassmorphism e gradiente azul elegante */}
        <div className={`relative flex items-center space-x-3 sm:space-x-3.5 px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl sm:rounded-full border backdrop-blur-2xl ${config.bg}`}>
          
          {/* Badge com Ícone */}
          <div className={`w-8 h-8 rounded-xl sm:rounded-full flex items-center justify-center shrink-0 border shadow-inner backdrop-blur-md ${config.badgeBg}`}>
            {config.icon}
          </div>

          {/* Texto / Conteúdo */}
          <div className="flex-1 min-w-0 pr-1">
            {title && (
              <h4 className="font-extrabold text-xs sm:text-sm tracking-wide text-white leading-tight flex items-center gap-1.5">
                {title}
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              </h4>
            )}
            <p className="text-[11px] sm:text-xs text-sky-100 font-medium leading-relaxed mt-0.5">
              {message}
            </p>
          </div>

          {/* Botão de Fechar */}
          <button
            type="button"
            onClick={onClose}
            className="p-1 sm:p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition shrink-0 cursor-pointer"
            title="Fechar notificação"
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
