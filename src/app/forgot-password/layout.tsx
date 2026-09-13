import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/siteConfig';

// SEO: Pagina de recuperacao de password - nao deve ser indexada.
export const metadata: Metadata = {
  title: 'Recuperar Password',
  description: 'Recupere o acesso a sua conta WEHOSTHERE.',
  alternates: { canonical: `${SITE_URL}/forgot-password` },
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}