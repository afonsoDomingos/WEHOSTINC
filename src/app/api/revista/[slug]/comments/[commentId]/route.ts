import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import RevistaComment from '@/models/RevistaComment';
import RevistaStory from '@/models/RevistaStory';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ slug: string; commentId: string }>;
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { slug, commentId } = await params;

    if (!commentId) {
      return NextResponse.json({ error: 'ID do comentário inválido' }, { status: 400 });
    }

    await connectDB();

    const comment = await RevistaComment.findById(commentId);
    if (!comment) {
      return NextResponse.json({ error: 'Comentário não encontrado' }, { status: 404 });
    }

    // Remover o comentário e quaisquer respostas diretas
    await RevistaComment.deleteMany({
      $or: [
        { _id: commentId },
        { parentId: commentId }
      ]
    });

    // Atualizar contador da história
    if (slug) {
      await RevistaStory.findOneAndUpdate(
        { slug },
        { $inc: { commentsCount: -1 } }
      ).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: 'Comentário eliminado com sucesso.'
    });
  } catch (err: any) {
    console.error('[Revista Comment DELETE]', err);
    return NextResponse.json(
      { success: false, error: 'Erro ao eliminar comentário' },
      { status: 500 }
    );
  }
}
