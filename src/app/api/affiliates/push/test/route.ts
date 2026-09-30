import { NextRequest, NextResponse } from 'next/server';
import { sendPushToUser } from '@/lib/pushService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId, userEmail } = body as { userId?: string; userEmail?: string };

    const identifier = userId || userEmail;
    if (!identifier) {
      return NextResponse.json(
        { error: 'userId ou userEmail são obrigatórios para enviar o teste' },
        { status: 400 }
      );
    }

    const result = await sendPushToUser(identifier, {
      title: '💸 Nova Comissão Recebida!',
      message: 'Teste: Recebeu uma comissão de 250 MT pela venda de um plano Hosting Starter. Parabéns!',
      icon: '/mascote-transparent.png',
      url: '/dashboard/affiliates',
      tag: 'affiliate-test-push',
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Falha ao enviar a notificação de teste', details: result.error },
        { status: 500 }
      );
    }

    if (result.sentCount === 0) {
      return NextResponse.json(
        {
          error:
            'Nenhum dispositivo encontrado. Certifique-se de que ativou as notificações neste dispositivo.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Notificação de teste enviada para ${result.sentCount} dispositivo(s).`,
      sentCount: result.sentCount,
    });
  } catch (error) {
    console.error('[Affiliate Push Test] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
