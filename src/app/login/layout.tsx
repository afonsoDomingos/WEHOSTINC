import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/siteConfig';

export const metadata: Metadata = {
  title: 'Entrar na Minha Conta',
  description:
    'Aceda ao seu painel WEHOSTHERE para gerir os seus sites, emails, domínios e faturas.',
  alternates: { canonical: `${SITE_URL}/login` },
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
