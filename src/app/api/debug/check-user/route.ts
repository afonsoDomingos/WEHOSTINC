import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
    }

    // Buscar usuários
    const usersResponse = await fetch(`${process.env.NEXTAUTH_URL || 'https://wehosthere.com'}/api/users`);
    const usersData = await usersResponse.json();
    const users = usersData.users || [];

    // Encontrar usuário por email
    const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return NextResponse.json({ 
        error: 'Usuário não encontrado',
        email: email,
        totalUsers: users.length,
        emails: users.map((u: any) => u.email)
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
        hasConfirmationCode: !!user.confirmationCode,
        confirmationCode: user.confirmationCode,
        hasExpiration: !!user.confirmationCodeExpiresAt,
        confirmationCodeExpiresAt: user.confirmationCodeExpiresAt,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('[Debug Check User] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar usuário: ' + (error instanceof Error ? error.message : 'Erro desconhecido') },
      { status: 500 }
    );
  }
}
