'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Search, Clock, Eye, ChevronRight, BookOpen, Code2,
  Cpu, Palette, Briefcase, Newspaper, Star, Menu, X, Home, ExternalLink, Maximize2
} from 'lucide-react';

interface Story {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  author: { name: string; avatar?: string };
  category: string;
  tags: string[];
  readingTime?: number;
  views: number;
  featured: boolean;
  highlightText?: string;
  publishedAt?: string;
}

const CATEGORIES = [
  { key: 'all', label: 'Todas', icon: Newspaper },
  { key: 'codigo', label: 'Código', icon: Code2 },
  { key: 'startups', label: 'Startups', icon: Briefcase },
  { key: 'ia', label: 'IA', icon: Cpu },
  { key: 'design', label: 'Design', icon: Palette },
  { key: 'carreira', label: 'Carreira', icon: BookOpen },
];

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
  if (!highlight || !title.includes(highlight)) {
    return <span>{title}</span>;
  }
  const parts = title.split(highlight);
  return (
    <>
      {parts[0]}
      <mark style={{
        background: '#7B2CBF',
        color: '#fff',
        borderRadius: '3px',
        padding: '0 4px',
        fontStyle: 'normal',
      }}>{highlight}</mark>
      {parts.slice(1).join(highlight)}
    </>
  );
}

function TypedTitle({
  title,
  highlight,
  speed = 30,
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
          className={`hero-typing-cursor${isComplete ? ' complete' : ''}`}
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
            padding: '0 5px',
            fontStyle: 'normal',
            display: 'inline',
          }}
        >
          {highlightTyped}
        </mark>
      )}
      {afterTyped}
      <span
        className={`hero-typing-cursor${isComplete ? ' complete' : ''}`}
        aria-hidden="true"
      />
    </span>
  );
}

export default function RevistaPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'recentes' | 'mais-lidas' | 'destaque'>('recentes');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Fechar lightbox ao pressionar ESC e travar scroll do corpo
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxOpen]);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/revista/historias?status=published&limit=30');
      const data = await res.json();
      if (data.success) setStories(data.stories);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Top stories for hero rotation (featured first, then recent up to 5)
  const heroStories = useMemo(() => {
    if (!stories.length) return [];
    const feat = stories.filter(s => s.featured);
    const others = stories.filter(s => !s.featured);
    return [...feat, ...others].slice(0, 5);
  }, [stories]);

  // Rotate hero story every 10 seconds (pauses on hover)
  useEffect(() => {
    if (heroStories.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % heroStories.length);
    }, 10000);

    return () => clearInterval(timer);
  }, [heroStories.length, isPaused]);

  const featured = heroStories[heroIndex] || stories[0];

  const filtered = stories
    .filter(s => {
      const q = search.toLowerCase();
      const matchSearch = !q || s.title.toLowerCase().includes(q) || s.excerpt.toLowerCase().includes(q);
      const matchCat = category === 'all' || s.category === category;
      return matchSearch && matchCat;
    })
    .filter(s => s.id !== heroStories[0]?.id);

  const tabFiltered =
    tab === 'mais-lidas' ? [...filtered].sort((a, b) => b.views - a.views) :
    tab === 'destaque'   ? filtered.filter(s => s.featured) :
    filtered;

  return (
    <>
      <style>{`
        .revista-page { font-family: 'Poppins', sans-serif; background: #f8fafc; min-height: 100vh; }

        /* ── Navbar ─────────────────────────── */
        .revista-nav {
          background: #fff;
          border-bottom: 1px solid #e2e8f0;
          position: sticky; top: 0; z-index: 50;
        }
        .revista-nav-inner {
          max-width: 1100px; margin: 0 auto;
          padding: 0 2rem;
          display: flex; align-items: center; justify-content: space-between;
          height: 64px;
        }
        .revista-nav-brand {
          display: flex; align-items: center; gap: 0.5rem;
          text-decoration: none;
        }
        .revista-nav-brand-text {
          font-size: 1.15rem; font-weight: 800; color: #0f172a;
          letter-spacing: -0.04em;
        }
        .revista-nav-brand-text span {
          color: #7B2CBF;
        }
        .revista-nav-links { display: flex; gap: 1.5rem; align-items: center; }
        .revista-nav-links a, .revista-nav-link-btn {
          color: #475569; text-decoration: none; font-size: 0.85rem; font-weight: 500;
          transition: color 0.2s; background: none; border: none; cursor: pointer;
          font-family: 'Poppins', sans-serif; padding: 0;
        }
        .revista-nav-links a:hover, .revista-nav-link-btn:hover { color: #7B2CBF; }
        .revista-nav-links a.active, .revista-nav-link-btn.active {
          color: #7B2CBF;
          border-bottom: 2px solid #7B2CBF;
          padding-bottom: 2px;
        }
        .revista-nav-external {
          display: inline-flex; align-items: center; gap: 0.35rem;
          font-size: 0.8rem !important; color: #7B2CBF !important;
          background: #FAF5FF; padding: 0.35rem 0.75rem !important;
          border-radius: 9999px; border: 1px solid #E0AAFF;
          font-weight: 600 !important; transition: all 0.2s;
        }
        .revista-nav-external:hover {
          background: #7B2CBF !important; color: #fff !important; border-color: #7B2CBF !important;
        }

        .revista-mobile-toggle {
          display: none;
          align-items: center; justify-content: center;
          width: 40px; height: 40px;
          border-radius: 8px; border: 1px solid #e2e8f0;
          background: #f8fafc; cursor: pointer;
          transition: all 0.2s;
        }
        .revista-mobile-toggle:hover {
          background: #f1f5f9; border-color: #cbd5e1;
        }

        /* Mobile Dropdown Menu */
        .revista-mobile-menu {
          background: #fff;
          border-top: 1px solid #f1f5f9;
          border-bottom: 2px solid #E0AAFF;
          box-shadow: 0 16px 32px -8px rgba(0,0,0,0.12);
          animation: navSlideDown 0.22s ease-out;
        }
        @keyframes navSlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .revista-mobile-menu-inner {
          padding: 1.25rem 1.25rem 1.5rem;
          max-width: 1100px; margin: 0 auto;
        }
        .revista-mobile-title {
          font-size: 0.72rem; font-weight: 700; color: #94a3b8;
          text-transform: uppercase; letter-spacing: 0.08em;
          margin-bottom: 0.75rem;
        }
        .revista-mobile-cats {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem; margin-bottom: 1.25rem;
        }
        .revista-mobile-cat-btn {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.65rem 0.85rem; border-radius: 8px;
          border: 1px solid #e2e8f0; background: #f8fafc;
          font-family: 'Poppins', sans-serif; font-size: 0.82rem;
          font-weight: 600; color: #334155; text-align: left;
          cursor: pointer; transition: all 0.18s;
        }
        .revista-mobile-cat-btn.active {
          background: #7B2CBF; color: #fff; border-color: #7B2CBF;
        }
        .revista-mobile-cat-btn:not(.active):hover {
          background: #FAF5FF; color: #7B2CBF; border-color: #E0AAFF;
        }
        .revista-mobile-divider {
          height: 1px; background: #e2e8f0; margin-bottom: 1rem;
        }
        .revista-mobile-links {
          display: flex; flex-direction: column; gap: 0.5rem;
        }
        .revista-mobile-link {
          display: flex; align-items: center; gap: 0.6rem;
          padding: 0.65rem 0.85rem; border-radius: 8px;
          text-decoration: none; font-size: 0.85rem; font-weight: 600;
          color: #334155; transition: all 0.18s;
        }
        .revista-mobile-link:hover {
          background: #f1f5f9; color: #7B2CBF;
        }
        .revista-mobile-link.highlight {
          background: #FAF5FF; color: #7B2CBF; border: 1px solid #E0AAFF;
        }
        .revista-mobile-link.highlight:hover {
          background: #7B2CBF; color: #fff; border-color: #7B2CBF;
        }

        /* ── Hero ──────────────────────────── */
        .revista-hero {
          max-width: 1100px; margin: 0 auto;
          padding: 3.5rem 2rem 2rem;
          display: grid; grid-template-columns: 1fr 1fr; gap: 3.5rem; align-items: center;
          position: relative;
        }
        .hero-fade {
          animation: heroFadeIn 0.35s ease-out;
        }
        @keyframes heroFadeIn {
          from { opacity: 0.3; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-indicators {
          display: flex; gap: 0.45rem; align-items: center;
        }
        .hero-dot {
          height: 6px; width: 22px; border-radius: 9999px;
          background: #e2e8f0; border: none; cursor: pointer;
          transition: all 0.25s ease; padding: 0;
        }
        .hero-dot.active {
          width: 38px; background: #7B2CBF;
        }
        .hero-dot:hover:not(.active) {
          background: #cbd5e1;
        }
        .hero-img-wrap {
          border-radius: 14px; overflow: hidden;
          aspect-ratio: 4/3;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          position: relative;
          display: flex; align-items: center; justify-content: center;
        }
        .hero-img-wrap.clickable {
          cursor: zoom-in;
        }
        .hero-img-badge {
          position: absolute;
          bottom: 10px;
          right: 10px;
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
        .hero-img-wrap:hover .hero-img-badge {
          opacity: 1;
          transform: translateY(0);
        }
        .hero-img-wrap img {
          width: 100%; height: 100%;
          object-fit: contain;
          padding: 1rem;
          transition: transform 0.25s ease;
        }
        .hero-img-wrap.clickable:hover img {
          transform: scale(1.02);
        }
        .hero-img-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #10002B, #3C096C);
          font-size: 4rem; color: rgba(255,255,255,0.15);
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
        .hero-content { display: flex; flex-direction: column; gap: 1rem; }
        .hero-cat {
          font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em;
          color: #64748b; text-transform: uppercase;
        }
        .hero-title {
          font-size: 2rem; font-weight: 800; color: #0f172a;
          line-height: 1.2; letter-spacing: -0.03em;
          min-height: 2.4em;
        }
        .hero-typing-cursor {
          display: inline-block;
          width: 3px;
          height: 0.95em;
          background: #7B2CBF;
          margin-left: 4px;
          vertical-align: -0.08em;
          border-radius: 1px;
          animation: heroCursorBlink 0.8s infinite;
        }
        .hero-typing-cursor.complete {
          animation: heroCursorBlink 0.8s 4 ease-in-out forwards;
        }
        @keyframes heroCursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .hero-excerpt { color: #475569; font-size: 0.93rem; line-height: 1.65; }
        .hero-meta { display: flex; align-items: center; gap: 0.75rem; }
        .hero-avatar {
          width: 30px; height: 30px; border-radius: 50%;
          background: #7B2CBF; display: flex; align-items: center;
          justify-content: center; color: #fff; font-weight: 700; font-size: 0.75rem;
          overflow: hidden; flex-shrink: 0;
        }
        .hero-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .hero-author { font-size: 0.82rem; color: #475569; font-weight: 500; }
        .hero-cta {
          display: inline-flex; align-items: center; gap: 0.4rem;
          color: #7B2CBF; font-size: 0.88rem; font-weight: 600;
          text-decoration: none; border-bottom: 2px solid #7B2CBF;
          padding-bottom: 1px; width: fit-content;
          transition: gap 0.2s, color 0.2s;
        }
        .hero-cta:hover { gap: 0.7rem; color: #5A189A; }

        /* ── Categories Bar ────────────────── */
        .cat-bar {
          max-width: 1100px; margin: 0 auto;
          padding: 0 2rem 1rem;
          display: flex; gap: 0.5rem; flex-wrap: wrap;
        }
        .cat-btn {
          display: flex; align-items: center; gap: 0.4rem;
          padding: 0.4rem 1rem; border-radius: 9999px;
          font-size: 0.8rem; font-weight: 600; cursor: pointer;
          border: 2px solid transparent; transition: all 0.2s;
          background: #fff; color: #475569;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .cat-btn.active { background: #7B2CBF; color: #fff; border-color: #7B2CBF; }
        .cat-btn:not(.active):hover { border-color: #7B2CBF; color: #7B2CBF; }

        /* ── Stories Section ───────────────── */
        .stories-section {
          max-width: 1100px; margin: 0 auto;
          padding: 0.5rem 2rem 4.5rem;
          display: grid; grid-template-columns: 1fr 340px; gap: 3rem;
        }
        .section-title { font-size: 1.3rem; font-weight: 800; color: #0f172a; margin-bottom: 1.25rem; }

        /* Tabs */
        .tabs { display: flex; gap: 0; margin-bottom: 1.5rem; border-bottom: 1px solid #e2e8f0; }
        .tab-btn {
          font-size: 0.83rem; font-weight: 600; color: #94a3b8;
          padding: 0.5rem 1rem; cursor: pointer; border: none;
          background: none; border-bottom: 2px solid transparent;
          margin-bottom: -1px; transition: all 0.2s;
        }
        .tab-btn.active { color: #7B2CBF; border-bottom-color: #7B2CBF; }
        .tab-btn:hover:not(.active) { color: #475569; }

        /* Search */
        .search-wrap {
          position: relative; margin-bottom: 1.5rem;
        }
        .search-wrap input {
          width: 100%; padding: 0.55rem 1rem 0.55rem 2.4rem;
          border: 1.5px solid #e2e8f0; border-radius: 8px;
          font-size: 0.83rem; font-family: 'Poppins', sans-serif;
          background: #fff; color: #0f172a; outline: none;
          transition: border-color 0.2s;
        }
        .search-wrap input:focus { border-color: #7B2CBF; }
        .search-wrap .search-icon {
          position: absolute; left: 0.7rem; top: 50%; transform: translateY(-50%);
          color: #94a3b8;
        }

        /* Story Card */
        .story-card {
          display: grid; grid-template-columns: 120px 1fr; gap: 1rem;
          padding: 1.1rem 0; border-bottom: 1px solid #f1f5f9;
          text-decoration: none; transition: transform 0.18s;
        }
        .story-card:hover { transform: translateX(3px); }
        .story-card:last-child { border-bottom: none; }
        .story-card-img {
          border-radius: 10px; overflow: hidden;
          aspect-ratio: 4/3; background: #ffffff;
          border: 1px solid #e2e8f0;
          flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .story-card-img img { width: 100%; height: 100%; object-fit: contain; padding: 4px; }
        .story-card-img-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #10002B, #3C096C);
          font-size: 2rem; color: rgba(255,255,255,0.12);
        }
        .story-card-body { display: flex; flex-direction: column; gap: 0.3rem; }
        .story-card-cat {
          font-size: 0.65rem; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .story-card-title {
          font-size: 0.9rem; font-weight: 700; color: #0f172a;
          line-height: 1.3; margin: 0;
        }
        .story-card-meta {
          display: flex; align-items: center; gap: 0.75rem;
          font-size: 0.72rem; color: #94a3b8; margin-top: auto;
        }
        .story-card-meta span { display: flex; align-items: center; gap: 0.25rem; }

        /* Sidebar */
        .sidebar { display: flex; flex-direction: column; gap: 1.5rem; }
        .sidebar-box {
          background: #fff; border-radius: 14px; padding: 1.5rem;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        }
        .sidebar-box-title {
          font-size: 0.78rem; font-weight: 700; color: #64748b;
          letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 1rem;
        }
        .sidebar-mini-card {
          display: flex; gap: 0.75rem; padding: 0.7rem 0;
          border-bottom: 1px solid #f1f5f9; text-decoration: none;
        }
        .sidebar-mini-card:last-child { border-bottom: none; padding-bottom: 0; }
        .sidebar-mini-card:hover .sidebar-mini-title { color: #7B2CBF; }
        .sidebar-mini-img {
          width: 56px; height: 56px; border-radius: 8px; flex-shrink: 0;
          overflow: hidden; background: linear-gradient(135deg, #10002B, #5A189A);
        }
        .sidebar-mini-img img { width: 100%; height: 100%; object-fit: cover; }
        .sidebar-mini-body { display: flex; flex-direction: column; gap: 0.2rem; }
        .sidebar-mini-cat {
          font-size: 0.6rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
        }
        .sidebar-mini-title { font-size: 0.8rem; font-weight: 600; color: #0f172a; line-height: 1.3; transition: color 0.2s; }

        /* Newsletter box */
        .nl-box {
          background: linear-gradient(135deg, #5A189A 0%, #7B2CBF 100%);
          border-radius: 14px; padding: 1.5rem; color: #fff;
        }
        .nl-box h3 { font-size: 1rem; font-weight: 700; margin-bottom: 0.5rem; }
        .nl-box p { font-size: 0.8rem; color: rgba(255,255,255,0.85); margin-bottom: 1rem; line-height: 1.5; }
        .nl-input {
          width: 100%; padding: 0.55rem 0.85rem;
          border-radius: 8px; border: none; outline: none;
          font-family: 'Poppins', sans-serif; font-size: 0.82rem;
          margin-bottom: 0.6rem;
        }
        .nl-btn {
          width: 100%; padding: 0.6rem;
          background: #9D4EDD; color: #fff; border: none;
          border-radius: 8px; font-family: 'Poppins', sans-serif;
          font-size: 0.82rem; font-weight: 600; cursor: pointer;
          transition: background 0.2s;
        }
        .nl-btn:hover { background: #C77DFF; }

        /* Empty / Loading */
        .empty-state {
          text-align: center; padding: 3rem 1rem;
          color: #94a3b8; font-size: 0.88rem;
        }
        .spinner {
          width: 32px; height: 32px;
          border: 3px solid #e2e8f0;
          border-top-color: #7B2CBF;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          margin: 2rem auto;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Responsive */
        @media (max-width: 900px) {
          .revista-hero { grid-template-columns: 1fr; }
          .stories-section { grid-template-columns: 1fr; }
          .sidebar { display: none; }
        }
        @media (max-width: 768px) {
          .revista-nav-inner { padding: 0 1.25rem; }
          .revista-nav-links { display: none; }
          .revista-mobile-toggle { display: flex; }
          .cat-bar {
            padding: 0.5rem 1.25rem 1rem;
            flex-wrap: nowrap;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .cat-bar::-webkit-scrollbar { display: none; }
          .cat-btn {
            flex-shrink: 0; white-space: nowrap;
            font-size: 0.78rem; padding: 0.35rem 0.85rem;
          }
        }
        @media (max-width: 600px) {
          .revista-hero { padding: 2rem 1.25rem 1rem; }
          .hero-title { font-size: 1.5rem; }
          .stories-section { padding: 0.5rem 1.25rem 2.5rem; }
        }
        @media (max-width: 360px) {
          .revista-nav-brand-text { font-size: 0.9rem; }
          .cat-btn { font-size: 0.72rem; padding: 0.3rem 0.7rem; }
          .revista-mobile-cats { grid-template-columns: 1fr; }
          .hero-title { font-size: 1.3rem; }
          .story-card { grid-template-columns: 80px 1fr; }
        }
      `}</style>

      <div className="revista-page">
        {/* ── Navbar ── */}
        <nav className="revista-nav">
          <div className="revista-nav-inner">
            <Link href="/revista" className="revista-nav-brand" onClick={() => setMobileMenuOpen(false)}>
              <Code2 size={20} color="#7B2CBF" />
              <span className="revista-nav-brand-text">
                codando <span>histórias</span>
              </span>
            </Link>

            {/* Desktop links */}
            <div className="revista-nav-links">
              <button
                className={`revista-nav-link-btn ${category === 'all' ? 'active' : ''}`}
                onClick={() => setCategory('all')}
              >
                Início
              </button>
              <button
                className={`revista-nav-link-btn ${category === 'codigo' ? 'active' : ''}`}
                onClick={() => setCategory('codigo')}
              >
                Código
              </button>
              <button
                className={`revista-nav-link-btn ${category === 'startups' ? 'active' : ''}`}
                onClick={() => setCategory('startups')}
              >
                Startups
              </button>
              <button
                className={`revista-nav-link-btn ${category === 'ia' ? 'active' : ''}`}
                onClick={() => setCategory('ia')}
              >
                IA
              </button>
              <Link href="/" target="_blank" rel="noopener noreferrer" className="revista-nav-external">
                WEHOSTHERE <ExternalLink size={12} />
              </Link>
            </div>

            {/* Mobile hamburger button */}
            <button
              className="revista-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {mobileMenuOpen ? <X size={22} color="#0f172a" /> : <Menu size={22} color="#0f172a" />}
            </button>
          </div>

          {/* Mobile menu dropdown */}
          {mobileMenuOpen && (
            <div className="revista-mobile-menu">
              <div className="revista-mobile-menu-inner">
                <p className="revista-mobile-title">Categorias</p>
                <div className="revista-mobile-cats">
                  {CATEGORIES.map(c => {
                    const Icon = c.icon;
                    const isActive = category === c.key;
                    return (
                      <button
                        key={c.key}
                        className={`revista-mobile-cat-btn ${isActive ? 'active' : ''}`}
                        onClick={() => {
                          setCategory(c.key);
                          setMobileMenuOpen(false);
                        }}
                      >
                        <Icon size={16} />
                        <span>{c.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="revista-mobile-divider" />

                <div className="revista-mobile-links">
                  <button
                    className="revista-mobile-link"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', font: 'inherit' }}
                    onClick={() => {
                      setCategory('all');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Home size={16} color="#7B2CBF" />
                    <span>Página Inicial da Revista</span>
                  </button>
                  <Link
                    href="/"
                    className="revista-mobile-link highlight"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <ExternalLink size={16} />
                    <span>Ir para WEHOSTHERE Hosting</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* ── Hero ── */}
        {featured && (
          <section
            className="revista-hero hero-fade"
            key={featured.id}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div
              className={`hero-img-wrap${featured.coverImage ? ' clickable' : ''}`}
              onClick={() => featured.coverImage && setLightboxOpen(true)}
              role={featured.coverImage ? 'button' : undefined}
              tabIndex={featured.coverImage ? 0 : undefined}
              title={featured.coverImage ? 'Clique para ver em tela cheia' : undefined}
            >
              {featured.coverImage ? (
                <>
                  <img src={featured.coverImage} alt={featured.title} />
                  <div className="hero-img-badge">
                    <Maximize2 size={13} />
                    <span>Ver em tela cheia</span>
                  </div>
                </>
              ) : (
                <div className="hero-img-placeholder"><Code2 size={64} color="rgba(255,255,255,0.12)" /></div>
              )}
            </div>
            <div className="hero-content">
              <span className="hero-cat">{featured.category?.toUpperCase()}</span>
              <h1 className="hero-title">
                <TypedTitle title={featured.title} highlight={featured.highlightText} speed={28} />
              </h1>
              <p className="hero-excerpt">{featured.excerpt}</p>
              <div className="hero-meta">
                <div className="hero-avatar">
                  {featured.author?.avatar
                    ? <img src={featured.author.avatar} alt={featured.author.name} />
                    : featured.author?.name?.[0]?.toUpperCase()
                  }
                </div>
                <span className="hero-author">{featured.author?.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <Link href={`/revista/${featured.slug}`} className="hero-cta">
                  Ler a história <ChevronRight size={16} />
                </Link>
                {heroStories.length > 1 && (
                  <div className="hero-indicators" title="Passe o cursor para pausar a rotação">
                    {heroStories.map((s, idx) => (
                      <button
                        key={s.id}
                        className={`hero-dot${idx === heroIndex ? ' active' : ''}`}
                        onClick={() => setHeroIndex(idx)}
                        aria-label={`Ver história: ${s.title}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Category Bar ── */}
        <div className="cat-bar">
          {CATEGORIES.map(c => {
            const Icon = c.icon;
            return (
              <button
                key={c.key}
                className={`cat-btn${category === c.key ? ' active' : ''}`}
                onClick={() => setCategory(c.key)}
              >
                <Icon size={13} />
                {c.label}
              </button>
            );
          })}
        </div>

        {/* ── Stories + Sidebar ── */}
        <div className="stories-section">
          <div>
            <h2 className="section-title">Últimas histórias</h2>

            {/* Tabs + Search */}
            <div className="tabs">
              {(['recentes', 'mais-lidas', 'destaque'] as const).map(t => (
                <button
                  key={t}
                  className={`tab-btn${tab === t ? ' active' : ''}`}
                  onClick={() => setTab(t)}
                >
                  {t === 'recentes' ? 'Recentes' : t === 'mais-lidas' ? 'Mais lidas' : 'Em destaque'}
                </button>
              ))}
              <div style={{ marginLeft: 'auto' }}>
                <div className="search-wrap" style={{ marginBottom: 0 }}>
                  <Search size={14} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Pesquisar..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ width: '180px' }}
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="spinner" />
            ) : tabFiltered.length === 0 ? (
              <div className="empty-state">
                <BookOpen size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                <p>Nenhuma história encontrada.</p>
              </div>
            ) : (
              tabFiltered.map(story => (
                <Link key={story.id} href={`/revista/${story.slug}`} className="story-card">
                  <div className="story-card-img">
                    {story.coverImage
                      ? <img src={story.coverImage} alt={story.title} />
                      : <div className="story-card-img-placeholder"><Code2 /></div>
                    }
                  </div>
                  <div className="story-card-body">
                    <span
                      className="story-card-cat"
                      style={{ color: CAT_COLORS[story.category] || '#64748b' }}
                    >
                      {story.category}
                    </span>
                    <p className="story-card-title">
                      {buildTitle(story.title, story.highlightText)}
                    </p>
                    <div className="story-card-meta">
                      <span>{story.author?.name}</span>
                      {story.readingTime && (
                        <span><Clock size={11} /> {story.readingTime} min</span>
                      )}
                      <span><Eye size={11} /> {story.views}</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Sidebar */}
          <aside className="sidebar">
            {/* Mais lidas */}
            <div className="sidebar-box">
              <p className="sidebar-box-title">Mais Lidas</p>
              {[...stories]
                .sort((a, b) => b.views - a.views)
                .slice(0, 4)
                .map(s => (
                  <Link key={s.id} href={`/revista/${s.slug}`} className="sidebar-mini-card">
                    <div className="sidebar-mini-img">
                      {s.coverImage && <img src={s.coverImage} alt={s.title} />}
                    </div>
                    <div className="sidebar-mini-body">
                      <span className="sidebar-mini-cat" style={{ color: CAT_COLORS[s.category] || '#7B2CBF' }}>
                        {s.category}
                      </span>
                      <p className="sidebar-mini-title">{s.title}</p>
                    </div>
                  </Link>
                ))}
            </div>

            {/* Newsletter */}
            <div className="nl-box">
              <h3>📬 Receba a próxima história</h3>
              <p>Subscreva e seja o primeiro a ler as nossas histórias de tech.</p>
              <input className="nl-input" type="email" placeholder="o-teu@email.com" />
              <button className="nl-btn">Subscrever a newsletter</button>
            </div>

            {/* Em Destaque */}
            {stories.filter(s => s.featured).length > 0 && (
              <div className="sidebar-box">
                <p className="sidebar-box-title"><Star size={12} style={{ display: 'inline', marginRight: 4 }} />Em Destaque</p>
                {stories.filter(s => s.featured).slice(0, 3).map(s => (
                  <Link key={s.id} href={`/revista/${s.slug}`} className="sidebar-mini-card">
                    <div className="sidebar-mini-body">
                      <span className="sidebar-mini-cat" style={{ color: CAT_COLORS[s.category] || '#7B2CBF' }}>
                        {s.category}
                      </span>
                      <p className="sidebar-mini-title">{s.title}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </aside>
        </div>

        {/* ── Lightbox / Tela cheia ── */}
        {lightboxOpen && featured?.coverImage && (
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
                src={featured.coverImage}
                alt={featured.title}
                className="lightbox-img"
              />
              <div className="lightbox-caption">
                <span>{featured.title}</span>
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
      </div>
    </>
  );
}
