import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import OrderModel from '@/lib/models/Order';

// GET: Retorna todos os pedidos
export async function GET() {
  try {
    await connectDB();
    const orders = await OrderModel.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return NextResponse.json({ orders: [] }, { status: 500 });
  }
}

// POST: Criar, atualizar status ou eliminar pedido
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { action, order, orderId, status } = body;

    if (action === 'update_status') {
      await OrderModel.findOneAndUpdate({ id: orderId }, { status });
      const orders = await OrderModel.find({}).sort({ createdAt: -1 }).lean();
      return NextResponse.json({ success: true, orders });
    }

    if (action === 'delete') {
      const targetId = (orderId || body.id || '').toLowerCase();
      await OrderModel.deleteOne({ id: { $regex: new RegExp(`^${targetId}$`, 'i') } });
      const orders = await OrderModel.find({}).sort({ createdAt: -1 }).lean();
      return NextResponse.json({ success: true, orders });
    }

    // Criar ou atualizar pedido
    const orderData = order || {
      id: body.id || `ORD-${Date.now().toString().slice(-5)}`,
      clientName: body.clientName,
      clientEmail: body.clientEmail,
      clientPhone: body.clientPhone || '',
      serviceName: body.serviceName,
      amount: body.amount,
      paymentMethod: body.paymentMethod || 'bank_transfer',
      proofUrl: body.proofUrl,
      proofName: body.proofName,
      status: body.status || 'pending',
      createdAt: body.createdAt || new Date().toISOString()
    };

    await OrderModel.findOneAndUpdate(
      { id: orderData.id },
      orderData,
      { upsert: true, new: true }
    );

    const orders = await OrderModel.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, order: orderData, orders });
  } catch (error) {
    console.error('Erro na API de Pedidos:', error);
    return NextResponse.json({ error: 'Erro ao processar pedidos' }, { status: 500 });
  }
}
