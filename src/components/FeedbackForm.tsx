'use client';

import { useState } from 'react';
import { Star, Send, X, MessageSquareHeart, CheckCircle2 } from 'lucide-react';
import { dataManager } from '@/lib/data';
import { auth } from '@/lib/auth';
import Toast from './Toast';

interface FeedbackFormProps {
  type?: 'course' | 'lesson' | 'platform' | 'general' | 'service';
  targetId?: string;
  targetName?: string;
  onClose?: () => void;
  onSubmit?: () => void;
}

export default function FeedbackForm({ 
  type = 'general', 
  targetId, 
  targetName, 
  onClose, 
  onSubmit 
}: FeedbackFormProps) {
  const user = auth.getCurrentUser();

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [comment, setComment] = useState('');
  const [category, setCategory] = useState<'suggestion' | 'content' | 'support' | 'bug' | 'other'>('suggestion');
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning' }>({ 
    show: false, 
    message: '', 
    type: 'success' 
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (rating === 0) {
      setToast({ show: true, message: 'Por favor, selecione uma classificação de 1 a 5 estrelas', type: 'warning' });
      return;
    }

    if (!comment.trim() || comment.trim().length < 5) {
      setToast({ show: true, message: 'Por favor, escreva um comentário com pelo menos 5 caracteres', type: 'warning' });
      return;
    }

    setSubmitting(true);

    const feedbackPayload = {
      userId: user?.id || user?.email || '',
      userName: (name || user?.name || 'Cliente').trim(),
      userEmail: (email || user?.email || 'anonimo@wehosthere.com').trim(),
      type,
      targetId,
      rating,
      comment: comment.trim(),
      category,
      status: 'pending' as const
    };

    try {
      // 1. Gravar localmente
      dataManager.createFeedback(feedbackPayload);

      // 2. Enviar para API e MongoDB
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackPayload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro ao submeter feedback');
      }

      setSubmitted(true);
      setToast({ show: true, message: 'Obrigado pelo seu feedback!', type: 'success' });
      
      if (onSubmit) onSubmit();

      if (onClose) {
        setTimeout(() => onClose(), 2000);
      }
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      // Mesmo com erro de rede, o feedback local foi registrado
      setSubmitted(true);
      setToast({ show: true, message: 'Feedback registado com sucesso!', type: 'success' });
      if (onClose) {
        setTimeout(() => onClose(), 2000);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingLabel = (r: number) => {
    switch (r) {
      case 1: return 'Muito Fraco 😞';
      case 2: return 'Razoável 😐';
      case 3: return 'Bom 🙂';
      case 4: return 'Muito Bom! 😊';
      case 5: return 'Excelente! 🚀';
      default: return '';
    }
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl p-6 sm:p-8 text-center max-w-md w-full shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h3 className="text-xl font-extrabold text-gray-900 mb-2">Muito Obrigado!</h3>
        <p className="text-sm text-gray-600 mb-6">
          A sua opinião ajuda-nos a melhorar a plataforma para todos os clientes em Moçambique.
        </p>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl transition"
          >
            Fechar
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full border border-gray-100 animate-in fade-in zoom-in duration-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-5 pb-3 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center">
            <MessageSquareHeart className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
              {targetName ? `Feedback: ${targetName}` : 'A sua opinião é importante'}
            </h3>
            <p className="text-xs text-gray-500">Ajude-nos a melhorar a experiência da WEHOSTHERE</p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating Stars */}
        <div className="text-center py-2 bg-gray-50 rounded-xl border border-gray-100">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Como avalia a sua experiência?
          </label>
          <div className="flex justify-center items-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1.5 focus:outline-none transition-transform hover:scale-125 cursor-pointer"
                aria-label={`${star} estrelas`}
              >
                <Star
                  className={`h-7 w-7 transition-colors ${
                    (hoverRating || rating) >= star
                      ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="text-xs font-semibold text-primary-600 mt-2">
            {getRatingLabel(hoverRating || rating)}
          </p>
        </div>

        {/* Category selection */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Tipo de Feedback
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: 'suggestion', label: '💡 Sugestão' },
              { id: 'support', label: '🤝 Atendimento' },
              { id: 'content', label: '⭐ Elogio' },
              { id: 'bug', label: '🐞 Problema/Bug' },
              { id: 'other', label: '💬 Outro' }
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id as any)}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition cursor-pointer text-center ${
                  category === cat.id
                    ? 'bg-primary-50 border-primary-500 text-primary-700 ring-2 ring-primary-500/20'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* User Info (if not logged in) */}
        {!user && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">O seu Nome (opcional)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Carlos Santos"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary-500 text-gray-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">O seu E-mail (opcional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="carlos@exemplo.com"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary-500 text-gray-800"
              />
            </div>
          </div>
        )}

        {/* Comment */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            A sua mensagem <span className="text-red-500">*</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            required
            placeholder="Conte-nos o que achou dos nossos serviços, o que podemos melhorar ou relate qualquer dificuldade..."
            className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm text-gray-800 outline-none resize-none placeholder-gray-400"
          />
          <div className="flex justify-between items-center text-[10px] text-gray-400 mt-1">
            <span>Mínimo 5 caracteres</span>
            <span>{comment.length} caracteres</span>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || comment.trim().length < 5}
          className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <span>A enviar...</span>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Enviar Avaliação</span>
            </>
          )}
        </button>
      </form>

      {toast.show && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
}
