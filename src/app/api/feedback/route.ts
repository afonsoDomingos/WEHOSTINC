import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import FeedbackModel from '@/lib/models/Feedback';
import { addAdminNotification } from '@/lib/notifications';
import { apiEndpoint } from '@/lib/siteConfig';

export async function GET() {
  try {
    await connectDB();
    const feedbacks = await FeedbackModel.find({}).sort({ createdAt: -1 }).limit(100).lean();
    return NextResponse.json({ success: true, feedbacks });
  } catch (error) {
    console.error('[API FEEDBACK GET] Erro ao buscar feedbacks:', error);
    return NextResponse.json({ success: false, feedbacks: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userName, userEmail, rating, comment, category, type, userId } = body;

    if (!rating || !comment || comment.trim().length < 5) {
      return NextResponse.json(
        { error: 'Classificação e comentário (mínimo 5 caracteres) são obrigatórios.' },
        { status: 400 }
      );
    }

    const name = (userName || 'Utilizador').trim();
    const email = (userEmail || 'anonimo@wehosthere.com').trim();
    const feedbackId = `FB-${Date.now().toString().slice(-6)}`;

    await connectDB();

    const newFeedback = await FeedbackModel.create({
      id: feedbackId,
      userId: userId || '',
      userName: name,
      userEmail: email,
      type: type || 'general',
      rating: Number(rating),
      category: category || 'suggestion',
      comment: comment.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Notificar admin no painel
    try {
      addAdminNotification({
        title: `⭐ Novo Feedback (${rating}/5 estrelas)`,
        message: `${name} enviou uma avaliação [${category || 'Geral'}]: "${comment.slice(0, 100)}${comment.length > 100 ? '...' : ''}"`,
        type: 'system',
        userEmail: email,
        userName: name,
        link: '/admin?tab=feedbacks'
      });
    } catch (notifErr) {
      console.warn('[API FEEDBACK] Erro ao criar notificação de admin:', notifErr);
    }

    // Notificar admin por e-mail (não bloqueante)
    try {
      const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'info@wehosthere.com';
      const subject = `⭐ Novo Feedback de Cliente: ${rating}/5 estrelas (${name})`;
      const message = `Olá Administrador,\n\nUm utilizador submeteu um novo feedback na plataforma:\n\n• Nome: ${name}\n• E-mail: ${email}\n• Classificação: ${rating}/5 estrelas\n• Categoria: ${category || 'Geral'}\n• Comentário: "${comment}"\n• Data: ${new Date().toLocaleString('pt-MZ')}\n\nConsulte o painel para mais informações.\nEquipe WEHOSTHERE`;

      fetch(apiEndpoint('/api/send-email'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: adminEmail,
          subject,
          text: message
        })
      }).catch(() => {});
    } catch (emailErr) {
      console.warn('[API FEEDBACK] Erro ao enviar email de notificação:', emailErr);
    }

    return NextResponse.json({ success: true, feedback: newFeedback });
  } catch (error) {
    console.error('[API FEEDBACK POST] Erro ao processar feedback:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao guardar feedback' },
      { status: 500 }
    );
  }
}
