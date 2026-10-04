'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Clock, Eye, Calendar, Share2,
  Instagram, Linkedin, Twitter, Code2, ChevronRight,
  Globe, Github
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
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [email, setEmail] = useState('');

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

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="revista-spinner" />
    </div>
  );

  if (notFound || !story) return (
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
  );

  return (
    <>
      <style>{`
        .story-page { font-family: 'Poppins', sans-serif; background: #f8fafc; min-height: 100vh; }

        /* ── Navbar ── */
        .story-nav {
          background: #fff; border-bottom: 1px solid #e2e8f0;
          position: sticky; top: 0; z-index: 50;
        }
        .story-nav-inner {
          max-width: 1100px; margin: 0 auto; padding: 0 2rem;
          height: 64px; display: flex; align-items: center; justify-content: space-between;
        }
        .story-nav-brand {
          display: flex; align-items: center; gap: 0.5rem; text-decoration: none;
        }
        .story-nav-brand-text {
          font-size: 1.1rem; font-weight: 800; color: #0f172a; letter-spacing: -0.04em;
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

        /* Socials */
        .story-socials {
          display: flex; gap: 0.5rem; align-items: center; margin-bottom: 2rem;
        }
        .story-social-btn {
          display: flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border-radius: 50%;
          background: #f1f5f9; color: #475569;
          border: 1px solid #e2e8f0; cursor: pointer;
          transition: all 0.2s; text-decoration: none;
        }
        .story-social-btn:hover { background: #7B2CBF; color: #fff; border-color: #7B2CBF; }

        /* Cover image */
        .story-cover {
          width: 100%; aspect-ratio: 16/9; border-radius: 14px;
          overflow: hidden; margin-bottom: 2.5rem;
          background: linear-gradient(135deg, #10002B, #3C096C);
        }
        .story-cover img { width: 100%; height: 100%; object-fit: cover; }
        .story-cover-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
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
          .story-nav-inner { padding: 0 1rem; height: 56px; }
          .story-nav-brand-text { font-size: 0.88rem; }
          .story-nav-back-text { display: none; }
          .story-title { font-size: 1.45rem; }
          .breadcrumb { padding: 0.75rem 1rem 0; font-size: 0.72rem; }
          .story-article { padding: 0 1rem 3rem; }
          .related-section { padding: 0 1rem 3rem; }
          .story-nl-row { flex-direction: column; }
          .pull-quote { padding: 0.75rem 1rem; font-size: 1rem; }
        }
        @media (max-width: 400px) {
          .story-nav-brand-text { display: none; }
        }
      `}</style>

      <div className="story-page">
        {/* ── Navbar ── */}
        <nav className="story-nav">
          <div className="story-nav-inner">
            <Link href="/revista" className="story-nav-brand">
              <Code2 size={20} color="#7B2CBF" />
              <span className="story-nav-brand-text">
                codando <span>histórias</span>
              </span>
            </Link>
            <Link href="/revista" className="story-nav-back-link">
              <ArrowLeft size={15} /> <span className="story-nav-back-text">Todas as histórias</span>
            </Link>
          </div>
        </nav>

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
            {buildTitle(story.title, story.highlightText)}
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

          {/* Socials */}
          <div className="story-socials">
            <a
              href={`https://www.instagram.com/`}
              target="_blank" rel="noopener noreferrer"
              className="story-social-btn" aria-label="Partilhar no Instagram"
            >
              <Instagram size={14} />
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
              target="_blank" rel="noopener noreferrer"
              className="story-social-btn" aria-label="Partilhar no LinkedIn"
            >
              <Linkedin size={14} />
            </a>
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(story.title)}`}
              target="_blank" rel="noopener noreferrer"
              className="story-social-btn" aria-label="Partilhar no Twitter"
            >
              <Twitter size={14} />
            </a>
            <button
              className="story-social-btn"
              onClick={() => navigator.clipboard?.writeText(shareUrl)}
              title="Copiar link"
              style={{ border: '1px solid #e2e8f0', background: '#f1f5f9', cursor: 'pointer' }}
            >
              <Share2 size={14} />
            </button>
          </div>

          {/* Cover */}
          <div className="story-cover">
            {story.coverImage
              ? <img src={story.coverImage} alt={story.title} />
              : (
                <div className="story-cover-placeholder">
                  <Code2 size={72} color="rgba(255,255,255,0.1)" />
                </div>
              )
            }
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
            <p className="story-share-label">PARTILHAR ESTA HISTÓRIA</p>
            <div className="story-socials">
              <a href={`https://www.instagram.com/`} target="_blank" rel="noopener noreferrer" className="story-social-btn"><Instagram size={14} /></a>
              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="story-social-btn"><Linkedin size={14} /></a>
              <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(story.title)}`} target="_blank" rel="noopener noreferrer" className="story-social-btn"><Twitter size={14} /></a>
            </div>
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
      </div>
    </>
  );
}
