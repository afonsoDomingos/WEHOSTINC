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
      // Suportar referências com prefixo REF_ ou ORDER_
      const cleanRef = reference.replace('REF_', '').replace('ORDER_', '');
      if (cleanRef && cleanRef !== reference) {
        queryConditions.push({ reference: { $regex: new RegExp(cleanRef, 'i') } });
        queryConditions.push({ id: { $regex: new RegExp(cleanRef, 'i') } });
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

    console.log('[PAYMENT STATUS] Consulta:', { orderId, reference, status: (order as any).status });

    return NextResponse.json({
      orderId: (order as any).id,
      reference: (order as any).reference,
      status: (order as any).status,
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
