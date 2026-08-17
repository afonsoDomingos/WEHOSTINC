import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import NewsletterModel from '@/lib/models/Newsletter';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    await connectDB();

    const subscription = await NewsletterModel.findOne({ email: cleanEmail });
    
    if (!subscription) {
      return NextResponse.json({ 
        error: 'Este email não está subscrito à newsletter.' 
      }, { status: 404 });
    }

    if (subscription.status === 'unsubscribed') {
      return NextResponse.json({ 
        success: true, 
        message: 'Este email já foi removido da newsletter.' 
      });
    }

    await NewsletterModel.updateOne(
      { email: cleanEmail },
      { 
        status: 'unsubscribed',
        unsubscribedAt: new Date()
      }
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Removido com sucesso da newsletter.' 
    });

  } catch (error) {
    console.error('[Newsletter Unsubscribe] Erro:', error);
    return NextResponse.json({ 
      error: 'Erro ao processar cancelamento.' 
    }, { status: 500 });
  }
}
