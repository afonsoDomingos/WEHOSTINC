import { NextRequest, NextResponse } from 'next/server';
import { getEmailProvider } from '@/lib/emailProviders/base';
import { EmailMailbox } from '@/models/EmailMailbox';
import { auth } from '@/lib/auth';

// POST - Reset mailbox password
export async function POST(
  request: NextRequest,
  { params }: { params: { domain: string; localPart: string } }
) {
  try {
    const user = await auth.getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { domain, localPart } = params;
    const body = await request.json();
    const { newPassword } = body;
    const email = `${localPart}@${domain}`;

    const mailbox = await EmailMailbox.findOne({ email });
    if (!mailbox) {
      return NextResponse.json({ error: 'Mailbox not found' }, { status: 404 });
    }

    // 🔒 Verify ownership: customer can only reset their own mailboxes
    if (user.role !== 'admin' && mailbox.customerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const provider = getEmailProvider();
    const password = await provider.resetMailboxPassword(domain, localPart, newPassword);

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
      // 🔒 NÃO retornar a password real
      password: 'Password foi alterada com sucesso'
    });
  } catch (error) {
    console.error('[Migadu Mailbox Reset Password POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
