import { NextResponse } from 'next/server';
import { getStoryById, updateStory, deleteStory } from '@/lib/revistaData';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.wehosthere.com';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const story = await getStoryById(params.id);
    if (!story) return NextResponse.json({ error: 'História não encontrada' }, { status: 404 });
    return NextResponse.json({ success: true, story });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();

    // Buscar a história antes da atualização para detetar mudança de status
    let previousStatus: string | undefined;
    try {
      const existing = await getStoryById(params.id);
      previousStatus = (existing as any)?.status;
    } catch (_) {}

    const result = await updateStory(params.id, body);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'História não encontrada' }, { status: 404 });
    }

    const updatedStory = result.story as any;

    // ── Enviar push broadcast quando uma história é publicada pela primeira vez ──
    const isNowPublished = updatedStory?.status === 'published' || body.status === 'published';
    const wasNotPublished = previousStatus !== 'published';

    if (isNowPublished && wasNotPublished) {
      try {
        const storyTitle = updatedStory?.title || body.title || 'Nova história publicada';
        const storySlug  = updatedStory?.slug  || body.slug  || '';
        const storyExcerpt = updatedStory?.excerpt || body.excerpt || 'Uma nova história de tech foi publicada na revista Codando Histórias.';
        const authorName = updatedStory?.author?.name || body.author?.name || 'Codando Histórias';
        const storyUrl = `${SITE_URL}/revista/${storySlug}`;

        // Fire-and-forget — não bloqueia a resposta (Push)
        fetch(`${SITE_URL}/api/push/broadcast`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `📖 Nova história: ${storyTitle}`,
            message: `${authorName} publicou uma nova história — ${storyExcerpt.slice(0, 100)}${storyExcerpt.length > 100 ? '…' : ''}`,
            url: storyUrl,
            icon: '/mascote-transparent.png',
            tag: `revista-story-${params.id}`,
          }),
        }).catch((e) => console.error('[Revista] Erro ao enviar push broadcast:', e));

        // Fire-and-forget — Email broadcast para utilizadores + subscritores newsletter
        fetch(`${SITE_URL}/api/revista/broadcast-story`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storyId: params.id,
            storyTitle,
            storySlug,
            storyExcerpt,
            authorName,
            coverImageUrl: updatedStory?.coverImage || body.coverImage || undefined,
            category: updatedStory?.category || body.category || undefined,
            readTime: updatedStory?.readTime || body.readTime || undefined,
          }),
        })
          .then(async (res) => {
            const data = await res.json().catch(() => ({}));
            console.log(`[Revista] Email broadcast concluído — enviados: ${data.sent ?? '?'}, falhados: ${data.failed ?? '?'}`);
          })
          .catch((e) => console.error('[Revista] Erro ao iniciar email broadcast:', e));

        console.log(`[Revista] Push + Email broadcast agendados para história publicada: "${storyTitle}"`);
      } catch (pushErr) {
        // Não falha a operação principal por causa do push
        console.error('[Revista] Erro ao preparar push broadcast:', pushErr);
      }
    }

    return NextResponse.json({ success: true, story: updatedStory });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const result = await deleteStory(params.id);
    return NextResponse.json({ success: result.success });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
