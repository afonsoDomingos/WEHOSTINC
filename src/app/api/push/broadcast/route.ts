import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import PushSubscriptionModel from '@/lib/models/PushSubscription';
import webpush from 'web-push';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = 'info@wehosthere.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails('mailto:' + VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

/**
 * POST /api/push/broadcast
 * Envia uma notificação push para TODOS os subscritores registados.
 * Usado para notificar leitores quando uma nova história é publicada na revista.
 *
 * Body: { title, message, url, icon?, tag?, adminOnly? }
 */
export async function POST(request: NextRequest) {
  try {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Chaves VAPID não configuradas' },
        { status: 503 }
      );
    }

    await connectDB();

    const body = await request.json();
    const {
      title,
      message,
      url = '/revista',
      icon = '/mascote-transparent.png',
      tag = 'revista-nova-historia',
      adminOnly = false,
    } = body;

    if (!title || !message) {
      return NextResponse.json({ error: 'title e message são obrigatórios' }, { status: 400 });
    }

    // Buscar todos os subscritores (ou só admins, dependendo do flag)
    const filter = adminOnly ? { isAdmin: true } : {};
    const subscribers = await PushSubscriptionModel.find(filter).lean();

    if (!subscribers.length) {
      return NextResponse.json({ success: true, sent: 0, message: 'Nenhum subscritor encontrado' });
    }

    const payload = JSON.stringify({
      title,
      message,
      body: message,
      icon,
      badge: icon,
      tag,
      renotify: true,
      data: { url },
      url,
    });

    let sent = 0;
    let failed = 0;
    const expiredEndpoints: string[] = [];

    await Promise.allSettled(
      subscribers.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
            },
            payload
          );
          sent++;
        } catch (err: any) {
          failed++;
          if (err.statusCode === 410 || err.statusCode === 404) {
            expiredEndpoints.push(sub.endpoint);
          }
        }
      })
    );

    // Limpar subscriptions expiradas
    if (expiredEndpoints.length > 0) {
      await PushSubscriptionModel.deleteMany({ endpoint: { $in: expiredEndpoints } });
      console.log(`[Push Broadcast] Removidas ${expiredEndpoints.length} subscriptions expiradas`);
    }

    console.log(`[Push Broadcast] Enviadas: ${sent}, Falhadas: ${failed}, Expiradas removidas: ${expiredEndpoints.length}`);

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: subscribers.length,
      expiredRemoved: expiredEndpoints.length,
    });
  } catch (error) {
    console.error('[Push Broadcast] Erro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
