import { NextRequest, NextResponse } from 'next/server';
import { getEmailProvider } from '@/lib/emailProviders/base';
import { EmailDomain } from '@/models/EmailDomain';
import { EmailMailbox } from '@/models/EmailMailbox';
import { auth } from '@/lib/auth';

// Initialize default domain and emails for admin
export async function POST(request: NextRequest) {
  try {
    // Temporarily disabled auth check for testing
    // const user = await auth.getCurrentUser();
    // if (!user || user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    console.log('[Initialize] Auth check temporarily disabled for testing');

    const { domainName = 'wehosthere.com', createDefaultEmails = true } = await request.json();

    const provider = getEmailProvider();
    console.log('[Initialize] Provider configured:', provider.isConfigured());
    
    if (!provider.isConfigured()) {
      return NextResponse.json(
        { error: 'Email provider not configured. Please check MIGADU_USERNAME and MIGADU_API_KEY environment variables.' },
        { status: 500 }
      );
    }

    console.log('[Initialize] Starting initialization for domain:', domainName);

    // Step 1: Check if domain already exists in our database
    const existingDomain = await EmailDomain.findOne({ domainName });
    
    let domain;
    // Use a default customerId for now since auth is disabled
    const customerId = 'admin_default'; // Will be replaced with user.id when auth is re-enabled

    if (existingDomain) {
      console.log('[Initialize] Domain already exists:', domainName);
      domain = existingDomain;
    } else {
      // Step 2: Create domain in Migadu
      console.log('[Initialize] Creating domain in Migadu:', domainName);
      try {
        const migaduDomain = await provider.createDomain({
          domainName,
          createDefaultAddresses: false,
          hostedDns: false
        });

        // Save to MongoDB
        domain = new EmailDomain({
          ...migaduDomain,
          customerId,
          id: migaduDomain.id
        });
        await domain.save();
        console.log('[Initialize] Domain created and saved:', domain._id);
      } catch (error: any) {
        if (error.message && error.message.includes('already exists')) {
          console.log('[Initialize] Domain already exists in Migadu, fetching existing domain');
          // Domain exists in Migadu but not in our DB, fetch it
          const migaduDomain = await provider.getDomain(domainName);
          domain = new EmailDomain({
            ...migaduDomain,
            customerId,
            id: migaduDomain.id
          });
          await domain.save();
        } else {
          throw error;
        }
      }
    }

    // Step 3: Create default emails if requested
    const defaultEmails = createDefaultEmails ? [
      { localPart: 'admin', name: 'WEHOSTHERE Admin', password: 'Admin@2024!' },
      { localPart: 'info', name: 'WEHOSTHERE Info', password: 'Info@2024!' },
      { localPart: 'suporte', name: 'WEHOSTHERE Suporte', password: 'Suporte@2024!' }
    ] : [];

    const createdEmails = [];

    for (const emailConfig of defaultEmails) {
      try {
        console.log('[Initialize] Creating mailbox:', emailConfig.localPart);
        
        // Check if mailbox already exists
        const existingMailbox = await EmailMailbox.findOne({ 
          email: `${emailConfig.localPart}@${domainName}` 
        });

        if (existingMailbox) {
          console.log('[Initialize] Mailbox already exists:', emailConfig.localPart);
          createdEmails.push({
            email: existingMailbox.email,
            status: 'already_exists'
          });
          continue;
        }

        // Create mailbox in Migadu
        const mailbox = await provider.createMailbox(domainName, {
          name: emailConfig.name,
          localPart: emailConfig.localPart,
          password: emailConfig.password,
          passwordMethod: 'generated',
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
          email: `${emailConfig.localPart}@${domainName}`
        });
        await newMailbox.save();

        createdEmails.push({
          email: newMailbox.email,
          status: 'created',
          password: emailConfig.password // Return password for initial setup
        });

        console.log('[Initialize] Mailbox created:', newMailbox.email);
      } catch (error: any) {
        console.error('[Initialize] Failed to create mailbox:', emailConfig.localPart, error);
        createdEmails.push({
          email: `${emailConfig.localPart}@${domainName}`,
          status: 'failed',
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      domain: {
        domainName: domain.domainName,
        customerId: domain.customerId,
        status: domain.status
      },
      emails: createdEmails,
      message: 'Initialization completed successfully'
    });
  } catch (error) {
    console.error('[Initialize] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to initialize: ${errorMessage}`, details: String(error) },
      { status: 500 }
    );
  }
}
