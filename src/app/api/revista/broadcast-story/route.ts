import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import UserModel from '@/lib/models/User';
import Newsletter from '@/lib/models/Newsletter';
import CommunicationLog from '@/lib/models/CommunicationLog';
import { sendStoryBroadcastEmail } from '@/lib/sendgrid';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.wehosthere.com';

/** Delay helper */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      storyId,
      storyTitle,
      storySlug,
      storyExcerpt,
      authorName,
      coverImageUrl,
      category,
      readTime,
    } = body as {
      storyId: string;
      storyTitle: string;
      storySlug: string;
      storyExcerpt: string;
      authorName: string;
      coverImageUrl?: string;
      category?: string;
      readTime?: string;
    };

    if (!storyId || !storyTitle || !storySlug || !storyExcerpt || !authorName) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios em falta: storyId, storyTitle, storySlug, storyExcerpt, authorName' },
        { status: 400 }
      );
    }

    await connectDB();

    // ── 1. Recolher destinatários ──────────────────────────────────────────

    // Platform users: active only, email confirmed
    const platformUsers = await UserModel.find(
      { status: 'active' },
      { email: 1, name: 1 }
    ).lean();

    // Newsletter subscribers: active only
    const newsletterSubs = await Newsletter.find(
      { status: 'active' },
      { email: 1, name: 1 }
    ).lean();

    // ── 2. Deduplicar por email (merge name from user if available) ─────────
    const recipientMap = new Map<string, { email: string; name: string; source: 'user' | 'newsletter' | 'both' }>();

    for (const u of platformUsers as Array<{ email: string; name?: string }>) {
      if (!u.email) continue;
      const key = u.email.toLowerCase();
      recipientMap.set(key, { email: key, name: u.name || '', source: 'user' });
    }

    for (const s of newsletterSubs as Array<{ email: string; name?: string }>) {
      if (!s.email) continue;
      const key = s.email.toLowerCase();
      if (recipientMap.has(key)) {
        recipientMap.get(key)!.source = 'both';
      } else {
        recipientMap.set(key, { email: key, name: (s.name as string) || '', source: 'newsletter' });
      }
    }

    const recipients = Array.from(recipientMap.values());

    if (recipients.length === 0) {
      return NextResponse.json({ success: true, sent: 0, failed: 0, message: 'Nenhum destinatário encontrado.' });
    }

    // ── 3. Enviar em lotes de 10 com intervalo de 300ms ───────────────────
    const BATCH_SIZE = 10;
    const BATCH_DELAY_MS = 300;

    let sent = 0;
    let failed = 0;
    const errors: { email: string; error: string }[] = [];

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (recipient) => {
          const unsubscribeUrl = `${SITE_URL}/newsletter/unsubscribe?email=${encodeURIComponent(recipient.email)}`;

          const result = await sendStoryBroadcastEmail({
            toEmail: recipient.email,
            recipientName: recipient.name || undefined,
            storyTitle,
            storySlug,
            storyExcerpt,
            authorName,
            coverImageUrl,
            category,
            readTime,
            unsubscribeUrl,
          });

          // ── Log in CommunicationLog ──
          try {
            await CommunicationLog.create({
              recipientEmail: recipient.email,
              recipientName: recipient.name || recipient.email,
              subject: `📖 Nova história: ${storyTitle} | Codando Histórias`,
              body: `Nova história publicada: "${storyTitle}" por ${authorName}. Slug: ${storySlug}`,
              templateName: 'story-broadcast',
              eventType: `revista-story-${storyId}`,
              channel: 'email',
              isAutomatic: true,
              status: result.success ? 'sent' : 'failed',
              error: result.success ? null : (result.error || 'Erro desconhecido'),
              sentAt: new Date(),
            });
          } catch (logErr) {
            // Don't fail main flow because of logging error
            console.error('[StoryBroadcast] Erro ao registar log:', logErr);
          }

          if (result.success) {
            sent++;
          } else {
            failed++;
            errors.push({ email: recipient.email, error: result.error || 'Erro desconhecido' });
          }
        })
      );

      // Throttle between batches (skip delay after last batch)
      if (i + BATCH_SIZE < recipients.length) {
        await sleep(BATCH_DELAY_MS);
      }
    }

    console.log(`[StoryBroadcast] ✅ Concluído — enviados: ${sent}, falhados: ${failed}, total: ${recipients.length}`);

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: recipients.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    console.error('[StoryBroadcast] ❌ Erro crítico:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
