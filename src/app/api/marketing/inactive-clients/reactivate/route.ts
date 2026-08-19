import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import Order from '@/lib/models/Order';
import { dispatchMessage } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inactiveDays = 90, priority = 'high' } = body;

    await connectDB();

    // Calcular data limite
    const inactiveDate = new Date(Date.now() - inactiveDays * 24 * 60 * 60 * 1000);

    // Buscar usuários ativos
    const users = await User.find({ status: 'active' });

    const reactivatedClients = [];
    const errors = [];
    let sentCount = 0;

    for (const user of users) {
      try {
        // Buscar último pedido do usuário
        const lastOrder = await Order.findOne({ userId: user._id })
          .sort({ createdAt: -1 });

        // Verificar se o usuário está inativo
        const userCreatedAt = new Date(user.createdAt);
        const lastActivity = lastOrder ? new Date(lastOrder.createdAt) : userCreatedAt;
        const daysSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

        if (daysSinceActivity >= inactiveDays) {
          // Buscar histórico de pedidos
          const orders = await Order.find({ userId: user._id });
          const totalSpent = orders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0);
          const totalOrders = orders.length;

          // Calcular prioridade
          const clientPriority = calculatePriority(totalSpent, totalOrders, daysSinceActivity);

          // Verificar se corresponde à prioridade solicitada
          if (priority === 'all' || clientPriority === priority) {
            // Gerar código de desconto único
            const discountCode = `REACTIVATE${Math.floor(1000 + Math.random() * 9000)}`;
            
            // Calcular data de validade (30 dias)
            const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            const validUntilFormatted = validUntil.toLocaleDateString('pt-MZ', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            });

            // Enviar email de reativação
            await dispatchMessage({
              recipientEmail: user.email,
              recipientName: user.name,
              templateId: 'client-reactivation',
              variables: {
                nome_cliente: user.name,
                total_gasto: totalSpent.toString(),
                total_pedidos: totalOrders.toString(),
                plano_atual: user.plan,
                codigo_desconto: discountCode,
                data_validade: validUntilFormatted,
                link_servicos: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.wehosthere.com'}/systems`
              },
              isAutomatic: true,
              eventType: 'client_reactivation',
              channel: 'email'
            });

            sentCount++;
            reactivatedClients.push({
              userId: user._id,
              name: user.name,
              email: user.email,
              daysSinceActivity,
              totalSpent,
              totalOrders,
              priority: clientPriority,
              discountCode,
              validUntil: validUntilFormatted
            });
          }
        }
      } catch (error) {
        console.error(`[Reactivation Campaign] Error processing user ${user._id}:`, error);
        errors.push({
          userId: user._id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      sentCount,
      errorCount: errors.length,
      reactivatedClients,
      errors
    });

  } catch (error) {
    console.error('[Reactivation Campaign] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculatePriority(totalSpent: number, totalOrders: number, daysSinceActivity: number): string {
  // Alta prioridade: clientes que gastaram muito e estão inativos há muito tempo
  if (totalSpent > 100000 || totalOrders > 5) {
    return 'high';
  }
  // Média prioridade: clientes com gastos moderados
  if (totalSpent > 20000 || totalOrders > 2) {
    return 'medium';
  }
  // Baixa prioridade: clientes com poucos gastos
  return 'low';
}
