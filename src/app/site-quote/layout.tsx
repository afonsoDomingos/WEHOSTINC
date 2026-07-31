import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Solicitar Criação de Site Profissional',
  description:
    'Solicite a criação do seu site profissional em Moçambique. Landing pages, lojas online, sistemas web, websites institucionais e muito mais. Orçamento gratuito e sem compromisso.',
  keywords: [
    'criação de sites Moçambique',
    'fazer site Maputo',
    'loja online Moçambique',
    'landing page Moçambique',
    'desenvolvimento web Moçambique',
    'agência web Maputo',
  ],
  alternates: { canonical: 'https://wehosthere.com/site-quote' },
  openGraph: {
    title: 'Solicitar Criação de Site | WEHOSTHERE',
    description:
      'Criação de sites profissionais em Moçambique. Landing pages, e-commerce, sistemas web. Orçamento gratuito.',
    url: 'https://wehosthere.com/site-quote',
  },
};

export default function SiteQuoteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
