import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  if (!token || !email) {
    return NextResponse.redirect(
      new URL('/confirm-email?error=missing_params', request.url)
    );
  }

  try {
    // Buscar usuários para encontrar o token
    const usersResponse = await fetch(`${process.env.NEXTAUTH_URL || 'https://wehosthere.com'}/api/users`);
    const usersData = await usersResponse.json();
    const users = usersData.users || [];

    // Encontrar usuário com o token de confirmação
    const user = users.find((u: any) => 
      u.email.toLowerCase() === email.toLowerCase() && 
      u.confirmationToken === token
    );

    if (!user) {
      return NextResponse.redirect(
        new URL('/confirm-email?error=invalid_token', request.url)
      );
    }

    // Atualizar status para active e remover token
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
      return NextResponse.redirect(
        new URL('/confirm-email?error=confirmation_failed', request.url)
      );
    }

    // Redirecionar para página de sucesso
    return NextResponse.redirect(
      new URL('/confirm-email?success=true', request.url)
    );
  } catch (error) {
    console.error('[Confirm Email] Erro:', error);
    return NextResponse.redirect(
      new URL('/confirm-email?error=server_error', request.url)
    );
  }
}
