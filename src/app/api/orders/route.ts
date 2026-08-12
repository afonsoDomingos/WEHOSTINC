import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import OrderModel from '@/lib/models/Order';
import { addAdminNotification, dispatchMessage } from '@/lib/notifications';

let FALLBACK_ORDERS: any[] = [];

async function tryMongo() {
  try {
    await connectDB();
    return true;
  } catch (err) {
    console.warn('MongoDB connection issue (orders):', err);
    return false;
  }
}

export async function GET() {
  try {
    if (await tryMongo()) {
      const orders = await OrderModel.find({}).sort({ createdAt: -1 }).lean();
      return NextResponse.json({ orders });
    }
  } catch (e) { console.error('MongoDB indisponível (orders):', e); }
  return NextResponse.json({ orders: FALLBACK_ORDERS });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, order, orderId, status } = body;
    const useMongo = await tryMongo();

    if (action === 'update_status') {
      // Mapear status para texto legível
      const statusLabels: Record<string, string> = {
        pending: 'Pendente', active: 'Ativo', approved: 'Aprovado',
        rejected: 'Rejeitado', cancelled: 'Cancelado', completed: 'Concluído'
      };
      const statusLabel = statusLabels[status] || status;

      const notifTypeMap: Record<string, string> = {
        approved: 'order_approved', rejected: 'order_rejected',
        cancelled: 'order_cancelled', active: 'order_approved'
      };
      const notifType = notifTypeMap[status] || 'order_updated';

      const templateMap: Record<string, string> = {
        approved: 'order-approved', rejected: 'order-rejected',
        cancelled: 'order-cancelled'
      };
      const templateId = templateMap[status] || 'order-status-changed';

      if (useMongo) {
        const orderDoc: any = await OrderModel.findOne({ id: orderId }).lean();
        await OrderModel.findOneAndUpdate({ id: orderId }, { status });

        if (orderDoc) {
          addAdminNotification({
            title: `📋 Pedido #${orderId} → ${statusLabel}`,
            message: `Estado do pedido de ${orderDoc.clientName || orderDoc.clientEmail || 'cliente'} atualizado para "${statusLabel}".`,
            type: notifType as any,
            userEmail: orderDoc.clientEmail,
            userName: orderDoc.clientName,
            link: '/admin?tab=orders'
          });

          if (orderDoc.clientEmail) {
            dispatchMessage({
              recipientEmail: orderDoc.clientEmail,
              recipientName: orderDoc.clientName || orderDoc.clientEmail.split('@')[0],
              templateId,
              variables: {
                numero_pedido: orderId,
                valor: `${(orderDoc.valorPorFaturar || orderDoc.amount || 0).toLocaleString('pt-MZ')} MT`,
                estado_pedido: statusLabel
              },
              isAutomatic: true,
              eventType: `order_${status}`
            });
          }
        }

        return NextResponse.json({ success: true, orders: await OrderModel.find({}).sort({ createdAt: -1 }).lean() });
      }

      const fallbackOrder = FALLBACK_ORDERS.find(o => o.id === orderId);
      FALLBACK_ORDERS = FALLBACK_ORDERS.map(o => o.id === orderId ? { ...o, status } : o);

      if (fallbackOrder) {
        addAdminNotification({
          title: `📋 Pedido #${orderId} → ${statusLabel}`,
          message: `Estado do pedido de ${fallbackOrder.clientName || fallbackOrder.clientEmail || 'cliente'} atualizado para "${statusLabel}".`,
          type: notifType as any,
          userEmail: fallbackOrder.clientEmail,
          userName: fallbackOrder.clientName,
          link: '/admin?tab=orders'
        });
      }

      return NextResponse.json({ success: true, orders: FALLBACK_ORDERS });
    }

    if (action === 'delete') {
      const targetId = (orderId || body.id || '').toLowerCase().trim();
      if (useMongo) {
        if (targetId) {
          await OrderModel.deleteMany({ id: { $regex: new RegExp(`^${targetId}$`, 'i') } });
        }
        return NextResponse.json({ success: true, orders: await OrderModel.find({}).sort({ createdAt: -1 }).lean() });
      }
      FALLBACK_ORDERS = FALLBACK_ORDERS.filter(o => o.id?.toLowerCase() !== targetId);
      return NextResponse.json({ success: true, orders: FALLBACK_ORDERS });
    }

    const orderData = order || { 
      id: body.id || `ORD-${Date.now().toString().slice(-5)}`, 
      clientName: body.clientName, 
      clientEmail: body.clientEmail, 
      clientPhone: body.clientPhone || '', 
      serviceName: body.serviceName, 
      amount: body.amount,
      valorFaturado: body.valorFaturado || 0,
      valorPorFaturar: body.valorPorFaturar || body.amount || 0,
      paymentMethod: body.paymentMethod || 'bank_transfer', 
      proofUrl: body.proofUrl, 
      proofName: body.proofName, 
      status: body.status || 'pending', 
      createdAt: body.createdAt || new Date().toISOString() 
    };

    if (useMongo) {
      const existing = await OrderModel.findOne({ id: orderData.id });
      const isNew = !existing;
      await OrderModel.findOneAndUpdate({ id: orderData.id }, orderData, { upsert: true, new: true });

      if (isNew) {
        // Notificar admin de novo pedido
        addAdminNotification({
          title: `📦 Novo Pedido: #${orderData.id}`,
          message: `${orderData.clientName || orderData.userEmail || 'Cliente'} criou um novo pedido de ${orderData.serviceName || 'serviço'} no valor de ${(orderData.valorPorFaturar || orderData.amount || 0).toLocaleString('pt-MZ')} MT.`,
          type: 'order_new',
          userEmail: orderData.clientEmail || orderData.userEmail,
          userName: orderData.clientName || orderData.userName,
          link: '/admin?tab=orders'
        });

        // Enviar e-mail ao cliente
        dispatchMessage({
          recipientEmail: orderData.clientEmail || orderData.userEmail || '',
          recipientName: orderData.clientName || orderData.userName || 'Cliente',
          templateId: 'order-received',
          variables: {
            numero_pedido: orderData.id,
            valor: `${(orderData.valorPorFaturar || orderData.amount || 0).toLocaleString('pt-MZ')} MT`,
            estado_pedido: 'Pendente'
          },
          isAutomatic: true,
          eventType: 'order_new'
        });
      }

      return NextResponse.json({ success: true, order: orderData, orders: await OrderModel.find({}).sort({ createdAt: -1 }).lean() });
    }
    const idx = FALLBACK_ORDERS.findIndex(o => o.id === orderData.id);
    const isNewFallback = idx < 0;
    if (idx >= 0) FALLBACK_ORDERS[idx] = { ...FALLBACK_ORDERS[idx], ...orderData };
    else FALLBACK_ORDERS.unshift(orderData);

    if (isNewFallback) {
      addAdminNotification({
        title: `📦 Novo Pedido: #${orderData.id}`,
        message: `${orderData.clientName || orderData.userEmail || 'Cliente'} criou um novo pedido de ${orderData.serviceName || 'serviço'}.`,
        type: 'order_new',
        userEmail: orderData.clientEmail || orderData.userEmail,
        userName: orderData.clientName || orderData.userName,
        link: '/admin?tab=orders'
      });

      dispatchMessage({
        recipientEmail: orderData.clientEmail || orderData.userEmail || '',
        recipientName: orderData.clientName || orderData.userName || 'Cliente',
        templateId: 'order-received',
        variables: {
          numero_pedido: orderData.id,
          valor: `${(orderData.valorPorFaturar || orderData.amount || 0).toLocaleString('pt-MZ')} MT`,
          estado_pedido: 'Pendente'
        },
        isAutomatic: true,
        eventType: 'order_new'
      });
    }

    return NextResponse.json({ success: true, order: orderData, orders: FALLBACK_ORDERS });
  } catch (error) {
    console.error('Erro na API de Pedidos:', error);
    return NextResponse.json({ error: 'Erro ao processar pedidos' }, { status: 500 });
  }
}
