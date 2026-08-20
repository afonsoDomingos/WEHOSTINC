import { NextRequest, NextResponse } from 'next/server';
import { getEmailProvider } from '@/lib/emailProviders/base';
import { EmailMailbox } from '@/models/EmailMailbox';
import { EmailDomain } from '@/models/EmailDomain';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';

// GET - Get mailbox details
export async function GET(
  request: NextRequest,
  { params }: { params: { domain: string; localPart: string } }
) {
  try {
    await connectDB();
    const user = await auth.getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { domain, localPart } = params;
    const email = `${localPart}@${domain}`;

    const mailbox = await EmailMailbox.findOne({ email });
    if (!mailbox) {
      return NextResponse.json({ error: 'Mailbox not found' }, { status: 404 });
    }

    // 🔒 Verify ownership: customer can only access their own mailboxes
    if (user.role !== 'admin' && mailbox.customerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      mailbox: {
        ...mailbox.toObject(),
        password: undefined
      }
    });
  } catch (error) {
    console.error('[Migadu Mailbox GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get mailbox' },
      { status: 500 }
    );
  }
}

// PUT - Update mailbox
export async function PUT(
  request: NextRequest,
  { params }: { params: { domain: string; localPart: string } }
) {
  try {
    await connectDB();
    const user = await auth.getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { domain, localPart } = params;
    const body = await request.json();
    const email = `${localPart}@${domain}`;

    const mailbox = await EmailMailbox.findOne({ email });
    if (!mailbox) {
      return NextResponse.json({ error: 'Mailbox not found' }, { status: 404 });
    }

    const provider = getEmailProvider();
    const updatedMailbox = await provider.updateMailbox(domain, localPart, body);

    // Update our database
    Object.assign(mailbox, updatedMailbox);
    await mailbox.save();

    return NextResponse.json({
      success: true,
      mailbox: {
        ...mailbox.toObject(),
        password: undefined
      }
    });
  } catch (error) {
    console.error('[Migadu Mailbox PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update mailbox' },
      { status: 500 }
    );
  }
}

// DELETE - Delete mailbox
export async function DELETE(
  request: NextRequest,
  { params }: { params: { domain: string; localPart: string } }
) {
  try {
    await connectDB();
    const user = await auth.getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { domain, localPart } = params;
    const email = `${localPart}@${domain}`;

    const mailbox = await EmailMailbox.findOne({ email });
    if (!mailbox) {
      return NextResponse.json({ error: 'Mailbox not found' }, { status: 404 });
    }

    // 🔒 Verify ownership: customer can only access their own mailboxes
    if (user.role !== 'admin' && mailbox.customerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const provider = getEmailProvider();
    const deleted = await provider.deleteMailbox(domain, localPart);

    if (deleted) {
      await EmailMailbox.deleteOne({ email });
    }

    return NextResponse.json({
      success: true,
      message: 'Mailbox deleted successfully'
    });
  } catch (error) {
    console.error('[Migadu Mailbox DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete mailbox' },
      { status: 500 }
    );
  }
}
