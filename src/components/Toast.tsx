'use client';

import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

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
  duration = 4000
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const config = {
    success: {
      bg: 'bg-emerald-900/95 border-emerald-500/40 text-white',
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />,
      accent: 'bg-emerald-500'
    },
    error: {
      bg: 'bg-rose-950/95 border-rose-500/40 text-white',
      icon: <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />,
      accent: 'bg-rose-500'
    },
    warning: {
      bg: 'bg-amber-950/95 border-amber-500/40 text-white',
      icon: <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />,
      accent: 'bg-amber-500'
    },
    info: {
      bg: 'bg-slate-900/95 border-primary-500/40 text-white',
      icon: <Info className="h-5 w-5 text-primary-400 shrink-0" />,
      accent: 'bg-primary-500'
    }
  }[type];

  return (
    <div className="fixed top-5 right-5 z-50 max-w-md w-full animate-in slide-in-from-top-4 fade-in duration-200">
      <div className={`relative overflow-hidden rounded-2xl border p-4 shadow-2xl backdrop-blur-md ${config.bg}`}>
        {/* Barra de destaque */}
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${config.accent}`} />
        
        <div className="flex items-start space-x-3 pl-1 pr-6">
          {config.icon}
          <div className="flex-1 min-w-0">
            {title && <h4 className="font-bold text-sm leading-tight mb-0.5">{title}</h4>}
            <p className="text-xs text-slate-200 leading-relaxed font-medium whitespace-pre-line">{message}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
