import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import AbandonedCart from '@/lib/models/AbandonedCart';
import { dispatchMessage } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Buscar carrinhos ativos que estão abandonados há mais de 1 hora
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const abandonedCarts = await AbandonedCart.find({
      status: 'active',
      lastActivity: { $lt: oneHourAgo },
      $or: [
        { recoveryEmailsSent: 0 }, // Primeira recuperação
        { 
          $and: [
            { recoveryEmailsSent: 1 },
            { lastRecoveryEmailSent: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Segunda recuperação após 24h
          ]
        },
        {
          $and: [
            { recoveryEmailsSent: 2 },
            { lastRecoveryEmailSent: { $lt: new Date(Date.now() - 72 * 60 * 60 * 1000) } } // Terceira recuperação após 72h
          ]
        }
      ]
    });

    const processedCarts = [];
    const errors = [];

    for (const cart of abandonedCarts) {
      try {
        // Verificar cooldown entre emails
        const cooldownMs = cart.recoveryEmailsSent === 0 
          ? 60 * 60 * 1000 // 1 hora para primeiro email
          : cart.recoveryEmailsSent === 1 
            ? 24 * 60 * 60 * 1000 // 24 horas para segundo email
            : 72 * 60 * 60 * 1000; // 72 horas para terceiro email

        const lastEmailTime = cart.lastRecoveryEmailSent || cart.lastActivity;
        const timeSinceLastEmail = Date.now() - new Date(lastEmailTime).getTime();

        if (timeSinceLastEmail < cooldownMs) {
          continue; // Ainda não passou o cooldown
        }

        // Limitar a 3 emails de recuperação
        if (cart.recoveryEmailsSent >= 3) {
          // Marcar como expirado
          cart.status = 'expired';
          await cart.save();
          continue;
        }

        // Gerar lista de itens para o email
        const itemsList = cart.items.map((item: any) => 
          `- ${item.serviceName} (${item.serviceType}): ${item.price * item.quantity} MZN`
        ).join('\n');

        // Enviar email de recuperação
        await dispatchMessage({
          recipientEmail: cart.userEmail,
          recipientName: cart.userName,
          templateId: 'abandoned-cart-recovery',
          variables: {
            nome_cliente: cart.userName,
            lista_itens: itemsList,
            total_valor: cart.totalAmount.toString(),
            link_carrinho: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.wehosthere.com'}/checkout`
          },
          isAutomatic: true,
          eventType: 'abandoned_cart_recovery',
          channel: 'email'
        });

        // Atualizar carrinho
        cart.recoveryEmailsSent += 1;
        cart.recoveryAttempts += 1;
        cart.lastRecoveryEmailSent = new Date();
        await cart.save();

        processedCarts.push({
          cartId: cart._id,
          userEmail: cart.userEmail,
          recoveryEmailNumber: cart.recoveryEmailsSent
        });

      } catch (error) {
        console.error(`[Abandoned Cart Process] Error processing cart ${cart._id}:`, error);
        errors.push({
          cartId: cart._id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedCarts.length,
      errorCount: errors.length,
      processedCarts,
      errorDetails: errors
    });

  } catch (error) {
    console.error('[Abandoned Cart Process] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
