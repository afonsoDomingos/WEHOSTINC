import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import WebhookEventModel from '@/lib/models/WebhookEvent';
import OrderModel from '@/lib/models/Order';
import { apiEndpoint } from '@/lib/siteConfig';


// 🔒 BACKEND ROBUSTEZ: Sistema de retry para webhooks falhados
const WEBHOOK_RETRY_ATTEMPTS = 3;
const WEBHOOK_RETRY_DELAY = 1000; // 1 segundo

async function withRetry<T>(
  fn: () => Promise<T>,
  attempts: number = WEBHOOK_RETRY_ATTEMPTS,
  delay: number = WEBHOOK_RETRY_DELAY
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.error(`[WEBHOOK RETRY] Attempt ${i + 1}/${attempts} failed:`, error);
      
      if (i < attempts - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i))); // Exponential backoff
      }
    }
  }
  
  throw lastError!;
}

export async function POST(req: Request) {
  let processed = false;
  let errorMessage = '';
  // Ler o body UMA SÓ VEZ antes do try — req.json() só pode ser chamado uma vez
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    console.log('[KIVORA WEBHOOK] Evento recebido:', body);
    
    const { id, type, created_at, livemode, data: eventData } = body;
    
    // Validar estrutura do evento
    if (!id || !type || !eventData) {
      console.error('[KIVORA WEBHOOK] Estrutura de evento inválida:', body);
      errorMessage = 'Estrutura de evento inválida';
      // Registrar evento de estrutura inválida no MongoDB
      try {
        await connectDB();
        await WebhookEventModel.create({
          eventId: id || 'unknown',
          eventType: type || 'unknown',
          paymentId: eventData?.id,
          reference: eventData?.reference,
          status: eventData?.status,
          amount: eventData?.amount,
          currency: eventData?.currency,
          processed: false,
          errorMessage,
          createdAt: new Date().toISOString()
        });
      } catch (dbErr) {
        console.error('[KIVORA WEBHOOK] Erro ao gravar evento inválido no MongoDB:', dbErr);
      }
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
        // Atualizar status do pedido para 'completed' (com retry)
        await withRetry(() => updateOrderStatus(eventData.reference || '', 'completed', eventData.id, eventData, metadata));
        // Enviar notificação de sucesso por email para cliente (com retry)
        if (clientEmail) {
          await withRetry(() => sendPaymentNotification(clientEmail, clientName, serviceName, 'completed', eventData.amount));
        }
        // Notificar admin sobre pagamento confirmado (com retry)
        await withRetry(() => notifyAdminAboutPayment(clientName, clientEmail || '', serviceName, 'completed', eventData.amount, eventData.reference));
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
        
        // Atualizar status do pedido para 'cancelled'
        await updateOrderStatus(eventData.reference || '', 'cancelled', eventData.id, eventData, metadata);
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

    // Registrar evento no MongoDB para monitoramento persistente (server-side)
    const failureReason = type === 'payment.failed' 
      ? (eventData.error?.message || eventData.failure_reason || eventData.error_message || eventData.errorMessage || 'Motivo não especificado')
      : undefined;
    const failureCode = type === 'payment.failed'
      ? (eventData.error?.code || eventData.failure_code || eventData.error_code || eventData.errorCode || 'UNKNOWN')
      : undefined;

    try {
      await connectDB();
      await WebhookEventModel.create({
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
        failureCode,
        createdAt: new Date().toISOString()
      });
      console.log('[KIVORA WEBHOOK] Evento gravado no MongoDB:', id);
    } catch (dbErr) {
      console.error('[KIVORA WEBHOOK] Erro ao gravar evento no MongoDB:', dbErr);
    }

    // Responder com 200 OK para confirmar recebimento
    return NextResponse.json({ received: true, eventId: id });
    
  } catch (error) {
    console.error('[KIVORA WEBHOOK] Erro ao processar webhook:', error);
    errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    // Registrar evento falhado no MongoDB usando o body já lido
    try {
      if (body) {
        await connectDB();
        await WebhookEventModel.create({
          eventId: body.id || 'unknown',
          eventType: body.type || 'unknown',
          paymentId: body.data?.id,
          reference: body.data?.reference,
          processed: false,
          errorMessage,
          createdAt: new Date().toISOString()
        });
      }
    } catch (e) {
      console.error('[KIVORA WEBHOOK] Erro ao registrar evento falhado no MongoDB:', e);
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

// Função auxiliar para atualizar status do pedido via MongoDB
async function updateOrderStatus(
  reference: string,
  status: 'completed' | 'cancelled',
  kivoraPaymentId?: string,
  eventData?: any,
  metadata?: any
) {
  try {
    await connectDB();
    const queryConditions: any[] = [];
    if (kivoraPaymentId) {
      queryConditions.push({ kivoraPaymentId });
    }
    if (reference) {
      queryConditions.push({ reference });
      queryConditions.push({ id: reference });
      const cleanRef = reference.replace('REF_', '').replace('ORDER_', '');
      if (cleanRef) {
        queryConditions.push({ id: { $regex: new RegExp(cleanRef, 'i') } });
      }
    }

    let order = queryConditions.length > 0
      ? await OrderModel.findOne({ $or: queryConditions })
      : null;

    if (order) {
      console.log(`[KIVORA WEBHOOK] Atualizando pedido ${order.id} para status: ${status}`);
      await OrderModel.findOneAndUpdate(
        { id: order.id },
        { 
          status,
          ...(kivoraPaymentId && !order.kivoraPaymentId ? { kivoraPaymentId } : {})
        }
      );
    } else if (status === 'completed' && (kivoraPaymentId || reference)) {
      // Se o pedido não existia (ex: fluxo rápido ou falha de rede prévia), criar agora
      const fallbackId = reference || `ORD-${Date.now().toString().slice(-6)}`;
      const clientName = metadata?.clientName || eventData?.customer?.name || 'Cliente';
      const clientEmail = metadata?.clientEmail || eventData?.customer?.email || 'cliente@wehosthere.com';
      const serviceName = metadata?.serviceName || 'Hospedagem Web';
      const amount = Number(eventData?.amount) || 0;

      console.log(`[KIVORA WEBHOOK] Criando pedido aprovado não localizado previamente: ${fallbackId}`);
      await OrderModel.create({
        id: fallbackId,
        clientName,
        clientEmail,
        clientPhone: metadata?.clientPhone || eventData?.customer?.phone || '',
        serviceName,
        amount,
        paymentMethod: 'mpesa',
        kivoraPaymentId,
        reference,
        status: 'completed',
        createdAt: new Date().toISOString()
      });
    } else {
      console.log(`[KIVORA WEBHOOK] Pedido não encontrado para referência: ${reference}, paymentId: ${kivoraPaymentId}`);
    }
  } catch (error) {
    console.error('[KIVORA WEBHOOK] Erro ao atualizar pedido:', error);
  }
}

// Endpoint GET para o painel admin consultar os últimos eventos de webhook registrados
export async function GET() {
  try {
    await connectDB();
    const events = await WebhookEventModel.find({})
      .sort({ receivedAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ events });
  } catch (error) {
    console.error('[KIVORA WEBHOOK GET] Erro ao buscar eventos:', error);
    return NextResponse.json({ events: [] }, { status: 500 });
  }
}
