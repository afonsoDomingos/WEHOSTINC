import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Criar Conta Gratuita',
  description:
    'Crie a sua conta WEHOSTHERE gratuitamente e comece a hospedar o seu site, configurar emails corporativos e registar domínios em Moçambique.',
  alternates: { canonical: 'https://wehosthere.com/register' },
  openGraph: {
    title: 'Criar Conta — WEHOSTHERE',
    description: 'Registe-se gratuitamente e comece a hospedar o seu site em Moçambique.',
    url: 'https://wehosthere.com/register',
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
