import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import EmailAccountModel from '@/lib/models/EmailAccount';

let FALLBACK_EMAILS: any[] = [];
let mongoAvailable: boolean | null = null;

async function tryMongo() {
  if (mongoAvailable === false) return false;
  try { await connectDB(); mongoAvailable = true; return true; }
  catch { mongoAvailable = false; return false; }
}

export async function GET() {
  try {
    if (await tryMongo()) {
      const emails = await EmailAccountModel.find({}).lean();
      return NextResponse.json({ emails });
    }
  } catch (e) { console.error('MongoDB indisponível (emails):', e); }
  return NextResponse.json({ emails: FALLBACK_EMAILS });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, email, emailId, status, emailStr, emails, domain } = body;
    const useMongo = await tryMongo();

    if (action === 'sync_all' && Array.isArray(emails)) {
      if (useMongo) {
        for (const e of emails) {
          const key = (e.email || e.id || '').toLowerCase();
          if (!key) continue;
          await EmailAccountModel.findOneAndUpdate({ $or: [{ email: key }, { id: e.id }] }, e, { upsert: true, new: true });
        }
        return NextResponse.json({ success: true, emails: await EmailAccountModel.find({}).lean() });
      }
      const map = new Map<string, any>();
      FALLBACK_EMAILS.forEach(e => map.set(e.email?.toLowerCase(), e));
      emails.forEach((e: any) => map.set((e.email||e.id||'').toLowerCase(), { ...map.get((e.email||e.id||'').toLowerCase()), ...e }));
      FALLBACK_EMAILS = Array.from(map.values());
      return NextResponse.json({ success: true, emails: FALLBACK_EMAILS });
    }

    if (action === 'delete') {
      const tId = (emailId || '').toLowerCase();
      const tEmail = (emailStr || '').toLowerCase();
      const tDomain = (domain || '').toLowerCase();
      if (useMongo) {
        if (tDomain) await EmailAccountModel.deleteMany({ $or: [{ domain: tDomain }, { email: { $regex: `@${tDomain}$`, $options: 'i' } }] });
        else await EmailAccountModel.deleteOne({ $or: [...(tId ? [{ id: tId }, { email: tId }] : []), ...(tEmail ? [{ id: tEmail }, { email: tEmail }] : [])] });
        return NextResponse.json({ success: true, emails: await EmailAccountModel.find({}).lean() });
      }
      FALLBACK_EMAILS = FALLBACK_EMAILS.filter(e => {
        if (tDomain && (e.domain === tDomain || e.email?.endsWith(`@${tDomain}`))) return false;
        if (tId && (e.id?.toLowerCase() === tId || e.email?.toLowerCase() === tId)) return false;
        if (tEmail && (e.id?.toLowerCase() === tEmail || e.email?.toLowerCase() === tEmail)) return false;
        return true;
      });
      return NextResponse.json({ success: true, emails: FALLBACK_EMAILS });
    }

    if (action === 'update_status') {
      const target = (emailId || emailStr || '').toLowerCase();
      if (useMongo) {
        await EmailAccountModel.findOneAndUpdate({ $or: [{ id: target }, { email: target }] }, { status });
        return NextResponse.json({ success: true, emails: await EmailAccountModel.find({}).lean() });
      }
      FALLBACK_EMAILS = FALLBACK_EMAILS.map(e => (e.id?.toLowerCase() === target || e.email?.toLowerCase() === target) ? { ...e, status } : e);
      return NextResponse.json({ success: true, emails: FALLBACK_EMAILS });
    }

    const emailData = email ? { ...email, userEmail: email.userEmail || body.userEmail } : { id: body.id || Date.now().toString(), email: body.email, domain: body.domain || (body.email?.split('@')[1] || ''), status: body.status || 'pending', quotaGB: body.quotaGB || 5, userEmail: body.userEmail, createdAt: body.createdAt || new Date().toISOString() };
    const targetKey = (emailData.email || '').toLowerCase();

    if (useMongo) {
      await EmailAccountModel.findOneAndUpdate({ $or: [{ id: emailData.id }, { email: targetKey }] }, emailData, { upsert: true, new: true });
      return NextResponse.json({ success: true, email: emailData, emails: await EmailAccountModel.find({}).lean() });
    }
    const idx = FALLBACK_EMAILS.findIndex(e => e.id === emailData.id || e.email?.toLowerCase() === targetKey);
    if (idx >= 0) FALLBACK_EMAILS[idx] = { ...FALLBACK_EMAILS[idx], ...emailData };
    else FALLBACK_EMAILS.unshift(emailData);
    return NextResponse.json({ success: true, email: emailData, emails: FALLBACK_EMAILS });
  } catch (error) {
    console.error('Erro na API de E-mails:', error);
    return NextResponse.json({ error: 'Erro ao processar e-mails' }, { status: 500 });
  }
}
