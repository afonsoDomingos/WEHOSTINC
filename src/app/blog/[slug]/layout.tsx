import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/siteConfig';

interface Props {
  params: { slug: string };
  children: React.ReactNode;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const DEFAULT_IMAGE = `${SITE_URL}/servidores-banner.png`;
  const canonicalUrl = `${SITE_URL}/blog/${params.slug}`;

  try {
    const { connectDB } = await import('@/lib/mongodb');
    await connectDB();
    const BlogPost = (await import('@/lib/models/BlogPost')).default;
    const post: any = await BlogPost.findOne({ slug: params.slug, status: 'published' }).lean();

    if (post && typeof post === 'object' && !Array.isArray(post)) {
      const imageUrl = post.coverImage?.startsWith('http') 
        ? post.coverImage 
        : post.coverImage?.startsWith('/')
        ? `${SITE_URL}${post.coverImage}`
        : DEFAULT_IMAGE;

      const title = `${post.title} | WEHOSTHERE Blog`;
      const description = post.excerpt || 'Artigo sobre tecnologia, hospedagem e negócios em Moçambique.';

      return {
        title,
        description,
        alternates: { canonical: canonicalUrl },
        openGraph: {
          type: 'article',
          locale: 'pt_MZ',
          url: canonicalUrl,
          title,
          description,
          images: [
            {
              url: imageUrl,
              secureUrl: imageUrl,
              width: 1200,
              height: 630,
              type: 'image/png',
              alt: post.title,
            },
          ],
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          images: [imageUrl],
        },
      };
    }
  } catch (err) {
    console.error('Error generating metadata for blog post:', err);
  }

  return {
    title: 'Artigo do Blog | WEHOSTHERE',
    description: 'Artigos, novidades e tutoriais sobre tecnologia e hospedagem em Moçambique.',
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'article',
      locale: 'pt_MZ',
      url: canonicalUrl,
      title: 'Artigo do Blog | WEHOSTHERE',
      description: 'Artigos, novidades e tutoriais sobre tecnologia e hospedagem em Moçambique.',
      images: [
        {
          url: DEFAULT_IMAGE,
          secureUrl: DEFAULT_IMAGE,
          width: 1200,
          height: 630,
          type: 'image/png',
          alt: 'WEHOSTHERE Blog',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Artigo do Blog | WEHOSTHERE',
      description: 'Artigos, novidades e tutoriais sobre tecnologia e hospedagem em Moçambique.',
      images: [DEFAULT_IMAGE],
    },
  };
}

export default function BlogPostLayout({ children }: Props) {
  return <>{children}</>;
}
