'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Eye, MousePointer2, Calendar, Download } from 'lucide-react';

interface BlogAnalytics {
  totalViews: number;
  totalClicks: number;
  totalPosts: number;
  averageViews: number;
  topPosts: Array<{
    id: string;
    title: string;
    views: number;
    clicks: number;
    category: string;
  }>;
  viewsByCategory: Array<{
    category: string;
    views: number;
  }>;
  viewsOverTime: Array<{
    date: string;
    views: number;
    clicks: number;
  }>;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function BlogAnalyticsPage() {
  const [analytics, setAnalytics] = useState<BlogAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/blog/analytics?days=${dateRange}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Erro ao buscar analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!analytics) return;
    
    const report = {
      geradoEm: new Date().toISOString(),
      periodo: `Últimos ${dateRange} dias`,
      resumo: {
        totalVisualizacoes: analytics.totalViews,
        totalCliques: analytics.totalClicks,
        totalPosts: analytics.totalPosts,
        mediaVisualizacoes: analytics.averageViews
      },
      topPosts: analytics.topPosts,
      visualizacoesPorCategoria: analytics.viewsByCategory,
      visualizacoesAoLongoDoTempo: analytics.viewsOverTime
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blog-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Erro ao carregar analytics</p>
      </div>
    );
  }

  const maxViews = Math.max(...analytics.viewsOverTime.map(d => d.views), 1);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics do Blog</h1>
              <p className="text-gray-600">Visualizações, cliques e impacto dos posts</p>
            </div>
            <div className="flex gap-2">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7">Últimos 7 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="90">Últimos 90 dias</option>
                <option value="365">Último ano</option>
              </select>
              <button
                onClick={exportReport}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download size={20} />
                Exportar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Visualizações</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.totalViews.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Eye className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Cliques</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.totalClicks.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <MousePointer2 className="text-green-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Posts</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.totalPosts}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Calendar className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Média Visualizações</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.averageViews.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <TrendingUp className="text-orange-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Visualizações ao Longo do Tempo</h2>
            <div className="space-y-2">
              {analytics.viewsOverTime.map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <span className="w-24 text-sm text-gray-600">{item.date}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full transition-all duration-300"
                      style={{ width: `${(item.views / maxViews) * 100}%` }}
                    />
                  </div>
                  <span className="w-20 text-sm text-gray-900 text-right">{item.views.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Visualizações por Categoria</h2>
            <div className="space-y-4">
              {analytics.viewsByCategory.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{item.category}</span>
                    <span className="text-sm text-gray-600">{item.views.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className="h-4 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(item.views / analytics.totalViews) * 100}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top Posts</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Post</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Categoria</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">Visualizações</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">Cliques</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">Taxa de Clique</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topPosts.map((post) => (
                  <tr key={post.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{post.title}</td>
                    <td className="py-3 px-4 text-gray-600">{post.category}</td>
                    <td className="py-3 px-4 text-right text-gray-900">{post.views.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-gray-900">{post.clicks.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      {post.views > 0 ? ((post.clicks / post.views) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
