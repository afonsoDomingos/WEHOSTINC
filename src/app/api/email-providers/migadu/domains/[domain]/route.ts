import { NextRequest, NextResponse } from 'next/server';
import { getEmailProvider } from '@/lib/emailProviders/base';
import { EmailDomain } from '@/models/EmailDomain';
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

// DELETE - Delete domain
export async function DELETE(
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

    const domain = await EmailDomain.findOne({ domainName });
    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    const provider = getEmailProvider();
    const deleted = await provider.deleteDomain(domainName);

    if (deleted) {
      await EmailDomain.deleteOne({ domainName });
    }

    return NextResponse.json({
      success: true,
      message: 'Domain deleted successfully'
    });
  } catch (error) {
    console.error('[Migadu Domain DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete domain' },
      { status: 500 }
    );
  }
}
