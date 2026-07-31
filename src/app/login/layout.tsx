import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Entrar na Minha Conta',
  description:
    'Aceda ao seu painel WEHOSTHERE para gerir os seus sites, emails, domínios e faturas.',
  alternates: { canonical: 'https://wehosthere.com/login' },
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
