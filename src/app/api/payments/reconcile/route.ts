import { NextResponse } from 'next/server';
import { dataManager } from '@/lib/data';
import { kivora } from '@/lib/kivora';

// 🔒 BACKEND ROBUSTEZ: Sistema de reconciliação de pagamentos
// Este endpoint verifica pagamentos que podem ter falhado no webhook e reconcilia automaticamente

export async function POST(req: Request) {
  try {
    console.log('[PAYMENT RECONCILIATION] Iniciando reconciliação de pagamentos');
    
    // Buscar todos os pedidos com status 'pending' ou 'in_progress'
    const orders = await dataManager.fetchOrdersAsync();
    const pendingOrders = orders.filter((order: any) => 
      order.status === 'pending' || order.status === 'in_progress'
    );
    
    console.log(`[PAYMENT RECONCILIATION] Encontrados ${pendingOrders.length} pedidos pendentes`);
    
    let reconciledCount = 0;
    let failedCount = 0;
    const results: any[] = [];
    
    for (const order of pendingOrders) {
      try {
        // Se o pedido tem referência de pagamento, verificar status na Kivora
        if (order.reference) {
          console.log(`[PAYMENT RECONCILIATION] Verificando pedido ${order.id} com referência ${order.reference}`);
          
          // Extrair paymentId da referência se possível
          const paymentId = order.reference.replace('REF_', '').split('_')[0];
          
          if (paymentId) {
            // Consultar status do pagamento na Kivora
            const paymentStatus = await kivora.getC2BPayment(paymentId);
            
            console.log(`[PAYMENT RECONCILIATION] Status do pagamento ${paymentId}:`, paymentStatus.status);
            
            // Se o pagamento foi completado na Kivora mas não no sistema, reconciliar
            // A Kivora retorna 'paid' para pagamentos completados
            if (paymentStatus.status === 'paid' && order.status !== 'completed') {
              console.log(`[PAYMENT RECONCILIATION] Reconciliando pedido ${order.id} - pagamento completado na Kivora`);
              
              // Atualizar status do pedido
              dataManager.updateOrderStatus(order.id, 'completed');
              
              // Enviar notificações
              if (order.clientEmail) {
                await sendReconciliationNotification(
                  order.clientEmail,
                  order.clientName || 'Cliente',
                  order.serviceName || 'Serviço',
                  order.amount || 0,
                  order.reference
                );
              }
              
              reconciledCount++;
              results.push({
                orderId: order.id,
                reference: order.reference,
                previousStatus: order.status,
                newStatus: 'completed',
                reconciled: true
              });
            } else if (paymentStatus.status === 'failed' && order.status !== 'cancelled') {
              console.log(`[PAYMENT RECONCILIATION] Cancelando pedido ${order.id} - pagamento falhou na Kivora`);
              
              // Atualizar status do pedido
              dataManager.updateOrderStatus(order.id, 'cancelled');
              
              failedCount++;
              results.push({
                orderId: order.id,
                reference: order.reference,
                previousStatus: order.status,
                newStatus: 'cancelled',
                reconciled: true
              });
            } else {
              console.log(`[PAYMENT RECONCILIATION] Pedido ${order.id} já com status correto: ${order.status}`);
              results.push({
                orderId: order.id,
                reference: order.reference,
                status: order.status,
                reconciled: false,
                reason: 'Status already correct'
              });
            }
          } else {
            console.log(`[PAYMENT RECONCILIATION] Não foi possível extrair paymentId da referência ${order.reference}`);
            results.push({
              orderId: order.id,
              reference: order.reference,
              reconciled: false,
              reason: 'Invalid reference format'
            });
          }
        } else {
          console.log(`[PAYMENT RECONCILIATION] Pedido ${order.id} não tem referência de pagamento`);
          results.push({
            orderId: order.id,
            reconciled: false,
            reason: 'No payment reference'
          });
        }
      } catch (error) {
        console.error(`[PAYMENT RECONCILIATION] Erro ao reconciliar pedido ${order.id}:`, error);
        results.push({
          orderId: order.id,
          reconciled: false,
          reason: 'Error during reconciliation',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    console.log(`[PAYMENT RECONCILIATION] Reconciliação concluída: ${reconciledCount} reconciliados, ${failedCount} falhados`);
    
    return NextResponse.json({
      success: true,
      totalPending: pendingOrders.length,
      reconciled: reconciledCount,
      failed: failedCount,
      results
    });
    
  } catch (error) {
    console.error('[PAYMENT RECONCILIATION] Erro na reconciliação:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

// Função auxiliar para enviar notificação de reconciliação
async function sendReconciliationNotification(
  email: string,
  clientName: string,
  serviceName: string,
  amount: number,
  reference: string
) {
  try {
    const subject = '✅ Pagamento Confirmado - WEHOSTHERE (Reconciliação Automática)';
    const message = `Olá ${clientName},\n\nO seu pagamento de ${amount} MZN para "${serviceName}" foi confirmado automaticamente pelo nosso sistema de reconciliação.\n\nReferência: ${reference}\n\nO seu pedido está sendo processado.\n\nObrigado pela preferência!\nEquipe WEHOSTHERE`;
    
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject,
        text: message
      })
    });
    
    console.log(`[PAYMENT RECONCILIATION] Notificação enviada para ${email}`);
  } catch (error) {
    console.error('[PAYMENT RECONCILIATION] Erro ao enviar notificação:', error);
  }
}