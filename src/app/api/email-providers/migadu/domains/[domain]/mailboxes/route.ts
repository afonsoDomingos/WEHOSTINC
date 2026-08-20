import { NextRequest, NextResponse } from 'next/server';
import { getEmailProvider } from '@/lib/emailProviders/base';
import { EmailMailbox } from '@/models/EmailMailbox';
import { EmailDomain } from '@/models/EmailDomain';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import EmailAccountModel from '@/lib/models/EmailAccount';

// GET - List mailboxes for a domain
export async function GET(
  request: NextRequest,
  { params }: { params: { domain: string } }
) {
  try {
    await connectDB();
    const domainName = params.domain;

    let domain = await EmailDomain.findOne({ domainName });
    if (!domain) {
      domain = await EmailDomain.create({
        domainName,
        customerId: 'system',
        status: 'active',
        provider: 'migadu',
        canSend: true,
        canReceive: true
      });
    }

    const provider = getEmailProvider();
    let providerMailboxes: any[] = [];

    if (provider.isConfigured()) {
      try {
        providerMailboxes = await provider.listMailboxes(domainName);
        console.log(`[Migadu Mailboxes GET] Fetched ${providerMailboxes.length} live mailboxes from Migadu for ${domainName}`);
      } catch (providerError) {
        console.warn('[Migadu Mailboxes GET] Failed to fetch from Migadu API:', providerError);
      }
    }

    // Upsert live provider mailboxes into MongoDB
    for (const mb of providerMailboxes) {
      try {
        const localPart = mb.localPart || (mb.email ? mb.email.split('@')[0] : 'user');
        const emailLower = (mb.email || `${localPart}@${domainName}`).toLowerCase();

        await EmailMailbox.findOneAndUpdate(
          { email: emailLower },
          {
            domainId: domain._id.toString(),
            customerId: mb.customerId || 'system',
            localPart: localPart,
            email: emailLower,
            name: mb.name || localPart,
            status: mb.status || 'active',
            provider: 'migadu',
            maySend: mb.maySend !== false,
            mayReceive: mb.mayReceive !== false,
            mayAccessImap: mb.mayAccessImap !== false,
            updatedAt: new Date()
          },
          { upsert: true, new: true }
        );

        // Also sync into EmailAccountModel for site-wide consistency
        await EmailAccountModel.findOneAndUpdate(
          { email: emailLower },
          {
            id: `email_${localPart}_${domainName.replace(/[^a-zA-Z0-9]/g, '_')}`,
            email: emailLower,
            domain: domainName,
            status: mb.status || 'active',
            userEmail: 'admin@wehosthere.com',
            createdAt: new Date().toISOString()
          },
          { upsert: true, new: true }
        );
      } catch (upsertErr) {
        console.error('[Migadu Mailboxes GET] Error syncing mailbox to DB:', upsertErr);
      }
    }

    // Query all mailboxes for this domain from DB
    const dbMailboxes = await EmailMailbox.find({
      $or: [
        { domainId: domain._id.toString() },
        { email: { $regex: `@${domainName}$`, $options: 'i' } }
      ]
    }).lean();

    const allMailboxes = dbMailboxes.map((m: any) => ({
      id: m._id?.toString() || m.id,
      domainId: m.domainId,
      customerId: m.customerId || 'system',
      localPart: m.localPart || m.email?.split('@')[0],
      email: m.email,
      name: m.name,
      status: m.status || 'active',
      provider: m.provider || 'migadu',
      maySend: m.maySend !== false,
      mayReceive: m.mayReceive !== false,
      mayAccessImap: m.mayAccessImap !== false,
      mayAccessPop3: m.mayAccessPop3 || false,
      storageUsed: m.storageUsed || 0,
      storageLimit: m.storageLimit,
      lastLoginAt: m.lastLoginAt,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt
    }));

    return NextResponse.json({
      success: true,
      mailboxes: allMailboxes
    });
  } catch (error) {
    console.error('[Migadu Mailboxes GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to list mailboxes' },
      { status: 500 }
    );
  }
}

// POST - Create mailbox
export async function POST(
  request: NextRequest,
  { params }: { params: { domain: string } }
) {
  try {
    // Temporarily disabled auth check for testing
    // const user = await auth.getCurrentUser();
    // if (!user || user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    await connectDB();
    const domainName = params.domain;
    const body = await request.json();
    const { 
      name, 
      localPart, 
      password, 
      passwordMethod = 'generated',
      passwordRecoveryEmail,
      customerId 
    } = body;

    if (!name || !localPart || !customerId) {
      return NextResponse.json(
        { error: 'name, localPart, and customerId are required' },
        { status: 400 }
      );
    }

    const domain = await EmailDomain.findOne({ domainName });
    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Check if mailbox already exists
    const email = `${localPart}@${domainName}`;
    const existingMailbox = await EmailMailbox.findOne({ email });
    if (existingMailbox) {
      return NextResponse.json(
        { error: 'Mailbox already exists' },
        { status: 409 }
      );
    }

    const provider = getEmailProvider();
    const mailbox = await provider.createMailbox(domainName, {
      name,
      localPart,
      password,
      passwordMethod,
      passwordRecoveryEmail,
      maySend: true,
      mayReceive: true,
      mayAccessImap: true,
      mayAccessPop3: false
    });

    // Save to MongoDB
    const newMailbox = new EmailMailbox({
      ...mailbox,
      domainId: domain._id.toString(),
      customerId,
      email: `${localPart}@${domainName}`
    });
    await newMailbox.save();

    return NextResponse.json({
      success: true,
      mailbox: {
        ...newMailbox.toObject(),
        password: undefined
      }
    });
  } catch (error) {
    console.error('[Migadu Mailboxes POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create mailbox' },
      { status: 500 }
    );
  }
}
