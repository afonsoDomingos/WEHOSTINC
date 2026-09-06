'use client';

import { useState, useEffect } from 'react';
import { MessageSquareHeart, X } from 'lucide-react';
import FeedbackForm from './FeedbackForm';

// 5 minutos em milissegundos
const FIVE_MINUTES_MS = 5 * 60 * 1000;

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Se o utilizador já dispensou o feedback nesta sessão, não exibir
    const dismissed = sessionStorage.getItem('wehost_feedback_dismissed');
    if (dismissed === 'true') return;

    // Recuperar ou inicializar o timestamp de início da sessão
    const storageKey = 'wehost_session_start_time';
    let startTimeStr = sessionStorage.getItem(storageKey);
    let startTime = startTimeStr ? parseInt(startTimeStr, 10) : 0;

    if (!startTime || isNaN(startTime)) {
      startTime = Date.now();
      sessionStorage.setItem(storageKey, startTime.toString());
    }

    const elapsed = Date.now() - startTime;

    if (elapsed >= FIVE_MINUTES_MS) {
      setIsVisible(true);
    } else {
      const remainingTime = FIVE_MINUTES_MS - elapsed;
      const timer = setTimeout(() => {
        if (sessionStorage.getItem('wehost_feedback_dismissed') !== 'true') {
          setIsVisible(true);
        }
      }, remainingTime);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    sessionStorage.setItem('wehost_feedback_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Floating Button com transição suave */}
      <div className="fixed bottom-20 sm:bottom-6 left-4 sm:left-6 z-40 animate-in fade-in slide-in-from-bottom-5 duration-500">
        <div className="relative group">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex items-center space-x-2 pl-3.5 pr-8 py-2.5 bg-gray-900/95 hover:bg-black text-white text-xs font-bold rounded-full shadow-2xl hover:shadow-primary-500/20 transition-all duration-200 backdrop-blur border border-white/15 hover:scale-105 cursor-pointer"
            aria-label="Dar Feedback"
            title="Deixe a sua opinião ou sugestão"
          >
            <div className="w-5 h-5 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center group-hover:bg-primary-500 group-hover:text-white transition">
              <MessageSquareHeart className="h-3.5 w-3.5" />
            </div>
            <span className="hidden sm:inline text-gray-200 group-hover:text-white">Feedback</span>
          </button>

          {/* Botão de Fechar discreto */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Fechar botão de feedback"
            title="Fechar por agora"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-white rounded-full hover:bg-white/20 transition cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Modal Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg">
            <FeedbackForm 
              onClose={() => {
                setIsOpen(false);
                sessionStorage.setItem('wehost_feedback_dismissed', 'true');
                setIsVisible(false);
              }} 
            />
          </div>
        </div>
      )}
    </>
  );
}
