import { NextRequest, NextResponse } from 'next/server';
import { migaduImapSmtp } from '@/lib/migaduImapSmtp';

// GET - List messages from IMAP
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const password = searchParams.get('password');
    const folder = searchParams.get('folder') || 'INBOX';

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const imapMessages = await migaduImapSmtp.listMessages(email, password, folder);
    
    // Convert to WebmailMessage format
    const messages = imapMessages.map(msg => ({
      id: msg.id,
      uid: msg.uid,
      accountEmail: email,
      fromName: msg.from.name,
      fromEmail: msg.from.address,
      toEmail: msg.to[0]?.address || '',
      subject: msg.subject,
      body: msg.body,
      date: msg.date.toISOString(),
      isRead: msg.isRead,
      starred: msg.starred,
      folder: folder.toLowerCase(),
      avatarColor: 'bg-primary-600',
      attachments: msg.attachments?.map(att => ({
        url: '',
        name: att.filename,
        size: att.size,
        type: att.contentType
      }))
    }));

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error('[Webmail Messages] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
