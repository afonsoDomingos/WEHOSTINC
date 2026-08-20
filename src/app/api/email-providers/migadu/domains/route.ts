import { NextRequest, NextResponse } from 'next/server';
import { getEmailProvider } from '@/lib/emailProviders/base';
import { EmailDomain } from '@/models/EmailDomain';
import { auth } from '@/lib/auth';

// GET - List domains
export async function GET(request: NextRequest) {
  try {
    // Temporarily disabled auth check for testing
    // const user = await auth.getCurrentUser();
    // if (!user || user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    const provider = getEmailProvider();
    const domains = await provider.listDomains(customerId || undefined);

    return NextResponse.json({
      success: true,
      domains
    });
  } catch (error) {
    console.error('[Migadu Domains GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to list domains' },
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
    const existingDomain = await EmailDomain.findOne({ domainName });
    if (existingDomain) {
      return NextResponse.json(
        { error: 'Domain already exists' },
        { status: 409 }
      );
    }

    const provider = getEmailProvider();
    const domain = await provider.createDomain({
      domainName,
      createDefaultAddresses,
      hostedDns: false
    });

    // Save to MongoDB
    const newDomain = new EmailDomain({
      ...domain,
      customerId,
      id: domain.id // Use the provider's ID
    });
    await newDomain.save();

    return NextResponse.json({
      success: true,
      domain: newDomain
    });
  } catch (error) {
    console.error('[Migadu Domains POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create domain' },
      { status: 500 }
    );
  }
}
