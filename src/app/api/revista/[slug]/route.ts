import { NextResponse } from 'next/server';
import { getStoryBySlug } from '@/lib/revistaData';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  try {
    const story = await getStoryBySlug(params.slug);

    if (!story) {
      return NextResponse.json({ error: 'História não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, story });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
