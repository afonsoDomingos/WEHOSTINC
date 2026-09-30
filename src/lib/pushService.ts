import { connectDB } from '@/lib/mongodb';
import PushSubscriptionModel from '@/lib/models/PushSubscription';
import webpush from '@/lib/vapid';

export interface PushNotificationPayload {
  title: string;
  message: string;
  icon?: string;
  badge?: string;
  url?: string;
  data?: Record<string, any>;
  tag?: string;
}

/**
 * Envia notificação push para TODOS os dispositivos de administradores registados.
 * Suporta múltiplos dispositivos por admin (ex: telemóvel Android, iPhone PWA e PC).
 */
export async function sendPushToAdmins(payload: PushNotificationPayload) {
  try {
    await connectDB();

    const adminSubscriptions = await PushSubscriptionModel.find({
      $or: [
        { isAdmin: true },
        { role: { $in: ['admin', 'super_admin'] } }
      ]
    }).lean();

    if (!adminSubscriptions || adminSubscriptions.length === 0) {
      console.log('[Push Service] Nenhum administrador com push ativo no momento.');
      return { success: true, sentCount: 0, totalAdmins: 0 };
    }

    console.log(`[Push Service] Enviando notificação para ${adminSubscriptions.length} dispositivo(s) admin...`);

    const notificationData = JSON.stringify({
      title: payload.title,
      message: payload.message,
      body: payload.message,
      icon: payload.icon || '/mascote-transparent.png',
      badge: payload.badge || '/mascote-transparent.png',
      url: payload.url || '/admin?tab=orders',
      data: {
        url: payload.url || '/admin?tab=orders',
        ...(payload.data || {})
      },
      tag: payload.tag || 'wehosthere-admin-alert'
    });

    let sentCount = 0;
    const expiredIds: string[] = [];

    await Promise.all(
      adminSubscriptions.map(async (sub) => {
        try {
          const pushConfig = {
            endpoint: sub.endpoint,
            keys: sub.keys
          };
          await webpush.sendNotification(pushConfig, notificationData);
          sentCount++;
        } catch (err: any) {
          console.warn(`[Push Service] Falha ao enviar para ${sub.endpoint.slice(0, 30)}...:`, err.statusCode || err.message);
          // Se expirou ou foi revogada (404 ou 410)
          if (err.statusCode === 410 || err.statusCode === 404) {
            expiredIds.push(sub._id.toString());
          }
        }
      })
    );

    // Limpar endpoints expirados
    if (expiredIds.length > 0) {
      await PushSubscriptionModel.deleteMany({ _id: { $in: expiredIds } });
      console.log(`[Push Service] Removidas ${expiredIds.length} subscrições push expiradas.`);
    }

    console.log(`[Push Service] Sucesso: Enviado para ${sentCount}/${adminSubscriptions.length} dispositivo(s) admin.`);
    return { success: true, sentCount, totalAdmins: adminSubscriptions.length };
  } catch (error) {
    console.error('[Push Service] Erro geral ao enviar push para admins:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Envia notificação push para um utilizador específico pelo seu userId ou email
 */
export async function sendPushToUser(userIdentifier: string, payload: PushNotificationPayload) {
  try {
    await connectDB();

    const subscriptions = await PushSubscriptionModel.find({
      $or: [
        { userId: userIdentifier },
        { userEmail: userIdentifier.toLowerCase().trim() }
      ]
    }).lean();

    if (!subscriptions || subscriptions.length === 0) {
      return { success: true, sentCount: 0 };
    }

    const notificationData = JSON.stringify({
      title: payload.title,
      message: payload.message,
      body: payload.message,
      icon: payload.icon || '/mascote-transparent.png',
      badge: payload.badge || '/mascote-transparent.png',
      url: payload.url || '/dashboard/notifications',
      data: {
        url: payload.url || '/dashboard/notifications',
        ...(payload.data || {})
      },
      tag: payload.tag || 'wehosthere-user-alert'
    });

    let sentCount = 0;
    const expiredIds: string[] = [];

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          const pushConfig = {
            endpoint: sub.endpoint,
            keys: sub.keys
          };
          await webpush.sendNotification(pushConfig, notificationData);
          sentCount++;
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            expiredIds.push(sub._id.toString());
          }
        }
      })
    );

    if (expiredIds.length > 0) {
      await PushSubscriptionModel.deleteMany({ _id: { $in: expiredIds } });
    }

    return { success: true, sentCount };
  } catch (error) {
    console.error('[Push Service] Erro ao enviar push para utilizador:', error);
    return { success: false, error: (error as Error).message };
  }
}
