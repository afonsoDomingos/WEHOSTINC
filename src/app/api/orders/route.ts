import { NextResponse } from 'next/server';

export interface ServerServiceOrder {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceName: string;
  amount: number;
  paymentMethod: 'mpesa' | 'emola' | 'card' | 'bank_transfer';
  proofUrl?: string;
  proofName?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'suspended';
  createdAt: string;
}

let GLOBAL_ORDERS: ServerServiceOrder[] = [
  {
    id: 'ORD-98214',
    clientName: 'MSServices',
    clientEmail: 'info@msservices.co.mz',
    clientPhone: '+258 84 123 4567',
    serviceName: 'Criação de Site Profissional',
    amount: 25000,
    paymentMethod: 'mpesa',
    status: 'in_progress',
    createdAt: new Date().toISOString()
  },
  {
    id: 'ORD-97410',
    clientName: 'Afonso Domingos',
    clientEmail: 'afonso@wehostinc.co.mz',
    clientPhone: '+258 85 987 6543',
    serviceName: 'Plano Hospedagem Profissional',
    amount: 3000,
    paymentMethod: 'mpesa',
    status: 'completed',
    createdAt: new Date().toISOString()
  }
];

// GET: Retorna lista de todos os pedidos
export async function GET() {
  return NextResponse.json({ orders: GLOBAL_ORDERS });
}

// POST: Criar novo pedido ou atualizar status
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, order, orderId, status } = body;

    if (action === 'update_status') {
      GLOBAL_ORDERS = GLOBAL_ORDERS.map(o => o.id === orderId ? { ...o, status } : o);
      return NextResponse.json({ success: true, orders: GLOBAL_ORDERS });
    }

    const newOrder: ServerServiceOrder = order || {
      id: body.id || `ORD-${Date.now().toString().slice(-5)}`,
      clientName: body.clientName,
      clientEmail: body.clientEmail,
      clientPhone: body.clientPhone,
      serviceName: body.serviceName,
      amount: body.amount,
      paymentMethod: body.paymentMethod || 'mpesa',
      status: body.status || 'pending',
      createdAt: body.createdAt || new Date().toISOString()
    };

    GLOBAL_ORDERS.unshift(newOrder);
    return NextResponse.json({ success: true, order: newOrder, orders: GLOBAL_ORDERS });
  } catch (error) {
    console.error('Erro na API de Pedidos:', error);
    return NextResponse.json({ error: 'Erro ao processar pedido' }, { status: 500 });
  }
}
