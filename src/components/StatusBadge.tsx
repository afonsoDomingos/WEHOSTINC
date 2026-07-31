'use client';

import { CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';

interface StatusBadgeProps {
  status: 'active' | 'pending' | 'suspended' | string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function StatusBadge({ status, size = 'md', showLabel = true }: StatusBadgeProps) {
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-amber-50 via-amber-100/70 to-orange-50 text-amber-900 border border-amber-300/80 rounded-full font-bold text-xs shadow-xs animate-pulse hover:animate-none transition-all duration-300 whitespace-nowrap shrink-0">
        {/* Dynamic pulsing radar dot */}
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
        </span>
        
        {/* Animated spinning loader */}
        <Loader2 className="h-3.5 w-3.5 text-amber-600 animate-spin shrink-0" />
        
        {showLabel && (
          <span className="font-bold tracking-tight text-amber-950">
            Em Processamento
          </span>
        )}
      </span>
    );
  }

  if (status === 'active') {
    return (
      <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/90 rounded-full font-bold text-xs shadow-2xs">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
        {showLabel && <span>Ativo</span>}
      </span>
    );
  }

  if (status === 'suspended') {
    return (
      <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-full font-bold text-xs">
        <XCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
        {showLabel && <span>Suspenso</span>}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-gray-50 text-gray-700 border border-gray-200 rounded-full font-medium text-xs">
      <Clock className="h-3.5 w-3.5 text-gray-500 shrink-0" />
      {showLabel && <span>{status}</span>}
    </span>
  );
}
