import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import Order from '@/lib/models/Order';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inactiveDays = 90 } = body; // Padrão: 90 dias

    await connectDB();

    // Calcular data limite
    const inactiveDate = new Date(Date.now() - inactiveDays * 24 * 60 * 60 * 1000);

    // Buscar todos os usuários
    const users = await User.find({ status: 'active' });

    const inactiveClients = [];

    for (const user of users) {
      // Buscar último pedido do usuário
      const lastOrder = await Order.findOne({ userId: user._id })
        .sort({ createdAt: -1 });

      // Verificar se o usuário está inativo
      const userCreatedAt = new Date(user.createdAt);
      const lastActivity = lastOrder ? new Date(lastOrder.createdAt) : userCreatedAt;
      const daysSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceActivity >= inactiveDays) {
        // Buscar histórico de pedidos para análise
        const orders = await Order.find({ userId: user._id });
        const totalSpent = orders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0);
        const totalOrders = orders.length;

        inactiveClients.push({
          userId: user._id,
          name: user.name,
          email: user.email,
          plan: user.plan,
          daysSinceActivity,
          lastActivityDate: lastActivity,
          totalSpent,
          totalOrders,
          accountAge: Math.floor((Date.now() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24)),
          priority: calculatePriority(totalSpent, totalOrders, daysSinceActivity)
        });
      }
    }

    // Ordenar por prioridade (alta primeiro)
    inactiveClients.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
    });

    return NextResponse.json({
      success: true,
      inactiveDays,
      totalInactive: inactiveClients.length,
      clients: inactiveClients
    });

  } catch (error) {
    console.error('[Inactive Clients Detect] Error:', error);
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
