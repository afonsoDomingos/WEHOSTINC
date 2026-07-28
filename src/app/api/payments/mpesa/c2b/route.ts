import { NextResponse } from 'next/server';
import { mpesa } from '@/lib/mpesa';

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

    const result = await mpesa.payC2B({
      msisdn,
      amount,
      reference: reference || `REF_${Date.now()}`,
      thirdPartyReference: thirdPartyReference || `ORDER_${Date.now()}`
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro na rota API M-Pesa C2B:', error);
    return NextResponse.json(
      { error: 'Falha ao processar pagamento via M-Pesa' },
      { status: 500 }
    );
  }
}
