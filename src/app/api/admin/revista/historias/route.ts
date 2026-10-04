import { NextResponse } from 'next/server';
import { getStoriesList, createStory } from '@/lib/revistaData';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'published';
    const category = searchParams.get('category') || undefined;
    const featured = searchParams.get('featured') === 'true' ? true : undefined;
    const limit = parseInt(searchParams.get('limit') || '30', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);

    const { stories, total } = await getStoriesList({
      status,
      category,
      featured,
      limit,
      page,
    });

    return NextResponse.json({
      success: true,
      stories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err: any) {
    console.error('[Revista GET]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, excerpt, content } = body;

    if (!title || !excerpt || !content) {
      return NextResponse.json(
        { error: 'Título, resumo e conteúdo são obrigatórios' },
        { status: 400 }
      );
    }

    const story = await createStory(body);

    return NextResponse.json({
      success: true,
      story,
    });
  } catch (err: any) {
    console.error('[Revista POST]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
