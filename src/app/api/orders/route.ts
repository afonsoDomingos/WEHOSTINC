import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import OrderModel from '@/lib/models/Order';

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
      if (useMongo) {
        await OrderModel.findOneAndUpdate({ id: orderId }, { status });
        return NextResponse.json({ success: true, orders: await OrderModel.find({}).sort({ createdAt: -1 }).lean() });
      }
      FALLBACK_ORDERS = FALLBACK_ORDERS.map(o => o.id === orderId ? { ...o, status } : o);
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

    const orderData = order || { id: body.id || `ORD-${Date.now().toString().slice(-5)}`, clientName: body.clientName, clientEmail: body.clientEmail, clientPhone: body.clientPhone || '', serviceName: body.serviceName, amount: body.amount, paymentMethod: body.paymentMethod || 'bank_transfer', proofUrl: body.proofUrl, proofName: body.proofName, status: body.status || 'pending', createdAt: body.createdAt || new Date().toISOString() };

    if (useMongo) {
      await OrderModel.findOneAndUpdate({ id: orderData.id }, orderData, { upsert: true, new: true });
      return NextResponse.json({ success: true, order: orderData, orders: await OrderModel.find({}).sort({ createdAt: -1 }).lean() });
    }
    const idx = FALLBACK_ORDERS.findIndex(o => o.id === orderData.id);
    if (idx >= 0) FALLBACK_ORDERS[idx] = { ...FALLBACK_ORDERS[idx], ...orderData };
    else FALLBACK_ORDERS.unshift(orderData);
    return NextResponse.json({ success: true, order: orderData, orders: FALLBACK_ORDERS });
  } catch (error) {
    console.error('Erro na API de Pedidos:', error);
    return NextResponse.json({ error: 'Erro ao processar pedidos' }, { status: 500 });
  }
}
