import { NextRequest, NextResponse } from 'next/server';
import { googleWorkspaceManager, GoogleEmailAccount } from '@/lib/googleWorkspace';

export async function PUT(request: NextRequest) {
  try {
    // Check if Google Workspace is configured
    if (!googleWorkspaceManager.isConfigured()) {
      return NextResponse.json(
        { error: 'Google Workspace não está configurado. Configure as variáveis de ambiente.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { email, updates } = body;

    if (!email || !updates) {
      return NextResponse.json(
        { error: 'email e updates são obrigatórios' },
        { status: 400 }
      );
    }

    const result = await googleWorkspaceManager.updateAccount(email, updates);

    if (!result) {
      return NextResponse.json(
        { error: 'Falha ao atualizar conta de email no Google Workspace' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Conta de email atualizada com sucesso',
      account: result
    });

  } catch (error) {
    console.error('[Google Workspace Update Account] Error:', error);
    return NextResponse.json(
      { error: 'Erro interno ao atualizar conta de email' },
      { status: 500 }
    );
  }
}
