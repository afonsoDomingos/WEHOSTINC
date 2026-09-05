import { NextResponse } from 'next/server';
import { kivora } from '@/lib/kivora';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, amount, reference, description, clientName, clientEmail, serviceName, customer, metadata } = body;

    if (!phone || !amount) {
      return NextResponse.json(
        { error: 'Parâmetros phone e amount são obrigatórios.' },
        { status: 400 }
      );
    }

    const paymentRef = reference || `REF_${Date.now()}`;
    const cust = customer || {
      name: clientName || undefined,
      email: clientEmail || undefined,
      phone
    };

    const result = await kivora.createC2BPayment({
      phone,
      amount,
      reference: paymentRef,
      description: description || `Pagamento via Kivora - ${serviceName || 'Serviço'}`,
      customer: cust,
      metadata: {
        ...metadata,
        clientName: cust.name || clientName,
        clientEmail: cust.email || clientEmail,
        clientPhone: cust.phone || phone,
        serviceName
      }
    });

    console.log('[KIVORA API] C2B Response:', result);

    // Persistir pedido no MongoDB se temos result.id
    if (result.id) {
      try {
        const { connectDB } = await import('@/lib/mongodb');
        const OrderModel = (await import('@/lib/models/Order')).default;
        await connectDB();

        const orderId = `ORD-${Date.now().toString().slice(-6)}`;
        await OrderModel.findOneAndUpdate(
          {
            $or: [
              { reference: paymentRef },
              { kivoraPaymentId: result.id }
            ]
          },
          {
            $set: {
              id: orderId,
              clientName: cust.name || clientName || 'Cliente Kivora',
              clientEmail: cust.email || clientEmail || 'cliente@kivora.mz',
              clientPhone: cust.phone || phone,
              serviceName: serviceName || description || 'Pagamento Kivora',
              amount,
              paymentMethod: 'mpesa',
              kivoraPaymentId: result.id,
              reference: paymentRef,
              status: 'pending'
            },
            $setOnInsert: {
              createdAt: new Date().toISOString()
            }
          },
          { upsert: true, new: true }
        );
      } catch (dbErr) {
        console.error('[KIVORA API] Erro ao gravar pedido no MongoDB:', dbErr);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[KIVORA API] Erro na rota C2B:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao processar pagamento via Kivora' },
      { status: 500 }
    );
  }
}
