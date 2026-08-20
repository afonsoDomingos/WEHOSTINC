import { NextRequest, NextResponse } from 'next/server';
import { getEmailProvider } from '@/lib/emailProviders/base';
import { EmailDomain } from '@/models/EmailDomain';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';

// POST - Activate a domain
export async function POST(
  request: NextRequest,
  { params }: { params: { domain: string } }
) {
  try {
    await connectDB();
    const domainName = params.domain;

    const domain = await EmailDomain.findOne({ domainName });
    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    const provider = getEmailProvider();
    const activatedDomain = await provider.activateDomain(domainName);

    // Update domain with activated status
    Object.assign(domain, activatedDomain);
    await domain.save();

    return NextResponse.json({
      success: true,
      domain,
      message: 'Domain activated successfully'
    });
  } catch (error) {
    console.error('[Migadu Domain Activate POST] Error:', error);
    
    // Check if it's a DNS configuration error
    if (error instanceof Error && error.message.includes('DNS')) {
      return NextResponse.json(
        { error: 'DNS configuration check failed. Please verify DNS records are correctly configured.' },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to activate domain' },
      { status: 500 }
    );
  }
}
