import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import UserModel from '@/lib/models/User';
import { dispatchMessage } from '@/lib/notifications';

export async function GET(request: Request) {
  try {
    await connectDB();

    const today = new Date();
    const currentDay = today.getDate();

    // Find all active users
    const activeUsers = await UserModel.find({
      status: 'active',
      role: { $ne: 'admin' },
      email: { $ne: 'admin@wehosthere.com' }
    }).lean();

    const processed = [];

    for (const user of activeUsers) {
      const dueDay = user.dueDate || 29;
      
      let daysUntilExpiry = 0;
      if (dueDay >= currentDay) {
        daysUntilExpiry = dueDay - currentDay;
      } else {
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
        const diffTime = nextMonth.getTime() - today.getTime();
        daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      // Enviar alerta automático quando faltar 3 dias, 1 dia ou no dia do vencimento
      if (daysUntilExpiry <= 3 && daysUntilExpiry >= 0) {
        try {
          await dispatchMessage({
            recipientEmail: user.email,
            recipientName: user.name || user.email.split('@')[0],
            templateId: 'payment-pending',
            variables: {
              nome_cliente: user.name || user.email.split('@')[0],
              numero_pedido: `FAT-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}-${user.id.slice(-4)}`,
              valor: user.plan === 'pro' ? '1.500 MT' : user.plan === 'enterprise' ? '3.500 MT' : '500 MT',
              data: `Dia ${dueDay} (${daysUntilExpiry === 0 ? 'Hoje' : `em ${daysUntilExpiry} dia(s)`})`
            },
            isAutomatic: true,
            eventType: 'due_date_reminder'
          });

          processed.push({
            email: user.email,
            dueDay,
            daysUntilExpiry,
            status: 'notified'
          });
        } catch (dispatchErr) {
          console.warn(`[Cron Due Date] Erro ao notificar ${user.email}:`, dispatchErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      activeUsersChecked: activeUsers.length,
      notificationsSent: processed.length,
      details: processed
    });
  } catch (error: any) {
    console.error('[Cron Due Date] Error:', error);
    return NextResponse.json({ error: error?.message || 'Erro no processamento de vencimentos' }, { status: 500 });
  }
}
