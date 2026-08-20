import { NextRequest, NextResponse } from 'next/server';
import { googleWorkspaceManager } from '@/lib/googleWorkspace';

export async function POST(request: NextRequest) {
  try {
    // Check if Google Workspace is configured
    if (!googleWorkspaceManager.isConfigured()) {
      return NextResponse.json(
        { error: 'Google Workspace não está configurado. Configure as variáveis de ambiente.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { email, newPassword } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Parâmetro email é obrigatório' },
        { status: 400 }
      );
    }

    const result = await googleWorkspaceManager.resetPassword(email, newPassword);

    if (!result) {
      return NextResponse.json(
        { error: 'Falha ao resetar senha no Google Workspace' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Senha resetada com sucesso',
      newPassword: newPassword ? '******' : 'Gerada automaticamente'
    });

  } catch (error) {
    console.error('[Google Workspace Reset Password] Error:', error);
    return NextResponse.json(
      { error: 'Erro interno ao resetar senha' },
      { status: 500 }
    );
  }
}
