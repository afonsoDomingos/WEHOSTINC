import { NextRequest, NextResponse } from 'next/server';
import { getEmailProvider } from '@/lib/emailProviders/base';
import { EmailDomain } from '@/models/EmailDomain';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';

// GET - Run DNS diagnostics for a domain
export async function GET(
  request: NextRequest,
  { params }: { params: { domain: string } }
) {
  try {
    await connectDB();
    const domainName = params.domain;

    let domain = await EmailDomain.findOne({ domainName });
    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    const provider = getEmailProvider();
    const diagnostics = await provider.runDNSDiagnostics(domainName);

    // Update domain with fresh diagnostics
    domain.diagnostics = diagnostics;
    await domain.save();

    return NextResponse.json({
      success: true,
      diagnostics
    });
  } catch (error) {
    console.error('[Migadu DNS Diagnostics GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to run DNS diagnostics' },
      { status: 500 }
    );
  }
}
