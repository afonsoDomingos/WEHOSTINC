'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
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
  MoreHorizontal, Sliders, Phone, Layout, DollarSign, QrCode
} from 'lucide-react';
import { auth, User } from '@/lib/auth';

// ============================================================
// ðŸŽ¨ SYNTAX HIGHLIGHTER â€” VS Code Dark+ Theme (zero deps)
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

    // Plain text / anything else â€” check for style/script blocks first
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

// â”€â”€â”€ HELPER: Aplicar Logotipo ao Menu e Rodapé do HTML â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ HELPER: Paletas de Cores Pré-Definidas & Refinamento â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface ColorPalettePreset {
  id: string;
  name: string;
  primary: string;
  primaryGradient: string;
  accent: string;
  bgDark: string;
  bgLight: string;
  textDark: string;
  textLight: string;
}

const COLOR_PALETTES: ColorPalettePreset[] = [
  {
    id: 'ocean',
    name: 'Azul Moderno & Ciano',
    primary: '#2563eb',
    primaryGradient: 'from-blue-600 to-indigo-600',
    accent: '#06b6d4',
    bgDark: '#020617',
    bgLight: '#f8fafc',
    textDark: '#f8fafc',
    textLight: '#0f172a'
  },
  {
    id: 'emerald',
    name: 'Esmeralda & Menta (Tech)',
    primary: '#059669',
    primaryGradient: 'from-emerald-600 to-teal-600',
    accent: '#10b981',
    bgDark: '#022c22',
    bgLight: '#f0fdf4',
    textDark: '#f0fdf4',
    textLight: '#064e3b'
  },
  {
    id: 'gold',
    name: 'Preto & Dourado Real (Luxo)',
    primary: '#d97706',
    primaryGradient: 'from-amber-500 to-yellow-600',
    accent: '#fbbf24',
    bgDark: '#09090b',
    bgLight: '#fffbeb',
    textDark: '#fef3c7',
    textLight: '#451a03'
  },
  {
    id: 'purple',
    name: 'Roxo Cyberpunk & IA',
    primary: '#7c3aed',
    primaryGradient: 'from-purple-600 to-indigo-600',
    accent: '#c084fc',
    bgDark: '#090514',
    bgLight: '#faf5ff',
    textDark: '#f5f3ff',
    textLight: '#2e1065'
  },
  {
    id: 'sunset',
    name: 'Laranja Sunset & Coral',
    primary: '#ea580c',
    primaryGradient: 'from-orange-500 to-rose-500',
    accent: '#f97316',
    bgDark: '#120703',
    bgLight: '#fff7ed',
    textDark: '#fff7ed',
    textLight: '#431407'
  },
  {
    id: 'minimal',
    name: 'Preto & Branco Puro (Minimalista)',
    primary: '#ffffff',
    primaryGradient: 'from-white to-gray-200',
    accent: '#a1a1aa',
    bgDark: '#000000',
    bgLight: '#ffffff',
    textDark: '#ffffff',
    textLight: '#09090b'
  }
];

function applyColorsToHtml(
  html: string,
  paletteId: string,
  customHex: string,
  mode: 'dark' | 'light'
): string {
  if (!html) return html;
  const palette = COLOR_PALETTES.find(p => p.id === paletteId) || COLOR_PALETTES[0];
  const primaryColor = customHex || palette.primary;
  const bgColor = mode === 'dark' ? palette.bgDark : palette.bgLight;
  const textColor = mode === 'dark' ? palette.textDark : palette.textLight;

  let updated = html;

  const styleTag = `  <style id="builder-custom-theme">
    :root {
      --primary-brand: ${primaryColor};
      --accent-brand: ${palette.accent};
      --bg-brand: ${bgColor};
      --text-brand: ${textColor};
    }
    body {
      background-color: ${bgColor} !important;
      color: ${textColor} !important;
    }
    .text-theme-primary { color: ${primaryColor} !important; }
    .bg-theme-primary { background-color: ${primaryColor} !important; }
    .border-theme-primary { border-color: ${primaryColor} !important; }
  </style>`;

  if (updated.includes('id="builder-custom-theme"')) {
    updated = updated.replace(/<style id="builder-custom-theme">[\s\S]*?<\/style>/i, styleTag.trim());
  } else if (updated.includes('</head>')) {
    updated = updated.replace('</head>', `${styleTag}\n</head>`);
  }

  // Atualizar botões de cor primária comuns
  updated = updated.replace(/bg-(?:blue|indigo|emerald|purple|orange|violet)-[56]00/g, `bg-[${primaryColor}]`);
  updated = updated.replace(/hover:bg-(?:blue|indigo|emerald|purple|orange|violet)-[567]00/g, `hover:opacity-90`);
  updated = updated.replace(/text-(?:blue|indigo|emerald|purple|orange|violet)-[45]00/g, `text-[${primaryColor}]`);

  if (mode === 'light') {
    updated = updated.replace(/class="([^"]*)bg-(?:slate-950|black|zinc-950)([^"]*)"/i, 'class="$1bg-white text-slate-900$2"');
  } else {
    updated = updated.replace(/class="([^"]*)bg-white([^"]*)"/i, `class="$1bg-[${bgColor}] text-white$2"`);
  }

  return updated;
}

// â”€â”€â”€ HELPER: Vincular WhatsApp com link oficial e botão flutuante â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function applyWhatsAppToHtml(
  html: string,
  phone: string,
  message: string,
  buttonText: string = 'Falar no WhatsApp',
  position: 'right' | 'left' = 'right'
): string {
  if (!html) return html;
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

  let updated = html;

  // Atualizar links existentes de WhatsApp
  updated = updated.replace(/https:\/\/wa\.me\/[0-9]+(?:\?[^"'\s]*)?/gi, waUrl);

  const floatingBtn = `  <!-- ðŸ’¬ Botão Flutuante de WhatsApp Configurado -->
  <a id="wehost-floating-whatsapp" href="${waUrl}" target="_blank" rel="noopener noreferrer"
     class="fixed ${position === 'left' ? 'bottom-6 left-6' : 'bottom-6 right-6'} z-50 flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white px-4 py-3 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 font-bold text-sm group"
     title="${buttonText}">
    <span class="relative flex h-3 w-3">
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
      <span class="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
    </span>
    <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
    </svg>
    <span class="hidden sm:inline">${buttonText}</span>
  </a>`;

  if (updated.includes('id="wehost-floating-whatsapp"')) {
    updated = updated.replace(/<!-- ðŸ’¬ Botão Flutuante de WhatsApp Configurado -->[\s\S]*?<\/a>/i, floatingBtn.trim());
  } else if (updated.includes('</body>')) {
    updated = updated.replace('</body>', `${floatingBtn}\n</body>`);
  } else {
    updated += floatingBtn;
  }

  return updated;
}

// â”€â”€â”€ HELPER: Inserir Tabela de Preços com Benefícios Personalizados â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface PricingConfigData {
  currency: string;
  cycle: string;
  plan1: { name: string; price: string; features: string[] };
  plan2: { name: string; price: string; badge: string; features: string[] };
  plan3: { name: string; price: string; features: string[] };
}

function applyPricingToHtml(html: string, config: PricingConfigData): string {
  if (!html) return html;

  const renderFeatures = (feats: string[]) => feats.filter(f => f.trim().length > 0).map(f => `
            <li class="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
              <svg class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
              <span>${f.trim()}</span>
            </li>`).join('');

  const pricingSection = `
    <!-- ðŸ·ï¸ Tabela de Preços e Benefícios -->
    <section id="precos" class="py-20 px-6 bg-slate-900/80 border-t border-slate-800 relative">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-16">
          <div class="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold px-3.5 py-1.5 rounded-full mb-4">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span>Investimento Transparente</span>
          </div>
          <h2 class="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">Planos & Preços Sob Medida</h2>
          <p class="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">Escolha o plano ideal para a sua empresa com todos os benefícios inclusos.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          <div class="p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition shadow-lg">
            <div>
              <h3 class="text-lg font-bold text-white mb-2">${config.plan1.name}</h3>
              <div class="flex items-baseline gap-1 my-4">
                <span class="text-3xl sm:text-4xl font-black text-white">${config.plan1.price}</span>
                <span class="text-sm font-semibold text-slate-400">${config.currency} ${config.cycle}</span>
              </div>
              <ul class="space-y-3 pt-4 border-t border-slate-800 mb-8">
                ${renderFeatures(config.plan1.features)}
              </ul>
            </div>
            <a href="#contacto" class="w-full py-3 px-4 rounded-xl text-center bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm transition shadow">
              Escolher ${config.plan1.name}
            </a>
          </div>

          <div class="p-8 rounded-3xl bg-gradient-to-b from-blue-950/60 to-slate-900 border-2 border-blue-500/80 flex flex-col justify-between relative shadow-2xl scale-105 z-10">
            <div class="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
              ${config.plan2.badge || 'Mais Popular'}
            </div>
            <div>
              <h3 class="text-lg font-bold text-white mb-2">${config.plan2.name}</h3>
              <div class="flex items-baseline gap-1 my-4">
                <span class="text-3xl sm:text-4xl font-black text-white">${config.plan2.price}</span>
                <span class="text-sm font-semibold text-blue-300">${config.currency} ${config.cycle}</span>
              </div>
              <ul class="space-y-3 pt-4 border-t border-blue-900/60 mb-8">
                ${renderFeatures(config.plan2.features)}
              </ul>
            </div>
            <a href="#contacto" class="w-full py-3 px-4 rounded-xl text-center bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm transition shadow-lg shadow-blue-600/30">
              Contratar ${config.plan2.name}
            </a>
          </div>

          <div class="p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition shadow-lg">
            <div>
              <h3 class="text-lg font-bold text-white mb-2">${config.plan3.name}</h3>
              <div class="flex items-baseline gap-1 my-4">
                <span class="text-3xl sm:text-4xl font-black text-white">${config.plan3.price}</span>
                <span class="text-sm font-semibold text-slate-400">${config.currency} ${config.cycle}</span>
              </div>
              <ul class="space-y-3 pt-4 border-t border-slate-800 mb-8">
                ${renderFeatures(config.plan3.features)}
              </ul>
            </div>
            <a href="#contacto" class="w-full py-3 px-4 rounded-xl text-center bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm transition shadow">
              Escolher ${config.plan3.name}
            </a>
          </div>
        </div>
      </div>
    </section>`;

  let updated = html;

  const existingPricingRegex = /<!-- ðŸ·ï¸ Tabela de Preços[\s\S]*?<\/section>|<section[^>]*id=["'](?:precos|pricing|tabela-precos)["'][\s\S]*?<\/section>/i;
  if (existingPricingRegex.test(updated)) {
    updated = updated.replace(existingPricingRegex, pricingSection.trim());
  } else if (/<\/main>/i.test(updated)) {
    updated = updated.replace('</main>', `${pricingSection}\n  </main>`);
  } else if (/<footer/i.test(updated)) {
    updated = updated.replace(/<footer/i, `${pricingSection}\n<footer`);
  } else {
    updated += pricingSection;
  }

  // Garantir link no menu
  if (!updated.includes('href="#precos"') && updated.includes('<nav')) {
    updated = updated.replace(/(<nav[\s\S]*?)(<\/nav>)/i, `$1  <a href="#precos" class="hover:text-blue-400 transition">Preços</a>\n      $2`);
  }

  return updated;
}

// â”€â”€â”€ HELPER: Configurar Banner / Hero com Textos e Estilo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface BannerConfigData {
  headline: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  secondaryText: string;
  secondaryLink: string;
  badge: string;
  style: string;
}

function applyBannerToHtml(html: string, config: BannerConfigData): string {
  if (!html) return html;

  const bgStyleClass = config.style === 'minimal'
    ? 'bg-black text-white'
    : config.style === 'executive'
    ? 'bg-gradient-to-b from-slate-950 via-zinc-950 to-slate-900 text-white'
    : 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white';

  const newHero = `
    <!-- ðŸ–¼ï¸ Banner Principal / Hero -->
    <section id="inicio" class="py-20 sm:py-28 px-6 text-center relative overflow-hidden ${bgStyleClass}">
      <div class="max-w-4xl mx-auto relative z-10">
        ${config.badge ? `
        <div class="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold px-4 py-1.5 rounded-full mb-6 shadow-sm">
          <svg class="w-3.5 h-3.5 text-blue-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/></svg>
          <span>${config.badge}</span>
        </div>` : ''}
        <h1 class="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6">
          ${config.headline}
        </h1>
        <p class="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          ${config.subtitle}
        </p>
        <div class="flex flex-wrap items-center justify-center gap-3.5">
          <a href="${config.ctaLink || '#contacto'}" class="bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-7 py-3.5 rounded-xl transition shadow-xl shadow-blue-600/30 hover:scale-105 active:scale-95 text-sm">
            ${config.ctaText || 'Começar Agora'}
          </a>
          ${config.secondaryText ? `
          <a href="${config.secondaryLink || '#solucoes'}" class="bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-white font-bold px-7 py-3.5 rounded-xl transition hover:scale-105 active:scale-95 text-sm">
            ${config.secondaryText}
          </a>` : ''}
        </div>
      </div>
    </section>`;

  let updated = html;

  if (/<section[^>]*id=["'](?:inicio|hero)["']/i.test(updated)) {
    updated = updated.replace(/<section[^>]*id=["'](?:inicio|hero)["'][\s\S]*?<\/section>/i, newHero.trim());
  } else if (/<main[^>]*>[\s\S]*?<section[^>]*>/i.test(updated)) {
    updated = updated.replace(/(<main[^>]*>[\s\S]*?)(<section[\s\S]*?<\/section>)/i, `$1${newHero.trim()}`);
  } else {
    updated = updated.replace('<main>', `<main>\n${newHero.trim()}`);
  }

  // Garantir link Início no menu
  if (!updated.includes('href="#inicio"') && updated.includes('<nav')) {
    updated = updated.replace(/(<nav[\s\S]*?>)/i, `$1\n        <a href="#inicio" class="hover:text-blue-400 transition">Início</a>`);
  }

  return updated;
}

// â”€â”€â”€ HELPER: Garantir que Todos os Links do Menu São Clicáveis â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ensureClickableNavigation(html: string): string {
  if (!html) return html;
  let updated = html;

  // 1. Garantir scroll suave no <head> com scroll-margin-top para o menu sticky não cobrir o título
  if (!updated.includes('scroll-behavior: smooth')) {
    const styleSnippet = '  <style>html { scroll-behavior: smooth; } section[id], footer[id] { scroll-margin-top: 5rem; }</style>\n</head>';
    if (updated.includes('</head>')) {
      updated = updated.replace('</head>', styleSnippet);
    }
  }

  // 2. Extrair todas as âncoras do menu <a href="#target">
  const anchorRegex = /<a[^>]*href="#([^"]+)"[^>]*>/gi;
  let match;
  const targetIds = new Set<string>();
  while ((match = anchorRegex.exec(updated)) !== null) {
    const id = match[1].trim();
    if (id && id !== '' && !id.startsWith('!')) {
      targetIds.add(id);
    }
  }

  // 3. Para cada id referenciado no menu, garantir que existe elemento no body com esse id
  targetIds.forEach(id => {
    const hasTarget = new RegExp(`id=["']${id}["']`, 'i').test(updated);
    if (!hasTarget) {
      if (id === 'contacto' || id === 'contato') {
        if (/<footer/i.test(updated)) {
          updated = updated.replace(/<footer/i, `<footer id="${id}"`);
        }
      } else if (id === 'vantagens') {
        const vantagensSection = `
    <!-- Secção Vantagens (Link do Menu) -->
    <section id="vantagens" class="py-16 px-6 bg-slate-900/40 border-t border-slate-800">
      <div class="max-w-6xl mx-auto text-center">
        <h2 class="text-2xl sm:text-3xl font-extrabold text-white mb-3">Vantagens & Benefícios</h2>
        <p class="text-slate-400 text-sm max-w-xl mx-auto mb-10">Razões pelas quais centenas de clientes confiam no nosso trabalho.</p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div class="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div class="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold mb-3">âœ“</div>
            <h3 class="font-bold text-white mb-1">Velocidade & Desempenho</h3>
            <p class="text-slate-400 text-xs">Páginas ultrarrápidas que retêm visitantes e convertem.</p>
          </div>
          <div class="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div class="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold mb-3">â˜…</div>
            <h3 class="font-bold text-white mb-1">Design de Elite</h3>
            <p class="text-slate-400 text-xs">Visual premium pensado para impressionar à primeira vista.</p>
          </div>
          <div class="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold mb-3">âš¡</div>
            <h3 class="font-bold text-white mb-1">Suporte em Moçambique</h3>
            <p class="text-slate-400 text-xs">Atendimento em português com suporte ágil via WhatsApp.</p>
          </div>
        </div>
      </div>
    </section>`;
        if (/<\/main>/i.test(updated)) {
          updated = updated.replace('</main>', `${vantagensSection}\n  </main>`);
        } else if (/<footer/i.test(updated)) {
          updated = updated.replace(/<footer/i, `${vantagensSection}\n<footer`);
        }
      }
    }
  });

  // 4. Script para garantir rolagem suave e clique perfeito no iframe
  if (!updated.includes('id="wehost-nav-script"')) {
    const navScript = `
  <script id="wehost-nav-script">
    document.addEventListener('DOMContentLoaded', function() {
      document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
          var targetId = this.getAttribute('href').substring(1);
          if (!targetId) return;
          var targetEl = document.getElementById(targetId);
          if (targetEl) {
            e.preventDefault();
            targetEl.scrollIntoView({ behavior: 'smooth' });
          }
        });
      });
    });
  </script>`;
    if (updated.includes('</body>')) {
      updated = updated.replace('</body>', `${navScript}\n</body>`);
    } else {
      updated += navScript;
    }
  }

  return updated;
}

// â”€â”€â”€ HELPER: Formatar Markdown suave para mensagens da IA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function formatMessageContent(content: string) {
  if (!content) return null;
  const lines = content.split('\n');

  return lines.map((line, idx) => {
    const trimmed = line.trim();
    const isBullet = trimmed.startsWith('â€¢') || trimmed.startsWith('- ') || trimmed.startsWith('* ');
    const rawContent = isBullet ? trimmed.replace(/^[â€¢\-\*]\s*/, '') : line;

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
<html lang="pt" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WeHost Cloud Suite | Infraestrutura & Alta Performance</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { background: #000000; color: #ffffff; font-family: 'Plus Jakarta Sans', sans-serif; overflow-x: hidden; }
    ::selection { background: #ffffff; color: #000000; }
    section[id] { scroll-margin-top: 5rem; }
  </style>
</head>
<body class="bg-black text-white antialiased">
  <!-- Header / Navbar -->
  <header class="sticky top-0 z-50 backdrop-blur-xl bg-black/85 border-b border-white/10 transition-all">
    <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">

      <!-- Logo -->
      <a href="#inicio" class="flex items-center gap-2.5 group shrink-0">
        <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white flex items-center justify-center text-black font-extrabold text-base sm:text-lg shadow-lg group-hover:scale-105 transition">
          W
        </div>
        <div class="hidden sm:block">
          <span class="font-extrabold text-base tracking-tight text-white block leading-tight">WeHost Cloud</span>
          <span class="text-[9px] uppercase tracking-widest text-zinc-400 block font-medium">Infraestrutura em Moçambique</span>
        </div>
      </a>

      <!-- Desktop Nav -->
      <nav class="hidden md:flex items-center gap-6 lg:gap-8" id="desktop-nav">
        <a href="#inicio" class="text-xs uppercase tracking-wider text-zinc-400 hover:text-white transition font-medium">Início</a>
        <a href="#servicos" class="text-xs uppercase tracking-wider text-zinc-400 hover:text-white transition font-medium">Serviços</a>
        <a href="#galeria" class="text-xs uppercase tracking-wider text-zinc-400 hover:text-white transition font-medium">Galeria</a>
        <a href="#depoimentos" class="text-xs uppercase tracking-wider text-zinc-400 hover:text-white transition font-medium">Depoimentos</a>
        <a href="#faq" class="text-xs uppercase tracking-wider text-zinc-400 hover:text-white transition font-medium">FAQ</a>
        <a href="#agendamento" class="text-xs uppercase tracking-wider text-zinc-400 hover:text-white transition font-medium">Ativar Plano</a>
        <a href="#contacto" class="text-xs uppercase tracking-wider text-zinc-400 hover:text-white transition font-medium">Contacto</a>
      </nav>

      <!-- Right actions -->
      <div class="flex items-center gap-2">
        <!-- WA icon only (mobile) -->
        <a href="https://wa.me/258848335618?text=Ol%C3%A1!%20Gostaria%20de%20saber%20mais%20sobre%20a%20WeHost%20Cloud" target="_blank" rel="noopener noreferrer"
           class="sm:hidden w-9 h-9 rounded-xl bg-white flex items-center justify-center text-black hover:bg-zinc-200 transition shadow-sm">
          <i data-lucide="message-circle" class="w-4 h-4"></i>
        </a>
        <!-- WA full button (sm+) -->
        <a href="https://wa.me/258848335618?text=Ol%C3%A1!%20Gostaria%20de%20saber%20mais%20sobre%20a%20WeHost%20Cloud" target="_blank" rel="noopener noreferrer"
           class="hidden sm:inline-flex items-center gap-2 bg-white text-black font-bold text-xs px-4 py-2.5 rounded-full hover:bg-zinc-200 transition shadow-sm hover:scale-[1.02]">
          <i data-lucide="message-circle" class="w-4 h-4"></i>
          <span>WhatsApp</span>
        </a>
        <!-- Hamburger (mobile) -->
        <button id="menu-toggle" aria-label="Abrir menu" onclick="toggleMobileMenu()"
                class="md:hidden flex flex-col justify-center items-center w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition gap-[5px]">
          <span id="hb1" class="block w-4 h-0.5 bg-white transition-all duration-300 origin-center"></span>
          <span id="hb2" class="block w-4 h-0.5 bg-white transition-all duration-300"></span>
          <span id="hb3" class="block w-4 h-0.5 bg-white transition-all duration-300 origin-center"></span>
        </button>
      </div>
    </div>

    <!-- Mobile Drawer -->
    <div id="mobile-menu" style="display:none;flex-direction:column;" class="md:hidden bg-black/98 backdrop-blur-2xl border-t border-white/10 px-4 py-5 space-y-1">
      <a href="#inicio" onclick="closeMobileMenu()" class="block px-4 py-3.5 rounded-xl text-sm font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition">Início</a>
      <a href="#servicos" onclick="closeMobileMenu()" class="block px-4 py-3.5 rounded-xl text-sm font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition">Serviços</a>
      <a href="#galeria" onclick="closeMobileMenu()" class="block px-4 py-3.5 rounded-xl text-sm font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition">Galeria</a>
      <a href="#depoimentos" onclick="closeMobileMenu()" class="block px-4 py-3.5 rounded-xl text-sm font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition">Depoimentos</a>
      <a href="#faq" onclick="closeMobileMenu()" class="block px-4 py-3.5 rounded-xl text-sm font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition">FAQ</a>
      <a href="#agendamento" onclick="closeMobileMenu()" class="block px-4 py-3.5 rounded-xl text-sm font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition">Ativar Plano</a>
      <a href="#contacto" onclick="closeMobileMenu()" class="block px-4 py-3.5 rounded-xl text-sm font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition">Contacto</a>
      <div class="pt-3 mt-2 border-t border-white/10">
        <a href="https://wa.me/258848335618?text=Ol%C3%A1!%20Gostaria%20de%20saber%20mais%20sobre%20a%20WeHost%20Cloud" target="_blank" rel="noopener noreferrer"
           class="flex items-center justify-center gap-2 bg-white text-black font-extrabold text-sm px-6 py-3.5 rounded-xl hover:bg-zinc-200 transition w-full">
          <i data-lucide="message-circle" class="w-4 h-4"></i>
          <span>Falar no WhatsApp</span>
        </a>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <section id="inicio" class="relative min-h-[85vh] flex items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-24 overflow-hidden">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.08),transparent_70%)] pointer-events-none"></div>
    <div class="relative z-10 max-w-4xl mx-auto">
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-white/5 text-xs text-zinc-300 mb-8 backdrop-blur-md">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Servidores Ativos em Moçambique &bull; 99.99% Uptime</span>
      </div>
      <h1 class="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white mb-6 leading-tight">
        A Nuvem Mais Rápida e Confiável para o <span class="underline decoration-white/30 decoration-wavy">Seu Negócio</span>
      </h1>
      <p class="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
        Hospedagem de alta velocidade com armazenamento SSD NVMe, baixa latência para o território nacional e suporte técnico dedicado 24 horas por dia.
      </p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a href="#servicos" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-black font-extrabold text-sm px-8 py-4 rounded-full hover:bg-zinc-200 transition shadow-xl">
          <i data-lucide="server" class="w-4 h-4"></i>
          <span>Ver Planos & Recursos</span>
        </a>
        <a href="#agendamento" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/20 bg-white/5 text-white font-bold text-sm px-8 py-4 rounded-full hover:bg-white/10 transition">
          <i data-lucide="zap" class="w-4 h-4"></i>
          <span>Solicitar Ativação Imediata</span>
        </a>
      </div>
    </div>
  </section>

  <!-- Stats Bar -->
  <section class="border-y border-white/10 bg-white/[0.02] py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center divide-y lg:divide-y-0 lg:divide-x divide-white/10">
        <div class="pt-4 lg:pt-0">
          <div class="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">99.99%</div>
          <div class="text-xs uppercase tracking-widest text-zinc-400 mt-2 font-medium">Uptime SLA Garantido</div>
        </div>
        <div class="pt-4 lg:pt-0">
          <div class="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">5ms</div>
          <div class="text-xs uppercase tracking-widest text-zinc-400 mt-2 font-medium">Latência Local Ultrarrápida</div>
        </div>
        <div class="pt-4 lg:pt-0">
          <div class="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">12.000+</div>
          <div class="text-xs uppercase tracking-widest text-zinc-400 mt-2 font-medium">Websites Alojados</div>
        </div>
        <div class="pt-4 lg:pt-0">
          <div class="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">24/7/365</div>
          <div class="text-xs uppercase tracking-widest text-zinc-400 mt-2 font-medium">Suporte Técnico Local</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Services Grid (6 Cards) -->
  <section id="servicos" class="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-2xl mx-auto mb-16">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-zinc-300 mb-4">
        <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
        <span>Recursos Corporativos</span>
      </div>
      <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">Soluções Cloud de Alto Desempenho</h2>
      <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">Tecnologia de ponta pensada para a estabilidade contínua das suas aplicações.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="group p-6 rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/25 transition duration-300 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition">
              <i data-lucide="hard-drive" class="w-5 h-5"></i>
            </div>
            <span class="text-xs font-bold text-white tracking-wider">Desde 350 MT / mês</span>
          </div>
          <h3 class="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-zinc-200 transition">Hospedagem NVMe Ultrarrápida</h3>
          <p class="text-xs text-zinc-400 leading-relaxed mb-6">Discos SSD NVMe de última geração, cPanel intuitivo e contas de e-mail corporativo ilimitadas.</p>
        </div>
        <a href="https://wa.me/258848335618?text=Ol%C3%A1!%20Gostaria%20de%20assinar%20o%20servi%C3%A7o%3A%20Hospedagem%20NVMe%20Ultrarr%C3%A1pida" target="_blank" class="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/15 bg-white/5 text-xs font-semibold text-white hover:bg-white hover:text-black transition">
          <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
          <span>Ativar Este Plano</span>
        </a>
      </div>

      <div class="group p-6 rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/25 transition duration-300 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition">
              <i data-lucide="server" class="w-5 h-5"></i>
            </div>
            <span class="text-xs font-bold text-white tracking-wider">Desde 1.450 MT / mês</span>
          </div>
          <h3 class="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-zinc-200 transition">Servidores Cloud VPS Dedicados</h3>
          <p class="text-xs text-zinc-400 leading-relaxed mb-6">Recursos 100% isolados (vCPU, RAM DDR5) com acesso root completo e IP moçambicano.</p>
        </div>
        <a href="https://wa.me/258848335618?text=Ol%C3%A1!%20Gostaria%20de%20assinar%20o%20servi%C3%A7o%3A%20Servidores%20Cloud%20VPS%20Dedicados" target="_blank" class="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/15 bg-white/5 text-xs font-semibold text-white hover:bg-white hover:text-black transition">
          <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
          <span>Ativar Este Plano</span>
        </a>
      </div>

      <div class="group p-6 rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/25 transition duration-300 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition">
              <i data-lucide="globe" class="w-5 h-5"></i>
            </div>
            <span class="text-xs font-bold text-white tracking-wider">Ativação Rápida</span>
          </div>
          <h3 class="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-zinc-200 transition">Domínios .MZ e Internacionais</h3>
          <p class="text-xs text-zinc-400 leading-relaxed mb-6">Registo e ativação imediata de extensões .co.mz, .mz, .com, .net com DNS Anycast redundante.</p>
        </div>
        <a href="https://wa.me/258848335618?text=Ol%C3%A1!%20Gostaria%20de%20assinar%20o%20servi%C3%A7o%3A%20Dom%C3%ADnios%20.MZ%20e%20Internacionais" target="_blank" class="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/15 bg-white/5 text-xs font-semibold text-white hover:bg-white hover:text-black transition">
          <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
          <span>Ativar Este Plano</span>
        </a>
      </div>

      <div class="group p-6 rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/25 transition duration-300 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition">
              <i data-lucide="shield-check" class="w-5 h-5"></i>
            </div>
            <span class="text-xs font-bold text-white tracking-wider">Incluso Grátis</span>
          </div>
          <h3 class="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-zinc-200 transition">Segurança & Proteção Anti-DDoS</h3>
          <p class="text-xs text-zinc-400 leading-relaxed mb-6">Filtro inteligente de tráfego que bloqueia ataques maliciosos antes de atingirem o seu servidor.</p>
        </div>
        <a href="https://wa.me/258848335618?text=Ol%C3%A1!%20Gostaria%20de%20assinar%20o%20servi%C3%A7o%3A%20Seguran%C3%A7a%20%26%20Prote%C3%A7%C3%A3o%20Anti-DDoS" target="_blank" class="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/15 bg-white/5 text-xs font-semibold text-white hover:bg-white hover:text-black transition">
          <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
          <span>Ativar Este Plano</span>
        </a>
      </div>

      <div class="group p-6 rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/25 transition duration-300 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition">
              <i data-lucide="database" class="w-5 h-5"></i>
            </div>
            <span class="text-xs font-bold text-white tracking-wider">Incluso Grátis</span>
          </div>
          <h3 class="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-zinc-200 transition">Backups Diários Automatizados</h3>
          <p class="text-xs text-zinc-400 leading-relaxed mb-6">Cópias de segurança automáticas com restauração em 1-clique para tranquilidade absoluta.</p>
        </div>
        <a href="https://wa.me/258848335618?text=Ol%C3%A1!%20Gostaria%20de%20assinar%20o%20servi%C3%A7o%3A%20Backups%20Di%C3%A1rios%20Automatizados" target="_blank" class="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/15 bg-white/5 text-xs font-semibold text-white hover:bg-white hover:text-black transition">
          <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
          <span>Ativar Este Plano</span>
        </a>
      </div>

      <div class="group p-6 rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/25 transition duration-300 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition">
              <i data-lucide="cpu" class="w-5 h-5"></i>
            </div>
            <span class="text-xs font-bold text-white tracking-wider">Incluso no Plano</span>
          </div>
          <h3 class="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-zinc-200 transition">Construtor de Sites IA Integrado</h3>
          <p class="text-xs text-zinc-400 leading-relaxed mb-6">Crie e edite websites profissionais em minutos com auxílio da nossa inteligência artificial exclusiva.</p>
        </div>
        <a href="https://wa.me/258848335618?text=Ol%C3%A1!%20Gostaria%20de%20assinar%20o%20servi%C3%A7o%3A%20Construtor%20de%20Sites%20IA%20Integrado" target="_blank" class="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/15 bg-white/5 text-xs font-semibold text-white hover:bg-white hover:text-black transition">
          <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
          <span>Ativar Este Plano</span>
        </a>
      </div>
    </div>
  </section>

  <!-- Showcase / Galeria com Fotos Reais Unsplash -->
  <section id="galeria" class="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-2xl mx-auto mb-16">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-zinc-300 mb-4">
        <i data-lucide="eye" class="w-3.5 h-3.5"></i>
        <span>Experiência Visual</span>
      </div>
      <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">Tecnologia & Infraestrutura de Ponta</h2>
      <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">Estrutura técnica robusta desenhada para empresas que não podem parar.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="group relative rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/25 transition-all duration-500 flex flex-col overflow-hidden shadow-2xl">
        <div class="relative h-60 sm:h-64 overflow-hidden w-full bg-zinc-900">
          <img src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80" alt="Data Center com Racks de Servidores" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out brightness-95 contrast-105" loading="lazy" />
          <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent"></div>
          <div class="absolute top-4 left-4 z-10">
            <span class="text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-white border border-white/20">Datacenter</span>
          </div>
        </div>
        <div class="p-6 flex flex-col justify-between flex-1">
          <div>
            <h3 class="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-zinc-200 transition">Data Center com Racks de Servidores</h3>
            <p class="text-xs text-zinc-400 leading-relaxed">Hardware corporativo com refrigeração avançada e alimentação elétrica ininterrupta.</p>
          </div>
          <div class="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-300 font-semibold group-hover:text-white">
            <span>Explorar detalhe</span>
            <i data-lucide="arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform"></i>
          </div>
        </div>
      </div>

      <div class="group relative rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/25 transition-all duration-500 flex flex-col overflow-hidden shadow-2xl">
        <div class="relative h-60 sm:h-64 overflow-hidden w-full bg-zinc-900">
          <img src="https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80" alt="Backbone de Fibra & Baixa Latência" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out brightness-95 contrast-105" loading="lazy" />
          <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent"></div>
          <div class="absolute top-4 left-4 z-10">
            <span class="text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-white border border-white/20">Fibra Óptica</span>
          </div>
        </div>
        <div class="p-6 flex flex-col justify-between flex-1">
          <div>
            <h3 class="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-zinc-200 transition">Backbone de Fibra & Baixa Latência</h3>
            <p class="text-xs text-zinc-400 leading-relaxed">Conexão direta aos principais pontos de troca de tráfego de Moçambique e da África Austral.</p>
          </div>
          <div class="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-300 font-semibold group-hover:text-white">
            <span>Explorar detalhe</span>
            <i data-lucide="arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform"></i>
          </div>
        </div>
      </div>

      <div class="group relative rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/25 transition-all duration-500 flex flex-col overflow-hidden shadow-2xl">
        <div class="relative h-60 sm:h-64 overflow-hidden w-full bg-zinc-900">
          <img src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80" alt="Segurança & Monitoramento 24/7" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out brightness-95 contrast-105" loading="lazy" />
          <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent"></div>
          <div class="absolute top-4 left-4 z-10">
            <span class="text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-white border border-white/20">Segurança Contínua</span>
          </div>
        </div>
        <div class="p-6 flex flex-col justify-between flex-1">
          <div>
            <h3 class="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-zinc-200 transition">Segurança & Monitoramento 24/7</h3>
            <p class="text-xs text-zinc-400 leading-relaxed">Sistemas inteligentes com proteção contra ataques DDoS e supervisão de rede 365 dias por ano.</p>
          </div>
          <div class="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-300 font-semibold group-hover:text-white">
            <span>Explorar detalhe</span>
            <i data-lucide="arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform"></i>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Depoimentos Reais / Prova Social -->
  <section id="depoimentos" class="py-24 border-t border-white/10 bg-white/[0.01]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-2xl mx-auto mb-16">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-zinc-300 mb-4">
          <i data-lucide="star" class="w-3.5 h-3.5 fill-white text-white"></i>
          <span>Excelência Comprovada</span>
        </div>
        <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">Confiança das Melhores Empresas</h2>
        <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">Empresas e desenvolvedores que escolheram hospedar com estabilidade.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="p-8 rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/20 transition flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-1 mb-4">
              <i data-lucide="star" class="w-4 h-4 fill-white text-white"></i>
              <i data-lucide="star" class="w-4 h-4 fill-white text-white"></i>
              <i data-lucide="star" class="w-4 h-4 fill-white text-white"></i>
              <i data-lucide="star" class="w-4 h-4 fill-white text-white"></i>
              <i data-lucide="star" class="w-4 h-4 fill-white text-white"></i>
            </div>
            <p class="text-xs sm:text-sm text-zinc-300 leading-relaxed italic mb-6">"A latência dentro de Moçambique fez as nossas páginas abrirem em menos de 1 segundo. Fantástico."</p>
          </div>
          <div class="flex items-center gap-3 pt-4 border-t border-white/10">
            <div class="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center font-bold text-xs text-white">C</div>
            <div>
              <div class="text-xs font-bold text-white">Cláudio Matusse</div>
              <div class="text-[11px] text-zinc-400">CTO &bull; StartupMz</div>
            </div>
          </div>
        </div>

        <div class="p-8 rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/20 transition flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-1 mb-4">
              <i data-lucide="star" class="w-4 h-4 fill-white text-white"></i>
              <i data-lucide="star" class="w-4 h-4 fill-white text-white"></i>
              <i data-lucide="star" class="w-4 h-4 fill-white text-white"></i>
              <i data-lucide="star" class="w-4 h-4 fill-white text-white"></i>
              <i data-lucide="star" class="w-4 h-4 fill-white text-white"></i>
            </div>
            <p class="text-xs sm:text-sm text-zinc-300 leading-relaxed italic mb-6">"O suporte via WhatsApp resolveu a nossa migração em 15 minutos num domingo. Nunca vi igual."</p>
          </div>
          <div class="flex items-center gap-3 pt-4 border-t border-white/10">
            <div class="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center font-bold text-xs text-white">T</div>
            <div>
              <div class="text-xs font-bold text-white">Teresa Chissano</div>
              <div class="text-[11px] text-zinc-400">Gestora &bull; Agência Criativa</div>
            </div>
          </div>
        </div>

        <div class="p-8 rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/20 transition flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-1 mb-4">
              <i data-lucide="star" class="w-4 h-4 fill-white text-white"></i>
              <i data-lucide="star" class="w-4 h-4 fill-white text-white"></i>
              <i data-lucide="star" class="w-4 h-4 fill-white text-white"></i>
              <i data-lucide="star" class="w-4 h-4 fill-white text-white"></i>
              <i data-lucide="star" class="w-4 h-4 fill-white text-white"></i>
            </div>
            <p class="text-xs sm:text-sm text-zinc-300 leading-relaxed italic mb-6">"Os servidores VPS têm desempenho real sem sobrealocação. Estabilidade de padrão global."</p>
          </div>
          <div class="flex items-center gap-3 pt-4 border-t border-white/10">
            <div class="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center font-bold text-xs text-white">R</div>
            <div>
              <div class="text-xs font-bold text-white">Rui Sumbana</div>
              <div class="text-[11px] text-zinc-400">Engenheiro de Software &bull; Maputo</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- FAQ Accordion -->
  <section id="faq" class="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-zinc-300 mb-4">
        <i data-lucide="help-circle" class="w-3.5 h-3.5"></i>
        <span>Esclarecimentos</span>
      </div>
      <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">Perguntas Frequentes</h2>
      <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">Respostas rápidas sobre migração e funcionamento.</p>
    </div>

    <div class="space-y-4">
      <div class="border border-white/10 rounded-2xl overflow-hidden bg-zinc-950/60 hover:border-white/20 transition">
        <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-6 text-left text-sm font-bold text-white hover:bg-white/5 transition">
          <span>A migração do meu site atual para a WeHost tem algum custo?</span>
          <i data-lucide="chevron-down" class="w-4 h-4 text-zinc-400 transition-transform duration-200"></i>
        </button>
        <div class="hidden px-6 pb-6 text-xs text-zinc-400 leading-relaxed border-t border-white/5 pt-4">
          Não! Migramos o seu site e contas de e-mail do seu provedor antigo sem qualquer custo e com zero tempo de inatividade.
        </div>
      </div>

      <div class="border border-white/10 rounded-2xl overflow-hidden bg-zinc-950/60 hover:border-white/20 transition">
        <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-6 text-left text-sm font-bold text-white hover:bg-white/5 transition">
          <span>Quais métodos de pagamento aceitam?</span>
          <i data-lucide="chevron-down" class="w-4 h-4 text-zinc-400 transition-transform duration-200"></i>
        </button>
        <div class="hidden px-6 pb-6 text-xs text-zinc-400 leading-relaxed border-t border-white/5 pt-4">
          Aceitamos pagamentos mensais ou anuais por M-Pesa, E-Mola, transferência bancária (BIM/BCI) e cartões nacionais e internacionais.
        </div>
      </div>

      <div class="border border-white/10 rounded-2xl overflow-hidden bg-zinc-950/60 hover:border-white/20 transition">
        <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-6 text-left text-sm font-bold text-white hover:bg-white/5 transition">
          <span>O suporte técnico funciona aos finais de semana e feriados?</span>
          <i data-lucide="chevron-down" class="w-4 h-4 text-zinc-400 transition-transform duration-200"></i>
        </button>
        <div class="hidden px-6 pb-6 text-xs text-zinc-400 leading-relaxed border-t border-white/5 pt-4">
          Sim! A nossa equipa de suporte local opera 24 horas por dia, 7 dias por semana, inclusive feriados nacionais.
        </div>
      </div>

      <div class="border border-white/10 rounded-2xl overflow-hidden bg-zinc-950/60 hover:border-white/20 transition">
        <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between p-6 text-left text-sm font-bold text-white hover:bg-white/5 transition">
          <span>Posso fazer upgrade de plano quando meu site crescer?</span>
          <i data-lucide="chevron-down" class="w-4 h-4 text-zinc-400 transition-transform duration-200"></i>
        </button>
        <div class="hidden px-6 pb-6 text-xs text-zinc-400 leading-relaxed border-t border-white/5 pt-4">
          Com certeza! Pode mudar de plano instantaneamente sem qualquer perda de dados ou configuração.
        </div>
      </div>
    </div>
  </section>

  <!-- Formulário de Agendamento / Ativação Direto para WhatsApp -->
  <section id="agendamento" class="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="relative rounded-3xl bg-zinc-950 border border-white/10 p-8 sm:p-12 overflow-hidden shadow-2xl">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.06),transparent_60%)] pointer-events-none"></div>
      
      <div class="text-center max-w-xl mx-auto mb-10 relative z-10">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-zinc-300 mb-4">
          <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
          <span>Atendimento Direto &bull; Moçambique</span>
        </div>
        <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">Ativação de Conta & Suporte Comercial</h2>
        <p class="text-zinc-400 text-xs sm:text-sm leading-relaxed">Escolha o serviço pretendido para receber atendimento imediato da equipa técnica da WeHost.</p>
      </div>

      <form onsubmit="handleBookingSubmit(event)" class="relative z-10 space-y-5">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label class="block text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wider">O Seu Nome</label>
            <input type="text" name="booking_name" required placeholder="Ex: Carlos Mondlane" class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wider">Telemóvel / WhatsApp</label>
            <input type="tel" name="booking_phone" required placeholder="Ex: +258 84 000 0000" class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label class="block text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wider">Opção / Serviço Desejado</label>
            <select name="booking_service" required class="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition">
              <option value="" disabled selected class="text-zinc-500">Selecione uma opção...</option>
              <option value="Hospedagem SSD NVMe (350 MT / mês)" class="bg-zinc-900 text-white">Hospedagem SSD NVMe (350 MT / mês)</option>
              <option value="Servidor Cloud VPS Dedicado (1.450 MT / mês)" class="bg-zinc-900 text-white">Servidor Cloud VPS Dedicado (1.450 MT / mês)</option>
              <option value="Registo de Domínio Nacional .CO.MZ / .MZ" class="bg-zinc-900 text-white">Registo de Domínio Nacional .CO.MZ / .MZ</option>
              <option value="Migração Gratuita de Website e E-mails" class="bg-zinc-900 text-white">Migração Gratuita de Website e E-mails</option>
              <option value="Pacote Corporativo Customizado" class="bg-zinc-900 text-white">Pacote Corporativo Customizado</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wider">Data Preferencial</label>
            <input type="date" name="booking_date" class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wider">Mensagem ou Observações (Opcional)</label>
          <textarea name="booking_notes" rows="3" placeholder="Indique qualquer preferência específica ou detalhe adicional..." class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition resize-none"></textarea>
        </div>

        <button type="submit" class="w-full py-4 px-6 rounded-xl bg-white text-black font-extrabold text-sm tracking-wide hover:bg-zinc-200 transition shadow-xl flex items-center justify-center gap-2 group cursor-pointer">
          <i data-lucide="send" class="w-4 h-4 group-hover:translate-x-1 transition-transform"></i>
          <span>Falar com Especialista no WhatsApp</span>
        </button>
        <p class="text-[11px] text-center text-zinc-500 mt-2">
          ðŸ”’ Ao submeter, abrirá o WhatsApp com a mensagem formatada para confirmação imediata.
        </p>
      </form>
    </div>
  </section>

  <!-- CTA Banner Final -->
  <section class="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="relative rounded-3xl bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border border-white/15 p-10 sm:p-16 text-center overflow-hidden">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.15),transparent_70%)] pointer-events-none"></div>
      <div class="relative z-10 max-w-3xl mx-auto">
        <h2 class="text-3xl sm:text-5xl font-black tracking-tight text-white mb-6">Coloque o Seu Projeto Online Hoje Mesmo</h2>
        <p class="text-zinc-300 text-sm sm:text-base leading-relaxed mb-8 max-w-xl mx-auto">Comece com a infraestrutura cloud mais estável e rápida de Moçambique.</p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="https://wa.me/258848335618?text=Ol%C3%A1!%20Gostaria%20de%20ativar%20um%20plano%20de%20hospedagem" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 bg-white text-black font-extrabold text-sm px-8 py-4 rounded-full hover:bg-zinc-200 transition shadow-2xl hover:scale-105">
            <i data-lucide="message-circle" class="w-5 h-5"></i>
            <span>Ativar Conta no WhatsApp</span>
          </a>
        </div>
        <div class="mt-6 text-[11px] text-zinc-400 font-medium">
          âœ“ Atendimento Imediato &bull; Moçambique &bull; Disponível 24/7
        </div>
      </div>
    </div>
  </section>

  <!-- Botão Flutuante do WhatsApp -->
  <a href="https://wa.me/258848335618?text=Ol%C3%A1!%20Gostaria%20de%20mais%20informa%C3%A7%C3%B5es" target="_blank" rel="noopener noreferrer" class="fixed bottom-5 right-4 z-50 inline-flex items-center gap-2 bg-white text-black font-bold text-xs py-2.5 px-3 sm:px-5 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 hover:bg-zinc-200 border border-white/20 group">
    <i data-lucide="message-circle" class="w-4 h-4 group-hover:rotate-12 transition-transform"></i>
    <span class="hidden sm:inline font-bold tracking-tight">WhatsApp</span>
  </a>

  <!-- Multi-column Footer -->
  <footer id="contacto" class="border-t border-white/10 bg-black pt-16 pb-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-10 pb-16 border-b border-white/10">
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-black font-black text-base">
              W
            </div>
            <span class="font-bold text-lg text-white tracking-tight">WeHost Cloud Suite</span>
          </div>
          <p class="text-xs text-zinc-400 leading-relaxed">
            Excelência, design refinado e compromisso com o mais alto padrão em Moçambique.
          </p>
          <div class="flex items-center gap-3 pt-2">
            <a href="https://wa.me/258848335618" target="_blank" class="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white hover:border-white transition"><i data-lucide="message-circle" class="w-4 h-4"></i></a>
            <a href="#" class="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white hover:border-white transition"><i data-lucide="instagram" class="w-4 h-4"></i></a>
            <a href="#" class="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white hover:border-white transition"><i data-lucide="phone" class="w-4 h-4"></i></a>
          </div>
        </div>

        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-white mb-4">Navegação</h4>
          <ul class="space-y-2.5">
            <li><a href="#inicio" class="text-xs text-zinc-400 hover:text-white transition">Início</a></li>
            <li><a href="#servicos" class="text-xs text-zinc-400 hover:text-white transition">Serviços</a></li>
            <li><a href="#galeria" class="text-xs text-zinc-400 hover:text-white transition">Galeria</a></li>
            <li><a href="#depoimentos" class="text-xs text-zinc-400 hover:text-white transition">Depoimentos</a></li>
            <li><a href="#faq" class="text-xs text-zinc-400 hover:text-white transition">FAQ</a></li>
            <li><a href="#agendamento" class="text-xs text-zinc-400 hover:text-white transition">Ativar Plano</a></li>
          </ul>
        </div>

        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-white mb-4">Contacto & Localização</h4>
          <ul class="space-y-2.5 text-xs text-zinc-400">
            <li class="flex items-center gap-2">
              <i data-lucide="map-pin" class="w-4 h-4 text-white"></i>
              <span>Maputo &bull; Matola, Moçambique</span>
            </li>
            <li class="flex items-center gap-2">
              <i data-lucide="phone" class="w-4 h-4 text-white"></i>
              <span>+258 84 000 0000</span>
            </li>
            <li class="flex items-center gap-2">
              <i data-lucide="mail" class="w-4 h-4 text-white"></i>
              <span>contacto@wehosthere.co.mz</span>
            </li>
            <li class="flex items-center gap-2">
              <i data-lucide="clock" class="w-4 h-4 text-white"></i>
              <span>Seg - Sáb: 08:00 às 20:00</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-white mb-4">Pagamentos Aceites</h4>
          <p class="text-xs text-zinc-400 mb-4">Aceitamos as principais soluções financeiras de Moçambique:</p>
          <div class="flex flex-wrap gap-2 text-[10px] text-zinc-300 font-semibold">
            <span class="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">M-Pesa</span>
            <span class="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">E-Mola</span>
            <span class="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">BIM / BCI</span>
            <span class="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">Numerário</span>
          </div>
        </div>
      </div>

      <div class="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-4">
        <div>&copy; 2026 WeHost Cloud Suite. Todos os direitos reservados.</div>
        <div class="flex items-center gap-2">
          <span>Potenciado por</span>
          <span class="font-bold text-white tracking-wider">WEHOSTHERE</span>
        </div>
      </div>
    </div>
  </footer>

  <script>
    lucide.createIcons();
    function toggleMobileMenu() {
      var menu = document.getElementById('mobile-menu');
      var hb1 = document.getElementById('hb1');
      var hb2 = document.getElementById('hb2');
      var hb3 = document.getElementById('hb3');
      var isOpen = menu.style.display === 'flex';
      if (isOpen) {
        menu.style.display = 'none';
        hb1.style.transform = ''; hb2.style.opacity = '1'; hb3.style.transform = '';
      } else {
        menu.style.display = 'flex';
        hb1.style.transform = 'rotate(45deg) translate(4px,4px)';
        hb2.style.opacity = '0';
        hb3.style.transform = 'rotate(-45deg) translate(4px,-4px)';
      }
    }
    function closeMobileMenu() {
      var menu = document.getElementById('mobile-menu');
      var hb1 = document.getElementById('hb1');
      var hb2 = document.getElementById('hb2');
      var hb3 = document.getElementById('hb3');
      if (menu) menu.style.display = 'none';
      if (hb1) { hb1.style.transform = ''; hb2.style.opacity = '1'; hb3.style.transform = ''; }
    }
    function toggleFaq(btn) {
      const content = btn.nextElementSibling;
      const icon = btn.querySelector('i[data-lucide="chevron-down"]');
      const isHidden = content.classList.contains('hidden');
      content.classList.toggle('hidden');
      if (icon) {
        icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
      }
    }
    function handleBookingSubmit(e) {
      e.preventDefault();
      const form = e.target;
      const name = form.querySelector('[name="booking_name"]')?.value || '';
      const phone = form.querySelector('[name="booking_phone"]')?.value || '';
      const service = form.querySelector('[name="booking_service"]')?.value || '';
      const date = form.querySelector('[name="booking_date"]')?.value || '';
      const notes = form.querySelector('[name="booking_notes"]')?.value || '';

      let text = 'Olá! Gostaria de fazer uma solicitação:\n\n';
      if (name) text += 'ðŸ‘¤ *Nome:* ' + name + '\n';
      if (phone) text += 'ðŸ“± *Contacto:* ' + phone + '\n';
      if (service) text += 'ðŸŽ¯ *Opção:* ' + service + '\n';
      if (date) text += 'ðŸ“… *Data:* ' + date + '\n';
      if (notes) text += 'ðŸ“ *Mensagem:* ' + notes + '\n';

      const waUrl = 'https://wa.me/258848335618?text=' + encodeURIComponent(text);
      window.open(waUrl, '_blank');
    }
  </script>
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

  // Estados de Edição Direta por Clique ("Click to Edit")
  const [isClickToEditEnabled, setIsClickToEditEnabled] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // ðŸŽ¨ Estados do Refinamento Rápido: Mudar Cores
  const [isColorModalOpen, setIsColorModalOpen] = useState<boolean>(false);
  const [selectedColorPalette, setSelectedColorPalette] = useState<string>('ocean');
  const [customPrimaryColor, setCustomPrimaryColor] = useState<string>('#2563eb');
  const [colorMode, setColorMode] = useState<'dark' | 'light'>('dark');

  // ðŸ’¬ Estados do Refinamento Rápido: Botão WhatsApp
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState<boolean>(false);
  const [waCountryCode, setWaCountryCode] = useState<string>('+258');
  const [waPhoneNumber, setWaPhoneNumber] = useState<string>('840000000');
  const [waMessage, setWaMessage] = useState<string>('Olá! Vim através do website e gostaria de obter mais informações sobre os vossos serviços.');
  const [waButtonText, setWaButtonText] = useState<string>('Falar no WhatsApp');
  const [waPosition, setWaPosition] = useState<'right' | 'left'>('right');

  // ðŸ·ï¸ Estados do Refinamento Rápido: Tabela de Preços & Benefícios
  const [isPricingModalOpen, setIsPricingModalOpen] = useState<boolean>(false);
  const [pricingCurrency, setPricingCurrency] = useState<string>('MT');
  const [pricingCycle, setPricingCycle] = useState<string>('/mês');
  const [plan1Name, setPlan1Name] = useState<string>('Básico');
  const [plan1Price, setPlan1Price] = useState<string>('1.500');
  const [plan1Features, setPlan1Features] = useState<string>('Website Institucional\nOtimizado para Telemóveis\nCertificado SSL Grátis\nSuporte por Email');
  const [plan2Name, setPlan2Name] = useState<string>('Profissional');
  const [plan2Price, setPlan2Price] = useState<string>('3.500');
  const [plan2Badge, setPlan2Badge] = useState<string>('Mais Popular');
  const [plan2Features, setPlan2Features] = useState<string>('Tudo do Plano Básico\nDomínio .co.mz Incluído\nIntegração de M-Pesa & e-Mola\nSuporte Prioritário 24/7');
  const [plan3Name, setPlan3Name] = useState<string>('Empresarial');
  const [plan3Price, setPlan3Price] = useState<string>('7.500');
  const [plan3Features, setPlan3Features] = useState<string>('Infraestrutura Cloud Ilimitada\nPainel de Gestão Personalizado\nIntegração M-Pesa & Cartões\nGerente de Conta Exclusivo');

  // ðŸ–¼ï¸ Estados do Refinamento Rápido: Configuração de Banner / Hero
  const [isBannerModalOpen, setIsBannerModalOpen] = useState<boolean>(false);
  const [bannerHeadline, setBannerHeadline] = useState<string>('Soluções Digitais que aceleram o seu Crescimento');
  const [bannerSubtitle, setBannerSubtitle] = useState<string>('Desenvolvemos tecnologia de alta performance para empresas que buscam modernidade, segurança e presença digital marcante.');
  const [bannerCtaText, setBannerCtaText] = useState<string>('Ver Nossos Serviços');
  const [bannerCtaLink, setBannerCtaLink] = useState<string>('#solucoes');
  const [bannerSecondaryText, setBannerSecondaryText] = useState<string>('Ver Tabela de Preços');
  const [bannerSecondaryLink, setBannerSecondaryLink] = useState<string>('#precos');
  const [bannerBadge, setBannerBadge] = useState<string>('Construído com WEHOSTHERE Studio AI');
  const [bannerTheme, setBannerTheme] = useState<string>('tech-dark');

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
        content: 'ðŸ‘‹ Olá! Bem-vindo ao Construtor de Sites IA da WEHOSTHERE no Modo Demonstração.\n\nPode explorar o preview em tempo real, alternar entre modos (Computador, Tablet e Telemóvel) e inspecionar o código fonte. Para gerar novos designs com IA, salvar projetos e publicar com domínio próprio, crie uma conta gratuita ou inicie sessão!',
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

  // â”€â”€â”€ Helpers para Proposta de Construção e Intenção â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      return `Entendido! Preparei o seguinte plano de modificação para o seu site:\n\nâ€¢ Aplicar as alterações solicitadas: "${promptText}"\nâ€¢ Preservar o tema minimalista preto e branco de alto contraste\nâ€¢ Manter o menu simples e o rodapé limpos e organizados\nâ€¢ Testar o novo código e renderizar diretamente no preview interativo.\n\nDeseja aceitar e gerar o código agora?`;
    }

    if (p.includes('restaurante') || p.includes('lounge') || p.includes('comida') || p.includes('cardapio') || p.includes('cardápio')) {
      return `Excelente! Preparei o plano de construção para o seu Restaurante & Lounge:\n\nâ€¢ Tema sofisticado Preto & Branco com tipografia Plus Jakarta Sans\nâ€¢ Menu simples e bonito com links rápidos e botão de WhatsApp\nâ€¢ Seção Hero elegante com convite a reservas e culinária contemporânea\nâ€¢ Cardápio digital de degustação com preços claros em Meticais (MZN)\nâ€¢ Rodapé minimalista com horários, contactos e direitos reservados.\n\nDeseja aceitar e iniciar a geração do código?`;
    }

    if (p.includes('barbearia') || p.includes('corte') || p.includes('barba')) {
      return `Ótimo! Preparei o plano de desenvolvimento para a sua Barbearia VIP:\n\nâ€¢ Tema Preto & Branco com visual masculino moderno de alta classe\nâ€¢ Menu clean e elegante com atalhos para serviços e agendamento\nâ€¢ Tabela de cortes, barba terapia e combos com preços em Meticais (MZN)\nâ€¢ Botão flutuante de agendamento rápido via WhatsApp\nâ€¢ Rodapé simples e bonito com horários de funcionamento.\n\nDeseja aceitar e iniciar a geração do código?`;
    }

    if (p.includes('hotel') || p.includes('resort') || p.includes('turismo') || p.includes('hospedagem')) {
      return `Perfeito! Preparei o plano para o seu Hotel & Resort:\n\nâ€¢ Estética refinada Preto & Branco com destaque para suítes exclusivas\nâ€¢ Menu simples e bonito com navegação fluida e botão de reserva\nâ€¢ Seção de acomodações com tarifas por noite em Meticais (MZN)\nâ€¢ Comodidades premium (piscina infinita, SPA, gastronomia)\nâ€¢ Rodapé minimalista com informações e termos.\n\nDeseja aceitar e iniciar a geração do código?`;
    }

    if (p.includes('loja') || p.includes('ecommerce') || p.includes('produto') || p.includes('venda')) {
      return `Excelente! Preparei o plano para a sua Loja Online:\n\nâ€¢ Layout monocromático Preto & Branco com vitrine minimalista de produtos\nâ€¢ Menu simples e bonito com categorias e botão de pedido\nâ€¢ Catálogo com preços em Meticais e botões diretos de compra no WhatsApp\nâ€¢ Rodapé clean com vantagens de envio, suporte e pagamentos locais.\n\nDeseja aceitar e iniciar a geração do código?`;
    }

    return `Entendido! Preparei o seguinte plano de desenvolvimento:\n\nâ€¢ Tema minimalista Preto & Branco de alto contraste\nâ€¢ Menu simples e bonito com logotipo e navegação essencial\nâ€¢ Seções completas: Hero impactante, serviços com preços, CTA e Rodapé clean\nâ€¢ 100% responsivo para telemóveis e computadores.\n\nDeseja aceitar e iniciar a geração do código?`;
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

  // â”€â”€â”€ Efeito Typewriter e Entrada Fluida (Estilo ChatGPT / Claude) â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€ Ponto de Entrada: Enviar Prompt (Gera Proposta Prévia ou Responde Chat) â”€â”€
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

  // â”€â”€â”€ Execução do Streaming SSE (Acionado ao Clicar em "Aceitar e Gerar Código" ou Chat) â”€
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

  // Injetar script de Edição Direta por Clique no Preview do Iframe
  const editorInjectedHtml = useMemo(() => {
    if (!displayedHtml) return '';
    if (!isClickToEditEnabled) return displayedHtml;

    const scriptToInject = `
<style id="__wehost_edit_style__">
  [data-wehost-hover="true"] { outline: 2px dashed rgba(59, 130, 246, 0.7) !important; outline-offset: 3px !important; cursor: text !important; }
  [contenteditable="true"] { outline: 2px solid #3b82f6 !important; outline-offset: 3px !important; background: rgba(59, 130, 246, 0.08) !important; border-radius: 4px !important; }
</style>
<script id="__wehost_click_to_edit__">
  (function() {
    var validTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'A', 'LI', 'LABEL', 'BUTTON'];
    
    document.addEventListener('mouseover', function(e) {
      var t = e.target;
      if (!t || t.isContentEditable) return;
      if (validTags.indexOf(t.tagName) !== -1 || (t.childNodes.length === 1 && t.childNodes[0].nodeType === 3)) {
        t.setAttribute('data-wehost-hover', 'true');
      }
    }, true);

    document.addEventListener('mouseout', function(e) {
      var t = e.target;
      if (t && t.hasAttribute('data-wehost-hover')) {
        t.removeAttribute('data-wehost-hover');
      }
    }, true);

    document.addEventListener('click', function(e) {
      var t = e.target;
      if (!t) return;
      if (t.isContentEditable) return;
      if (validTags.indexOf(t.tagName) !== -1 || (t.childNodes.length === 1 && t.childNodes[0].nodeType === 3)) {
        e.preventDefault();
        e.stopPropagation();
        t.removeAttribute('data-wehost-hover');
        t.contentEditable = 'true';
        t.focus();
        
        var originalText = t.innerHTML;
        
        var onBlur = function() {
          t.contentEditable = 'false';
          t.removeAttribute('data-wehost-hover');
          t.removeEventListener('blur', onBlur);
          
          if (t.innerHTML !== originalText) {
            var clone = document.documentElement.cloneNode(true);
            var styleEl = clone.querySelector('#__wehost_edit_style__');
            if (styleEl) styleEl.remove();
            var scriptEl = clone.querySelector('#__wehost_click_to_edit__');
            if (scriptEl) scriptEl.remove();
            clone.querySelectorAll('[data-wehost-hover]').forEach(function(el) { el.removeAttribute('data-wehost-hover'); });
            clone.querySelectorAll('[contenteditable]').forEach(function(el) { el.removeAttribute('contenteditable'); });
            
            window.parent.postMessage({
              type: 'WEHOST_HTML_EDITED',
              html: '<!DOCTYPE html>\\n' + clone.outerHTML
            }, '*');
          }
        };
        
        t.addEventListener('blur', onBlur);
        
        t.addEventListener('keydown', function(evt) {
          if (evt.key === 'Enter' && t.tagName !== 'P') {
            evt.preventDefault();
            t.blur();
          }
        });
      }
    }, true);
  })();
</script>`;

    if (displayedHtml.includes('</body>')) {
      return displayedHtml.replace('</body>', `${scriptToInject}</body>`);
    }
    return displayedHtml + scriptToInject;
  }, [displayedHtml, isClickToEditEnabled]);

  // Listener para atualizações feitas por clique direto no Iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'WEHOST_HTML_EDITED' && typeof event.data.html === 'string') {
        const cleanHtml = event.data.html;
        setCurrentHtml(cleanHtml);
        setToastMessage('Texto atualizado com sucesso!');
        setTimeout(() => setToastMessage(null), 2500);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

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
    : `${projectSlug}.wehosthere.co.mz`;

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

  // â”€â”€â”€ Exportar como ZIP (HTML + CSS extraído + README) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€ Editor de Código Inline â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€ Limpar Histórico de Chat do Projeto Atual â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€ Modal e Link de Partilha de Pré-visualização â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€ Manipular Upload e Aplicação do Logótipo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€ COMMITTER UNIVERSAL DE REFINAMENTO (Garante Versões, Sincronização e Links) â”€
  const commitNewHtmlVersion = (newHtml: string, actionPrompt: string, explanation: string) => {
    const finalHtml = ensureClickableNavigation(newHtml);
    setCurrentHtml(finalHtml);

    // Salvar versão no histórico
    const nextVer: ProjectVersion = {
      versionNumber: versions.length + 1,
      html: finalHtml,
      prompt: actionPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updatedVersions = [...versions, nextVer];
    setVersions(updatedVersions);
    setSelectedVersionIndex('latest');

    // Registar no chat daquele projeto
    const actionMsg: ChatMessage = {
      id: `msg_refine_${Date.now()}`,
      role: 'assistant',
      content: explanation,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updatedMessages = [...messages, actionMsg];
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
        htmlContent: finalHtml,
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

  // ðŸŽ¨ Aplicar Paleta de Cores
  const handleApplyColors = () => {
    if (!currentUser) {
      setAuthModalReason('Para personalizar as cores e guardar as alterações no seu projeto, inicie sessão.');
      setIsAuthRequiredModalOpen(true);
      return;
    }
    if (!displayedHtml) return;
    const newHtml = applyColorsToHtml(displayedHtml, selectedColorPalette, customPrimaryColor, colorMode);
    const pName = COLOR_PALETTES.find(p => p.id === selectedColorPalette)?.name || 'Personalizada';
    commitNewHtmlVersion(
      newHtml,
      `Mudar paleta de cores para ${pName} (${colorMode === 'dark' ? 'Modo Escuro' : 'Modo Claro'})`,
      `Paleta de cores **${pName}** aplicada com sucesso! Os botões de ação, fundos e destaques foram atualizados com harmonia visual e alto contraste.`
    );
    setIsColorModalOpen(false);
  };

  // ðŸ’¬ Aplicar Configuração do WhatsApp
  const handleApplyWhatsApp = () => {
    if (!currentUser) {
      setAuthModalReason('Para vincular o botão de WhatsApp ao seu website, inicie sessão.');
      setIsAuthRequiredModalOpen(true);
      return;
    }
    if (!displayedHtml) return;
    const fullPhone = `${waCountryCode}${waPhoneNumber}`;
    const newHtml = applyWhatsAppToHtml(displayedHtml, fullPhone, waMessage, waButtonText, waPosition);
    commitNewHtmlVersion(
      newHtml,
      `Vincular botão oficial de WhatsApp (${fullPhone})`,
      `Botão oficial de WhatsApp vinculado com sucesso ao número **${fullPhone}**! O botão flutuante e os links do menu foram conectados para iniciar conversa direta com a mensagem personalizada.`
    );
    setIsWhatsAppModalOpen(false);
  };

  // ðŸ·ï¸ Aplicar Tabela de Preços & Benefícios
  const handleApplyPricing = () => {
    if (!currentUser) {
      setAuthModalReason('Para inserir a tabela de preços no seu website, inicie sessão.');
      setIsAuthRequiredModalOpen(true);
      return;
    }
    if (!displayedHtml) return;
    const config: PricingConfigData = {
      currency: pricingCurrency,
      cycle: pricingCycle,
      plan1: {
        name: plan1Name,
        price: plan1Price,
        features: plan1Features.split('\n').filter(Boolean)
      },
      plan2: {
        name: plan2Name,
        price: plan2Price,
        badge: plan2Badge,
        features: plan2Features.split('\n').filter(Boolean)
      },
      plan3: {
        name: plan3Name,
        price: plan3Price,
        features: plan3Features.split('\n').filter(Boolean)
      }
    };
    const newHtml = applyPricingToHtml(displayedHtml, config);
    commitNewHtmlVersion(
      newHtml,
      `Inserção de Tabela de Preços com 3 planos em ${pricingCurrency}`,
      `Tabela de preços e benefícios inserida com sucesso com os planos **${plan1Name}**, **${plan2Name}** e **${plan3Name}**! O link no menu de navegação foi sincronizado para rolagem suave até a secção de preços.`
    );
    setIsPricingModalOpen(false);
  };

  // ðŸ–¼ï¸ Aplicar Configuração de Banner / Hero
  const handleApplyBanner = () => {
    if (!currentUser) {
      setAuthModalReason('Para personalizar o banner principal do seu website, inicie sessão.');
      setIsAuthRequiredModalOpen(true);
      return;
    }
    if (!displayedHtml) return;
    const config: BannerConfigData = {
      headline: bannerHeadline,
      subtitle: bannerSubtitle,
      ctaText: bannerCtaText,
      ctaLink: bannerCtaLink,
      secondaryText: bannerSecondaryText,
      secondaryLink: bannerSecondaryLink,
      badge: bannerBadge,
      style: bannerTheme
    };
    const newHtml = applyBannerToHtml(displayedHtml, config);
    commitNewHtmlVersion(
      newHtml,
      `Configuração do Banner Principal / Hero`,
      `Banner principal atualizado com sucesso! O título, mensagem de suporte e botões de chamada à ação foram configurados com layout responsivo e moderno.`
    );
    setIsBannerModalOpen(false);
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

      {/* â”€â”€ COLUNA 1: SIDEBAR DE PROJETOS E CONVERSAS (Estilo v0) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

      {/* â”€â”€ COLUNA 2: CHAT INTERATIVO & ITERAÇÕES (Colapsável / Redimensionável) â”€â”€â”€â”€â”€â”€ */}
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

          {/* â”€â”€ Templates / Modelos Prontos â”€â”€ */}
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
                    { icon: 'ðŸ’¼', label: 'Freelancer / CV', prompt: 'Cria um site pessoal profissional para freelancer. Inclui secção Hero com foto, serviços oferecidos (Design, Web, Marketing), portfólio com exemplos, depoimentos de clientes, e formulário de contacto com número de WhatsApp. Design moderno com cores escuras e detalhes dourados.' },
                    { icon: 'ðŸ½ï¸', label: 'Restaurante', prompt: 'Cria um site para restaurante moçambicano chamado "Sabor do Mar". Inclui menu com categorias (Entradas, Pratos Principais, Bebidas, Sobremesas), galeria de pratos com fotos, horário de funcionamento, localização no mapa, e botão para reserva de mesa via WhatsApp. Design quente e acolhedor.' },
                    { icon: 'âœ‚ï¸', label: 'Barbearia / Salão', prompt: 'Cria um site para barbearia moderna chamada "Corte & Arte". Inclui galeria de cortes, lista de serviços com preços (em Meticais), sistema de agendamento via WhatsApp, depoimentos de clientes e localização. Design urbano e masculino com preto e dourado.' },
                    { icon: 'ðŸ›ï¸', label: 'Loja Online', prompt: 'Cria um site para loja de produtos variados. Inclui banner promocional, catálogo de produtos com imagens, preços em Meticais, botão de compra via WhatsApp, secção de ofertas especiais, e rodapé com redes sociais. Design colorido e apelativo.' },
                    { icon: 'ðŸŽ¯', label: 'Coach / Formador', prompt: 'Cria um site para coach profissional e formador. Inclui apresentação pessoal impactante, lista de programas e formações oferecidas, resultados de clientes anteriores (depoimentos), calendário de eventos próximos, e formulário de inscrição. Design inspirador com gradientes vibrantes.' },
                    { icon: 'ðŸŽ¨', label: 'Portfólio Criativo', prompt: 'Cria um portfólio criativo para designer ou fotógrafo. Inclui galeria de trabalhos em grelha, mini bio pessoal, secção de serviços e preços, botão de contacto e links para redes sociais. Design minimalista e elegante com muito espaço branco e tipografia moderna.' },
                    { icon: 'ðŸŽ‰', label: 'Eventos / Festa', prompt: 'Cria um site para empresa de organização de eventos chamada "Festa Total". Inclui galeria de eventos passados, tipos de eventos que organizam (Casamentos, Aniversários, Corporativo), formulário de pedido de orçamento, countdown para próximo evento, e contactos. Design festivo e animado.' },
                    { icon: 'ðŸŽµ', label: 'Músico / Artista', prompt: 'Cria um site para músico ou artista moçambicano. Inclui bio artística, discografia com capas de álbuns, vídeos do YouTube embedidos, datas de espectáculos, galeria de fotos, e links para plataformas (Spotify, YouTube, Instagram). Design artístico com cores vibrantes e efeitos visuais.' },
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
                onClick={() => setIsColorModalOpen(true)}
                className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 hover:border-blue-500/40"
              >
                <Palette className="w-3.5 h-3.5 text-blue-400" />
                <span>Mudar Cores</span>
              </button>
              <button
                type="button"
                onClick={() => setIsWhatsAppModalOpen(true)}
                className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 hover:border-emerald-500/40"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Botão WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPricingModalOpen(true)}
                className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 hover:border-purple-500/40"
                title="Configurar e Inserir Tabela de Preços com Benefícios"
              >
                <Tag className="w-3.5 h-3.5 text-purple-400" />
                <span>Tabela de Preços</span>
              </button>
              <button
                type="button"
                onClick={() => setIsBannerModalOpen(true)}
                className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 hover:border-amber-500/40"
                title="Configurar Título, Mensagem e Estilo do Banner / Hero"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Configurar Banner</span>
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

      {/* â”€â”€ DIVISOR MANUAL REDIMENSIONÁVEL (Arrastar para Aumentar / Diminuir) â”€â”€ */}
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

      {/* â”€â”€ COLUNA 3: CANVAS DE PREVIEW AO VIVO + CÓDIGO + PUBLICAR (Estilo v0) â”€â”€ */}
      <main className={`flex flex-1 flex-col h-full bg-[#121217] relative z-10 overflow-hidden ${
        isMobile && isChatOpen ? 'hidden' : 'flex'
      }`}>
        
        {/* Barra Superior do Canvas */}
        <header className="h-14 px-2.5 sm:px-4 border-b border-[#27272a] bg-[#0e0e11] flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          
          {/* Lado Esquerdo: Botões de Expandir Sidebar/Chat + Seletor Preview/Código */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
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

          {/* Centro: Dropdown Histórico/Versões (Ícone apenas para máxima economia de espaço) */}
          <div className="flex items-center gap-1 bg-[#18181b] p-1 rounded-xl border border-[#27272a] relative shrink-0" ref={versionMenuRef}>
            
            {/* Botão Dropdown Versão (Apenas ícone conforme solicitado para poupar espaço) */}
            <button
              onClick={() => setIsVersionDropdownOpen(!isVersionDropdownOpen)}
              className="flex items-center gap-1 px-1.5 py-1 rounded-lg text-xs font-bold text-gray-200 hover:bg-white/5 transition cursor-pointer"
              title={`Histórico de Versões: ${selectedVersionIndex === 'latest' ? 'Latest (Mais Recente)' : `v${versions[selectedVersionIndex]?.versionNumber || selectedVersionIndex + 1}`}`}
            >
              <History className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <ChevronDown className="w-2.5 h-2.5 text-gray-400 shrink-0" />
            </button>

            {/* Stepper de Navegação de Versões < > (Apenas quando há mais de 1 versão e em ecrãs largos) */}
            {versions.length > 1 && (
              <div className="hidden xl:flex items-center border-l border-[#27272a] pl-1 gap-0.5 text-gray-400">
                <button
                  onClick={() => handleStepVersion('prev')}
                  disabled={selectedVersionIndex === 0}
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
                  disabled={selectedVersionIndex === 'latest'}
                  className="p-1 rounded hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition"
                  title="Versão Seguinte"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

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
            
            {/* Modos Responsivos (Desktop, Tablet, Mobile) - Compacto e elegante */}
            <div className="hidden xl:flex items-center gap-1 bg-[#18181b] p-1 rounded-xl border border-[#27272a]">
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

            {/* Ações Diretas em Ecrãs Muito Grandes (2XL) */}
            <div className="hidden 2xl:flex items-center gap-1.5">
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

            {/* Menu "Mais Ferramentas" (â‹¯) â€” Sempre acessível em ecrãs com barra lateral expandida */}
            <div className="relative 2xl:hidden" ref={moreMenuRef}>
              <button
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition cursor-pointer"
                title="Mais Ferramentas do Projeto"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {isMoreMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-[#18181b] border border-[#27272a] rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5 flex items-center justify-between">
                    <span>Ferramentas do Site</span>
                    <span className="text-[9px] text-blue-400">Atalhos</span>
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
                      handleOpenShareModal();
                      setIsMoreMenuOpen(false);
                    }}
                    disabled={!displayedHtml}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-gray-300 hover:text-white hover:bg-white/5 transition flex items-center gap-2.5 disabled:opacity-40 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Partilhar Pré-visualização</span>
                  </button>

                  <button
                    onClick={() => {
                      handleOpenInNewTab();
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-gray-300 hover:text-white hover:bg-white/5 transition flex items-center gap-2.5 cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Abrir em Nova Aba</span>
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

            {/* BOTÃO OPEN IN NEW TAB (Directo) */}
            <button
              onClick={handleOpenInNewTab}
              className="hidden sm:flex p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition cursor-pointer"
              title="Abrir em Nova Aba no Navegador"
            >
              <ExternalLink className="w-4 h-4 text-blue-400" />
            </button>

            {/* BOTÃO ATALHO PARA O EDITOR VISUAL (Compacto com texto "Editor") */}
            <button
              onClick={() => {
                if (typeof window !== 'undefined' && displayedHtml) {
                  sessionStorage.setItem('wehost_visual_builder_html', displayedHtml);
                  sessionStorage.setItem('wehost_visual_builder_title', projectTitle || 'Meu Website');
                }
                const targetUrl = projectId ? `/dashboard/visual-builder?id=${projectId}` : '/dashboard/visual-builder';
                router.push(targetUrl);
              }}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 hover:text-blue-300 border border-blue-500/30 font-bold text-xs transition active:scale-95 cursor-pointer shrink-0 shadow-xs"
              title="Abrir no Editor Visual Pro (Estilo Elementor â€” editar e reorganizar blocos visualmente)"
            >
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Editor</span>
            </button>

            {/* BOTÃO EXPORTAR CÓDIGO (Ícone compacto para poupar espaço) */}
            <button
              onClick={() => setIsExportModalOpen(true)}
              disabled={!displayedHtml}
              className="p-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 transition active:scale-95 cursor-pointer shrink-0 disabled:opacity-40 shadow-xs"
              title="Exportar código-fonte do website (ZIP ou HTML)"
            >
              <Download className="w-4 h-4 text-emerald-400" />
            </button>

            {/* BOTÃO PUBLICAR (Destaque Principal Compacto) */}
            <button
              onClick={() => {
                if (!currentUser) {
                  setAuthModalReason('Para publicar o seu website online com subdomínio e SSL gratuito, inicie sessão na sua conta.');
                  setIsAuthRequiredModalOpen(true);
                  return;
                }
                setIsPublishModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 text-black font-extrabold text-xs shadow-sm transition active:scale-95 cursor-pointer shrink-0"
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

                <div className="flex items-center justify-end gap-2">
                  {/* BOTÃO TOGGLE EDIÇÃO POR CLIQUE */}
                  <button
                    type="button"
                    onClick={() => {
                      const nextState = !isClickToEditEnabled;
                      setIsClickToEditEnabled(nextState);
                      setToastMessage(nextState ? 'Edição por Clique ativada! Clique em qualquer texto no preview para editar.' : 'Edição por Clique desativada.');
                      setTimeout(() => setToastMessage(null), 3000);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer border ${
                      isClickToEditEnabled
                        ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400/50 shadow-sm'
                        : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border-white/10'
                    }`}
                    title={isClickToEditEnabled ? 'Edição por Clique Ativa (clique em qualquer texto para editar diretamente)' : 'Ativar Edição Direta por Clique'}
                  >
                    <Edit3 className="w-3 h-3" />
                    <span className="hidden sm:inline">{isClickToEditEnabled ? 'Edição Ativa' : 'Editar Texto'}</span>
                  </button>

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

              {/* Iframe que renderiza o HTML com suporte a Edição por Clique */}
              <iframe
                title="Preview"
                srcDoc={editorInjectedHtml}
                className="w-full flex-1 border-0 bg-transparent"
                sandbox="allow-scripts allow-forms allow-popups allow-same-origin allow-modals"
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
                <span className="text-[10px] text-gray-500 ml-2 font-mono">index.html â€” em geração</span>
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
                    {isEditingCode ? 'â€” Modo Edição Direta' : 'â€” Realce de Sintaxe'}
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

      {/* â”€â”€ MODAL DE PUBLICAÇÃO COM SUPORTE COMPLETO A SUBDOMÍNIOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
                  <span className="text-gray-400 font-mono select-none">.wehosthere.co.mz</span>
                </div>
              </div>

              {/* Box de Subdomínio Ativo */}
              <div className="p-3.5 rounded-2xl bg-[#18181b] border border-[#27272a] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-400" /> Endereço Oficial Moçambique
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
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between">
                    <div className="truncate pr-2">
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Site Publicado com Sucesso!
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

                  {/* QR Code Interativo para Partilha e Teste no Telemóvel */}
                  <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-24 h-24 bg-white p-1.5 rounded-xl shrink-0 flex items-center justify-center shadow-md">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(subdomainUrl)}&margin=1`} 
                        alt="QR Code do Website"
                        className="w-full h-full object-contain" 
                      />
                    </div>
                    <div className="text-center sm:text-left space-y-2 flex-1">
                      <div>
                        <span className="text-xs font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
                          <QrCode className="w-3.5 h-3.5 text-emerald-400" /> Aceder no Telemóvel
                        </span>
                        <p className="text-[10px] text-gray-400 leading-relaxed mt-0.5">
                          Aponte a câmara do seu smartphone para abrir o site ou partilhe no status do WhatsApp.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                        <button
                          onClick={() => {
                            const text = encodeURIComponent(`Olá! Veja o meu novo website oficial na WeHost: ${subdomainUrl}`);
                            window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Partilhar no WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  </div>
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

      {/* â”€â”€ MODAL DE PARTILHA DE PRÉ-VISUALIZAÇÃO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

              {/* QR Code para Teste Imediato no Telemóvel */}
              <div className="p-3.5 rounded-2xl bg-[#09090b] border border-[#27272a] flex items-center gap-4">
                <div className="w-20 h-20 bg-white p-1.5 rounded-xl shrink-0 flex items-center justify-center shadow-md">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(previewShareUrl)}&margin=1`} 
                    alt="QR Code de Pré-visualização"
                    className="w-full h-full object-contain" 
                  />
                </div>
                <div className="space-y-1 text-left">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-blue-400" /> Aceder pelo Telemóvel
                  </span>
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    Aponte a câmara do telemóvel para abrir a pré-visualização instantaneamente antes de publicar.
                  </p>
                </div>
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

      {/* â”€â”€ MODAL DE CONFIGURAÇÃO DE LOGÓTIPO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

      {/* â”€â”€ MODAL CUSTOMIZADO: CONFIRMAÇÃO DE ELIMINAR PROJETO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

      {/* â”€â”€ MODAL CUSTOMIZADO: CONFIRMAÇÃO DE LIMPAR CONVERSA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

      {/* â”€â”€ MODAL DE EXPORTAÇÃO COMPLETA DE CÓDIGO (ZIP / HTML) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
                ðŸ’¡ <strong>Dica:</strong> Pode publicar este website online instantaneamente na WEHOSTHERE com SSL gratuito e domínio próprio.
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

      {/* ðŸ”’ MODAL DE AUTENTICAÇÃO NECESSÁRIA PARA VISITANTES */}
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

      {/* â”€â”€ MODAL: ðŸŽ¨ Mudar Cores do Website â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {isColorModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#121217] border border-[#27272a] rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar">
            <button
              onClick={() => setIsColorModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/10">
                <Palette className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Paleta de Cores do Website</h3>
                <p className="text-xs text-gray-400">Selecione o esquema cromático ideal para a sua marca</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Seletor de Modo Claro / Escuro */}
              <div>
                <label className="text-[11px] font-bold text-gray-300 block mb-2">1. Modo de Fundo:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setColorMode('dark')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      colorMode === 'dark'
                        ? 'border-blue-500 bg-blue-500/15 text-white shadow-sm'
                        : 'border-[#27272a] bg-[#18181b] text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-700" />
                    <span>Modo Escuro (Dark)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setColorMode('light')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      colorMode === 'light'
                        ? 'border-blue-500 bg-blue-500/15 text-white shadow-sm'
                        : 'border-[#27272a] bg-[#18181b] text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-white border border-gray-300" />
                    <span>Modo Claro (Light)</span>
                  </button>
                </div>
              </div>

              {/* Grid de Paletas Pré-Definidas */}
              <div>
                <label className="text-[11px] font-bold text-gray-300 block mb-2">2. Escolha a Paleta Harmônica:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {COLOR_PALETTES.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedColorPalette(p.id);
                        setCustomPrimaryColor(p.primary);
                      }}
                      className={`p-3 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                        selectedColorPalette === p.id
                          ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/50'
                          : 'border-[#27272a] bg-[#18181b] hover:border-[#3f3f46]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex -space-x-1.5">
                          <span className="w-5 h-5 rounded-full border border-black/40 shadow-sm" style={{ backgroundColor: p.primary }} />
                          <span className="w-5 h-5 rounded-full border border-black/40 shadow-sm" style={{ backgroundColor: p.accent }} />
                          <span className="w-5 h-5 rounded-full border border-black/40 shadow-sm" style={{ backgroundColor: colorMode === 'dark' ? p.bgDark : p.bgLight }} />
                        </div>
                        <span className="text-xs font-semibold text-gray-200">{p.name}</span>
                      </div>
                      {selectedColorPalette === p.id && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ajuste Fino de Cor Primária Customizada */}
              <div className="p-3.5 rounded-2xl bg-[#18181b] border border-[#27272a]">
                <label className="text-[11px] font-bold text-gray-300 block mb-2">3. Ou Ajuste a Cor Primária Exata:</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={customPrimaryColor}
                    onChange={e => setCustomPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border border-white/20 bg-transparent cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={customPrimaryColor}
                    onChange={e => setCustomPrimaryColor(e.target.value)}
                    className="flex-1 bg-[#0f0f12] border border-[#27272a] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                    placeholder="#2563eb"
                  />
                </div>
              </div>

              {/* Botões do Rodapé */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setIsColorModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleApplyColors}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md shadow-blue-600/30 transition active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Aplicar Cores ao Site</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ MODAL: ðŸ’¬ Configuração do Botão WhatsApp â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {isWhatsAppModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#121217] border border-[#27272a] rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsWhatsAppModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Botão WhatsApp Oficial</h3>
                <p className="text-xs text-gray-400">Vincule o seu contacto direto para receber mensagens de clientes</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Número de Telefone com Código do País */}
              <div>
                <label className="text-[11px] font-bold text-gray-300 block mb-1.5">Número de WhatsApp do Negócio:</label>
                <div className="flex items-center gap-2">
                  <select
                    value={waCountryCode}
                    onChange={e => setWaCountryCode(e.target.value)}
                    className="bg-[#18181b] border border-[#27272a] text-white text-xs font-semibold rounded-xl px-2.5 py-2.5 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="+258">ðŸ‡²ðŸ‡¿ +258 (Moçambique)</option>
                    <option value="+351">ðŸ‡µðŸ‡¹ +351 (Portugal)</option>
                    <option value="+55">ðŸ‡§ðŸ‡· +55 (Brasil)</option>
                    <option value="+244">ðŸ‡¦ðŸ‡´ +244 (Angola)</option>
                    <option value="+27">ðŸ‡¿ðŸ‡¦ +27 (África do Sul)</option>
                    <option value="+1">ðŸ‡ºðŸ‡¸ +1 (EUA / Global)</option>
                  </select>
                  <input
                    type="text"
                    value={waPhoneNumber}
                    onChange={e => setWaPhoneNumber(e.target.value)}
                    placeholder="84 123 4567"
                    className="flex-1 bg-[#18181b] border border-[#27272a] text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Mensagem Inicial Padrão */}
              <div>
                <label className="text-[11px] font-bold text-gray-300 block mb-1.5">Mensagem Inicial que o Cliente Enviará:</label>
                <textarea
                  value={waMessage}
                  onChange={e => setWaMessage(e.target.value)}
                  rows={2}
                  className="w-full bg-[#18181b] border border-[#27272a] text-white text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500 resize-none"
                  placeholder="Olá! Gostaria de mais informações sobre os vossos serviços."
                />
              </div>

              {/* Texto do Botão */}
              <div>
                <label className="text-[11px] font-bold text-gray-300 block mb-1.5">Texto do Botão Flutuante:</label>
                <input
                  type="text"
                  value={waButtonText}
                  onChange={e => setWaButtonText(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#27272a] text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
                  placeholder="Falar no WhatsApp"
                />
              </div>

              {/* Posição */}
              <div>
                <label className="text-[11px] font-bold text-gray-300 block mb-1.5">Posição do Botão na Página:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWaPosition('right')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                      waPosition === 'right'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold'
                        : 'border-[#27272a] bg-[#18181b] text-gray-400 hover:text-white'
                    }`}
                  >
                    Canto Inferior Direito
                  </button>
                  <button
                    type="button"
                    onClick={() => setWaPosition('left')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                      waPosition === 'left'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold'
                        : 'border-[#27272a] bg-[#18181b] text-gray-400 hover:text-white'
                    }`}
                  >
                    Canto Inferior Esquerdo
                  </button>
                </div>
              </div>

              {/* Botões do Rodapé */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setIsWhatsAppModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleApplyWhatsApp}
                  disabled={!waPhoneNumber.trim()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 transition active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Vincular WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ MODAL: ðŸ·ï¸ Tabela de Preços & Benefícios â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {isPricingModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#121217] border border-[#27272a] rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar">
            <button
              onClick={() => setIsPricingModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center shadow-lg shadow-purple-500/10">
                <Tag className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Configuração da Tabela de Preços</h3>
                <p className="text-xs text-gray-400">Defina os planos, valores e benefícios transparentes para os seus clientes</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Moeda e Ciclo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1">Moeda:</label>
                  <select
                    value={pricingCurrency}
                    onChange={e => setPricingCurrency(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#27272a] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500"
                  >
                    <option value="MT">MT (Meticais Moçambique)</option>
                    <option value="USD">USD ($ Dólar)</option>
                    <option value="EUR">EUR (â‚¬ Euro)</option>
                    <option value="BRL">BRL (R$ Real)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1">Ciclo de Cobrança:</label>
                  <select
                    value={pricingCycle}
                    onChange={e => setPricingCycle(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#27272a] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500"
                  >
                    <option value="/mês">/mês (Mensal)</option>
                    <option value="/ano">/ano (Anual)</option>
                    <option value="Pagamento Único">Pagamento Único</option>
                  </select>
                </div>
              </div>

              {/* 3 Planos Lado a Lado / Empilhados */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Plano 1 */}
                <div className="p-3.5 rounded-2xl bg-[#18181b] border border-[#27272a] flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-gray-400">Plano 1</span>
                    <input
                      type="text"
                      value={plan1Name}
                      onChange={e => setPlan1Name(e.target.value)}
                      placeholder="Nome do Plano"
                      className="w-full bg-[#0f0f12] border border-[#27272a] text-white text-xs font-bold rounded-lg px-2.5 py-1.5 my-1.5"
                    />
                    <input
                      type="text"
                      value={plan1Price}
                      onChange={e => setPlan1Price(e.target.value)}
                      placeholder="Preço (ex: 1.500)"
                      className="w-full bg-[#0f0f12] border border-[#27272a] text-white text-xs font-bold rounded-lg px-2.5 py-1.5 mb-2"
                    />
                    <label className="text-[10px] text-gray-400 block mb-1">Benefícios (1 por linha):</label>
                    <textarea
                      value={plan1Features}
                      onChange={e => setPlan1Features(e.target.value)}
                      rows={4}
                      className="w-full bg-[#0f0f12] border border-[#27272a] text-gray-200 text-[11px] rounded-lg p-2 resize-none"
                    />
                  </div>
                </div>

                {/* Plano 2 (Destaque) */}
                <div className="p-3.5 rounded-2xl bg-blue-950/20 border-2 border-blue-500/60 flex flex-col justify-between relative">
                  <span className="text-[10px] font-black uppercase text-blue-400">Plano 2 (Destaque)</span>
                  <input
                    type="text"
                    value={plan2Name}
                    onChange={e => setPlan2Name(e.target.value)}
                    placeholder="Nome do Plano"
                    className="w-full bg-[#0f0f12] border border-blue-500/40 text-white text-xs font-bold rounded-lg px-2.5 py-1.5 my-1.5"
                  />
                  <input
                    type="text"
                    value={plan2Price}
                    onChange={e => setPlan2Price(e.target.value)}
                    placeholder="Preço (ex: 3.500)"
                    className="w-full bg-[#0f0f12] border border-blue-500/40 text-white text-xs font-bold rounded-lg px-2.5 py-1.5 mb-1.5"
                  />
                  <input
                    type="text"
                    value={plan2Badge}
                    onChange={e => setPlan2Badge(e.target.value)}
                    placeholder="Badge (ex: Mais Popular)"
                    className="w-full bg-[#0f0f12] border border-blue-500/40 text-blue-300 text-[10px] font-bold rounded-lg px-2.5 py-1 mb-2"
                  />
                  <label className="text-[10px] text-blue-300 block mb-1">Benefícios (1 por linha):</label>
                  <textarea
                    value={plan2Features}
                    onChange={e => setPlan2Features(e.target.value)}
                    rows={4}
                    className="w-full bg-[#0f0f12] border border-blue-500/40 text-gray-200 text-[11px] rounded-lg p-2 resize-none"
                  />
                </div>

                {/* Plano 3 */}
                <div className="p-3.5 rounded-2xl bg-[#18181b] border border-[#27272a] flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-gray-400">Plano 3</span>
                    <input
                      type="text"
                      value={plan3Name}
                      onChange={e => setPlan3Name(e.target.value)}
                      placeholder="Nome do Plano"
                      className="w-full bg-[#0f0f12] border border-[#27272a] text-white text-xs font-bold rounded-lg px-2.5 py-1.5 my-1.5"
                    />
                    <input
                      type="text"
                      value={plan3Price}
                      onChange={e => setPlan3Price(e.target.value)}
                      placeholder="Preço (ex: 7.500)"
                      className="w-full bg-[#0f0f12] border border-[#27272a] text-white text-xs font-bold rounded-lg px-2.5 py-1.5 mb-2"
                    />
                    <label className="text-[10px] text-gray-400 block mb-1">Benefícios (1 por linha):</label>
                    <textarea
                      value={plan3Features}
                      onChange={e => setPlan3Features(e.target.value)}
                      rows={4}
                      className="w-full bg-[#0f0f12] border border-[#27272a] text-gray-200 text-[11px] rounded-lg p-2 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Botões do Rodapé */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setIsPricingModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleApplyPricing}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-md shadow-purple-600/30 transition active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Inserir Tabela de Preços</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ MODAL: ðŸ–¼ï¸ Configuração de Banner / Hero â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#121217] border border-[#27272a] rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar">
            <button
              onClick={() => setIsBannerModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
                <Sliders className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Configuração do Banner / Hero</h3>
                <p className="text-xs text-gray-400">Personalize o título, a proposta de valor e os botões de ação do topo</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Badge de Destaque */}
              <div>
                <label className="text-[11px] font-bold text-gray-300 block mb-1">Badge de Destaque (Topo do Banner):</label>
                <input
                  type="text"
                  value={bannerBadge}
                  onChange={e => setBannerBadge(e.target.value)}
                  placeholder="Ex: âš¡ Nova Geração 2026"
                  className="w-full bg-[#18181b] border border-[#27272a] text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Título Principal (Headline) */}
              <div>
                <label className="text-[11px] font-bold text-gray-300 block mb-1">Título Principal (Headline):</label>
                <input
                  type="text"
                  value={bannerHeadline}
                  onChange={e => setBannerHeadline(e.target.value)}
                  placeholder="Ex: Soluções Digitais que aceleram o seu Crescimento"
                  className="w-full bg-[#18181b] border border-[#27272a] text-white text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Subtítulo / Descrição */}
              <div>
                <label className="text-[11px] font-bold text-gray-300 block mb-1">Subtítulo / Proposta de Valor:</label>
                <textarea
                  value={bannerSubtitle}
                  onChange={e => setBannerSubtitle(e.target.value)}
                  rows={2}
                  placeholder="Ex: Desenvolvemos tecnologia de alta performance para empresas modernas..."
                  className="w-full bg-[#18181b] border border-[#27272a] text-white text-xs rounded-xl p-3 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Botões de Ação */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1">Botão Principal (Texto):</label>
                  <input
                    type="text"
                    value={bannerCtaText}
                    onChange={e => setBannerCtaText(e.target.value)}
                    placeholder="Começar Agora"
                    className="w-full bg-[#18181b] border border-[#27272a] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1">Link do Botão (Ã‚ncora):</label>
                  <input
                    type="text"
                    value={bannerCtaLink}
                    onChange={e => setBannerCtaLink(e.target.value)}
                    placeholder="#contacto"
                    className="w-full bg-[#18181b] border border-[#27272a] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1">Botão Secundário (Texto):</label>
                  <input
                    type="text"
                    value={bannerSecondaryText}
                    onChange={e => setBannerSecondaryText(e.target.value)}
                    placeholder="Ver Serviços"
                    className="w-full bg-[#18181b] border border-[#27272a] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1">Link Secundário (Ã‚ncora):</label>
                  <input
                    type="text"
                    value={bannerSecondaryLink}
                    onChange={e => setBannerSecondaryLink(e.target.value)}
                    placeholder="#solucoes"
                    className="w-full bg-[#18181b] border border-[#27272a] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Estilo do Banner */}
              <div>
                <label className="text-[11px] font-bold text-gray-300 block mb-1.5">Estilo Visual do Banner:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBannerTheme('tech-dark')}
                    className={`py-2 px-2.5 rounded-xl border text-[11px] font-semibold transition cursor-pointer text-center ${
                      bannerTheme === 'tech-dark'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-400 font-bold'
                        : 'border-[#27272a] bg-[#18181b] text-gray-400 hover:text-white'
                    }`}
                  >
                    Tech Escuro
                  </button>
                  <button
                    type="button"
                    onClick={() => setBannerTheme('minimal')}
                    className={`py-2 px-2.5 rounded-xl border text-[11px] font-semibold transition cursor-pointer text-center ${
                      bannerTheme === 'minimal'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-400 font-bold'
                        : 'border-[#27272a] bg-[#18181b] text-gray-400 hover:text-white'
                    }`}
                  >
                    Minimalista
                  </button>
                  <button
                    type="button"
                    onClick={() => setBannerTheme('executive')}
                    className={`py-2 px-2.5 rounded-xl border text-[11px] font-semibold transition cursor-pointer text-center ${
                      bannerTheme === 'executive'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-400 font-bold'
                        : 'border-[#27272a] bg-[#18181b] text-gray-400 hover:text-white'
                    }`}
                  >
                    Executivo
                  </button>
                </div>
              </div>

              {/* Botões do Rodapé */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleApplyBanner}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs shadow-md shadow-amber-600/30 transition active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Atualizar Banner</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast de Notificação (Edição por Clique / Ações Rápidas) */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-emerald-500 text-black font-extrabold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-none">
          <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}

