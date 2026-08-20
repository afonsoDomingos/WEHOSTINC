import { NextRequest, NextResponse } from 'next/server';
import { googleWorkspaceManager, GoogleEmailAccount } from '@/lib/googleWorkspace';

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
    const { primaryEmail, name, password, recoveryEmail, suspended, isAdmin } = body;

    // Validate required fields
    if (!primaryEmail || !name) {
      return NextResponse.json(
        { error: 'primaryEmail e name são obrigatórios' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(primaryEmail)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    const userData: GoogleEmailAccount = {
      primaryEmail,
      name,
      password,
      recoveryEmail,
      suspended: suspended || false,
      isAdmin: isAdmin || false
    };

    const result = await googleWorkspaceManager.createAccount(userData);

    if (!result) {
      return NextResponse.json(
        { error: 'Falha ao criar conta de email no Google Workspace' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Conta de email criada com sucesso',
      account: result
    });

  } catch (error) {
    console.error('[Google Workspace Create Account] Error:', error);
    return NextResponse.json(
      { error: 'Erro interno ao criar conta de email' },
      { status: 500 }
    );
  }
}
