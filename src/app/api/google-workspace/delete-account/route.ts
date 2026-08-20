import { NextRequest, NextResponse } from 'next/server';
import { googleWorkspaceManager } from '@/lib/googleWorkspace';

export async function DELETE(request: NextRequest) {
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

    const result = await googleWorkspaceManager.deleteAccount(email);

    if (!result) {
      return NextResponse.json(
        { error: 'Falha ao deletar conta de email no Google Workspace' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Conta de email deletada com sucesso'
    });

  } catch (error) {
    console.error('[Google Workspace Delete Account] Error:', error);
    return NextResponse.json(
      { error: 'Erro interno ao deletar conta de email' },
      { status: 500 }
    );
  }
}
