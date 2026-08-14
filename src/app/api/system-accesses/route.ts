import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import SystemAccessModel from '@/lib/models/SystemAccess';

let FALLBACK_SYSTEM_ACCESSES: any[] = [];

async function tryMongo() {
  try {
    await connectDB();
    return true;
  } catch (err) {
    console.warn('MongoDB connection issue (system-accesses):', err);
    return false;
  }
}

export async function GET() {
  try {
    if (await tryMongo()) {
      const accesses = await SystemAccessModel.find({}).sort({ createdAt: -1 }).lean();
      return NextResponse.json({ accesses });
    }
  } catch (e) {
    console.error('MongoDB indisponível (system-accesses):', e);
  }
  return NextResponse.json({ accesses: FALLBACK_SYSTEM_ACCESSES });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, access, accessId, updates } = body;

    if (await tryMongo()) {
      if (action === 'create') {
        const created = await SystemAccessModel.create(access);
        return NextResponse.json({ success: true, access: created });
      }

      if (action === 'update') {
        const updated = await SystemAccessModel.findOneAndUpdate(
          { id: accessId },
          { $set: updates },
          { new: true }
        ).lean();
        return NextResponse.json({ success: true, access: updated });
      }

      if (action === 'delete') {
        await SystemAccessModel.deleteOne({ id: accessId });
        return NextResponse.json({ success: true });
      }
    }

    if (action === 'create') {
      FALLBACK_SYSTEM_ACCESSES.unshift(access);
      return NextResponse.json({ success: true, access });
    }

    if (action === 'update') {
      FALLBACK_SYSTEM_ACCESSES = FALLBACK_SYSTEM_ACCESSES.map(a =>
        a.id === accessId ? { ...a, ...updates } : a
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('Erro ao processar acesso a sistema:', error);
    return NextResponse.json({ error: 'Erro interno ao processar acesso' }, { status: 500 });
  }
}
