import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rateLimiter';
import { sendWelcomeEmail } from '@/lib/sendgrid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    // Rate limiting para prevenir spam de reenvio
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    const rateLimitResult = rateLimit(
      getRateLimitIdentifier(clientIp, email),
      3, // 3 tentativas
      300000 // 5 minutos
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Muitas tentativas de reenvio. Tente novamente em 5 minutos.',
          resetTime: rateLimitResult.resetTime
        }, 
        { status: 429 }
      );
    }

    // Buscar usuários para encontrar o email
    const usersResponse = await fetch(`${process.env.NEXTAUTH_URL || 'https://wehosthere.com'}/api/users`);
    const usersData = await usersResponse.json();
    const users = usersData.users || [];

    // Encontrar usuário com o email
    const user = users.find((u: any) => 
      u.email.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se conta já está confirmada
    if (user.status === 'active') {
      return NextResponse.json(
        { error: 'Esta conta já está confirmada. Você pode fazer login.' },
        { status: 400 }
      );
    }

    // Gerar novo código de confirmação de 6 dígitos
    const newConfirmationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newConfirmationCodeExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 horas

    // Atualizar usuário com novo código
    const updateResponse = await fetch(`${process.env.NEXTAUTH_URL || 'https://wehosthere.com'}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_confirmation_code',
        userId: user.id,
        email: user.email,
        confirmationCode: newConfirmationCode,
        confirmationCodeExpiresAt: newConfirmationCodeExpiresAt
      })
    });

    if (!updateResponse.ok) {
      return NextResponse.json(
        { error: 'Erro ao atualizar código de confirmação' },
        { status: 500 }
      );
    }

    // Enviar email com novo código
    await sendWelcomeEmail(user.email, user.name, user.plan, newConfirmationCode);

    return NextResponse.json({ 
      success: true, 
      message: 'Novo código de confirmação enviado para seu email' 
    });
  } catch (error) {
    console.error('[Resend Confirmation] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao reenviar código de confirmação' },
      { status: 500 }
    );
  }
}
