import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import EmailAccountModel from '@/lib/models/EmailAccount';

let FALLBACK_EMAILS: any[] = [];

async function tryMongo() {
  try {
    await connectDB();
    return true;
  } catch (err) {
    console.warn('MongoDB connection issue (emails):', err);
    return false;
  }
}

import { EmailMailbox } from '@/models/EmailMailbox';
import { EmailDomain } from '@/models/EmailDomain';
import { getEmailProvider } from '@/lib/emailProviders/base';

export async function GET() {
  try {
    if (await tryMongo()) {
      const [emailAccounts, dbMailboxes, dbDomains] = await Promise.all([
        EmailAccountModel.find({}).lean(),
        EmailMailbox.find({}).lean(),
        EmailDomain.find({}).lean()
      ]);

      const existingEmails = new Set(emailAccounts.map(e => (e.email || '').toLowerCase().trim()));
      const allEmails: any[] = [...emailAccounts];

      // Try fetching live mailboxes for Migadu domains if provider configured
      try {
        const provider = getEmailProvider();
        if (provider.isConfigured()) {
          const migaduDomainNames = dbDomains.map(d => d.domainName).filter(Boolean);
          if (!migaduDomainNames.includes('wehosthere.com')) {
            migaduDomainNames.push('wehosthere.com');
          }
          for (const dName of migaduDomainNames) {
            try {
              const liveMbs = await provider.listMailboxes(dName);
              for (const mb of liveMbs) {
                const em = (mb.email || `${mb.localPart}@${dName}`).toLowerCase().trim();
                if (em && !existingEmails.has(em)) {
                  existingEmails.add(em);
                  const newEmailObj = {
                    id: `email_${mb.localPart}_${dName.replace(/[^a-zA-Z0-9]/g, '_')}`,
                    email: em,
                    domain: dName,
                    status: mb.status || 'active',
                    userEmail: 'admin@wehosthere.com',
                    createdAt: new Date().toISOString()
                  };
                  allEmails.push(newEmailObj);
                  // Save to EmailAccountModel in background
                  EmailAccountModel.findOneAndUpdate({ email: em }, newEmailObj, { upsert: true }).catch(() => {});
                }
              }
            } catch (dErr) {
              // Ignore single domain errors
            }
          }
        }
      } catch (provErr) {
        console.warn('[Emails GET] Could not sync live provider mailboxes:', provErr);
      }

      // Merge any mailboxes from EmailMailbox
      dbMailboxes.forEach((mb: any) => {
        const em = (mb.email || '').toLowerCase().trim();
        if (em && !existingEmails.has(em)) {
          existingEmails.add(em);
          allEmails.push({
            id: mb._id?.toString() || mb.id || `mb_${Date.now()}`,
            email: em,
            domain: em.split('@')[1] || '',
            status: mb.status || 'active',
            userEmail: mb.customerId === 'system' ? 'admin@wehosthere.com' : (mb.customerId || 'Cliente'),
            createdAt: mb.createdAt || new Date().toISOString()
          });
        }
      });

      return NextResponse.json({ emails: allEmails });
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
      const tId = (emailId || '').toLowerCase().trim();
      const tEmail = (emailStr || '').toLowerCase().trim();
      const tDomain = (domain || '').toLowerCase().trim();
      if (useMongo) {
        if (tDomain) {
          await EmailAccountModel.deleteMany({
            $or: [
              { domain: new RegExp(`^${tDomain}$`, 'i') },
              { email: { $regex: `@${tDomain}$`, $options: 'i' } }
            ]
          });
        } else {
          const conditions: any[] = [];
          if (tId) {
            conditions.push({ id: tId });
            conditions.push({ email: new RegExp(`^${tId}$`, 'i') });
          }
          if (tEmail) {
            conditions.push({ id: tEmail });
            conditions.push({ email: new RegExp(`^${tEmail}$`, 'i') });
          }
          if (conditions.length > 0) {
            await EmailAccountModel.deleteMany({ $or: conditions });
          }
        }
        return NextResponse.json({ success: true, emails: await EmailAccountModel.find({}).lean() });
      }
      FALLBACK_EMAILS = FALLBACK_EMAILS.filter(e => {
        if (tDomain && (e.domain?.toLowerCase() === tDomain || e.email?.toLowerCase().endsWith(`@${tDomain}`))) return false;
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
