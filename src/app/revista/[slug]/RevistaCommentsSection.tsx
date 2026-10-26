'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Heart, CornerDownRight, Send, Trash2, 
  CheckCircle2, AlertCircle, Loader2, Sparkles, ShieldCheck,
  X, Minus, Maximize2, User, RefreshCw, MessageCircle
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
  // Chat state
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [comments, setComments] = useState<RevistaCommentItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [replyingTo, setReplyingTo] = useState<RevistaCommentItem | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form input
  const [messageText, setMessageText] = useState<string>('');
  const [guestName, setGuestName] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [showGuestEdit, setShowGuestEdit] = useState<boolean>(false);

  // Current session user if available
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  // Scroll to bottom
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

  // Listen to external custom events to open chat
  useEffect(() => {
    const handleOpenChat = () => {
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 200);
    };
    window.addEventListener('open-revista-chat', handleOpenChat);
    return () => window.removeEventListener('open-revista-chat', handleOpenChat);
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
      console.error('Erro ao buscar comentários do chat:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (storySlug) {
      fetchComments();
    }
  }, [storySlug]);

  // Scroll to bottom when opening or comments change
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isOpen, comments]);

  // Toast
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Submit new message or reply
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim()) return;

    const senderName = currentUser?.name || guestName.trim();
    const senderEmail = currentUser?.email || guestEmail.trim();

    if (!senderName || !senderEmail) {
      setShowGuestEdit(true);
      showToast('error', 'Por favor, indique o seu nome e e-mail para enviar.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
      setShowGuestEdit(true);
      showToast('error', 'Indique um e-mail válido.');
      return;
    }

    // Save guest to localStorage for seamless subsequent chatting
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
        showToast('success', replyingTo ? 'Resposta enviada!' : 'Mensagem enviada com sucesso!');
        await fetchComments(true);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        showToast('error', data.error || 'Erro ao enviar mensagem.');
      }
    } catch {
      showToast('error', 'Falha de ligação ao enviar mensagem.');
    } finally {
      setSubmitting(false);
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

  // Delete Comment (Admin only)
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

  // Format short timestamp
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
    <>
      {/* ── 1. BARRA COMPACTA NO FINAL DO ARTIGO (NÃO OCUPA ESPAÇO) ── */}
      <section 
        id="comentarios"
        className="my-10 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-50/70 via-white to-indigo-50/70 dark:from-slate-900/90 dark:via-slate-900 dark:to-purple-950/20 border border-purple-100 dark:border-purple-900/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-purple-300 dark:hover:border-purple-800"
      >
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20 flex-shrink-0">
            <MessageCircle size={20} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white tracking-tight">
                Chat da História
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40">
                {totalCount} {totalCount === 1 ? 'mensagem' : 'mensagens'}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Tire dúvidas, deixe opiniões e converse com o autor e leitores sem sair da página
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 200);
          }}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-purple-500/20 hover:shadow-purple-500/30 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <MessageSquare size={15} />
          <span>Abrir Chat {totalCount > 0 ? `(${totalCount})` : ''}</span>
        </button>
      </section>

      {/* ── 2. BOTÃO FLUTUANTE DISCRETO (LAUNCHER BOTTOM-RIGHT) ── */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 200);
          }}
          className="fixed bottom-6 right-5 sm:right-6 z-40 flex items-center space-x-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-xl shadow-purple-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Abrir Chat da História"
          aria-label="Abrir Chat da História"
        >
          <div className="relative">
            <MessageCircle size={18} />
            {totalCount > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {totalCount > 99 ? '99+' : totalCount}
              </span>
            )}
          </div>
          <span>Chat da História</span>
        </button>
      )}

      {/* ── 3. MODAL / DRAWER DO CHAT COMPACTO ── */}
      {isOpen && (
        <div 
          className="fixed bottom-4 sm:bottom-6 right-3 sm:right-6 z-50 w-[calc(100vw-24px)] max-w-[380px] h-[520px] max-h-[82vh] bg-white dark:bg-slate-900 border border-purple-200/90 dark:border-purple-900/60 shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          style={{ fontFamily: 'inherit' }}
        >
          {/* Header do Chat */}
          <div className="bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 p-3 sm:p-3.5 text-white flex items-center justify-between shadow-xs select-none">
            <div className="flex items-center space-x-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs text-white backdrop-blur-xs">
                  <MessageSquare size={16} />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-purple-700" />
              </div>
              <div className="leading-tight">
                <h4 className="text-xs sm:text-sm font-bold tracking-tight line-clamp-1">
                  Chat da História
                </h4>
                <p className="text-[10px] text-purple-200">
                  {totalCount} {totalCount === 1 ? 'mensagem' : 'mensagens'} · Em direto
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => fetchComments(false)}
                disabled={loading}
                className="p-1.5 text-purple-200 hover:text-white hover:bg-white/10 rounded-lg transition"
                title="Atualizar mensagens"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-purple-200 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
                title="Fechar chat"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Toast interno */}
          {toast && (
            <div 
              className={`px-3 py-1.5 text-[11px] font-semibold text-white flex items-center justify-between ${
                toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
              }`}
            >
              <span>{toast.message}</span>
              <button onClick={() => setToast(null)}><X size={12} /></button>
            </div>
          )}

          {/* Feed de Mensagens (Bubbles) */}
          <div className="flex-1 p-3 sm:p-3.5 space-y-3 overflow-y-auto bg-slate-50/70 dark:bg-slate-950/40 text-xs">
            {loading && comments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-purple-600 space-y-2">
                <Loader2 size={24} className="animate-spin" />
                <span className="text-[11px] text-gray-400">A carregar chat...</span>
              </div>
            ) : comments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center mb-2">
                  <Sparkles size={20} />
                </div>
                <p className="font-bold text-gray-800 dark:text-gray-200 text-xs">
                  Ainda sem mensagens
                </p>
                <p className="text-[11px] text-gray-400 mt-1 max-w-[200px]">
                  Diga olá, deixe uma pergunta ou partilhe a sua reflexão!
                </p>
              </div>
            ) : (
              comments.map(comment => {
                const isOwn = activeUserEmail && comment.author?.email?.toLowerCase() === activeUserEmail.toLowerCase();
                const commentId = comment.id || comment._id || '';
                const isLiked = userLikes.has(commentId);

                return (
                  <div key={commentId} className="space-y-1.5">
                    {/* Mensagem Principal */}
                    <div className={`flex items-end gap-1.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      {/* Avatar do Autor (se não for própria) */}
                      {!isOwn && (
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-purple-200 dark:bg-purple-900 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-purple-800 dark:text-purple-200">
                          {comment.author?.avatar ? (
                            <img src={comment.author.avatar} alt={comment.author.name} className="w-full h-full object-cover" />
                          ) : (
                            comment.author?.name?.[0]?.toUpperCase() || 'U'
                          )}
                        </div>
                      )}

                      {/* Balão do Chat */}
                      <div 
                        className={`max-w-[82%] rounded-2xl p-2.5 shadow-xs transition ${
                          isOwn 
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-xs' 
                            : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 border border-gray-200/70 dark:border-slate-700/60 rounded-bl-xs'
                        }`}
                      >
                        {/* Autor e Badges */}
                        {!isOwn && (
                          <div className="flex items-center space-x-1.5 mb-1 flex-wrap">
                            <span className="font-extrabold text-[11px] text-gray-900 dark:text-white">
                              {comment.author?.name}
                            </span>
                            {comment.author?.isAuthor && (
                              <span className="px-1 py-0.2 rounded text-[8px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                                ✍️ Autor
                              </span>
                            )}
                            {comment.author?.isAdmin && (
                              <span className="px-1 py-0.2 rounded text-[8px] font-black bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-0.5">
                                <ShieldCheck size={9} /> Equipa
                              </span>
                            )}
                          </div>
                        )}

                        {/* Texto */}
                        <p className="whitespace-pre-line leading-relaxed text-[12px] break-words">
                          {comment.content}
                        </p>

                        {/* Rodapé do Balão: Hora + Ações */}
                        <div className={`flex items-center justify-between gap-2 mt-1.5 pt-1 text-[10px] ${
                          isOwn ? 'text-purple-200 border-t border-purple-500/40' : 'text-gray-400 border-t border-gray-100 dark:border-slate-700/40'
                        }`}>
                          <span>{formatTime(comment.createdAt)}</span>

                          <div className="flex items-center space-x-2">
                            {/* Curtir */}
                            <button
                              onClick={() => handleLike(commentId)}
                              className={`flex items-center space-x-0.5 transition cursor-pointer ${
                                isLiked 
                                  ? 'text-red-500 font-bold' 
                                  : isOwn ? 'hover:text-white text-purple-200' : 'hover:text-red-500 text-gray-400'
                              }`}
                              title="Gostar"
                            >
                              <Heart size={11} className={isLiked ? 'fill-current' : ''} />
                              <span>{comment.likes || 0}</span>
                            </button>

                            {/* Responder */}
                            <button
                              onClick={() => {
                                setReplyingTo(comment);
                                inputRef.current?.focus();
                              }}
                              className={`transition cursor-pointer ${
                                isOwn ? 'hover:text-white text-purple-200' : 'hover:text-purple-600 dark:hover:text-purple-400 text-gray-400'
                              }`}
                              title="Responder"
                            >
                              <CornerDownRight size={11} />
                            </button>

                            {/* Eliminar (Admin) */}
                            {isAdminUser && (
                              <button
                                onClick={() => handleDeleteComment(commentId)}
                                className="text-gray-400 hover:text-red-500 transition cursor-pointer"
                                title="Eliminar"
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Respostas Aninhadas (Sub-balões) */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="space-y-1.5 pl-6 sm:pl-7 border-l-2 border-purple-200 dark:border-purple-900/60 ml-2">
                        {comment.replies.map(reply => {
                          const isReplyOwn = activeUserEmail && reply.author?.email?.toLowerCase() === activeUserEmail.toLowerCase();
                          const replyId = reply.id || reply._id || '';
                          const isReplyLiked = userLikes.has(replyId);

                          return (
                            <div key={replyId} className={`flex items-end gap-1.5 ${isReplyOwn ? 'justify-end' : 'justify-start'}`}>
                              {!isReplyOwn && (
                                <div className="w-5 h-5 rounded-full overflow-hidden bg-purple-200 dark:bg-purple-900 flex-shrink-0 flex items-center justify-center text-[9px] font-bold text-purple-800 dark:text-purple-200">
                                  {reply.author?.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                              )}
                              <div 
                                className={`max-w-[85%] rounded-xl p-2 shadow-xs ${
                                  isReplyOwn 
                                    ? 'bg-purple-600 text-white rounded-br-xs' 
                                    : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 border border-gray-200/60 dark:border-slate-700/60 rounded-bl-xs'
                                }`}
                              >
                                {!isReplyOwn && (
                                  <div className="flex items-center space-x-1 mb-0.5">
                                    <span className="font-bold text-[10px] text-gray-900 dark:text-white">
                                      {reply.author?.name}
                                    </span>
                                    {reply.author?.isAuthor && (
                                      <span className="px-1 py-0.2 rounded text-[7px] font-bold bg-amber-100 text-amber-800">
                                        Autor
                                      </span>
                                    )}
                                  </div>
                                )}
                                <p className="text-[11px] leading-relaxed break-words whitespace-pre-line">
                                  {reply.content}
                                </p>
                                <div className={`flex items-center justify-between gap-1 mt-1 text-[9px] ${
                                  isReplyOwn ? 'text-purple-200' : 'text-gray-400'
                                }`}>
                                  <span>{formatTime(reply.createdAt)}</span>
                                  <button
                                    onClick={() => handleLike(replyId)}
                                    className={`flex items-center space-x-0.5 cursor-pointer ${
                                      isReplyLiked ? 'text-red-500 font-bold' : ''
                                    }`}
                                  >
                                    <Heart size={10} className={isReplyLiked ? 'fill-current' : ''} />
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
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Área Inferior do Chat (Input + Identidade Compacta) */}
          <div className="p-2.5 sm:p-3 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800">
            {/* Banner de Resposta (quando selecionou responder a alguém) */}
            {replyingTo && (
              <div className="flex items-center justify-between px-2.5 py-1 mb-2 bg-purple-50 dark:bg-purple-950/40 rounded-lg border border-purple-200 dark:border-purple-900 text-[11px] text-purple-800 dark:text-purple-200">
                <span className="line-clamp-1">
                  ↩️ A responder a <strong>{replyingTo.author?.name}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="text-purple-500 hover:text-purple-800 ml-2"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Identidade do Remetente (se convidado sem cadastro) */}
            {!currentUser && (
              <div className="mb-2">
                {!guestName || showGuestEdit ? (
                  <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    <input
                      type="text"
                      placeholder="O seu nome *"
                      value={guestName}
                      onChange={e => setGuestName(e.target.value)}
                      className="px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium outline-none focus:border-purple-500"
                    />
                    <input
                      type="email"
                      placeholder="O seu e-mail *"
                      value={guestEmail}
                      onChange={e => setGuestEmail(e.target.value)}
                      className="px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium outline-none focus:border-purple-500"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 px-1">
                    <span>
                      👤 Conectado como <strong>{guestName}</strong>
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

            {/* Input Bar Estilo Chat (Single line / auto send on Enter) */}
            <form onSubmit={handleSendMessage} className="flex items-center space-x-1.5">
              <input
                ref={inputRef}
                type="text"
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                placeholder={replyingTo ? `Responder a ${replyingTo.author?.name}...` : "Escreva uma mensagem..."}
                maxLength={1000}
                disabled={submitting}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
              />
              <button
                type="submit"
                disabled={submitting || !messageText.trim()}
                className="w-8 h-8 rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center transition disabled:opacity-40 cursor-pointer flex-shrink-0 shadow-sm shadow-purple-500/20"
                title="Enviar mensagem"
              >
                {submitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
