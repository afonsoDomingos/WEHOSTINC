import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/siteConfig';
import { connectDB } from '@/lib/mongodb';

const BASE_URL = SITE_URL;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const staticPages: MetadataRoute.Sitemap = [
    // Página principal - mais importante
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    // Páginas públicas importantes
    {
      url: `${BASE_URL}/register`,
      lastModified: oneWeekAgo,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/site-quote`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/systems`,
      lastModified: oneWeekAgo,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // Páginas de autenticação
    {
      url: `${BASE_URL}/login`,
      lastModified: oneMonthAgo,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/forgot-password`,
      lastModified: oneMonthAgo,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/confirm-email`,
      lastModified: oneMonthAgo,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    // Páginas de checkout
    {
      url: `${BASE_URL}/checkout`,
      lastModified: oneWeekAgo,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    // Páginas de serviços
    {
      url: `${BASE_URL}/webmail`,
      lastModified: threeMonthsAgo,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    // Páginas legais
    {
      url: `${BASE_URL}/terms`,
      lastModified: threeMonthsAgo,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: threeMonthsAgo,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    // Blog principal
    {
      url: `${BASE_URL}/blog`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  // Buscar posts do blog dinamicamente
  let blogPosts: MetadataRoute.Sitemap = [];
  try {
    await connectDB();
    const BlogPost = (await import('@/lib/models/BlogPost')).default;
    const posts = await BlogPost.find({ status: 'published' })
      .select('slug updatedAt publishedAt')
      .lean();

    blogPosts = posts.map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt || post.publishedAt || now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error('[Sitemap] Erro ao buscar posts do blog:', error);
  }

  return [...staticPages, ...blogPosts];
}
