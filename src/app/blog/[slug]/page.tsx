'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, User, Tag, ArrowLeft, Share2, Eye } from 'lucide-react';

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
              className="w-full h-96 object-cover"
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

          <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>

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

        {/* Share Button */}
        <div className="mb-8 flex justify-end">
          <button
            onClick={sharePost}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Share2 size={18} />
            Compartilhar
          </button>
        </div>

        {/* Post Content */}
        <div className="prose prose-lg max-w-none bg-white p-8 rounded-lg shadow-sm overflow-visible">
          <div 
            dangerouslySetInnerHTML={{ __html: post.content }} 
            className="whitespace-pre-wrap break-words"
          />
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
