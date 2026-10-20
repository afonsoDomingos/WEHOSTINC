import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connectDB } from '@/lib/mongodb';
import BlogPostModel from '@/lib/models/BlogPost';
import BlogPostClient, { BlogPostData } from './BlogPostClient';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    await connectDB();
    const post: any = await BlogPostModel.findOne({ slug, status: 'published' }).lean();
    if (!post) {
      return {
        title: 'Post Não Encontrado',
      };
    }

    const title = post.seo?.metaTitle || post.title;
    const description = post.seo?.metaDescription || post.excerpt;
    const url = `https://www.wehosthere.com/blog/${post.slug}`;
    const ogImage = post.coverImage || 'https://www.wehosthere.com/servidores-banner.png';

    return {
      title,
      description,
      keywords: post.seo?.keywords?.length ? post.seo.keywords : post.tags,
      alternates: {
        canonical: url,
      },
      openGraph: {
        type: 'article',
        locale: 'pt_MZ',
        url,
        title,
        description,
        publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
        modifiedTime: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
        authors: [post.author?.name || 'WEHOSTHERE'],
        tags: post.tags,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImage],
      },
    };
  } catch (e) {
    return {
      title: 'Blog',
    };
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  await connectDB();
  const post: any = await BlogPostModel.findOne({ slug, status: 'published' }).lean();

  if (!post) {
    notFound();
  }

  // Buscar posts relacionados no servidor
  let relatedPosts: BlogPostData[] = [];
  try {
    const rawRelated = await BlogPostModel.find({
      status: 'published',
      slug: { $ne: slug },
      $or: [
        { category: post.category },
        { tags: { $in: post.tags || [] } }
      ]
    })
      .limit(3)
      .lean();

    relatedPosts = rawRelated.map((p: any) => ({
      id: p._id?.toString() || '',
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      content: p.content,
      coverImage: p.coverImage || '',
      author: { name: p.author?.name || 'WEHOSTHERE' },
      category: p.category,
      tags: p.tags || [],
      publishedAt: p.publishedAt ? new Date(p.publishedAt).toISOString() : '',
      views: p.views || 0,
      featured: Boolean(p.featured),
    }));
  } catch (_) {}

  // Schema.org BlogPosting estruturado
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage || 'https://www.wehosthere.com/servidores-banner.png',
    datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
    dateModified: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
    author: {
      '@type': 'Person',
      name: post.author?.name || 'WEHOSTHERE',
    },
    publisher: {
      '@type': 'Organization',
      name: 'WEHOSTHERE',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.wehosthere.com/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.wehosthere.com/blog/${post.slug}`,
    },
  };

  const initialPost: BlogPostData = {
    id: (post as any)._id?.toString() || '',
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    coverImage: post.coverImage || '',
    author: { name: post.author?.name || 'WEHOSTHERE' },
    category: post.category,
    tags: post.tags || [],
    publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString() : '',
    views: post.views || 0,
    featured: Boolean(post.featured),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogPostClient initialPost={initialPost} initialRelatedPosts={relatedPosts} />
    </>
  );
}
