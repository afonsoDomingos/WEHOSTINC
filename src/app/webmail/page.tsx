'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Mail, Inbox, Send, Star, Trash2, Edit3, Search, RefreshCw, 
  ArrowLeft, CheckCircle2, ShieldCheck, User, Paperclip, Reply, Forward,
  FileText, LogOut, ChevronRight, X, AlertCircle, Sparkles, Clock, Printer, Download, Loader2, Filter
} from 'lucide-react';
import { auth, User as AuthUser } from '@/lib/auth';
import { dataManager, EmailAccount } from '@/lib/data';
import { webmailManager, WebmailMessage, WebmailAttachment } from '@/lib/webmail';
import BrandLogo from '@/components/BrandLogo';
import PageLoader from '@/components/PageLoader';
import { apiEndpoint } from '@/lib/siteConfig';

function WebmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialUserParam = searchParams.get('user');

  const [user, setUser] = useState<AuthUser | null>(null);
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [selectedAccountEmail, setSelectedAccountEmail] = useState<string>('');

  const [currentFolder, setCurrentFolder] = useState<'inbox' | 'sent' | 'starred' | 'trash' | 'drafts'>('inbox');
  const [messages, setMessages] = useState<WebmailMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<WebmailMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter & Refresh State
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'attachments' | 'starred'>('all');
  const [isRefreshingWebmail, setIsRefreshingWebmail] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Compose Modal & Attachment State
  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeAttachments, setComposeAttachments] = useState<WebmailAttachment[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [sentSuccessMsg, setSentSuccessMsg] = useState('');
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);

  // Reply inline
  const [replyText, setReplyText] = useState('');

  // Auto-save draft
  useEffect(() => {
    if (!showCompose) return;
    
    const autoSaveInterval = setInterval(() => {
      if (composeTo || composeSubject || composeBody) {
        webmailManager.saveDraft(
          selectedAccountEmail,
          composeTo,
          composeSubject,
          composeBody,
          composeAttachments
        );
      }
    }, 5000); // Auto-save a cada 5 segundos

    return () => clearInterval(autoSaveInterval);
  }, [showCompose, composeTo, composeSubject, composeBody, composeAttachments, selectedAccountEmail]);

  const handleComposeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validação de tamanho (máximo 10MB)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      alert('O ficheiro é muito grande! O tamanho máximo permitido é 10MB.');
      return;
    }

    // Validação de tipo
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip'
    ];
    
    if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/')) {
      alert('Tipo de ficheiro não permitido. Formatos aceitos: PDF, Imagens, Word, Excel, Texto, ZIP.');
      return;
    }

    setUploadingAttachment(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(apiEndpoint('/api/upload'), {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          setComposeAttachments(prev => [
            ...prev,
            {
              url: data.url,
              name: data.name || file.name,
              size: data.bytes || file.size,
              type: file.type
            }
          ]);
        }
      } else {
        alert('Erro ao fazer upload do ficheiro. Tente novamente.');
      }
    } catch (err) {
      console.error('Erro no upload de anexo do webmail:', err);
      alert('Erro de conexão ao fazer upload. Verifique sua internet.');
    } finally {
      setUploadingAttachment(false);
      e.target.value = '';
    }
  };

  const handleRemoveComposeAttachment = (index: number) => {
    setComposeAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveDraftManually = () => {
    webmailManager.saveDraft(
      selectedAccountEmail,
      composeTo,
      composeSubject,
      composeBody,
      composeAttachments
    );
    setEditingDraftId(null);
    refreshMessages();
    setSentSuccessMsg('💾 Rascunho guardado com sucesso!');
    setTimeout(() => {
      setShowCompose(false);
      setSentSuccessMsg('');
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      setComposeAttachments([]);
    }, 1500);
  };

  const handleCloseCompose = () => {
    // Se houver conteúdo, salvar como rascunho
    if (composeTo || composeSubject || composeBody) {
      webmailManager.saveDraft(
        selectedAccountEmail,
        composeTo,
        composeSubject,
        composeBody,
        composeAttachments
      );
      refreshMessages();
    }
    setShowCompose(false);
    setEditingDraftId(null);
    setComposeTo('');
    setComposeSubject('');
    setComposeBody('');
    setComposeAttachments([]);
  };

  const handleInsertSignature = () => {
    const sig = `\n\n--\nCumprimentos,\n${user?.name || 'Equipa'}\n${selectedAccountEmail}\nWEHOSTHERE Platform`;
    setComposeBody(prev => prev + sig);
  };

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    const userEmailFilter = currentUser.email;

    // Clean up stale shared localStorage data and migrate to per-user key
    dataManager.initUserEmails(userEmailFilter);

    const refreshAccounts = (emailList: EmailAccount[]) => {
      setAccounts(emailList);
      if (!initialUserParam && emailList.length > 0) {
        setSelectedAccountEmail(prev => prev || emailList[0].email);
      } else if (initialUserParam) {
        setSelectedAccountEmail(initialUserParam);
      }
    };

    // Load strictly from user-specific key
    const localEmails = dataManager.getEmails(userEmailFilter);
    refreshAccounts(localEmails);

    // Sync inicial com servidor (filtrado por utilizador)
    dataManager.fetchEmailsAsync(userEmailFilter).then(emails => {
      refreshAccounts(emails);
    });

    // Polling a cada 3s para sincronizar status (pending → active) quando Admin aprova
    const interval = setInterval(() => {
      dataManager.fetchEmailsAsync(userEmailFilter).then(emails => {
        setAccounts(emails);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [router, initialUserParam]);

  useEffect(() => {
    if (selectedAccountEmail) {
      setIsLoadingMessages(true);
      // Simulate loading delay for skeleton
      setTimeout(() => {
        const allMsgs = webmailManager.getMessages(selectedAccountEmail);
        setMessages(allMsgs);
        if (allMsgs.length > 0) {
          setSelectedMessage(allMsgs[0]);
        } else {
          setSelectedMessage(null);
        }
        setIsLoadingMessages(false);
      }, 300);
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
    
    // Se for um rascunho, abrir no compose modal
    if (msg.folder === 'drafts') {
      setComposeTo(msg.toEmail);
      setComposeSubject(msg.subject);
      setComposeBody(msg.body);
      setComposeAttachments(msg.attachments || []);
      setEditingDraftId(msg.id);
      setShowCompose(true);
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
      const res = await fetch(apiEndpoint('/api/send-email'), {
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
        composeBody,
        composeAttachments
      );

      // 3. Remover rascunho se existir
      if (editingDraftId) {
        webmailManager.deletePermanently(editingDraftId);
        setEditingDraftId(null);
      }

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
        setComposeAttachments([]);
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
      const res = await fetch(apiEndpoint('/api/send-email'), {
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

  // Filtragem por Pasta, Filtros e Pesquisa
  const displayMessages = messages.filter(m => {
    let matchesFolder = false;
    if (currentFolder === 'starred') {
      matchesFolder = m.starred && m.folder !== 'trash';
    } else {
      matchesFolder = m.folder === currentFolder;
    }

    let matchesFilter = true;
    if (filterType === 'unread') matchesFilter = !m.isRead;
    if (filterType === 'attachments') matchesFilter = !!(m.attachments && m.attachments.length > 0);
    if (filterType === 'starred') matchesFilter = m.starred;

    const q = searchQuery.toLowerCase();
    const matchesSearch = q === '' ||
      m.subject.toLowerCase().includes(q) ||
      m.fromName.toLowerCase().includes(q) ||
      m.fromEmail.toLowerCase().includes(q) ||
      m.body.toLowerCase().includes(q);

    return matchesFolder && matchesFilter && matchesSearch;
  });

  const currentAccountObj = accounts.find(a => a.email.toLowerCase() === selectedAccountEmail.toLowerCase());
  const isAccountPending = currentAccountObj ? (currentAccountObj.status === 'pending' || !currentAccountObj.status) : false;

  const unreadInboxCount = messages.filter(m => m.folder === 'inbox' && !m.isRead).length;
  const draftsCount = messages.filter(m => m.folder === 'drafts').length;

  // Calcular armazenamento real baseado no plano do usuário
  const getStorageInfo = () => {
    const planLimits: Record<string, number> = {
      basic: 10,
      pro: 50,
      enterprise: 200
    };
    
    const limit = planLimits[user?.plan || 'basic'] || 10;
    const used = accounts.reduce((total, acc) => total + (acc.storage || 0), 0);
    const percentage = (used / limit) * 100;
    
    return {
      used,
      limit,
      percentage,
      remaining: Math.max(0, limit - used),
      isUnlimited: user?.plan === 'enterprise'
    };
  };

  const storageInfo = getStorageInfo();

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
            onClick={() => {
              setIsRefreshingWebmail(true);
              refreshMessages();
              setTimeout(() => setIsRefreshingWebmail(false), 600);
            }}
            className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition cursor-pointer shrink-0"
            title="Atualizar Caixa Postal"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshingWebmail ? 'animate-spin text-primary-600' : ''}`} />
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

        <button
          onClick={() => { setCurrentFolder('drafts'); setSelectedMessage(null); }}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap font-bold transition shrink-0 ${
            currentFolder === 'drafts' ? 'bg-purple-600 text-white shadow-2xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Rascunhos</span>
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

            <button
              onClick={() => setCurrentFolder('drafts')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition cursor-pointer ${
                currentFolder === 'drafts' ? 'bg-purple-50 text-purple-700 border border-purple-200 font-bold' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <FileText className="h-4 w-4 text-purple-400" />
                <span>Rascunhos</span>
              </div>
              {draftsCount > 0 && (
                <span className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                  {draftsCount}
                </span>
              )}
            </button>
          </nav>

          <div className="mt-auto pt-4 border-t border-gray-200 text-[11px] text-gray-400 space-y-2">
            <div className="flex items-center justify-between">
              <span>Cota de Armazenamento</span>
              <span className="font-bold text-gray-600">
                {storageInfo.isUnlimited 
                  ? `${storageInfo.used.toFixed(1)} / ∞ GB` 
                  : `${storageInfo.used.toFixed(1)} / ${storageInfo.limit} GB`
                }
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  storageInfo.percentage > 90 ? 'bg-red-500' :
                  storageInfo.percentage > 70 ? 'bg-amber-500' :
                  'bg-primary-500'
                }`}
                style={{ width: `${storageInfo.isUnlimited ? Math.min(storageInfo.percentage, 100) : storageInfo.percentage}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 text-center">
              {storageInfo.isUnlimited 
                ? 'Plano Empresarial - Armazenamento Ilimitado' 
                : `${storageInfo.remaining.toFixed(1)} GB disponíveis`
              }
            </p>
          </div>
        </aside>

        {/* Message List Column - Mobile First */}
        <section className={`w-full md:w-80 lg:w-96 bg-white border-r border-gray-200 flex flex-col shrink-0 ${selectedMessage ? 'hidden md:flex' : 'flex'}`}>
          {/* Search Input & Filter Pills */}
          <div className="p-3 border-b border-gray-100 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar e-mails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 font-medium"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center space-x-1 text-[11px] font-semibold overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap transition cursor-pointer ${
                  filterType === 'all' ? 'bg-primary-600 text-white font-bold' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setFilterType('unread')}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap transition cursor-pointer ${
                  filterType === 'unread' ? 'bg-primary-600 text-white font-bold' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Não lidas
              </button>
              <button
                type="button"
                onClick={() => setFilterType('attachments')}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap transition cursor-pointer flex items-center space-x-1 ${
                  filterType === 'attachments' ? 'bg-primary-600 text-white font-bold' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Paperclip className="w-3 h-3" />
                <span>Anexos</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterType('starred')}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap transition cursor-pointer flex items-center space-x-1 ${
                  filterType === 'starred' ? 'bg-amber-500 text-white font-bold' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Star className="w-3 h-3" />
                <span>Estrela</span>
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {isLoadingMessages ? (
              // Skeleton Loading
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 mx-2 my-2 animate-pulse">
                  <div className="flex items-start space-x-3">
                    <div className="w-4 h-4 bg-gray-200 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="h-4 bg-gray-200 rounded w-1/3" />
                        <div className="h-3 bg-gray-200 rounded w-16" />
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                      <div className="h-3 bg-gray-200 rounded w-full" />
                    </div>
                  </div>
                </div>
              ))
            ) : displayMessages.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma mensagem nesta pasta.</p>
              </div>
            ) : (
              displayMessages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id;
                const hasAtt = msg.attachments && msg.attachments.length > 0;
                const imageAttachment = msg.attachments?.find(att => att.type?.startsWith('image/'));
                return (
                  <div
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg)}
                    className={`p-4 cursor-pointer transition-all duration-200 flex items-start space-x-3 rounded-2xl mx-2 my-2 ${
                      isSelected
                        ? 'bg-gradient-to-r from-primary-50 to-primary-100/50 border-2 border-primary-300 shadow-md'
                        : msg.isRead
                        ? 'bg-white hover:bg-gray-50 hover:shadow-sm border border-transparent'
                        : 'bg-gradient-to-r from-blue-50/60 to-indigo-50/40 hover:from-blue-50/80 hover:to-indigo-50/60 border border-blue-200/50 shadow-sm'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={(e) => handleToggleStar(msg.id, e)}
                      className="pt-0.5 text-gray-300 hover:text-amber-400 transition shrink-0"
                    >
                      <Star className={`h-4 w-4 ${msg.starred ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-sm truncate ${msg.isRead ? 'text-gray-700 font-semibold' : 'text-gray-900 font-extrabold'}`}>
                          {msg.fromName}
                        </span>
                        <div className="flex items-center space-x-1.5 ml-2 shrink-0">
                          {hasAtt && <Paperclip className="h-3.5 w-3.5 text-gray-400" />}
                          <span className="text-[11px] text-gray-400 whitespace-nowrap font-medium">
                            {new Date(msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <h4 className={`text-sm truncate mb-1 ${msg.isRead ? 'text-gray-800 font-semibold' : 'text-gray-900 font-bold'}`}>
                        {msg.subject}
                      </h4>
                      <p className="text-xs text-gray-500 truncate mt-0.5 leading-relaxed">
                        {msg.body}
                      </p>
                      {imageAttachment && (
                        <div className="mt-2 flex items-center space-x-2">
                          <img 
                            src={imageAttachment.url} 
                            alt="Preview" 
                            className="h-8 w-8 rounded-lg object-cover border border-gray-200"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                          <span className="text-[10px] text-gray-400">📷 Imagem anexada</span>
                        </div>
                      )}
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
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 space-y-4">
                <div className="flex items-start justify-between">
                  <h2 className="text-2xl font-extrabold text-gray-900 leading-tight">
                    {selectedMessage.subject}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => window.print()}
                      className="p-2.5 hover:bg-gray-100 text-gray-500 rounded-2xl transition cursor-pointer"
                      title="Imprimir e-mail"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => handleToggleStar(selectedMessage.id, e)}
                      className="p-2.5 hover:bg-gray-100 rounded-2xl transition cursor-pointer"
                    >
                      <Star className={`h-4 w-4 ${selectedMessage.starred ? 'fill-amber-400 text-amber-400' : 'text-gray-400'}`} />
                    </button>
                    <button
                      onClick={() => handleDeleteMessage(selectedMessage.id)}
                      className="p-2.5 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-2xl transition cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full ${selectedMessage.avatarColor || 'bg-primary-600'} text-white flex items-center justify-center font-bold text-sm shadow-md`}>
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
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200 flex-1 space-y-4">
                <div className="whitespace-pre-line text-sm text-gray-800 leading-relaxed font-sans">
                  {selectedMessage.body}
                </div>

                {/* Exibição de Ficheiros Anexados */}
                {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
                    <span className="text-xs font-bold text-gray-700 flex items-center space-x-1.5">
                      <Paperclip className="h-4 w-4 text-primary-600" />
                      <span>{selectedMessage.attachments.length} Ficheiro(s) Anexado(s)</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedMessage.attachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 bg-gray-50 hover:bg-primary-50/50 rounded-xl border border-gray-200 flex items-center justify-between transition group"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <FileText className="h-4 w-4 text-primary-600 shrink-0" />
                            <span className="text-xs font-bold text-gray-800 truncate group-hover:text-primary-700">{att.name}</span>
                          </div>
                          <Download className="h-3.5 w-3.5 text-gray-400 group-hover:text-primary-600 shrink-0 ml-2" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
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
                    onClick={handleCloseCompose}
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      Mensagem
                    </label>
                    <button
                      type="button"
                      onClick={handleInsertSignature}
                      className="text-[11px] font-bold text-primary-600 hover:text-primary-800 bg-primary-50 hover:bg-primary-100 px-2.5 py-1 rounded-lg border border-primary-200 transition cursor-pointer flex items-center space-x-1"
                    >
                      <span>✍️ Inserir Assinatura</span>
                    </button>
                  </div>
                  <textarea
                    rows={5}
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    placeholder="Escreva a sua mensagem aqui..."
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 font-sans leading-relaxed"
                    required
                  />
                </div>

                {/* Upload de Anexos no Compose */}
                <div className="space-y-2 pt-1 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl transition border border-emerald-200">
                      {uploadingAttachment ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      ) : (
                        <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      <span>{uploadingAttachment ? 'A carregar anexo...' : '📎 Anexar Ficheiro'}</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleComposeFileUpload}
                        disabled={uploadingAttachment}
                      />
                    </label>
                    <span className="text-[10px] text-gray-400">PDF, Imagens, Documentos</span>
                  </div>

                  {composeAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {composeAttachments.map((att, idx) => (
                        <div key={idx} className="flex items-center space-x-1.5 px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-lg text-xs">
                          <FileText className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                          <span className="font-bold text-gray-800 truncate max-w-[150px]">{att.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveComposeAttachment(idx)}
                            className="text-gray-400 hover:text-red-600 transition p-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseCompose}
                    className="flex-1 py-3 border border-gray-200 text-gray-700 font-bold text-xs rounded-2xl hover:bg-gray-50 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDraftManually}
                    disabled={sendingMsg || uploadingAttachment}
                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-2xl transition cursor-pointer shadow-md flex items-center justify-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Salvar Rascunho</span>
                  </button>
                  <button
                    type="submit"
                    disabled={sendingMsg || uploadingAttachment}
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
