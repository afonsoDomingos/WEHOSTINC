import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import UptimeMonitor from '@/lib/models/UptimeMonitor';

// PUT - Atualizar monitor
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Obter userId do header de autenticação
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { url, name, isActive, checkInterval, alertsEnabled, alertCooldown } = body;

    await connectDB();

    const monitor = await UptimeMonitor.findOne({
      _id: params.id,
      userId
    });

    if (!monitor) {
      return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });
    }

    // Atualizar campos
    if (url !== undefined) {
      try {
        new URL(url);
        monitor.url = url;
      } catch {
        return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
      }
    }

    if (name !== undefined) monitor.name = name;
    if (isActive !== undefined) monitor.isActive = isActive;
    if (checkInterval !== undefined) monitor.checkInterval = checkInterval;
    if (alertsEnabled !== undefined) monitor.alertsEnabled = alertsEnabled;
    if (alertCooldown !== undefined) monitor.alertCooldown = alertCooldown;

    await monitor.save();

    return NextResponse.json({
      success: true,
      monitor: {
        id: monitor._id,
        url: monitor.url,
        name: monitor.name,
        isActive: monitor.isActive,
        checkInterval: monitor.checkInterval,
        alertsEnabled: monitor.alertsEnabled,
        alertCooldown: monitor.alertCooldown,
        currentStatus: monitor.currentStatus,
        uptimePercentage: monitor.uptimePercentage,
      }
    });

  } catch (error) {
    console.error('[Uptime Monitor PUT] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Deletar monitor
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Obter userId do header de autenticação
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const monitor = await UptimeMonitor.findOneAndDelete({
      _id: params.id,
      userId
    });

    if (!monitor) {
      return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Monitor deleted successfully' });

  } catch (error) {
    console.error('[Uptime Monitor DELETE] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
