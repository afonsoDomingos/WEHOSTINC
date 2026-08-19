import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import SalesNotification from '@/lib/models/SalesNotification';
import User from '@/lib/models/User';
import { dispatchMessage } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { 
      userId, 
      orderId, 
      orderNumber, 
      type, 
      title, 
      message, 
      amount, 
      currency = 'MZN',
      items,
      metadata,
      channels = { email: true, push: false, sms: false }
    } = body;

    if (!userId || !orderId || !type || !title || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Buscar usuário
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Criar notificação
    const notification = new SalesNotification({
      userId,
      orderId,
      orderNumber,
      type,
      title,
      message,
      amount,
      currency,
      items: items || [],
      metadata: metadata || {},
      channels,
      sentAt: {}
    });

    // Enviar notificação por email se habilitado
    if (channels.email && user.email) {
      try {
        const templateId = type === 'new_sale' ? 'sale-notification' : 
                         type === 'subscription_renewal' ? 'subscription-renewal' :
                         type === 'upgrade' ? 'upgrade-notification' :
                         type === 'refund' ? 'refund-notification' : 'payment-failed';

        await dispatchMessage({
          recipientEmail: user.email,
          recipientName: user.name || 'Cliente',
          templateId,
          variables: {
            nome_cliente: user.name || 'Cliente',
            numero_pedido: orderNumber,
            valor_total: amount.toLocaleString('pt-MZ') + ' ' + currency,
            tipo_venda: type,
            itens: items?.map((i: any) => `${i.name} (x${i.quantity})`).join(', ') || '',
            ...metadata
          },
          isAutomatic: true,
          eventType: 'sales_notification',
          channel: 'email'
        });

        notification.sentAt.email = new Date();
        console.log(`[Sales Notification] Email sent to ${user.email} for order ${orderNumber}`);
      } catch (err) {
        console.error('[Sales Notification] Error sending email:', err);
      }
    }

    // Enviar notificação push se habilitado (implementação futura)
    if (channels.push) {
      // TODO: Implementar push notifications
      notification.sentAt.push = new Date();
    }

    // Enviar SMS se habilitado (implementação futura)
    if (channels.sms && (user as any).phone) {
      // TODO: Implementar SMS notifications
      notification.sentAt.sms = new Date();
    }

    await notification.save();

    return NextResponse.json({
      success: true,
      notification: {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        amount: notification.amount,
        currency: notification.currency,
        status: notification.status,
        sentAt: notification.sentAt
      }
    });

  } catch (error) {
    console.error('[Sales Notification] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET para listar notificações do usuário
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const status = searchParams.get('status') || 'unread';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const notifications = await SalesNotification.find({ 
      userId,
      status: status === 'all' ? { $in: ['unread', 'read', 'archived'] } : status
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset);

    const total = await SalesNotification.countDocuments({ 
      userId,
      status: status === 'all' ? { $in: ['unread', 'read', 'archived'] } : status
    });

    const unreadCount = await SalesNotification.countDocuments({ 
      userId, 
      status: 'unread' 
    });

    return NextResponse.json({
      success: true,
      notifications,
      total,
      unreadCount,
      limit,
      offset
    });

  } catch (error) {
    console.error('[Sales Notification GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
