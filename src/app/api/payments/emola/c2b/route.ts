import { NextResponse } from 'next/server';
import { kivora } from '@/lib/kivora';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { msisdn, amount, reference, thirdPartyReference } = body;

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

    // Usar API Kivora como gateway para processar pagamento eMola
    const result = await kivora.createC2BPayment({
      phone,
      amount,
      currency: 'MZN',
      reference: reference || thirdPartyReference || `REF_${Date.now()}`,
      description: `Pagamento eMola via Kivora - ${reference || 'Serviço'}`
    });

    console.log('[EMOLA C2B VIA KIVORA RESPONSE]:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro na rota API eMola C2B (via Kivora):', error);
    return NextResponse.json(
      { error: 'Falha ao processar pagamento via eMola' },
      { status: 500 }
    );
  }
}
