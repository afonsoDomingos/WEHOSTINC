import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/siteConfig';

// SEO: Página de recuperação de password — não deve ser indexada.
// Não tem conteúdo relevante para pesquisa orgânica.
export const metadata: Metadata = {
  title: 'Recuperar Password',
  description: 'Recupere o acesso à sua conta WEHOSTHERE.',
  alternates: { canonical: `${SITE_URL}/forgot-password` },
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
