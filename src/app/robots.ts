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
        allow: [
          '/', 
          '/login', 
          '/register', 
          '/site-quote', 
          '/checkout', 
          '/webmail', 
          '/blog', 
          '/blog/*', 
          '/terms', 
          '/privacy', 
          '/systems', 
          '/ads.txt',
          // Páginas SEO - Domínios
          '/dominios',
          '/dominio-co-mz',
          // Páginas SEO - Hospedagem
          '/hospedagem',
          '/hospedagem-wordpress',
          '/vps',
          // Páginas SEO - Email
          '/email-profissional',
          '/email-corporativo',
          // Páginas SEO - Criação de Sites
          '/criar-site',
          // Páginas SEO - E-commerce
          '/loja-online',
          '/vendas-online',
          '/dropshipping',
          // Páginas SEO - Produtos Digitais
          '/produtos-digitais',
          '/plr',
          // Páginas SEO - Inteligência Artificial
          '/inteligencia-artificial',
          // Páginas SEO - Pagamentos
          '/pagamentos-online',
          '/scalepay',
        ],
        disallow: ['/dashboard/', '/admin/', '/api/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
