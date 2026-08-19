import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import AbandonedCart from '@/lib/models/AbandonedCart';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, items, metadata } = body;

    if (!userId || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'userId and items are required' }, { status: 400 });
    }

    await connectDB();

    // Buscar usuário
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calcular total
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

    // Verificar se já existe carrinho ativo para este usuário
    const existingCart = await AbandonedCart.findOne({
      userId,
      status: 'active'
    });

    if (existingCart) {
      // Atualizar carrinho existente
      existingCart.items = items;
      existingCart.totalAmount = totalAmount;
      existingCart.lastActivity = new Date();
      existingCart.metadata = { ...existingCart.metadata, ...metadata };
      await existingCart.save();

      return NextResponse.json({
        success: true,
        cart: {
          id: existingCart._id,
          items: existingCart.items,
          totalAmount: existingCart.totalAmount,
          status: existingCart.status,
          lastActivity: existingCart.lastActivity
        }
      });
    }

    // Criar novo carrinho
    const cart = await AbandonedCart.create({
      userId,
      userEmail: user.email,
      userName: user.name,
      items,
      totalAmount,
      currency: 'MZN',
      status: 'active',
      lastActivity: new Date(),
      recoveryEmailsSent: 0,
      recoveryAttempts: 0,
      metadata
    });

    return NextResponse.json({
      success: true,
      cart: {
        id: cart._id,
        items: cart.items,
        totalAmount: cart.totalAmount,
        status: cart.status,
        lastActivity: cart.lastActivity
      }
    }, { status: 201 });

  } catch (error) {
    console.error('[Abandoned Cart Track] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Buscar carrinho ativo do usuário
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const cart = await AbandonedCart.findOne({
      userId,
      status: 'active'
    });

    if (!cart) {
      return NextResponse.json({ success: true, cart: null });
    }

    return NextResponse.json({
      success: true,
      cart: {
        id: cart._id,
        items: cart.items,
        totalAmount: cart.totalAmount,
        status: cart.status,
        lastActivity: cart.lastActivity
      }
    });

  } catch (error) {
    console.error('[Abandoned Cart GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
