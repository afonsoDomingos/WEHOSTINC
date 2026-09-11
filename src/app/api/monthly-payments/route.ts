import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import MonthlyPaymentModel from '@/lib/models/MonthlyPayment';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    let query = {};
    if (year) query = { ...query, year: parseInt(year) };
    if (month) query = { ...query, month: parseInt(month) };

    const payments = await MonthlyPaymentModel.find(query).lean();
    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Erro ao buscar pagamentos mensais:', error);
    return NextResponse.json({ error: 'Erro ao buscar pagamentos' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      clientId,
      clientName,
      clientEmail,
      year,
      month,
      amount,
      paidAmount,
      remainingAmount,
      status,
      paymentDate,
      paymentMethod,
      notes,
      installments,
      isManualClient
    } = body;

    if (!clientId || !clientName || !clientEmail || !year || !month || !amount) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    await connectDB();

    const payment = await MonthlyPaymentModel.create({
      id: id || `pay_${Date.now()}`,
      clientId,
      clientName,
      clientEmail,
      year,
      month,
      amount,
      paidAmount: paidAmount || amount,
      remainingAmount: remainingAmount || 0,
      status: status || 'pending',
      paymentDate,
      paymentMethod,
      notes,
      installments,
      isManualClient,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    console.error('Erro ao criar pagamento mensal:', error);
    return NextResponse.json({ error: 'Erro ao criar pagamento' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    await connectDB();

    const updated = await MonthlyPaymentModel.findOneAndUpdate(
      { id },
      updateData,
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, payment: updated });
  } catch (error) {
    console.error('Erro ao atualizar pagamento mensal:', error);
    return NextResponse.json({ error: 'Erro ao atualizar pagamento' }, { status: 500 });
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

    const deleted = await MonthlyPaymentModel.findOneAndDelete({ id });

    if (!deleted) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao eliminar pagamento mensal:', error);
    return NextResponse.json({ error: 'Erro ao eliminar pagamento' }, { status: 500 });
  }
}
