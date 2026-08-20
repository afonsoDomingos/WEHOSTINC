import { NextRequest, NextResponse } from 'next/server';
import { migaduImapSmtp } from '@/lib/migaduImapSmtp';

// POST - Mark message as read/unread
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, uid, isRead } = body;

    if (!email || !password || uid === undefined) {
      return NextResponse.json(
        { error: 'Email, password, and uid are required' },
        { status: 400 }
      );
    }

    await migaduImapSmtp.markAsRead(email, password, uid, isRead);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Webmail Mark Read] Error:', error);
    return NextResponse.json(
      { error: 'Failed to mark message' },
      { status: 500 }
    );
  }
}
