'use client';

import { useState } from 'react';
import { Star, Send, X } from 'lucide-react';
import { dataManager, UserFeedback } from '@/lib/data';
import { auth } from '@/lib/auth';
import Toast from './Toast';

interface FeedbackFormProps {
  type: 'course' | 'lesson' | 'platform' | 'general';
  targetId?: string;
  targetName?: string;
  onClose?: () => void;
  onSubmit?: () => void;
}

export default function FeedbackForm({ type, targetId, targetName, onClose, onSubmit }: FeedbackFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [category, setCategory] = useState<'content' | 'structure' | 'support' | 'bug' | 'suggestion' | 'other'>('content');
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning' }>({ show: false, message: '', type: 'success' });
  const [submitting, setSubmitting] = useState(false);

  const user = auth.getCurrentUser();

  const handleSubmit = async () => {
    if (!user) {
      setToast({ show: true, message: 'Precisa estar logado para enviar feedback', type: 'error' });
      return;
    }

    if (rating === 0) {
      setToast({ show: true, message: 'Por favor, selecione uma classificação', type: 'warning' });
      return;
    }

    if (comment.trim().length < 10) {
      setToast({ show: true, message: 'Por favor, escreva um comentário com pelo menos 10 caracteres', type: 'warning' });
      return;
    }

    setSubmitting(true);

    try {
      const feedback: Omit<UserFeedback, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: user.email,
        userEmail: user.email,
        type,
        targetId,
        rating,
        comment,
        category,
        status: 'pending'
      };

      dataManager.createFeedback(feedback);
      
      setToast({ show: true, message: 'Feedback enviado com sucesso!', type: 'success' });
      setRating(0);
      setComment('');
      
      if (onSubmit) {
        onSubmit();
      }
      
      if (onClose) {
        setTimeout(() => onClose(), 1500);
      }
    } catch (error) {
      setToast({ show: true, message: 'Erro ao enviar feedback', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'course': return 'Curso';
      case 'lesson': return 'Lição';
      case 'platform': return 'Plataforma';
      case 'general': return 'Geral';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          Feedback - {targetName || getTypeLabel()}
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Classificação</label>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none transition"
              >
                <Star
                  className={`h-6 w-6 ${
                    (hoverRating || rating) >= star
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="content">Conteúdo</option>
            <option value="structure">Estrutura</option>
            <option value="support">Suporte</option>
            <option value="bug">Bug</option>
            <option value="suggestion">Sugestão</option>
            <option value="other">Outro</option>
          </select>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Comentário</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="Escreva o seu feedback aqui..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">{comment.length} caracteres</p>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
          <span>{submitting ? 'Enviando...' : 'Enviar Feedback'}</span>
        </button>
      </div>

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
