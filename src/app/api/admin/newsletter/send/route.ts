import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import NewsletterModel from '@/lib/models/Newsletter';
import { sendNewsletterEmail } from '@/lib/sendgrid';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { subject, content } = body;

    if (!subject || !content) {
      return NextResponse.json({ error: 'Assunto e conteúdo são obrigatórios.' }, { status: 400 });
    }

    await connectDB();

    // Buscar todos os subscritores ativos
    const subscribers = await NewsletterModel.find({ status: 'active' }).lean();

    if (subscribers.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Nenhum subscritor ativo encontrado.',
        sent: 0
      });
    }

    // Enviar newsletter para cada subscritor
    const results = await Promise.allSettled(
      subscribers.map(async (subscriber) => {
        const unsubscribeUrl = `${process.env.NEXTAUTH_URL || 'https://wehosthere.com'}/api/newsletter/unsubscribe?email=${subscriber.email}`;
        
        try {
          await sendNewsletterEmail(
            subscriber.email,
            subject,
            content,
            unsubscribeUrl
          );
          return { email: subscriber.email, success: true };
        } catch (error) {
          console.error(`Erro ao enviar newsletter para ${subscriber.email}:`, error);
          return { email: subscriber.email, success: false, error: String(error) };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;

    return NextResponse.json({ 
      success: true, 
      message: `Newsletter enviada para ${successful} subscritores. ${failed} falharam.`,
      sent: successful,
      failed,
      total: subscribers.length
    });

  } catch (error) {
    console.error('[Admin Newsletter Send] Erro:', error);
    return NextResponse.json({ 
      error: 'Erro ao enviar newsletter.' 
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();
    
    const subscribers = await NewsletterModel.find({}).sort({ subscribedAt: -1 }).lean();
    
    return NextResponse.json({ 
      success: true, 
      subscribers: subscribers.map(s => ({
        email: s.email,
        name: s.name,
        status: s.status,
        subscribedAt: s.subscribedAt,
        unsubscribedAt: s.unsubscribedAt,
        source: s.source
      }))
    });

  } catch (error) {
    console.error('[Admin Newsletter List] Erro:', error);
    return NextResponse.json({ 
      error: 'Erro ao listar subscritores.' 
    }, { status: 500 });
  }
}
