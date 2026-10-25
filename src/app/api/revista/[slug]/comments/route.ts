import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import RevistaComment from '@/models/RevistaComment';
import RevistaStory from '@/models/RevistaStory';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET - List approved comments for a story
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const cleanSlug = (slug || '').trim().toLowerCase();

    if (!cleanSlug) {
      return NextResponse.json({ error: 'Slug do artigo inválido' }, { status: 400 });
    }

    await connectDB();

    const comments = await RevistaComment.find({
      storySlug: cleanSlug,
      status: 'approved'
    })
      .sort({ createdAt: 1 })
      .lean();

    // Organizar comentários com respostas (threaded)
    const commentMap = new Map();
    const rootComments: any[] = [];

    comments.forEach((c: any) => {
      const formatted = {
        ...c,
        id: c._id.toString(),
        replies: []
      };
      commentMap.set(c._id.toString(), formatted);
    });

    comments.forEach((c: any) => {
      const commentObj = commentMap.get(c._id.toString());
      if (c.parentId && commentMap.has(c.parentId.toString())) {
        commentMap.get(c.parentId.toString()).replies.push(commentObj);
      } else {
        rootComments.push(commentObj);
      }
    });

    return NextResponse.json({
      success: true,
      totalCount: comments.length,
      comments: rootComments.reverse() // Mais recentes no topo
    });
  } catch (err: any) {
    console.error('[Revista Comments GET]', err);
    return NextResponse.json(
      { success: false, error: 'Erro ao carregar comentários', details: err.message },
      { status: 500 }
    );
  }
}

// POST - Add a new comment or reply
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const cleanSlug = (slug || '').trim().toLowerCase();

    if (!cleanSlug) {
      return NextResponse.json({ error: 'Slug do artigo inválido' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { name, email, content, parentId, avatar, userId, isAdmin } = body;

    // Validações
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Por favor, indique o seu nome (mínimo 2 caracteres).' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { error: 'Por favor, indique um endereço de e-mail válido.' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string' || content.trim().length < 2) {
      return NextResponse.json(
        { error: 'O comentário deve conter pelo menos 2 caracteres.' },
        { status: 400 }
      );
    }

    if (content.trim().length > 2500) {
      return NextResponse.json(
        { error: 'O comentário excede o limite máximo de 2500 caracteres.' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verificar se o artigo existe e se o autor do comentário é o autor do artigo
    const story = await RevistaStory.findOne({ slug: cleanSlug }).lean();
    const isStoryAuthor = story?.author?.email && 
      story.author.email.toLowerCase().trim() === email.toLowerCase().trim();

    // Gerar avatar com iniciais caso não tenha
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const userAvatar = avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}&backgroundColor=7b2cbf,5a189a,9d4edd`;

    const newComment = await RevistaComment.create({
      storySlug: cleanSlug,
      storyId: story?._id,
      author: {
        name: cleanName,
        email: cleanEmail,
        avatar: userAvatar,
        userId: userId || undefined,
        isAuthor: !!isStoryAuthor,
        isAdmin: !!isAdmin || cleanEmail === 'admin@wehosthere.com'
      },
      content: content.trim(),
      parentId: parentId ? String(parentId).trim() : null,
      status: 'approved',
      likes: 0
    });

    // Atualizar contador de comentários na história se existir
    if (story?._id) {
      await RevistaStory.findByIdAndUpdate(story._id, {
        $inc: { commentsCount: 1 }
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: 'Comentário publicado com sucesso!',
      comment: {
        ...newComment.toObject(),
        id: newComment._id.toString(),
        replies: []
      }
    });
  } catch (err: any) {
    console.error('[Revista Comments POST]', err);
    return NextResponse.json(
      { success: false, error: 'Erro ao publicar comentário', details: err.message },
      { status: 500 }
    );
  }
}
