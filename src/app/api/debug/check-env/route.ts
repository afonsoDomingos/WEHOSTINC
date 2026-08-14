import { NextRequest, NextResponse } from 'next/server';

// ⛔ ENDPOINT DE DEBUG — BLOQUEADO EM PRODUÇÃO
// Este endpoint existia para depuração de variáveis de ambiente.
// Foi bloqueado por razões de segurança.
export async function GET(request: NextRequest) {
  // Bloquear completamente em produção
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const envVars = {
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      // ⚠️ Nunca expor prefixos ou valores parciais em produção
      nextAuthUrl: process.env.NEXTAUTH_URL || 'not set',
      nodeEnv: process.env.NODE_ENV || 'not set'
    };

    return NextResponse.json({
      success: true,
      environment: envVars,
      allSet: envVars.hasClientId && envVars.hasClientSecret && envVars.hasNextAuthSecret && envVars.hasNextAuthUrl
    });
  } catch (error) {
    console.error('[Debug Check Env] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar ambiente' },
      { status: 500 }
    );
  }
}

