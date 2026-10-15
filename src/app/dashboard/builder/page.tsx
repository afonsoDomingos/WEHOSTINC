'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Sparkles, Send, Globe, Code, Eye, Laptop, Tablet, Smartphone, 
  RotateCw, ExternalLink, Share2, Plus, Trash2, ArrowLeft, Check, 
  Copy, CheckCircle2, ChevronRight, ChevronLeft, ChevronDown, 
  MessageSquare, Layers, Wand2, Clock, AlertCircle, RefreshCw, X,
  PanelLeftClose, PanelLeftOpen, Maximize2, Minimize2,
  UtensilsCrossed, Scissors, Palmtree, Briefcase, Palette, Tag,
  History, Undo2, Download, ShoppingBag
} from 'lucide-react';
import { auth, User } from '@/lib/auth';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  diffSummary?: string;
  executionSeconds?: number;
}

interface ProjectVersion {
  versionNumber: number;
  html: string;
  prompt: string;
  timestamp: string;
}

interface SavedProject {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  updatedAt: string;
  htmlContent: string;
  promptHistory: ChatMessage[];
  versions?: { versionNumber: number; htmlContent: string; prompt?: string; createdAt: string }[];
}

export default function AiSiteBuilderStudio() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Estados do Projecto
  const [projectId, setProjectId] = useState<string>('');
  const [projectTitle, setProjectTitle] = useState<string>('Meu Novo Site');
  const [projectSlug, setProjectSlug] = useState<string>('meu-site');
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [currentHtml, setCurrentHtml] = useState<string>('');
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(true);

  // Estados de Histórico de Versões (Latest Version, v1, v2, etc.)
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState<number | 'latest'>('latest');
  const [isVersionDropdownOpen, setIsVersionDropdownOpen] = useState<boolean>(false);

  // Estados da Conversa / Prompt
  const [prompt, setPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const versionMenuRef = useRef<HTMLDivElement>(null);

  // Estados de Interface e Layout
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedSubdomain, setCopiedSubdomain] = useState<boolean>(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  // Estado para redimensionamento manual do Chat (Arrastar borda)
  const [chatWidth, setChatWidth] = useState<number>(420);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Efeito de arrasto para redimensionar largura do chat
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const sidebarOffset = isSidebarOpen ? (window.innerWidth < 640 ? 256 : 288) : 0;
      const newWidth = e.clientX - sidebarOffset;
      if (newWidth >= 260 && newWidth <= Math.min(820, window.innerWidth - 380)) {
        setChatWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, isSidebarOpen]);

  // Fechar dropdown de versão ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (versionMenuRef.current && !versionMenuRef.current.contains(event.target as Node)) {
        setIsVersionDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Carregar utilizador e projetos (aguarda NextAuth terminar carregamento para não redirecionar indevidamente)
  useEffect(() => {
    if (status === 'loading') return;

    let user: User | null = null;
    if (status === 'authenticated' && session?.user) {
      user = {
        id: (session.user as any)?.id || session.user.email || '',
        name: session.user.name || 'Utilizador',
        email: session.user.email || '',
        plan: (session.user as any)?.plan || 'free',
        status: (session.user as any)?.status || 'active',
        role: (session.user as any)?.role || 'user',
        createdAt: new Date().toISOString()
      };
    } else {
      user = auth.getCurrentUser();
    }

    if (!user) {
      router.push('/login');
      return;
    }

    setCurrentUser(user);
    setAuthLoading(false);
    loadUserProjects(user.email);
  }, [session, status]);

  // Carregar lista de projetos do utilizador
  const loadUserProjects = async (email: string) => {
    setIsLoadingProjects(true);
    try {
      const res = await fetch(`/api/ai/sites?userEmail=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        const list: SavedProject[] = data.sites || [];
        setSavedProjects(list);

        if (list.length > 0 && !projectId) {
          selectProject(list[0]);
        } else if (!projectId) {
          initNewProject();
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar projetos de IA:', err);
      initNewProject();
    } finally {
      setIsLoadingProjects(false);
    }
  };

  // Inicializar novo projeto em branco
  const initNewProject = () => {
    const newId = `site_${Date.now()}`;
    const defaultTitle = 'Novo Projeto';
    const defaultSlug = `site-${Math.random().toString(36).substring(2, 6)}`;
    setProjectId(newId);
    setProjectTitle(defaultTitle);
    setProjectSlug(defaultSlug);
    setIsPublished(false);
    setCurrentHtml('');
    setVersions([]);
    setSelectedVersionIndex('latest');
    setMessages([
      {
        id: 'msg_welcome',
        role: 'assistant',
        content: 'Olá! Sou o Construtor de Sites IA da WEHOSTHERE. O que gostaria de criar hoje? Digite o que tem em mente no campo de texto abaixo ou selecione um modelo pronto para começar!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Selecionar projeto existente
  const selectProject = (proj: SavedProject) => {
    setProjectId(proj.id);
    setProjectTitle(proj.title);
    setProjectSlug(proj.slug);
    setIsPublished(proj.status === 'published');
    setCurrentHtml(proj.htmlContent);

    // Reconstruir lista de versões salvas
    if (proj.versions && proj.versions.length > 0) {
      const parsedVersions: ProjectVersion[] = proj.versions.map((v) => ({
        versionNumber: v.versionNumber,
        html: v.htmlContent,
        prompt: v.prompt || 'Atualização de código',
        timestamp: new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
      setVersions(parsedVersions);
    } else if (proj.htmlContent) {
      setVersions([
        {
          versionNumber: 1,
          html: proj.htmlContent,
          prompt: 'Versão Inicial',
          timestamp: new Date(proj.updatedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } else {
      setVersions([]);
    }

    setSelectedVersionIndex('latest');
    setMessages(proj.promptHistory && proj.promptHistory.length > 0 ? proj.promptHistory : [
      {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: `Projeto "${proj.title}" carregado com sucesso. Como gostaria de aprimorá-lo agora?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Gerar ou atualizar site com IA
  const handleGenerate = async (promptText?: string, titleOverride?: string, isInitial: boolean = false) => {
    const textToSend = promptText || prompt;
    if (!textToSend.trim() || isGenerating) return;

    const userEmail = currentUser?.email || 'admin@wehosthere.com';
    const newMsgId = `msg_user_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: newMsgId,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setPrompt('');
    setIsGenerating(true);

    try {
      const res = await fetch('/api/ai/site-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          currentHtml: isInitial ? '' : currentHtml,
          title: titleOverride || projectTitle,
          userEmail
        })
      });

      if (!res.ok) throw new Error('Falha ao processar IA');

      const data = await res.json();
      if (data.success && data.html) {
        setCurrentHtml(data.html);

        const aiMsg: ChatMessage = {
          id: `msg_ai_${Date.now()}`,
          role: 'assistant',
          content: data.explanation || 'A página foi gerada e validada no preview.',
          diffSummary: data.diffSummary || '+45 / -12',
          executionSeconds: data.executionSeconds || 4,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const updatedMessages = [...messages, userMsg, aiMsg];
        setMessages(updatedMessages);

        // Adicionar à lista de versões
        const nextVersionNumber = versions.length + 1;
        const newVersionObj: ProjectVersion = {
          versionNumber: nextVersionNumber,
          html: data.html,
          prompt: textToSend,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const updatedVersions = [...versions, newVersionObj];
        setVersions(updatedVersions);
        setSelectedVersionIndex('latest');

        // Guardar no MongoDB
        saveProjectToDb({
          id: projectId,
          userEmail,
          userName: currentUser?.name || 'Cliente',
          title: titleOverride || projectTitle,
          slug: projectSlug,
          subdomain: projectSlug,
          htmlContent: data.html,
          promptHistory: updatedMessages,
          versions: updatedVersions.map(v => ({
            versionNumber: v.versionNumber,
            htmlContent: v.html,
            prompt: v.prompt,
            createdAt: new Date().toISOString()
          })),
          status: isPublished ? 'published' : 'draft'
        });
      }
    } catch (err) {
      console.error('Erro na geração com IA:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          role: 'assistant',
          content: 'Houve uma instabilidade momentânea na conexão com o modelo de IA. Por favor, tente novamente.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsGenerating(false);
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Guardar no banco de dados
  const saveProjectToDb = async (payload: any) => {
    try {
      const res = await fetch('/api/ai/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSavedProjects(prev => {
          const index = prev.findIndex(p => p.id === payload.id);
          if (index >= 0) {
            const next = [...prev];
            next[index] = { ...next[index], ...payload };
            return next;
          }
          return [payload, ...prev];
        });
      }
    } catch (err) {
      console.warn('Erro ao guardar rascunho de IA:', err);
    }
  };

  // Publicar o site oficialmente
  const handlePublish = async () => {
    if (!currentUser?.email || !currentHtml) return;
    setIsPublishing(true);
    try {
      const res = await fetch('/api/ai/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: projectId,
          userEmail: currentUser.email,
          userName: currentUser.name,
          title: projectTitle,
          slug: projectSlug,
          subdomain: projectSlug,
          htmlContent: displayedHtml,
          promptHistory: messages,
          versions: versions.map(v => ({
            versionNumber: v.versionNumber,
            htmlContent: v.html,
            prompt: v.prompt,
            createdAt: new Date().toISOString()
          })),
          status: 'published'
        })
      });

      if (res.ok) {
        setIsPublished(true);
      }
    } catch (err) {
      console.error('Erro ao publicar site:', err);
    } finally {
      setIsPublishing(false);
    }
  };

  // Obter o HTML ativo para exibição (Latest ou versão específica)
  const displayedHtml = selectedVersionIndex === 'latest'
    ? currentHtml
    : versions[selectedVersionIndex]?.html || currentHtml;

  // Restaurar uma versão antiga como atual
  const handleRestoreVersion = (index: number) => {
    const targetVersion = versions[index];
    if (!targetVersion) return;
    setCurrentHtml(targetVersion.html);
    setSelectedVersionIndex('latest');

    // Registar no chat
    setMessages(prev => [
      ...prev,
      {
        id: `msg_restore_${Date.now()}`,
        role: 'assistant',
        content: `A Versão ${targetVersion.versionNumber} ("${targetVersion.prompt}") foi restaurada como versão atual de trabalho.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    // Criar nova entrada de versão
    const nextVer: ProjectVersion = {
      versionNumber: versions.length + 1,
      html: targetVersion.html,
      prompt: `Restaurada a Versão ${targetVersion.versionNumber}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updated = [...versions, nextVer];
    setVersions(updated);

    if (currentUser?.email) {
      saveProjectToDb({
        id: projectId,
        userEmail: currentUser.email,
        userName: currentUser.name,
        title: projectTitle,
        slug: projectSlug,
        subdomain: projectSlug,
        htmlContent: targetVersion.html,
        promptHistory: messages,
        versions: updated.map(v => ({
          versionNumber: v.versionNumber,
          htmlContent: v.html,
          prompt: v.prompt,
          createdAt: new Date().toISOString()
        })),
        status: isPublished ? 'published' : 'draft'
      });
    }
  };

  // Navegar entre versões com setas < e >
  const handleStepVersion = (direction: 'prev' | 'next') => {
    if (versions.length <= 1) return;
    const currentIndex = selectedVersionIndex === 'latest' ? versions.length - 1 : selectedVersionIndex;
    
    if (direction === 'prev') {
      const prevIndex = Math.max(0, currentIndex - 1);
      setSelectedVersionIndex(prevIndex);
    } else {
      if (currentIndex >= versions.length - 1) {
        setSelectedVersionIndex('latest');
      } else {
        const nextIndex = currentIndex + 1;
        if (nextIndex === versions.length - 1) {
          setSelectedVersionIndex('latest');
        } else {
          setSelectedVersionIndex(nextIndex);
        }
      }
    }
  };

  // Abrir em Nova Aba (Funciona sempre: tanto publicado como preview em tempo real via Blob URL)
  const handleOpenInNewTab = () => {
    if (isPublished) {
      // Abre o subdomínio ou URL público
      window.open(subdomainUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Abre um preview em tempo real no browser via Blob HTML
      try {
        const blob = new Blob([displayedHtml], { type: 'text/html;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      } catch (e) {
        // Fallback para rota local
        window.open(`/site/${projectSlug}`, '_blank');
      }
    }
  };

  const handleCopyCode = () => {
    if (!displayedHtml) return;
    navigator.clipboard.writeText(displayedHtml);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // URLs de Subdomínio e Direto
  const subdomainHost = typeof window !== 'undefined' && window.location.host.includes('localhost')
    ? `${projectSlug}.localhost:3000`
    : `${projectSlug}.wehosthere.com`;

  const subdomainUrl = `https://${subdomainHost}`;
  const directPathUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/site/${projectSlug}`
    : `https://www.wehosthere.com/site/${projectSlug}`;

  const handleCopySubdomain = () => {
    navigator.clipboard.writeText(subdomainUrl);
    setCopiedSubdomain(true);
    setTimeout(() => setCopiedSubdomain(false), 2000);
  };

  const handleCopyDirectLink = () => {
    navigator.clipboard.writeText(directPathUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadHtml = () => {
    if (!displayedHtml) return;
    const blob = new Blob([displayedHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectSlug || 'meu-site'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteProject = async (id: string) => {
    if (!currentUser?.email) return;
    if (!confirm('Deseja realmente eliminar este site?')) return;
    try {
      const res = await fetch(`/api/ai/sites?id=${encodeURIComponent(id)}&userEmail=${encodeURIComponent(currentUser.email)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSavedProjects(prev => prev.filter(p => p.id !== id));
        if (projectId === id) {
          initNewProject();
        }
      }
    } catch (err) {
      console.warn('Erro ao eliminar projeto:', err);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#09090b] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-12 h-12 flex items-center justify-center animate-pulse drop-shadow-[0_0_25px_rgba(37,99,235,0.45)]">
            <Image
              src="/mascote-transparent.png"
              alt="Mascote WEHOSTHERE"
              width={48}
              height={48}
              className="object-contain"
              priority
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
            <span>A carregar Studio AI...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#09090b] text-[#fafafa] font-sans overflow-hidden antialiased selection:bg-blue-600 selection:text-white">

      {/* ── COLUNA 1: SIDEBAR DE PROJETOS E CONVERSAS (Estilo v0) ─────────────── */}
      <aside className={`h-full border-r border-[#27272a] bg-[#0c0c0e] flex flex-col transition-all duration-300 z-30 shrink-0 ${
        isSidebarOpen ? 'w-64 sm:w-72' : 'w-0 -translate-x-full overflow-hidden border-r-0'
      }`}>
        {/* Header da Sidebar */}
        <div className="p-3.5 border-b border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 flex items-center justify-center drop-shadow-[0_2px_12px_rgba(37,99,235,0.35)] shrink-0">
              <Image
                src="/mascote-transparent.png"
                alt="Mascote WEHOSTHERE"
                width={32}
                height={32}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <span className="font-extrabold text-xs sm:text-sm tracking-tight block">WEHOSTHERE</span>
              <span className="text-[10px] text-blue-400 font-semibold tracking-wide uppercase flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Studio AI
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
              title="Encolher Barra Lateral"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
            <Link
              href="/dashboard"
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition"
              title="Voltar ao Painel"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Botão Novo Site / Nova Conversa */}
        <div className="p-3">
          <button
            onClick={initNewProject}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nova Conversa / Site
          </button>
        </div>

        {/* Lista de Projetos Salvos */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">Seus Projetos</p>
          {isLoadingProjects ? (
            <div className="space-y-2 p-2">
              <div className="h-9 bg-white/5 rounded-lg animate-pulse" />
              <div className="h-9 bg-white/5 rounded-lg animate-pulse" />
            </div>
          ) : savedProjects.length === 0 ? (
            <p className="text-xs text-gray-500 px-2 py-4">Nenhum projeto ainda. Comece com um prompt!</p>
          ) : (
            savedProjects.map((p) => (
              <button
                key={p.id}
                onClick={() => selectProject(p)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition flex items-center justify-between group cursor-pointer ${
                  projectId === p.id 
                    ? 'bg-white/10 text-white font-bold border border-white/10' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <div className="truncate flex-1 pr-2">
                  <span className="block truncate">{p.title || 'Sem título'}</span>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                    {p.status === 'published' ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> No Ar
                      </span>
                    ) : (
                      <span className="text-gray-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> Rascunho
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(p.id);
                    }}
                    className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Eliminar projeto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400" />
                </div>
              </button>
            ))
          )}

          {/* Sugestões Rápidas com Ícones Profissionais (Sem Emojis) */}
          <div className="pt-6">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">Modelos Prontos</p>
            <div className="space-y-1">
              {[
                { title: 'Restaurante & Lounge', icon: UtensilsCrossed, p: 'Cria uma landing page para um restaurante requintado em Maputo com cardápio, reserva e WhatsApp' },
                { title: 'Barbearia VIP', icon: Scissors, p: 'Cria um site moderno para uma barbearia com serviços de corte, barba e agendamento' },
                { title: 'Hotel & Resort Pemba', icon: Palmtree, p: 'Cria um site elegante para um Resort e Hotel em Pemba com fotos e contacto' },
                { title: 'Portfólio Criativo', icon: Briefcase, p: 'Cria um portfólio profissional para desenvolvedor web e designer freelancer' },
                { title: 'Loja & E-commerce', icon: ShoppingBag, p: 'Cria uma loja online elegante para moda com catálogo de produtos, preços em Meticais e botão de compra WhatsApp' },
              ].map((s, i) => {
                const IconComponent = s.icon;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setProjectTitle(s.title);
                      handleGenerate(s.p, s.title, true);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition truncate flex items-center gap-2 cursor-pointer"
                  >
                    <IconComponent className="w-3.5 h-3.5 shrink-0 text-blue-400/80" />
                    <span className="truncate">{s.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Rodapé da Sidebar */}
        <div className="p-3 border-t border-[#27272a] flex items-center justify-between text-xs text-gray-400">
          <div className="truncate">
            <p className="font-bold text-gray-200 truncate">{currentUser?.name || 'Utilizador'}</p>
            <p className="text-[10px] text-gray-400 truncate">{currentUser?.email}</p>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold">
            PRO
          </span>
        </div>
      </aside>

      {/* ── COLUNA 2: CHAT INTERATIVO & ITERAÇÕES (Colapsável / Redimensionável) ────── */}
      <section 
        style={{ 
          width: isChatOpen ? `${chatWidth}px` : 0,
          minWidth: isChatOpen ? '280px' : 0,
          maxWidth: isChatOpen ? '800px' : 0,
        }}
        className={`flex flex-col h-full bg-[#09090b] relative z-20 shrink-0 ${
          isChatOpen 
            ? 'border-r border-[#27272a]' 
            : 'w-0 overflow-hidden border-r-0'
        }`}
      >
        
        {/* Header do Chat */}
        <div className="h-14 px-3 sm:px-4 border-b border-[#27272a] flex items-center justify-between bg-[#0e0e11]">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Botão de abrir/fechar sidebar */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition cursor-pointer shrink-0"
              title={isSidebarOpen ? 'Recolher Barra Lateral' : 'Expandir Barra Lateral'}
            >
              {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>
            {!isSidebarOpen && (
              <div className="relative w-7 h-7 flex items-center justify-center shrink-0 drop-shadow-[0_2px_8px_rgba(37,99,235,0.3)]">
                <Image
                  src="/mascote-transparent.png"
                  alt="WEHOSTHERE"
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </div>
            )}
            <input
              type="text"
              value={projectTitle}
              onChange={e => setProjectTitle(e.target.value)}
              className="bg-transparent font-bold text-xs sm:text-sm text-gray-200 focus:outline-none focus:bg-white/5 px-2 py-1 rounded-md border border-transparent hover:border-white/10 transition truncate flex-1 min-w-0"
              placeholder="Nome do Site..."
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
              isPublished 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              {isPublished ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
              <span>{isPublished ? 'Publicado' : 'Rascunho'}</span>
            </span>

            {/* Botão para encolher/colapsar o Chat */}
            <button
              onClick={() => setIsChatOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
              title="Colapsar Barra de Chat (Ver Preview Total)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mensagens do Chat */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div key={m.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                {/* Balão do Usuário */}
                {isUser ? (
                  <div className="max-w-[90%] bg-blue-600 text-white px-4 py-3 rounded-2xl rounded-tr-sm text-xs sm:text-sm shadow-md font-medium leading-relaxed">
                    {m.content}
                  </div>
                ) : (
                  /* Card do Assistente no Estilo v0 */
                  <div className="w-full space-y-2">
                    {m.executionSeconds && (
                      <div className="flex items-center gap-2 text-[11px] text-gray-400 font-mono py-1">
                        <span className="flex items-center gap-1 text-gray-300">
                          <Clock className="w-3 h-3 text-blue-400" /> Trabalhou por {m.executionSeconds}s
                        </span>
                        {m.diffSummary && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold text-[10px]">
                            {m.diffSummary}
                          </span>
                        )}
                        <span className="text-gray-400">Página validada no preview</span>
                      </div>
                    )}

                    <div className="bg-[#18181b] border border-[#27272a] rounded-2xl rounded-tl-sm p-4 text-xs sm:text-sm text-gray-200 leading-relaxed shadow-sm">
                      {m.content}
                    </div>
                  </div>
                )}
                <span className="text-[10px] text-gray-400 mt-1 px-1">{m.timestamp}</span>
              </div>
            );
          })}

          {/* Indicador de Carregamento da IA */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-blue-400 font-mono py-1 animate-pulse">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>O agente de IA está a criar o código e a testar o preview...</span>
              </div>
              <div className="p-4 bg-[#18181b] border border-[#27272a] rounded-2xl space-y-2">
                <div className="h-4 bg-white/10 rounded-md w-3/4 animate-pulse" />
                <div className="h-4 bg-white/5 rounded-md w-1/2 animate-pulse" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Barra de Input no Fundo */}
        <div className="p-3 border-t border-[#27272a] bg-[#0c0c0e]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGenerate();
            }}
            className="relative"
          >
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              placeholder="Peça uma alteração ou descreva o site..."
              rows={2}
              className="w-full bg-[#18181b] text-gray-100 placeholder-gray-500 rounded-2xl pl-4 pr-12 py-3 text-xs sm:text-sm border border-[#27272a] focus:outline-none focus:border-blue-500 transition resize-none"
            />
            <button
              type="submit"
              disabled={!prompt.trim() || isGenerating}
              className={`absolute right-3 bottom-4 p-2 rounded-xl transition ${
                prompt.trim() && !isGenerating
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/25 cursor-pointer'
                  : 'bg-white/5 text-gray-600 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Chips Rápidos de Iteração com Ícones Profissionais */}
          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 text-[11px] no-scrollbar">
            <button
              onClick={() => handleGenerate('Muda o fundo para um tom azul escuro e adiciona mais gradientes')}
              className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 whitespace-nowrap transition cursor-pointer flex items-center gap-1.5"
            >
              <Palette className="w-3 h-3 text-blue-400" />
              <span>Mudar Cores</span>
            </button>
            <button
              onClick={() => handleGenerate('Adiciona um botão de WhatsApp flutuante bem visível')}
              className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 whitespace-nowrap transition cursor-pointer flex items-center gap-1.5"
            >
              <MessageSquare className="w-3 h-3 text-emerald-400" />
              <span>Botão WhatsApp</span>
            </button>
            <button
              onClick={() => handleGenerate('Adiciona uma tabela de preços comparativa com 3 planos')}
              className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 whitespace-nowrap transition cursor-pointer flex items-center gap-1.5"
              title="Adicionar tabela comparativa de preços com 3 planos"
            >
              <Tag className="w-3 h-3 text-purple-400" />
              <span>Preços</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── DIVISOR MANUAL REDIMENSIONÁVEL (Arrastar para Aumentar / Diminuir) ── */}
      {isChatOpen && (
        <div
          onMouseDown={() => setIsDragging(true)}
          onDoubleClick={() => setChatWidth(prev => prev === 420 ? 580 : 420)}
          className="w-1.5 hover:w-2 bg-[#18181b] hover:bg-blue-500 active:bg-blue-600 transition-all cursor-col-resize z-30 select-none hidden md:flex items-center justify-center shrink-0 border-r border-[#27272a] group"
          title="Arraste para ajustar a largura do chat (Duplo clique para alternar tamanho)"
        >
          <div className="w-0.5 h-6 bg-gray-600 group-hover:bg-white rounded-full transition-colors" />
        </div>
      )}

      {/* ── COLUNA 3: CANVAS DE PREVIEW AO VIVO + CÓDIGO + PUBLICAR (Estilo v0) ── */}
      <main className="flex flex-1 flex-col h-full bg-[#121217] relative z-10 overflow-hidden">
        
        {/* Barra Superior do Canvas */}
        <header className="h-14 px-3 sm:px-4 border-b border-[#27272a] bg-[#0e0e11] flex items-center justify-between gap-2">
          
          {/* Lado Esquerdo: Botões de Expandir Sidebar/Chat + Seletor Preview/Código */}
          <div className="flex items-center gap-2">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition cursor-pointer shrink-0"
                title="Expandir Barra Lateral"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}

            {!isChatOpen && (
              <button
                onClick={() => setIsChatOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600/20 text-xs font-bold transition cursor-pointer"
                title="Abrir Chat com IA"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mostrar Chat</span>
              </button>
            )}

            {/* Alternador Preview / Código (Compacto com Tooltip) */}
            <div className="flex items-center gap-1 bg-[#18181b] p-1 rounded-xl border border-[#27272a]">
              <button
                onClick={() => setActiveTab('preview')}
                className={`p-1.5 px-2.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'preview'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Visualizar Preview Interativo"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Preview</span>
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`p-1.5 px-2.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'code'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Visualizar Código HTML Fonte"
              >
                <Code className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Código</span>
              </button>
            </div>
          </div>

          {/* Centro: Dropdown "Latest ▾" e Stepper de Versões < > (Exacto ao v0) */}
          <div className="flex items-center gap-1.5 bg-[#18181b] p-1 rounded-xl border border-[#27272a] relative" ref={versionMenuRef}>
            
            {/* Botão Dropdown Versão */}
            <button
              onClick={() => setIsVersionDropdownOpen(!isVersionDropdownOpen)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-gray-200 hover:bg-white/5 transition cursor-pointer"
              title="Histórico de Versões do Projeto"
            >
              <History className="w-3.5 h-3.5 text-blue-400" />
              <span>
                {selectedVersionIndex === 'latest' 
                  ? 'Latest' 
                  : `v${versions[selectedVersionIndex]?.versionNumber || selectedVersionIndex + 1}`}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {/* Stepper de Navegação de Versões < > */}
            <div className="flex items-center border-l border-[#27272a] pl-1 gap-0.5 text-gray-400">
              <button
                onClick={() => handleStepVersion('prev')}
                disabled={versions.length <= 1 || selectedVersionIndex === 0}
                className="p-1 rounded hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition"
                title="Versão Anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono px-1 select-none text-gray-300">
                {selectedVersionIndex === 'latest' 
                  ? `${versions.length} / ${versions.length}` 
                  : `${(selectedVersionIndex as number) + 1} / ${versions.length}`}
              </span>
              <button
                onClick={() => handleStepVersion('next')}
                disabled={versions.length <= 1 || selectedVersionIndex === 'latest'}
                className="p-1 rounded hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition"
                title="Versão Seguinte"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Menu Popover das Versões */}
            {isVersionDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-[#18181b] border border-[#27272a] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2 py-1.5 border-b border-[#27272a] flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <span>Versões do Projeto</span>
                  <span className="text-[10px] text-blue-400">{versions.length} versões</span>
                </div>
                <div className="max-h-60 overflow-y-auto py-1 space-y-1">
                  {/* Opção Latest */}
                  <button
                    onClick={() => {
                      setSelectedVersionIndex('latest');
                      setIsVersionDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs transition flex items-center justify-between cursor-pointer ${
                      selectedVersionIndex === 'latest'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <div>
                      <span className="block font-semibold">Latest (Mais Recente)</span>
                      <span className="text-[10px] opacity-70">Versão atual de trabalho</span>
                    </div>
                    {selectedVersionIndex === 'latest' && <Check className="w-3.5 h-3.5" />}
                  </button>

                  {/* Lista de Versões Históricas */}
                  {[...versions].reverse().map((v, i) => {
                    const originalIndex = versions.length - 1 - i;
                    const isSelected = selectedVersionIndex === originalIndex;
                    return (
                      <button
                        key={v.versionNumber}
                        onClick={() => {
                          setSelectedVersionIndex(originalIndex);
                          setIsVersionDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-xl text-xs transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white font-bold'
                            : 'text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <span className="block truncate font-semibold">
                            v{v.versionNumber} &middot; {v.prompt}
                          </span>
                          <span className="text-[10px] opacity-70 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" /> {v.timestamp}
                          </span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Lado Direito: Modos Responsivos, Abrir em Nova Aba & Publicar */}
          <div className="flex items-center gap-2">
            
            {/* Modos Responsivos (Desktop, Tablet, Mobile) */}
            <div className="hidden lg:flex items-center gap-1 bg-[#18181b] p-1 rounded-xl border border-[#27272a]">
              <button
                onClick={() => setViewportMode('desktop')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${viewportMode === 'desktop' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                title="Desktop (100%)"
              >
                <Laptop className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewportMode('tablet')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${viewportMode === 'tablet' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                title="Tablet (768px)"
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewportMode('mobile')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${viewportMode === 'mobile' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                title="Mobile (375px)"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>

            {/* Copiar Código (Quando na aba código) */}
            {activeTab === 'code' && (
              <button
                onClick={handleCopyCode}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 transition cursor-pointer"
                title={copiedCode ? 'Código HTML Copiado!' : 'Copiar Código HTML'}
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            )}

            {/* BOTÃO EXPORTAR / BAIXAR HTML (Apenas Ícone com Tooltip) */}
            <button
              onClick={handleDownloadHtml}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition cursor-pointer"
              title="Descarregar ficheiro HTML completo para o computador"
            >
              <Download className="w-4 h-4 text-emerald-400" />
            </button>

            {/* BOTÃO OPEN IN NEW TAB (Apenas Ícone com Tooltip) */}
            <button
              onClick={handleOpenInNewTab}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition cursor-pointer"
              title="Abrir em Nova Aba no Navegador"
            >
              <ExternalLink className="w-4 h-4 text-blue-400" />
            </button>

            {/* BOTÃO PUBLICAR (Destaque Principal) */}
            <button
              onClick={() => setIsPublishModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/25 transition active:scale-95 cursor-pointer shrink-0"
              title="Publicar website online com subdomínio e SSL"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Publicar</span>
            </button>
          </div>
        </header>

        {/* Banner de Aviso de Versão Antiga (Caso esteja visualizando histórico) */}
        {selectedVersionIndex !== 'latest' && (
          <div className="bg-blue-600/10 border-b border-blue-500/20 px-4 py-2 flex items-center justify-between text-xs text-blue-300">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-blue-400" />
              <span>
                A visualizar <strong>Versão {versions[selectedVersionIndex]?.versionNumber}</strong> ({versions[selectedVersionIndex]?.prompt})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRestoreVersion(selectedVersionIndex as number)}
                className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Restaurar Esta Versão</span>
              </button>
              <button
                onClick={() => setSelectedVersionIndex('latest')}
                className="px-2 py-1 text-gray-400 hover:text-white transition cursor-pointer text-xs"
              >
                Voltar à Mais Recente
              </button>
            </div>
          </div>
        )}

        {/* Conteúdo Principal do Canvas */}
        <div className="flex-1 w-full h-[calc(100%-3.5rem)] overflow-hidden flex items-center justify-center p-2 sm:p-4 bg-[#09090b]">
          {!displayedHtml ? (
            /* Estado Inicial em Branco (Estilo v0) */
            <div className="flex flex-col items-center justify-center text-center p-6 max-w-lg mx-auto animate-in fade-in zoom-in-95 duration-200">
              <div className="relative w-20 h-20 mb-5 flex items-center justify-center drop-shadow-[0_12px_28px_rgba(37,99,235,0.35)] animate-pulse">
                <Image
                  src="/mascote-transparent.png"
                  alt="Mascote WEHOSTHERE"
                  width={80}
                  height={80}
                  className="object-contain"
                  priority
                />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mb-2 tracking-tight">O que deseja criar hoje?</h3>
              <p className="text-xs sm:text-sm text-gray-400 mb-8 leading-relaxed max-w-md">
                Descreva a sua ideia no chat ao lado ou escolha um dos modelos abaixo para ver o seu site ser construído e validado em tempo real.
              </p>

              <div className="w-full space-y-2 text-left">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1">Modelos Recomendados:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { title: 'Restaurante & Lounge', icon: UtensilsCrossed, p: 'Cria uma landing page para um restaurante requintado em Maputo com cardápio, reserva e WhatsApp' },
                    { title: 'Barbearia VIP', icon: Scissors, p: 'Cria um site moderno para uma barbearia com serviços de corte, barba e agendamento' },
                    { title: 'Hotel & Resort Pemba', icon: Palmtree, p: 'Cria um site elegante para um Resort e Hotel em Pemba com fotos e contacto' },
                    { title: 'Loja & E-commerce', icon: ShoppingBag, p: 'Cria uma loja online elegante para moda com catálogo de produtos, preços em Meticais e botão de compra WhatsApp' },
                  ].map((m, idx) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setProjectTitle(m.title);
                          handleGenerate(m.p, m.title, true);
                        }}
                        className="p-3.5 rounded-2xl bg-[#18181b] border border-[#27272a] hover:border-blue-500/40 hover:bg-white/5 transition text-left cursor-pointer group shadow-sm"
                      >
                        <div className="flex items-center gap-2 mb-1 text-blue-400">
                          <Icon className="w-4 h-4" />
                          <span className="text-xs font-bold text-gray-200 group-hover:text-blue-400 transition">{m.title}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 line-clamp-1">{m.p}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : activeTab === 'preview' ? (
            /* Ecrã de Iframe Interativo */
            <div
              className={`h-full bg-[#0e0e11] rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden border border-white/10 flex flex-col ${
                viewportMode === 'mobile'
                  ? 'w-[375px] max-w-full'
                  : viewportMode === 'tablet'
                    ? 'w-[768px] max-w-full'
                    : 'w-full'
              }`}
            >
              {/* Barra de Navegação Falsa do Browser com Subdomínio */}
              <div className="h-8 bg-[#18181b] border-b border-[#27272a] px-3 flex items-center justify-between text-[11px] text-gray-400 select-none">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                </div>
                
                {/* URL com Subdomínio Oficial */}
                <div 
                  onClick={handleOpenInNewTab}
                  className="bg-[#09090b] px-3 py-0.5 rounded-md text-[10px] text-gray-300 border border-white/5 truncate max-w-[280px] sm:max-w-[420px] cursor-pointer hover:text-blue-400 hover:border-blue-500/30 transition flex items-center gap-1.5"
                  title="Clique para abrir no navegador"
                >
                  <Globe className="w-2.5 h-2.5 text-blue-400 shrink-0" />
                  <span className="truncate">{subdomainHost}</span>
                  <ExternalLink className="w-2.5 h-2.5 text-gray-500 shrink-0" />
                </div>

                <div className="w-10 text-right flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    title="Recarregar Preview"
                    onClick={() => {
                      const temp = displayedHtml;
                      setCurrentHtml('');
                      setTimeout(() => setCurrentHtml(temp), 50);
                    }}
                    className="p-1 rounded text-gray-400 hover:text-white transition cursor-pointer"
                  >
                    <RotateCw className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Iframe que renderiza o HTML */}
              <iframe
                title="Preview"
                srcDoc={displayedHtml}
                className="w-full flex-1 border-0 bg-transparent"
                sandbox="allow-scripts allow-forms allow-popups"
              />
            </div>
          ) : (
            /* Visualizador de Código HTML */
            <div className="w-full h-full bg-[#0e0e11] border border-[#27272a] rounded-2xl p-4 overflow-auto font-mono text-xs text-gray-300">
              <pre>
                <code>{displayedHtml}</code>
              </pre>
            </div>
          )}
        </div>
      </main>

      {/* ── MODAL DE PUBLICAÇÃO COM SUPORTE COMPLETO A SUBDOMÍNIOS ───────────── */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#121217] border border-[#27272a] rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsPublishModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Publicar Seu Website</h3>
                <p className="text-xs text-gray-400">Publique em subdomínio instantâneo na nuvem WEHOSTHERE</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">Nome do Site</label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={e => setProjectTitle(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Subdomínio Personalizado (slug.wehosthere.com) */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">Subdomínio Gratuito WEHOSTHERE</label>
                <div className="flex items-center bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden px-3 text-xs">
                  <span className="text-blue-400 font-bold select-none pr-1">https://</span>
                  <input
                    type="text"
                    value={projectSlug}
                    onChange={e => setProjectSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="flex-1 bg-transparent py-2.5 text-white font-bold focus:outline-none"
                    placeholder="meu-negocio"
                  />
                  <span className="text-gray-400 font-mono select-none">.wehosthere.com</span>
                </div>
              </div>

              {/* Box de Subdomínio Ativo */}
              <div className="p-3.5 rounded-2xl bg-[#18181b] border border-[#27272a] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-400" /> Endereço de Subdomínio
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">
                    SSL Grátis & Ativo
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 bg-[#0c0c0e] p-2.5 rounded-xl border border-white/5">
                  <span className="text-xs font-mono text-blue-300 truncate">
                    {subdomainUrl}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleCopySubdomain}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition cursor-pointer"
                      title="Copiar Subdomínio"
                    >
                      {copiedSubdomain ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={handleOpenInNewTab}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition cursor-pointer"
                      title="Abrir em Nova Aba"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Informação sobre Domínio Próprio (.co.mz, .com) */}
              <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-white">Deseja apontar seu domínio próprio (.co.mz ou .com)?</span>
                  Pode conectar este projeto diretamente ao seu domínio personalizado através do gestor de DNS em <Link href="/dashboard/domains" className="underline font-bold text-blue-400">Domínios</Link>.
                </div>
              </div>

              {isPublished && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                  <div className="truncate pr-2">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Site Publicado com Sucesso!
                    </span>
                    <a href={subdomainUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-white underline truncate block mt-0.5">
                      {subdomainUrl}
                    </a>
                  </div>
                  <button
                    onClick={handleCopySubdomain}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                    title="Copiar Link"
                  >
                    {copiedSubdomain ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#27272a]">
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
              >
                Fechar
              </button>
              <button
                onClick={async () => {
                  await handlePublish();
                }}
                disabled={isPublishing}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/25 transition active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                {isPublishing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                <span>{isPublished ? 'Atualizar Publicação' : 'Publicar Agora'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
