'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Heart, CornerDownRight, Send, Trash2, 
  Loader2, Sparkles, ShieldCheck, X, RefreshCw, ChevronDown, ChevronUp
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
  const [replyingTo, setReplyingTo] = useState<RevistaCommentItem | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Form input
  const [messageText, setMessageText] = useState<string>('');
  const [guestName, setGuestName] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [showGuestEdit, setShowGuestEdit] = useState<boolean>(false);

  // Session user & likes
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load session & guest from localStorage
  useEffect(() => {
    try {
      const storedAuth = localStorage.getItem('wehosthere_auth');
      if (storedAuth) {
        const parsed = JSON.parse(storedAuth);
        if (parsed?.user) {
          setCurrentUser(parsed.user);
          setGuestName(parsed.user.name || '');
          setGuestEmail(parsed.user.email || '');
        }
      }

      const storedGuest = localStorage.getItem('wehosthere_revista_guest');
      if (storedGuest && !currentUser) {
        const parsedGuest = JSON.parse(storedGuest);
        if (parsedGuest?.name) setGuestName(parsedGuest.name);
        if (parsedGuest?.email) setGuestEmail(parsedGuest.email);
      }

      const storedLikes = localStorage.getItem(`revista_likes_${storySlug}`);
      if (storedLikes) {
        setUserLikes(new Set(JSON.parse(storedLikes)));
      }
    } catch {}
  }, [storySlug]);

  // Listen to open-revista-chat event to focus input
  useEffect(() => {
    const handleFocusChat = () => {
      setIsCollapsed(false);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    };
    window.addEventListener('open-revista-chat', handleFocusChat);
    return () => window.removeEventListener('open-revista-chat', handleFocusChat);
  }, []);

  // Fetch comments
  const fetchComments = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch(`/api/revista/${encodeURIComponent(storySlug)}/comments`);
      const data = await res.json();
      if (data.success) {
        setComments(data.comments || []);
        setTotalCount(data.totalCount || 0);
      }
    } catch (err) {
      console.error('Erro ao buscar comentários:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (storySlug) {
      fetchComments();
    }
  }, [storySlug]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Submit comment / reply
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim()) return;

    const senderName = currentUser?.name || guestName.trim();
    const senderEmail = currentUser?.email || guestEmail.trim();

    if (!senderName || !senderEmail) {
      setShowGuestEdit(true);
      showToast('error', 'Por favor, indique o seu nome e e-mail.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
      setShowGuestEdit(true);
      showToast('error', 'Indique um e-mail válido.');
      return;
    }

    // Save guest to localStorage for seamless repeat comments
    try {
      localStorage.setItem('wehosthere_revista_guest', JSON.stringify({
        name: senderName,
        email: senderEmail
      }));
    } catch {}

    setSubmitting(true);
    try {
      const payload: any = {
        name: senderName,
        email: senderEmail,
        content: messageText.trim(),
        avatar: currentUser?.avatar || undefined,
        userId: currentUser?.id || undefined,
        isAdmin: currentUser?.role === 'admin' || currentUser?.role === 'super_admin'
      };

      if (replyingTo) {
        payload.parentId = replyingTo.id || replyingTo._id;
      }

      const res = await fetch(`/api/revista/${encodeURIComponent(storySlug)}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessageText('');
        setReplyingTo(null);
        showToast('success', replyingTo ? 'Resposta enviada!' : 'Comentário enviado!');
        await fetchComments(true);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        showToast('error', data.error || 'Erro ao enviar.');
      }
    } catch {
      showToast('error', 'Falha de ligação.');
    } finally {
      setSubmitting(false);
    }
  };

  // Like comment
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

    setComments(prev => updateCommentLikes(prev, commentId, isLiked ? -1 : 1));

    try {
      await fetch(`/api/revista/${encodeURIComponent(storySlug)}/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIdentifier: currentUser?.email || guestEmail || 'guest_client'
        })
      });
    } catch (err) {
      console.warn('Erro ao curtir:', err);
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

  // Delete (Admin only)
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Eliminar esta mensagem do chat?')) return;
    try {
      const res = await fetch(`/api/revista/${encodeURIComponent(storySlug)}/comments/${commentId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast('success', 'Mensagem eliminada.');
        fetchComments(true);
      }
    } catch {
      showToast('error', 'Falha ao eliminar.');
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffMins < 1) return 'agora';
      if (diffMins < 60) return `${diffMins}m`;
      if (diffHours < 24) return `${diffHours}h`;
      return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
    } catch {
      return '';
    }
  };

  const isAdminUser = currentUser?.role === 'admin' || currentUser?.role === 'super_admin' || currentUser?.email === 'admin@wehosthere.com';
  const activeUserEmail = currentUser?.email || guestEmail;

  return (
    <section 
      id="comentarios"
      className="my-6 rounded-2xl bg-slate-50/80 dark:bg-slate-900/70 border border-purple-100 dark:border-purple-900/40 p-3 sm:p-4 shadow-xs transition-all font-sans"
    >
      {/* Toast de Notificação */}
      {toast && (
        <div 
          className={`px-3 py-1.5 mb-2.5 rounded-lg text-xs font-semibold text-white flex items-center justify-between ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)}><X size={12} /></button>
        </div>
      )}

      {/* Header Compacto do Chat (sem botões gigantes) */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200/60 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center">
            <MessageSquare size={13} />
          </div>
          <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
            Chat da História
          </span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
            {totalCount}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => fetchComments(false)}
            disabled={loading}
            className="p-1 text-gray-400 hover:text-purple-600 rounded transition"
            title="Atualizar mensagens"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          {comments.length > 0 && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 text-gray-400 hover:text-purple-600 rounded transition"
              title={isCollapsed ? 'Ver comentários' : 'Ocultar mensagens'}
            >
              {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* Feed de Mensagens (Estilo Mini-Chat em Balões, altura máxima compacta) */}
      {!isCollapsed && (
        <>
          {loading && comments.length === 0 ? (
            <div className="py-4 flex items-center justify-center text-purple-600 space-x-2">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-[11px] text-gray-400">A carregar chat...</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="py-3 px-2 text-center text-[11px] text-gray-500 dark:text-gray-400">
              💭 Seja o primeiro a partilhar uma opinião, dúvida ou reflexão com o autor!
            </div>
          ) : (
            <div className="max-h-56 sm:max-h-64 overflow-y-auto space-y-2 p-1.5 sm:p-2 bg-white/70 dark:bg-slate-950/50 rounded-xl border border-gray-100 dark:border-slate-800/80 mb-2.5 text-xs">
              {comments.map(comment => {
                const isOwn = activeUserEmail && comment.author?.email?.toLowerCase() === activeUserEmail.toLowerCase();
                const commentId = comment.id || comment._id || '';
                const isLiked = userLikes.has(commentId);

                return (
                  <div key={commentId} className="space-y-1">
                    {/* Mensagem Principal */}
                    <div className={`flex items-end gap-1.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      {!isOwn && (
                        <div className="w-5 h-5 rounded-full overflow-hidden bg-purple-200 dark:bg-purple-900 flex-shrink-0 flex items-center justify-center text-[9px] font-bold text-purple-800 dark:text-purple-200">
                          {comment.author?.avatar ? (
                            <img src={comment.author.avatar} alt={comment.author.name} className="w-full h-full object-cover" />
                          ) : (
                            comment.author?.name?.[0]?.toUpperCase() || 'U'
                          )}
                        </div>
                      )}

                      <div 
                        className={`max-w-[85%] rounded-xl p-2 shadow-xs transition ${
                          isOwn 
                            ? 'bg-purple-600 text-white rounded-br-xs' 
                            : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 border border-gray-200/60 dark:border-slate-700/60 rounded-bl-xs'
                        }`}
                      >
                        {!isOwn && (
                          <div className="flex items-center space-x-1 mb-0.5 flex-wrap">
                            <span className="font-bold text-[10px] text-gray-900 dark:text-white">
                              {comment.author?.name}
                            </span>
                            {comment.author?.isAuthor && (
                              <span className="px-1 py-0.1 rounded text-[7px] font-black bg-amber-100 text-amber-800">
                                ✍️ Autor
                              </span>
                            )}
                            {comment.author?.isAdmin && (
                              <span className="px-1 py-0.1 rounded text-[7px] font-black bg-purple-100 text-purple-800 flex items-center gap-0.5">
                                <ShieldCheck size={8} /> Equipa
                              </span>
                            )}
                          </div>
                        )}

                        <p className="whitespace-pre-line leading-relaxed text-[11px] break-words">
                          {comment.content}
                        </p>

                        <div className={`flex items-center justify-between gap-2 mt-1 text-[9px] ${
                          isOwn ? 'text-purple-200' : 'text-gray-400'
                        }`}>
                          <span>{formatTime(comment.createdAt)}</span>

                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => handleLike(commentId)}
                              className={`flex items-center space-x-0.5 cursor-pointer ${
                                isLiked ? 'text-red-500 font-bold' : isOwn ? 'hover:text-white' : 'hover:text-red-500'
                              }`}
                              title="Gostar"
                            >
                              <Heart size={10} className={isLiked ? 'fill-current' : ''} />
                              <span>{comment.likes || 0}</span>
                            </button>

                            <button
                              onClick={() => {
                                setReplyingTo(comment);
                                inputRef.current?.focus();
                              }}
                              className={`cursor-pointer ${isOwn ? 'hover:text-white' : 'hover:text-purple-600'}`}
                              title="Responder"
                            >
                              <CornerDownRight size={10} />
                            </button>

                            {isAdminUser && (
                              <button
                                onClick={() => handleDeleteComment(commentId)}
                                className="hover:text-red-500 cursor-pointer"
                                title="Eliminar"
                              >
                                <Trash2 size={10} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Respostas Aninhadas */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="space-y-1 pl-5 border-l-2 border-purple-200 dark:border-purple-900/60 ml-2">
                        {comment.replies.map(reply => {
                          const isReplyOwn = activeUserEmail && reply.author?.email?.toLowerCase() === activeUserEmail.toLowerCase();
                          const replyId = reply.id || reply._id || '';
                          const isReplyLiked = userLikes.has(replyId);

                          return (
                            <div key={replyId} className={`flex items-end gap-1 ${isReplyOwn ? 'justify-end' : 'justify-start'}`}>
                              {!isReplyOwn && (
                                <div className="w-4 h-4 rounded-full overflow-hidden bg-purple-200 dark:bg-purple-900 flex-shrink-0 flex items-center justify-center text-[8px] font-bold text-purple-800 dark:text-purple-200">
                                  {reply.author?.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                              )}
                              <div 
                                className={`max-w-[85%] rounded-lg p-1.5 shadow-xs ${
                                  isReplyOwn 
                                    ? 'bg-purple-600 text-white rounded-br-xs' 
                                    : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 border border-gray-200/60 dark:border-slate-700/60 rounded-bl-xs'
                                }`}
                              >
                                {!isReplyOwn && (
                                  <div className="flex items-center space-x-1 mb-0.5">
                                    <span className="font-bold text-[9px] text-gray-900 dark:text-white">
                                      {reply.author?.name}
                                    </span>
                                    {reply.author?.isAuthor && (
                                      <span className="px-1 rounded text-[6px] font-bold bg-amber-100 text-amber-800">
                                        Autor
                                      </span>
                                    )}
                                  </div>
                                )}
                                <p className="text-[10px] leading-relaxed break-words whitespace-pre-line">
                                  {reply.content}
                                </p>
                                <div className={`flex items-center justify-between gap-1 mt-0.5 text-[8px] ${
                                  isReplyOwn ? 'text-purple-200' : 'text-gray-400'
                                }`}>
                                  <span>{formatTime(reply.createdAt)}</span>
                                  <button
                                    onClick={() => handleLike(replyId)}
                                    className={`flex items-center space-x-0.5 cursor-pointer ${
                                      isReplyLiked ? 'text-red-500 font-bold' : ''
                                    }`}
                                  >
                                    <Heart size={9} className={isReplyLiked ? 'fill-current' : ''} />
                                    <span>{reply.likes || 0}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </>
      )}

      {/* Faixa de Resposta Activa */}
      {replyingTo && (
        <div className="flex items-center justify-between px-2 py-0.5 mb-1.5 bg-purple-50 dark:bg-purple-950/40 rounded-lg border border-purple-200 dark:border-purple-900 text-[10px] text-purple-800 dark:text-purple-200">
          <span className="line-clamp-1">
            ↩️ A responder a <strong>{replyingTo.author?.name}</strong>
          </span>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="text-purple-500 hover:text-purple-800 ml-2"
          >
            <X size={11} />
          </button>
        </div>
      )}

      {/* Identidade do Usuário Convidado (Discreta) */}
      {!currentUser && (
        <div className="mb-1.5">
          {!guestName || showGuestEdit ? (
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <input
                type="text"
                placeholder="O seu nome *"
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                style={{ color: '#000000', WebkitTextFillColor: '#000000', backgroundColor: '#ffffff', colorScheme: 'light' }}
                className="px-2 py-1 text-[11px] rounded border border-slate-200 text-black bg-white font-medium outline-none"
              />
              <input
                type="email"
                placeholder="O seu e-mail *"
                value={guestEmail}
                onChange={e => setGuestEmail(e.target.value)}
                style={{ color: '#000000', WebkitTextFillColor: '#000000', backgroundColor: '#ffffff', colorScheme: 'light' }}
                className="px-2 py-1 text-[11px] rounded border border-slate-200 text-black bg-white font-medium outline-none"
              />
            </div>
          ) : (
            <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 px-1">
              <span>
                A comentar como <strong>{guestName}</strong>
              </span>
              <button
                type="button"
                onClick={() => setShowGuestEdit(true)}
                className="text-purple-600 dark:text-purple-400 hover:underline font-semibold"
              >
                Alterar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Barra de Chat Compacta (Input + Botão Pequeno) */}
      <form onSubmit={handleSendMessage} className="flex items-center space-x-1.5">
        <input
          ref={inputRef}
          type="text"
          value={messageText}
          onChange={e => setMessageText(e.target.value)}
          placeholder={replyingTo ? `Responder a ${replyingTo.author?.name}...` : "Deixe um comentário... (Enter para enviar)"}
          maxLength={1000}
          disabled={submitting}
          style={{ color: '#000000', WebkitTextFillColor: '#000000', backgroundColor: '#ffffff', colorScheme: 'light' }}
          className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-slate-700 bg-white text-black placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
        />
        <button
          type="submit"
          disabled={submitting || !messageText.trim()}
          className="w-7 h-7 rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center transition disabled:opacity-40 cursor-pointer flex-shrink-0 shadow-xs"
          title="Enviar"
        >
          {submitting ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Send size={12} />
          )}
        </button>
      </form>
    </section>
  );
}
