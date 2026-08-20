import { NextRequest, NextResponse } from 'next/server';
import { getEmailProvider } from '@/lib/emailProviders/base';
import { EmailDomain } from '@/models/EmailDomain';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';

// GET - Get DNS records for a domain
export async function GET(
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
    const dnsRecords = await provider.getDNSRecords(domainName);

    // Update domain with fresh DNS records
    domain.dnsRecords = dnsRecords;
    await domain.save();

    return NextResponse.json({
      success: true,
      dnsRecords
    });
  } catch (error) {
    console.error('[Migadu DNS Records GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get DNS records' },
      { status: 500 }
    );
  }
}
