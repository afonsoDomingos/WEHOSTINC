import type { Metadata } from 'next';

type Props = {
  params: { slug: string };
};

// Gerar metadata dinâmica para cada artigo com base no slug (Server Side)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.wehosthere.com';
    const res = await fetch(`${baseUrl}/api/admin/blog/posts/${params.slug}`, {
      next: { revalidate: 3600 }, // cache por 1 hora
    });
    if (res.ok) {
      const data = await res.json();
      const post = data.post;
      if (post) {
        return {
          title: `${post.title} | Blog WEHOSTHERE`,
          description: post.excerpt || `Leia o artigo: ${post.title}`,
          keywords: post.tags || [],
          openGraph: {
            type: 'article',
            locale: 'pt_MZ',
            url: `${baseUrl}/blog/${params.slug}`,
            siteName: 'WEHOSTHERE',
            title: post.title,
            description: post.excerpt,
            images: post.coverImage ? [{ url: post.coverImage, width: 1200, height: 630, alt: post.title }] : [],
            publishedTime: post.publishedAt,
            authors: [post.author?.name || 'WEHOSTHERE'],
          },
          twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: post.excerpt,
            images: post.coverImage ? [post.coverImage] : [],
          },
          alternates: {
            canonical: `${baseUrl}/blog/${params.slug}`,
          },
        };
      }
    }
  } catch (e) {
    console.warn('[Blog] Erro ao gerar metadata do artigo:', e);
  }

  // SEO FIX: Post não encontrado — marcar como noindex para evitar Soft 404.
  // Não usar canonical apontando para /blog, pois isso cria duplicatas no Search Console.
  return {
    title: 'Artigo não encontrado | Blog WEHOSTHERE',
    description: 'Este artigo não foi encontrado. Explore outros artigos sobre hospedagem e tecnologia no blog da WEHOSTHERE.',
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default function BlogSlugLayout({ children }: { children: React.ReactNode }) {
  return children;
}
