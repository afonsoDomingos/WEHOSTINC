'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Clock, Eye, Calendar, Share2,
  Instagram, Linkedin, Twitter, Code2, ChevronRight,
  Globe, Github, Maximize2, X, Copy, Check, MessageCircle, Send, Facebook, Mail, Download
} from 'lucide-react';

interface Story {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  author: {
    name: string;
    avatar?: string;
    bio?: string;
    website?: string;
    socials?: {
      twitter?: string;
      linkedin?: string;
      github?: string;
      instagram?: string;
    };
  };
  category: string;
  tags: string[];
  readingTime?: number;
  views: number;
  featured: boolean;
  highlightText?: string;
  publishedAt?: string;
}

function formatSocialUrl(network: 'github' | 'linkedin' | 'twitter' | 'instagram' | 'website', val: string): string {
  if (!val) return '';
  const clean = val.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
  switch (network) {
    case 'github':
      return `https://github.com/${clean.replace(/^@/, '')}`;
    case 'linkedin':
      return clean.includes('linkedin.com') ? `https://${clean}` : `https://linkedin.com/in/${clean.replace(/^@/, '')}`;
    case 'twitter':
      return `https://x.com/${clean.replace(/^@/, '')}`;
    case 'instagram':
      return `https://instagram.com/${clean.replace(/^@/, '')}`;
    case 'website':
      return `https://${clean}`;
    default:
      return clean;
  }
}

const CAT_COLORS: Record<string, string> = {
  codigo: '#7B2CBF',
  startups: '#5A189A',
  ia: '#9D4EDD',
  design: '#ec4899',
  carreira: '#f59e0b',
  tutoriais: '#10b981',
  noticias: '#64748b',
};

function buildTitle(title: string, highlight?: string) {
  if (!highlight || !title.includes(highlight)) return <span>{title}</span>;
  const parts = title.split(highlight);
  return (
    <>
      {parts[0]}
      <mark style={{
        background: '#7B2CBF', color: '#fff',
        borderRadius: '4px', padding: '0 6px', fontStyle: 'normal',
      }}>{highlight}</mark>
      {parts.slice(1).join(highlight)}
    </>
  );
}

function TypedTitle({
  title,
  highlight,
  speed = 28,
}: {
  title: string;
  highlight?: string;
  speed?: number;
}) {
  const [typedLength, setTypedLength] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setTypedLength(0);
    setIsComplete(false);

    let current = 0;
    const total = title.length;
    const interval = setInterval(() => {
      current++;
      setTypedLength(current);
      if (current >= total) {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [title, speed]);

  if (!highlight || !title.includes(highlight)) {
    const currentText = title.slice(0, typedLength);
    return (
      <span>
        {currentText}
        <span
          className={`story-typing-cursor${isComplete ? ' complete' : ''}`}
          aria-hidden="true"
        />
      </span>
    );
  }

  const highlightStart = title.indexOf(highlight);
  const highlightEnd = highlightStart + highlight.length;

  const beforeText = title.slice(0, Math.min(typedLength, highlightStart));
  const showHighlight = typedLength > highlightStart;
  const highlightTyped = showHighlight
    ? title.slice(highlightStart, Math.min(typedLength, highlightEnd))
    : '';
  const showAfter = typedLength > highlightEnd;
  const afterTyped = showAfter ? title.slice(highlightEnd, typedLength) : '';

  return (
    <span>
      {beforeText}
      {showHighlight && (
        <mark
          style={{
            background: '#7B2CBF',
            color: '#fff',
            borderRadius: '4px',
            padding: '0 6px',
            fontStyle: 'normal',
            display: 'inline',
          }}
        >
          {highlightTyped}
        </mark>
      )}
      {afterTyped}
      <span
        className={`story-typing-cursor${isComplete ? ' complete' : ''}`}
        aria-hidden="true"
      />
    </span>
  );
}

/** Render content — suporta markdown básico + pull quotes */
function renderContent(content: string) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line) { i++; continue; }

    // Pull quote: linha que começa com "> "
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} className="pull-quote">
          {line.slice(2)}
        </blockquote>
      );
      i++;
      continue;
    }

    // H2: ##
    if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="content-h2">{line.slice(3)}</h2>);
      i++;
      continue;
    }

    // H3: ###
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="content-h3">{line.slice(4)}</h3>);
      i++;
      continue;
    }

    // Lista com *
    if (line.startsWith('* ') || line.startsWith('- ')) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('* ') || lines[i].trim().startsWith('- '))) {
        items.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="content-list">
          {items.map((item, idx) => <li key={idx}>{item}</li>)}
        </ul>
      );
      continue;
    }

    // Parágrafo normal
    elements.push(<p key={i} className="content-p">{line}</p>);
    i++;
  }

  return elements;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('pt-MZ', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function RevistaStoryPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [story, setStory] = useState<Story | null>(null);
  const [related, setRelated] = useState<Story[]>([]);
  const [prevStory, setPrevStory] = useState<Story | null>(null);
  const [nextStory, setNextStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [email, setEmail] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fechar modais ao pressionar ESC e travar scroll do corpo
  useEffect(() => {
    if (!lightboxOpen && !shareModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxOpen(false);
        setShareModalOpen(false);
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxOpen, shareModalOpen]);

  useEffect(() => {
    if (slug) fetchStory();
  }, [slug]);

  const fetchStory = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/revista/${slug}`);
      const data = await res.json();
      if (data.success) {
        setStory(data.story);
        fetchRelated(data.story.category, data.story.id);
        fetchAdjacentStories(data.story.id);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelated = async (category: string, currentId: string) => {
    try {
      const res = await fetch(`/api/admin/revista/historias?status=published&category=${category}&limit=4`);
      const data = await res.json();
      if (data.success) {
        setRelated(data.stories.filter((s: Story) => s.id !== currentId).slice(0, 3));
      }
    } catch { /* silent */ }
  };

  const fetchAdjacentStories = async (currentId: string) => {
    try {
      const res = await fetch(`/api/admin/revista/historias?status=published&limit=100`);
      const data = await res.json();
      if (data.success && data.stories.length) {
        const all: Story[] = data.stories;
        const idx = all.findIndex((s: Story) => s.id === currentId);
        if (idx !== -1) {
          setPrevStory(idx + 1 < all.length ? all[idx + 1] : null);
          setNextStory(idx - 1 >= 0 ? all[idx - 1] : null);
        }
      }
    } catch { /* silent */ }
  };

  const currentShareUrl = typeof window !== 'undefined' && window.location.href
    ? window.location.href
    : `https://www.wehosthere.com/revista/${story?.slug || slug}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentShareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const input = document.createElement('input');
      input.value = currentShareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareAll = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: story?.title || 'Codando Histórias',
          text: story?.excerpt || story?.title,
          url: currentShareUrl,
        });
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setShareModalOpen(true);
        }
        return;
      }
    }
    setShareModalOpen(true);
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent((story?.title || '') + '\n\n' + currentShareUrl)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentShareUrl)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentShareUrl)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentShareUrl)}&text=${encodeURIComponent(story?.title || '')}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(currentShareUrl)}&text=${encodeURIComponent(story?.title || '')}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(story?.title || '')}&body=${encodeURIComponent((story?.excerpt || '') + '\n\n' + currentShareUrl)}`;

  const renderShareBar = (label?: string) => (
    <div className="story-share-container">
      {label && <p className="story-share-label">{label}</p>}
      <div className="story-share-bar">
        {/* Botão de Partilha Geral (Abre todas as redes / share nativo) */}
        <button
          type="button"
          onClick={handleShareAll}
          className="share-pill-btn share-pill-primary"
          title="Partilhar em todas as redes"
        >
          <Share2 size={15} />
          <span>Partilhar</span>
        </button>

        {/* WhatsApp Direto */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="share-pill-btn share-pill-whatsapp"
          title="Partilhar no WhatsApp"
        >
          <MessageCircle size={15} />
          <span>WhatsApp</span>
        </a>

        {/* Botão Dedicado Copiar Link */}
        <button
          type="button"
          onClick={handleCopyLink}
          className={`share-pill-btn share-pill-copy${copied ? ' copied' : ''}`}
          title="Copiar link da história"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? 'Link copiado!' : 'Copiar link'}</span>
        </button>

        {/* Redes Rápidas */}
        <a
          href={linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="share-icon-btn li"
          title="Partilhar no LinkedIn"
          aria-label="Partilhar no LinkedIn"
        >
          <Linkedin size={15} />
        </a>

        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="share-icon-btn fb"
          title="Partilhar no Facebook"
          aria-label="Partilhar no Facebook"
        >
          <Facebook size={15} />
        </a>

        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="share-icon-btn tw"
          title="Partilhar no X (Twitter)"
          aria-label="Partilhar no X"
        >
          <Twitter size={15} />
        </a>

        <a
          href={telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="share-icon-btn tg"
          title="Partilhar no Telegram"
          aria-label="Partilhar no Telegram"
        >
          <Send size={14} />
        </a>
      </div>
    </div>
  );



  return (
    <>
      <style>{`
        .story-page { font-family: 'Poppins', sans-serif; background: #f8fafc; min-height: 100vh; }

        /* ── Top Announcement Bar (estilo Kabum com cores WEHOSTHERE) ── */
        .story-top-bar {
          background: linear-gradient(90deg, #3C096C 0%, #5A189A 50%, #7B2CBF 100%);
          color: #ffffff;
          padding: 0.45rem 1rem;
          font-size: 0.8rem;
          font-weight: 500;
          position: relative;
          z-index: 55;
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
        }
        .story-top-bar-inner {
          max-width: 1100px; margin: 0 auto;
          display: flex; align-items: center; justify-content: center;
          gap: 0.75rem; flex-wrap: wrap; text-align: center;
        }
        .story-top-bar-badge {
          background: rgba(255, 255, 255, 0.22);
          color: #ffffff;
          font-size: 0.68rem; font-weight: 800;
          letter-spacing: 0.06em;
          padding: 0.12rem 0.6rem;
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.35);
          text-transform: uppercase;
        }
        .story-top-bar-link {
          color: #ffffff;
          text-decoration: none;
          display: inline-flex; align-items: center; gap: 0.35rem;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.15);
          padding: 0.15rem 0.7rem;
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.25);
          transition: all 0.2s;
        }
        .story-top-bar-link:hover {
          background: #ffffff;
          color: #5A189A;
          transform: translateX(2px);
        }

        /* ── Sticky Header (Barra Roxa + Navbar) ── */
        .story-sticky-header {
          position: sticky;
          top: 0;
          z-index: 100;
          width: 100%;
        }
        .story-nav {
          background: #fff; border-bottom: 1px solid #e2e8f0;
        }
        .story-nav-inner {
          max-width: 1100px; margin: 0 auto; padding: 0 2rem;
          height: 64px; display: flex; align-items: center; justify-content: space-between;
          gap: 1rem;
        }
        .story-nav-left {
          display: flex; align-items: center; gap: 0.75rem;
        }
        .story-nav-home {
          display: inline-flex; align-items: center; gap: 0.35rem;
          text-decoration: none;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 0.3rem 0.65rem;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .story-nav-home:hover {
          background: #FAF5FF;
          border-color: #E0AAFF;
        }
        .story-nav-home-logo {
          font-size: 0.72rem; font-weight: 800; color: #0f172a;
          letter-spacing: -0.02em; line-height: 1;
          white-space: nowrap;
        }
        .story-nav-home-logo span { color: #7B2CBF; }
        .story-nav-divider {
          width: 1px; height: 22px; background: #e2e8f0; flex-shrink: 0;
        }
        .story-nav-brand {
          display: flex; align-items: center; gap: 0.5rem; text-decoration: none;
        }
        .story-nav-brand-text {
          font-size: 1.05rem; font-weight: 800; color: #0f172a; letter-spacing: -0.04em;
        }
        .story-nav-brand-text span { color: #7B2CBF; }

        /* ── Breadcrumb ── */
        .breadcrumb {
          max-width: 760px; margin: 0 auto;
          padding: 1.25rem 2rem 0;
          display: flex; align-items: center; gap: 0.4rem;
          font-size: 0.78rem; color: #94a3b8;
        }
        .breadcrumb a { color: #94a3b8; text-decoration: none; transition: color 0.2s; }
        .breadcrumb a:hover { color: #7B2CBF; }
        .breadcrumb-sep { font-size: 0.7rem; }

        /* ── Article ── */
        .story-article {
          max-width: 760px; margin: 0 auto; padding: 0 2rem 4rem;
        }
        .story-cat {
          font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; margin-top: 1.5rem; margin-bottom: 0.75rem;
          display: block;
        }
        .story-title {
          font-size: 2.2rem; font-weight: 800; color: #0f172a;
          line-height: 1.2; letter-spacing: -0.03em;
          margin-bottom: 1.25rem;
        }
        .story-typing-cursor {
          display: inline-block;
          width: 3px;
          height: 0.95em;
          background: #7B2CBF;
          margin-left: 4px;
          vertical-align: -0.08em;
          border-radius: 1px;
          animation: storyCursorBlink 0.8s infinite;
        }
        .story-typing-cursor.complete {
          animation: storyCursorBlink 0.8s 4 ease-in-out forwards;
        }
        @keyframes storyCursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .story-meta {
          display: flex; align-items: center; gap: 1rem;
          font-size: 0.8rem; color: #64748b; margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }
        .story-author-row { display: flex; align-items: center; gap: 0.5rem; }
        .story-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          background: #7B2CBF; color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 0.72rem; overflow: hidden; flex-shrink: 0;
        }
        .story-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .story-meta-sep { color: #cbd5e1; }
        .story-meta-item { display: flex; align-items: center; gap: 0.3rem; }

        /* ── Social Share Bar ── */
        .story-share-container {
          margin-bottom: 2rem;
        }
        .story-share-bar {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          flex-wrap: wrap;
        }
        .share-pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.48rem 0.95rem;
          border-radius: 9999px;
          font-size: 0.8rem;
          font-weight: 600;
          font-family: inherit;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #334155;
          user-select: none;
        }
        .share-pill-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.08);
        }
        .share-pill-primary {
          background: linear-gradient(135deg, #7B2CBF, #5A189A);
          color: #ffffff;
          border: none;
          box-shadow: 0 4px 14px -3px rgba(123, 44, 191, 0.4);
        }
        .share-pill-primary:hover {
          background: linear-gradient(135deg, #9D4EDD, #7B2CBF);
          color: #ffffff;
        }
        .share-pill-whatsapp {
          color: #15803d;
          background: #f0fdf4;
          border-color: #bbf7d0;
        }
        .share-pill-whatsapp:hover {
          background: #22c55e;
          color: #ffffff;
          border-color: #22c55e;
        }
        .share-pill-copy {
          background: #f8fafc;
        }
        .share-pill-copy.copied {
          background: #ecfdf5;
          border-color: #a7f3d0;
          color: #059669;
          font-weight: 700;
        }
        .share-icon-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 35px;
          height: 35px;
          border-radius: 50%;
          background: #ffffff;
          color: #475569;
          border: 1px solid #e2e8f0;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .share-icon-btn:hover {
          transform: translateY(-2px);
          color: #fff;
        }
        .share-icon-btn.fb:hover { background: #1877F2; border-color: #1877F2; }
        .share-icon-btn.li:hover { background: #0A66C2; border-color: #0A66C2; }
        .share-icon-btn.tw:hover { background: #000000; border-color: #000000; }
        .share-icon-btn.tg:hover { background: #229ED9; border-color: #229ED9; }

        /* ── Share Modal ── */
        .share-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 99998;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          animation: shareModalFade 0.2s ease-out;
        }
        @keyframes shareModalFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .share-modal-card {
          background: #ffffff;
          border-radius: 20px;
          max-width: 460px;
          width: 100%;
          padding: 1.75rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          border: 1px solid #e2e8f0;
          animation: shareModalZoom 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes shareModalZoom {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .share-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }
        .share-modal-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }
        .share-modal-close {
          background: #f1f5f9;
          border: none;
          color: #64748b;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .share-modal-close:hover {
          background: #e2e8f0;
          color: #0f172a;
        }
        .share-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }
        .share-grid-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.45rem;
          padding: 0.85rem 0.5rem;
          border-radius: 12px;
          border: 1px solid #f1f5f9;
          background: #f8fafc;
          text-decoration: none;
          color: #334155;
          font-size: 0.76rem;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        .share-grid-item:hover {
          background: #FAF5FF;
          border-color: #E0AAFF;
          transform: translateY(-2px);
          color: #7B2CBF;
        }
        .share-grid-icon {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
        }
        .share-link-input-row {
          display: flex;
          gap: 0.5rem;
          background: #f8fafc;
          padding: 0.35rem 0.35rem 0.35rem 0.85rem;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          align-items: center;
        }
        .share-link-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-size: 0.8rem;
          color: #475569;
          font-family: inherit;
        }
        .share-link-copy-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: #7B2CBF;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          padding: 0.45rem 0.85rem;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .share-link-copy-btn:hover {
          background: #5A189A;
        }
        .share-link-copy-btn.copied {
          background: #10b981;
        }

        /* Cover image */
        .story-cover {
          width: 100%; aspect-ratio: 16/9; border-radius: 14px;
          overflow: hidden; margin-bottom: 2.5rem;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.04);
          position: relative;
        }
        .story-cover.clickable {
          cursor: zoom-in;
        }
        .story-cover-badge {
          position: absolute;
          bottom: 12px;
          right: 12px;
          background: rgba(15, 23, 42, 0.75);
          color: #ffffff;
          backdrop-filter: blur(8px);
          font-size: 0.72rem;
          font-weight: 600;
          padding: 0.35rem 0.65rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          opacity: 0;
          transform: translateY(4px);
          transition: all 0.2s ease;
          pointer-events: none;
        }
        .story-cover:hover .story-cover-badge {
          opacity: 1;
          transform: translateY(0);
        }
        .story-cover img {
          width: 100%; height: 100%;
          object-fit: contain;
          padding: 1.5rem;
          display: block;
          transition: transform 0.25s ease;
        }
        .story-cover.clickable:hover img {
          transform: scale(1.02);
        }
        @media (max-width: 640px) {
          .story-cover img { padding: 0.75rem; }
          .story-cover-badge { opacity: 0.9; transform: none; font-size: 0.68rem; padding: 0.25rem 0.5rem; }
        }
        .story-cover-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #10002B, #3C096C);
        }

        /* ── Lightbox / Fullscreen Modal ── */
        .lightbox-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: rgba(10, 10, 15, 0.92);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          animation: lightboxFadeIn 0.22s ease-out;
          cursor: zoom-out;
        }
        @keyframes lightboxFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .lightbox-close {
          position: fixed;
          top: 1.25rem;
          right: 1.25rem;
          z-index: 100000;
          background: rgba(255, 255, 255, 0.14);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 9999px;
          height: 40px;
          padding: 0 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .lightbox-close:hover {
          background: #7B2CBF;
          border-color: #7B2CBF;
          transform: scale(1.05);
        }
        .lightbox-esc-hint {
          font-size: 0.7rem;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.2);
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          letter-spacing: 0.05em;
        }
        .lightbox-content {
          max-width: 92vw;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          animation: lightboxZoomIn 0.26s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: default;
        }
        @keyframes lightboxZoomIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
        .lightbox-img {
          max-width: 90vw;
          max-height: 82vh;
          object-fit: contain;
          border-radius: 12px;
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.85);
          background: #ffffff;
          padding: 1.25rem;
        }
        .lightbox-caption {
          margin-top: 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          color: rgba(255, 255, 255, 0.85);
          font-size: 0.85rem;
          font-weight: 500;
          max-width: 90vw;
          text-align: center;
        }
        .lightbox-close-text {
          background: none;
          border: none;
          color: #E0AAFF;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          transition: all 0.2s;
          font-family: inherit;
        }
        .lightbox-close-text:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }

        /* Author card */
        .story-author-card {
          display: flex; align-items: center; gap: 0.75rem;
          margin-bottom: 2.5rem; padding: 1rem 1.25rem;
          background: #fff; border-radius: 10px; border: 1px solid #e2e8f0;
        }
        .story-author-card-avatar {
          width: 44px; height: 44px; border-radius: 50%;
          background: linear-gradient(135deg, #7B2CBF, #5A189A);
          color: #fff; display: flex; align-items: center;
          justify-content: center; font-weight: 800; font-size: 1rem;
          flex-shrink: 0; overflow: hidden;
        }
        .story-author-card-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .story-author-card-name { font-weight: 700; font-size: 0.88rem; color: #0f172a; }
        .story-author-card-bio { font-size: 0.78rem; color: #64748b; margin-top: 0.15rem; }
        .story-author-links {
          display: flex; align-items: center; gap: 0.5rem;
          margin-top: 0.45rem; flex-wrap: wrap;
        }
        .story-author-link {
          display: inline-flex; align-items: center; gap: 0.3rem;
          font-size: 0.73rem; font-weight: 600; color: #7B2CBF;
          text-decoration: none; background: #FAF5FF;
          border: 1px solid #E0AAFF; padding: 0.2rem 0.55rem;
          border-radius: 9999px; transition: all 0.2s;
        }
        .story-author-link:hover {
          background: #7B2CBF; color: #fff; border-color: #7B2CBF;
        }
        .story-author-link-icon {
          display: inline-flex; align-items: center; justify-content: center;
          width: 26px; height: 26px; border-radius: 50%;
          background: #FAF5FF; color: #7B2CBF;
          border: 1px solid #E0AAFF; transition: all 0.2s;
        }
        .story-author-link-icon:hover {
          background: #7B2CBF; color: #fff; border-color: #7B2CBF;
          transform: translateY(-1px);
        }

        /* Content */
        .content-p {
          font-size: 1rem; line-height: 1.8; color: #334155; margin-bottom: 1.25rem;
        }
        .content-h2 {
          font-size: 1.35rem; font-weight: 800; color: #0f172a;
          margin: 2.25rem 0 0.75rem; letter-spacing: -0.02em;
        }
        .content-h3 {
          font-size: 1.1rem; font-weight: 700; color: #0f172a;
          margin: 1.75rem 0 0.5rem;
        }
        .content-list {
          padding-left: 1.5rem; margin-bottom: 1.25rem;
        }
        .content-list li {
          font-size: 1rem; line-height: 1.75; color: #334155; margin-bottom: 0.3rem;
        }
        .pull-quote {
          border-left: 4px solid #7B2CBF;
          background: #FAF5FF;
          padding: 1rem 1.5rem;
          margin: 2rem 0;
          border-radius: 0 8px 8px 0;
          font-size: 1.1rem; font-weight: 600;
          color: #0f172a; font-style: italic;
          line-height: 1.6;
        }

        /* Tags */
        .story-tags { display: flex; gap: 0.5rem; flex-wrap: wrap; margin: 2.5rem 0 1.5rem; }
        .story-tag {
          font-size: 0.72rem; font-weight: 600; padding: 0.25rem 0.75rem;
          border-radius: 9999px; background: #F3E8FF; color: #5A189A;
          border: 1px solid #E0AAFF;
        }

        /* Share bottom */
        .story-share-bottom {
          border-top: 1px solid #e2e8f0; padding-top: 1.5rem;
          margin-top: 1.5rem;
        }
        .story-share-label { font-size: 0.78rem; font-weight: 600; color: #94a3b8; margin-bottom: 0.75rem; }

        /* Newsletter */
        .story-nl {
          background: linear-gradient(135deg, #5A189A 0%, #7B2CBF 100%);
          border-radius: 14px; padding: 2rem; color: #fff;
          margin-top: 3rem; text-align: center;
        }
        .story-nl h3 { font-size: 1.15rem; font-weight: 800; margin-bottom: 0.4rem; }
        .story-nl p { font-size: 0.85rem; color: rgba(255,255,255,0.85); margin-bottom: 1.25rem; }
        .story-nl-row { display: flex; gap: 0.5rem; max-width: 420px; margin: 0 auto; }
        .story-nl-row input {
          flex: 1; padding: 0.6rem 1rem; border-radius: 8px; border: none;
          font-family: 'Poppins', sans-serif; font-size: 0.83rem; outline: none;
        }
        .story-nl-row button {
          padding: 0.6rem 1.2rem; background: #9D4EDD; color: #fff;
          border: none; border-radius: 8px; font-family: 'Poppins', sans-serif;
          font-weight: 600; font-size: 0.83rem; cursor: pointer; white-space: nowrap;
          transition: background 0.2s;
        }
        .story-nl-row button:hover { background: #C77DFF; }

        /* Related */
        .related-section {
          max-width: 760px; margin: 0 auto; padding: 0 2rem 4rem;
        }
        .related-title { font-size: 0.78rem; font-weight: 700; color: #64748b; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 1.25rem; }
        .related-card {
          display: grid; grid-template-columns: 100px 1fr; gap: 1rem;
          padding: 0.85rem 0; border-bottom: 1px solid #f1f5f9;
          text-decoration: none; transition: opacity 0.2s;
        }
        .related-card:hover { opacity: 0.8; }
        .related-card:last-child { border-bottom: none; }
        .related-img {
          border-radius: 8px; overflow: hidden; aspect-ratio: 4/3;
          background: linear-gradient(135deg, #10002B, #5A189A);
        }
        .related-img img { width: 100%; height: 100%; object-fit: cover; }
        .related-cat { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
        .related-t { font-size: 0.88rem; font-weight: 700; color: #0f172a; line-height: 1.3; margin-top: 0.2rem; }
        .related-meta { font-size: 0.7rem; color: #94a3b8; margin-top: 0.3rem; display: flex; align-items: center; gap: 0.5rem; }

        /* ── Prev / Next Story Navigation ── */
        .story-adjacent-nav {
          max-width: 760px;
          margin: 0 auto;
          padding: 2rem 1.5rem 0.5rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .story-adjacent-nav.only-next {
          grid-template-columns: 1fr;
          justify-items: end;
        }
        .story-adjacent-nav.only-prev {
          grid-template-columns: 1fr;
          justify-items: start;
        }
        .adj-card {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 1.1rem 1.25rem;
          text-decoration: none;
          width: 100%;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          position: relative;
          overflow: hidden;
        }
        .adj-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(135deg, rgba(123,44,191,0.06) 0%, transparent 60%);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .adj-card:hover {
          border-color: rgba(123, 44, 191, 0.35);
          box-shadow: 0 8px 24px rgba(123, 44, 191, 0.14);
          transform: translateY(-2px);
        }
        .adj-card:hover::before { opacity: 1; }
        .adj-card.adj-next { align-items: flex-end; text-align: right; }
        .adj-card.adj-prev { align-items: flex-start; text-align: left; }
        .adj-direction {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #94a3b8;
        }
        .adj-title {
          font-size: 0.9rem;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.35;
          max-width: 260px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .adj-meta {
          font-size: 0.72rem;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .adj-card.adj-next .adj-meta { justify-content: flex-end; }
        .adj-card.adj-prev .adj-meta { justify-content: flex-start; }
        .adj-cover {
          width: 100%;
          height: 80px;
          border-radius: 10px;
          object-fit: cover;
          opacity: 0.85;
          margin-bottom: 0.15rem;
        }
        .adj-nav-arrow {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px; height: 28px;
          border-radius: 50%;
          background: rgba(123,44,191,0.1);
          color: #7B2CBF;
          flex-shrink: 0;
          transition: background 0.2s, transform 0.2s;
        }
        .adj-card:hover .adj-nav-arrow {
          background: #7B2CBF;
          color: #fff;
        }
        .adj-card.adj-next:hover .adj-nav-arrow { transform: translateX(3px); }
        .adj-card.adj-prev:hover .adj-nav-arrow { transform: translateX(-3px); }
        @media (max-width: 600px) {
          .story-adjacent-nav {
            grid-template-columns: 1fr;
            padding: 1.5rem 1rem 0.5rem;
          }
          .story-adjacent-nav.only-next,
          .story-adjacent-nav.only-prev {
            grid-template-columns: 1fr;
            justify-items: stretch;
          }
          .adj-card.adj-next { align-items: flex-start; text-align: left; }
          .adj-card.adj-next .adj-meta { justify-content: flex-start; }
          .adj-title { max-width: 100%; }
        }

        /* ── Dynamic Processing Loader ── */
        .story-loader-wrapper {
          max-width: 820px;
          margin: 0 auto;
          padding: 2.5rem 1.5rem 5rem;
          font-family: 'Poppins', sans-serif;
        }
        .story-loader-card {
          position: relative;
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid rgba(123, 44, 191, 0.12);
          box-shadow: 0 10px 40px rgba(123, 44, 191, 0.08);
          padding: 3.5rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          overflow: hidden;
        }
        .story-loader-orb {
          position: absolute;
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 340px;
          height: 340px;
          background: radial-gradient(circle, rgba(157, 78, 221, 0.15) 0%, rgba(123, 44, 191, 0.05) 50%, transparent 70%);
          filter: blur(28px);
          pointer-events: none;
          z-index: 0;
          animation: pulseOrb 3s ease-in-out infinite;
        }
        @keyframes pulseOrb {
          0%, 100% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.6; }
          50% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
        }

        .story-spinner-box {
          position: relative;
          width: 92px;
          height: 92px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.8rem;
          z-index: 1;
        }
        .story-spinner-ring-outer {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 3.5px solid transparent;
          border-top-color: #7B2CBF;
          border-right-color: #9D4EDD;
          border-bottom-color: #E0AAFF;
          animation: spinOuter 1.1s cubic-bezier(0.55, 0.15, 0.45, 0.85) infinite;
          filter: drop-shadow(0 0 10px rgba(123, 44, 191, 0.4));
        }
        @keyframes spinOuter {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .story-spinner-ring-inner {
          position: absolute;
          inset: 8px;
          border-radius: 50%;
          border: 2px dashed rgba(123, 44, 191, 0.35);
          animation: spinInner 2.2s linear infinite reverse;
        }
        @keyframes spinInner {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .story-spinner-center {
          position: relative;
          z-index: 2;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #fbf7ff;
          border: 1px solid rgba(123, 44, 191, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(123, 44, 191, 0.18);
          animation: pulseCenter 2s ease-in-out infinite;
        }
        @keyframes pulseCenter {
          0%, 100% { transform: scale(1); box-shadow: 0 4px 16px rgba(123, 44, 191, 0.18); }
          50% { transform: scale(1.08); box-shadow: 0 6px 24px rgba(157, 78, 221, 0.35); }
        }

        .story-loader-badge {
          position: relative;
          z-index: 1;
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          background: rgba(123, 44, 191, 0.08);
          border: 1px solid rgba(123, 44, 191, 0.22);
          padding: 0.32rem 0.9rem;
          border-radius: 9999px;
          font-size: 0.72rem;
          font-weight: 700;
          color: #7B2CBF;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 0.8rem;
        }
        .story-loader-badge-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #7B2CBF;
          box-shadow: 0 0 8px #7B2CBF;
          animation: blinkDot 1.2s ease-in-out infinite;
        }
        @keyframes blinkDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }

        .story-loader-title {
          position: relative;
          z-index: 1;
          font-size: 1.45rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
          margin-bottom: 0.4rem;
        }
        .story-loader-dots span {
          display: inline-block;
          color: #7B2CBF;
          animation: dotWave 1.4s infinite;
          font-weight: 900;
        }
        .story-loader-dots span:nth-child(2) { animation-delay: 0.2s; }
        .story-loader-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes dotWave {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.3; }
          30% { transform: translateY(-4px); opacity: 1; }
        }

        .story-loader-subtitle {
          position: relative;
          z-index: 1;
          font-size: 0.88rem;
          color: #64748b;
          max-width: 440px;
          margin-bottom: 1.8rem;
          line-height: 1.5;
        }

        .story-loader-bar-wrap {
          position: relative;
          z-index: 1;
          width: 240px;
          height: 5px;
          background: rgba(123, 44, 191, 0.1);
          border-radius: 9999px;
          overflow: hidden;
          margin-bottom: 2.8rem;
        }
        .story-loader-bar-shimmer {
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          width: 40%;
          background: linear-gradient(90deg, #7B2CBF 0%, #9D4EDD 50%, #C77DFF 100%);
          border-radius: 9999px;
          box-shadow: 0 0 10px rgba(123, 44, 191, 0.6);
          animation: barSlide 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @keyframes barSlide {
          0% { transform: translateX(-100%); width: 25%; }
          50% { width: 55%; }
          100% { transform: translateX(380%); width: 25%; }
        }

        .story-loader-skeleton-preview {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 680px;
          padding-top: 1.8rem;
          border-top: 1px dashed rgba(123, 44, 191, 0.15);
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
          align-items: center;
        }
        .story-skel-line {
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: skeletonShimmer 1.8s infinite;
          border-radius: 6px;
          height: 12px;
        }
        .story-skel-cat {
          width: 90px;
          height: 22px;
          border-radius: 9999px;
          background: linear-gradient(90deg, rgba(123, 44, 191, 0.1) 25%, rgba(157, 78, 221, 0.2) 50%, rgba(123, 44, 191, 0.1) 75%);
          background-size: 200% 100%;
          animation: skeletonShimmer 1.8s infinite;
        }
        .story-skel-title-1 {
          width: 82%;
          height: 26px;
          border-radius: 8px;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: skeletonShimmer 1.8s infinite;
        }
        .story-skel-title-2 {
          width: 58%;
          height: 26px;
          border-radius: 8px;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: skeletonShimmer 1.8s infinite;
        }
        .story-skel-meta-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.8rem;
          margin-top: 0.4rem;
        }
        .story-skel-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: skeletonShimmer 1.8s infinite;
        }
        .story-skel-cover {
          width: 100%;
          height: 200px;
          border-radius: 14px;
          margin-top: 0.6rem;
          background: linear-gradient(90deg, #f1f5f9 25%, #e8edf4 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: skeletonShimmer 1.8s infinite;
          border: 1px solid rgba(226, 232, 240, 0.8);
        }
        @keyframes skeletonShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .revista-spinner {
          width: 36px; height: 36px;
          border: 3px solid #E0AAFF; border-top-color: #7B2CBF;
          border-radius: 50%; animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Back link (always visible) */
        .story-nav-back-link {
          display: flex; align-items: center; gap: 0.3rem;
          font-size: 0.82rem; color: #475569; text-decoration: none;
          font-weight: 500; white-space: nowrap;
          transition: color 0.2s;
        }
        .story-nav-back-link:hover { color: #7B2CBF; }

        @media (max-width: 640px) {
          .story-top-bar { padding: 0.4rem 0.75rem; font-size: 0.74rem; }
          .story-top-bar-inner { gap: 0.45rem; justify-content: center; }
          .story-top-bar-link { font-size: 0.72rem; padding: 0.15rem 0.6rem; }
          .story-nav-inner { padding: 0 0.85rem; height: 56px; }
          .story-nav-brand-text { font-size: 0.82rem; }
          .story-nav-home-logo { font-size: 0.65rem; }
          .story-nav-back-text { display: none; }
          .story-title { font-size: 1.45rem; }
          .breadcrumb { padding: 0.75rem 1rem 0; font-size: 0.72rem; }
          .story-article { padding: 0 1rem 3rem; }
          .related-section { padding: 0 1rem 3rem; }
          .story-nl-row { flex-direction: column; }
          .pull-quote { padding: 0.75rem 1rem; font-size: 1rem; }
        }
        @media (max-width: 400px) {
          .story-top-bar-text { display: none; }
          .story-nav-brand-text { display: none; }
          .story-title { font-size: 1.3rem; }
        }
      `}</style>

      <div className="story-page">
        {/* ── Sticky Header: Barra Roxa que acompanha o scroll + Navbar ── */}
        <header className="story-sticky-header">
          {/* ── Top Announcement Bar (Kabum style com cores WEHOSTHERE) ── */}
          <div className="story-top-bar">
            <div className="story-top-bar-inner">
              <span className="story-top-bar-badge">ED. 01</span>
              <span className="story-top-bar-text">Descarrega a nova edição da revista</span>
              <a
                href="/api/revista/download"
                className="story-top-bar-link"
                download="Codando-Historias-Edicao-01.pdf"
                title="Descarregar PDF da revista em alta resolução"
              >
                <Download size={13} />
                <span>Descarregar PDF →</span>
              </a>
            </div>
          </div>

          {/* ── Navbar ── */}
          <nav className="story-nav">
          <div className="story-nav-inner">
            {/* Left: WEHOSTHERE home logo + revista brand */}
            <div className="story-nav-left">
              <Link href="/" className="story-nav-home" title="Ir para a página inicial WEHOSTHERE">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7B2CBF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span className="story-nav-home-logo">WEHOST<span>HERE</span></span>
              </Link>
              <span className="story-nav-divider" aria-hidden="true" />
              <Link href="/revista" className="story-nav-brand">
                <Code2 size={18} color="#7B2CBF" />
                <span className="story-nav-brand-text">
                  codando <span>histórias</span> <span style={{ color: '#7B2CBF', fontFamily: 'monospace', fontWeight: 800 }}>&lt;/&gt;</span>
                </span>
              </Link>
            </div>
            {/* Right: back link */}
            <Link href="/revista" className="story-nav-back-link">
              <ArrowLeft size={15} /> <span className="story-nav-back-text">Todas as histórias</span>
            </Link>
          </div>
        </nav>
        </header>

        {loading ? (
          <>
            <div className="breadcrumb">
              <Link href="/">WEHOSTHERE</Link>
              <ChevronRight size={12} className="breadcrumb-sep" />
              <Link href="/revista">Codando Histórias</Link>
              <ChevronRight size={12} className="breadcrumb-sep" />
              <span style={{ color: '#7B2CBF', fontWeight: 600 }}>A processar...</span>
            </div>

            <div className="story-loader-wrapper">
              <div className="story-loader-card">
                <div className="story-loader-orb" />

                <div className="story-spinner-box">
                  <div className="story-spinner-ring-outer" />
                  <div className="story-spinner-ring-inner" />
                  <div className="story-spinner-center">
                    <Code2 size={24} color="#7B2CBF" strokeWidth={2.5} />
                  </div>
                </div>

                <div className="story-loader-badge">
                  <span className="story-loader-badge-dot" />
                  <span>A PROCESSAR HISTÓRIA</span>
                  <span style={{ fontFamily: 'monospace', color: '#7B2CBF', fontWeight: 800 }}>&lt;/&gt;</span>
                </div>

                <h2 className="story-loader-title">
                  A compilar a história<span className="story-loader-dots"><span>.</span><span>.</span><span>.</span></span>
                </h2>

                <p className="story-loader-subtitle">
                  A carregar linhas de código, reflexões e conteúdo exclusivo da revista
                </p>

                <div className="story-loader-bar-wrap">
                  <div className="story-loader-bar-shimmer" />
                </div>

                {/* Wireframe skeleton mockup */}
                <div className="story-loader-skeleton-preview" aria-hidden="true">
                  <div className="story-skel-cat" />
                  <div className="story-skel-title-1" />
                  <div className="story-skel-title-2" />
                  <div className="story-skel-meta-row">
                    <div className="story-skel-avatar" />
                    <div className="story-skel-line" style={{ width: '110px' }} />
                    <div className="story-skel-line" style={{ width: '70px' }} />
                    <div className="story-skel-line" style={{ width: '85px' }} />
                  </div>
                  <div className="story-skel-cover" />
                </div>
              </div>
            </div>
          </>
        ) : notFound || !story ? (
          <div style={{ textAlign: 'center', padding: '6rem 2rem', fontFamily: 'Poppins, sans-serif' }}>
            <Code2 size={48} color="#7B2CBF" style={{ margin: '0 auto 1rem' }} />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
              História não encontrada
            </h1>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Esta história não existe ou foi removida.</p>
            <Link href="/revista" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              background: '#7B2CBF', color: '#fff', padding: '0.6rem 1.4rem',
              borderRadius: '8px', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 600,
            }}>
              <ArrowLeft size={15} /> Voltar à Revista
            </Link>
          </div>
        ) : (
          <>
            {/* ── Breadcrumb ── */}
        <div className="breadcrumb">
          <Link href="/">WEHOSTHERE</Link>
          <ChevronRight size={12} className="breadcrumb-sep" />
          <Link href="/revista">Codando Histórias</Link>
          <ChevronRight size={12} className="breadcrumb-sep" />
          <span style={{ color: '#475569' }}>{story.category}</span>
        </div>

        {/* ── Article ── */}
        <article className="story-article">
          <span
            className="story-cat"
            style={{ color: CAT_COLORS[story.category] || '#7B2CBF' }}
          >
            {story.category}
          </span>

          <h1 className="story-title">
            <TypedTitle title={story.title} highlight={story.highlightText} speed={25} />
          </h1>

          {/* Meta */}
          <div className="story-meta">
            <div className="story-author-row">
              <div className="story-avatar">
                {story.author?.avatar
                  ? <img src={story.author.avatar} alt={story.author.name} />
                  : story.author?.name?.[0]?.toUpperCase()
                }
              </div>
              <span>{story.author?.name}</span>
            </div>
            <span className="story-meta-sep">·</span>
            {story.publishedAt && (
              <span className="story-meta-item">
                <Calendar size={13} /> {formatDate(story.publishedAt)}
              </span>
            )}
            {story.readingTime && (
              <span className="story-meta-item">
                <Clock size={13} /> {story.readingTime} min de leitura
              </span>
            )}
            <span className="story-meta-item">
              <Eye size={13} /> {story.views} leituras
            </span>
          </div>

          {/* Socials / Partilha */}
          {renderShareBar()}

          {/* Cover */}
          <div
            className={`story-cover${story.coverImage ? ' clickable' : ''}`}
            onClick={() => story.coverImage && setLightboxOpen(true)}
            role={story.coverImage ? 'button' : undefined}
            tabIndex={story.coverImage ? 0 : undefined}
            onKeyDown={(e) => {
              if (story.coverImage && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                setLightboxOpen(true);
              }
            }}
            title={story.coverImage ? 'Clique para ver em tela cheia' : undefined}
          >
            {story.coverImage ? (
              <>
                <img src={story.coverImage} alt={story.title} />
                <div className="story-cover-badge">
                  <Maximize2 size={13} />
                  <span>Ver em tela cheia</span>
                </div>
              </>
            ) : (
              <div className="story-cover-placeholder">
                <Code2 size={72} color="rgba(255,255,255,0.1)" />
              </div>
            )}
          </div>

          {/* Author card */}
          <div className="story-author-card">
            <div className="story-author-card-avatar">
              {story.author?.avatar
                ? <img src={story.author.avatar} alt={story.author.name} />
                : story.author?.name?.[0]?.toUpperCase()
              }
            </div>
            <div style={{ flex: 1 }}>
              <div className="story-author-card-name">{story.author?.name}</div>
              {story.author?.bio && (
                <div className="story-author-card-bio">{story.author.bio}</div>
              )}
              {(story.author?.website || story.author?.socials?.github || story.author?.socials?.linkedin || story.author?.socials?.twitter || story.author?.socials?.instagram) && (
                <div className="story-author-links">
                  {story.author.website && (
                    <a
                      href={formatSocialUrl('website', story.author.website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="story-author-link"
                      title="Visitar Website"
                    >
                      <Globe size={12} />
                      <span>Website</span>
                    </a>
                  )}
                  {story.author.socials?.github && (
                    <a
                      href={formatSocialUrl('github', story.author.socials.github)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="story-author-link-icon"
                      title="GitHub"
                      aria-label="GitHub do autor"
                    >
                      <Github size={13} />
                    </a>
                  )}
                  {story.author.socials?.linkedin && (
                    <a
                      href={formatSocialUrl('linkedin', story.author.socials.linkedin)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="story-author-link-icon"
                      title="LinkedIn"
                      aria-label="LinkedIn do autor"
                    >
                      <Linkedin size={13} />
                    </a>
                  )}
                  {story.author.socials?.twitter && (
                    <a
                      href={formatSocialUrl('twitter', story.author.socials.twitter)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="story-author-link-icon"
                      title="Twitter / X"
                      aria-label="Twitter / X do autor"
                    >
                      <Twitter size={13} />
                    </a>
                  )}
                  {story.author.socials?.instagram && (
                    <a
                      href={formatSocialUrl('instagram', story.author.socials.instagram)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="story-author-link-icon"
                      title="Instagram"
                      aria-label="Instagram do autor"
                    >
                      <Instagram size={13} />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="story-content">
            {renderContent(story.content)}
          </div>

          {/* Tags */}
          {story.tags?.length > 0 && (
            <div className="story-tags">
              {story.tags.map(tag => (
                <span key={tag} className="story-tag">#{tag}</span>
              ))}
            </div>
          )}

          {/* Share bottom */}
          <div className="story-share-bottom">
            {renderShareBar('PARTILHAR ESTA HISTÓRIA')}
          </div>

          {/* Newsletter */}
          <div className="story-nl">
            <h3>📬 Receba a próxima história</h3>
            <p>Subscreva a newsletter e seja o primeiro a ler as nossas histórias de tech em Moçambique.</p>
            <div className="story-nl-row">
              <input
                type="email"
                placeholder="o-teu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <button>Subscrever</button>
            </div>
          </div>
        </article>

        {/* ── Prev / Next Story Navigation ── */}
        {(prevStory || nextStory) && (
          <nav
            className={`story-adjacent-nav${
              !prevStory ? ' only-next' : !nextStory ? ' only-prev' : ''
            }`}
            aria-label="Navegar entre histórias"
          >
            {/* ← Anterior (mais antiga na lista) */}
            {prevStory && (
              <Link href={`/revista/${prevStory.slug}`} className="adj-card adj-prev">
                {prevStory.coverImage && (
                  <img src={prevStory.coverImage} alt={prevStory.title} className="adj-cover" />
                )}
                <span className="adj-direction">
                  <ArrowLeft size={12} />
                  História anterior
                </span>
                <span className="adj-title">{prevStory.title}</span>
                <div className="adj-meta">
                  <span className="adj-nav-arrow"><ArrowLeft size={13} /></span>
                  <span>{prevStory.author?.name}</span>
                  {prevStory.readingTime && <><span>·</span><span><Clock size={11} /> {prevStory.readingTime} min</span></>}
                </div>
              </Link>
            )}

            {/* → Próxima (mais recente na lista) */}
            {nextStory && (
              <Link href={`/revista/${nextStory.slug}`} className="adj-card adj-next">
                {nextStory.coverImage && (
                  <img src={nextStory.coverImage} alt={nextStory.title} className="adj-cover" />
                )}
                <span className="adj-direction">
                  Próxima história
                  <ChevronRight size={12} />
                </span>
                <span className="adj-title">{nextStory.title}</span>
                <div className="adj-meta">
                  <span>{nextStory.author?.name}</span>
                  {nextStory.readingTime && <><span>·</span><span><Clock size={11} /> {nextStory.readingTime} min</span></>}
                  <span className="adj-nav-arrow"><ChevronRight size={13} /></span>
                </div>
              </Link>
            )}
          </nav>
        )}

        {/* ── Related ── */}
        {related.length > 0 && (
          <div className="related-section">
            <p className="related-title">Continuar a ler</p>
            {related.map(s => (
              <Link key={s.id} href={`/revista/${s.slug}`} className="related-card">
                <div className="related-img">
                  {s.coverImage && <img src={s.coverImage} alt={s.title} />}
                </div>
                <div>
                  <span className="related-cat" style={{ color: CAT_COLORS[s.category] || '#7B2CBF' }}>
                    {s.category}
                  </span>
                  <p className="related-t">{buildTitle(s.title, s.highlightText)}</p>
                  <div className="related-meta">
                    <span>{s.author?.name}</span>
                    {s.readingTime && <><span>·</span><span><Clock size={11} /> {s.readingTime} min</span></>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        {/* ── Lightbox / Tela cheia ── */}
        {lightboxOpen && story.coverImage && (
          <div
            className="lightbox-overlay"
            onClick={() => setLightboxOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Imagem em tela cheia"
          >
            <button
              className="lightbox-close"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxOpen(false);
              }}
              aria-label="Fechar tela cheia (Esc)"
              title="Fechar (Esc)"
            >
              <X size={20} />
              <span className="lightbox-esc-hint">ESC</span>
            </button>

            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
              <img
                src={story.coverImage}
                alt={story.title}
                className="lightbox-img"
              />
              <div className="lightbox-caption">
                <span>{story.title}</span>
                <button
                  className="lightbox-close-text"
                  onClick={() => setLightboxOpen(false)}
                >
                  Fechar ✕
                </button>
              </div>
            </div>
          </div>
        )}
        {/* ── Modal de Partilha (Todas as Redes) ── */}
        {shareModalOpen && (
          <div
            className="share-modal-overlay"
            onClick={() => setShareModalOpen(false)}
            role="dialog"
            aria-modal="true"
          >
            <div className="share-modal-card" onClick={e => e.stopPropagation()}>
              <div className="share-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Share2 size={18} color="#7B2CBF" />
                  <h3 className="share-modal-title">Partilhar História</h3>
                </div>
                <button
                  className="share-modal-close"
                  onClick={() => setShareModalOpen(false)}
                  aria-label="Fechar"
                >
                  <X size={16} />
                </button>
              </div>

              <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.25rem' }}>
                Escolha a rede social para partilhar esta história:
              </p>

              <div className="share-grid">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="share-grid-item"
                  onClick={() => setShareModalOpen(false)}
                >
                  <div className="share-grid-icon" style={{ background: '#25D366' }}>
                    <MessageCircle size={20} />
                  </div>
                  <span>WhatsApp</span>
                </a>

                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="share-grid-item"
                  onClick={() => setShareModalOpen(false)}
                >
                  <div className="share-grid-icon" style={{ background: '#1877F2' }}>
                    <Facebook size={20} />
                  </div>
                  <span>Facebook</span>
                </a>

                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="share-grid-item"
                  onClick={() => setShareModalOpen(false)}
                >
                  <div className="share-grid-icon" style={{ background: '#0A66C2' }}>
                    <Linkedin size={20} />
                  </div>
                  <span>LinkedIn</span>
                </a>

                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="share-grid-item"
                  onClick={() => setShareModalOpen(false)}
                >
                  <div className="share-grid-icon" style={{ background: '#000000' }}>
                    <Twitter size={20} />
                  </div>
                  <span>X (Twitter)</span>
                </a>

                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="share-grid-item"
                  onClick={() => setShareModalOpen(false)}
                >
                  <div className="share-grid-icon" style={{ background: '#229ED9' }}>
                    <Send size={19} />
                  </div>
                  <span>Telegram</span>
                </a>

                <a
                  href={emailUrl}
                  className="share-grid-item"
                  onClick={() => setShareModalOpen(false)}
                >
                  <div className="share-grid-icon" style={{ background: '#64748b' }}>
                    <Mail size={19} />
                  </div>
                  <span>Email</span>
                </a>
              </div>

              <div style={{ marginTop: '0.5rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Ou copie o link direto
                </p>
                <div className="share-link-input-row">
                  <input
                    type="text"
                    readOnly
                    value={currentShareUrl}
                    className="share-link-input"
                    onClick={e => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`share-link-copy-btn${copied ? ' copied' : ''}`}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </>
  );
}
