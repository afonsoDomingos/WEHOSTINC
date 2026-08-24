import { NextResponse } from 'next/server';
import { kivora } from '@/lib/kivora';

export async function GET(
  req: Request,
  { params }: { params: { paymentId: string } }
) {
  try {
    const { paymentId } = params;

    if (!paymentId) {
      return NextResponse.json(
        { error: 'paymentId é obrigatório.' },
        { status: 400 }
      );
    }

    const result = await kivora.getC2BPayment(paymentId);

    console.log('[KIVORA API] C2B Status Response:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[KIVORA API] Erro ao consultar pagamento C2B:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao consultar pagamento via Kivora' },
      { status: 500 }
    );
  }
}
