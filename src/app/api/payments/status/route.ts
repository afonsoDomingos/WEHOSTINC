import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import OrderModel from '@/lib/models/Order';

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

    // 🔒 CORREÇÃO: Consultar MongoDB diretamente (fonte de verdade do webhook)
    // Evita dependência de dataManager/localStorage no contexto server-side
    await connectDB();

    // Construir query de busca flexível (mesmo critério usado pelo webhook)
    const queryConditions: any[] = [];

    if (orderId) {
      queryConditions.push({ id: orderId });
    }

    if (reference) {
      queryConditions.push({ reference });
      queryConditions.push({ kivoraPaymentId: reference });
      // 🔒 SEGURANÇA: Sanitizar referência e prevenir Regex Injection / ReDoS
      const cleanRef = reference.replace(/^REF_|^ORDER_/i, '').trim();
      // Apenas aceitar padrão alfanumérico seguro com pelo menos 3 caracteres
      if (cleanRef && cleanRef !== reference && /^[a-zA-Z0-9_-]{3,64}$/.test(cleanRef)) {
        const escapedRef = cleanRef.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        queryConditions.push({ reference: { $regex: new RegExp(escapedRef, 'i') } });
        queryConditions.push({ id: { $regex: new RegExp(escapedRef, 'i') } });
      }
    }

    const order = queryConditions.length > 0
      ? await OrderModel.findOne({ $or: queryConditions }).lean()
      : null;

    if (!order) {
      console.log('[PAYMENT STATUS] Pedido não encontrado:', { orderId, reference });
      // Retornar pending para continuar o polling (pedido pode ainda não ter sido criado)
      return NextResponse.json(
        { error: 'Pedido não encontrado', status: 'pending' },
        { status: 404 }
      );
    }

    // Se ainda estiver pending e tiver kivoraPaymentId, sincronizar com a Kivora em tempo real
    if (order && (order as any).status === 'pending' && (order as any).kivoraPaymentId) {
      try {
        const { kivora } = await import('@/lib/kivora');
        const liveKivora = await kivora.getC2BPayment((order as any).kivoraPaymentId);
        if (liveKivora) {
          if (liveKivora.status === 'paid') {
            await OrderModel.findOneAndUpdate({ id: (order as any).id }, { status: 'completed' });
            (order as any).status = 'completed';
          } else if (liveKivora.status === 'failed') {
            await OrderModel.findOneAndUpdate({ id: (order as any).id }, { status: 'cancelled' });
            (order as any).status = 'cancelled';
          }
        }
      } catch (kivoraErr) {
        // consulta em background não bloqueante
      }
    }

    console.log('[PAYMENT STATUS] Consulta:', { orderId, reference, status: (order as any).status });

    return NextResponse.json({
      orderId: (order as any).id,
      reference: (order as any).reference,
      status: (order as any).status,
      failureReason: (order as any).failureReason || null,
      amount: (order as any).amount,
      paymentMethod: (order as any).paymentMethod,
      createdAt: (order as any).createdAt
    });
  } catch (error) {
    console.error('[PAYMENT STATUS] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao consultar status do pagamento' },
      { status: 500 }
    );
  }
}
