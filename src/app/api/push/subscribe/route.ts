import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import PushSubscriptionModel from '@/lib/models/PushSubscription';
import UserModel from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { 
      userId, 
      userEmail, 
      userName, 
      isAdmin = false, 
      role = 'user',
      subscription,
      deviceType = 'mobile'
    } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: 'Missing subscription or keys' }, { status: 400 });
    }

    const userAgent = request.headers.get('user-agent') || '';

    // Determinar se é admin verificando o banco ou a flag
    let resolvedIsAdmin = Boolean(isAdmin);
    let resolvedRole: 'super_admin' | 'admin' | 'user' = role === 'admin' || role === 'super_admin' ? role : 'user';

    if (userEmail) {
      const dbUser = await UserModel.findOne({ email: userEmail.toLowerCase().trim() });
      if (dbUser && (dbUser.role === 'admin' || dbUser.role === 'super_admin')) {
        resolvedIsAdmin = true;
        resolvedRole = dbUser.role;
      }
    } else if (userId) {
      const dbUser = await UserModel.findOne({ $or: [{ id: userId }, { _id: userId.length === 24 ? userId : null }] });
      if (dbUser && (dbUser.role === 'admin' || dbUser.role === 'super_admin')) {
        resolvedIsAdmin = true;
        resolvedRole = dbUser.role;
      }
    }

    // Upsert na coleção PushSubscription (suporta múltiplos aparelhos por admin)
    await PushSubscriptionModel.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        userId: userId || undefined,
        userEmail: userEmail ? userEmail.toLowerCase().trim() : undefined,
        userName: userName || undefined,
        role: resolvedRole,
        isAdmin: resolvedIsAdmin,
        userAgent,
        deviceType,
        lastActiveAt: new Date()
      },
      { upsert: true, new: true }
    );

    console.log(`[Push Subscribe] Dispositivo registado com sucesso (Admin: ${resolvedIsAdmin}, Role: ${resolvedRole})`);

    return NextResponse.json({
      success: true,
      message: 'Push subscription saved successfully',
      isAdmin: resolvedIsAdmin
    });

  } catch (error) {
    console.error('[Push Subscribe] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

