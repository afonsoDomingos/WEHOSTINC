import { NextResponse } from 'next/server';
import { dataManager } from '@/lib/data';
import { apiEndpoint } from '@/lib/siteConfig';

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

    // Extrair metadados do cliente se disponíveis
    const metadata = eventData.metadata || {};
    const clientName = metadata.clientName || 'Cliente';
    const clientEmail = metadata.clientEmail;
    const serviceName = metadata.serviceName || 'Serviço';

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
        // Enviar notificação de sucesso por email
        if (clientEmail) {
          await sendPaymentNotification(clientEmail, clientName, serviceName, 'completed', eventData.amount);
        }
        break;
        
      case 'payment.failed':
        console.log('[KIVORA WEBHOOK] Pagamento falhou:', eventData.id);
        // Atualizar status do pedido para 'cancelled' se houver referência
        if (eventData.reference) {
          await updateOrderStatus(eventData.reference, 'cancelled');
        }
        // Enviar notificação de falha por email
        if (clientEmail) {
          await sendPaymentNotification(clientEmail, clientName, serviceName, 'failed', eventData.amount);
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

// Função auxiliar para enviar notificação por email
async function sendPaymentNotification(
  email: string,
  clientName: string,
  serviceName: string,
  status: 'completed' | 'failed',
  amount?: number
) {
  try {
    console.log(`[KIVORA WEBHOOK] Enviando notificação ${status} para ${email}`);
    
    const subject = status === 'completed' 
      ? '✅ Pagamento Confirmado - WEHOSTHERE'
      : '❌ Pagamento Falhou - WEHOSTHERE';
    
    const message = status === 'completed'
      ? `Olá ${clientName},\n\nO seu pagamento de ${amount || 0} MZN para "${serviceName}" foi confirmado com sucesso!\n\nO seu pedido está sendo processado.\n\nObrigado pela preferência!\nEquipe WEHOSTHERE`
      : `Olá ${clientName},\n\nInfelizmente, o pagamento de ${amount || 0} MZN para "${serviceName}" falhou.\n\nPor favor, tente novamente ou entre em contato com o suporte.\n\nEquipe WEHOSTHERE`;

    // Chamar API de email (implementar conforme seu sistema de email)
    await fetch(apiEndpoint('/api/emails/send'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject,
        message
      })
    }).catch(err => console.error('[KIVORA WEBHOOK] Erro ao enviar email:', err));
    
    console.log(`[KIVORA WEBHOOK] Notificação enviada para ${email}`);
  } catch (error) {
    console.error('[KIVORA WEBHOOK] Erro ao enviar notificação:', error);
  }
}

// Função auxiliar para atualizar status do pedido
async function updateOrderStatus(reference: string, status: 'completed' | 'cancelled') {
  try {
    // Buscar pedido pela referência direta
    const orders = await dataManager.fetchOrdersAsync();
    const order = orders.find((o: any) => 
      o.reference === reference || 
      o.serviceName?.includes(reference) ||
      o.serviceName?.includes(reference.replace('REF_', '').replace('ORDER_', ''))
    );
    
    if (order) {
      console.log(`[KIVORA WEBHOOK] Atualizando pedido ${order.id} para status: ${status}`);
      dataManager.updateOrderStatus(order.id, status);
    } else {
      console.log(`[KIVORA WEBHOOK] Pedido não encontrado para referência: ${reference}`);
      console.log(`[KIVORA WEBHOOK] Pedidos disponíveis:`, orders.map((o: any) => ({ id: o.id, reference: o.reference, serviceName: o.serviceName })));
    }
  } catch (error) {
    console.error('[KIVORA WEBHOOK] Erro ao atualizar pedido:', error);
  }
}
