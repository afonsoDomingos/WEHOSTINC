'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Eye } from 'lucide-react';

export default function NewBlogPostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    coverImage: '',
    category: 'news',
    tags: '',
    status: 'draft',
    featured: false,
    author: {
      name: 'WEHOSTHERE',
      email: 'info@wehosthere.com'
    },
    seo: {
      metaTitle: '',
      metaDescription: '',
      keywords: ''
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/blog/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
          seo: {
            ...formData.seo,
            keywords: formData.seo.keywords.split(',').map(k => k.trim()).filter(k => k)
          }
        })
      });

      if (response.ok) {
        router.push('/admin/blog');
      } else {
        alert('Erro ao criar post');
      }
    } catch (error) {
      console.error('Erro ao criar post:', error);
      alert('Erro ao criar post');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    // Implementar preview
    alert('Funcionalidade de preview em desenvolvimento');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/blog" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft size={24} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Novo Post</h1>
                <p className="text-gray-600">Criar novo post para o blog</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePreview}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Eye size={20} />
                Preview
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save size={20} />
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Título do post"
              />
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resumo *
              </label>
              <textarea
                required
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Breve resumo do post (máximo 500 caracteres)"
                maxLength={500}
              />
              <p className="text-sm text-gray-500 mt-1">{formData.excerpt.length}/500 caracteres</p>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conteúdo *
              </label>
              <textarea
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={15}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="Conteúdo do post (HTML permitido)"
              />
              <p className="text-sm text-gray-500 mt-1">Você pode usar HTML para formatação</p>
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagem de Capa
              </label>
              <input
                type="url"
                value={formData.coverImage}
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="URL da imagem de capa"
              />
              {formData.coverImage && (
                <img
                  src={formData.coverImage}
                  alt="Preview"
                  className="mt-2 rounded-lg max-h-48 object-cover"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="news">Notícias</option>
                <option value="tutorial">Tutoriais</option>
                <option value="announcement">Anúncios</option>
                <option value="update">Atualizações</option>
                <option value="feature">Funcionalidades</option>
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tags separadas por vírgula (ex: tecnologia, hosting, moçambique)"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
                <option value="archived">Arquivado</option>
              </select>
            </div>

            {/* Featured */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="featured" className="ml-2 text-sm text-gray-700">
                Marcar como post em destaque
              </label>
            </div>

            {/* SEO */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">SEO</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    value={formData.seo.metaTitle}
                    onChange={(e) => setFormData({
                      ...formData,
                      seo: { ...formData.seo, metaTitle: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Título para SEO (opcional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Description
                  </label>
                  <textarea
                    value={formData.seo.metaDescription}
                    onChange={(e) => setFormData({
                      ...formData,
                      seo: { ...formData.seo, metaDescription: e.target.value }
                    })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descrição para SEO (opcional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keywords
                  </label>
                  <input
                    type="text"
                    value={formData.seo.keywords}
                    onChange={(e) => setFormData({
                      ...formData,
                      seo: { ...formData.seo, keywords: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Keywords separadas por vírgula (opcional)"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
