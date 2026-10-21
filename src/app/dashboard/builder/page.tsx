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
  History, Undo2, Download, ShoppingBag, FolderArchive, Edit3, Save, Upload,
  MoreHorizontal
} from 'lucide-react';
import { auth, User } from '@/lib/auth';

// ============================================================
// 🎨 SYNTAX HIGHLIGHTER — VS Code Dark+ Theme (zero deps)
// ============================================================
function highlightHtml(code: string): string {
  // Escape html entities first to avoid XSS via code content
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  let result = '';
  let i = 0;
  const len = code.length;

  while (i < len) {
    // HTML Comments <!-- ... -->
    if (code.startsWith('<!--', i)) {
      const end = code.indexOf('-->', i + 4);
      const raw = end === -1 ? code.slice(i) : code.slice(i, end + 3);
      result += `<span style="color:#6a9955;font-style:italic">${escape(raw)}</span>`;
      i += raw.length;
      continue;
    }

    // DOCTYPE
    if (code.startsWith('<!DOCTYPE', i) || code.startsWith('<!doctype', i)) {
      const end = code.indexOf('>', i);
      const raw = end === -1 ? code.slice(i) : code.slice(i, end + 1);
      result += `<span style="color:#569cd6">${escape(raw)}</span>`;
      i += raw.length;
      continue;
    }

    // HTML Tag  <tagname ...> or </tagname>
    if (code[i] === '<' && i + 1 < len && (code[i + 1] === '/' || /[a-zA-Z!]/.test(code[i + 1]))) {
      // Find end of tag
      let j = i + 1;
      // scan until we hit > but respect attribute strings
      let inStr = false;
      let strChar = '';
      while (j < len) {
        if (inStr) {
          if (code[j] === strChar) inStr = false;
          j++;
          continue;
        }
        if (code[j] === '"' || code[j] === "'") {
          inStr = true;
          strChar = code[j];
          j++;
          continue;
        }
        if (code[j] === '>') { j++; break; }
        j++;
      }
      const tagStr = code.slice(i, j);

      // Now colorize the tag content
      // Pattern: (<)(/?)([a-zA-Z0-9-]+)(attrs...)(/?)(>)
      let tagResult = '';
      let k = 0;
      const tlen = tagStr.length;

      // opening < or </
      if (tagStr[k] === '<') {
        tagResult += `<span style="color:#808080">&lt;</span>`;
        k++;
      }
      if (tagStr[k] === '/') {
        tagResult += `<span style="color:#808080">/</span>`;
        k++;
      }

      // tag name
      let tagName = '';
      while (k < tlen && /[a-zA-Z0-9\-]/.test(tagStr[k])) {
        tagName += tagStr[k];
        k++;
      }
      if (tagName) tagResult += `<span style="color:#569cd6">${escape(tagName)}</span>`;

      // attributes
      while (k < tlen) {
        // closing > or />
        if (tagStr[k] === '>' ) { tagResult += `<span style="color:#808080">&gt;</span>`; k++; break; }
        if (tagStr[k] === '/' && tagStr[k+1] === '>') {
          tagResult += `<span style="color:#808080">/&gt;</span>`; k += 2; break;
        }
        // whitespace
        if (/\s/.test(tagStr[k])) { tagResult += tagStr[k]; k++; continue; }
        // attribute name
        if (/[a-zA-Z_:\-]/.test(tagStr[k])) {
          let attrName = '';
          while (k < tlen && /[a-zA-Z0-9_:\-\.@]/.test(tagStr[k])) {
            attrName += tagStr[k]; k++;
          }
          tagResult += `<span style="color:#9cdcfe">${escape(attrName)}</span>`;
          // = and value
          if (k < tlen && tagStr[k] === '=') {
            tagResult += `<span style="color:#d4d4d4">=</span>`;
            k++;
            if (k < tlen && (tagStr[k] === '"' || tagStr[k] === "'")) {
              const q = tagStr[k];
              let val = q;
              k++;
              while (k < tlen && tagStr[k] !== q) { val += tagStr[k]; k++; }
              val += q; k++;
              tagResult += `<span style="color:#ce9178">${escape(val)}</span>`;
            }
          }
          continue;
        }
        tagResult += escape(tagStr[k]); k++;
      }

      result += tagResult;
      i += tagStr.length;
      continue;
    }

    // Plain text / anything else — check for style/script blocks first
    // For style blocks colorize as CSS
    if (code.startsWith('<style', i)) {
      const closeStyle = code.toLowerCase().indexOf('</style', i + 6);
      if (closeStyle !== -1) {
        const styleOpen = code.indexOf('>', i) + 1;
        const cssContent = code.slice(styleOpen, closeStyle);
        const styledCss = cssContent
          .replace(/(&lt;|&gt;)/g, (m) => m)
          .replace(/(\/\*[\s\S]*?\*\/)/g, (m) => `<span style="color:#6a9955;font-style:italic">${m}</span>`)
          .replace(/([a-zA-Z\-]+)(?=\s*:)/g, (m) => `<span style="color:#9cdcfe">${m}</span>`)
          .replace(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|[0-9]+(?:px|em|rem|%|vh|vw|s|ms))/g,
            (m) => `<span style="color:#b5cea8">${m}</span>`);
        // Rebuild with tag
        result += highlightHtml(code.slice(i, styleOpen)) + styledCss + highlightHtml(code.slice(closeStyle, closeStyle + 8));
        i = closeStyle + 8;
        continue;
      }
    }

    // Regular character
    result += escape(code[i]);
    i++;
  }

  return result;
}

// Adds line numbers and renders highlighted code
function CodeBlock({ code, isStreaming = false }: { code: string; isStreaming?: boolean }) {
  const highlighted = highlightHtml(code);
  const lines = highlighted.split('\n');

  return (
    <div className="flex flex-1 overflow-auto font-mono text-[11.5px] leading-[1.65]">
      {/* Line numbers */}
      {!isStreaming && (
        <div
          className="select-none text-right pr-3 pl-3 pt-4 shrink-0 border-r border-white/5"
          style={{ color: '#495050', minWidth: '3rem', userSelect: 'none' }}
          aria-hidden="true"
        >
          {lines.map((_, idx) => (
            <div key={idx}>{idx + 1}</div>
          ))}
        </div>
      )}
      {/* Code content */}
      <pre
        className="flex-1 overflow-auto p-4 whitespace-pre-wrap break-all"
        style={{ background: 'transparent', margin: 0, color: '#d4d4d4' }}
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    </div>
  );
}

// ─── HELPER: Aplicar Logotipo ao Menu e Rodapé do HTML ─────────────────────
function applyLogoToHtml(
  html: string, 
  logoUrl: string, 
  logoHeight: number = 36, 
  showText: boolean = true
): string {
  if (!html || !logoUrl) return html;

  const logoImgTag = `<img src="${logoUrl}" alt="Logótipo" style="height:${logoHeight}px; width:auto; max-height:${logoHeight}px; object-fit:contain;" class="object-contain shrink-0" />`;

  let updated = html;

  // 1. Procurar e atualizar o link de marca dentro de <nav>
  const navRegex = /(<nav[\s\S]*?<a[^>]*>)([\s\S]*?)(<\/a>[\s\S]*?<\/nav>)/i;
  const navMatch = updated.match(navRegex);

  if (navMatch) {
    const fullAnchorContent = navMatch[2];
    let newAnchorContent = fullAnchorContent;

    // Se já tinha <img ...> dentro do link, substitui a imagem existente
    if (/<img[^>]*>/i.test(fullAnchorContent)) {
      newAnchorContent = fullAnchorContent.replace(/<img[^>]*>/i, logoImgTag);
    } else {
      // Se tinha o badge div (ex: <div class="w-8 h-8 ...">X</div>), substitui pelo logo
      const badgeRegex = /<div[^>]*class="[^"]*(?:w-7|w-8|w-9|w-10|rounded)[^"]*"[^>]*>[\s\S]*?<\/div>/i;
      if (badgeRegex.test(fullAnchorContent)) {
        newAnchorContent = fullAnchorContent.replace(badgeRegex, logoImgTag);
      } else {
        newAnchorContent = `${logoImgTag} ${fullAnchorContent}`;
      }
    }

    if (!showText) {
      newAnchorContent = newAnchorContent.replace(/<span[^>]*>[\s\S]*?<\/span>/gi, '');
    }

    updated = updated.replace(navMatch[0], `${navMatch[1]}${newAnchorContent}${navMatch[3]}`);
  }

  // 2. Procurar e atualizar no rodapé se existir o badge da marca
  const footerRegex = /(<footer[\s\S]*?<div[^>]*class="[^"]*flex items-center[^"]*"[^>]*>)([\s\S]*?)(<\/div>[\s\S]*?<\/footer>)/i;
  const footerMatch = updated.match(footerRegex);
  if (footerMatch) {
    const footerInner = footerMatch[2];
    const badgeRegex = /<div[^>]*class="[^"]*(?:w-7|w-8|w-9|w-10|rounded)[^"]*"[^>]*>[\s\S]*?<\/div>/i;
    if (badgeRegex.test(footerInner)) {
      const footerLogoImg = `<img src="${logoUrl}" alt="Logótipo" style="height:${Math.round(logoHeight * 0.8)}px; width:auto; max-height:${Math.round(logoHeight * 0.8)}px; object-fit:contain;" class="object-contain shrink-0" />`;
      const newFooterInner = footerInner.replace(badgeRegex, footerLogoImg);
      updated = updated.replace(footerMatch[0], `${footerMatch[1]}${newFooterInner}${footerMatch[3]}`);
    }
  }

  return updated;
}

// ─── HELPER: Formatar Markdown suave para mensagens da IA ──────────────────
function formatMessageContent(content: string) {
  if (!content) return null;
  const lines = content.split('\n');

  return lines.map((line, idx) => {
    const trimmed = line.trim();
    const isBullet = trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ');
    const rawContent = isBullet ? trimmed.replace(/^[•\-\*]\s*/, '') : line;

    // Parser simples de negrito **texto** e código `codigo`
    const parts = rawContent.split(/(\*\*.*?\*\*|`.*?`)/g);
    const elements = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={pIdx} className="text-white font-extrabold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={pIdx} className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[11px] text-blue-300">{part.slice(1, -1)}</code>;
      }
      return part;
    });

    if (isBullet) {
      return (
        <div key={idx} className="flex items-start gap-2 my-1 pl-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5" />
          <span className="flex-1">{elements}</span>
        </div>
      );
    }

    return (
      <div key={idx} className={trimmed === '' ? 'h-2' : ''}>
        {elements}
      </div>
    );
  });
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  diffSummary?: string;
  executionSeconds?: number;
  modelUsed?: string;
  isStreamingText?: boolean;
  proposal?: {
    prompt: string;
    titleOverride?: string;
    status: 'pending' | 'accepted' | 'declined';
  };
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

const DEMO_STARTER_HTML = `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NexusTech — Inovação Digital</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 antialiased min-h-screen flex flex-col">
  <header class="border-b border-slate-800/80 sticky top-0 bg-slate-950/90 backdrop-blur-md z-30">
    <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-white text-lg">N</div>
        <span class="font-extrabold text-lg tracking-tight text-white">Nexus<span class="text-blue-500">Tech</span></span>
      </div>
      <nav class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
        <a href="#solucoes" class="hover:text-blue-400 transition">Soluções</a>
        <a href="#vantagens" class="hover:text-blue-400 transition">Vantagens</a>
        <a href="#contacto" class="hover:text-blue-400 transition">Contacto</a>
      </nav>
      <a href="https://wa.me/258840000000" target="_blank" class="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl transition shadow-lg shadow-blue-600/30">
        Falar no WhatsApp
      </a>
    </div>
  </header>
  <main class="flex-1">
    <section class="py-16 sm:py-24 px-6 text-center relative overflow-hidden">
      <div class="max-w-4xl mx-auto">
        <div class="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold px-3.5 py-1.5 rounded-full mb-6">
          <svg class="w-3.5 h-3.5 text-blue-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/></svg>
          <span>Construído com WEHOSTHERE Studio AI</span>
        </div>
        <h1 class="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight mb-6">
          Soluções Digitais que aceleram o seu <span class="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Crescimento</span>
        </h1>
        <p class="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
          Desenvolvemos tecnologia de alta performance para empresas que buscam modernidade, segurança e presença digital marcante.
        </p>
        <div class="flex flex-wrap items-center justify-center gap-3">
          <a href="#solucoes" class="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition shadow-xl">
            Ver Nossos Serviços
          </a>
          <a href="#contacto" class="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold px-6 py-3 rounded-xl transition">
            Pedir Orçamento
          </a>
        </div>
      </div>
    </section>
    <section id="solucoes" class="py-16 px-6 bg-slate-900/60 border-t border-slate-800">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-12">
          <h2 class="text-2xl sm:text-3xl font-extrabold text-white mb-3">O Que Criamos Para Si</h2>
          <p class="text-slate-400 text-sm">Tecnologia desenhada à medida da sua empresa.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition group">
            <div class="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"/></svg>
            </div>
            <h3 class="text-lg font-bold text-white mb-2">Websites & E-Commerce</h3>
            <p class="text-slate-400 text-sm">Páginas ultrarrápidas, otimizadas para telemóveis e preparadas para vendas online.</p>
          </div>
          <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition group">
            <div class="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"/></svg>
            </div>
            <h3 class="text-lg font-bold text-white mb-2">Sistemas na Cloud</h3>
            <p class="text-slate-400 text-sm">Aplicações corporativas com segurança de nível bancário e alta disponibilidade.</p>
          </div>
          <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 transition group">
            <div class="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/></svg>
            </div>
            <h3 class="text-lg font-bold text-white mb-2">Automação & IA</h3>
            <p class="text-slate-400 text-sm">Integrações inteligentes que poupam tempo à sua equipa e reduzem custos.</p>
          </div>
        </div>
      </div>
    </section>
  </main>
  <footer id="contacto" class="border-t border-slate-800 py-8 px-6 text-center text-slate-500 text-xs">
    <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
      <p>© 2026 NexusTech, Lda. Todos os direitos reservados.</p>
      <p>Desenvolvido com <span class="text-blue-400 font-bold">WEHOSTHERE Studio AI</span></p>
    </div>
  </footer>
</body>
</html>`;

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
  const [showTemplates, setShowTemplates] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [elapsedThinkingSeconds, setElapsedThinkingSeconds] = useState<number>(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const versionMenuRef = useRef<HTMLDivElement>(null);

  // Cronómetro de Raciocínio em Tempo Real (Estilo ChatGPT / Claude)
  useEffect(() => {
    if (!isGenerating) {
      setElapsedThinkingSeconds(0);
      return;
    }
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsedThinkingSeconds(Number(((Date.now() - start) / 1000).toFixed(1)));
    }, 100);
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Estados de Streaming
  const [streamingCode, setStreamingCode] = useState<string>(''); // código a aparecer em tempo real
  const [isStreaming, setIsStreaming] = useState<boolean>(false);  // streaming activo
  const streamingRef = useRef<HTMLDivElement>(null);               // scroll automático do terminal

  // Estados de Interface e Layout
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<'chat' | 'preview' | 'code'>('chat');
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedSubdomain, setCopiedSubdomain] = useState<boolean>(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  // Estados do Editor de Código Inline
  const [isEditingCode, setIsEditingCode] = useState<boolean>(false);
  const [editedCode, setEditedCode] = useState<string>('');
  const [editorSaveSuccess, setEditorSaveSuccess] = useState<boolean>(false);

  // Estados de Exportação e Partilha
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [copiedShareLink, setCopiedShareLink] = useState<boolean>(false);

  // Modo de Interação: Desenvolvimento (Gera Código) vs Conversa (Consultor de IA)
  const [interactionMode, setInteractionMode] = useState<'builder' | 'chat'>('builder');

  // Estados do Modal de Logotipo
  const [isLogoModalOpen, setIsLogoModalOpen] = useState<boolean>(false);
  const [logoInputUrl, setLogoInputUrl] = useState<string>('');
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>('');
  const [logoHeight, setLogoHeight] = useState<number>(36);
  const [logoShowText, setLogoShowText] = useState<boolean>(true);
  const [logoSuccessToast, setLogoSuccessToast] = useState<boolean>(false);
  const [logoErrorMessage, setLogoErrorMessage] = useState<string>('');
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Estados de Confirmação Customizada (Substitui confirm/alert nativos do browser)
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState<boolean>(false);
  const [isClearChatModalOpen, setIsClearChatModalOpen] = useState<boolean>(false);

  // Estados de Modo Restrito para Visitantes Não Autenticados
  const [isAuthRequiredModalOpen, setIsAuthRequiredModalOpen] = useState<boolean>(false);
  const [authModalReason, setAuthModalReason] = useState<string>('Para gerar novos designs com IA e salvar seus projetos, aceda à sua conta.');

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

  // Detetar tela mobile e ajustar layout inicial
  useEffect(() => {
    const handleCheckMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      }
    };
    handleCheckMobile();
    window.addEventListener('resize', handleCheckMobile);
    return () => window.removeEventListener('resize', handleCheckMobile);
  }, []);

  // Fechar dropdown de versão e menu de opções ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (versionMenuRef.current && !versionMenuRef.current.contains(event.target as Node)) {
        setIsVersionDropdownOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
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
      setCurrentUser(null);
      setAuthLoading(false);
      setIsLoadingProjects(false);
      initGuestProject();
      return;
    }

    setCurrentUser(user);
    setAuthLoading(false);
    loadUserProjects(user.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status]);

  // Inicializar projeto em modo demonstração para visitantes
  const initGuestProject = () => {
    setProjectId('site_guest_demo');
    setProjectTitle('Website de Demonstração');
    setProjectSlug('demo-preview');
    setIsPublished(false);
    setCurrentHtml(DEMO_STARTER_HTML);
    setEditedCode(DEMO_STARTER_HTML);
    setIsEditingCode(false);
    setVersions([
      {
        versionNumber: 1,
        html: DEMO_STARTER_HTML,
        prompt: 'Layout Inicial de Apresentação',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setSelectedVersionIndex('latest');
    setMessages([
      {
        id: 'msg_guest_welcome',
        role: 'assistant',
        content: '👋 Olá! Bem-vindo ao Construtor de Sites IA da WEHOSTHERE no Modo Demonstração.\n\nPode explorar o preview em tempo real, alternar entre modos (Computador, Tablet e Telemóvel) e inspecionar o código fonte. Para gerar novos designs com IA, salvar projetos e publicar com domínio próprio, crie uma conta gratuita ou inicie sessão!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarOpen(false);
      setIsChatOpen(true);
      setMobileTab('chat');
    }
  };

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
  const initNewProject = (userInitiated: boolean = false) => {
    if (!currentUser && userInitiated) {
      setAuthModalReason('Para criar e guardar múltiplos projetos no seu painel, inicie sessão na sua conta.');
      setIsAuthRequiredModalOpen(true);
      return;
    }
    // Preservar projeto atual no estado local caso tenha conteúdo
    if (projectId) {
      setSavedProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            htmlContent: currentHtml,
            promptHistory: messages
          };
        }
        return p;
      }));
    }

    const newId = `site_${Date.now()}`;
    const defaultTitle = 'Novo Projeto';
    const defaultSlug = `site-${Math.random().toString(36).substring(2, 6)}`;
    setProjectId(newId);
    setProjectTitle(defaultTitle);
    setProjectSlug(defaultSlug);
    setIsPublished(false);
    setCurrentHtml('');
    setIsEditingCode(false);
    setEditedCode('');
    setVersions([]);
    setSelectedVersionIndex('latest');
    setMessages([
      {
        id: 'msg_welcome',
        role: 'assistant',
        content: 'Olá! O que gostaria de criar hoje?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarOpen(false);
      setIsChatOpen(true);
      setMobileTab('chat');
    }
  };

  // Selecionar projeto existente (com histórico isolado de chats)
  const selectProject = (proj: SavedProject) => {
    // Preservar projeto anterior no estado local antes de trocar
    if (projectId && projectId !== proj.id) {
      setSavedProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            htmlContent: currentHtml,
            promptHistory: messages
          };
        }
        return p;
      }));
    }

    setProjectId(proj.id);
    setProjectTitle(proj.title);
    setProjectSlug(proj.slug);
    setIsPublished(proj.status === 'published');
    setCurrentHtml(proj.htmlContent);
    setIsEditingCode(false);
    setEditedCode(proj.htmlContent || '');

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

    // Carregar histórico de mensagens separado para este projeto
    if (proj.promptHistory && proj.promptHistory.length > 0) {
      setMessages(proj.promptHistory);
    } else {
      setMessages([
        {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: `Projeto "${proj.title}" carregado com sucesso. Como gostaria de aprimorá-lo agora?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }

    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarOpen(false);
      setIsChatOpen(true);
      setMobileTab('chat');
    }
  };

  // ─── Helpers para Proposta de Construção e Intenção ────────────────────────
  const isConversationalPrompt = (text: string) => {
    const p = text.trim().toLowerCase();
    const actionKeywords = [
      'cria', 'criar', 'construir', 'construa', 'faz', 'fazer', 'muda', 'mudar', 
      'altera', 'alterar', 'adiciona', 'adicionar', 'remove', 'remover', 'elimina',
      'troca', 'trocar', 'coloca', 'colocar', 'desenvolve', 'desenvolver',
      'site', 'website', 'landing', 'pagina', 'página', 'loja', 'ecommerce', 
      'restaurante', 'barbearia', 'hotel', 'resort', 'preço', 'preco', 'precos',
      'botao', 'botão', 'whatsapp', 'formulario', 'formulário', 'tabela', 'cor', 'cores',
      'tema', 'fundo', 'header', 'footer', 'menu', 'navbar', 'hero', 'banner', 'design'
    ];
    if (actionKeywords.some(kw => p.includes(kw))) return false;

    const greetings = [
      'ola', 'olá', 'oi', 'oii', 'oiii', 'hey', 'hello', 'hi', 'bom dia', 'boa tarde', 
      'boa noite', 'tudo bem', 'tudo bom', 'tudo bem?', 'opa', 'e aí', 'e ai', 
      'fala aí', 'salve'
    ];
    if (greetings.includes(p) || greetings.some(g => p === g || p === `${g}!` || p === `${g}.` || p === `${g}?`)) return true;

    if (
      p.includes('como funciona') || p.includes('o que fazes') || p.includes('o que podes fazer') || 
      p.includes('quem és tu') || p.includes('quem e voce') || p.includes('como usar') ||
      p === 'ajuda' || p === 'help' || p.includes('podes me ajudar')
    ) return true;

    const courtesies = ['obrigado', 'obrigada', 'valeu', 'top', 'muito bom', 'gostei', 'show', 'legal', 'perfeito', 'ok', 'entendi'];
    if (courtesies.includes(p) || courtesies.some(c => p === c || p === `${c}!` || p === `${c}.`)) return true;

    return false;
  };

  const generateProposalPlan = (promptText: string, hasHtml: boolean): string => {
    const p = promptText.toLowerCase();
    if (hasHtml) {
      return `Entendido! Preparei o seguinte plano de modificação para o seu site:\n\n• Aplicar as alterações solicitadas: "${promptText}"\n• Preservar o tema minimalista preto e branco de alto contraste\n• Manter o menu simples e o rodapé limpos e organizados\n• Testar o novo código e renderizar diretamente no preview interativo.\n\nDeseja aceitar e gerar o código agora?`;
    }

    if (p.includes('restaurante') || p.includes('lounge') || p.includes('comida') || p.includes('cardapio') || p.includes('cardápio')) {
      return `Excelente! Preparei o plano de construção para o seu Restaurante & Lounge:\n\n• Tema sofisticado Preto & Branco com tipografia Plus Jakarta Sans\n• Menu simples e bonito com links rápidos e botão de WhatsApp\n• Seção Hero elegante com convite a reservas e culinária contemporânea\n• Cardápio digital de degustação com preços claros em Meticais (MZN)\n• Rodapé minimalista com horários, contactos e direitos reservados.\n\nDeseja aceitar e iniciar a geração do código?`;
    }

    if (p.includes('barbearia') || p.includes('corte') || p.includes('barba')) {
      return `Ótimo! Preparei o plano de desenvolvimento para a sua Barbearia VIP:\n\n• Tema Preto & Branco com visual masculino moderno de alta classe\n• Menu clean e elegante com atalhos para serviços e agendamento\n• Tabela de cortes, barba terapia e combos com preços em Meticais (MZN)\n• Botão flutuante de agendamento rápido via WhatsApp\n• Rodapé simples e bonito com horários de funcionamento.\n\nDeseja aceitar e iniciar a geração do código?`;
    }

    if (p.includes('hotel') || p.includes('resort') || p.includes('turismo') || p.includes('hospedagem')) {
      return `Perfeito! Preparei o plano para o seu Hotel & Resort:\n\n• Estética refinada Preto & Branco com destaque para suítes exclusivas\n• Menu simples e bonito com navegação fluida e botão de reserva\n• Seção de acomodações com tarifas por noite em Meticais (MZN)\n• Comodidades premium (piscina infinita, SPA, gastronomia)\n• Rodapé minimalista com informações e termos.\n\nDeseja aceitar e iniciar a geração do código?`;
    }

    if (p.includes('loja') || p.includes('ecommerce') || p.includes('produto') || p.includes('venda')) {
      return `Excelente! Preparei o plano para a sua Loja Online:\n\n• Layout monocromático Preto & Branco com vitrine minimalista de produtos\n• Menu simples e bonito com categorias e botão de pedido\n• Catálogo com preços em Meticais e botões diretos de compra no WhatsApp\n• Rodapé clean com vantagens de envio, suporte e pagamentos locais.\n\nDeseja aceitar e iniciar a geração do código?`;
    }

    return `Entendido! Preparei o seguinte plano de desenvolvimento:\n\n• Tema minimalista Preto & Branco de alto contraste\n• Menu simples e bonito com logotipo e navegação essencial\n• Seções completas: Hero impactante, serviços com preços, CTA e Rodapé clean\n• 100% responsivo para telemóveis e computadores.\n\nDeseja aceitar e iniciar a geração do código?`;
  };

  const cancelProposal = (msgId: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id === msgId && m.proposal) {
        return {
          ...m,
          proposal: { ...m.proposal, status: 'declined' }
        };
      }
      return m;
    }));
  };

  // ─── Efeito Typewriter e Entrada Fluida (Estilo ChatGPT / Claude) ─────────
  const streamTypewriterMessage = async (
    targetMessage: ChatMessage,
    fullText: string,
    onComplete?: (finalMessages: ChatMessage[]) => void
  ) => {
    const msgId = targetMessage.id;
    // Adicionar a mensagem inicialmente com conteúdo vazio e cursor ativo
    setMessages(prev => [...prev, { ...targetMessage, content: '', isStreamingText: true }]);

    const len = fullText.length;
    let currentIdx = 0;
    // Velocidade dinâmica: textos maiores escrevem mais rápido para fluidez sem tédio
    const chunkSize = len > 350 ? 5 : 3;

    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        currentIdx += chunkSize;
        if (currentIdx >= len) {
          clearInterval(interval);
          setMessages(prev => {
            const next = prev.map(m => m.id === msgId ? { ...m, content: fullText, isStreamingText: false } : m);
            if (onComplete) onComplete(next);
            return next;
          });
          chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          resolve();
        } else {
          const partial = fullText.slice(0, currentIdx);
          setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: partial, isStreamingText: true } : m));
          chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      }, 15);
    });
  };

  // ─── Ponto de Entrada: Enviar Prompt (Gera Proposta Prévia ou Responde Chat) ──
  const handleGenerate = async (promptText?: string, titleOverride?: string, autoAccept: boolean = false) => {
    if (!currentUser) {
      setAuthModalReason('Para enviar prompts e gerar websites inteligentes com a nossa IA, inicie sessão ou crie a sua conta gratuita.');
      setIsAuthRequiredModalOpen(true);
      return;
    }

    const textToSend = promptText || prompt;
    if (!textToSend.trim() || isGenerating) return;

    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setPrompt('');

    // Se o utilizador está no Modo Conversa OU for saudação casual -> responde direto como consultoria sem alterar o site
    if (interactionMode === 'chat' || isConversationalPrompt(textToSend)) {
      setMessages(prev => [...prev, userMsg]);
      await executeGeneration(textToSend, titleOverride, undefined, true);
      return;
    }

    // Se autoAccept for true -> executa direto
    if (autoAccept) {
      setMessages(prev => [...prev, userMsg]);
      await executeGeneration(textToSend, titleOverride);
      return;
    }

    // Se for comando de código no Modo Desenvolvimento -> Cria o card de proposta com entrada fluida
    const plan = generateProposalPlan(textToSend, Boolean(currentHtml));
    const proposalMsg: ChatMessage = {
      id: `msg_proposal_${Date.now()}`,
      role: 'assistant',
      content: '',
      isStreamingText: true,
      proposal: {
        prompt: textToSend,
        titleOverride,
        status: 'pending'
      },
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsGenerating(true);
    setTimeout(async () => {
      setIsGenerating(false);
      await streamTypewriterMessage(proposalMsg, plan);
    }, 350);
  };

  // ─── Execução do Streaming SSE (Acionado ao Clicar em "Aceitar e Gerar Código" ou Chat) ─
  const executeGeneration = async (
    textToSend: string, 
    titleOverride?: string, 
    proposalMsgId?: string,
    isDirectChat: boolean = false
  ) => {
    if (!currentUser) {
      setAuthModalReason('Para executar o modelo de IA e compilar o código do seu site, crie uma conta gratuita ou inicie sessão.');
      setIsAuthRequiredModalOpen(true);
      return;
    }

    if (isGenerating) return;

    // Atualiza status da proposta para aceite
    if (proposalMsgId) {
      setMessages(prev => prev.map(m => {
        if (m.id === proposalMsgId && m.proposal) {
          return {
            ...m,
            proposal: { ...m.proposal, status: 'accepted' }
          };
        }
        return m;
      }));
    }

    const userEmail = currentUser?.email || 'admin@wehosthere.com';
    setIsGenerating(true);
    setStreamingCode('');

    let accumulatedHtml = '';
    let isChatResponse = false;
    let chatReply = '';
    let hasSwitchedToCode = false;

    try {
      const res = await fetch('/api/ai/site-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          currentHtml,
          title: titleOverride || projectTitle,
          userEmail,
          mode: isDirectChat || interactionMode === 'chat' ? 'chat' : 'builder'
        })
      });

      if (!res.ok || !res.body) throw new Error('Falha ao processar IA');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let explanation = '';
      let diffSummary = '';
      let executionSeconds = 1;
      let modelUsed = '';

      // Ler o stream SSE chunk por chunk
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);

            if (event.type === 'chat') {
              isChatResponse = true;
              chatReply = event.message || '';
              modelUsed = event.modelUsed || 'Assistente';
            } else if (event.type === 'chunk') {
              if (!hasSwitchedToCode) {
                hasSwitchedToCode = true;
                setIsStreaming(true);
                setActiveTab('code');
              }
              accumulatedHtml += event.content;
              setStreamingCode(prev => prev + event.content);
              if (streamingRef.current) {
                streamingRef.current.scrollTop = streamingRef.current.scrollHeight;
              }
            } else if (event.type === 'done') {
              explanation = event.explanation || 'Página gerada e validada no preview.';
              diffSummary = event.diffSummary || '+150 linhas';
              executionSeconds = event.executionSeconds || 1;
              modelUsed = event.modelUsed || '';
            } else if (event.type === 'error') {
              throw new Error(event.message);
            }
          } catch {
            // ignorar linhas SSE intermediárias
          }
        }
      }

      // Caso 1: Foi apenas conversa -> Efeito Typewriter fluido
      if (isChatResponse && chatReply) {
        setIsStreaming(false);
        setStreamingCode('');
        setIsGenerating(false);
        setActiveTab('preview');

        const aiMsg: ChatMessage = {
          id: `msg_ai_${Date.now()}`,
          role: 'assistant',
          content: '',
          isStreamingText: true,
          modelUsed,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        await streamTypewriterMessage(aiMsg, chatReply, (finalMessages) => {
          if (currentUser?.email) {
            saveProjectToDb({
              id: projectId,
              userEmail,
              userName: currentUser?.name || 'Cliente',
              title: titleOverride || projectTitle,
              slug: projectSlug,
              subdomain: projectSlug,
              htmlContent: currentHtml,
              promptHistory: finalMessages,
              versions: versions.map(v => ({
                versionNumber: v.versionNumber,
                htmlContent: v.html,
                prompt: v.prompt,
                createdAt: new Date().toISOString()
              })),
              status: isPublished ? 'published' : 'draft'
            });
          }
        });
        return;
      }

      // Caso 2: Gerou o código do site -> Efeito Typewriter na explicação
      if (accumulatedHtml) {
        setCurrentHtml(accumulatedHtml);
        setStreamingCode('');
        setIsStreaming(false);
        setActiveTab('preview');
        setIsGenerating(false);

        const aiMsg: ChatMessage = {
          id: `msg_ai_${Date.now()}`,
          role: 'assistant',
          content: '',
          isStreamingText: true,
          diffSummary,
          executionSeconds,
          modelUsed,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        // Guardar versão no histórico
        const nextVersionNumber = versions.length + 1;
        const newVersionObj: ProjectVersion = {
          versionNumber: nextVersionNumber,
          html: accumulatedHtml,
          prompt: textToSend,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const updatedVersions = [...versions, newVersionObj];
        setVersions(updatedVersions);
        setSelectedVersionIndex('latest');

        await streamTypewriterMessage(aiMsg, explanation, (finalMessages) => {
          saveProjectToDb({
            id: projectId,
            userEmail,
            userName: currentUser?.name || 'Cliente',
            title: titleOverride || projectTitle,
            slug: projectSlug,
            subdomain: projectSlug,
            htmlContent: accumulatedHtml,
            promptHistory: finalMessages,
            versions: updatedVersions.map(v => ({
              versionNumber: v.versionNumber,
              htmlContent: v.html,
              prompt: v.prompt,
              createdAt: new Date().toISOString()
            })),
            status: isPublished ? 'published' : 'draft'
          });
        });
      }
    } catch (err) {
      console.error('Erro no streaming de IA:', err);
      setStreamingCode('');
      setIsStreaming(false);
      setActiveTab('preview');
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
      setIsStreaming(false);
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
    if (!currentUser) {
      setAuthModalReason('Para publicar o seu site online com subdomínio ou domínio personalizado, inicie sessão na sua conta.');
      setIsAuthRequiredModalOpen(true);
      return;
    }
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

  // ─── Exportar como ZIP (HTML + CSS extraído + README) ─────────────────────
  const handleDownloadZip = async () => {
    if (!displayedHtml) return;
    setIsExportingZip(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Extrair blocos de CSS de tags <style>
      let extractedCss = '';
      const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
      let match;
      while ((match = styleRegex.exec(displayedHtml)) !== null) {
        if (match[1]?.trim()) {
          extractedCss += match[1].trim() + '\n\n';
        }
      }

      // Se existir CSS, salva na pasta css/style.css
      if (extractedCss) {
        zip.folder('css')?.file('style.css', extractedCss);
      }

      // Adicionar index.html limpo e completo
      zip.file('index.html', displayedHtml);

      // Adicionar README.md profissional com instruções
      const readmeContent = `# ${projectTitle}
Website criado e exportado via WEHOSTHERE Studio AI (https://www.wehosthere.com)
Data de Exportação: ${new Date().toLocaleDateString('pt-MZ')}

## Estrutura dos Ficheiros:
- \`index.html\`: Código completo do seu website pronto para abrir em qualquer navegador.
${extractedCss ? '- `css/style.css`: Estilos e regras CSS extraídos para personalização.\n' : ''}
## Como usar:
1. Extraia todos os ficheiros numa pasta no seu computador.
2. Dê duplo clique em \`index.html\` para abrir diretamente no Chrome, Edge ou Safari.
3. Para publicar online com subdomínio grátis ou domínio próprio (.co.mz / .com), aceda a https://www.wehosthere.com.
`;
      zip.file('README.md', readmeContent);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectSlug || 'site'}-wehosthere.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao gerar ficheiro ZIP:', err);
    } finally {
      setIsExportingZip(false);
    }
  };

  // ─── Editor de Código Inline ──────────────────────────────────────────────
  const handleStartCodeEditing = () => {
    if (!currentUser) {
      setAuthModalReason('Para editar diretamente o código-fonte e guardar alterações personalizadas, inicie sessão.');
      setIsAuthRequiredModalOpen(true);
      return;
    }
    setEditedCode(displayedHtml);
    setIsEditingCode(true);
  };

  const handleDiscardCodeEditing = () => {
    setEditedCode(displayedHtml);
    setIsEditingCode(false);
  };

  const handleSaveEditedCode = () => {
    if (!editedCode) return;
    setCurrentHtml(editedCode);
    setIsEditingCode(false);
    setEditorSaveSuccess(true);
    setTimeout(() => setEditorSaveSuccess(false), 2500);

    // Salvar nova versão no histórico
    const nextVer: ProjectVersion = {
      versionNumber: versions.length + 1,
      html: editedCode,
      prompt: 'Edição manual no código fonte',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updatedVersions = [...versions, nextVer];
    setVersions(updatedVersions);
    setSelectedVersionIndex('latest');

    // Registar no chat daquele projeto
    const manualEditMsg: ChatMessage = {
      id: `msg_manual_${Date.now()}`,
      role: 'assistant',
      content: 'Código HTML atualizado manualmente via Editor Inline. As alterações já foram aplicadas ao preview interativo.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const newMessages = [...messages, manualEditMsg];
    setMessages(newMessages);

    // Salvar no MongoDB
    if (currentUser?.email) {
      saveProjectToDb({
        id: projectId,
        userEmail: currentUser.email,
        userName: currentUser.name || 'Cliente',
        title: projectTitle,
        slug: projectSlug,
        subdomain: projectSlug,
        htmlContent: editedCode,
        promptHistory: newMessages,
        versions: updatedVersions.map(v => ({
          versionNumber: v.versionNumber,
          htmlContent: v.html,
          prompt: v.prompt,
          createdAt: new Date().toISOString()
        })),
        status: isPublished ? 'published' : 'draft'
      });
    }
  };

  // ─── Limpar Histórico de Chat do Projeto Atual ────────────────────────────
  const handleClearProjectChat = () => {
    setIsClearChatModalOpen(true);
  };

  const handleConfirmClearChat = () => {
    setIsClearChatModalOpen(false);
    const initialMsg: ChatMessage = {
      id: `msg_cleared_${Date.now()}`,
      role: 'assistant',
      content: `Conversa reiniciada para o projeto "${projectTitle}". O seu código atual está preservado. O que deseja alterar a seguir?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([initialMsg]);
    if (currentUser?.email) {
      saveProjectToDb({
        id: projectId,
        userEmail: currentUser.email,
        userName: currentUser.name || 'Cliente',
        title: projectTitle,
        slug: projectSlug,
        subdomain: projectSlug,
        htmlContent: currentHtml,
        promptHistory: [initialMsg],
        versions: versions.map(v => ({
          versionNumber: v.versionNumber,
          htmlContent: v.html,
          prompt: v.prompt,
          createdAt: new Date().toISOString()
        })),
        status: isPublished ? 'published' : 'draft'
      });
    }
  };

  // ─── Modal e Link de Partilha de Pré-visualização ─────────────────────────
  const previewShareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/site/${projectSlug}`
    : `https://www.wehosthere.com/site/${projectSlug}`;

  const handleOpenShareModal = async () => {
    if (currentUser?.email && currentHtml) {
      await saveProjectToDb({
        id: projectId,
        userEmail: currentUser.email,
        userName: currentUser.name || 'Cliente',
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
        status: isPublished ? 'published' : 'draft'
      });
    }
    setIsShareModalOpen(true);
  };

  const handleCopyShareUrl = () => {
    navigator.clipboard.writeText(previewShareUrl);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2000);
  };

  // ─── Manipular Upload e Aplicação do Logótipo ────────────────────────────
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoErrorMessage('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLogoErrorMessage('Por favor, selecione um ficheiro de imagem válido (PNG, SVG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setLogoPreviewUrl(dataUrl);
        setLogoInputUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyLogo = () => {
    if (!currentUser) {
      setAuthModalReason('Para personalizar e guardar o logótipo da marca nos seus projetos, inicie sessão.');
      setIsAuthRequiredModalOpen(true);
      return;
    }
    const targetLogo = logoPreviewUrl || logoInputUrl;
    if (!targetLogo || !displayedHtml) return;

    const newHtml = applyLogoToHtml(displayedHtml, targetLogo, logoHeight, logoShowText);
    setCurrentHtml(newHtml);
    setIsLogoModalOpen(false);
    setLogoSuccessToast(true);
    setTimeout(() => setLogoSuccessToast(false), 3000);

    // Salvar versão no histórico
    const nextVer: ProjectVersion = {
      versionNumber: versions.length + 1,
      html: newHtml,
      prompt: 'Configuração do logotipo da marca',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updatedVersions = [...versions, nextVer];
    setVersions(updatedVersions);
    setSelectedVersionIndex('latest');

    // Registar no chat daquele projeto
    const logoMsg: ChatMessage = {
      id: `msg_logo_${Date.now()}`,
      role: 'assistant',
      content: 'Logótipo da sua empresa aplicado com sucesso na barra de navegação do site! As proporções foram ajustadas para manter a nitidez.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updatedMessages = [...messages, logoMsg];
    setMessages(updatedMessages);

    // Guardar no MongoDB
    if (currentUser?.email) {
      saveProjectToDb({
        id: projectId,
        userEmail: currentUser.email,
        userName: currentUser.name || 'Cliente',
        title: projectTitle,
        slug: projectSlug,
        subdomain: projectSlug,
        htmlContent: newHtml,
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
  };

  const handleRequestDeleteProject = (id: string, title: string) => {
    setProjectToDelete({ id, title });
  };

  const handleConfirmDeleteProject = async () => {
    if (!currentUser?.email || !projectToDelete) return;
    setIsDeletingProject(true);
    try {
      const res = await fetch(`/api/ai/sites?id=${encodeURIComponent(projectToDelete.id)}&userEmail=${encodeURIComponent(currentUser.email)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSavedProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
        if (projectId === projectToDelete.id) {
          initNewProject();
        }
        setProjectToDelete(null);
      }
    } catch (err) {
      console.warn('Erro ao eliminar projeto:', err);
    } finally {
      setIsDeletingProject(false);
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
    <div className="flex flex-col h-screen bg-[#09090b] text-[#fafafa] font-sans overflow-hidden antialiased selection:bg-blue-600 selection:text-white">
      <style>{`
        @keyframes msgSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes mascoteFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
      `}</style>

      {/* Barra de Aviso para Visitantes Não Autenticados (Modo Demonstração) */}
      {!currentUser && (
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-primary-700 text-white px-3 sm:px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-md shrink-0 z-40 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 text-white border border-white/30 px-2 py-0.5 rounded-full font-bold uppercase text-[9px] sm:text-[10px] tracking-wider shrink-0">
              Modo Demonstração
            </span>
            <span className="text-[11px] sm:text-xs text-white/95 font-medium">
              Você está a explorar o Construtor IA. Faça login para gerar novos sites personalizados e publicá-los na internet.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/login?callbackUrl=/dashboard/builder"
              className="bg-white text-blue-900 hover:bg-blue-50 font-extrabold px-3 py-1 rounded-lg text-xs transition shadow-sm"
            >
              Iniciar Sessão
            </Link>
            <Link
              href="/register?callbackUrl=/dashboard/builder"
              className="bg-white/20 hover:bg-white/30 text-white font-semibold px-3 py-1 rounded-lg text-xs transition border border-white/20"
            >
              Criar Conta Grátis
            </Link>
          </div>
        </div>
      )}

      {/* Conteúdo Principal do Studio */}
      <div className="flex flex-1 h-full overflow-hidden relative">
        {/* Backdrop para Mobile ao abrir a Sidebar */}
        {isSidebarOpen && isMobile && (
          <div 
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity cursor-pointer"
          />
        )}

      {/* ── COLUNA 1: SIDEBAR DE PROJETOS E CONVERSAS (Estilo v0) ─────────────── */}
      <aside className={`h-full border-r border-[#27272a] bg-[#0c0c0e] flex flex-col transition-all duration-300 shrink-0 ${
        isMobile
          ? `fixed inset-y-0 left-0 z-50 w-72 shadow-2xl transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'}`
          : `relative z-30 ${isSidebarOpen ? 'w-64 sm:w-72' : 'w-0 -translate-x-full overflow-hidden border-r-0'}`
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
            onClick={() => initNewProject(true)}
            className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-gray-100 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-black" />
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
                      handleRequestDeleteProject(p.id, p.title || 'Sem título');
                    }}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition opacity-70 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
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
                      if (isMobile) {
                        setIsSidebarOpen(false);
                        setIsChatOpen(true);
                        setMobileTab('chat');
                      }
                      setProjectTitle(s.title);
                      handleGenerate(s.p, s.title, false);
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
          width: isMobile 
            ? (isChatOpen ? '100%' : 0) 
            : (isChatOpen ? `${chatWidth}px` : 0),
          minWidth: isMobile 
            ? 0 
            : (isChatOpen ? '280px' : 0),
          maxWidth: isMobile 
            ? '100%' 
            : (isChatOpen ? '800px' : 0),
        }}
        className={`flex flex-col h-full bg-[#09090b] relative z-20 shrink-0 ${
          isMobile
            ? (isChatOpen ? 'w-full flex-1' : 'w-0 overflow-hidden hidden')
            : (isChatOpen ? 'border-r border-[#27272a]' : 'w-0 overflow-hidden border-r-0')
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
            {/* Contador de Histórico de Conversas */}
            <span 
              className="text-[10px] font-mono text-gray-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full hidden sm:inline"
              title="Total de mensagens guardadas no histórico deste projeto"
            >
              {messages.length} msgs
            </span>

            {/* Limpar Histórico de Chat deste Projeto */}
            <button
              onClick={handleClearProjectChat}
              className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-white/5 transition cursor-pointer"
              title="Reiniciar conversa deste projeto (mantém o código do site intacto)"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full hidden sm:flex items-center gap-1 ${
              isPublished 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              {isPublished ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
              <span>{isPublished ? 'Publicado' : 'Rascunho'}</span>
            </span>

            {/* Botão Ver Preview no Mobile */}
            <button
              onClick={() => {
                setIsChatOpen(false);
                setMobileTab('preview');
              }}
              className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md transition active:scale-95 cursor-pointer shrink-0"
              title="Alternar para a Pré-visualização do Site"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>

            {/* Botão para encolher/colapsar o Chat no Desktop */}
            <button
              onClick={() => setIsChatOpen(false)}
              className="hidden md:block p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
              title="Colapsar Barra de Chat (Ver Preview Total)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mensagens do Chat */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                style={{
                  animation: `msgSlideIn 0.28s cubic-bezier(0.22,1,0.36,1) both`,
                  animationDelay: `${Math.min(idx * 40, 300)}ms`,
                }}
              >
                {/* Balão do Usuário */}
                {isUser ? (
                  <div className="max-w-[90%] bg-blue-600 text-white px-4 py-3 rounded-2xl rounded-tr-sm text-xs sm:text-sm shadow-md font-medium leading-relaxed">
                    {m.content}
                  </div>
                ) : (
                  /* Card do Assistente no Estilo v0 */
                  <div className="w-full space-y-2">
                    {m.executionSeconds && !m.isStreamingText && (
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-400 font-mono py-1 animate-in fade-in duration-300">
                        <span className="flex items-center gap-1 text-gray-300">
                          <Clock className="w-3 h-3 text-gray-400" /> {m.executionSeconds}s
                        </span>
                        {m.modelUsed && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.modelUsed.includes('Gemini') || m.modelUsed.includes('GPT')
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-white/10 text-gray-300 border border-white/10'
                          }`}>
                            {m.modelUsed}
                          </span>
                        )}
                        {m.diffSummary && (
                          <span className="px-1.5 py-0.5 rounded bg-white/5 text-gray-300 font-bold text-[10px]">
                            {m.diffSummary}
                          </span>
                        )}
                        <span className="text-gray-400">Página validada no preview</span>
                      </div>
                    )}

                    <div className="bg-[#18181b] border border-[#27272a] rounded-2xl rounded-tl-sm p-4 text-xs sm:text-sm text-gray-200 leading-relaxed shadow-sm animate-in fade-in slide-in-from-bottom-1 duration-200">
                      <div className="whitespace-pre-line leading-relaxed">
                        {formatMessageContent(m.content)}
                        {m.isStreamingText && (
                          <span className="inline-block w-1.5 h-3.5 bg-blue-400 animate-pulse ml-1 align-middle rounded-sm shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                        )}
                      </div>

                      {/* Card de Proposta e Confirmação de Código */}
                      {m.proposal && !m.isStreamingText && (
                        <div className="mt-3 pt-3 border-t border-[#27272a] animate-in fade-in duration-200">
                          {m.proposal.status === 'pending' && (
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                disabled={isGenerating}
                                onClick={() => executeGeneration(m.proposal!.prompt, m.proposal!.titleOverride, m.id)}
                                className="px-4 py-2 rounded-xl bg-white hover:bg-gray-100 text-black font-extrabold text-xs shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-black" />
                                <span>Aceitar e Gerar Código</span>
                              </button>
                              <button
                                type="button"
                                disabled={isGenerating}
                                onClick={() => cancelProposal(m.id)}
                                className="px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 text-xs font-medium transition cursor-pointer"
                              >
                                Cancelar
                              </button>
                            </div>
                          )}
                          {m.proposal.status === 'accepted' && (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Plano Aceite e Código Gerado</span>
                            </div>
                          )}
                          {m.proposal.status === 'declined' && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <X className="w-3.5 h-3.5" />
                              <span>Geração cancelada</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <span className="text-[10px] text-gray-400 mt-1 px-1">{m.timestamp}</span>
              </div>
            );
          })}

          {/* Indicador de Raciocínio / Streaming da IA (Estilo Claude / ChatGPT / v0) */}
          {isGenerating && (
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center gap-2 text-xs text-blue-400 font-mono py-1">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-blue-400 shrink-0" />
                <span className="font-semibold text-gray-300 truncate">
                  {isStreaming 
                    ? 'A gerar código em tempo real...' 
                    : elapsedThinkingSeconds < 1.4
                    ? 'A interpretar o seu pedido e o contexto...'
                    : elapsedThinkingSeconds < 3.2
                    ? 'A estruturar a resposta e detalhes de design...'
                    : 'A sintetizar a melhor solução...'}
                </span>
                <span className="ml-auto text-[10px] font-mono text-gray-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full shrink-0">
                  {elapsedThinkingSeconds.toFixed(1)}s
                </span>
                {isStreaming && (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                    AO VIVO
                  </span>
                )}
              </div>
              <div className="p-3.5 bg-[#0e0e11] border border-[#27272a] rounded-2xl relative overflow-hidden shadow-inner">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    <span className="text-xs text-gray-300 font-bold">Assistente WEHOSTHERE Studio</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">Processando</span>
                </div>
                <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 rounded-full w-full animate-pulse" />
              </div>
            </div>
          )}

          {/* Card Mobile de Atalho Rápido para Preview */}
          {displayedHtml && isMobile && (
            <div className="mt-4 p-3.5 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/30 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
              <div className="truncate min-w-0">
                <span className="text-xs font-bold text-white block truncate">Site Pronto no Preview</span>
                <span className="text-[10px] text-blue-300 block truncate">Interaja com a versão gerada</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsChatOpen(false);
                  setMobileTab('preview');
                }}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md transition active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Ver Agora</span>
              </button>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Barra de Input no Fundo */}
        <div className="p-3 border-t border-[#27272a] bg-[#0c0c0e]">
          {/* Seletor de Modo: Desenvolvimento (Gera Código) vs Conversa (Consultoria de IA) */}
          <div className="flex items-center justify-between mb-2.5 px-0.5">
            <div className="flex items-center gap-1 bg-[#18181b] p-0.5 rounded-xl border border-[#27272a]">
              <button
                type="button"
                onClick={() => setInteractionMode('builder')}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  interactionMode === 'builder'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Modo Desenvolvimento: Gera e altera o código do site ao vivo no preview"
              >
                <Wand2 className="w-3 h-3 text-black" />
                <span>Desenvolvimento</span>
              </button>
              <button
                type="button"
                onClick={() => setInteractionMode('chat')}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  interactionMode === 'chat'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Modo Conversa: Consultoria, dúvidas e ideias sem alterar o site"
              >
                <MessageSquare className="w-3 h-3 text-white" />
                <span>Conversa</span>
              </button>
            </div>

            <span className="text-[10px] text-gray-500 font-mono hidden sm:inline">
              {interactionMode === 'builder' ? 'Altera o site' : 'Não altera o site'}
            </span>
          </div>

          {/* ── Templates / Modelos Prontos ── */}
          {interactionMode === 'builder' && (
            <div className="mb-2">
              <button
                type="button"
                onClick={() => setShowTemplates(prev => !prev)}
                className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-white transition cursor-pointer mb-1.5 group"
              >
                <Sparkles className="w-3 h-3 text-amber-400 group-hover:animate-spin" />
                <span className="font-semibold">Modelos prontos</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
              </button>
              {showTemplates && (
                <div className="grid grid-cols-2 gap-1.5 mb-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  {[
                    { icon: '💼', label: 'Freelancer / CV', prompt: 'Cria um site pessoal profissional para freelancer. Inclui secção Hero com foto, serviços oferecidos (Design, Web, Marketing), portfólio com exemplos, depoimentos de clientes, e formulário de contacto com número de WhatsApp. Design moderno com cores escuras e detalhes dourados.' },
                    { icon: '🍽️', label: 'Restaurante', prompt: 'Cria um site para restaurante moçambicano chamado "Sabor do Mar". Inclui menu com categorias (Entradas, Pratos Principais, Bebidas, Sobremesas), galeria de pratos com fotos, horário de funcionamento, localização no mapa, e botão para reserva de mesa via WhatsApp. Design quente e acolhedor.' },
                    { icon: '✂️', label: 'Barbearia / Salão', prompt: 'Cria um site para barbearia moderna chamada "Corte & Arte". Inclui galeria de cortes, lista de serviços com preços (em Meticais), sistema de agendamento via WhatsApp, depoimentos de clientes e localização. Design urbano e masculino com preto e dourado.' },
                    { icon: '🛍️', label: 'Loja Online', prompt: 'Cria um site para loja de produtos variados. Inclui banner promocional, catálogo de produtos com imagens, preços em Meticais, botão de compra via WhatsApp, secção de ofertas especiais, e rodapé com redes sociais. Design colorido e apelativo.' },
                    { icon: '🎯', label: 'Coach / Formador', prompt: 'Cria um site para coach profissional e formador. Inclui apresentação pessoal impactante, lista de programas e formações oferecidas, resultados de clientes anteriores (depoimentos), calendário de eventos próximos, e formulário de inscrição. Design inspirador com gradientes vibrantes.' },
                    { icon: '🎨', label: 'Portfólio Criativo', prompt: 'Cria um portfólio criativo para designer ou fotógrafo. Inclui galeria de trabalhos em grelha, mini bio pessoal, secção de serviços e preços, botão de contacto e links para redes sociais. Design minimalista e elegante com muito espaço branco e tipografia moderna.' },
                    { icon: '🎉', label: 'Eventos / Festa', prompt: 'Cria um site para empresa de organização de eventos chamada "Festa Total". Inclui galeria de eventos passados, tipos de eventos que organizam (Casamentos, Aniversários, Corporativo), formulário de pedido de orçamento, countdown para próximo evento, e contactos. Design festivo e animado.' },
                    { icon: '🎵', label: 'Músico / Artista', prompt: 'Cria um site para músico ou artista moçambicano. Inclui bio artística, discografia com capas de álbuns, vídeos do YouTube embedidos, datas de espectáculos, galeria de fotos, e links para plataformas (Spotify, YouTube, Instagram). Design artístico com cores vibrantes e efeitos visuais.' },
                  ].map(({ icon, label, prompt: tpl }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => { setPrompt(tpl); setShowTemplates(false); }}
                      className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/20 text-left transition cursor-pointer group"
                    >
                      <span className="text-base shrink-0">{icon}</span>
                      <span className="text-[11px] font-semibold text-gray-300 group-hover:text-white leading-tight">{label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

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
              placeholder={
                interactionMode === 'chat'
                  ? 'Pergunte qualquer coisa (ideias de marketing, textos, dúvidas)...'
                  : 'Peça uma alteração ou descreva o site para gerar código...'
              }
              rows={2}
              className="w-full bg-[#18181b] text-gray-100 placeholder-gray-500 rounded-2xl pl-4 pr-12 py-3 text-xs sm:text-sm border border-[#27272a] focus:outline-none focus:border-blue-500 transition resize-none"
            />
            <button
              type="submit"
              disabled={!prompt.trim() || isGenerating}
              className={`absolute right-3 bottom-4 p-2 rounded-xl transition ${
                prompt.trim() && !isGenerating
                  ? 'bg-white hover:bg-gray-100 text-black shadow-md cursor-pointer active:scale-95'
                  : 'bg-white/5 text-gray-600 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4 text-black" />
            </button>
          </form>

          {/* Chips Rápidos de Iteração Dinâmicos */}
          {interactionMode === 'builder' ? (
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 text-[11px] no-scrollbar">
              <button
                type="button"
                onClick={() => handleGenerate('Muda o fundo para um tom azul escuro e adiciona mais gradientes')}
                className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 whitespace-nowrap transition cursor-pointer flex items-center gap-1.5"
              >
                <Palette className="w-3 h-3 text-blue-400" />
                <span>Mudar Cores</span>
              </button>
              <button
                type="button"
                onClick={() => handleGenerate('Adiciona um botão de WhatsApp flutuante bem visível')}
                className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 whitespace-nowrap transition cursor-pointer flex items-center gap-1.5"
              >
                <MessageSquare className="w-3 h-3 text-emerald-400" />
                <span>Botão WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => handleGenerate('Adiciona uma tabela de preços comparativa com 3 planos')}
                className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 whitespace-nowrap transition cursor-pointer flex items-center gap-1.5"
                title="Adicionar tabela comparativa de preços com 3 planos"
              >
                <Tag className="w-3 h-3 text-purple-400" />
                <span>Preços</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 text-[11px] no-scrollbar">
              <button
                type="button"
                onClick={() => handleGenerate('Como posso melhorar as vendas e conversão deste site em Moçambique?')}
                className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 whitespace-nowrap transition cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Dicas de Vendas</span>
              </button>
              <button
                type="button"
                onClick={() => handleGenerate('Dá-me 5 ideias de slogans impactantes para este negócio')}
                className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 whitespace-nowrap transition cursor-pointer flex items-center gap-1.5"
              >
                <Tag className="w-3 h-3 text-blue-400" />
                <span>Ideias de Slogan</span>
              </button>
              <button
                type="button"
                onClick={() => handleGenerate('Qual a melhor estratégia para receber pagamentos via M-Pesa e e-Mola?')}
                className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 whitespace-nowrap transition cursor-pointer flex items-center gap-1.5"
              >
                <MessageSquare className="w-3 h-3 text-emerald-400" />
                <span>M-Pesa / Pagamentos</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── DIVISOR MANUAL REDIMENSIONÁVEL (Arrastar para Aumentar / Diminuir) ── */}
      {isChatOpen && !isMobile && (
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
      <main className={`flex flex-1 flex-col h-full bg-[#121217] relative z-10 overflow-hidden ${
        isMobile && isChatOpen ? 'hidden' : 'flex'
      }`}>
        
        {/* Barra Superior do Canvas */}
        <header className="h-14 px-3 sm:px-4 border-b border-[#27272a] bg-[#0e0e11] flex items-center justify-between gap-1.5 sm:gap-2">
          
          {/* Lado Esquerdo: Botões de Expandir Sidebar/Chat + Seletor Preview/Código */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition cursor-pointer shrink-0"
                title="Expandir Barra Lateral"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}

            {/* Botão de Voltar ao Chat no Mobile */}
            <button
              onClick={() => {
                setIsChatOpen(true);
                setMobileTab('chat');
              }}
              className="md:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer shadow-sm active:scale-95 shrink-0"
              title="Voltar ao Chat com IA"
            >
              <MessageSquare className="w-3.5 h-3.5 text-white" />
              <span>Chat</span>
            </button>

            {/* Botão de Abrir Chat no Desktop quando fechado */}
            {!isChatOpen && (
              <button
                onClick={() => setIsChatOpen(true)}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 text-black text-xs font-bold transition cursor-pointer shadow-sm active:scale-95"
                title="Abrir Chat com IA"
              >
                <MessageSquare className="w-3.5 h-3.5 text-black" />
                <span className="hidden sm:inline">Mostrar Chat</span>
              </button>
            )}

            {/* Alternador Preview / Código (Compacto com Tooltip) */}
            <div className="flex items-center gap-1 bg-[#18181b] p-0.5 sm:p-1 rounded-xl border border-[#27272a] shrink-0">
              <button
                onClick={() => setActiveTab('preview')}
                className={`p-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  activeTab === 'preview'
                    ? 'bg-white text-black font-extrabold shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Visualizar Preview Interativo"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Preview</span>
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`p-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  activeTab === 'code'
                    ? 'bg-white text-black font-extrabold shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Visualizar Código HTML Fonte"
              >
                <Code className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Código</span>
              </button>
            </div>
          </div>

          {/* Centro: Dropdown "Latest ▾" e Stepper de Versões < > (Exacto ao v0) */}
          <div className="flex items-center gap-1 bg-[#18181b] p-1 rounded-xl border border-[#27272a] relative shrink-0" ref={versionMenuRef}>
            
            {/* Botão Dropdown Versão */}
            <button
              onClick={() => setIsVersionDropdownOpen(!isVersionDropdownOpen)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-gray-200 hover:bg-white/5 transition cursor-pointer"
              title="Histórico de Versões do Projeto"
            >
              <History className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="text-[11px]">
                {selectedVersionIndex === 'latest' 
                  ? 'Latest' 
                  : `v${versions[selectedVersionIndex]?.versionNumber || selectedVersionIndex + 1}`}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />
            </button>

            {/* Stepper de Navegação de Versões < > */}
            <div className="hidden sm:flex items-center border-l border-[#27272a] pl-1 gap-0.5 text-gray-400">
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
                  ? `${versions.length}/${versions.length}` 
                  : `${(selectedVersionIndex as number) + 1}/${versions.length}`}
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
                        ? 'bg-white text-black font-extrabold shadow-sm'
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <div>
                      <span className="block font-semibold">Latest (Mais Recente)</span>
                      <span className="text-[10px] opacity-70">Versão atual de trabalho</span>
                    </div>
                    {selectedVersionIndex === 'latest' && <Check className="w-3.5 h-3.5 text-black" />}
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
                            ? 'bg-white text-black font-extrabold shadow-sm'
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
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-black" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Lado Direito: Modos Responsivos, Abrir em Nova Aba, Menu de Opções & Publicar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
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

            {/* Ações Diretas em Ecrãs Médios / Grandes */}
            <div className="hidden md:flex items-center gap-1.5">
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

              {/* BOTÃO CONFIGURAR LOGÓTIPO DO SITE */}
              <button
                onClick={() => setIsLogoModalOpen(true)}
                disabled={!displayedHtml}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition cursor-pointer disabled:opacity-40"
                title="Configurar Logótipo da Empresa (Upload do computador ou Link)"
              >
                <Upload className="w-4 h-4 text-purple-400" />
              </button>

              {/* BOTÃO EXPORTAR / BAIXAR HTML */}
              <button
                onClick={handleDownloadHtml}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition cursor-pointer"
                title="Descarregar ficheiro HTML completo para o computador"
              >
                <Download className="w-4 h-4 text-emerald-400" />
              </button>

              {/* BOTÃO EXPORTAR ZIP (HTML + CSS + README) */}
              <button
                onClick={handleDownloadZip}
                disabled={isExportingZip || !displayedHtml}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition cursor-pointer disabled:opacity-40"
                title="Exportar como ZIP (HTML + CSS extraído + README)"
              >
                {isExportingZip ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                ) : (
                  <FolderArchive className="w-4 h-4 text-amber-400" />
                )}
              </button>

              {/* BOTÃO PARTILHAR LINK DE PRÉ-VISUALIZAÇÃO */}
              <button
                onClick={handleOpenShareModal}
                disabled={!displayedHtml}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition cursor-pointer disabled:opacity-40"
                title="Partilhar link de pré-visualização com clientes antes de publicar"
              >
                <Share2 className="w-4 h-4 text-blue-400" />
              </button>
            </div>

            {/* Menu "Mais Opções" (⋯) no Mobile — Agrupa ferramentas com elegância */}
            <div className="relative md:hidden" ref={moreMenuRef}>
              <button
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition cursor-pointer"
                title="Mais Ferramentas do Projeto"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {isMoreMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-[#18181b] border border-[#27272a] rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                  <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5">
                    Ferramentas do Site
                  </div>

                  <button
                    onClick={() => {
                      setIsLogoModalOpen(true);
                      setIsMoreMenuOpen(false);
                    }}
                    disabled={!displayedHtml}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-gray-300 hover:text-white hover:bg-white/5 transition flex items-center gap-2.5 disabled:opacity-40 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Configurar Logótipo</span>
                  </button>

                  <button
                    onClick={() => {
                      handleDownloadHtml();
                      setIsMoreMenuOpen(false);
                    }}
                    disabled={!displayedHtml}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-gray-300 hover:text-white hover:bg-white/5 transition flex items-center gap-2.5 disabled:opacity-40 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Descarregar HTML</span>
                  </button>

                  <button
                    onClick={() => {
                      handleDownloadZip();
                      setIsMoreMenuOpen(false);
                    }}
                    disabled={isExportingZip || !displayedHtml}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-gray-300 hover:text-white hover:bg-white/5 transition flex items-center gap-2.5 disabled:opacity-40 cursor-pointer"
                  >
                    <FolderArchive className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Exportar como ZIP</span>
                  </button>

                  <button
                    onClick={() => {
                      handleOpenShareModal();
                      setIsMoreMenuOpen(false);
                    }}
                    disabled={!displayedHtml}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-gray-300 hover:text-white hover:bg-white/5 transition flex items-center gap-2.5 disabled:opacity-40 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Partilhar Pré-visualização</span>
                  </button>

                  {activeTab === 'code' && (
                    <button
                      onClick={() => {
                        handleCopyCode();
                        setIsMoreMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-gray-300 hover:text-white hover:bg-white/5 transition flex items-center gap-2.5 cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <Copy className="w-4 h-4 text-gray-400 shrink-0" />}
                      <span>{copiedCode ? 'Código Copiado!' : 'Copiar Código HTML'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* BOTÃO OPEN IN NEW TAB */}
            <button
              onClick={handleOpenInNewTab}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition cursor-pointer"
              title="Abrir em Nova Aba no Navegador"
            >
              <ExternalLink className="w-4 h-4 text-blue-400" />
            </button>

            {/* BOTÃO EXPORTAR CÓDIGO (ZIP / HTML) */}
            <button
              onClick={() => setIsExportModalOpen(true)}
              disabled={!displayedHtml}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 font-bold text-xs transition active:scale-95 cursor-pointer shrink-0 disabled:opacity-40"
              title="Exportar código-fonte do website em ZIP ou HTML"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exportar</span>
            </button>

            {/* BOTÃO PUBLICAR (Destaque Principal na cor Branca) */}
            <button
              onClick={() => {
                if (!currentUser) {
                  setAuthModalReason('Para publicar o seu website online com subdomínio e SSL gratuito, inicie sessão na sua conta.');
                  setIsAuthRequiredModalOpen(true);
                  return;
                }
                setIsPublishModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl bg-white hover:bg-gray-100 text-black font-extrabold text-xs shadow-md transition active:scale-95 cursor-pointer shrink-0"
              title="Publicar website online com subdomínio e SSL"
            >
              <Globe className="w-3.5 h-3.5 text-black" />
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
                className="px-3 py-1 rounded-lg bg-white hover:bg-gray-100 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Undo2 className="w-3.5 h-3.5 text-black" />
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
            <div
              className="flex flex-col items-center justify-center text-center p-6 max-w-lg mx-auto"
              style={{ animation: 'msgSlideIn 0.35s cubic-bezier(0.22,1,0.36,1) both' }}
            >
              <div
                className="relative w-20 h-20 mb-5 flex items-center justify-center drop-shadow-[0_12px_28px_rgba(37,99,235,0.35)]"
                style={{ animation: 'mascoteFloat 3s ease-in-out infinite' }}
              >
                <Image
                  src="/mascote-transparent.png"
                  alt="Mascote WEHOSTHERE"
                  width={80}
                  height={80}
                  className="object-contain"
                  priority
                />
              </div>
              <h3
                className="text-xl sm:text-2xl font-black text-white mb-2 tracking-tight"
                style={{ animation: 'msgSlideIn 0.35s cubic-bezier(0.22,1,0.36,1) 0.1s both' }}
              >
                O que deseja criar hoje?
              </h3>
              <p
                className="text-xs sm:text-sm text-gray-400 mb-8 leading-relaxed max-w-md"
                style={{ animation: 'msgSlideIn 0.35s cubic-bezier(0.22,1,0.36,1) 0.18s both' }}
              >
                Descreva a sua ideia no chat ou escolha um modelo abaixo.
              </p>

              <div className="w-full space-y-2 text-left">
                <p
                  className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1"
                  style={{ animation: 'msgSlideIn 0.3s cubic-bezier(0.22,1,0.36,1) 0.24s both' }}
                >
                  Modelos Recomendados:
                </p>
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
                          handleGenerate(m.p, m.title, false);
                        }}
                        className="p-3.5 rounded-2xl bg-[#18181b] border border-[#27272a] hover:border-blue-500/40 hover:bg-white/5 transition text-left cursor-pointer group shadow-sm"
                        style={{
                          animation: 'msgSlideIn 0.32s cubic-bezier(0.22,1,0.36,1) both',
                          animationDelay: `${0.28 + idx * 0.06}s`,
                        }}
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
          ) : isStreaming ? (
            /* Terminal de Código em Tempo Real (Streaming) */
            <div className="w-full h-full bg-[#060608] border border-[#27272a] rounded-2xl overflow-hidden flex flex-col font-mono">
              {/* Barra do terminal */}
              <div className="h-8 bg-[#111114] border-b border-[#27272a] flex items-center gap-2 px-3 shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                <span className="text-[10px] text-gray-500 ml-2 font-mono">index.html — em geração</span>
                <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  STREAMING
                </span>
              </div>
              {/* Código aparecendo com syntax highlighting */}
              <div
                ref={streamingRef}
                className="flex-1 overflow-auto relative"
              >
                <CodeBlock code={streamingCode} isStreaming={true} />
                <span
                  className="absolute bottom-4 left-4 inline-block w-[7px] h-[14px] bg-[#569cd6] animate-pulse align-middle"
                  style={{ marginLeft: `${(streamingCode.split('\n').at(-1)?.length ?? 0) * 6.9}px` }}
                />
              </div>
            </div>
          ) : (
            /* Visualizador / Editor de Código HTML Inline */
            <div className="w-full h-full bg-[#0e0e11] border border-[#27272a] rounded-2xl overflow-hidden flex flex-col font-mono">
              <div className="h-9 bg-[#111114] border-b border-[#27272a] flex items-center justify-between px-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                  <span className="text-[11px] text-gray-300 font-bold ml-2">index.html</span>
                  <span className="text-[10px] text-gray-500 hidden sm:inline">
                    {isEditingCode ? '— Modo Edição Direta' : '— Realce de Sintaxe'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {editorSaveSuccess && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 animate-in fade-in">
                      <Check className="w-3 h-3" /> Salvo no Preview!
                    </span>
                  )}

                  {isEditingCode ? (
                    <>
                      <button
                        type="button"
                        onClick={handleDiscardCodeEditing}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-gray-400 hover:text-white hover:bg-white/5 transition flex items-center gap-1 cursor-pointer"
                        title="Descartar alterações não salvas"
                      >
                        <X className="w-3 h-3" />
                        <span>Descartar</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveEditedCode}
                        className="px-3 py-1 rounded-lg text-[11px] font-bold bg-white text-black hover:bg-gray-200 transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                        title="Salvar alterações e aplicar ao preview (Ctrl+S)"
                      >
                        <Save className="w-3 h-3 text-black" />
                        <span>Salvar & Aplicar</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleStartCodeEditing}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                        title="Editar o código HTML diretamente nesta aba"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Editar Código</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
                        title={copiedCode ? 'Código Copiado!' : 'Copiar Código'}
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Área de Visualização com Realce ou Área de Edição Interativa */}
              {isEditingCode ? (
                <div className="flex flex-1 overflow-hidden font-mono text-[11.5px] leading-[1.65] bg-[#09090b]">
                  {/* Linhas numeradas sincronizadas */}
                  <div
                    className="select-none text-right pr-3 pl-3 pt-3 shrink-0 border-r border-white/5 text-gray-600 font-mono text-[11px] leading-[1.65] overflow-hidden"
                    style={{ minWidth: '3.2rem', userSelect: 'none' }}
                  >
                    {(editedCode || '').split('\n').map((_, idx) => (
                      <div key={idx}>{idx + 1}</div>
                    ))}
                  </div>

                  {/* Textarea editável com suporte a Tab e atalhos */}
                  <textarea
                    value={editedCode}
                    onChange={(e) => setEditedCode(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                        e.preventDefault();
                        handleSaveEditedCode();
                      }
                      if (e.key === 'Tab') {
                        e.preventDefault();
                        const target = e.currentTarget;
                        const start = target.selectionStart;
                        const end = target.selectionEnd;
                        const val = target.value;
                        setEditedCode(val.substring(0, start) + '  ' + val.substring(end));
                        setTimeout(() => {
                          target.selectionStart = target.selectionEnd = start + 2;
                        }, 0);
                      }
                    }}
                    spellCheck={false}
                    autoCapitalize="off"
                    autoCorrect="off"
                    className="flex-1 w-full h-full p-3 bg-transparent text-[#e4e4e7] font-mono text-[11.5px] leading-[1.65] outline-none border-0 resize-none whitespace-pre overflow-auto focus:ring-0 selection:bg-blue-600 selection:text-white"
                    placeholder="Escreva ou edite o seu código HTML aqui..."
                  />
                </div>
              ) : (
                /* Código com Syntax Highlighting estilo VS Code Dark+ */
                <CodeBlock code={displayedHtml} isStreaming={false} />
              )}
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
                className="px-6 py-2.5 rounded-xl bg-white hover:bg-gray-100 text-black font-extrabold text-xs shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isPublishing ? <RefreshCw className="w-4 h-4 animate-spin text-black" /> : <Globe className="w-4 h-4 text-black" />}
                <span>{isPublished ? 'Atualizar Publicação' : 'Publicar Agora'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE PARTILHA DE PRÉ-VISUALIZAÇÃO ────────────────────────── */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#121217] border border-[#27272a] rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsShareModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/10">
                <Share2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Partilhar Pré-visualização</h3>
                <p className="text-xs text-gray-400">Envie o link do site para clientes antes de publicar</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-gray-400 block mb-1.5">Link de Acesso Direto:</label>
                <div className="flex items-center gap-2 bg-[#09090b] border border-[#27272a] rounded-xl p-2.5">
                  <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                  <input
                    type="text"
                    readOnly
                    value={previewShareUrl}
                    className="bg-transparent text-xs text-gray-200 truncate flex-1 outline-none font-mono"
                  />
                  <button
                    onClick={handleCopyShareUrl}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    {copiedShareLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Botões de Ação Rápida */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    const text = encodeURIComponent(`Olá! Veja a pré-visualização do site "${projectTitle}" criado no Studio AI: ${previewShareUrl}`);
                    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-95"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={() => window.open(previewShareUrl, '_blank')}
                  className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Abrir no Browser</span>
                </button>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-[11px] text-blue-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  Este link público exibe o seu site em modo de teste em tempo real na nuvem WEHOSTHERE. Quando estiver pronto, use o botão <strong>Publicar</strong> para ativar o subdomínio oficial definitivo.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE CONFIGURAÇÃO DE LOGÓTIPO ────────────────────────────── */}
      {isLogoModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#121217] border border-[#27272a] rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsLogoModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center shadow-lg shadow-purple-500/10">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Logótipo do Website</h3>
                <p className="text-xs text-gray-400">Carregue a marca da sua empresa no menu do site</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Opção 1: Upload de Ficheiro do Computador / Telemóvel */}
              <div>
                <label className="text-[11px] font-bold text-gray-300 block mb-1.5">
                  1. Carregar Ficheiro (PNG transparente, SVG ou JPG):
                </label>
                <input
                  type="file"
                  ref={logoFileInputRef}
                  onChange={handleLogoFileUpload}
                  accept="image/png, image/jpeg, image/svg+xml, image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoFileInputRef.current?.click()}
                  className="w-full py-3 px-4 rounded-xl border border-dashed border-[#3f3f46] hover:border-purple-500 bg-[#09090b] text-gray-300 hover:text-white transition flex items-center justify-center gap-2.5 cursor-pointer text-xs font-semibold group"
                >
                  <Upload className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                  <span>Escolher Imagem do Computador / Telemóvel</span>
                </button>
              </div>

              {/* Separador OU */}
              <div className="flex items-center gap-2 my-2 text-[10px] text-gray-500 uppercase tracking-widest font-mono">
                <span className="flex-1 h-px bg-white/10" />
                <span>OU</span>
                <span className="flex-1 h-px bg-white/10" />
              </div>

              {/* Opção 2: Colar URL de Imagem */}
              <div>
                <label className="text-[11px] font-bold text-gray-300 block mb-1.5">
                  2. Colar Link / URL da Imagem:
                </label>
                <input
                  type="url"
                  value={logoInputUrl}
                  onChange={(e) => {
                    setLogoInputUrl(e.target.value);
                    setLogoPreviewUrl(e.target.value);
                  }}
                  placeholder="https://exemplo.com/logotipo.png"
                  className="w-full bg-[#09090b] text-xs text-gray-200 placeholder-gray-500 rounded-xl px-3 py-2.5 border border-[#27272a] focus:outline-none focus:border-purple-500 transition font-mono"
                />
              </div>

              {/* Pré-visualização do Logotipo */}
              {logoPreviewUrl && (
                <div className="p-3 rounded-2xl bg-[#09090b] border border-[#27272a]">
                  <span className="text-[10px] font-bold text-gray-400 block mb-2 font-mono uppercase tracking-wider">
                    Pré-visualização:
                  </span>
                  <div className="h-16 rounded-xl bg-zinc-900/60 border border-white/5 flex items-center justify-center p-2 relative overflow-hidden">
                    <img
                      src={logoPreviewUrl}
                      alt="Preview do Logo"
                      style={{ height: `${logoHeight}px`, maxHeight: '56px' }}
                      className="object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Ajustes de Altura e Exibição de Nome */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 block mb-1">Altura no Menu:</label>
                  <select
                    value={logoHeight}
                    onChange={(e) => setLogoHeight(Number(e.target.value))}
                    className="w-full bg-[#09090b] text-xs text-gray-200 rounded-xl px-2.5 py-2 border border-[#27272a] focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value={28}>Pequeno (28px)</option>
                    <option value={36}>Médio Padrão (36px)</option>
                    <option value={44}>Médio Alto (44px)</option>
                    <option value={52}>Grande (52px)</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300 py-2 select-none">
                    <input
                      type="checkbox"
                      checked={logoShowText}
                      onChange={(e) => setLogoShowText(e.target.checked)}
                      className="rounded border-[#27272a] text-purple-600 focus:ring-0 bg-[#09090b]"
                    />
                    <span>Manter nome escrito</span>
                  </label>
                </div>
              </div>

              {/* Mensagem de Erro de Upload */}
              {logoErrorMessage && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{logoErrorMessage}</span>
                </div>
              )}

              {/* Botões do Rodapé do Modal */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setIsLogoModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!logoPreviewUrl && !logoInputUrl}
                  onClick={handleApplyLogo}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-md shadow-purple-600/20 transition active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Aplicar no Site</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CUSTOMIZADO: CONFIRMAÇÃO DE ELIMINAR PROJETO ──────────── */}
      {projectToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#121217] border border-[#27272a] rounded-3xl max-w-sm sm:max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setProjectToDelete(null)}
              disabled={isDeletingProject}
              className="absolute top-5 right-5 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0 shadow-lg shadow-red-500/10">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Eliminar Projeto</h3>
                <p className="text-xs text-gray-400 mt-0.5">Esta ação é irreversível e removerá o site permanentemente.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#18181b] border border-[#27272a] mb-5">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block font-mono">Nome do Projeto:</span>
              <p className="text-sm font-bold text-white truncate mt-0.5">{projectToDelete.title}</p>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeletingProject}
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition cursor-pointer disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeletingProject}
                onClick={handleConfirmDeleteProject}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-lg shadow-red-600/30 transition active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeletingProject ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>A eliminar...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5 text-white" />
                    <span>Eliminar Projeto</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CUSTOMIZADO: CONFIRMAÇÃO DE LIMPAR CONVERSA ───────────── */}
      {isClearChatModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#121217] border border-[#27272a] rounded-3xl max-w-sm sm:max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsClearChatModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10">
                <RotateCw className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Reiniciar Conversa</h3>
                <p className="text-xs text-gray-400 mt-0.5">Deseja limpar as mensagens de chat deste projeto?</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 mb-5 leading-relaxed">
              O código HTML gerado e todas as versões anteriores do site permanecerão intactos no Preview. Apenas o histórico de mensagens deste projeto será limpo.
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsClearChatModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClearChat}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 transition active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5 text-black" />
                <span>Limpar Conversa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE EXPORTAÇÃO COMPLETA DE CÓDIGO (ZIP / HTML) ────────── */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#121217] border border-[#27272a] rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsExportModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/10">
                <Download className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Exportar Código-Fonte</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Descarregue o código do website para o seu computador ou hospede onde quiser.
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              {/* Opção 1: Pacote Completo ZIP */}
              <div className="p-4 rounded-2xl bg-[#18181b] border border-[#27272a] hover:border-amber-500/40 transition flex items-start justify-between gap-3 group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <FolderArchive className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">Pacote Completo (.ZIP)</span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wide">
                        Recomendado
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                      Inclui <code className="text-amber-300 font-mono">index.html</code>, pasta <code className="text-amber-300 font-mono">css/style.css</code> extraída e <code className="text-amber-300 font-mono">README.md</code> com instruções.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadZip}
                  disabled={isExportingZip || !displayedHtml}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-md transition active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-40"
                >
                  {isExportingZip ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>A gerar...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar .ZIP</span>
                    </>
                  )}
                </button>
              </div>

              {/* Opção 2: Ficheiro Único HTML */}
              <div className="p-4 rounded-2xl bg-[#18181b] border border-[#27272a] hover:border-emerald-500/40 transition flex items-start justify-between gap-3 group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Code className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">Ficheiro HTML Único (.HTML)</span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wide">
                        Autónomo
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                      Arquivo único com todo o HTML e CSS embutido. Dá duplo clique para abrir diretamente no navegador.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadHtml}
                  disabled={!displayedHtml}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 transition active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-40"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Baixar .HTML</span>
                </button>
              </div>

              {/* Opção 3: Copiar Código */}
              <div className="p-4 rounded-2xl bg-[#18181b] border border-[#27272a] hover:border-blue-500/40 transition flex items-start justify-between gap-3 group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Copy className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white">Copiar Código-Fonte</span>
                    <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                      Copia todo o código gerado para colar diretamente no seu editor de código favorito (VS Code, Cursor, etc.).
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  disabled={!displayedHtml}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 transition active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-40"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Dica da Plataforma */}
            <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 leading-relaxed flex items-center justify-between gap-3">
              <span>
                💡 <strong>Dica:</strong> Pode publicar este website online instantaneamente na WEHOSTHERE com SSL gratuito e domínio próprio.
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsExportModalOpen(false);
                  if (!currentUser) {
                    setAuthModalReason('Para publicar o seu website online com SSL gratuito e domínio próprio, inicie sessão na sua conta.');
                    setIsAuthRequiredModalOpen(true);
                    return;
                  }
                  setIsPublishModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shrink-0 cursor-pointer"
              >
                Publicar Agora
              </button>
            </div>
          </div>
        </div>
      )}

      </div> {/* Fim do inner container flex-1 */}

      {/* 🔒 MODAL DE AUTENTICAÇÃO NECESSÁRIA PARA VISITANTES */}
      {isAuthRequiredModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#121215] border border-white/15 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative text-center">
            {/* Botão Fechar */}
            <button
              onClick={() => setIsAuthRequiredModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Ícone com Glow */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/20">
              <Sparkles className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-extrabold text-white mb-2">
              Inicie Sessão para Continuar
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 mb-6 leading-relaxed">
              {authModalReason}
            </p>

            {/* Vantagens */}
            <div className="bg-[#18181b] border border-white/10 rounded-2xl p-4 mb-6 text-left space-y-2.5">
              <div className="flex items-center gap-2.5 text-xs text-gray-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Geração ilimitada de código e páginas com IA</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-gray-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Salvar múltiplos projetos e histórico de versões</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-gray-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Publicar online com domínio próprio e SSL grátis</span>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => router.push('/login?callbackUrl=/dashboard/builder')}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition active:scale-98 cursor-pointer"
              >
                Entrar na Minha Conta
              </button>
              <button
                type="button"
                onClick={() => router.push('/register?callbackUrl=/dashboard/builder')}
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/10 transition active:scale-98 cursor-pointer"
              >
                Criar Conta Gratuita
              </button>
              <button
                type="button"
                onClick={() => setIsAuthRequiredModalOpen(false)}
                className="w-full py-2 text-gray-400 hover:text-gray-200 text-xs font-semibold transition cursor-pointer"
              >
                Continuar a Explorar Modo Demonstração
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
