import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import TicketModel from '@/lib/models/Ticket';

let FALLBACK_TICKETS: any[] = [];

async function tryMongo() {
  try {
    await connectDB();
    return true;
  } catch (err) {
    console.warn('MongoDB connection issue (tickets):', err);
    return false;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (await tryMongo()) {
      const query = userId ? { userId } : {};
      const tickets = await TicketModel.find(query).sort({ updatedAt: -1 }).lean();
      return NextResponse.json({ tickets });
    }
  } catch (e) { console.error('MongoDB indisponível (tickets):', e); }
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const tickets = userId ? FALLBACK_TICKETS.filter(t => t.userId === userId) : FALLBACK_TICKETS;
  return NextResponse.json({ tickets });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, ticket, ticketId, message, status, priority, newStatus } = body;
    const useMongo = await tryMongo();

    if (action === 'reply') {
      const now = new Date().toISOString();
      const finalStatus = newStatus || (message.sender === 'client' ? 'open' : 'answered');
      if (useMongo) {
        const updated = await TicketModel.findOneAndUpdate({ id: ticketId }, { $push: { messages: message }, $set: { updatedAt: now, status: finalStatus } }, { new: true }).lean();
        if (!updated) return NextResponse.json({ error: 'Ticket não encontrado' }, { status: 404 });
        return NextResponse.json({ success: true, ticket: updated });
      }
      const idx = FALLBACK_TICKETS.findIndex(t => t.id === ticketId);
      if (idx === -1) return NextResponse.json({ error: 'Ticket não encontrado' }, { status: 404 });
      FALLBACK_TICKETS[idx] = { ...FALLBACK_TICKETS[idx], updatedAt: now, status: finalStatus, messages: [...(FALLBACK_TICKETS[idx].messages || []), message] };
      return NextResponse.json({ success: true, ticket: FALLBACK_TICKETS[idx] });
    }

    if (action === 'update_status') {
      if (useMongo) {
        await TicketModel.findOneAndUpdate({ id: ticketId }, { status, ...(priority ? { priority } : {}), updatedAt: new Date().toISOString() });
        return NextResponse.json({ success: true, tickets: await TicketModel.find({}).sort({ updatedAt: -1 }).lean() });
      }
      FALLBACK_TICKETS = FALLBACK_TICKETS.map(t => t.id === ticketId ? { ...t, status, ...(priority ? { priority } : {}), updatedAt: new Date().toISOString() } : t);
      return NextResponse.json({ success: true, tickets: FALLBACK_TICKETS });
    }

    if (action === 'delete') {
      const targetId = (ticketId || body.id || '').toLowerCase().trim();
      if (useMongo) {
        if (targetId) {
          await TicketModel.deleteMany({ id: { $regex: new RegExp(`^${targetId}$`, 'i') } });
        }
        return NextResponse.json({ success: true, tickets: await TicketModel.find({}).sort({ updatedAt: -1 }).lean() });
      }
      FALLBACK_TICKETS = FALLBACK_TICKETS.filter(t => t.id?.toLowerCase() !== targetId);
      return NextResponse.json({ success: true, tickets: FALLBACK_TICKETS });
    }

    if (action === 'create' || ticket) {
      const newTicket = ticket || { id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`, userId: body.userId, userName: body.userName, userEmail: body.userEmail, subject: body.subject, category: body.category || 'technical', priority: body.priority || 'medium', status: body.status || 'open', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), messages: body.messages || [] };
      if (useMongo) {
        await TicketModel.findOneAndUpdate({ id: newTicket.id }, newTicket, { upsert: true, new: true });
        return NextResponse.json({ success: true, ticket: newTicket, tickets: await TicketModel.find({}).sort({ updatedAt: -1 }).lean() });
      }
      FALLBACK_TICKETS.unshift(newTicket);
      return NextResponse.json({ success: true, ticket: newTicket, tickets: FALLBACK_TICKETS });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('Erro na API de Tickets:', error);
    return NextResponse.json({ error: 'Erro interno ao processar ticket' }, { status: 500 });
  }
}
