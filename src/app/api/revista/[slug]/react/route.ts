import { NextResponse } from 'next/server';
import { reactToStory } from '@/lib/revistaData';

export const dynamic = 'force-dynamic';

const VALID_TYPES = ['clap', 'fire', 'insight', 'heart', 'rocket'];

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  try {
    const body = await req.json();
    const { type, count = 1 } = body;

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Tipo de reacção inválido. Tipos permitidos: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const cleanCount = Math.max(1, Math.min(Number(count) || 1, 50));
    const result = await reactToStory(params.slug, type as any, cleanCount);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'História não encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      claps: result.claps,
      reactions: result.reactions,
    });
  } catch (err: any) {
    console.error('[Revista React POST]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
