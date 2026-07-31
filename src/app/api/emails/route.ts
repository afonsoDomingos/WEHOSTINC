import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import EmailAccountModel from '@/lib/models/EmailAccount';

// GET: Lista todas as contas de e-mail
export async function GET() {
  try {
    await connectDB();
    const emails = await EmailAccountModel.find({}).lean();
    return NextResponse.json({ emails });
  } catch (error) {
    console.error('Erro ao buscar e-mails:', error);
    return NextResponse.json({ emails: [] }, { status: 500 });
  }
}

// POST: Criar, atualizar status, sincronizar ou eliminar e-mails
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { action, email, emailId, status, emailStr, emails, domain } = body;

    if (action === 'sync_all' && Array.isArray(emails)) {
      for (const e of emails) {
        const key = (e.email || e.id || '').toLowerCase();
        if (!key) continue;
        await EmailAccountModel.findOneAndUpdate(
          { $or: [{ email: key }, { id: e.id }] },
          e,
          { upsert: true, new: true }
        );
      }
      const allEmails = await EmailAccountModel.find({}).lean();
      return NextResponse.json({ success: true, emails: allEmails });
    }

    if (action === 'delete') {
      const tId = (emailId || '').toLowerCase();
      const tEmail = (emailStr || '').toLowerCase();
      const tDomain = (domain || '').toLowerCase();

      if (tDomain) {
        // Eliminar todos os emails de um domínio
        await EmailAccountModel.deleteMany({
          $or: [
            { domain: tDomain },
            { email: { $regex: `@${tDomain}$`, $options: 'i' } }
          ]
        });
      } else {
        await EmailAccountModel.deleteOne({
          $or: [
            ...(tId ? [{ id: tId }, { email: tId }] : []),
            ...(tEmail ? [{ id: tEmail }, { email: tEmail }] : [])
          ]
        });
      }

      const allEmails = await EmailAccountModel.find({}).lean();
      return NextResponse.json({ success: true, emails: allEmails });
    }

    if (action === 'update_status') {
      const target = (emailId || emailStr || '').toLowerCase();
      await EmailAccountModel.findOneAndUpdate(
        { $or: [{ id: target }, { email: target }] },
        { status }
      );

      const allEmails = await EmailAccountModel.find({}).lean();
      return NextResponse.json({ success: true, emails: allEmails });
    }

    // Adicionar ou atualizar e-mail
    const emailData = email ? {
      ...email,
      userEmail: email.userEmail || body.userEmail
    } : {
      id: body.id || Date.now().toString(),
      email: body.email,
      domain: body.domain || (body.email?.split('@')[1] || ''),
      status: body.status || 'pending',
      quotaGB: body.quotaGB || 5,
      userEmail: body.userEmail,
      createdAt: body.createdAt || new Date().toISOString()
    };

    const targetKey = (emailData.email || '').toLowerCase();
    await EmailAccountModel.findOneAndUpdate(
      { $or: [{ id: emailData.id }, { email: targetKey }] },
      emailData,
      { upsert: true, new: true }
    );

    const allEmails = await EmailAccountModel.find({}).lean();
    return NextResponse.json({ success: true, email: emailData, emails: allEmails });
  } catch (error) {
    console.error('Erro na API de E-mails:', error);
    return NextResponse.json({ error: 'Erro ao processar e-mails' }, { status: 500 });
  }
}
