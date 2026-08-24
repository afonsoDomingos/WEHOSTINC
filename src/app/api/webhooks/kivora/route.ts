import { NextResponse } from 'next/server';
import { dataManager } from '@/lib/data';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    console.log('[KIVORA WEBHOOK] Evento recebido:', body);
    
    const { id, type, created_at, livemode, data: eventData } = body;
    
    // Validar estrutura do evento
    if (!id || !type || !eventData) {
      console.error('[KIVORA WEBHOOK] Estrutura de evento inválida:', body);
      return NextResponse.json({ error: 'Invalid event structure' }, { status: 400 });
    }

    // Processar diferentes tipos de eventos
    switch (type) {
      case 'payment.created':
        console.log('[KIVORA WEBHOOK] Pagamento criado:', eventData.id);
        break;
        
      case 'payment.pending':
        console.log('[KIVORA WEBHOOK] Pagamento pendente:', eventData.id);
        break;
        
      case 'payment.completed':
        console.log('[KIVORA WEBHOOK] Pagamento completado:', eventData.id);
        // Atualizar status do pedido para 'completed' se houver referência
        if (eventData.reference) {
          await updateOrderStatus(eventData.reference, 'completed');
        }
        break;
        
      case 'payment.failed':
        console.log('[KIVORA WEBHOOK] Pagamento falhou:', eventData.id);
        // Atualizar status do pedido para 'cancelled' se houver referência
        if (eventData.reference) {
          await updateOrderStatus(eventData.reference, 'cancelled');
        }
        break;
        
      case 'b2c.created':
        console.log('[KIVORA WEBHOOK] Envio B2C criado:', eventData.id);
        break;
        
      case 'b2c.completed':
        console.log('[KIVORA WEBHOOK] Envio B2C completado:', eventData.id);
        break;
        
      case 'b2c.failed':
        console.log('[KIVORA WEBHOOK] Envio B2C falhou:', eventData.id);
        break;
        
      default:
        console.log('[KIVORA WEBHOOK] Tipo de evento não tratado:', type);
    }

    // Responder com 200 OK para confirmar recebimento
    return NextResponse.json({ received: true, eventId: id });
    
  } catch (error) {
    console.error('[KIVORA WEBHOOK] Erro ao processar webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// Função auxiliar para atualizar status do pedido
async function updateOrderStatus(reference: string, status: 'completed' | 'cancelled') {
  try {
    // Buscar pedido pela referência
    const orders = await dataManager.fetchOrdersAsync();
    const order = orders.find((o: any) => 
      o.serviceName?.includes(reference) || 
      o.serviceName?.includes(reference.replace('REF_', '').replace('ORDER_', ''))
    );
    
    if (order) {
      console.log(`[KIVORA WEBHOOK] Atualizando pedido ${order.id} para status: ${status}`);
      await dataManager.updateOrderAsync(order.id, { status });
    } else {
      console.log(`[KIVORA WEBHOOK] Pedido não encontrado para referência: ${reference}`);
    }
  } catch (error) {
    console.error('[KIVORA WEBHOOK] Erro ao atualizar pedido:', error);
  }
}
