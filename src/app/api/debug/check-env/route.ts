import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const envVars = {
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      clientIdPrefix: process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.substring(0, 10) + '...' : 'not set',
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
      { error: 'Erro ao verificar ambiente: ' + (error instanceof Error ? error.message : 'Erro desconhecido') },
      { status: 500 }
    );
  }
}
