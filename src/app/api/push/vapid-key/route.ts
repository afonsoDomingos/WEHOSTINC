import { NextResponse } from 'next/server';
import webpush from 'web-push';

// Gerar VAPID keys se não existirem
let VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
let VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.warn('[VAPID] Chaves VAPID não configuradas. Gerando chaves temporárias para desenvolvimento.');
  const vapidKeys = webpush.generateVAPIDKeys();
  VAPID_PUBLIC_KEY = vapidKeys.publicKey;
  VAPID_PRIVATE_KEY = vapidKeys.privateKey;
  
  console.log('[VAPID] Chaves geradas (salvar em .env.local):');
  console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY=' + VAPID_PUBLIC_KEY);
  console.log('VAPID_PRIVATE_KEY=' + VAPID_PRIVATE_KEY);
}

export async function GET() {
  return NextResponse.json({
    publicKey: VAPID_PUBLIC_KEY
  });
}
