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
    
    // Incrementar clicks do post
    const post = await BlogPost.findOneAndUpdate(
      { slug },
      { $inc: { clicks: 1 } },
      { new: true }
    );
    
    if (!post) {
      return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      clicks: post.clicks 
    });
  } catch (error) {
    console.error('[Blog Click] Erro ao incrementar cliques:', error);
    return NextResponse.json({ error: 'Erro ao incrementar cliques' }, { status: 500 });
  }
}
