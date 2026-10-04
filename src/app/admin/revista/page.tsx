'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus, Edit, Trash2, Eye, Clock, Tag, Filter,
  ArrowLeft, Code2, Star, BookOpen, ChevronDown, Search
} from 'lucide-react';

interface Story {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  author: { name: string };
  category: string;
  status: string;
  featured: boolean;
  views: number;
  readingTime?: number;
  publishedAt?: string;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  published: 'Publicado',
  draft: 'Rascunho',
  archived: 'Arquivado',
};

const STATUS_COLORS: Record<string, string> = {
  published: '#10b981',
  draft:     '#f59e0b',
  archived:  '#94a3b8',
};

const CAT_COLORS: Record<string, string> = {
  codigo:    '#0ea5e9',
  startups:  '#8b5cf6',
  ia:        '#06b6d4',
  design:    '#ec4899',
  carreira:  '#f59e0b',
  tutoriais: '#10b981',
  noticias:  '#64748b',
};

export default function AdminRevistaPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchStories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/revista/historias?status=${filter}&limit=50`);
      const data = await res.json();
      if (data.success) setStories(data.stories);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchStories(); }, [fetchStories]);

  const handleDelete = async (id: string) => {
    if (!confirm('Remover esta história permanentemente?')) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/revista/historias/${id}`, { method: 'DELETE' });
      fetchStories();
    } catch (e) {
      alert('Erro ao remover.');
    } finally {
      setDeleting(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/admin/revista/historias/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchStories();
      setStatusDropdown(null);
    } catch { alert('Erro ao alterar status.'); }
  };

  const handleFeature = async (id: string, featured: boolean) => {
    try {
      await fetch(`/api/admin/revista/historias/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !featured }),
      });
      fetchStories();
    } catch { alert('Erro ao atualizar.'); }
  };

  const filtered = stories.filter(s => {
    const q = search.toLowerCase();
    return !q || s.title.toLowerCase().includes(q) || s.author?.name?.toLowerCase().includes(q);
  });

  const stats = {
    total:     stories.length,
    published: stories.filter(s => s.status === 'published').length,
    draft:     stories.filter(s => s.status === 'draft').length,
    views:     stories.reduce((acc, s) => acc + (s.views || 0), 0),
  };

  return (
    <>
      <style>{`
        .admin-revista { font-family: 'Poppins', sans-serif; min-height: 100vh; background: #f8fafc; }

        /* Header */
        .ar-header {
          background: #fff; border-bottom: 1px solid #e2e8f0;
          padding: 1.25rem 2rem;
          display: flex; align-items: center; justify-content: space-between;
        }
        .ar-header-left { display: flex; align-items: center; gap: 1rem; }
        .ar-back {
          display: flex; align-items: center; gap: 0.4rem;
          color: #64748b; text-decoration: none; font-size: 0.82rem;
          transition: color 0.2s;
        }
        .ar-back:hover { color: #0ea5e9; }
        .ar-brand { display: flex; align-items: center; gap: 0.5rem; }
        .ar-brand-text { font-size: 1.1rem; font-weight: 800; color: #0f172a; letter-spacing: -0.03em; }
        .ar-brand-text span { color: #0ea5e9; }
        .ar-new-btn {
          display: flex; align-items: center; gap: 0.4rem;
          background: linear-gradient(135deg, #0ea5e9, #0284c7);
          color: #fff; text-decoration: none;
          padding: 0.55rem 1.1rem; border-radius: 9px;
          font-size: 0.83rem; font-weight: 600;
          box-shadow: 0 2px 8px rgba(14,165,233,0.3);
          transition: all 0.2s;
        }
        .ar-new-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(14,165,233,0.4); }

        /* Stats */
        .ar-stats {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;
          max-width: 1100px; margin: 2rem auto 0; padding: 0 2rem;
        }
        .ar-stat {
          background: #fff; border-radius: 12px; padding: 1.25rem 1.5rem;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        }
        .ar-stat-val { font-size: 1.8rem; font-weight: 800; color: #0f172a; }
        .ar-stat-label { font-size: 0.75rem; color: #64748b; margin-top: 0.15rem; font-weight: 500; }

        /* Toolbar */
        .ar-toolbar {
          max-width: 1100px; margin: 1.5rem auto 0; padding: 0 2rem;
          display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
        }
        .ar-filter-btn {
          padding: 0.4rem 0.9rem; border-radius: 9999px;
          font-size: 0.78rem; font-weight: 600; cursor: pointer;
          border: 2px solid #e2e8f0; background: #fff; color: #475569;
          font-family: 'Poppins', sans-serif;
          transition: all 0.2s;
        }
        .ar-filter-btn.active { background: #0f172a; border-color: #0f172a; color: #fff; }
        .ar-filter-btn:not(.active):hover { border-color: #0ea5e9; color: #0ea5e9; }
        .ar-search {
          margin-left: auto; position: relative;
        }
        .ar-search input {
          padding: 0.45rem 1rem 0.45rem 2.2rem;
          border: 1.5px solid #e2e8f0; border-radius: 8px;
          font-size: 0.82rem; font-family: 'Poppins', sans-serif;
          background: #fff; color: #0f172a; outline: none;
          transition: border-color 0.2s; width: 220px;
        }
        .ar-search input:focus { border-color: #0ea5e9; }
        .ar-search-icon {
          position: absolute; left: 0.6rem; top: 50%; transform: translateY(-50%);
          color: #94a3b8;
        }

        /* Table */
        .ar-table-wrap {
          max-width: 1100px; margin: 1.5rem auto 3rem; padding: 0 2rem;
        }
        .ar-table {
          width: 100%; background: #fff; border-radius: 14px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06); border-collapse: collapse;
          overflow: hidden;
        }
        .ar-table thead { background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        .ar-table th {
          padding: 0.85rem 1.25rem; text-align: left;
          font-size: 0.72rem; font-weight: 700; color: #64748b;
          letter-spacing: 0.07em; text-transform: uppercase;
        }
        .ar-table td {
          padding: 1rem 1.25rem; border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }
        .ar-table tr:last-child td { border-bottom: none; }
        .ar-table tr:hover td { background: #f8fafc; }

        .ar-title-cell { font-weight: 600; font-size: 0.88rem; color: #0f172a; max-width: 260px; }
        .ar-title-cell .ar-excerpt {
          font-weight: 400; font-size: 0.76rem; color: #94a3b8;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .ar-cat-badge {
          font-size: 0.65rem; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; padding: 0.2rem 0.6rem;
          border-radius: 9999px; background: #f0f9ff; color: #0ea5e9;
          border: 1px solid #bae6fd;
          display: inline-block;
        }
        .ar-status-wrap { position: relative; display: inline-block; }
        .ar-status-btn {
          display: flex; align-items: center; gap: 0.35rem;
          padding: 0.25rem 0.7rem; border-radius: 9999px;
          font-size: 0.72rem; font-weight: 600; cursor: pointer;
          border: 1.5px solid; font-family: 'Poppins', sans-serif;
          background: transparent; transition: opacity 0.2s;
        }
        .ar-status-btn:hover { opacity: 0.75; }
        .ar-status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .ar-status-dropdown {
          position: absolute; top: calc(100% + 6px); left: 0; z-index: 99;
          background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.1); min-width: 140px; overflow: hidden;
        }
        .ar-status-option {
          padding: 0.6rem 1rem; font-size: 0.8rem; cursor: pointer;
          font-family: 'Poppins', sans-serif; color: #334155;
          transition: background 0.15s;
        }
        .ar-status-option:hover { background: #f0f9ff; color: #0ea5e9; }

        .ar-actions { display: flex; align-items: center; gap: 0.4rem; }
        .ar-action-btn {
          display: flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border-radius: 8px;
          border: 1px solid #e2e8f0; background: #fff; cursor: pointer;
          color: #475569; transition: all 0.2s; text-decoration: none;
        }
        .ar-action-btn:hover { background: #f0f9ff; color: #0ea5e9; border-color: #bae6fd; }
        .ar-action-btn.danger:hover { background: #fff5f5; color: #ef4444; border-color: #fecaca; }
        .ar-action-btn.feature-active { background: #fef3c7; color: #d97706; border-color: #fde68a; }

        .ar-empty { text-align: center; padding: 4rem 1rem; color: #94a3b8; }
        .ar-spinner {
          width: 32px; height: 32px;
          border: 3px solid #e2e8f0; border-top-color: #0ea5e9;
          border-radius: 50%; animation: spin 0.7s linear infinite;
          margin: 3rem auto;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 768px) {
          .ar-stats { grid-template-columns: repeat(2, 1fr); }
          .ar-table-wrap { padding: 0 1rem; }
          .ar-table { display: block; overflow-x: auto; }
        }
      `}</style>

      <div className="admin-revista" onClick={() => setStatusDropdown(null)}>
        {/* Header */}
        <div className="ar-header">
          <div className="ar-header-left">
            <Link href="/admin" className="ar-back">
              <ArrowLeft size={15} /> Admin
            </Link>
            <div className="ar-brand">
              <Code2 size={18} color="#0ea5e9" />
              <span className="ar-brand-text">
                codando <span>histórias</span>
              </span>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>— gestão da revista</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link href="/revista" target="_blank" className="ar-action-btn" style={{ width: 'auto', padding: '0.4rem 0.85rem', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 500 }}>
              <Eye size={14} /> Ver Revista
            </Link>
            <Link href="/admin/revista/nova" className="ar-new-btn">
              <Plus size={16} /> Nova História
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="ar-stats">
          <div className="ar-stat">
            <div className="ar-stat-val">{stats.total}</div>
            <div className="ar-stat-label">Total de Histórias</div>
          </div>
          <div className="ar-stat">
            <div className="ar-stat-val" style={{ color: '#10b981' }}>{stats.published}</div>
            <div className="ar-stat-label">Publicadas</div>
          </div>
          <div className="ar-stat">
            <div className="ar-stat-val" style={{ color: '#f59e0b' }}>{stats.draft}</div>
            <div className="ar-stat-label">Rascunhos</div>
          </div>
          <div className="ar-stat">
            <div className="ar-stat-val" style={{ color: '#0ea5e9' }}>{stats.views.toLocaleString()}</div>
            <div className="ar-stat-label">Total de Leituras</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="ar-toolbar">
          {['all', 'published', 'draft', 'archived'].map(f => (
            <button
              key={f}
              className={`ar-filter-btn${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Todas' : STATUS_LABELS[f] || f}
            </button>
          ))}
          <div className="ar-search">
            <Search size={14} className="ar-search-icon" />
            <input
              type="text"
              placeholder="Pesquisar histórias..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="ar-table-wrap">
          {loading ? (
            <div className="ar-spinner" />
          ) : filtered.length === 0 ? (
            <div className="ar-empty">
              <BookOpen size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
              <p>Nenhuma história encontrada.</p>
              <Link href="/admin/revista/nova" className="ar-new-btn" style={{ display: 'inline-flex', marginTop: '1rem' }}>
                <Plus size={15} /> Criar primeira história
              </Link>
            </div>
          ) : (
            <table className="ar-table">
              <thead>
                <tr>
                  <th>História</th>
                  <th>Categoria</th>
                  <th>Autor</th>
                  <th>Status</th>
                  <th>Leituras</th>
                  <th>Acções</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(story => (
                  <tr key={story.id}>
                    {/* Title */}
                    <td>
                      <div className="ar-title-cell">
                        {story.featured && (
                          <Star size={11} color="#d97706" style={{ marginRight: 4, verticalAlign: 'middle' }} />
                        )}
                        {story.title}
                        <div className="ar-excerpt">{story.excerpt}</div>
                      </div>
                    </td>

                    {/* Category */}
                    <td>
                      <span
                        className="ar-cat-badge"
                        style={{ color: CAT_COLORS[story.category] || '#0ea5e9', background: `${CAT_COLORS[story.category] || '#0ea5e9'}15`, borderColor: `${CAT_COLORS[story.category] || '#0ea5e9'}40` }}
                      >
                        {story.category}
                      </span>
                    </td>

                    {/* Author */}
                    <td style={{ fontSize: '0.82rem', color: '#475569' }}>{story.author?.name}</td>

                    {/* Status */}
                    <td onClick={e => e.stopPropagation()}>
                      <div className="ar-status-wrap">
                        <button
                          className="ar-status-btn"
                          style={{
                            color: STATUS_COLORS[story.status] || '#94a3b8',
                            borderColor: `${STATUS_COLORS[story.status] || '#94a3b8'}40`,
                          }}
                          onClick={() => setStatusDropdown(statusDropdown === story.id ? null : story.id)}
                        >
                          <span className="ar-status-dot" style={{ background: STATUS_COLORS[story.status] || '#94a3b8' }} />
                          {STATUS_LABELS[story.status] || story.status}
                          <ChevronDown size={11} />
                        </button>
                        {statusDropdown === story.id && (
                          <div className="ar-status-dropdown">
                            {['published', 'draft', 'archived'].map(s => (
                              <div
                                key={s}
                                className="ar-status-option"
                                onClick={() => handleStatusChange(story.id, s)}
                              >
                                {STATUS_LABELS[s]}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Views */}
                    <td style={{ fontSize: '0.85rem', color: '#475569' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Eye size={13} color="#94a3b8" /> {story.views}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="ar-actions">
                        <button
                          className={`ar-action-btn${story.featured ? ' feature-active' : ''}`}
                          onClick={() => handleFeature(story.id, story.featured)}
                          title={story.featured ? 'Remover destaque' : 'Marcar como destaque'}
                        >
                          <Star size={14} />
                        </button>
                        <Link
                          href={`/revista/${story.slug}`}
                          target="_blank"
                          className="ar-action-btn"
                          title="Ver história"
                        >
                          <Eye size={14} />
                        </Link>
                        <Link
                          href={`/admin/revista/editar/${story.id}`}
                          className="ar-action-btn"
                          title="Editar"
                        >
                          <Edit size={14} />
                        </Link>
                        <button
                          className="ar-action-btn danger"
                          onClick={() => handleDelete(story.id)}
                          disabled={deleting === story.id}
                          title="Remover"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
