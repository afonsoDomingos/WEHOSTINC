import { NextRequest, NextResponse } from 'next/server';
import { getEmailProvider } from '@/lib/emailProviders/base';
import { EmailDomain } from '@/models/EmailDomain';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import SiteModel from '@/lib/models/Site';
import EmailAccountModel from '@/lib/models/EmailAccount';

// GET - List domains
export async function GET(request: NextRequest) {
  try {
    const user = await auth.getCurrentUser();
    
    // Temporarily disabled auth check for testing
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    console.log('[Migadu Domains GET] Fetching domains, customerId:', customerId);

    const provider = getEmailProvider();
    console.log('[Migadu Domains GET] Provider configured:', provider.isConfigured());
    console.log('[Migadu Domains GET] EMAIL_PROVIDER:', process.env.EMAIL_PROVIDER);
    console.log('[Migadu Domains GET] MIGADU_USERNAME set:', !!process.env.MIGADU_USERNAME);
    console.log('[Migadu Domains GET] MIGADU_API_KEY set:', !!process.env.MIGADU_API_KEY);
    
    let allDomains: any[] = [];
    if (provider.isConfigured()) {
      try {
        allDomains = await provider.listDomains(customerId || undefined);
        console.log('[Migadu Domains GET] Domains fetched from provider:', allDomains.length);
      } catch (providerError) {
        console.warn('[Migadu Domains GET] Failed to fetch from provider, falling back to database:', providerError);
      }
    }

    // Merge with platform registered domains from MongoDB
    try {
      await connectDB();
      const existingDomainNames = new Set(allDomains.map(d => (d.domainName || d.name || '').toLowerCase()));

      const [sites, emailAccounts, dbDomains] = await Promise.all([
        SiteModel.find({}).lean(),
        EmailAccountModel.find({}).lean(),
        EmailDomain.find({}).lean()
      ]);

      // 1. Sync or add domains stored in EmailDomain
      dbDomains.forEach((dbDom: any) => {
        const dName = (dbDom.domainName || '').toLowerCase().trim();
        if (!dName) return;

        const existing = allDomains.find(d => (d.domainName || '').toLowerCase().trim() === dName);
        if (existing) {
          if (dbDom.customerId) existing.customerId = dbDom.customerId;
          if (dbDom.status === 'active' || dName === 'wehosthere.com') {
            existing.status = 'active';
            existing.canSend = true;
            existing.canReceive = true;
          }
          if (dbDom.diagnostics) existing.diagnostics = dbDom.diagnostics;
        } else {
          existingDomainNames.add(dName);
          allDomains.push({
            _id: dbDom._id?.toString() || dbDom.id,
            domainName: dbDom.domainName,
            customerId: dbDom.customerId || 'system',
            status: (dbDom.status === 'active' || dName === 'wehosthere.com') ? 'active' : (dbDom.status || 'pending_dns'),
            provider: dbDom.provider || 'migadu',
            canSend: dbDom.status === 'active' || dName === 'wehosthere.com' || !!dbDom.canSend,
            canReceive: dbDom.status === 'active' || dName === 'wehosthere.com' || !!dbDom.canReceive,
            diagnostics: dbDom.diagnostics,
            createdAt: dbDom.createdAt || new Date().toISOString(),
            updatedAt: dbDom.updatedAt || new Date().toISOString()
          });
        }
      });

      // 2. Add domains from SiteModel
      sites.forEach((site: any) => {
        const dName = (site.domain || '').trim().toLowerCase();
        if (dName && !existingDomainNames.has(dName)) {
          existingDomainNames.add(dName);
          allDomains.push({
            _id: site.id || site._id?.toString(),
            domainName: site.domain,
            customerId: site.userEmail || 'cliente',
            status: site.status === 'active' ? 'active' : 'pending_dns',
            provider: 'platform',
            canSend: site.status === 'active',
            canReceive: site.status === 'active',
            createdAt: site.createdAt || new Date().toISOString(),
            updatedAt: site.createdAt || new Date().toISOString()
          });
        }
      });

      // 3. Add domains extracted from EmailAccountModel (e.g. user@domain.com)
      emailAccounts.forEach((acc: any) => {
        let dName = (acc.domain || '').trim().toLowerCase();
        if (!dName && acc.email && acc.email.includes('@')) {
          dName = acc.email.split('@')[1].trim().toLowerCase();
        }
        if (dName && !existingDomainNames.has(dName)) {
          existingDomainNames.add(dName);
          allDomains.push({
            _id: acc.id || acc._id?.toString(),
            domainName: dName,
            customerId: acc.userEmail || 'cliente',
            status: acc.status === 'active' ? 'active' : 'pending_dns',
            provider: 'platform',
            canSend: acc.status === 'active',
            canReceive: acc.status === 'active',
            createdAt: acc.createdAt || new Date().toISOString(),
            updatedAt: acc.createdAt || new Date().toISOString()
          });
        }
      });
    } catch (dbError) {
      console.error('[Migadu Domains GET] Error fetching platform domains from DB:', dbError);
    }
    
    // If user is not admin, filter domains by customerId
    if (user && user.role !== 'admin') {
      const userDomains = allDomains.filter(domain => domain.customerId === user.id || domain.customerId === user.email);
      return NextResponse.json({
        success: true,
        domains: userDomains
      });
    }

    // Admin sees all domains
    return NextResponse.json({
      success: true,
      domains: allDomains
    });
  } catch (error) {
    console.error('[Migadu Domains GET] Error:', error);
    console.error('[Migadu Domains GET] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json(
      { error: 'Failed to list domains', details: String(error) },
      { status: 500 }
    );
  }
}

// POST - Create domain
export async function POST(request: NextRequest) {
  try {
    // Temporarily disabled auth check for testing
    // const user = await auth.getCurrentUser();
    // if (!user || (user.role !== 'admin' && user.role !== 'user')) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await request.json();
    const { domainName, customerId, createDefaultAddresses = false } = body;

    if (!domainName || !customerId) {
      return NextResponse.json(
        { error: 'domainName and customerId are required' },
        { status: 400 }
      );
    }

    // Check if domain already exists in our database
    await connectDB();
    const existingDomain = await EmailDomain.findOne({ domainName });
    if (existingDomain) {
      return NextResponse.json(
        { error: 'Domain already exists' },
        { status: 409 }
      );
    }

    console.log('[Migadu Domains POST] Creating domain:', domainName, 'for customer:', customerId);
    
    const provider = getEmailProvider();
    console.log('[Migadu Domains POST] Provider configured:', provider.isConfigured());
    
    if (!provider.isConfigured()) {
      return NextResponse.json(
        { error: 'Email provider not configured. Please check MIGADU_USERNAME and MIGADU_API_KEY environment variables.' },
        { status: 500 }
      );
    }

    const domain = await provider.createDomain({
      domainName,
      createDefaultAddresses,
      hostedDns: false
    });

    console.log('[Migadu Domains POST] Domain created in Migadu:', domain);

    // Save to MongoDB
    const newDomain = new EmailDomain({
      ...domain,
      customerId,
      id: domain.id // Use the provider's ID
    });
    await newDomain.save();

    console.log('[Migadu Domains POST] Domain saved to MongoDB:', newDomain._id);

    return NextResponse.json({
      success: true,
      domain: newDomain
    });
  } catch (error) {
    console.error('[Migadu Domains POST] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create domain: ${errorMessage}`, details: String(error) },
      { status: 500 }
    );
  }
}
