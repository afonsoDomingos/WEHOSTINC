'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Sparkles, Send, Globe, Code, Eye, Laptop, Tablet, Smartphone, 
  RotateCw, ExternalLink, Share2, Plus, Trash2, ArrowLeft, Check, 
  Copy, CheckCircle2, ChevronRight, MessageSquare, Layers, Wand2,
  Clock, AlertCircle, RefreshCw, X
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

interface SavedProject {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  updatedAt: string;
  htmlContent: string;
  promptHistory: ChatMessage[];
}

export default function AiSiteBuilderStudio() {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Estados do Projecto
  const [projectId, setProjectId] = useState<string>('');
  const [projectTitle, setProjectTitle] = useState<string>('Meu Novo Site');
  const [projectSlug, setProjectSlug] = useState<string>('meu-site');
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [currentHtml, setCurrentHtml] = useState<string>('');
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(true);

  // Estados da Conversa / Prompt
  const [prompt, setPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Estados do Ecrã de Preview
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Carregar utilizador e projetos
  useEffect(() => {
    let user: User | null = null;
    if (session?.user) {
      user = {
        id: (session.user as any)?.id || session.user.email || '',
        name: session.user.name || 'Utilizador',
        email: session.user.email || '',
        plan: (session.user as any)?.plan || 'free',
        status: 'active',
        role: 'user',
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
    loadUserProjects(user.email);
  }, [session]);

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

  // Inicializar novo projeto em branco com prompt inicial "Olá, mundo"
  const initNewProject = () => {
    const newId = `site_${Date.now()}`;
    const defaultTitle = 'Página Olá Mundo';
    const defaultSlug = `site-${Math.random().toString(36).substring(2, 6)}`;
    setProjectId(newId);
    setProjectTitle(defaultTitle);
    setProjectSlug(defaultSlug);
    setIsPublished(false);
    setMessages([
      {
        id: 'msg_welcome',
        role: 'assistant',
        content: 'Olá! Sou o seu Construtor de Sites IA da WEHOSTHERE. Digite o que deseja criar (ex: uma página de boas-vindas, um restaurante, uma barbearia ou loja) e eu crio para si em tempo real!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    // Executar primeiro Olá Mundo padrão
    handleGenerate('cria uma pagina bem simples de ola mundo', defaultTitle, true);
  };

  // Selecionar projeto existente
  const selectProject = (proj: SavedProject) => {
    setProjectId(proj.id);
    setProjectTitle(proj.title);
    setProjectSlug(proj.slug);
    setIsPublished(proj.status === 'published');
    setCurrentHtml(proj.htmlContent);
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

        // Guardar silenciosamente no MongoDB
        saveProjectToDb({
          id: projectId,
          userEmail,
          userName: currentUser?.name || 'Cliente',
          title: titleOverride || projectTitle,
          slug: projectSlug,
          htmlContent: data.html,
          promptHistory: updatedMessages,
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
        const data = await res.json();
        // Atualizar lista local
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
          htmlContent: currentHtml,
          promptHistory: messages,
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

  const handleCopyCode = () => {
    if (!currentHtml) return;
    navigator.clipboard.writeText(currentHtml);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/site/${projectSlug}`
    : `https://www.wehosthere.com/site/${projectSlug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="flex h-screen bg-[#09090b] text-[#fafafa] font-sans overflow-hidden antialiased selection:bg-blue-600 selection:text-white">

      {/* ── COLUNA 1: SIDEBAR DE PROJETOS E CONVERSAS (Estilo v0) ─────────────── */}
      <aside className={`h-full border-r border-[#27272a] bg-[#0c0c0e] flex flex-col transition-all duration-300 z-30 ${isSidebarOpen ? 'w-64 sm:w-72' : 'w-0 -translate-x-full overflow-hidden'}`}>
        {/* Header da Sidebar */}
        <div className="p-4 border-b border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center font-black text-sm text-white shadow-lg shadow-blue-500/20">
              W
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight block">WEHOSTHERE</span>
              <span className="text-[10px] text-blue-400 font-semibold tracking-wide uppercase flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Studio AI
              </span>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition"
            title="Voltar ao Painel"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
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
                  <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                    {p.status === 'published' ? (
                      <span className="text-emerald-400 flex items-center gap-0.5">● No Ar</span>
                    ) : (
                      <span>Rascunho</span>
                    )}
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400" />
              </button>
            ))
          )}

          {/* Sugestões Rápidas */}
          <div className="pt-6">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">Modelos Prontos</p>
            <div className="space-y-1">
              {[
                { title: 'Restaurante & Lounge', p: 'Cria uma landing page para um restaurante requintado em Maputo com cardápio, reserva e WhatsApp' },
                { title: 'Barbearia VIP', p: 'Cria um site moderno para uma barbearia com serviços de corte, barba e agendamento' },
                { title: 'Hotel & Turismo', p: 'Cria um site elegante para um Resort e Hotel em Pemba com fotos e contacto' },
                { title: 'Portfólio Criativo', p: 'Cria um portfólio profissional para desenvolvedor web e designer freelancer' },
                { title: 'Página Olá Mundo', p: 'cria uma pagina bem simples de ola mundo' },
              ].map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setProjectTitle(s.title);
                    handleGenerate(s.p, s.title, true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition truncate cursor-pointer"
                >
                  ✨ {s.title}
                </button>
              ))}
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

      {/* ── COLUNA 2: CHAT INTERATIVO & ITERAÇÕES (Centro estilo v0) ─────────── */}
      <section className="flex-1 lg:w-[420px] lg:max-w-[440px] xl:w-[480px] xl:max-w-[500px] flex flex-col h-full border-r border-[#27272a] bg-[#09090b] relative z-20">
        
        {/* Header do Chat */}
        <div className="h-14 px-4 border-b border-[#27272a] flex items-center justify-between bg-[#0e0e11]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
              title="Alternar Barra Lateral"
            >
              <Layers className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={projectTitle}
              onChange={e => setProjectTitle(e.target.value)}
              className="bg-transparent font-bold text-xs sm:text-sm text-gray-200 focus:outline-none focus:bg-white/5 px-2 py-1 rounded-md border border-transparent hover:border-white/10 transition"
              placeholder="Nome do Site..."
            />
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isPublished 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              {isPublished ? '● Publicado' : 'Rascunho'}
            </span>
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
                    {/* Badge de Execução (ex: Worked for 8s, +25 / -12) */}
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

                    {/* Resposta de Texto */}
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

          {/* Chips Rápidos de Iteração */}
          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 text-[11px] no-scrollbar">
            <button
              onClick={() => handleGenerate('Muda o fundo para um tom azul escuro e adiciona mais gradientes')}
              className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 whitespace-nowrap transition cursor-pointer"
            >
              🎨 Mudar Cores
            </button>
            <button
              onClick={() => handleGenerate('Adiciona um botão de WhatsApp flutuante bem visível')}
              className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 whitespace-nowrap transition cursor-pointer"
            >
              💬 Botão WhatsApp
            </button>
            <button
              onClick={() => handleGenerate('Adiciona uma tabela de preços comparativa com 3 planos')}
              className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 whitespace-nowrap transition cursor-pointer"
            >
              🏷️ Tabela de Preços
            </button>
          </div>
        </div>
      </section>

      {/* ── COLUNA 3: CANVAS DE PREVIEW AO VIVO + CÓDIGO + PUBLICAR ─────────── */}
      <main className="hidden md:flex flex-1 flex-col h-full bg-[#121217] relative z-10 overflow-hidden">
        
        {/* Barra Superior do Canvas */}
        <header className="h-14 px-4 border-b border-[#27272a] bg-[#0e0e11] flex items-center justify-between">
          
          {/* Alternador Preview / Código */}
          <div className="flex items-center gap-1 bg-[#18181b] p-1 rounded-xl border border-[#27272a]">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'code'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" /> Código HTML
            </button>
          </div>

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

          {/* Ações: Copiar Código, Abrir em Nova Aba e Publicar */}
          <div className="flex items-center gap-2">
            {activeTab === 'code' ? (
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white border border-white/10 transition cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? 'Copiado!' : 'Copiar Código'}
              </button>
            ) : null}

            {isPublished && (
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 border border-white/10 transition"
                title="Abrir no navegador"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ver Online</span>
              </a>
            )}

            {/* BOTÃO PUBLICAR (Destaque Principal) */}
            <button
              onClick={() => setIsPublishModalOpen(true)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/25 transition active:scale-95 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Publicar</span>
            </button>
          </div>
        </header>

        {/* Conteúdo Principal do Canvas */}
        <div className="flex-1 w-full h-[calc(100%-3.5rem)] overflow-hidden flex items-center justify-center p-3 sm:p-6 bg-[#09090b]">
          {activeTab === 'preview' ? (
            /* Ecrã de Iframe Interativo */
            <div
              className={`h-full bg-white rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden border border-white/10 flex flex-col ${
                viewportMode === 'mobile'
                  ? 'w-[375px] max-w-full'
                  : viewportMode === 'tablet'
                    ? 'w-[768px] max-w-full'
                    : 'w-full'
              }`}
            >
              {/* Barra de Navegação Falsa do Browser */}
              <div className="h-8 bg-[#18181b] border-b border-[#27272a] px-3 flex items-center justify-between text-[11px] text-gray-400 select-none">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                </div>
                <div className="bg-[#09090b] px-4 py-0.5 rounded-md text-[10px] text-gray-300 border border-white/5 truncate max-w-[240px]">
                  https://www.wehosthere.com/site/{projectSlug}
                </div>
                <div className="w-10 text-right">
                  <RotateCw className="w-3 h-3 text-gray-500 inline-block cursor-pointer hover:text-white" onClick={() => {
                    const temp = currentHtml;
                    setCurrentHtml('');
                    setTimeout(() => setCurrentHtml(temp), 50);
                  }} />
                </div>
              </div>

              {/* Iframe que renderiza o HTML */}
              <iframe
                title="Preview"
                srcDoc={currentHtml}
                className="w-full flex-1 border-0 bg-white"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
            </div>
          ) : (
            /* Visualizador de Código HTML */
            <div className="w-full h-full bg-[#0e0e11] border border-[#27272a] rounded-2xl p-4 overflow-auto font-mono text-xs text-gray-300">
              <pre>
                <code>{currentHtml}</code>
              </pre>
            </div>
          )}
        </div>
      </main>

      {/* ── MODAL DE PUBLICAÇÃO ──────────────────────────────────────────────── */}
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
                <p className="text-xs text-gray-400">Torne o seu site público para o mundo na nuvem WEHOSTHERE</p>
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

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">Link Público / Slug</label>
                <div className="flex items-center bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden px-3 text-xs">
                  <span className="text-gray-500 select-none">wehosthere.com/site/</span>
                  <input
                    type="text"
                    value={projectSlug}
                    onChange={e => setProjectSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="flex-1 bg-transparent py-2.5 text-white font-bold focus:outline-none"
                    placeholder="meu-negocio"
                  />
                </div>
              </div>

              {/* Informação sobre Domínio Próprio */}
              <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-white">Quer conectar ao seu domínio próprio (.co.mz)?</span>
                  Pode ligar este site diretamente ao seu domínio personalizado na área de <Link href="/dashboard/domains" className="underline font-bold text-blue-400">Domínios</Link>.
                </div>
              </div>

              {isPublished && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                  <div className="truncate pr-2">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Site Activo Online:</span>
                    <a href={publicUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-white underline truncate block">
                      {publicUrl}
                    </a>
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                    title="Copiar Link"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
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
