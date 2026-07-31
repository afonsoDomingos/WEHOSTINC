import { NextResponse } from 'next/server';

export interface ServerEmailAccount {
  id: string;
  email: string;
  quotaGB: number;
  usedGB: number;
  createdAt: string;
}

let GLOBAL_EMAILS: ServerEmailAccount[] = [];

// GET: Lista todas as contas de e-mail no servidor
export async function GET() {
  return NextResponse.json({ emails: GLOBAL_EMAILS });
}

// POST: Criar ou remover conta de e-mail
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, email, emailId } = body;

    if (action === 'delete') {
      GLOBAL_EMAILS = GLOBAL_EMAILS.filter(e => e.id !== emailId);
      return NextResponse.json({ success: true, emails: GLOBAL_EMAILS });
    }

    if (action === 'update_status') {
      const idx = GLOBAL_EMAILS.findIndex(e => e.id === emailId);
      if (idx >= 0) {
        (GLOBAL_EMAILS[idx] as any).status = body.status;
      }
      return NextResponse.json({ success: true, emails: GLOBAL_EMAILS });
    }

    const newEmail: ServerEmailAccount = email || {
      id: body.id || Date.now().toString(),
      email: body.email,
      quotaGB: body.quotaGB || 5,
      usedGB: body.usedGB || 0.1,
      createdAt: body.createdAt || new Date().toISOString()
    };

    const index = GLOBAL_EMAILS.findIndex(e => e.id === newEmail.id || e.email.toLowerCase() === newEmail.email.toLowerCase());
    if (index >= 0) {
      GLOBAL_EMAILS[index] = newEmail;
    } else {
      GLOBAL_EMAILS.unshift(newEmail);
    }

    return NextResponse.json({ success: true, email: newEmail, emails: GLOBAL_EMAILS });
  } catch (error) {
    console.error('Erro na API de Emails:', error);
    return NextResponse.json({ error: 'Erro ao processar emails' }, { status: 500 });
  }
}
