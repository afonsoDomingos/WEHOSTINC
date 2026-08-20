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
    const domain = searchParams.get('domain');
    const maxResults = parseInt(searchParams.get('maxResults') || '100');

    const result = await googleWorkspaceManager.listAccounts(domain || undefined, maxResults);

    return NextResponse.json({
      success: true,
      accounts: result,
      count: result.length
    });

  } catch (error) {
    console.error('[Google Workspace List Accounts] Error:', error);
    return NextResponse.json(
      { error: 'Erro interno ao listar contas de email' },
      { status: 500 }
    );
  }
}
