'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, X, CheckCircle2, ShieldCheck } from 'lucide-react';
import { dataManager, SocialProof } from '@/lib/data';

export default function SocialProofToast() {
  const [proofs, setProofs] = useState<SocialProof[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [visible, setVisible] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    // Carregar provas ativas
    const activeProofs = dataManager.getSocialProofs().filter((p) => p.active);
    if (activeProofs.length > 0) {
      setProofs(activeProofs);
    }
  }, []);

  useEffect(() => {
    if (proofs.length === 0 || dismissed) return;

    // Mostrar primeiro toast após 3.5 segundos
    const initialTimer = setTimeout(() => {
      setVisible(true);
    }, 3500);

    // Intervalo de exibição: mostra por 5s, esconde por 7s, depois avança
    const cycleInterval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % proofs.length);
        setVisible(true);
      }, 7000);
    }, 12000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(cycleInterval);
    };
  }, [proofs, dismissed]);

  if (proofs.length === 0 || dismissed) return null;

  const current = proofs[currentIndex] || proofs[0];

  return (
    <div
      className={`fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-50 max-w-[320px] sm:max-w-sm transition-all duration-500 ease-out transform ${
        visible
          ? 'translate-y-0 opacity-100 scale-100 pointer-events-auto'
          : 'translate-y-8 opacity-0 scale-95 pointer-events-none'
      }`}
    >
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 shadow-2xl border border-gray-200/90 text-gray-900 relative group overflow-hidden">
        {/* Barra superior de destaque em gradiente verde */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-primary-500" />

        <div className="flex items-start gap-3">
          {/* Ícone com Ponto Pulsante */}
          <div className="relative flex-shrink-0 mt-0.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
              <ShoppingBag className="w-5 h-5 sm:w-5 sm:h-5 text-emerald-600" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
          </div>

          {/* Conteúdo da Notificação */}
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs sm:text-sm font-extrabold text-gray-900 truncate">
                {current.userName}
              </span>
              <span className="text-[10px] text-gray-500 font-medium truncate">
                de {current.location}
              </span>
            </div>

            <p className="text-xs text-gray-700 font-medium leading-snug line-clamp-2">
              {current.action}
            </p>

            <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-gray-100">
              <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Compra Verificada</span>
              </span>
              <span className="text-[10px] text-gray-400 font-medium">{current.timeAgo}</span>
            </div>
          </div>

          {/* Botão de Fechar */}
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition"
            title="Fechar notificação"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
