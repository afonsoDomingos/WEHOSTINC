import { NextRequest, NextResponse } from 'next/server';
import { getEmailProvider } from '@/lib/emailProviders/base';
import { EmailDomain } from '@/models/EmailDomain';
import { auth } from '@/lib/auth';

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
    
    if (!provider.isConfigured()) {
      console.error('[Migadu Domains GET] Provider not configured');
      return NextResponse.json(
        { error: 'Email provider not configured. Please check MIGADU_USERNAME and MIGADU_API_KEY environment variables.' },
        { status: 500 }
      );
    }
    
    // Get all domains from provider
    const allDomains = await provider.listDomains(customerId || undefined);
    console.log('[Migadu Domains GET] Domains fetched:', allDomains.length);
    
    // If user is not admin, filter domains by customerId
    if (user && user.role !== 'admin') {
      const userDomains = allDomains.filter(domain => domain.customerId === user.id);
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
