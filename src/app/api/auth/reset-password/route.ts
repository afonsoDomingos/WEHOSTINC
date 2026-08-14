import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Armazenamento temporário de tokens (em produção, usar Redis ou banco de dados)
const resetTokens = new Map<string, { email: string; expiresAt: number }>();

// Funções auxiliares privadas
function validateResetToken(token: string): { valid: boolean; email?: string } {
  const data = resetTokens.get(token);
  
  if (!data) {
    return { valid: false };
  }

  if (data.expiresAt < Date.now()) {
    resetTokens.delete(token);
    return { valid: false };
  }

  return { valid: true, email: data.email };
}

function deleteResetToken(token: string): void {
  resetTokens.delete(token);
}

export async function POST(req: Request) {
  try {
    const { action, token, password } = await req.json();

    if (action === 'validate') {
      // Validar token
      const validation = validateResetToken(token || '');
      return NextResponse.json(validation);
    }

    if (action === 'reset') {
      // Redefinir senha
      if (!token || !password) {
        return NextResponse.json(
          { error: 'Token e senha são obrigatórios' },
          { status: 400 }
        );
      }

      if (password.length < 6) {
        return NextResponse.json(
          { error: 'A senha deve ter pelo menos 6 caracteres' },
          { status: 400 }
        );
      }

      // Validar token
      const validation = validateResetToken(token);
      if (!validation.valid || !validation.email) {
        return NextResponse.json(
          { error: 'Token inválido ou expirado' },
          { status: 400 }
        );
      }

      // Buscar usuário
      const users = await auth.fetchUsersAsync();
      const user = users.find(u => u.email.toLowerCase() === validation.email!.toLowerCase());

      if (!user) {
        return NextResponse.json(
          { error: 'Usuário não encontrado' },
          { status: 404 }
        );
      }

      // Atualizar senha
      auth.updatePassword(user.email, password);

      // Deletar token após uso
      deleteResetToken(token);

      console.log('[Reset Password] Senha redefinida para:', user.email);

      return NextResponse.json({
        success: true,
        message: 'Senha redefinida com sucesso'
      });
    }

    return NextResponse.json(
      { error: 'Ação inválida' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Reset Password] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
}
