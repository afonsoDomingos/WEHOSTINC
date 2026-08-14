import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/sendgrid';

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
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar usuários
    const users = await auth.fetchUsersAsync();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Por segurança, não revelar se o email existe
      return NextResponse.json(
        { success: true, message: 'Se o email existir, enviaremos um link de recuperação' }
      );
    }

    // Gerar token de reset (32 caracteres hexadecimais)
    const resetToken = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    // Token expira em 1 hora
    const expiresAt = Date.now() + 60 * 60 * 1000;

    // Armazenar token
    resetTokens.set(resetToken, { email: user.email, expiresAt });

    // Limpar tokens expirados
    const now = Date.now();
    resetTokens.forEach((data, token) => {
      if (data.expiresAt < now) {
        resetTokens.delete(token);
      }
    });

    // Enviar email de recuperação
    await sendPasswordResetEmail(user.email, user.name, resetToken);

    console.log('[Forgot Password] Token gerado para:', user.email);

    return NextResponse.json({
      success: true,
      message: 'Email de recuperação enviado com sucesso'
    });
  } catch (error) {
    console.error('[Forgot Password] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
}
