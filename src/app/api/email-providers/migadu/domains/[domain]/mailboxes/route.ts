import { NextRequest, NextResponse } from 'next/server';
import { getEmailProvider } from '@/lib/emailProviders/base';
import { EmailMailbox } from '@/models/EmailMailbox';
import { EmailDomain } from '@/models/EmailDomain';
import { auth } from '@/lib/auth';

// GET - List mailboxes for a domain
export async function GET(
  request: NextRequest,
  { params }: { params: { domain: string } }
) {
  try {
    // Temporarily disabled auth check for testing
    // const user = await auth.getCurrentUser();
    // if (!user || user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const domainName = params.domain;

    const domain = await EmailDomain.findOne({ domainName });
    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Get mailboxes from our database first
    const mailboxes = await EmailMailbox.find({ domainId: domain._id.toString() });

    return NextResponse.json({
      success: true,
      mailboxes
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
