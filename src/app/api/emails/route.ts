import { NextResponse } from 'next/server';

export interface ServerEmailAccount {
  id: string;
  email: string;
  domain?: string;
  status?: 'active' | 'pending' | 'suspended';
  quotaGB?: number;
  usedGB?: number;
  storage?: number;
  createdAt?: string;
  userEmail?: string;
}

let GLOBAL_EMAILS: ServerEmailAccount[] = [
  {
    id: 'e1',
    email: 'comercial@amvibe258.com',
    domain: 'amvibe258.com',
    status: 'active',
    quotaGB: 5,
    usedGB: 0.1,
    storage: 5,
    createdAt: '2026-07-31T09:00:00.000Z'
  }
];

// GET: Lista todas as contas de e-mail no servidor
export async function GET() {
  return NextResponse.json({ emails: GLOBAL_EMAILS });
}

// POST: Criar, atualizar status ou sincronizar e-mails
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, email, emailId, status, emailStr, emails, domain } = body;

    if (action === 'sync_all' && Array.isArray(emails)) {
      const map = new Map<string, ServerEmailAccount>();
      GLOBAL_EMAILS.forEach(e => map.set(e.email.toLowerCase(), e));
      emails.forEach((e: ServerEmailAccount) => {
        const key = (e.email || e.id || '').toLowerCase();
        if (key) {
          const existing = map.get(key);
          map.set(key, { ...existing, ...e });
        }
      });
      GLOBAL_EMAILS = Array.from(map.values());
      return NextResponse.json({ success: true, emails: GLOBAL_EMAILS });
    }

    if (action === 'delete') {
      const tId = (emailId || '').toLowerCase();
      const tEmail = (emailStr || '').toLowerCase();
      const tDomain = (domain || '').toLowerCase();
      GLOBAL_EMAILS = GLOBAL_EMAILS.filter(e => {
        const eId = e.id.toLowerCase();
        const eAddr = e.email.toLowerCase();
        const eDomain = (e.domain || (e.email.includes('@') ? e.email.split('@')[1] : '')).toLowerCase();

        if (tId && (eId === tId || eAddr === tId)) return false;
        if (tEmail && (eId === tEmail || eAddr === tEmail)) return false;
        if (tDomain && (eDomain === tDomain || eAddr.endsWith(`@${tDomain}`))) return false;
        return true;
      });
      return NextResponse.json({ success: true, emails: GLOBAL_EMAILS });
    }



    if (action === 'update_status') {
      const target = (emailId || emailStr || '').toLowerCase();
      let updated = false;

      GLOBAL_EMAILS = GLOBAL_EMAILS.map(e => {
        if (e.id.toLowerCase() === target || e.email.toLowerCase() === target) {
          updated = true;
          return { ...e, status };
        }
        return e;
      });

      if (!updated && (emailStr || emailId)) {
        const newEmailStr = emailStr || emailId;
        GLOBAL_EMAILS.unshift({
          id: emailId || Date.now().toString(),
          email: newEmailStr,
          domain: newEmailStr.split('@')[1] || '',
          status: status || 'active',
          quotaGB: 5,
          usedGB: 0.1,
          storage: 5,
          createdAt: new Date().toISOString()
        });
      }

      return NextResponse.json({ success: true, emails: GLOBAL_EMAILS });
    }

    const newEmail: ServerEmailAccount = email || {
      id: body.id || Date.now().toString(),
      email: body.email,
      domain: body.domain || body.email?.split('@')[1] || '',
      status: body.status || 'pending',
      quotaGB: body.quotaGB || 5,
      usedGB: body.usedGB || 0.1,
      storage: body.storage || 5,
      createdAt: body.createdAt || new Date().toISOString()
    };

    const targetKey = newEmail.email.toLowerCase();
    const index = GLOBAL_EMAILS.findIndex(e => e.id === newEmail.id || e.email.toLowerCase() === targetKey);
    if (index >= 0) {
      GLOBAL_EMAILS[index] = { ...GLOBAL_EMAILS[index], ...newEmail };
    } else {
      GLOBAL_EMAILS.unshift(newEmail);
    }

    return NextResponse.json({ success: true, email: newEmail, emails: GLOBAL_EMAILS });
  } catch (error) {
    console.error('Erro na API de Emails:', error);
    return NextResponse.json({ error: 'Erro ao processar emails' }, { status: 500 });
  }
}
