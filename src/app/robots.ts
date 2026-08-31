import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/siteConfig';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: 'Mediapartners-Google',
        allow: '/',
      },
      {
        userAgent: 'Google-AdSense',
        allow: '/',
      },
      {
        userAgent: '*',
        allow: ['/', '/login', '/register', '/site-quote', '/checkout', '/webmail', '/blog', '/blog/*', '/terms', '/privacy', '/systems', '/ads.txt'],
        disallow: ['/dashboard/', '/admin/', '/api/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
