import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/siteConfig';

export const metadata: Metadata = {
  title: 'Criar Conta Gratuita',
  description:
    'Crie a sua conta WEHOSTHERE gratuitamente e comece a hospedar o seu site, configurar emails corporativos e registar domínios em Moçambique.',
  alternates: { canonical: `${SITE_URL}/register` },
  openGraph: {
    title: 'Criar Conta — WEHOSTHERE',
    description: 'Registe-se gratuitamente e comece a hospedar o seu site em Moçambique.',
    url: `${SITE_URL}/register`,
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
