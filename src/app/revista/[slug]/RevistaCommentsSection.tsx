'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Heart, CornerDownRight, Send, Trash2, 
  User, CheckCircle2, AlertCircle, Loader2, Sparkles, ShieldCheck
} from 'lucide-react';

export interface CommentAuthor {
  name: string;
  email: string;
  avatar?: string;
  userId?: string;
  isAuthor?: boolean;
  isAdmin?: boolean;
}

export interface RevistaCommentItem {
  id: string;
  _id?: string;
  storySlug: string;
  author: CommentAuthor;
  content: string;
  parentId?: string | null;
  status: 'approved' | 'pending' | 'spam' | 'rejected';
  likes: number;
  likedBy?: string[];
  createdAt: string;
  replies?: RevistaCommentItem[];
}

interface RevistaCommentsSectionProps {
  storySlug: string;
  storyTitle: string;
  storyAuthorEmail?: string;
}

export default function RevistaCommentsSection({
  storySlug,
  storyTitle,
  storyAuthorEmail
}: RevistaCommentsSectionProps) {
  const [comments, setComments] = useState<RevistaCommentItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [content, setContent] = useState<string>('');
  
  // Reply Form State
  const [replyName, setReplyName] = useState<string>('');
  const [replyEmail, setReplyEmail] = useState<string>('');
  const [replyContent, setReplyContent] = useState<string>('');
  const [submittingReply, setSubmittingReply] = useState<boolean>(false);

  // Current session user if available
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  // Load user session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('wehosthere_auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.user) {
          setCurrentUser(parsed.user);
          setName(parsed.user.name || '');
          setEmail(parsed.user.email || '');
          setReplyName(parsed.user.name || '');
          setReplyEmail(parsed.user.email || '');
        }
      }
      
      const storedLikes = localStorage.getItem(`revista_likes_${storySlug}`);
      if (storedLikes) {
        setUserLikes(new Set(JSON.parse(storedLikes)));
      }
    } catch {}
  }, [storySlug]);

  // Fetch Comments
  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/revista/${encodeURIComponent(storySlug)}/comments`);
      const data = await res.json();
      if (data.success) {
        setComments(data.comments || []);
        setTotalCount(data.totalCount || 0);
      }
    } catch (err) {
      console.error('Erro ao buscar comentários:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storySlug) {
      fetchComments();
    }
  }, [storySlug]);

  // Show Toast
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  // Submit Root Comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !content.trim()) {
      showToast('error', 'Por favor, preencha o nome, e-mail e comentário.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/revista/${encodeURIComponent(storySlug)}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          content: content.trim(),
          avatar: currentUser?.avatar || undefined,
          userId: currentUser?.id || undefined,
          isAdmin: currentUser?.role === 'admin' || currentUser?.role === 'super_admin'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', 'Comentário publicado com sucesso!');
        setContent('');
        fetchComments();
      } else {
        showToast('error', data.error || 'Erro ao publicar comentário.');
      }
    } catch (err) {
      showToast('error', 'Falha de conexão ao enviar comentário.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Reply
  const handleSubmitReply = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyName.trim() || !replyEmail.trim() || !replyContent.trim()) {
      showToast('error', 'Preencha todos os campos da resposta.');
      return;
    }

    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/revista/${encodeURIComponent(storySlug)}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: replyName.trim(),
          email: replyEmail.trim(),
          content: replyContent.trim(),
          parentId,
          avatar: currentUser?.avatar || undefined,
          userId: currentUser?.id || undefined,
          isAdmin: currentUser?.role === 'admin' || currentUser?.role === 'super_admin'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', 'Resposta enviada com sucesso!');
        setReplyContent('');
        setReplyingTo(null);
        fetchComments();
      } else {
        showToast('error', data.error || 'Erro ao enviar resposta.');
      }
    } catch (err) {
      showToast('error', 'Falha de conexão ao responder.');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Like a comment
  const handleLike = async (commentId: string) => {
    const isLiked = userLikes.has(commentId);
    const newLikes = new Set(userLikes);
    if (isLiked) {
      newLikes.delete(commentId);
    } else {
      newLikes.add(commentId);
    }
    setUserLikes(newLikes);
    localStorage.setItem(`revista_likes_${storySlug}`, JSON.stringify(Array.from(newLikes)));

    // Optimistic UI update
    setComments(prev => updateCommentLikes(prev, commentId, isLiked ? -1 : 1));

    try {
      await fetch(`/api/revista/${encodeURIComponent(storySlug)}/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIdentifier: currentUser?.email || email || 'guest_client'
        })
      });
    } catch (err) {
      console.warn('Erro ao curtir comentário:', err);
    }
  };

  const updateCommentLikes = (list: RevistaCommentItem[], id: string, delta: number): RevistaCommentItem[] => {
    return list.map(item => {
      if (item.id === id || item._id === id) {
        return { ...item, likes: Math.max(0, item.likes + delta) };
      }
      if (item.replies && item.replies.length > 0) {
        return { ...item, replies: updateCommentLikes(item.replies, id, delta) };
      }
      return item;
    });
  };

  // Delete Comment (Admin only)
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Tem a certeza que deseja eliminar este comentário?')) return;

    try {
      const res = await fetch(`/api/revista/${encodeURIComponent(storySlug)}/comments/${commentId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast('success', 'Comentário eliminado.');
        fetchComments();
      }
    } catch {
      showToast('error', 'Falha ao eliminar comentário.');
    }
  };

  // Format Date in Portuguese
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'agora mesmo';
      if (diffMins < 60) return `há ${diffMins} min`;
      if (diffHours < 24) return `há ${diffHours} h`;
      if (diffDays === 1) return 'ontem';
      if (diffDays < 7) return `há ${diffDays} dias`;

      return d.toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  };

  const isAdminUser = currentUser?.role === 'admin' || currentUser?.role === 'super_admin' || currentUser?.email === 'admin@wehosthere.com';

  return (
    <section 
      id="comentarios" 
      className="mt-16 pt-12 border-t border-purple-100/60 dark:border-purple-900/30 font-sans"
      style={{ colorScheme: 'light' }}
    >
      {/* Toast Notification */}
      {toast && (
        <div 
          className={`fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold text-white transition-all transform animate-bounce-short ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              Comentários & Discussão
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40">
                {totalCount}
              </span>
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Partilhe a sua opinião, ideias ou faça perguntas sobre este artigo
            </p>
          </div>
        </div>
      </div>

      {/* Form para Novo Comentário */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-200/80 dark:border-slate-800 mb-10 transition-shadow hover:shadow-md">
        <form onSubmit={handleSubmitComment} className="space-y-4">
          <div className="flex items-center space-x-2 mb-2 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            <Sparkles size={14} />
            <span>Deixar um Comentário</span>
          </div>

          {/* Nome e Email se não estiver logado */}
          {!currentUser ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  O seu Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Carlos Matsinhe"
                  required
                  style={{ color: '#000000', WebkitTextFillColor: '#000000', backgroundColor: '#ffffff', colorScheme: 'light' }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 text-black bg-white text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  E-mail (não será publicado) <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="carlos@exemplo.com"
                  required
                  style={{ color: '#000000', WebkitTextFillColor: '#000000', backgroundColor: '#ffffff', colorScheme: 'light' }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 text-black bg-white text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 text-xs text-purple-900 dark:text-purple-200">
              <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-[10px]">
                {currentUser.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <span>
                A comentar como <strong>{currentUser.name}</strong> ({currentUser.email})
              </span>
            </div>
          )}

          {/* Textarea */}
          <div>
            <textarea
              rows={3}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="O que achou deste artigo? Tem alguma dúvida ou experiência parecida para partilhar?"
              required
              maxLength={2500}
              style={{ color: '#000000', WebkitTextFillColor: '#000000', backgroundColor: '#ffffff', colorScheme: 'light' }}
              className="w-full p-3.5 rounded-xl border border-gray-300 dark:border-slate-700 text-black bg-white text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition resize-y min-h-[90px]"
            />
            <div className="flex justify-between items-center text-[11px] text-gray-400 mt-1">
              <span>Mantenha um diálogo respeitoso e construtivo.</span>
              <span>{content.length} / 2500</span>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-purple-500/20 transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>A publicar...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Publicar Comentário</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Lista de Comentários */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-purple-600 space-y-2">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-xs font-semibold text-gray-500">A carregar comentários...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-gray-300 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/40">
          <MessageSquare size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <h4 className="text-base font-bold text-gray-800 dark:text-gray-200">
            Ainda não há comentários nesta história.
          </h4>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
            Seja o primeiro a partilhar uma opinião, dúvida ou reflexão com a nossa comunidade tech!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map(comment => (
            <div 
              key={comment.id || comment._id}
              className="bg-white dark:bg-slate-900/90 rounded-2xl p-5 border border-gray-200/80 dark:border-slate-800 shadow-xs transition hover:border-purple-200 dark:hover:border-purple-900/50"
            >
              {/* Header do Comentário */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-100 dark:bg-purple-950 flex-shrink-0 border border-purple-200 dark:border-purple-800">
                    {comment.author.avatar ? (
                      <img 
                        src={comment.author.avatar} 
                        alt={comment.author.name}
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-sm text-purple-700 dark:text-purple-300">
                        {comment.author.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="text-sm font-extrabold text-gray-900 dark:text-white">
                        {comment.author.name}
                      </span>
                      {comment.author.isAuthor && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                          ✍️ Autor
                        </span>
                      )}
                      {comment.author.isAdmin && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                          <ShieldCheck size={11} /> Equipa WeHost
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400 mt-0.5 block">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                </div>

                {isAdminUser && (
                  <button
                    onClick={() => handleDeleteComment(comment.id || comment._id || '')}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                    title="Eliminar Comentário"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {/* Conteúdo */}
              <div className="mt-3.5 text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line font-normal pl-0 sm:pl-13">
                {comment.content}
              </div>

              {/* Ações (Like e Responder) */}
              <div className="mt-3.5 pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center space-x-4 pl-0 sm:pl-13 text-xs">
                <button
                  onClick={() => handleLike(comment.id || comment._id || '')}
                  className={`inline-flex items-center space-x-1.5 py-1 px-2.5 rounded-lg transition font-semibold cursor-pointer ${
                    userLikes.has(comment.id || comment._id || '')
                      ? 'text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400'
                      : 'text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Heart size={14} className={userLikes.has(comment.id || comment._id || '') ? 'fill-current' : ''} />
                  <span>{comment.likes || 0}</span>
                </button>

                <button
                  onClick={() => setReplyingTo(replyingTo === (comment.id || comment._id) ? null : (comment.id || comment._id || ''))}
                  className="inline-flex items-center space-x-1 text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 font-semibold py-1 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <CornerDownRight size={13} />
                  <span>{replyingTo === (comment.id || comment._id) ? 'Cancelar' : 'Responder'}</span>
                </button>
              </div>

              {/* Formulário de Resposta Inline */}
              {replyingTo === (comment.id || comment._id) && (
                <div className="mt-4 pl-4 sm:pl-13 border-l-2 border-purple-400 dark:border-purple-600 animate-fadeIn">
                  <form onSubmit={e => handleSubmitReply(e, comment.id || comment._id || '')} className="space-y-3 bg-purple-50/50 dark:bg-purple-950/20 p-4 rounded-xl border border-purple-100 dark:border-purple-900/40">
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-300 block">
                      Responder a {comment.author.name}:
                    </span>

                    {!currentUser && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="O seu nome *"
                          value={replyName}
                          onChange={e => setReplyName(e.target.value)}
                          required
                          style={{ color: '#000000', WebkitTextFillColor: '#000000', backgroundColor: '#ffffff', colorScheme: 'light' }}
                          className="px-3 py-1.5 rounded-lg border border-gray-300 text-black bg-white text-xs font-medium outline-none"
                        />
                        <input
                          type="email"
                          placeholder="O seu email *"
                          value={replyEmail}
                          onChange={e => setReplyEmail(e.target.value)}
                          required
                          style={{ color: '#000000', WebkitTextFillColor: '#000000', backgroundColor: '#ffffff', colorScheme: 'light' }}
                          className="px-3 py-1.5 rounded-lg border border-gray-300 text-black bg-white text-xs font-medium outline-none"
                        />
                      </div>
                    )}

                    <textarea
                      rows={2}
                      placeholder="Escreva aqui a sua resposta..."
                      value={replyContent}
                      onChange={e => setReplyContent(e.target.value)}
                      required
                      style={{ color: '#000000', WebkitTextFillColor: '#000000', backgroundColor: '#ffffff', colorScheme: 'light' }}
                      className="w-full p-2.5 rounded-lg border border-gray-300 text-black bg-white text-xs font-medium outline-none focus:ring-2 focus:ring-purple-500"
                    />

                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setReplyingTo(null)}
                        className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={submittingReply || !replyContent.trim()}
                        className="px-4 py-1.5 text-xs rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold transition disabled:opacity-50"
                      >
                        {submittingReply ? 'A enviar...' : 'Enviar Resposta'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Respostas Aninhadas (Threaded Replies) */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-4 pt-3 space-y-3.5 pl-4 sm:pl-13 border-l-2 border-purple-200 dark:border-purple-900/60 ml-2 sm:ml-5">
                  {comment.replies.map(reply => (
                    <div 
                      key={reply.id || reply._id} 
                      className="bg-gray-50/80 dark:bg-slate-950/60 p-3.5 rounded-xl border border-gray-100 dark:border-slate-800"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-full overflow-hidden bg-purple-200 flex-shrink-0">
                            {reply.author.avatar ? (
                              <img src={reply.author.avatar} alt={reply.author.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-xs text-purple-700">
                                {reply.author.name?.[0]?.toUpperCase() || 'U'}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="text-xs font-bold text-gray-900 dark:text-white">
                                {reply.author.name}
                              </span>
                              {reply.author.isAuthor && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800">
                                  Autor
                                </span>
                              )}
                              {reply.author.isAdmin && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-purple-100 text-purple-800">
                                  Equipa
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400 block">
                              {formatDate(reply.createdAt)}
                            </span>
                          </div>
                        </div>

                        {isAdminUser && (
                          <button
                            onClick={() => handleDeleteComment(reply.id || reply._id || '')}
                            className="p-1 text-gray-400 hover:text-red-500 rounded"
                            title="Eliminar Resposta"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>

                      <p className="mt-2 text-xs text-gray-800 dark:text-gray-200 whitespace-pre-line leading-relaxed">
                        {reply.content}
                      </p>

                      <div className="mt-2 flex items-center space-x-2 text-[11px]">
                        <button
                          onClick={() => handleLike(reply.id || reply._id || '')}
                          className={`inline-flex items-center space-x-1 py-0.5 px-1.5 rounded transition font-semibold ${
                            userLikes.has(reply.id || reply._id || '')
                              ? 'text-red-600 bg-red-50 dark:bg-red-950/40'
                              : 'text-gray-400 hover:text-red-600'
                          }`}
                        >
                          <Heart size={12} className={userLikes.has(reply.id || reply._id || '') ? 'fill-current' : ''} />
                          <span>{reply.likes || 0}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
