import { NextResponse } from 'next/server';
import { kivora } from '@/lib/kivora';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { msisdn, amount, reference, thirdPartyReference, clientName, clientEmail, serviceName } = body;

    if (!msisdn || !amount) {
      return NextResponse.json(
        { error: 'Parâmetros msisdn e amount são obrigatórios.' },
        { status: 400 }
      );
    }

    // Normalizar número de telefone para Kivora (remover +258 se presente)
    let phone = msisdn.replace(/\D/g, '');
    if (phone.startsWith('258')) {
      phone = phone.substring(3);
    }

    const paymentRef = reference || thirdPartyReference || `REF_${Date.now()}`;
    const orderId = thirdPartyReference || `ORD-${Date.now().toString().slice(-6)}`;

    // Usar API Kivora como gateway para processar pagamento eMola
    const result = await kivora.createC2BPayment({
      phone,
      amount,
      currency: 'MZN',
      reference: paymentRef,
      description: `Pagamento eMola via Kivora - ${serviceName || reference || 'Serviço'}`,
      senderName: 'WEHOSTHERE', // Nome que aparece no telemóvel do cliente
      customer: {
        name: clientName || undefined,
        email: clientEmail || undefined,
        phone: msisdn
      },
      metadata: {
        clientName,
        clientEmail,
        clientPhone: msisdn,
        serviceName
      }
    });

    console.log('[EMOLA C2B VIA KIVORA RESPONSE]:', result);

    // Persistir/Criar o pedido imediatamente no MongoDB com status 'pending' para que apareça no painel admin
    if (result.id) {
      try {
        const { connectDB } = await import('@/lib/mongodb');
        const OrderModel = (await import('@/lib/models/Order')).default;
        await connectDB();

        await OrderModel.findOneAndUpdate(
          {
            $or: [
              { id: orderId },
              { reference: paymentRef },
              { kivoraPaymentId: result.id }
            ]
          },
          {
            $set: {
              id: orderId,
              clientName: clientName || 'Cliente eMola',
              clientEmail: clientEmail || 'cliente@emola.mz',
              clientPhone: msisdn,
              serviceName: serviceName || 'Pagamento eMola',
              amount,
              paymentMethod: 'emola',
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
        console.log(`[EMOLA C2B] Pedido ${orderId} registado no MongoDB com kivoraPaymentId ${result.id}`);
      } catch (dbErr) {
        console.error('[EMOLA C2B] Erro ao gravar pedido no MongoDB:', dbErr);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro na rota API eMola C2B (via Kivora):', error);
    return NextResponse.json(
      { error: 'Falha ao processar pagamento via eMola' },
      { status: 500 }
    );
  }
}
