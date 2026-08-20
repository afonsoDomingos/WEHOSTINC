import { NextRequest, NextResponse } from 'next/server';
import { migaduImapSmtp } from '@/lib/migaduImapSmtp';
import { EmailMailbox } from '@/models/EmailMailbox';

// POST - Authenticate webmail user via IMAP
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e password são obrigatórios' },
        { status: 400 }
      );
    }

    // Check if mailbox exists and is active
    const mailbox = await EmailMailbox.findOne({ email });
    
    if (!mailbox) {
      return NextResponse.json(
        { error: 'Mailbox não encontrada' },
        { status: 404 }
      );
    }

    if (mailbox.status !== 'active') {
      return NextResponse.json(
        { error: 'Mailbox não está ativa' },
        { status: 403 }
      );
    }

    // Authenticate via IMAP
    const authenticated = await migaduImapSmtp.authenticateIMAP(email, password);
    
    if (!authenticated) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // Update last login time
    mailbox.lastLoginAt = new Date();
    await mailbox.save();

    // Return success with mailbox info (without password)
    return NextResponse.json({
      success: true,
      mailbox: {
        email: mailbox.email,
        name: mailbox.name,
        maySend: mailbox.maySend,
        mayReceive: mailbox.mayReceive,
        mayAccessImap: mailbox.mayAccessImap
      }
    });
  } catch (error) {
    console.error('[Webmail Auth] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao autenticar. Tente novamente.' },
      { status: 500 }
    );
  }
}
