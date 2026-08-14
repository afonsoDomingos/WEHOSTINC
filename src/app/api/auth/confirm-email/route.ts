import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rateLimiter';

export async function GET(request: NextRequest) {
  return NextResponse.json({ error: 'Use POST method to confirm email with code' }, { status: 405 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email e código são obrigatórios' },
        { status: 400 }
      );
    }

    if (code.length !== 6) {
      return NextResponse.json(
        { error: 'Código deve ter 6 dígitos' },
        { status: 400 }
      );
    }

    // Rate limiting para prevenir força bruta no código
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    const rateLimitResult = rateLimit(
      getRateLimitIdentifier(clientIp, email),
      10, // 10 tentativas
      60000 // 1 minuto
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Muitas tentativas. Tente novamente em 1 minuto.',
          resetTime: rateLimitResult.resetTime
        }, 
        { status: 429 }
      );
    }

    // Buscar usuários para encontrar o código de confirmação
    const usersResponse = await fetch(`${process.env.NEXTAUTH_URL || 'https://wehosthere.com'}/api/users`);
    const usersData = await usersResponse.json();
    const users = usersData.users || [];

    // Encontrar usuário com o código de confirmação
    const user = users.find((u: any) => 
      u.email.toLowerCase() === email.toLowerCase() && 
      u.confirmationCode === code
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Código inválido' },
        { status: 400 }
      );
    }

    // Verificar expiração do código
    if (user.confirmationCodeExpiresAt) {
      const expirationDate = new Date(user.confirmationCodeExpiresAt);
      const now = new Date();
      if (now > expirationDate) {
        return NextResponse.json(
          { error: 'Código expirado. Solicite um novo código.' },
          { status: 400 }
        );
      }
    }

    // Atualizar status para active e remover código
    const updateResponse = await fetch(`${process.env.NEXTAUTH_URL || 'https://wehosthere.com'}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'confirm_email',
        userId: user.id,
        email: user.email
      })
    });

    if (!updateResponse.ok) {
      return NextResponse.json(
        { error: 'Erro ao confirmar email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Email confirmado com sucesso' });
  } catch (error) {
    console.error('[Confirm Email] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao confirmar email' },
      { status: 500 }
    );
  }
}
