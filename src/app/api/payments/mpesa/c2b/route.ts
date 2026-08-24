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

    // Usar API Kivora como gateway para processar pagamento M-Pesa
    const result = await kivora.createC2BPayment({
      phone,
      amount,
      currency: 'MZN',
      reference: reference || thirdPartyReference || `REF_${Date.now()}`,
      description: `Pagamento M-Pesa via Kivora - ${reference || 'Serviço'}`,
      senderName: 'WEHOSTHERE', // Nome que aparece no telemóvel do cliente
      metadata: {
        clientName,
        clientEmail,
        clientPhone: msisdn,
        serviceName
      }
    });

    console.log('[M-PESA C2B VIA KIVORA RESPONSE]:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro na rota API M-Pesa C2B (via Kivora):', error);
    return NextResponse.json(
      { error: 'Falha ao processar pagamento via M-Pesa' },
      { status: 500 }
    );
  }
}
