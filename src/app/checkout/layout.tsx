import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/siteConfig';

// SEO: A página de checkout não deve ser indexada pelo Google.
// É uma página dinâmica de compra que não tem valor de pesquisa orgânica.
export const metadata: Metadata = {
  title: 'Checkout — Finalizar Compra',
  description: 'Finalize a sua compra de serviços WEHOSTHERE. Hospedagem, domínios, email corporativo e muito mais.',
  alternates: { canonical: `${SITE_URL}/checkout` },
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
