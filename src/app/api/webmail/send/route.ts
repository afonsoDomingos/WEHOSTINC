import { NextRequest, NextResponse } from 'next/server';
import { migaduImapSmtp } from '@/lib/migaduImapSmtp';

// POST - Send email via SMTP
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, to, subject, body: emailBody, attachments } = body;

    if (!email || !password || !to || !emailBody) {
      return NextResponse.json(
        { error: 'Email, password, to, and body are required' },
        { status: 400 }
      );
    }

    // Process attachments
    const processedAttachments = attachments?.map((att: any) => {
      if (att.url && att.url.startsWith('data:')) {
        const base64Data = att.url.split(',')[1];
        return {
          filename: att.name,
          content: Buffer.from(base64Data, 'base64'),
          contentType: att.type
        };
      }
      return null;
    }).filter((a: any) => a !== null);

    await migaduImapSmtp.sendEmail({
      from: email,
      to: Array.isArray(to) ? to : [to],
      subject,
      text: emailBody,
      html: emailBody,
      attachments: processedAttachments
    }, password);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Webmail Send] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
