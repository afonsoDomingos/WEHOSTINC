import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import TicketModel from '@/lib/models/Ticket';

// GET: Retorna todos os tickets (ou filtrado por userId)
export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    const query = userId ? { userId } : {};
    const tickets = await TicketModel.find(query).sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ tickets });
  } catch (error) {
    console.error('Erro ao buscar tickets:', error);
    return NextResponse.json({ tickets: [] }, { status: 500 });
  }
}

// POST: Criar ticket, responder mensagem ou atualizar status
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { action, ticket, ticketId, message, status, priority, newStatus } = body;

    if (action === 'reply') {
      const now = new Date().toISOString();
      const finalStatus = newStatus || (message.sender === 'client' ? 'open' : 'answered');

      const updated = await TicketModel.findOneAndUpdate(
        { id: ticketId },
        {
          $push: { messages: message },
          $set: { updatedAt: now, status: finalStatus }
        },
        { new: true }
      ).lean();

      if (!updated) {
        return NextResponse.json({ error: 'Ticket não encontrado' }, { status: 404 });
      }
      return NextResponse.json({ success: true, ticket: updated });
    }

    if (action === 'update_status') {
      await TicketModel.findOneAndUpdate(
        { id: ticketId },
        { status, ...(priority ? { priority } : {}), updatedAt: new Date().toISOString() }
      );
      const tickets = await TicketModel.find({}).sort({ updatedAt: -1 }).lean();
      return NextResponse.json({ success: true, tickets });
    }

    if (action === 'delete') {
      await TicketModel.deleteOne({ id: ticketId || body.id });
      const tickets = await TicketModel.find({}).sort({ updatedAt: -1 }).lean();
      return NextResponse.json({ success: true, tickets });
    }

    // Criar novo ticket
    if (action === 'create' || ticket) {
      const newTicket = ticket || {
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

      await TicketModel.findOneAndUpdate(
        { id: newTicket.id },
        newTicket,
        { upsert: true, new: true }
      );
      const tickets = await TicketModel.find({}).sort({ updatedAt: -1 }).lean();
      return NextResponse.json({ success: true, ticket: newTicket, tickets });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('Erro na API de Tickets:', error);
    return NextResponse.json({ error: 'Erro interno ao processar ticket' }, { status: 500 });
  }
}
