import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import RevistaComment from '@/models/RevistaComment';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ slug: string; commentId: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { commentId } = await params;
    const body = await req.json().catch(() => ({}));
    const { userIdentifier } = body; // IP ou email ou client token

    if (!commentId) {
      return NextResponse.json({ error: 'ID do comentário inválido' }, { status: 400 });
    }

    await connectDB();

    const comment = await RevistaComment.findById(commentId);
    if (!comment) {
      return NextResponse.json({ error: 'Comentário não encontrado' }, { status: 404 });
    }

    const identifier = userIdentifier || 'guest';
    const hasLiked = comment.likedBy && comment.likedBy.includes(identifier);

    let updatedComment;
    if (hasLiked) {
      // Descurtir
      updatedComment = await RevistaComment.findByIdAndUpdate(
        commentId,
        {
          $inc: { likes: -1 },
          $pull: { likedBy: identifier }
        },
        { new: true }
      );
    } else {
      // Curtir
      updatedComment = await RevistaComment.findByIdAndUpdate(
        commentId,
        {
          $inc: { likes: 1 },
          $addToSet: { likedBy: identifier }
        },
        { new: true }
      );
    }

    return NextResponse.json({
      success: true,
      liked: !hasLiked,
      likes: Math.max(0, updatedComment?.likes || 0)
    });
  } catch (err: any) {
    console.error('[Revista Comment Like POST]', err);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar curtida no comentário' },
      { status: 500 }
    );
  }
}
