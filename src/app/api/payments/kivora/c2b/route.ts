import { NextResponse } from 'next/server';
import { kivora } from '@/lib/kivora';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, amount, reference, description } = body;

    if (!phone || !amount) {
      return NextResponse.json(
        { error: 'Parâmetros phone e amount são obrigatórios.' },
        { status: 400 }
      );
    }

    const result = await kivora.createC2BPayment({
      phone,
      amount,
      reference,
      description
    });

    console.log('[KIVORA API] C2B Response:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[KIVORA API] Erro na rota C2B:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao processar pagamento via Kivora' },
      { status: 500 }
    );
  }
}
