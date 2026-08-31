import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog — WEHOSTHERE | Dicas de Hospedagem, Domínios e Tecnologia em Moçambique',
  description: 'Artigos, tutoriais e notícias sobre hospedagem de sites, registo de domínios, email corporativo e tecnologia web em Moçambique. Actualizações e guias práticos da WEHOSTHERE.',
  keywords: [
    'blog hospedagem Moçambique',
    'tutoriais web Moçambique',
    'dicas domínios .co.mz',
    'hospedagem sites dicas',
    'tecnologia web Maputo',
    'WEHOSTHERE blog',
    'notícias hosting',
    'email corporativo tutorial',
  ],
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    url: 'https://www.wehosthere.com/blog',
    siteName: 'WEHOSTHERE',
    title: 'Blog — WEHOSTHERE | Hospedagem & Tecnologia em Moçambique',
    description: 'Artigos e tutoriais sobre hospedagem de sites, domínios e tecnologia web em Moçambique.',
    images: [
      {
        url: 'https://www.wehosthere.com/servidores-banner.png',
        width: 1200,
        height: 630,
        alt: 'WEHOSTHERE Blog',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog — WEHOSTHERE',
    description: 'Artigos e tutoriais sobre hospedagem e tecnologia web em Moçambique.',
    images: ['https://www.wehosthere.com/servidores-banner.png'],
  },
  alternates: {
    canonical: 'https://www.wehosthere.com/blog',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
