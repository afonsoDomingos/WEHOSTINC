import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import RevistaStory from '@/models/RevistaStory';
import { sendStorySubmissionReceivedEmail, sendAdminNewSubmissionEmail } from '@/lib/sendgrid';

export const dynamic = 'force-dynamic';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      highlightText,
      excerpt,
      content,
      coverImage,
      category = 'codigo',
      tags = [],
      author = {},
    } = body;

    // Validações essenciais e limites de caracteres
    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'O título da história é obrigatório.' }, { status: 400 });
    }
    if (title.trim().length > 100) {
      return NextResponse.json({ error: 'O título da história não pode exceder 100 caracteres.' }, { status: 400 });
    }
    if (!excerpt || !excerpt.trim()) {
      return NextResponse.json({ error: 'Um resumo curto da história é obrigatório.' }, { status: 400 });
    }
    if (excerpt.trim().length > 500) {
      return NextResponse.json({ error: 'O resumo da história não pode exceder 500 caracteres.' }, { status: 400 });
    }
    if (!content || content.trim().length < 150) {
      return NextResponse.json(
        { error: 'O conteúdo da história deve ter pelo menos 150 caracteres para garantir qualidade editorial.' },
        { status: 400 }
      );
    }
    if (content.trim().length > 5000) {
      return NextResponse.json(
        { error: 'A descrição completa da história não pode exceder 5.000 caracteres.' },
        { status: 400 }
      );
    }
    if (!author?.name || !author.name.trim()) {
      return NextResponse.json({ error: 'O nome do autor é obrigatório.' }, { status: 400 });
    }
    if (!author?.email || !author.email.trim() || !author.email.includes('@')) {
      return NextResponse.json({ error: 'Um e-mail válido do autor é obrigatório para notificações.' }, { status: 400 });
    }
    if (author?.bio && author.bio.trim().length > 500) {
      return NextResponse.json({ error: 'A bio curta do autor não pode exceder 500 caracteres.' }, { status: 400 });
    }

    // Gerar slug único
    let baseSlug = slugify(title);
    if (!baseSlug) baseSlug = `historia-${Date.now()}`;
    let finalSlug = baseSlug;

    // Calcular tempo de leitura (~200 palavras por minuto)
    const words = content.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(words / 200));

    // Formatar tags
    const formattedTags = Array.isArray(tags)
      ? tags.map((t: string) => t.trim().toLowerCase()).filter(Boolean)
      : typeof tags === 'string'
      ? tags.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean)
      : [];

    await connectDB();

    // Garantir unicidade do slug
    const existing = await RevistaStory.findOne({ slug: finalSlug });
    if (existing) {
      finalSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const newStory = await RevistaStory.create({
      title: title.trim(),
      slug: finalSlug,
      highlightText: highlightText?.trim() || undefined,
      excerpt: excerpt.trim(),
      content: content.trim(),
      coverImage: coverImage || undefined,
      category,
      tags: formattedTags,
      author: {
        name: author.name.trim(),
        email: author.email.trim().toLowerCase(),
        bio: author.bio?.trim() || 'Membro da comunidade WEHOSTHERE',
        avatar: author.avatar || undefined,
        website: author.website?.trim() || undefined,
        socials: {
          twitter: author.socials?.twitter?.trim() || undefined,
          linkedin: author.socials?.linkedin?.trim() || undefined,
          github: author.socials?.github?.trim() || undefined,
          instagram: author.socials?.instagram?.trim() || undefined,
        },
      },
      status: 'pending',
      featured: false,
      views: 0,
      readingTime,
      submission: {
        isCommunity: true,
        submitterEmail: author.email.trim().toLowerCase(),
        submitterName: author.name.trim(),
        submittedAt: new Date(),
      },
      seo: {
        metaTitle: `${title.trim()} | Codando Histórias`,
        metaDescription: excerpt.trim().slice(0, 160),
        keywords: formattedTags.join(', '),
      },
    });

    // Disparar e-mails em segundo plano (não bloqueia resposta)
    Promise.allSettled([
      sendStorySubmissionReceivedEmail({
        toEmail: author.email.trim(),
        authorName: author.name.trim(),
        storyTitle: title.trim(),
        category,
        storySlug: finalSlug,
      }),
      sendAdminNewSubmissionEmail({
        authorName: author.name.trim(),
        authorEmail: author.email.trim(),
        storyTitle: title.trim(),
        category,
        storyId: newStory._id.toString(),
      }),
    ]).catch(err => console.warn('[Revista Submissão Email Error]', err));

    return NextResponse.json({
      success: true,
      message: 'História submetida com sucesso! A equipa editorial irá analisar e notificar-te em breve.',
      story: {
        id: newStory._id.toString(),
        slug: newStory.slug,
        status: newStory.status,
      },
    });
  } catch (err: any) {
    console.error('[Revista Submeter POST]', err);
    return NextResponse.json(
      { error: err.message || 'Erro ao processar submissão da história.' },
      { status: 500 }
    );
  }
}
