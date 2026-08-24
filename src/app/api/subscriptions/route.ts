import { NextResponse } from 'next/server';
import { kivora } from '@/lib/kivora';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customer, amount, interval, reference } = body;

    if (!customer || !amount || !interval) {
      return NextResponse.json(
        { error: 'Parâmetros customer, amount e interval são obrigatórios.' },
        { status: 400 }
      );
    }

    // Usar API Kivora para criar assinatura recorrente
    const result = await kivora.createSubscription({
      customer,
      amount,
      currency: 'MZN',
      interval,
      reference: reference || `SUB-${Date.now()}`
    });

    console.log('[SUBSCRIPTION VIA KIVORA RESPONSE]:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro na rota API Subscriptions (via Kivora):', error);
    return NextResponse.json(
      { error: 'Falha ao criar assinatura' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const subscriptionId = searchParams.get('id');

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Parâmetro id é obrigatório.' },
        { status: 400 }
      );
    }

    // Usar API Kivora para consultar assinatura
    const result = await kivora.getSubscription(subscriptionId);

    console.log('[SUBSCRIPTION GET VIA KIVORA RESPONSE]:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro na rota API Subscriptions GET (via Kivora):', error);
    return NextResponse.json(
      { error: 'Falha ao consultar assinatura' },
      { status: 500 }
    );
  }
}
