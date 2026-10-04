'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Clock, Eye, ChevronRight, BookOpen, Code2, Cpu, Palette, Briefcase, Newspaper, Star } from 'lucide-react';

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
  codigo: '#0ea5e9',
  startups: '#8b5cf6',
  ia: '#06b6d4',
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
        background: '#0ea5e9',
        color: '#fff',
        borderRadius: '3px',
        padding: '0 4px',
        fontStyle: 'normal',
      }}>{highlight}</mark>
      {parts.slice(1).join(highlight)}
    </>
  );
}

export default function RevistaPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'recentes' | 'mais-lidas' | 'destaque'>('recentes');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

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

  const featured = stories.find(s => s.featured) || stories[0];

  const filtered = stories
    .filter(s => {
      const q = search.toLowerCase();
      const matchSearch = !q || s.title.toLowerCase().includes(q) || s.excerpt.toLowerCase().includes(q);
      const matchCat = category === 'all' || s.category === category;
      return matchSearch && matchCat;
    })
    .filter(s => s.id !== featured?.id);

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
          color: #0ea5e9;
        }
        .revista-nav-links { display: flex; gap: 1.5rem; align-items: center; }
        .revista-nav-links a {
          color: #475569; text-decoration: none; font-size: 0.85rem; font-weight: 500;
          transition: color 0.2s;
        }
        .revista-nav-links a:hover { color: #0ea5e9; }
        .revista-nav-links a.active {
          color: #0ea5e9;
          border-bottom: 2px solid #0ea5e9;
          padding-bottom: 2px;
        }

        /* ── Hero ──────────────────────────── */
        .revista-hero {
          max-width: 1100px; margin: 0 auto;
          padding: 3.5rem 2rem 2rem;
          display: grid; grid-template-columns: 1fr 1fr; gap: 3.5rem; align-items: center;
        }
        .hero-img-wrap {
          border-radius: 14px; overflow: hidden;
          aspect-ratio: 4/3;
          background: linear-gradient(135deg, #0f172a, #1e3a5f);
          position: relative;
        }
        .hero-img-wrap img { width: 100%; height: 100%; object-fit: cover; }
        .hero-img-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          font-size: 4rem; color: rgba(255,255,255,0.15);
        }
        .hero-content { display: flex; flex-direction: column; gap: 1rem; }
        .hero-cat {
          font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em;
          color: #64748b; text-transform: uppercase;
        }
        .hero-title {
          font-size: 2rem; font-weight: 800; color: #0f172a;
          line-height: 1.2; letter-spacing: -0.03em;
        }
        .hero-excerpt { color: #475569; font-size: 0.93rem; line-height: 1.65; }
        .hero-meta { display: flex; align-items: center; gap: 0.75rem; }
        .hero-avatar {
          width: 30px; height: 30px; border-radius: 50%;
          background: #0ea5e9; display: flex; align-items: center;
          justify-content: center; color: #fff; font-weight: 700; font-size: 0.75rem;
          overflow: hidden; flex-shrink: 0;
        }
        .hero-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .hero-author { font-size: 0.82rem; color: #475569; font-weight: 500; }
        .hero-cta {
          display: inline-flex; align-items: center; gap: 0.4rem;
          color: #0ea5e9; font-size: 0.88rem; font-weight: 600;
          text-decoration: none; border-bottom: 2px solid #0ea5e9;
          padding-bottom: 1px; width: fit-content;
          transition: gap 0.2s, color 0.2s;
        }
        .hero-cta:hover { gap: 0.7rem; color: #0284c7; }

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
        .cat-btn.active { background: #0ea5e9; color: #fff; border-color: #0ea5e9; }
        .cat-btn:not(.active):hover { border-color: #0ea5e9; color: #0ea5e9; }

        /* ── Stories Section ───────────────── */
        .stories-section {
          max-width: 1100px; margin: 0 auto;
          padding: 0.5rem 2rem 3rem;
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
        .tab-btn.active { color: #0ea5e9; border-bottom-color: #0ea5e9; }
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
        .search-wrap input:focus { border-color: #0ea5e9; }
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
          aspect-ratio: 4/3; background: linear-gradient(135deg, #0f172a, #1e3a5f);
          flex-shrink: 0;
        }
        .story-card-img img { width: 100%; height: 100%; object-fit: cover; }
        .story-card-img-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
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
        .sidebar-mini-card:hover .sidebar-mini-title { color: #0ea5e9; }
        .sidebar-mini-img {
          width: 56px; height: 56px; border-radius: 8px; flex-shrink: 0;
          overflow: hidden; background: linear-gradient(135deg, #0f172a, #0ea5e9);
        }
        .sidebar-mini-img img { width: 100%; height: 100%; object-fit: cover; }
        .sidebar-mini-body { display: flex; flex-direction: column; gap: 0.2rem; }
        .sidebar-mini-cat {
          font-size: 0.6rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
        }
        .sidebar-mini-title { font-size: 0.8rem; font-weight: 600; color: #0f172a; line-height: 1.3; transition: color 0.2s; }

        /* Newsletter box */
        .nl-box {
          background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
          border-radius: 14px; padding: 1.5rem; color: #fff;
        }
        .nl-box h3 { font-size: 1rem; font-weight: 700; margin-bottom: 0.5rem; }
        .nl-box p { font-size: 0.8rem; color: rgba(255,255,255,0.7); margin-bottom: 1rem; line-height: 1.5; }
        .nl-input {
          width: 100%; padding: 0.55rem 0.85rem;
          border-radius: 8px; border: none; outline: none;
          font-family: 'Poppins', sans-serif; font-size: 0.82rem;
          margin-bottom: 0.6rem;
        }
        .nl-btn {
          width: 100%; padding: 0.6rem;
          background: #0ea5e9; color: #fff; border: none;
          border-radius: 8px; font-family: 'Poppins', sans-serif;
          font-size: 0.82rem; font-weight: 600; cursor: pointer;
          transition: background 0.2s;
        }
        .nl-btn:hover { background: #0284c7; }

        /* Empty / Loading */
        .empty-state {
          text-align: center; padding: 3rem 1rem;
          color: #94a3b8; font-size: 0.88rem;
        }
        .spinner {
          width: 32px; height: 32px;
          border: 3px solid #e2e8f0;
          border-top-color: #0ea5e9;
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
        @media (max-width: 600px) {
          .revista-hero { padding: 2rem 1rem 1rem; }
          .hero-title { font-size: 1.5rem; }
          .stories-section { padding: 0.5rem 1rem 2rem; }
        }
      `}</style>

      <div className="revista-page">
        {/* ── Navbar ── */}
        <nav className="revista-nav">
          <div className="revista-nav-inner">
            <Link href="/revista" className="revista-nav-brand">
              <Code2 size={20} color="#0ea5e9" />
              <span className="revista-nav-brand-text">
                codando <span>histórias</span>
              </span>
            </Link>
            <div className="revista-nav-links">
              <Link href="/revista" className="active">Início</Link>
              <Link href="/revista?cat=codigo">Código</Link>
              <Link href="/revista?cat=startups">Startups</Link>
              <Link href="/">WEHOSTHERE</Link>
            </div>
          </div>
        </nav>

        {/* ── Hero ── */}
        {featured && (
          <section className="revista-hero">
            <div className="hero-img-wrap">
              {featured.coverImage
                ? <img src={featured.coverImage} alt={featured.title} />
                : <div className="hero-img-placeholder"><Code2 size={64} color="rgba(255,255,255,0.12)" /></div>
              }
            </div>
            <div className="hero-content">
              <span className="hero-cat">{featured.category?.toUpperCase()}</span>
              <h1 className="hero-title">
                {buildTitle(featured.title, featured.highlightText)}
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
              <Link href={`/revista/${featured.slug}`} className="hero-cta">
                Ler a história <ChevronRight size={16} />
              </Link>
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
                      <span className="sidebar-mini-cat" style={{ color: CAT_COLORS[s.category] || '#0ea5e9' }}>
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
                      <span className="sidebar-mini-cat" style={{ color: CAT_COLORS[s.category] || '#0ea5e9' }}>
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
      </div>
    </>
  );
}
