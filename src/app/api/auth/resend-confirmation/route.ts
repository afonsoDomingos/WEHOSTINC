import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rateLimiter';
import { sendWelcomeEmail } from '@/lib/sendgrid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    console.log('[Resend Confirmation] Iniciando reenvio para:', email);

    if (!email) {
      console.error('[Resend Confirmation] Email não fornecido');
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
      console.warn('[Resend Confirmation] Rate limit excedido:', { email, clientIp });
      return NextResponse.json(
        { 
          error: 'Muitas tentativas de reenvio. Tente novamente em 5 minutos.',
          resetTime: rateLimitResult.resetTime
        }, 
        { status: 429 }
      );
    }

    // Buscar usuários para encontrar o email
    const usersUrl = `${process.env.NEXTAUTH_URL || 'https://wehosthere.com'}/api/users`;
    console.log('[Resend Confirmation] Buscando usuários de:', usersUrl);
    
    const usersResponse = await fetch(usersUrl);
    console.log('[Resend Confirmation] Resposta da API de usuários:', usersResponse.status);
    
    const usersData = await usersResponse.json();
    const users = usersData.users || [];
    console.log('[Resend Confirmation] Total de usuários:', users.length);

    // Encontrar usuário com o email
    const user = users.find((u: any) => 
      u.email.toLowerCase() === email.toLowerCase()
    );

    console.log('[Resend Confirmation] Usuário encontrado:', !!user);

    if (!user) {
      console.error('[Resend Confirmation] Usuário não encontrado:', email);
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se conta já está confirmada
    if (user.status === 'active') {
      console.warn('[Resend Confirmation] Conta já está confirmada:', email);
      return NextResponse.json(
        { error: 'Esta conta já está confirmada. Você pode fazer login.' },
        { status: 400 }
      );
    }

    // Gerar novo código de confirmação de 6 dígitos
    const newConfirmationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newConfirmationCodeExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 horas

    console.log('[Resend Confirmation] Gerando novo código:', { 
      newConfirmationCode, 
      newConfirmationCodeExpiresAt 
    });

    // Atualizar usuário com novo código
    console.log('[Resend Confirmation] Enviando atualização para API de usuários');
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

    console.log('[Resend Confirmation] Resposta da atualização:', updateResponse.status);
    
    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      console.error('[Resend Confirmation] Erro ao atualizar código:', errorData);
      return NextResponse.json(
        { error: 'Erro ao atualizar código de confirmação' },
        { status: 500 }
      );
    }

    const updateData = await updateResponse.json();
    console.log('[Resend Confirmation] Dados da atualização:', updateData);

    // Enviar email com novo código
    console.log('[Resend Confirmation] Enviando email com novo código');
    await sendWelcomeEmail(user.email, user.name, user.plan, newConfirmationCode);

    console.log('[Resend Confirmation] Reenvio bem-sucedido');
    return NextResponse.json({ 
      success: true, 
      message: 'Novo código de confirmação enviado para seu email' 
    });
  } catch (error) {
    console.error('[Resend Confirmation] Erro geral:', error);
    return NextResponse.json(
      { error: 'Erro ao reenviar código de confirmação' },
      { status: 500 }
    );
  }
}
