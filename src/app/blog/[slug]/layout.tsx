import { Metadata } from 'next';
import { connectDB } from '@/lib/mongodb';

interface Props {
  params: { slug: string };
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    await connectDB();
    
    const BlogPost = (await import('@/lib/models/BlogPost')).default;
    const post = await BlogPost.findOne({ slug: params.slug, status: 'published' });
    
    if (!post) {
      return {
        title: 'Post não encontrado - WEHOSTHERE',
        description: 'Post não encontrado no blog da WEHOSTHERE',
      };
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wehosthere.com';
    const imageUrl = post.coverImage || `${baseUrl}/images/default-og-image.jpg`;
    
    return {
      title: `${post.title} - WEHOSTHERE`,
      description: post.excerpt,
      openGraph: {
        title: post.title,
        description: post.excerpt,
        type: 'article',
        publishedTime: post.publishedAt?.toISOString(),
        authors: [post.author.name],
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: post.title,
          },
        ],
        url: `${baseUrl}/blog/${post.slug}`,
        siteName: 'WEHOSTHERE',
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post.excerpt,
        images: [imageUrl],
      },
    };
  } catch (error) {
    console.error('Erro ao gerar metadata:', error);
    return {
      title: 'Blog - WEHOSTHERE',
      description: 'Blog da WEHOSTHERE',
    };
  }
}

export default function BlogPostLayout({ children }: Props) {
  return <>{children}</>;
}
