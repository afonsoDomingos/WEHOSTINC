import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

// GET - Listar posts públicos (sem autenticação)
export async function GET(req: Request) {
  try {
    await connectDB();
    
    const BlogPost = (await import('@/lib/models/BlogPost')).default;
    
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'published';
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    
    const filter: any = {};
    if (status !== 'all') {
      filter.status = status;
    }
    if (category) {
      filter.category = category;
    }
    if (featured === 'true') {
      filter.featured = true;
    }
    
    console.log('[Blog Public API] Buscando posts com filtro:', filter);
    
    const posts = await BlogPost.find(filter)
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await BlogPost.countDocuments(filter);
    
    console.log('[Blog Public API] Posts encontrados:', posts.length);
    
    return NextResponse.json({
      success: true,
      posts: posts.map((post: any) => ({
        id: post._id?.toString() || post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        coverImage: post.coverImage,
        author: post.author,
        category: post.category,
        tags: post.tags,
        status: post.status,
        publishedAt: post.publishedAt,
        views: post.views,
        featured: post.featured,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        seo: post.seo
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err: any) {
    console.error('[Blog Public API] Erro:', err);
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    }, { status: 500 });
  }
}
