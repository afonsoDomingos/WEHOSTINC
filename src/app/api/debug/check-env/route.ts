import { NextRequest, NextResponse } from 'next/server';

// Verificação segura de configuração do Google OAuth
// Não expõe valores de variáveis de ambiente, apenas status
export async function GET(request: NextRequest) {
  try {
    // Verificar se Google OAuth está configurado sem expor valores
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const nextAuthSecret = process.env.NEXTAUTH_SECRET;
    const nextAuthUrl = process.env.NEXTAUTH_URL;

    const isGoogleConfigured = googleClientId && googleClientSecret && 
      googleClientId !== 'your-google-client-id' && 
      googleClientSecret !== 'your-google-client-secret';

    const isNextAuthConfigured = nextAuthSecret && nextAuthUrl;

    return NextResponse.json({
      success: true,
      googleOAuth: {
        configured: isGoogleConfigured,
        hasClientId: !!googleClientId,
        hasClientSecret: !!googleClientSecret,
        hasNextAuthSecret: !!nextAuthSecret,
        hasNextAuthUrl: !!nextAuthUrl
      },
      allConfigured: isGoogleConfigured && isNextAuthConfigured
    });
  } catch (error) {
    console.error('[Debug Check Env] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar ambiente' },
      { status: 500 }
    );
  }
}

