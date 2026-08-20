import { NextRequest, NextResponse } from 'next/server';
import { migaduImapSmtp } from '@/lib/migaduImapSmtp';

// POST - Move message to folder
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, uid, fromFolder, toFolder } = body;

    if (!email || !password || uid === undefined || !fromFolder || !toFolder) {
      return NextResponse.json(
        { error: 'Email, password, uid, fromFolder, and toFolder are required' },
        { status: 400 }
      );
    }

    await migaduImapSmtp.moveMessage(email, password, uid, fromFolder, toFolder);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Webmail Move] Error:', error);
    return NextResponse.json(
      { error: 'Failed to move message' },
      { status: 500 }
    );
  }
}
