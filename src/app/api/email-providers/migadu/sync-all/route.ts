import { NextRequest, NextResponse } from 'next/server';
import { getEmailProvider } from '@/lib/emailProviders/base';
import { EmailDomain } from '@/models/EmailDomain';
import { EmailMailbox } from '@/models/EmailMailbox';
import SiteModel from '@/lib/models/Site';
import EmailAccountModel from '@/lib/models/EmailAccount';
import { connectDB } from '@/lib/mongodb';

// POST - Sync and provision all platform domains & mailboxes to Migadu
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const provider = getEmailProvider();

    if (!provider.isConfigured()) {
      return NextResponse.json(
        { error: 'Provedor de e-mail não configurado' },
        { status: 500 }
      );
    }

    // 1. Fetch all domains currently registered on Migadu
    let migaduDomains: any[] = [];
    try {
      migaduDomains = await provider.listDomains();
    } catch (err) {
      console.warn('[Sync-All] Error listing Migadu domains:', err);
    }
    const migaduDomainSet = new Set(migaduDomains.map(d => (d.domainName || d.name || '').toLowerCase().trim()));

    // 2. Fetch all domains and emails in our platform database
    const [sites, emailAccounts, dbDomains] = await Promise.all([
      SiteModel.find({}).lean(),
      EmailAccountModel.find({}).lean(),
      EmailDomain.find({}).lean()
    ]);

    // Collect all unique domain names across the platform
    const platformDomainMap = new Map<string, { customerId: string }>();

    dbDomains.forEach((d: any) => {
      const name = (d.domainName || '').toLowerCase().trim();
      if (name) platformDomainMap.set(name, { customerId: d.customerId || 'system' });
    });

    sites.forEach((s: any) => {
      const name = (s.domain || '').toLowerCase().trim();
      if (name) platformDomainMap.set(name, { customerId: s.userEmail || 'cliente' });
    });

    emailAccounts.forEach((e: any) => {
      let name = (e.domain || '').toLowerCase().trim();
      if (!name && e.email && e.email.includes('@')) {
        name = e.email.split('@')[1].toLowerCase().trim();
      }
      if (name) platformDomainMap.set(name, { customerId: e.userEmail || 'cliente' });
    });

    const results = {
      domainsProvisioned: [] as string[],
      domainsAlreadyOnMigadu: [] as string[],
      mailboxesProvisioned: [] as string[],
      errors: [] as string[]
    };

    // 3. Provision each domain to Migadu if not already on Migadu
    for (const [domainName, info] of Array.from(platformDomainMap.entries())) {
      if (migaduDomainSet.has(domainName)) {
        results.domainsAlreadyOnMigadu.push(domainName);
      } else {
        try {
          console.log(`[Sync-All] Provisioning ${domainName} to Migadu...`);
          const created = await provider.createDomain({
            domainName,
            createDefaultAddresses: false,
            hostedDns: false
          });

          await EmailDomain.findOneAndUpdate(
            { domainName },
            {
              domainName,
              customerId: info.customerId,
              status: 'pending_dns',
              provider: 'migadu',
              canSend: false,
              canReceive: false,
              updatedAt: new Date()
            },
            { upsert: true, new: true }
          );

          migaduDomainSet.add(domainName);
          results.domainsProvisioned.push(domainName);
        } catch (provErr: any) {
          console.warn(`[Sync-All] Could not create ${domainName} on Migadu:`, provErr?.message || provErr);
          results.errors.push(`Domínio ${domainName}: ${provErr?.message || 'Erro ao provisionar'}`);
        }
      }
    }

    // 4. Provision all platform email accounts to Migadu
    for (const acc of emailAccounts) {
      if (!acc.email || !acc.email.includes('@')) continue;
      const [localPart, domainName] = acc.email.toLowerCase().trim().split('@');
      if (!localPart || !domainName) continue;

      try {
        // Check if mailbox exists on Migadu
        let existsOnMigadu = false;
        try {
          const mb = await provider.getMailbox(domainName, localPart);
          if (mb) existsOnMigadu = true;
        } catch {
          existsOnMigadu = false;
        }

        if (!existsOnMigadu) {
          console.log(`[Sync-All] Creating mailbox ${acc.email} on Migadu...`);
          await provider.createMailbox(domainName, {
            name: localPart,
            localPart,
            password: 'User@2024!',
            passwordMethod: 'generated',
            maySend: true,
            mayReceive: true,
            mayAccessImap: true,
            mayAccessPop3: false
          });
          results.mailboxesProvisioned.push(acc.email);
        }
      } catch (mbErr: any) {
        console.warn(`[Sync-All] Mailbox ${acc.email} creation note:`, mbErr?.message || mbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sincronização concluída! ${results.domainsProvisioned.length} domínios provisionados na Migadu.`,
      results
    });
  } catch (error: any) {
    console.error('[Sync-All] Error:', error);
    return NextResponse.json(
      { error: 'Falha na sincronização completa com a Migadu', details: error?.message },
      { status: 500 }
    );
  }
}
