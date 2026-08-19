import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import UptimeMonitor from '@/lib/models/UptimeMonitor';
import User from '@/lib/models/User';
import { dispatchMessage } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { monitorId } = body;

    if (!monitorId) {
      return NextResponse.json({ error: 'Monitor ID is required' }, { status: 400 });
    }

    const monitor = await UptimeMonitor.findById(monitorId);
    
    if (!monitor) {
      return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });
    }

    if (!monitor.isActive) {
      return NextResponse.json({ error: 'Monitor is not active' }, { status: 400 });
    }

    // Verificar o uptime do site
    const startTime = Date.now();
    let status: 'online' | 'offline' = 'offline';
    let statusCode: number | undefined;
    let error: string | undefined;
    let responseTime: number = 0;

    try {
      const response = await fetch(monitor.url, {
        method: 'GET',
        signal: AbortSignal.timeout(10000), // 10 segundos timeout
      });
      
      responseTime = Date.now() - startTime;
      statusCode = response.status;
      
      if (response.ok) {
        status = 'online';
      } else {
        status = 'offline';
        error = `HTTP ${response.status}`;
      }
    } catch (err) {
      responseTime = Date.now() - startTime;
      status = 'offline';
      error = err instanceof Error ? err.message : 'Unknown error';
    }

    // Atualizar o monitor
    const now = new Date();
    monitor.lastCheck = now;
    monitor.totalChecks += 1;
    
    if (status === 'online') {
      monitor.successfulChecks += 1;
      monitor.lastOnline = now;
      if (monitor.currentStatus === 'offline') {
        // Site voltou online
        monitor.currentStatus = 'online';
      }
    } else {
      monitor.failedChecks += 1;
      monitor.lastOffline = now;
      if (monitor.currentStatus === 'online') {
        // Site ficou offline
        monitor.currentStatus = 'offline';
      }
    }

    // Calcular porcentagem de uptime
    monitor.uptimePercentage = (monitor.successfulChecks / monitor.totalChecks) * 100;

    // Adicionar check ao histórico
    monitor.checks.push({
      timestamp: now,
      status,
      responseTime,
      statusCode,
      error,
    });

    // Manter apenas os últimos 1000 checks para não crescer demais
    if (monitor.checks.length > 1000) {
      monitor.checks = monitor.checks.slice(-1000);
    }

    await monitor.save();

    // Verificar se precisa enviar alerta
    let alertTriggered = false;
    if (status === 'offline' && monitor.alertsEnabled) {
      const cooldownExpired = !monitor.lastAlertSent || 
        (now.getTime() - monitor.lastAlertSent.getTime()) > (monitor.alertCooldown * 60 * 1000);
      
      if (cooldownExpired) {
        alertTriggered = true;
        monitor.lastAlertSent = now;
        await monitor.save();
        
        // Enviar notificação ao cliente
        try {
          const user = await User.findById(monitor.userId);
          if (user && user.email) {
            const horarioOffline = now.toLocaleString('pt-MZ', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            await dispatchMessage({
              recipientEmail: user.email,
              recipientName: user.name || 'Cliente',
              templateId: 'site-offline-alert',
              variables: {
                nome_site: monitor.name,
                url_site: monitor.url,
                horario_offline: horarioOffline,
                tempo_resposta: responseTime.toString()
              },
              isAutomatic: true,
              eventType: 'site_offline',
              channel: 'email'
            });

            console.log(`[Uptime Alert] Alert sent to ${user.email} for ${monitor.url}`);
          }
        } catch (err) {
          console.error('[Uptime Alert] Error sending notification:', err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      status,
      responseTime,
      statusCode,
      error,
      uptimePercentage: monitor.uptimePercentage,
      alertTriggered,
      monitor: {
        id: monitor._id,
        url: monitor.url,
        name: monitor.name,
        currentStatus: monitor.currentStatus,
        lastCheck: monitor.lastCheck,
        uptimePercentage: monitor.uptimePercentage,
      }
    });

  } catch (error) {
    console.error('[Uptime Check] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
