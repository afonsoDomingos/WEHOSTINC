'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Send, CheckCircle2, Upload, Sparkles, BookOpen,
  Code2, Eye, User, FileText, Image as ImageIcon, Clock, Check, HelpCircle
} from 'lucide-react';

const CATEGORIES = [
  { value: 'codigo', label: 'Código & Arquitectura', desc: 'Linguagens, frameworks, boas práticas, APIs e tutoriais técnicos' },
  { value: 'startups', label: 'Startups & Produtos', desc: 'Criação de produtos digitais, validação, monetização e SaaS' },
  { value: 'ia', label: 'IA & Machine Learning', desc: 'Modelos, automação, engenharia de prompts e novidades em IA' },
  { value: 'design', label: 'Design & UI/UX', desc: 'Interfaces, experiência do utilizador, tipografia e boas práticas' },
  { value: 'carreira', label: 'Carreira & Trabalho Remoto', desc: 'Vagas, entrevistas, crescimento profissional e trabalho para o exterior' },
  { value: 'tutoriais', label: 'Guias Práticos', desc: 'Passo a passo prático para resolver problemas reais de tech' },
  { value: 'noticias', label: 'Ecossistema & Notícias', desc: 'Acontecimentos, eventos e novidades tech em Moçambique' },
];

const DEFAULT_CONTENT_TEMPLATE = `## O Início / O Desafio
Partilha o problema ou a situação inicial que enfrentaste. O que te motivou a iniciar este projecto, aprender esta tecnologia ou procurar esta oportunidade?

> "Coloca aqui uma citação marcante ou a lição central da tua história."

## A Solução e Abordagem
Explica o que fizeste, que tecnologias ou ferramentas usaste (ex: Next.js, Python, Tailwind, Docker, etc.) e as decisões mais difíceis que tomaste pelo caminho.

* Ponto chave 1 da implementação
* Ponto chave 2 sobre um obstáculo superado
* Ponto chave 3 sobre o resultado obtido

## O Que Aprendi
1. **Lição Principal:** O que farias diferente se começasses hoje?
2. **Impacto:** Como isto mudou a tua forma de pensar código ou negócios?

## Conclusão
O conselho final que gostarias de deixar para a comunidade de desenvolvedores e criadores em Moçambique...`;

export default function SubmeterHistoriaPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdStory, setCreatedStory] = useState<{ id: string; slug: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    highlightText: '',
    excerpt: '',
    category: 'codigo',
    tags: '',
    coverImage: '',
    content: DEFAULT_CONTENT_TEMPLATE,
    author: {
      name: '',
      email: '',
      bio: '',
      avatar: '',
      website: '',
      socials: {
        linkedin: '',
        github: '',
        twitter: '',
        instagram: '',
      },
    },
  });

  const setField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrorMsg('');
  };

  const setAuthorField = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      author: { ...prev.author, [field]: value },
    }));
    setErrorMsg('');
  };

  const setAuthorSocial = (network: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      author: {
        ...prev.author,
        socials: { ...prev.author.socials, [network]: value },
      },
    }));
  };

  const wordCount = useMemo(() => {
    return (formData.content || '').split(/\s+/).filter(Boolean).length;
  }, [formData.content]);

  const readTimeEstimate = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 200));
  }, [wordCount]);

  const handleUpload = async (file: File, type: 'cover' | 'avatar') => {
    const isCover = type === 'cover';
    if (isCover) setUploadingCover(true);
    else setUploadingAvatar(true);

    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) {
        if (isCover) setField('coverImage', data.url);
        else setAuthorField('avatar', data.url);
      } else {
        alert(data.error || 'Erro ao carregar ficheiro.');
      }
    } catch {
      alert('Erro de conexão durante o upload.');
    } finally {
      if (isCover) setUploadingCover(false);
      else setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.title.trim()) {
      setErrorMsg('Por favor indica um título para a tua história.');
      return;
    }
    if (!formData.excerpt.trim()) {
      setErrorMsg('Por favor escreve um resumo curto de 1 a 2 frases para o cartão da revista.');
      return;
    }
    if (!formData.author.name.trim()) {
      setErrorMsg('Por favor indica o teu nome ou nome profissional de autor.');
      return;
    }
    if (!formData.author.email.trim() || !formData.author.email.includes('@')) {
      setErrorMsg('Por favor indica um e-mail válido para que possamos avisar-te quando a história for publicada.');
      return;
    }
    if (wordCount < 40) {
      setErrorMsg('O conteúdo parece demasiado curto. Escreve pelo menos alguns parágrafos para que a equipa editorial possa avaliar.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/revista/submeter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success && data.story) {
        setCreatedStory(data.story);
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setErrorMsg(data.error || 'Erro ao enviar a história. Tenta novamente.');
      }
    } catch {
      setErrorMsg('Erro de conexão ao enviar a história. Verifica a tua internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .submeter-page { font-family: 'Poppins', sans-serif; background: #f8fafc; min-height: 100vh; color: #0f172a; }
        
        .sub-nav {
          background: #ffffff; border-bottom: 1px solid #e2e8f0;
          position: sticky; top: 0; z-index: 50;
        }
        .sub-nav-inner {
          max-width: 1060px; margin: 0 auto; padding: 0 1.5rem;
          height: 64px; display: flex; align-items: center; justify-content: space-between;
        }
        .sub-nav-back {
          display: inline-flex; align-items: center; gap: 0.5rem;
          color: #64748b; text-decoration: none; font-size: 0.85rem; font-weight: 600;
          transition: color 0.2s;
        }
        .sub-nav-back:hover { color: #7B2CBF; }
        
        .sub-hero {
          background: linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 50%, #ffffff 100%);
          border-bottom: 1px solid #E0AAFF;
          padding: 3.5rem 1.5rem 2.5rem; text-align: center;
        }
        .sub-hero-badge {
          display: inline-flex; align-items: center; gap: 0.4rem;
          background: #7B2CBF; color: #fff; font-size: 0.75rem; font-weight: 700;
          padding: 0.3rem 0.85rem; border-radius: 9999px; text-transform: uppercase;
          letter-spacing: 0.06em; margin-bottom: 1rem;
        }
        .sub-hero-title {
          font-size: 2.2rem; font-weight: 800; color: #0f172a;
          letter-spacing: -0.03em; margin: 0 0 0.75rem; line-height: 1.2;
        }
        .sub-hero-title span { color: #7B2CBF; }
        .sub-hero-desc {
          max-width: 620px; margin: 0 auto; font-size: 0.95rem; color: #475569; line-height: 1.6;
        }

        .sub-container {
          max-width: 900px; margin: 2.5rem auto 4rem; padding: 0 1.5rem;
        }

        .sub-card {
          background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;
          padding: 2rem; margin-bottom: 2rem; box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .sub-card-header {
          display: flex; align-items: center; gap: 0.6rem;
          padding-bottom: 1rem; margin-bottom: 1.5rem; border-bottom: 1px solid #f1f5f9;
        }
        .sub-card-num {
          width: 28px; height: 28px; border-radius: 8px;
          background: #FAF5FF; color: #7B2CBF; border: 1px solid #E0AAFF;
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 0.82rem;
        }
        .sub-card-title {
          font-size: 1.1rem; font-weight: 700; color: #0f172a; margin: 0;
        }

        .form-group { margin-bottom: 1.35rem; }
        .form-label {
          display: block; font-size: 0.83rem; font-weight: 600; color: #334155;
          margin-bottom: 0.4rem;
        }
        .form-hint {
          font-size: 0.75rem; color: #94a3b8; margin-top: 0.35rem; line-height: 1.4;
        }
        .form-input, .form-textarea, .form-select {
          width: 100%; padding: 0.65rem 0.9rem; border-radius: 10px;
          border: 1.5px solid #cbd5e1; background: #ffffff; font-family: 'Poppins', sans-serif;
          font-size: 0.88rem; color: #0f172a; outline: none; transition: all 0.2s;
        }
        .form-input:focus, .form-textarea:focus, .form-select:focus {
          border-color: #7B2CBF; box-shadow: 0 0 0 3px rgba(123,44,191,0.12);
        }
        .form-textarea { min-height: 90px; resize: vertical; line-height: 1.5; }
        .form-textarea.editor { min-height: 380px; font-family: 'Menlo', 'Monaco', 'Courier New', monospace; font-size: 0.84rem; line-height: 1.6; }

        .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        @media (max-width: 640px) {
          .form-grid-2 { grid-template-columns: 1fr; }
          .sub-hero-title { font-size: 1.7rem; }
          .sub-card { padding: 1.25rem; }
        }

        .editor-tabs {
          display: flex; gap: 0.5rem; margin-bottom: 0.75rem;
        }
        .editor-tab-btn {
          display: flex; align-items: center; gap: 0.4rem;
          padding: 0.4rem 0.9rem; border-radius: 8px; border: 1px solid #e2e8f0;
          background: #f8fafc; font-size: 0.8rem; font-weight: 600; color: #64748b;
          cursor: pointer; transition: all 0.2s;
        }
        .editor-tab-btn.active {
          background: #7B2CBF; color: #ffffff; border-color: #7B2CBF;
        }

        .preview-box {
          background: #ffffff; border: 1.5px dashed #cbd5e1; border-radius: 12px;
          padding: 1.5rem; min-height: 320px; font-size: 0.9rem; line-height: 1.7;
          color: #334155;
        }
        .preview-box h2 {
          font-size: 1.25rem; font-weight: 700; color: #0f172a; margin: 1.5rem 0 0.6rem;
          border-bottom: 1px solid #f1f5f9; padding-bottom: 0.3rem;
        }
        .preview-box h2:first-child { margin-top: 0; }
        .preview-box blockquote {
          border-left: 3px solid #7B2CBF; background: #FAF5FF; padding: 0.8rem 1.2rem;
          margin: 1.2rem 0; border-radius: 0 8px 8px 0; font-style: italic; color: #5A189A;
        }
        .preview-box ul, .preview-box ol { padding-left: 1.4rem; margin: 0.8rem 0; }

        .submit-btn {
          width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.6rem;
          background: linear-gradient(135deg, #7B2CBF 0%, #5A189A 100%);
          color: #ffffff; font-weight: 700; font-size: 1.05rem;
          padding: 1rem 2rem; border-radius: 12px; border: none; cursor: pointer;
          box-shadow: 0 4px 18px rgba(123,44,191,0.3); transition: all 0.2s;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px); box-shadow: 0 8px 24px rgba(123,44,191,0.4);
        }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .upload-dropzone {
          border: 1.5px dashed #cbd5e1; border-radius: 10px; padding: 1.25rem;
          background: #f8fafc; text-align: center; cursor: pointer; transition: all 0.2s;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
        }
        .upload-dropzone:hover { border-color: #7B2CBF; background: #FAF5FF; }

        .success-card {
          background: #ffffff; border: 2px solid #10b981; border-radius: 20px;
          padding: 3rem 2rem; text-align: center; max-width: 650px; margin: 3rem auto;
          box-shadow: 0 8px 30px rgba(16,185,129,0.12);
        }
      `}</style>

      <div className="submeter-page">
        {/* Navigation */}
        <nav className="sub-nav">
          <div className="sub-nav-inner">
            <Link href="/revista" className="sub-nav-back">
              <ArrowLeft size={16} /> Voltar à Revista
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.95rem' }}>
              <span>WEHOSTHERE</span>
              <span style={{ color: '#7B2CBF' }}>• CODANDO HISTÓRIAS</span>
            </div>
          </div>
        </nav>

        {submitted ? (
          /* Tela de Sucesso */
          <div className="sub-container">
            <div className="success-card">
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <CheckCircle2 size={36} />
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem' }}>
                História Submetida com Sucesso! 🎉
              </h2>
              <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: 500, margin: '0 auto 1.5rem' }}>
                Muito obrigado por partilhares a tua jornada com a comunidade, <strong>{formData.author.name}</strong>. A nossa equipa editorial irá analisar a história e notificar-te em <strong>{formData.author.email}</strong>.
              </p>

              <div style={{ background: '#FAF5FF', border: '1px solid #E0AAFF', borderRadius: '12px', padding: '1.25rem', textAlign: 'left', maxWidth: 480, margin: '0 auto 2rem' }}>
                <div style={{ fontWeight: 700, color: '#5A189A', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  O que acontece agora?
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', color: '#475569', lineHeight: 1.6 }}>
                  <li>A tua história está registrada com status <strong>Pendente de Revisão</strong>.</li>
                  <li>O administrador irá rever a formatação e aprovar no painel.</li>
                  <li>Assim que estiver no ar, recebes um e-mail com o link público definitivo!</li>
                </ul>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link
                  href="/revista"
                  style={{
                    background: '#7B2CBF', color: '#fff', padding: '0.75rem 1.6rem',
                    borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem',
                    boxShadow: '0 4px 12px rgba(123,44,191,0.25)',
                  }}
                >
                  Voltar à Revista
                </Link>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({
                      title: '',
                      highlightText: '',
                      excerpt: '',
                      category: 'codigo',
                      tags: '',
                      coverImage: '',
                      content: DEFAULT_CONTENT_TEMPLATE,
                      author: {
                        name: '',
                        email: '',
                        bio: '',
                        avatar: '',
                        website: '',
                        socials: { linkedin: '', github: '', twitter: '', instagram: '' },
                      },
                    });
                  }}
                  style={{
                    background: '#fff', color: '#475569', border: '1px solid #cbd5e1',
                    padding: '0.75rem 1.6rem', borderRadius: '10px', fontWeight: 600, fontSize: '0.9rem',
                    cursor: 'pointer',
                  }}
                >
                  Submeter Outra História
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Formulário de Submissão */
          <>
            <header className="sub-hero">
              <div className="sub-hero-badge">
                <Sparkles size={12} /> Espaço da Comunidade
              </div>
              <h1 className="sub-hero-title">
                Conta a Tua História na <span>Codando Histórias</span>
              </h1>
              <p className="sub-hero-desc">
                És programador, designer, fundador de startup ou entusiasta tech? Partilha o teu projecto, erros e lições reais. O teu conhecimento inspira outros criadores em Moçambique.
              </p>
            </header>

            <main className="sub-container">
              <form onSubmit={handleSubmit}>
                {errorMsg && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '1rem 1.25rem', borderRadius: '12px', fontSize: '0.85rem', marginBottom: '1.5rem', fontWeight: 600 }}>
                    ⚠️ {errorMsg}
                  </div>
                )}

                {/* Passo 1: O Autor */}
                <div className="sub-card">
                  <div className="sub-card-header">
                    <span className="sub-card-num">1</span>
                    <h2 className="sub-card-title">Quem És Tu? (Dados do Autor)</h2>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">O Teu Nome Completo ou Profissional *</label>
                      <input
                        className="form-input"
                        type="text"
                        placeholder="Ex: Afonso Domingos ou Maria Cossa"
                        value={formData.author.name}
                        onChange={e => setAuthorField('name', e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">O Teu E-mail *</label>
                      <input
                        className="form-input"
                        type="email"
                        placeholder="exemplo@gmail.com"
                        value={formData.author.email}
                        onChange={e => setAuthorField('email', e.target.value)}
                        required
                      />
                      <p className="form-hint">Usaremos apenas para te avisar quando o artigo for aprovado.</p>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Bio Curta (1 a 2 frases)</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Ex: Frontend Developer em Maputo, apaixonado por Next.js, interfaces limpas e código aberto."
                      value={formData.author.bio}
                      onChange={e => setAuthorField('bio', e.target.value)}
                    />
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Foto de Perfil / Avatar</label>
                      <div className="upload-dropzone">
                        <input
                          type="file"
                          accept="image/*"
                          id="avatar-file"
                          style={{ display: 'none' }}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleUpload(file, 'avatar');
                          }}
                        />
                        <label htmlFor="avatar-file" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <User size={22} color="#7B2CBF" style={{ marginBottom: 4 }} />
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#7B2CBF' }}>
                            {uploadingAvatar ? 'A carregar foto...' : formData.author.avatar ? 'Foto carregada ✓ (clica para trocar)' : 'Carregar foto de perfil'}
                          </span>
                        </label>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Website Pessoal ou Portfólio</label>
                      <input
                        className="form-input"
                        type="text"
                        placeholder="https://oseusite.com"
                        value={formData.author.website}
                        onChange={e => setAuthorField('website', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Redes Sociais */}
                  <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                    <label className="form-label" style={{ marginBottom: '0.75rem', color: '#64748b' }}>
                      Redes Sociais (Opcional — exibidas no teu card de autor)
                    </label>
                    <div className="form-grid-2">
                      <input
                        className="form-input"
                        placeholder="LinkedIn (ex: https://linkedin.com/in/... ou username)"
                        value={formData.author.socials.linkedin}
                        onChange={e => setAuthorSocial('linkedin', e.target.value)}
                      />
                      <input
                        className="form-input"
                        placeholder="GitHub (ex: https://github.com/... ou username)"
                        value={formData.author.socials.github}
                        onChange={e => setAuthorSocial('github', e.target.value)}
                      />
                      <input
                        className="form-input"
                        placeholder="Twitter / X (@username)"
                        value={formData.author.socials.twitter}
                        onChange={e => setAuthorSocial('twitter', e.target.value)}
                      />
                      <input
                        className="form-input"
                        placeholder="Instagram (@username)"
                        value={formData.author.socials.instagram}
                        onChange={e => setAuthorSocial('instagram', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Passo 2: A História */}
                <div className="sub-card">
                  <div className="sub-card-header">
                    <span className="sub-card-num">2</span>
                    <h2 className="sub-card-title">Sobre a História</h2>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Título da História *</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="Ex: Como construí o meu primeiro SaaS com Next.js em 30 dias"
                      value={formData.title}
                      onChange={e => setField('title', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Palavra ou Frase em Destaque no Título</label>
                      <input
                        className="form-input"
                        type="text"
                        placeholder="Ex: primeiro SaaS"
                        value={formData.highlightText}
                        onChange={e => setField('highlightText', e.target.value)}
                      />
                      <p className="form-hint">Este trecho receberá o realce roxo característico da revista.</p>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Categoria Principal *</label>
                      <select
                        className="form-select"
                        value={formData.category}
                        onChange={e => setField('category', e.target.value)}
                      >
                        {CATEGORIES.map(c => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Resumo Impactante (1 a 2 frases) *</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Ex: Saí do zero, sem investimento externo, e em 30 dias lancei um produto que hoje gera receita. Aqui está o que aprendi pelo caminho."
                      value={formData.excerpt}
                      onChange={e => setField('excerpt', e.target.value)}
                      required
                    />
                    <p className="form-hint">Aparecerá nos cards da página inicial e nas redes sociais.</p>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Tags (separadas por vírgula)</label>
                      <input
                        className="form-input"
                        type="text"
                        placeholder="nextjs, saas, mozambique, react"
                        value={formData.tags}
                        onChange={e => setField('tags', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Imagem de Capa (Opcional)</label>
                      <div className="upload-dropzone">
                        <input
                          type="file"
                          accept="image/*"
                          id="cover-file"
                          style={{ display: 'none' }}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleUpload(file, 'cover');
                          }}
                        />
                        <label htmlFor="cover-file" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <ImageIcon size={22} color="#7B2CBF" style={{ marginBottom: 4 }} />
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#7B2CBF' }}>
                            {uploadingCover ? 'A carregar capa...' : formData.coverImage ? 'Imagem carregada ✓ (clica para trocar)' : 'Carregar imagem de capa'}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Passo 3: Conteúdo */}
                <div className="sub-card">
                  <div className="sub-card-header" style={{ justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span className="sub-card-num">3</span>
                      <h2 className="sub-card-title">O Conteúdo da História</h2>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.78rem', color: '#64748b' }}>
                      <span>📝 <strong>{wordCount}</strong> palavras</span>
                      <span>⏱ ~<strong>{readTimeEstimate} min</strong> de leitura</span>
                    </div>
                  </div>

                  <div className="editor-tabs">
                    <button
                      type="button"
                      className={`editor-tab-btn${activeTab === 'write' ? ' active' : ''}`}
                      onClick={() => setActiveTab('write')}
                    >
                      <Code2 size={13} /> Escrever (Markdown)
                    </button>
                    <button
                      type="button"
                      className={`editor-tab-btn${activeTab === 'preview' ? ' active' : ''}`}
                      onClick={() => setActiveTab('preview')}
                    >
                      <Eye size={13} /> Pré-visualizar Como Fica
                    </button>
                  </div>

                  {activeTab === 'write' ? (
                    <div>
                      <textarea
                        className="form-textarea editor"
                        value={formData.content}
                        onChange={e => setField('content', e.target.value)}
                        placeholder="Escreve aqui a tua história usando Markdown..."
                        required
                      />
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem', fontSize: '0.72rem', color: '#94a3b8' }}>
                        <span>💡 Dicas: Usa <code>## Subtítulo</code> para secções</span>
                        <span>• <code>&gt; Citação</code> para frases impactantes</span>
                        <span>• <code>* Lista</code> para tópicos</span>
                      </div>
                    </div>
                  ) : (
                    <div className="preview-box">
                      {formData.content.split('\n').map((line, idx) => {
                        const trimmed = line.trim();
                        if (!trimmed) return <div key={idx} style={{ height: 10 }} />;
                        if (trimmed.startsWith('## ')) {
                          return <h2 key={idx}>{trimmed.replace(/^##\s+/, '')}</h2>;
                        }
                        if (trimmed.startsWith('> ')) {
                          return <blockquote key={idx}>{trimmed.replace(/^>\s+/, '')}</blockquote>;
                        }
                        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                          return <li key={idx} style={{ marginLeft: '1rem' }}>{trimmed.replace(/^[\*\-]\s+/, '')}</li>;
                        }
                        return <p key={idx} style={{ margin: '0.5rem 0' }}>{trimmed}</p>;
                      })}
                    </div>
                  )}
                </div>

                {/* Submissão */}
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? (
                    <span>A enviar história para a redacção...</span>
                  ) : (
                    <>
                      <Send size={18} /> Submeter História para Revisão Editorial
                    </>
                  )}
                </button>

                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', marginTop: '1rem' }}>
                  Ao submeteres, concordas com a publicação do artigo na Revista Digital WEHOSTHERE "Codando Histórias" com os devidos créditos ao teu nome de autor.
                </p>
              </form>
            </main>
          </>
        )}
      </div>
    </>
  );
}
