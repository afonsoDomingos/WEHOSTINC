import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import Order from '@/lib/models/Order';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    await connectDB();

    // Buscar usuário
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Buscar pedidos do usuário
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });

    // Analisar uso atual
    const usageAnalysis = {
      currentPlan: user.plan,
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0),
      servicesPurchased: new Set<string>(),
      lastOrderDate: orders.length > 0 ? orders[0].createdAt : null,
      accountAge: Date.now() - new Date(user.createdAt).getTime(),
      recommendations: [] as any[]
    };

    // Identificar serviços já comprados
    orders.forEach((order: any) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          usageAnalysis.servicesPurchased.add(item.serviceType || 'unknown');
        });
      }
    });

    const purchasedServices = Array.from(usageAnalysis.servicesPurchased);

    // Lógica de upselling baseada em uso
    if (usageAnalysis.currentPlan === 'basic') {
      if (usageAnalysis.totalOrders >= 3 && usageAnalysis.totalSpent > 50000) {
        usageAnalysis.recommendations.push({
          type: 'plan_upgrade',
          targetPlan: 'pro',
          reason: 'Você já fez 3+ pedidos e gastou mais de 50.000 MZN. O plano Pro oferece descontos e recursos adicionais.',
          discount: '15%'
        });
      }
    } else if (usageAnalysis.currentPlan === 'pro') {
      if (usageAnalysis.totalOrders >= 10 && usageAnalysis.totalSpent > 200000) {
        usageAnalysis.recommendations.push({
          type: 'plan_upgrade',
          targetPlan: 'enterprise',
          reason: 'Você é um cliente valioso com 10+ pedidos. O plano Enterprise oferece suporte prioritário e benefícios exclusivos.',
          discount: '20%'
        });
      }
    }

    // Recomendações baseadas em serviços não comprados
    const commonServices = ['hosting', 'domain', 'email', 'ssl'];
    const missingServices = commonServices.filter(s => !purchasedServices.includes(s));

    if (missingServices.length > 0) {
      if (missingServices.includes('domain') && purchasedServices.includes('hosting')) {
        usageAnalysis.recommendations.push({
          type: 'cross_sell',
          service: 'domain',
          reason: 'Você já tem hosting. Adicione um domínio personalizado para profissionalizar sua presença online.',
          priority: 'high'
        });
      }

      if (missingServices.includes('ssl') && purchasedServices.includes('hosting')) {
        usageAnalysis.recommendations.push({
          type: 'cross_sell',
          service: 'ssl',
          reason: 'Proteja seu site com certificado SSL. Essencial para segurança e confiança dos visitantes.',
          priority: 'high'
        });
      }

      if (missingServices.includes('email') && purchasedServices.includes('domain')) {
        usageAnalysis.recommendations.push({
          type: 'cross_sell',
          service: 'email',
          reason: 'Crie emails profissionais com seu domínio (ex: info@seudominio.com).',
          priority: 'medium'
        });
      }
    }

    // Recomendações baseadas em atividade
    const daysSinceLastOrder = usageAnalysis.lastOrderDate 
      ? Math.floor((Date.now() - new Date(usageAnalysis.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    if (daysSinceLastOrder > 30 && daysSinceLastOrder < 60) {
      usageAnalysis.recommendations.push({
        type: 'retention',
        reason: 'Faz mais de 30 dias desde seu último pedido. Verifique nossos novos serviços e ofertas.',
        priority: 'medium'
      });
    }

    return NextResponse.json({
      success: true,
      analysis: {
        ...usageAnalysis,
        servicesPurchased: purchasedServices,
        daysSinceLastOrder
      }
    });

  } catch (error) {
    console.error('[Upselling Analyze] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
