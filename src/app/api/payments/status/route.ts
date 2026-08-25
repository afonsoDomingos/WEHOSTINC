import { NextResponse } from 'next/server';
import { dataManager } from '@/lib/data';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    const reference = searchParams.get('reference');

    if (!orderId && !reference) {
      return NextResponse.json(
        { error: 'orderId ou reference é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar pedidos
    const orders = await dataManager.fetchOrdersAsync();
    
    // Encontrar pedido por orderId ou reference
    const order = orders.find((o: any) => {
      if (orderId) return o.id === orderId;
      if (reference) {
        return o.reference === reference || 
               o.serviceName?.includes(reference) ||
               o.serviceName?.includes(reference.replace('REF_', '').replace('ORDER_', ''));
      }
      return false;
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    console.log('[PAYMENT STATUS] Consulta:', { orderId, reference, status: order.status });

    return NextResponse.json({
      orderId: order.id,
      reference: order.reference,
      status: order.status,
      amount: order.amount,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt
    });
  } catch (error) {
    console.error('[PAYMENT STATUS] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao consultar status do pagamento' },
      { status: 500 }
    );
  }
}
