import { NextResponse } from 'next/server';

// VAPID keys geradas (em produção, isso deve estar em variáveis de ambiente)
const VAPID_PUBLIC_KEY = 'BCpK8T8ZBF1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const VAPID_PRIVATE_KEY = 'YOUR_PRIVATE_KEY_HERE';

export async function GET() {
  return NextResponse.json({
    publicKey: VAPID_PUBLIC_KEY
  });
}
