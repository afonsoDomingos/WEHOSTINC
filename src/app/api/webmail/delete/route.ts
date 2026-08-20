import { NextRequest, NextResponse } from 'next/server';
import { migaduImapSmtp } from '@/lib/migaduImapSmtp';

// POST - Delete message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, uid, folder } = body;

    if (!email || !password || uid === undefined || !folder) {
      return NextResponse.json(
        { error: 'Email, password, uid, and folder are required' },
        { status: 400 }
      );
    }

    await migaduImapSmtp.deleteMessage(email, password, uid, folder);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Webmail Delete] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}
