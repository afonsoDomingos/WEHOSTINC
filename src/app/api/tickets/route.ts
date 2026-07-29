import { NextResponse } from 'next/server';
import { SupportTicket, TicketMessage, DEFAULT_TICKETS } from '@/lib/data';

let GLOBAL_TICKETS: SupportTicket[] = [...DEFAULT_TICKETS];

// GET: Retorna lista de tickets
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (userId) {
    const userTickets = GLOBAL_TICKETS.filter(t => t.userId === userId);
    return NextResponse.json({ tickets: userTickets });
  }

  return NextResponse.json({ tickets: GLOBAL_TICKETS });
}

// POST: Criar ticket, responder mensagem ou atualizar status
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, ticket, ticketId, message, status, priority, newStatus } = body;

    if (action === 'reply') {
      const index = GLOBAL_TICKETS.findIndex(t => t.id === ticketId);
      if (index !== -1) {
        const now = new Date().toISOString();
        const updatedMessages = [...GLOBAL_TICKETS[index].messages, message];
        const finalStatus = newStatus || (message.sender === 'client' ? 'open' : 'answered');
        
        GLOBAL_TICKETS[index] = {
          ...GLOBAL_TICKETS[index],
          updatedAt: now,
          status: finalStatus,
          messages: updatedMessages
        };

        return NextResponse.json({ success: true, ticket: GLOBAL_TICKETS[index] });
      }
      return NextResponse.json({ error: 'Ticket não encontrado' }, { status: 404 });
    }

    if (action === 'update_status') {
      GLOBAL_TICKETS = GLOBAL_TICKETS.map(t => {
        if (t.id === ticketId) {
          return {
            ...t,
            status,
            priority: priority || t.priority,
            updatedAt: new Date().toISOString()
          };
        }
        return t;
      });
      return NextResponse.json({ success: true, tickets: GLOBAL_TICKETS });
    }

    // Criar novo ticket
    if (action === 'create' || ticket) {
      const newTicket: SupportTicket = ticket || {
        id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
        userId: body.userId,
        userName: body.userName,
        userEmail: body.userEmail,
        subject: body.subject,
        category: body.category || 'technical',
        priority: body.priority || 'medium',
        status: body.status || 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: body.messages || []
      };

      GLOBAL_TICKETS.unshift(newTicket);
      return NextResponse.json({ success: true, ticket: newTicket, tickets: GLOBAL_TICKETS });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('Erro na API de Tickets:', error);
    return NextResponse.json({ error: 'Erro interno ao processar ticket' }, { status: 500 });
  }
}
