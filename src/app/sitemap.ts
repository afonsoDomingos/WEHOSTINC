import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/siteConfig';

const BASE_URL = SITE_URL;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  return [
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
  ];
}
