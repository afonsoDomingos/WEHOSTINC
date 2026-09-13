import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/siteConfig';

// SEO: Página de confirmação de email — não deve ser indexada.
// É uma página de estado temporário no fluxo de registo.
export const metadata: Metadata = {
  title: 'Confirmar Email',
  description: 'Verifique o seu email para confirmar o registo na WEHOSTHERE.',
  alternates: { canonical: `${SITE_URL}/confirm-email` },
  robots: {
    index: false,
    follow: false,
  },
};

export default function ConfirmEmailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
