import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    await connectDB();
    
    const BlogPost = (await import('@/lib/models/BlogPost')).default;
    const { slug } = params;
    
    // Incrementar views do post
    const post = await BlogPost.findOneAndUpdate(
      { slug },
      { $inc: { views: 1 } },
      { new: true }
    );
    
    if (!post) {
      return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      views: post.views 
    });
  } catch (error) {
    console.error('[Blog View] Erro ao incrementar views:', error);
    return NextResponse.json({ error: 'Erro ao incrementar views' }, { status: 500 });
  }
}
