import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/siteConfig';

// SEO: A pagina de checkout nao deve ser indexada pelo Google.
// E uma pagina dinamica de compra que nao tem valor de pesquisa organica.
export const metadata: Metadata = {
  title: 'Checkout - Finalizar Compra',
  description: 'Finalize a sua compra de servicos WEHOSTHERE. Hospedagem, dominios, email corporativo e muito mais.',
  alternates: { canonical: `${SITE_URL}/checkout` },
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}