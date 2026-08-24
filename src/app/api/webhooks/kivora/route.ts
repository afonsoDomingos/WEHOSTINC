import { NextResponse } from 'next/server';
import { dataManager } from '@/lib/data';
import { apiEndpoint } from '@/lib/siteConfig';

export async function POST(req: Request) {
  let processed = false;
  let errorMessage = '';
  
  try {
    const body = await req.json();
    
    console.log('[KIVORA WEBHOOK] Evento recebido:', body);
    
    const { id, type, created_at, livemode, data: eventData } = body;
    
    // Validar estrutura do evento
    if (!id || !type || !eventData) {
      console.error('[KIVORA WEBHOOK] Estrutura de evento inválida:', body);
      errorMessage = 'Estrutura de evento inválida';
      // Registrar evento mesmo com erro
      dataManager.addWebhookEvent({
        eventId: id,
        eventType: type,
        paymentId: eventData.id,
        reference: eventData.reference,
        status: eventData.status,
        amount: eventData.amount,
        currency: eventData.currency,
        processed: false,
        errorMessage
      });
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
        // Enviar notificação de sucesso por email para cliente
        if (clientEmail) {
          await sendPaymentNotification(clientEmail, clientName, serviceName, 'completed', eventData.amount);
        }
        // Notificar admin sobre pagamento confirmado
        await notifyAdminAboutPayment(clientName, clientEmail || '', serviceName, 'completed', eventData.amount, eventData.reference);
        processed = true;
        break;
        
      case 'payment.failed':
        console.log('[KIVORA WEBHOOK] Pagamento falhou:', eventData.id);
        
        // Extrair motivo da falha se disponível (priorizar schema oficial da Kivora)
        const failureReason = 
          eventData.error?.message || // Schema oficial: error.message
          eventData.failure_reason || 
          eventData.error_message || 
          eventData.errorMessage || 
          'Motivo não especificado';
        
        const failureCode = 
          eventData.error?.code || // Schema oficial: error.code
          eventData.failure_code || 
          eventData.error_code || 
          eventData.errorCode || 
          'UNKNOWN';
        
        console.log('[KIVORA WEBHOOK] Detalhes da falha:', { failureCode, failureReason });
        
        // Atualizar status do pedido para 'cancelled' se houver referência
        if (eventData.reference) {
          await updateOrderStatus(eventData.reference, 'cancelled');
        }
        // Enviar notificação de falha por email para cliente com motivo específico
        if (clientEmail) {
          await sendPaymentNotification(clientEmail, clientName, serviceName, 'failed', eventData.amount, failureReason);
        }
        // Notificar admin sobre pagamento falhado com motivo específico
        await notifyAdminAboutPayment(clientName, clientEmail || '', serviceName, 'failed', eventData.amount, eventData.reference, failureReason);
        processed = true;
        break;
        
      case 'b2c.created':
        console.log('[KIVORA WEBHOOK] Envio B2C criado:', eventData.id);
        processed = true;
        break;
        
      case 'b2c.completed':
        console.log('[KIVORA WEBHOOK] Envio B2C completado:', eventData.id);
        processed = true;
        break;
        
      case 'b2c.failed':
        console.log('[KIVORA WEBHOOK] Envio B2C falhou:', eventData.id);
        processed = true;
        break;

      case 'subscription.created':
        console.log('[KIVORA WEBHOOK] Assinatura criada:', eventData.id);
        processed = true;
        break;

      case 'subscription.cancelled':
        console.log('[KIVORA WEBHOOK] Assinatura cancelada:', eventData.id);
        processed = true;
        break;

      case 'subscription.renewed':
        console.log('[KIVORA WEBHOOK] Assinatura renovada:', eventData.id);
        processed = true;
        break;

      default:
        console.log('[KIVORA WEBHOOK] Tipo de evento não tratado:', type);
        processed = true;
    }

    // Registrar evento no dataManager para monitoramento
    const failureReason = type === 'payment.failed' 
      ? (eventData.error?.message || eventData.failure_reason || eventData.error_message || eventData.errorMessage || 'Motivo não especificado')
      : undefined;
    const failureCode = type === 'payment.failed'
      ? (eventData.error?.code || eventData.failure_code || eventData.error_code || eventData.errorCode || 'UNKNOWN')
      : undefined;

    dataManager.addWebhookEvent({
      eventId: id,
      eventType: type,
      paymentId: eventData.id,
      reference: eventData.reference,
      status: eventData.status,
      amount: eventData.amount,
      currency: eventData.currency,
      clientName,
      clientEmail,
      serviceName,
      processed,
      errorMessage,
      failureReason,
      failureCode
    });

    // Responder com 200 OK para confirmar recebimento
    return NextResponse.json({ received: true, eventId: id });
    
  } catch (error) {
    console.error('[KIVORA WEBHOOK] Erro ao processar webhook:', error);
    errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    // Tentar registrar evento mesmo com erro
    try {
      const body = await req.json();
      dataManager.addWebhookEvent({
        eventId: body.id || 'unknown',
        eventType: body.type || 'unknown',
        paymentId: body.data?.id,
        reference: body.data?.reference,
        processed: false,
        errorMessage
      });
    } catch (e) {
      console.error('[KIVORA WEBHOOK] Erro ao registrar evento falhado:', e);
    }
    
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// Função auxiliar para enviar notificação por email
async function sendPaymentNotification(
  email: string,
  clientName: string,
  serviceName: string,
  status: 'completed' | 'failed',
  amount?: number,
  failureReason?: string
) {
  try {
    console.log(`[KIVORA WEBHOOK] Enviando notificação ${status} para ${email}`);
    
    const subject = status === 'completed' 
      ? '✅ Pagamento Confirmado - WEHOSTHERE'
      : '❌ Pagamento Falhou - WEHOSTHERE';
    
    const message = status === 'completed'
      ? `Olá ${clientName},\n\nO seu pagamento de ${amount || 0} MZN para "${serviceName}" foi confirmado com sucesso!\n\nO seu pedido está sendo processado.\n\nObrigado pela preferência!\nEquipe WEHOSTHERE`
      : `Olá ${clientName},\n\nInfelizmente, o pagamento de ${amount || 0} MZN para "${serviceName}" falhou.\n\nMotivo: ${failureReason || 'Não especificado'}\n\nPor favor, tente novamente ou entre em contato com o suporte.\n\nEquipe WEHOSTHERE`;

    // Chamar API de email correta
    await fetch(apiEndpoint('/api/send-email'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject,
        text: message
      })
    }).catch(err => console.error('[KIVORA WEBHOOK] Erro ao enviar email:', err));
    
    console.log(`[KIVORA WEBHOOK] Notificação ${status} enviada para ${email}`);
  } catch (error) {
    console.error('[KIVORA WEBHOOK] Erro ao enviar notificação:', error);
  }
}

// Função auxiliar para notificar admin sobre novo pagamento
async function notifyAdminAboutPayment(
  clientName: string,
  clientEmail: string,
  serviceName: string,
  status: 'completed' | 'failed',
  amount?: number,
  reference?: string,
  failureReason?: string
) {
  try {
    console.log(`[KIVORA WEBHOOK] Notificando admin sobre pagamento ${status}`);
    
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'info@wehosthere.com';
    const subject = status === 'completed'
      ? `💰 Novo Pagamento Confirmado: ${clientName} - ${amount} MZN`
      : `⚠️ Pagamento Falhou: ${clientName} - ${amount} MZN`;
    
    const message = status === 'completed'
      ? `Olá Administrador,\n\nNovo pagamento confirmado:\n\n• Cliente: ${clientName} (${clientEmail})\n• Serviço: ${serviceName}\n• Valor: ${amount} MZN\n• Referência: ${reference}\n• Data: ${new Date().toLocaleString('pt-MZ')}\n\nVerifique o pedido no painel admin.\nEquipe WEHOSTHERE`
      : `Olá Administrador,\n\nPagamento falhou:\n\n• Cliente: ${clientName} (${clientEmail})\n• Serviço: ${serviceName}\n• Valor: ${amount} MZN\n• Referência: ${reference}\n• Motivo: ${failureReason || 'Não especificado'}\n• Data: ${new Date().toLocaleString('pt-MZ')}\n\nVerifique o pedido no painel admin.\nEquipe WEHOSTHERE`;

    await fetch(apiEndpoint('/api/send-email'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: adminEmail,
        subject,
        text: message
      })
    }).catch(err => console.error('[KIVORA WEBHOOK] Erro ao notificar admin:', err));
    
    console.log(`[KIVORA WEBHOOK] Admin notificado sobre pagamento ${status}`);
  } catch (error) {
    console.error('[KIVORA WEBHOOK] Erro ao notificar admin:', error);
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
