import { NextRequest, NextResponse } from 'next/server';
import { googleWorkspaceManager } from '@/lib/googleWorkspace';

export async function GET(request: NextRequest) {
  try {
    // Check if Google Workspace is configured
    if (!googleWorkspaceManager.isConfigured()) {
      return NextResponse.json(
        { error: 'Google Workspace não está configurado. Configure as variáveis de ambiente.' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Parâmetro email é obrigatório' },
        { status: 400 }
      );
    }

    const result = await googleWorkspaceManager.getAccount(email);

    if (!result) {
      return NextResponse.json(
        { error: 'Conta de email não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      account: result
    });

  } catch (error) {
    console.error('[Google Workspace Get Account] Error:', error);
    return NextResponse.json(
      { error: 'Erro interno ao buscar conta de email' },
      { status: 500 }
    );
  }
}
