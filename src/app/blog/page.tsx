'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, User, Tag, ArrowRight, Search } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  author: { name: string };
  category: string;
  tags: string[];
  publishedAt: string;
  views: number;
  featured: boolean;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([]);

  const categories = ['all', 'news', 'tutorial', 'announcement', 'update', 'feature'];

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/blog/posts?status=published&limit=20');
      const data = await response.json();
      
      if (data.success) {
        setPosts(data.posts);
        setFeaturedPosts(data.posts.filter((p: BlogPost) => p.featured));
      }
    } catch (error) {
      console.error('Erro ao buscar posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Blog WEHOSTHERE</h1>
          <p className="text-xl text-blue-100">Notícias, tutoriais e atualizações sobre hospedagem e tecnologia</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Search and Filter */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category === 'all' ? 'Todos' : getCategoryLabel(category)}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Posts em Destaque</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredPosts.slice(0, 2).map(post => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                    {post.coverImage && (
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(post.category)}`}>
                          {getCategoryLabel(post.category)}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(post.publishedAt).toLocaleDateString('pt-MZ')}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mb-2 text-gray-800">{post.title}</h3>
                      <p className="text-gray-600 mb-4 line-clamp-2">{post.excerpt}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <User size={14} />
                          {post.author.name}
                        </span>
                        <ArrowRight className="text-blue-600" size={20} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* All Posts */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            {selectedCategory === 'all' ? 'Todos os Posts' : getCategoryLabel(selectedCategory)}
            <span className="text-lg font-normal text-gray-500 ml-2">({filteredPosts.length})</span>
          </h2>
          
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500">Nenhum post encontrado</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {filteredPosts.map(post => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    {post.coverImage && (
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-40 object-cover"
                      />
                    )}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(post.category)}`}>
                          {getCategoryLabel(post.category)}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold mb-2 text-gray-800 line-clamp-2">{post.title}</h3>
                      <p className="text-gray-600 mb-4 line-clamp-2 text-sm">{post.excerpt}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(post.publishedAt).toLocaleDateString('pt-MZ')}
                        </span>
                        <span className="flex items-center gap-1">
                          <User size={12} />
                          {post.author.name}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
