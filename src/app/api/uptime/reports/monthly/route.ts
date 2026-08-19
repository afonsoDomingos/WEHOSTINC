import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import UptimeMonitor from '@/lib/models/UptimeMonitor';
import User from '@/lib/models/User';
import { dispatchMessage } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { month, year } = body;

    if (!month || !year) {
      return NextResponse.json({ error: 'Month and year are required' }, { status: 400 });
    }

    // Calcular o período do mês
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Buscar todos os monitores
    const monitors = await UptimeMonitor.find({});

    const reports = [];

    for (const monitor of monitors) {
      // Filtrar checks do período
      const periodChecks = monitor.checks.filter((check: any) => {
        const checkDate = new Date(check.timestamp);
        return checkDate >= startDate && checkDate <= endDate;
      });

      if (periodChecks.length === 0) continue;

      // Calcular estatísticas do período
      const totalPeriodChecks = periodChecks.length;
      const successfulPeriodChecks = periodChecks.filter((c: any) => c.status === 'online').length;
      const failedPeriodChecks = periodChecks.filter((c: any) => c.status === 'offline').length;
      const periodUptime = (successfulPeriodChecks / totalPeriodChecks) * 100;

      // Calcular tempo médio de resposta
      const totalResponseTime = periodChecks.reduce((acc: any, c: any) => acc + (c.responseTime || 0), 0);
      const avgResponseTime = totalResponseTime / totalPeriodChecks;

      // Encontrar períodos mais longos offline
      const offlinePeriods: { start: Date; end: Date; duration: number }[] = [];
      let currentOfflineStart: Date | null = null;

      for (const check of periodChecks) {
        if (check.status === 'offline' && !currentOfflineStart) {
          currentOfflineStart = new Date(check.timestamp);
        } else if (check.status === 'online' && currentOfflineStart) {
          offlinePeriods.push({
            start: currentOfflineStart,
            end: new Date(check.timestamp),
            duration: new Date(check.timestamp).getTime() - currentOfflineStart.getTime()
          });
          currentOfflineStart = null;
        }
      }

      // Se ainda estiver offline no final do período
      if (currentOfflineStart) {
        offlinePeriods.push({
          start: currentOfflineStart,
          end: endDate,
          duration: endDate.getTime() - currentOfflineStart.getTime()
        });
      }

      // Buscar informações do usuário
      const user = await User.findById(monitor.userId);

      reports.push({
        monitor: {
          id: monitor._id,
          name: monitor.name,
          url: monitor.url
        },
        user: {
          id: user?._id,
          name: user?.name,
          email: user?.email
        },
        period: {
          month,
          year,
          startDate,
          endDate
        },
        statistics: {
          totalChecks: totalPeriodChecks,
          successfulChecks: successfulPeriodChecks,
          failedChecks: failedPeriodChecks,
          uptimePercentage: periodUptime,
          avgResponseTime: avgResponseTime
        },
        offlinePeriods: offlinePeriods.map(p => ({
          start: p.start,
          end: p.end,
          durationMinutes: Math.floor(p.duration / 60000)
        }))
      });
    }

    return NextResponse.json({
      success: true,
      reports,
      totalReports: reports.length,
      period: {
        month,
        year,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });

  } catch (error) {
    console.error('[Uptime Monthly Report] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Endpoint para enviar relatório mensal por email
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { monitorId, month, year } = body;

    if (!monitorId || !month || !year) {
      return NextResponse.json({ error: 'Monitor ID, month and year are required' }, { status: 400 });
    }

    const monitor = await UptimeMonitor.findById(monitorId);
    
    if (!monitor) {
      return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });
    }

    const user = await User.findById(monitor.userId);
    
    if (!user || !user.email) {
      return NextResponse.json({ error: 'User not found or has no email' }, { status: 404 });
    }

    // Calcular o período do mês
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Filtrar checks do período
    const periodChecks = monitor.checks.filter((check: any) => {
      const checkDate = new Date(check.timestamp);
      return checkDate >= startDate && checkDate <= endDate;
    });

    if (periodChecks.length === 0) {
      return NextResponse.json({ error: 'No data available for this period' }, { status: 400 });
    }

    // Calcular estatísticas
    const totalPeriodChecks = periodChecks.length;
    const successfulPeriodChecks = periodChecks.filter((c: any) => c.status === 'online').length;
    const failedPeriodChecks = periodChecks.filter((c: any) => c.status === 'offline').length;
    const periodUptime = (successfulPeriodChecks / totalPeriodChecks) * 100;

    // Enviar email com o relatório
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const monthName = monthNames[month - 1];

    await dispatchMessage({
      recipientEmail: user.email,
      recipientName: user.name || 'Cliente',
      templateId: 'uptime-monthly-report',
      variables: {
        nome_cliente: user.name || 'Cliente',
        nome_site: monitor.name,
        url_site: monitor.url,
        mes_relatorio: monthName,
        ano_relatorio: year.toString(),
        uptime_percentual: periodUptime.toFixed(2),
        total_checks: totalPeriodChecks.toString(),
        checks_sucesso: successfulPeriodChecks.toString(),
        checks_falha: failedPeriodChecks.toString()
      },
      isAutomatic: true,
      eventType: 'uptime_monthly_report',
      channel: 'email'
    });

    return NextResponse.json({
      success: true,
      message: 'Monthly report sent successfully',
      email: user.email
    });

  } catch (error) {
    console.error('[Uptime Monthly Report Send] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
