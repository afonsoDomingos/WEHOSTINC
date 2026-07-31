'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Mail, Inbox, Send, Star, Trash2, Edit3, Search, RefreshCw, 
  ArrowLeft, CheckCircle2, ShieldCheck, User, Paperclip, Reply, Forward,
  FileText, LogOut, ChevronRight, X, AlertCircle, Sparkles, Clock
} from 'lucide-react';
import { auth, User as AuthUser } from '@/lib/auth';
import { dataManager, EmailAccount } from '@/lib/data';
import { webmailManager, WebmailMessage } from '@/lib/webmail';
import BrandLogo from '@/components/BrandLogo';
import PageLoader from '@/components/PageLoader';

function WebmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialUserParam = searchParams.get('user');

  const [user, setUser] = useState<AuthUser | null>(null);
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [selectedAccountEmail, setSelectedAccountEmail] = useState<string>('');

  const [currentFolder, setCurrentFolder] = useState<'inbox' | 'sent' | 'starred' | 'trash'>('inbox');
  const [messages, setMessages] = useState<WebmailMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<WebmailMessage | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  // Compose Modal State
  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [sentSuccessMsg, setSentSuccessMsg] = useState('');

  // Reply inline
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    const userEmailFilter = currentUser.email;

    const refreshAccounts = (emailList: EmailAccount[]) => {
      // CRITICAL: Only show emails belonging to the currently logged-in user
      const ownEmails = emailList.filter(e =>
        !e.userEmail || e.userEmail.toLowerCase() === userEmailFilter.toLowerCase()
      );
      setAccounts(ownEmails);
      if (!initialUserParam && ownEmails.length > 0) {
        setSelectedAccountEmail(prev => prev || ownEmails[0].email);
      } else if (initialUserParam) {
        setSelectedAccountEmail(initialUserParam);
      }
    };

    const localEmails = dataManager.getEmails().filter(e =>
      !e.userEmail || e.userEmail.toLowerCase() === userEmailFilter.toLowerCase()
    );
    refreshAccounts(localEmails);

    // Sync inicial com servidor (filtrado por utilizador)
    dataManager.fetchEmailsAsync(userEmailFilter).then(emails => {
      refreshAccounts(emails);
    });

    // Polling a cada 3s para sincronizar status (pending → active) quando Admin aprova
    const interval = setInterval(() => {
      dataManager.fetchEmailsAsync(userEmailFilter).then(emails => {
        const ownEmails = emails.filter(e =>
          !e.userEmail || e.userEmail.toLowerCase() === userEmailFilter.toLowerCase()
        );
        setAccounts(ownEmails);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [router, initialUserParam]);

  useEffect(() => {
    if (selectedAccountEmail) {
      const allMsgs = webmailManager.getMessages(selectedAccountEmail);
      setMessages(allMsgs);
      if (allMsgs.length > 0) {
        setSelectedMessage(allMsgs[0]);
      } else {
        setSelectedMessage(null);
      }
    }
  }, [selectedAccountEmail]);

  const refreshMessages = () => {
    if (selectedAccountEmail) {
      const msgs = webmailManager.getMessages(selectedAccountEmail);
      setMessages(msgs);
    }
  };

  const handleSelectMessage = (msg: WebmailMessage) => {
    setSelectedMessage(msg);
    if (!msg.isRead) {
      webmailManager.markAsRead(msg.id, true);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m));
    }
  };

  const handleToggleStar = (msgId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    webmailManager.toggleStar(msgId);
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, starred: !m.starred } : m));
    if (selectedMessage?.id === msgId) {
      setSelectedMessage(prev => prev ? { ...prev, starred: !prev.starred } : null);
    }
  };

  const handleDeleteMessage = (msgId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentFolder === 'trash') {
      webmailManager.deletePermanently(msgId);
      setMessages(prev => prev.filter(m => m.id !== msgId));
      if (selectedMessage?.id === msgId) setSelectedMessage(null);
    } else {
      webmailManager.moveFolder(msgId, 'trash');
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, folder: 'trash' } : m));
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo || !composeBody) return;

    setSendingMsg(true);

    try {
      // 1. Chamar a API real do SendGrid
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'webmail',
          from: selectedAccountEmail,
          to: composeTo,
          subject: composeSubject || '(Sem assunto)',
          body: composeBody,
        }),
      });
      const data = await res.json();

      // 2. Guardar na pasta Enviados (localStorage) independente do resultado real
      webmailManager.sendMessage(
        selectedAccountEmail,
        composeTo,
        composeSubject || '(Sem assunto)',
        composeBody
      );

      setSendingMsg(false);

      if (data.success) {
        setSentSuccessMsg('✅ E-mail enviado com sucesso via SendGrid!');
      } else if (data.fallback) {
        setSentSuccessMsg('📤 E-mail guardado localmente. Configura SENDGRID_API_KEY para envio real.');
      } else {
        setSentSuccessMsg(`⚠️ Erro: ${data.error || 'Falha no envio. Verifica a API Key.'}`);
      }

      setTimeout(() => {
        setShowCompose(false);
        setSentSuccessMsg('');
        setComposeTo('');
        setComposeSubject('');
        setComposeBody('');
        refreshMessages();
      }, 2000);
    } catch (err) {
      console.error('Erro ao enviar e-mail:', err);
      setSendingMsg(false);
      setSentSuccessMsg('❌ Erro de rede. Verifica a ligação e tenta novamente.');
    }
  };

  const [quickReplySending, setQuickReplySending] = useState(false);
  const [quickReplyStatus, setQuickReplyStatus] = useState<'idle' | 'sent' | 'error'>('idle');

  const handleSendQuickReply = async () => {
    if (!replyText || !selectedMessage) return;

    setQuickReplySending(true);

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'webmail',
          from: selectedAccountEmail,
          to: selectedMessage.fromEmail,
          subject: `Re: ${selectedMessage.subject}`,
          body: replyText,
        }),
      });
      const data = await res.json();

      // Guardar na pasta Enviados localmente
      webmailManager.sendMessage(
        selectedAccountEmail,
        selectedMessage.fromEmail,
        `Re: ${selectedMessage.subject}`,
        replyText
      );

      setReplyText('');
      refreshMessages();
      setQuickReplyStatus(data.success ? 'sent' : 'error');
    } catch {
      setQuickReplyStatus('error');
    } finally {
      setQuickReplySending(false);
      setTimeout(() => setQuickReplyStatus('idle'), 3000);
    }
  };

  // Filtragem por Pasta e Pesquisa
  const displayMessages = messages.filter(m => {
    let matchesFolder = false;
    if (currentFolder === 'starred') {
      matchesFolder = m.starred && m.folder !== 'trash';
    } else {
      matchesFolder = m.folder === currentFolder;
    }

    const q = searchQuery.toLowerCase();
    const matchesSearch = q === '' ||
      m.subject.toLowerCase().includes(q) ||
      m.fromName.toLowerCase().includes(q) ||
      m.fromEmail.toLowerCase().includes(q) ||
      m.body.toLowerCase().includes(q);

    return matchesFolder && matchesSearch;
  });

  const currentAccountObj = accounts.find(a => a.email.toLowerCase() === selectedAccountEmail.toLowerCase());
  const isAccountPending = currentAccountObj ? (currentAccountObj.status === 'pending' || !currentAccountObj.status) : false;

  const unreadInboxCount = messages.filter(m => m.folder === 'inbox' && !m.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Webmail Header Bar - Mobile First */}
      <header className="bg-white text-gray-800 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center space-x-2.5 min-w-0">
          <Link href="/dashboard/email" className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition shrink-0" title="Voltar ao Painel">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center space-x-2 shrink-0">
            <BrandLogo />
            <span className="hidden sm:inline-block text-primary-600 font-bold text-xs uppercase tracking-wider bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100">Webmail</span>
          </div>
        </div>

        {/* Account Switcher & Refresh */}
        <div className="flex items-center space-x-2 shrink-0">
          {accounts.length > 0 ? (
            <div className="flex items-center space-x-1.5 bg-gray-100 px-2.5 sm:px-3 py-1.5 rounded-xl border border-gray-200 max-w-[200px] sm:max-w-xs">
              <User className="h-3.5 w-3.5 text-primary-500 shrink-0" />
              <select
                value={selectedAccountEmail}
                onChange={(e) => setSelectedAccountEmail(e.target.value)}
                className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer truncate w-full"
              >
                {accounts.map(acc => {
                  const pending = acc.status === 'pending' || !acc.status;
                  return (
                    <option key={acc.id} value={acc.email} className="bg-white text-gray-900">
                      {acc.email} {pending ? '⏳ (Em Processamento)' : '✓ (Ativo)'}
                    </option>
                  );
                })}
              </select>
            </div>
          ) : (
            <span className="text-xs text-gray-600 font-mono font-bold bg-gray-100 px-2.5 py-1.5 rounded-xl border border-gray-200 truncate max-w-[180px]">
              {selectedAccountEmail}
            </span>
          )}

          <button
            onClick={refreshMessages}
            className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition cursor-pointer shrink-0"
            title="Atualizar"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowCompose(true)}
            className="md:hidden p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-xs transition cursor-pointer shrink-0"
            title="Escrever E-mail"
          >
            <Edit3 className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Banner Informativo de Aprovação Pendente (Se a conta estiver a processar) */}
      {isAccountPending && (
        <div className="bg-amber-50 border-b border-amber-200 px-3.5 sm:px-4 py-2.5 text-amber-950 flex flex-wrap items-center justify-between gap-2 text-xs shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center space-x-2.5">
            <Clock className="h-4 w-4 text-amber-600 animate-pulse shrink-0" />
            <span>
              A conta <strong className="font-mono text-amber-900">{selectedAccountEmail}</strong> está <strong>em processamento de ativação</strong> pelo administrador (Prazo estimado de aprovação: <strong>em até 24 horas</strong>).
            </span>
          </div>
          <span className="text-[11px] font-extrabold bg-amber-200/80 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300 shrink-0">
            ⏳ Aguardando Validação
          </span>
        </div>
      )}

      {/* Mobile Folder Selector Tabs (Visível em Telas Pequenas) */}
      <div className="md:hidden bg-white border-b border-gray-200 px-2 py-2 flex items-center space-x-1 overflow-x-auto text-xs shrink-0">
        <button
          onClick={() => { setCurrentFolder('inbox'); setSelectedMessage(null); }}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap font-bold transition shrink-0 ${
            currentFolder === 'inbox' ? 'bg-primary-600 text-white shadow-2xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Inbox className="h-3.5 w-3.5" />
          <span>Entrada</span>
          {unreadInboxCount > 0 && (
            <span className="bg-white text-primary-600 text-[10px] px-1.5 py-0.2 rounded-full font-black ml-1">
              {unreadInboxCount}
            </span>
          )}
        </button>

        <button
          onClick={() => { setCurrentFolder('starred'); setSelectedMessage(null); }}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap font-bold transition shrink-0 ${
            currentFolder === 'starred' ? 'bg-amber-500 text-white shadow-2xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Star className="h-3.5 w-3.5" />
          <span>Com Estrela</span>
        </button>

        <button
          onClick={() => { setCurrentFolder('sent'); setSelectedMessage(null); }}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap font-bold transition shrink-0 ${
            currentFolder === 'sent' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Send className="h-3.5 w-3.5" />
          <span>Enviados</span>
        </button>

        <button
          onClick={() => { setCurrentFolder('trash'); setSelectedMessage(null); }}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap font-bold transition shrink-0 ${
            currentFolder === 'trash' ? 'bg-rose-600 text-white shadow-2xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Lixeira</span>
        </button>
      </div>

      {/* Main Layout Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar Nav */}
        <aside className="hidden md:flex w-56 bg-white text-gray-600 flex-col p-3 border-r border-gray-200 space-y-4 shrink-0">
          <button
            type="button"
            onClick={() => setShowCompose(true)}
            className="w-full py-3 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Edit3 className="h-4 w-4" />
            <span>Escrever E-mail</span>
          </button>

          <nav className="space-y-1 text-xs font-semibold">
            <button
              onClick={() => setCurrentFolder('inbox')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition cursor-pointer ${
                currentFolder === 'inbox' ? 'bg-primary-50 text-primary-700 border border-primary-200 font-bold' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Inbox className="h-4 w-4 text-primary-500" />
                <span>Entrada</span>
              </div>
              {unreadInboxCount > 0 && (
                <span className="bg-primary-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                  {unreadInboxCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentFolder('starred')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                currentFolder === 'starred' ? 'bg-amber-50 text-amber-700 border border-amber-200 font-bold' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <Star className="h-4 w-4 text-amber-400" />
              <span>Com Estrela</span>
            </button>

            <button
              onClick={() => setCurrentFolder('sent')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                currentFolder === 'sent' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <Send className="h-4 w-4 text-emerald-500" />
              <span>Enviados</span>
            </button>

            <button
              onClick={() => setCurrentFolder('trash')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                currentFolder === 'trash' ? 'bg-rose-50 text-rose-700 border border-rose-200 font-bold' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <Trash2 className="h-4 w-4 text-rose-400" />
              <span>Lixeira</span>
            </button>
          </nav>

          <div className="mt-auto pt-4 border-t border-gray-200 text-[11px] text-gray-400 space-y-2">
            <div className="flex items-center justify-between">
              <span>Cota de Armazenamento</span>
              <span className="font-bold text-gray-600">1.2 / 5 GB</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div className="bg-primary-500 h-full w-[24%]" />
            </div>
            <p className="text-[10px] text-gray-400 text-center">Protegido com SSL WEHOSTHERE</p>
          </div>
        </aside>

        {/* Message List Column - Mobile First */}
        <section className={`w-full md:w-80 lg:w-96 bg-white border-r border-gray-200 flex flex-col shrink-0 ${selectedMessage ? 'hidden md:flex' : 'flex'}`}>
          {/* Search Input */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar e-mails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {displayMessages.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma mensagem nesta pasta.</p>
              </div>
            ) : (
              displayMessages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id;
                return (
                  <div
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg)}
                    className={`p-3.5 cursor-pointer transition flex items-start space-x-3 ${
                      isSelected
                        ? 'bg-primary-50/70 border-l-4 border-primary-600'
                        : msg.isRead
                        ? 'bg-white hover:bg-gray-50'
                        : 'bg-blue-50/40 hover:bg-blue-50/80 font-bold'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={(e) => handleToggleStar(msg.id, e)}
                      className="pt-0.5 text-gray-300 hover:text-amber-400 transition"
                    >
                      <Star className={`h-4 w-4 ${msg.starred ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs truncate ${msg.isRead ? 'text-gray-700 font-medium' : 'text-gray-900 font-extrabold'}`}>
                          {msg.fromName}
                        </span>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                          {new Date(msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <h4 className={`text-xs truncate ${msg.isRead ? 'text-gray-800' : 'text-gray-900 font-bold'}`}>
                        {msg.subject}
                      </h4>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5 leading-relaxed">
                        {msg.body}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Message Viewer Pane - Mobile First */}
        <main className={`w-full flex-1 bg-gray-50 flex flex-col overflow-y-auto ${selectedMessage ? 'flex' : 'hidden md:flex'}`}>
          {selectedMessage ? (
            <div className="p-4 sm:p-6 max-w-4xl mx-auto w-full flex-1 flex flex-col space-y-4 sm:space-y-6">
              
              {/* Mobile Back Button */}
              <div className="md:hidden">
                <button
                  type="button"
                  onClick={() => setSelectedMessage(null)}
                  className="inline-flex items-center space-x-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 px-3.5 py-2 rounded-xl shadow-2xs hover:bg-gray-50 transition cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4 text-primary-600" />
                  <span>Voltar às Mensagens</span>
                </button>
              </div>
              {/* Header card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-4">
                <div className="flex items-start justify-between">
                  <h2 className="text-xl font-extrabold text-gray-900 leading-tight">
                    {selectedMessage.subject}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => handleToggleStar(selectedMessage.id, e)}
                      className="p-2 hover:bg-gray-100 rounded-xl transition"
                    >
                      <Star className={`h-4 w-4 ${selectedMessage.starred ? 'fill-amber-400 text-amber-400' : 'text-gray-400'}`} />
                    </button>
                    <button
                      onClick={() => handleDeleteMessage(selectedMessage.id)}
                      className="p-2 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-xl transition"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className={`w-9 h-9 rounded-full ${selectedMessage.avatarColor || 'bg-primary-600'} text-white flex items-center justify-center font-bold text-sm shadow-sm`}>
                      {selectedMessage.fromName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 text-sm block">{selectedMessage.fromName}</span>
                      <span className="text-gray-500 font-mono text-xs">&lt;{selectedMessage.fromEmail}&gt;</span>
                    </div>
                  </div>
                  <div className="text-right text-gray-400 font-medium text-xs">
                    {new Date(selectedMessage.date).toLocaleDateString('pt-MZ', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              {/* Body card */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200 flex-1 whitespace-pre-line text-sm text-gray-800 leading-relaxed font-sans">
                {selectedMessage.body}
              </div>

              {/* Quick Reply Form */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 space-y-3">
                <span className="text-xs font-bold text-gray-700 flex items-center space-x-1.5">
                  <Reply className="h-4 w-4 text-primary-600" />
                  <span>Resposta Rápida para {selectedMessage.fromEmail}</span>
                </span>
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Escreva a sua resposta..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 font-sans"
                />
                <div className="flex items-center justify-between">
                  {quickReplyStatus !== 'idle' && (
                    <span className={`text-xs font-semibold ${quickReplyStatus === 'sent' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {quickReplyStatus === 'sent' ? '✅ Resposta enviada!' : '❌ Erro ao enviar. Tenta novamente.'}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleSendQuickReply}
                    disabled={!replyText.trim() || quickReplySending}
                    className="ml-auto px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{quickReplySending ? 'A enviar...' : 'Enviar Resposta'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : isAccountPending ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-amber-950">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4 border border-amber-200 shadow-2xs">
                <Clock className="h-8 w-8 text-amber-600 animate-pulse" />
              </div>
              <h3 className="font-extrabold text-gray-900 text-lg mb-1">Conta de E-mail em Ativação (Aguarde Aprovação)</h3>
              <p className="text-xs sm:text-sm text-gray-600 max-w-md leading-relaxed">
                O provisionamento do endereço <strong className="font-mono text-primary-700">{selectedAccountEmail}</strong> está em andamento. O envio, receção e ferramentas completas do Webmail estarão disponíveis assim que o administrador validar a solicitação (prazo estipulado: <strong>em até 24 horas</strong>).
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400">
              <Mail className="h-16 w-16 mb-3 text-gray-300 opacity-60" />
              <h3 className="font-bold text-gray-700 text-base mb-1">Nenhum e-mail selecionado</h3>
              <p className="text-xs text-gray-400">Selecione uma mensagem na lista à esquerda para visualizar.</p>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: Escrever E-mail (Compose) */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-xl w-full border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            {isAccountPending ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600 border border-amber-200 shadow-2xs">
                  <Clock className="h-7 w-7 animate-pulse" />
                </div>
                <h3 className="text-lg font-extrabold text-gray-900">Aprovação em Processamento</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
                  A conta <strong className="font-mono text-primary-700">{selectedAccountEmail}</strong> foi criada e está a ser provisionada nos servidores pela equipa técnica/administrador.
                  <br /><br />
                  <strong>Aviso de Envio:</strong> Poderá escrever e enviar e-mails normalmente assim que a conta for aprovada pelo administrador (o processo é concluído em <strong>até 24 horas</strong>).
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCompose(false)}
                    className="w-full sm:w-auto px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                  >
                    Entendido, Vou Aguardar a Ativação (24h)
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                  <div className="flex items-center space-x-2">
                    <Edit3 className="h-5 w-5 text-primary-600" />
                    <h2 className="text-lg font-extrabold text-gray-900">Novo E-mail</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCompose(false)}
                    className="p-1 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

            {sentSuccessMsg ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                <p className="font-bold text-gray-900">{sentSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleSendEmail} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    De (Remetente)
                  </label>
                  <input
                    type="text"
                    value={selectedAccountEmail}
                    disabled
                    className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Para (Destinatário)
                  </label>
                  <input
                    type="email"
                    value={composeTo}
                    onChange={(e) => setComposeTo(e.target.value)}
                    placeholder="ex: cliente@empresa.co.mz"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Assunto
                  </label>
                  <input
                    type="text"
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    placeholder="Assunto da mensagem"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Mensagem
                  </label>
                  <textarea
                    rows={6}
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    placeholder="Escreva a sua mensagem aqui..."
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 font-sans leading-relaxed"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCompose(false)}
                    className="flex-1 py-3 border border-gray-200 text-gray-700 font-bold text-xs rounded-2xl hover:bg-gray-50 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={sendingMsg}
                    className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold text-xs rounded-2xl transition cursor-pointer shadow-md flex items-center justify-center space-x-2"
                  >
                    <Send className="h-4 w-4" />
                    <span>{sendingMsg ? 'A Enviar...' : 'Enviar E-mail'}</span>
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )}
</div>
  );
}

export default function WebmailPage() {
  return (
    <Suspense fallback={<PageLoader text="A carregar Webmail Client..." />}>
      <WebmailContent />
    </Suspense>
  );
}
