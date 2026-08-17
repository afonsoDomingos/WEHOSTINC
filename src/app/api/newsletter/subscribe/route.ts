import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import NewsletterModel from '@/lib/models/Newsletter';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rateLimiter';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, source } = body;

    // Validação básica
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Rate limiting para prevenir spam
    const rateLimitResult = rateLimit(
      getRateLimitIdentifier('', cleanEmail),
      3, // 3 tentativas
      3600000 // 1 hora
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Muitas tentativas de subscrição. Tente novamente em 1 hora.',
          resetTime: rateLimitResult.resetTime
        }, 
        { status: 429 }
      );
    }

    await connectDB();

    // Verificar se já existe
    const existing = await NewsletterModel.findOne({ email: cleanEmail });
    
    if (existing) {
      if (existing.status === 'unsubscribed') {
        // Reativar subscrição
        await NewsletterModel.updateOne(
          { email: cleanEmail },
          { 
            status: 'active',
            unsubscribedAt: null,
            name: name || existing.name,
            source: source || existing.source
          }
        );
        return NextResponse.json({ 
          success: true, 
          message: 'Subscrição reativada com sucesso!' 
        });
      }
      
      if (existing.status === 'active') {
        return NextResponse.json({ 
          success: true, 
          message: 'Este email já está subscrito à newsletter.' 
        });
      }
    }

    // Criar nova subscrição
    await NewsletterModel.create({
      email: cleanEmail,
      name: name || '',
      source: source || 'footer',
      status: 'active'
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Subscrito com sucesso à newsletter!' 
    });

  } catch (error: any) {
    console.error('[Newsletter API] Erro:', error);
    
    if (error.code === 11000) {
      return NextResponse.json({ 
        success: true, 
        message: 'Este email já está subscrito à newsletter.' 
      });
    }
    
    return NextResponse.json({ 
      error: 'Erro ao processar subscrição.' 
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }
    
    const subscription = await NewsletterModel.findOne({ email: email.toLowerCase() });
    
    if (!subscription) {
      return NextResponse.json({ subscribed: false });
    }
    
    return NextResponse.json({ 
      subscribed: subscription.status === 'active',
      status: subscription.status
    });
    
  } catch (error) {
    console.error('[Newsletter API] Erro ao verificar subscrição:', error);
    return NextResponse.json({ error: 'Erro ao verificar subscrição' }, { status: 500 });
  }
}
