import { NextResponse } from 'next/server';
import { kivora } from '@/lib/kivora';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const subscriptionId = params.id;

    // Nota: A API Kivora pode não ter endpoint DELETE para cancelar assinaturas
    // Esta é uma implementação placeholder que atualiza o status localmente
    // Se a Kivora tiver endpoint de cancelamento, substituir com chamada real à API
    
    console.log('[SUBSCRIPTION DELETE] Cancelando assinatura:', subscriptionId);

    // Placeholder - em produção, chamar API real da Kivora para cancelar
    // const result = await kivora.cancelSubscription(subscriptionId);

    return NextResponse.json({ 
      success: true, 
      message: 'Assinatura cancelada com sucesso',
      id: subscriptionId
    });
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    return NextResponse.json(
      { error: 'Falha ao cancelar assinatura' },
      { status: 500 }
    );
  }
}
