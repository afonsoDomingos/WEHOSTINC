import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rateLimiter';

export async function POST(req: Request) {
  try {
    console.log('[Newsletter API] Iniciando POST request');
    console.log('[Newsletter API] URL:', req.url);
    
    const body = await req.json();
    const { email, name, source } = body;

    console.log('[Newsletter API] Dados recebidos:', { email, name, source });

    // Validação básica
    if (!email || !email.includes('@')) {
      console.log('[Newsletter API] Email inválido:', email);
      return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    console.log('[Newsletter API] Email limpo:', cleanEmail);

    // Rate limiting para prevenir spam
    const rateLimitResult = rateLimit(
      getRateLimitIdentifier('', cleanEmail),
      3, // 3 tentativas
      3600000 // 1 hora
    );

    if (!rateLimitResult.success) {
      console.log('[Newsletter API] Rate limit excedido:', rateLimitResult);
      return NextResponse.json(
        { 
          error: 'Muitas tentativas de subscrição. Tente novamente em 1 hora.',
          resetTime: rateLimitResult.resetTime
        }, 
        { status: 429 }
      );
    }

    console.log('[Newsletter API] Conectando ao MongoDB...');
    let db;
    try {
      db = await connectDB();
      console.log('[Newsletter API] MongoDB conectado com sucesso');
    } catch (dbError: any) {
      console.error('[Newsletter API] Erro ao conectar MongoDB:', dbError);
      return NextResponse.json({ 
        error: 'Erro ao conectar ao banco de dados.',
        details: dbError.message 
      }, { status: 500 });
    }

    // Importar modelo dinamicamente para evitar erros de importação
    console.log('[Newsletter API] Importando modelo Newsletter...');
    let NewsletterModel;
    try {
      NewsletterModel = (await import('@/lib/models/Newsletter')).default;
      console.log('[Newsletter API] Modelo importado com sucesso');
    } catch (importError: any) {
      console.error('[Newsletter API] Erro ao importar modelo:', importError);
      return NextResponse.json({ 
        error: 'Erro ao importar modelo de newsletter.',
        details: importError.message 
      }, { status: 500 });
    }

    // Verificar se o modelo existe
    console.log('[Newsletter API] Verificando modelo Newsletter...');
    if (!NewsletterModel) {
      console.error('[Newsletter API] NewsletterModel não está definido');
      return NextResponse.json({ 
        error: 'Erro interno: modelo de newsletter não disponível.' 
      }, { status: 500 });
    }

    // Verificar se já existe
    console.log('[Newsletter API] Buscando subscrição existente...');
    const existing = await NewsletterModel.findOne({ email: cleanEmail });
    console.log('[Newsletter API] Subscrição existente:', existing ? 'Sim' : 'Não');
    
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
        console.log('[Newsletter API] Subscrição reativada');
        return NextResponse.json({ 
          success: true, 
          message: 'Subscrição reativada com sucesso!' 
        });
      }
      
      if (existing.status === 'active') {
        console.log('[Newsletter API] Email já subscrito');
        return NextResponse.json({ 
          success: true, 
          message: 'Este email já está subscrito à newsletter.' 
        });
      }
    }

    // Criar nova subscrição
    console.log('[Newsletter API] Criando nova subscrição...');
    const newSubscription = await NewsletterModel.create({
      email: cleanEmail,
      name: name || '',
      source: source || 'footer',
      status: 'active'
    });
    console.log('[Newsletter API] Nova subscrição criada:', newSubscription._id);

    return NextResponse.json({ 
      success: true, 
      message: 'Subscrito com sucesso à newsletter!' 
    });

  } catch (error: any) {
    console.error('[Newsletter API] Erro completo:', error);
    console.error('[Newsletter API] Detalhes do erro:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack
    });
    
    if (error.code === 11000) {
      console.log('[Newsletter API] Duplicação detectada (11000)');
      return NextResponse.json({ 
        success: true, 
        message: 'Este email já está subscrito à newsletter.' 
      });
    }
    
    return NextResponse.json({ 
      error: 'Erro ao processar subscrição.',
      details: error.message
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
    
    // Importar modelo dinamicamente
    const NewsletterModel = (await import('@/lib/models/Newsletter')).default;
    
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
