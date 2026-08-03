'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, X, CheckCircle2 } from 'lucide-react';
import { dataManager, SocialProof } from '@/lib/data';

export default function SocialProofToast() {
  const [proofs, setProofs] = useState<SocialProof[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [visible, setVisible] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    const activeProofs = dataManager.getSocialProofs().filter((p) => p.active);
    if (activeProofs.length > 0) {
      setProofs(activeProofs);
    }
  }, []);

  useEffect(() => {
    if (proofs.length === 0 || dismissed) return;

    // Exibir primeiro toast após 4s
    const initialTimer = setTimeout(() => {
      setVisible(true);
    }, 4000);

    // Ciclo discreto: exibe 4.5s, esconde por 8s, depois avança
    const cycleInterval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % proofs.length);
        setVisible(true);
      }, 8000);
    }, 13000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(cycleInterval);
    };
  }, [proofs, dismissed]);

  if (proofs.length === 0 || dismissed) return null;

  const current = proofs[currentIndex] || proofs[0];

  return (
    <div
      className={`fixed bottom-3 left-3 sm:bottom-4 sm:left-4 z-50 transition-all duration-500 ease-out transform ${
        visible
          ? 'translate-y-0 opacity-100 scale-100 pointer-events-auto'
          : 'translate-y-6 opacity-0 scale-95 pointer-events-none'
      }`}
    >
      <div className="bg-white/95 backdrop-blur-md rounded-xl p-2 sm:p-2.5 shadow-lg border border-gray-200/90 text-gray-900 w-[230px] sm:w-[250px] relative group flex items-start gap-2">
        {/* Ícone Minúsculo com Ponto Verde */}
        <div className="relative shrink-0 mt-0.5">
          <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <ShoppingBag className="w-3 h-3 text-emerald-600" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
        </div>

        {/* Conteúdo Discreto e Compacto */}
        <div className="flex-1 min-w-0 pr-3">
          <div className="flex items-center justify-between gap-1 leading-none mb-1">
            <span className="text-[11px] font-bold text-gray-900 truncate">
              {current.userName} <span className="text-[10px] font-normal text-gray-500">({current.location})</span>
            </span>
            <span className="text-[9px] text-gray-400 font-mono shrink-0">{current.timeAgo}</span>
          </div>

          <p className="text-[10px] text-gray-600 font-medium leading-tight truncate">
            {current.action}
          </p>

          <div className="flex items-center gap-1 mt-1 text-[9px] font-semibold text-emerald-600">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
            <span>Compra Verificada</span>
          </div>
        </div>

        {/* Botão Fechar Discreto */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-1.5 right-1.5 text-gray-300 hover:text-gray-600 p-0.5 rounded transition cursor-pointer"
          title="Fechar"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
