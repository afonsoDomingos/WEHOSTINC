import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { userId, email, title = 'Teste Push', message = 'Esta é uma notificação de teste' } = body;

    if (!userId && !email) {
      return NextResponse.json({ error: 'User ID or email is required' }, { status: 400 });
    }

    // Buscar usuário por ID ou email
    let user;
    if (userId) {
      user = await User.findById(userId);
    }
    
    if (!user && email) {
      user = await User.findOne({ email: email.toLowerCase() });
    }
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const subscription = (user as any).pushSubscription;
    if (!subscription) {
      return NextResponse.json({ 
        error: 'User has no push subscription',
        message: 'O usuário precisa ativar as notificações push primeiro no dashboard'
      }, { status: 400 });
    }

    // Enviar notificação de teste
    const pushResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/push/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        title,
        message,
        data: {
          type: 'test',
          url: '/dashboard/notifications'
        },
        type: 'test'
      })
    });

    const pushData = await pushResponse.json();

    if (!pushResponse.ok) {
      return NextResponse.json({ 
        error: 'Failed to send push notification',
        details: pushData
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Notificação de teste enviada com sucesso',
      details: {
        userId,
        title,
        message,
        subscriptionExists: !!subscription
      }
    });

  } catch (error) {
    console.error('[Push Test] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
