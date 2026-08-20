import { NextRequest, NextResponse } from 'next/server';
import { getEmailProvider } from '@/lib/emailProviders/base';
import { EmailDomain } from '@/models/EmailDomain';
import { EmailMailbox } from '@/models/EmailMailbox';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';

// GET - Get domain details
export async function GET(
  request: NextRequest,
  { params }: { params: { domain: string } }
) {
  try {
    await connectDB();
    const user = await auth.getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const domainName = params.domain;
    
    // First check our database
    const domain = await EmailDomain.findOne({ domainName });
    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Get fresh data from provider
    const provider = getEmailProvider();
    const providerDomain = await provider.getDomain(domainName);

    // Update our database with fresh data
    Object.assign(domain, providerDomain);
    await domain.save();

    return NextResponse.json({
      success: true,
      domain
    });
  } catch (error) {
    console.error('[Migadu Domain GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get domain' },
      { status: 500 }
    );
  }
}

// PUT - Update domain
export async function PUT(
  request: NextRequest,
  { params }: { params: { domain: string } }
) {
  try {
    await connectDB();
    const user = await auth.getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const domainName = params.domain;
    const body = await request.json();

    const domain = await EmailDomain.findOne({ domainName });
    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    const provider = getEmailProvider();
    const updatedDomain = await provider.updateDomain(domainName, body);

    // Update our database
    Object.assign(domain, updatedDomain);
    await domain.save();

    return NextResponse.json({
      success: true,
      domain
    });
  } catch (error) {
    console.error('[Migadu Domain PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update domain' },
      { status: 500 }
    );
  }
}

import SiteModel from '@/lib/models/Site';
import EmailAccountModel from '@/lib/models/EmailAccount';

// DELETE - Delete domain
export async function DELETE(
  request: NextRequest,
  { params }: { params: { domain: string } }
) {
  try {
    await connectDB();
    const domainName = params.domain;

    const domain = await EmailDomain.findOne({ domainName });

    const provider = getEmailProvider();
    try {
      if (provider.isConfigured()) {
        await provider.deleteDomain(domainName);
      }
    } catch (provErr) {
      console.warn('[Migadu Domain DELETE] Provider delete warning (may already be removed on provider):', provErr);
    }

    // Cascaded removal from all MongoDB collections
    await Promise.all([
      EmailDomain.deleteMany({ domainName: new RegExp(`^${domainName}$`, 'i') }),
      SiteModel.deleteMany({ domain: new RegExp(`^${domainName}$`, 'i') }),
      EmailMailbox.deleteMany({ 
        $or: [
          { email: { $regex: `@${domainName}$`, $options: 'i' } },
          ...(domain ? [{ domainId: domain._id.toString() }] : [])
        ] 
      }),
      EmailAccountModel.deleteMany({
        $or: [
          { domain: new RegExp(`^${domainName}$`, 'i') },
          { email: { $regex: `@${domainName}$`, $options: 'i' } }
        ]
      })
    ]);

    return NextResponse.json({
      success: true,
      message: `Domain ${domainName} and all associated mailboxes deleted successfully`
    });
  } catch (error) {
    console.error('[Migadu Domain DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete domain' },
      { status: 500 }
    );
  }
}
