import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import webpush from 'web-push';

// Configurar VAPID (em produção, usar variáveis de ambiente)
const VAPID_PUBLIC_KEY = 'BCpK8T8ZBF1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const VAPID_PRIVATE_KEY = 'YOUR_PRIVATE_KEY_HERE';
const VAPID_EMAIL = 'info@wehosthere.com';

webpush.setVapidDetails(
  'mailto:' + VAPID_EMAIL,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { userId, title, message, data, type } = body;

    if (!userId || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Buscar usuário e sua subscription
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const subscription = (user as any).pushSubscription;
    if (!subscription) {
      return NextResponse.json({ error: 'User has no push subscription' }, { status: 400 });
    }

    // Preparar payload da notificação
    const payload = JSON.stringify({
      title,
      message,
      data: data || {},
      type: type || 'general',
      url: data?.url || '/dashboard/notifications'
    });

    // Enviar notificação push
    try {
      await webpush.sendNotification(subscription, payload);
      
      return NextResponse.json({
        success: true,
        message: 'Push notification sent successfully'
      });
    } catch (pushError: any) {
      console.error('[Push Send] Error sending push notification:', pushError);
      
      // Se subscription expirou ou inválida, remover
      if (pushError.statusCode === 410 || pushError.statusCode === 404) {
        (user as any).pushSubscription = undefined;
        await user.save();
        
        return NextResponse.json({ 
          error: 'Subscription expired or invalid',
          code: 'SUBSCRIPTION_EXPIRED'
        }, { status: 400 });
      }
      
      throw pushError;
    }

  } catch (error) {
    console.error('[Push Send] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
