import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rateLimiter';

export async function GET(request: NextRequest) {
  return NextResponse.json({ error: 'Use POST method to confirm email with code' }, { status: 405 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    console.log('[Confirm Email] Dados recebidos:', { email, code, codeLength: code?.length });

    if (!email || !code) {
      console.error('[Confirm Email] Email ou código faltando:', { hasEmail: !!email, hasCode: !!code });
      return NextResponse.json(
        { error: 'Email e código são obrigatórios' },
        { status: 400 }
      );
    }

    if (code.length !== 6) {
      console.error('[Confirm Email] Código com tamanho inválido:', code.length);
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
      console.warn('[Confirm Email] Rate limit excedido:', { email, clientIp });
      return NextResponse.json(
        { 
          error: 'Muitas tentativas. Tente novamente em 1 minuto.',
          resetTime: rateLimitResult.resetTime
        }, 
        { status: 429 }
      );
    }

    // Buscar usuários para encontrar o código de confirmação
    const usersUrl = `${process.env.NEXTAUTH_URL || 'https://wehosthere.com'}/api/users`;
    console.log('[Confirm Email] Buscando usuários de:', usersUrl);
    
    const usersResponse = await fetch(usersUrl);
    const usersData = await usersResponse.json();
    const users = usersData.users || [];
    
    console.log('[Confirm Email] Total de usuários:', users.length);

    // Encontrar usuário com o código de confirmação
    const user = users.find((u: any) => 
      u.email.toLowerCase() === email.toLowerCase() && 
      u.confirmationCode === code
    );

    console.log('[Confirm Email] Usuário encontrado:', !!user);
    
    if (!user) {
      console.error('[Confirm Email] Usuário não encontrado ou código inválido:', { 
        email: email.toLowerCase(),
        code,
        hasConfirmationCode: users.some((u: any) => u.email.toLowerCase() === email.toLowerCase())
      });
      return NextResponse.json(
        { error: 'Código inválido' },
        { status: 400 }
      );
    }

    console.log('[Confirm Email] Usuário encontrado:', { 
      email: user.email, 
      hasCode: !!user.confirmationCode,
      hasExpiration: !!user.confirmationCodeExpiresAt 
    });

    // Verificar expiração do código
    if (user.confirmationCodeExpiresAt) {
      const expirationDate = new Date(user.confirmationCodeExpiresAt);
      const now = new Date();
      console.log('[Confirm Email] Verificando expiração:', { 
        expirationDate, 
        now, 
        isExpired: now > expirationDate 
      });
      
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

    console.log('[Confirm Email] Resposta da atualização:', updateResponse.status);

    if (!updateResponse.ok) {
      console.error('[Confirm Email] Erro ao atualizar usuário:', updateResponse.status);
      return NextResponse.json(
        { error: 'Erro ao confirmar email' },
        { status: 500 }
      );
    }

    console.log('[Confirm Email] Confirmação bem-sucedida');
    return NextResponse.json({ success: true, message: 'Email confirmado com sucesso' });
  } catch (error) {
    console.error('[Confirm Email] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao confirmar email' },
      { status: 500 }
    );
  }
}
