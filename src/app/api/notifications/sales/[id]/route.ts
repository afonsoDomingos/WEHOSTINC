import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import SalesNotification from '@/lib/models/SalesNotification';

// PATCH para marcar notificação como lida
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const { id } = params;
    const body = await request.json();
    const { action } = body; // 'read', 'archive', 'unread'

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    const notification = await SalesNotification.findById(id);
    
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    if (action === 'read') {
      notification.status = 'read';
      notification.readAt = new Date();
    } else if (action === 'archive') {
      notification.status = 'archived';
    } else if (action === 'unread') {
      notification.status = 'unread';
      notification.readAt = undefined;
    }

    await notification.save();

    return NextResponse.json({
      success: true,
      notification: {
        id: notification._id,
        status: notification.status,
        readAt: notification.readAt
      }
    });

  } catch (error) {
    console.error('[Sales Notification PATCH] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE para excluir notificação
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const { id } = params;

    const notification = await SalesNotification.findByIdAndDelete(id);
    
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('[Sales Notification DELETE] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
