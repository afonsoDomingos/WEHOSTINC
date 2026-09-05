'use client';

import { useState } from 'react';
import { MessageSquareHeart } from 'lucide-react';
import FeedbackForm from './FeedbackForm';

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-20 sm:bottom-6 left-4 sm:left-6 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group flex items-center space-x-2 px-3.5 py-2.5 bg-gray-900/90 hover:bg-black text-white text-xs font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-200 backdrop-blur border border-white/10 hover:scale-105 cursor-pointer"
          aria-label="Dar Feedback"
          title="Deixe a sua opinião ou sugestão"
        >
          <div className="w-5 h-5 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center group-hover:bg-primary-500 group-hover:text-white transition">
            <MessageSquareHeart className="h-3.5 w-3.5" />
          </div>
          <span className="hidden sm:inline text-gray-200 group-hover:text-white">Feedback</span>
        </button>
      </div>

      {/* Modal Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg">
            <FeedbackForm onClose={() => setIsOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
