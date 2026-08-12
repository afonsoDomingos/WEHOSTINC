import { NextResponse } from 'next/server';

// Armazenamento em memória no servidor para sincronização do admin
let serverAdminNotifications: any[] = [];

export async function GET() {
  return NextResponse.json({
    success: true,
    notifications: serverAdminNotifications
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.action === 'mark_all_read') {
      serverAdminNotifications = serverAdminNotifications.map(n => ({ ...n, read: true }));
      return NextResponse.json({ success: true, notifications: serverAdminNotifications });
    }

    if (body.action === 'mark_read' && body.id) {
      serverAdminNotifications = serverAdminNotifications.map(n => n.id === body.id ? { ...n, read: true } : n);
      return NextResponse.json({ success: true, notifications: serverAdminNotifications });
    }

    if (body.action === 'clear') {
      serverAdminNotifications = [];
      return NextResponse.json({ success: true, notifications: [] });
    }

    // Adicionar nova notificação
    const newNotif = {
      id: body.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: body.title || 'Notificação do Sistema',
      message: body.message || '',
      type: body.type || 'system',
      read: false,
      createdAt: body.createdAt || new Date().toISOString(),
      link: body.link,
      userEmail: body.userEmail,
      userName: body.userName,
      metadata: body.metadata || {}
    };

    serverAdminNotifications = [newNotif, ...serverAdminNotifications].slice(0, 200);

    return NextResponse.json({
      success: true,
      notification: newNotif,
      notifications: serverAdminNotifications
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
