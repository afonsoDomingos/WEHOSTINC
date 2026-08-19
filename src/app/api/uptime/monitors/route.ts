import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import UptimeMonitor from '@/lib/models/UptimeMonitor';
import User from '@/lib/models/User';

// GET - Listar monitores do usuário
export async function GET(request: NextRequest) {
  try {
    // Obter userId do header de autenticação
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const monitors = await UptimeMonitor.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, monitors });

  } catch (error) {
    console.error('[Uptime Monitors GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Criar novo monitor
export async function POST(request: NextRequest) {
  try {
    // Obter userId do header de autenticação
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { url, name, checkInterval, alertsEnabled, alertCooldown } = body;

    // Validações
    if (!url || !name) {
      return NextResponse.json({ error: 'URL and name are required' }, { status: 400 });
    }

    // Validar URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    await connectDB();

    // Verificar se o usuário existe
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verificar se o usuário já tem um monitor para esta URL
    const existingMonitor = await UptimeMonitor.findOne({
      userId,
      url: url
    });

    if (existingMonitor) {
      return NextResponse.json({ error: 'Monitor for this URL already exists' }, { status: 400 });
    }

    // Criar novo monitor
    const monitor = await UptimeMonitor.create({
      userId,
      url,
      name,
      checkInterval: checkInterval || 5,
      alertsEnabled: alertsEnabled !== undefined ? alertsEnabled : true,
      alertCooldown: alertCooldown || 30,
      isActive: true,
      currentStatus: 'offline',
      totalChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      uptimePercentage: 0,
    });

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
        createdAt: monitor.createdAt,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('[Uptime Monitors POST] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
