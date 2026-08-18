'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, User, Tag, ArrowLeft, Share2, Eye, Facebook, Twitter, Linkedin, MessageCircle, EyeOff } from 'lucide-react';

// Hook de efeito de digitação
function useTypingEffect(text: string, speed: number = 50) {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayText('');
    setIsComplete(false);

    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayText((prev) => prev + text.charAt(index));
        index++;
      } else {
        clearInterval(interval);
        setIsComplete(true);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return { displayText, isComplete };
}

// Hook de efeito de scroll reveal
function useScrollReveal(enabled: boolean = true) {
  const [visibleSections, setVisibleSections] = useState<Set<number>>(new Set());
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) {
      // Se desabilitado, mostrar tudo imediatamente
      const sections = contentRef.current?.querySelectorAll('.scroll-section');
      if (sections) {
        const allIndices = Array.from({ length: sections.length }, (_, i) => i);
        setVisibleSections(new Set(allIndices));
      }
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            setVisibleSections((prev) => new Set([...prev, index]));
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
      }
    );

    const sections = contentRef.current?.querySelectorAll('.scroll-section');
    sections?.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [enabled]);

  return { contentRef, visibleSections };
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: { name: string };
  category: string;
  tags: string[];
  publishedAt: string;
  views: number;
  featured: boolean;
}

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scrollRevealEnabled, setScrollRevealEnabled] = useState(true);
  
  // Efeito de digitação no título
  const { displayText: typedTitle, isComplete: titleComplete } = useTypingEffect(post?.title || '', 30);
  
  // Efeito de scroll reveal
  const { contentRef, visibleSections } = useScrollReveal(scrollRevealEnabled);

  useEffect(() => {
    if (params.slug) {
      fetchPost(params.slug as string);
    }
  }, [params.slug]);

  const fetchPost = async (slug: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Buscar post por slug
      const response = await fetch(`/api/admin/blog/posts?status=published&limit=100`);
      const data = await response.json();
      
      if (data.success) {
        const foundPost = data.posts.find((p: BlogPost) => p.slug === slug);
        
        if (foundPost) {
          setPost(foundPost);
        } else {
          setError('Post não encontrado');
        }
      } else {
        setError('Erro ao buscar post');
      }
    } catch (error) {
      console.error('Erro ao buscar post:', error);
      setError('Erro ao carregar post');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      news: 'Notícias',
      tutorial: 'Tutoriais',
      announcement: 'Anúncios',
      update: 'Atualizações',
      feature: 'Funcionalidades'
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      news: 'bg-blue-100 text-blue-800',
      tutorial: 'bg-green-100 text-green-800',
      announcement: 'bg-purple-100 text-purple-800',
      update: 'bg-orange-100 text-orange-800',
      feature: 'bg-pink-100 text-pink-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const sharePost = () => {
    if (typeof window !== 'undefined' && post) {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };

  const shareToFacebook = () => {
    if (typeof window !== 'undefined' && post) {
      const url = encodeURIComponent(window.location.href);
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    }
  };

  const shareToTwitter = () => {
    if (typeof window !== 'undefined' && post) {
      const url = encodeURIComponent(window.location.href);
      const text = encodeURIComponent(post.title);
      window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
    }
  };

  const shareToLinkedIn = () => {
    if (typeof window !== 'undefined' && post) {
      const url = encodeURIComponent(window.location.href);
      const title = encodeURIComponent(post.title);
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}`, '_blank');
    }
  };

  const shareToWhatsApp = () => {
    if (typeof window !== 'undefined' && post) {
      const url = encodeURIComponent(window.location.href);
      const text = encodeURIComponent(`${post.title} - ${window.location.href}`);
      window.open(`https://wa.me/?text=${text}`, '_blank');
    }
  };

  // Dividir conteúdo em seções para scroll reveal
  const splitContentIntoSections = (content: string): string[] => {
    // Dividir por parágrafos, headings, ou blocos de conteúdo
    const sections = content.split(/(<\/?[a-z][a-z0-9]*[^>]*>)/gi);
    const result: string[] = [];
    let currentSection = '';
    
    for (let i = 0; i < sections.length; i++) {
      currentSection += sections[i];
      
      // Se atingir um tamanho razoável ou encontrar um fechamento de tag importante
      if (currentSection.length > 300 || (sections[i].match(/<\/[ph][1-6]>/i))) {
        result.push(currentSection.trim());
        currentSection = '';
      }
    }
    
    if (currentSection.trim()) {
      result.push(currentSection.trim());
    }
    
    return result.filter(s => s.length > 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{error || 'Post não encontrado'}</h1>
          <Link href="/blog" className="text-blue-600 hover:text-blue-700 flex items-center justify-center gap-2">
            <ArrowLeft size={20} />
            Voltar para o blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/blog" className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
            <ArrowLeft size={20} />
            Voltar para o blog
          </Link>
        </div>
      </div>

      {/* Post Content */}
      <article className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Cover Image */}
        {post.coverImage && (
          <div className="mb-8 rounded-lg overflow-hidden">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-auto object-contain max-h-96 mx-auto"
            />
          </div>
        )}

        {/* Post Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(post.category)}`}>
              {getCategoryLabel(post.category)}
            </span>
            {post.featured && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                Em Destaque
              </span>
            )}
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {typedTitle}
            <span className="inline-block w-0.5 h-8 bg-blue-600 ml-1 animate-pulse" />
          </h1>

          <div className="flex items-center gap-6 text-gray-600">
            <span className="flex items-center gap-2">
              <User size={18} />
              {post.author.name}
            </span>
            <span className="flex items-center gap-2">
              <Calendar size={18} />
              {new Date(post.publishedAt).toLocaleDateString('pt-MZ', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </span>
            <span className="flex items-center gap-2">
              <Eye size={18} />
              {post.views} visualizações
            </span>
          </div>

          {post.tags.length > 0 && (
            <div className="flex items-center gap-2 mt-4">
              <Tag size={18} className="text-gray-600" />
              <div className="flex gap-2 flex-wrap">
                {post.tags.map((tag, index) => (
                  <span key={index} className="text-sm text-gray-600">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Share Buttons */}
        <div className="mb-8 flex flex-wrap items-center justify-end gap-3">
          <button
            onClick={sharePost}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            title="Copiar link"
          >
            <Share2 size={18} />
            <span className="hidden sm:inline">Copiar Link</span>
          </button>
          <button
            onClick={shareToFacebook}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            title="Compartilhar no Facebook"
          >
            <Facebook size={18} />
            <span className="hidden sm:inline">Facebook</span>
          </button>
          <button
            onClick={shareToTwitter}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors"
            title="Compartilhar no Twitter"
          >
            <Twitter size={18} />
            <span className="hidden sm:inline">Twitter</span>
          </button>
          <button
            onClick={shareToLinkedIn}
            className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors"
            title="Compartilhar no LinkedIn"
          >
            <Linkedin size={18} />
            <span className="hidden sm:inline">LinkedIn</span>
          </button>
          <button
            onClick={shareToWhatsApp}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            title="Compartilhar no WhatsApp"
          >
            <MessageCircle size={18} />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>
          <button
            onClick={() => setScrollRevealEnabled(!scrollRevealEnabled)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            title={scrollRevealEnabled ? "Mostrar todo o conteúdo" : "Ativar efeito de scroll"}
          >
            {scrollRevealEnabled ? <EyeOff size={18} /> : <Eye size={18} />}
            <span className="hidden sm:inline">{scrollRevealEnabled ? "Ver Tudo" : "Scroll Reveal"}</span>
          </button>
        </div>

        {/* Post Content */}
        <div className="prose prose-lg max-w-none bg-white p-8 rounded-lg shadow-sm overflow-visible">
          {post.content ? (
            <div ref={contentRef} className="whitespace-pre-wrap break-words">
              {scrollRevealEnabled ? (
                // Modo scroll reveal - conteúdo dividido em seções
                splitContentIntoSections(post.content).map((section, index) => (
                  <div
                    key={index}
                    data-index={index}
                    className={`scroll-section transition-all duration-700 ease-out ${
                      visibleSections.has(index)
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-8'
                    }`}
                    dangerouslySetInnerHTML={{ __html: section }}
                  />
                ))
              ) : (
                // Modo normal - conteúdo completo
                <div dangerouslySetInnerHTML={{ __html: post.content }} />
              )}
            </div>
          ) : (
            <div className="text-gray-500">Conteúdo não disponível</div>
          )}
        </div>

        {/* Excerpt */}
        <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-bold text-blue-900 mb-2">Resumo</h3>
          <p className="text-blue-800">{post.excerpt}</p>
        </div>

        {/* Related Posts */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Posts Relacionados</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6">
                <div className="h-32 bg-gray-200 rounded mb-4"></div>
                <h3 className="font-bold mb-2">Post relacionado {i}</h3>
                <p className="text-gray-600 text-sm">Breve descrição do post relacionado...</p>
              </div>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}
