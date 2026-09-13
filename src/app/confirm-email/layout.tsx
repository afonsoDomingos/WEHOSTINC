import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/siteConfig';

// SEO: Pagina de confirmacao de email - nao deve ser indexada.
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