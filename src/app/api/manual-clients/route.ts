import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import ManualClientModel from '@/lib/models/ManualClient';

export async function GET(request: Request) {
  try {
    await connectDB();
    const clients = await ManualClientModel.find({}).lean();
    return NextResponse.json({ clients });
  } catch (error) {
    console.error('Erro ao buscar clientes manuais:', error);
    return NextResponse.json({ error: 'Erro ao buscar clientes' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, name, email, plan, phone, address } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Nome e email são obrigatórios' }, { status: 400 });
    }

    await connectDB();

    // Verificar se email já existe
    const existing = await ManualClientModel.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 400 });
    }

    const client = await ManualClientModel.create({
      id: id || `manual_${Date.now()}`,
      name,
      email,
      plan: plan || 'Personalizado',
      phone,
      address,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true, client });
  } catch (error) {
    console.error('Erro ao criar cliente manual:', error);
    return NextResponse.json({ error: 'Erro ao criar cliente' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, email, plan, phone, address } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    await connectDB();

    const updated = await ManualClientModel.findOneAndUpdate(
      { id },
      { name, email, plan, phone, address },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, client: updated });
  } catch (error) {
    console.error('Erro ao atualizar cliente manual:', error);
    return NextResponse.json({ error: 'Erro ao atualizar cliente' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    await connectDB();

    const deleted = await ManualClientModel.findOneAndDelete({ id });

    if (!deleted) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao eliminar cliente manual:', error);
    return NextResponse.json({ error: 'Erro ao eliminar cliente' }, { status: 500 });
  }
}
