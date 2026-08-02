import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import SystemForRentModel from '@/lib/models/SystemForRent';

let FALLBACK_SYSTEMS: any[] = [];

async function tryMongo() {
  try {
    await connectDB();
    return true;
  } catch (err) {
    console.warn('MongoDB connection issue (systems):', err);
    return false;
  }
}

export async function GET() {
  try {
    if (await tryMongo()) {
      const systems = await SystemForRentModel.find({}).lean();
      return NextResponse.json({ systems });
    }
  } catch (e) { console.error('MongoDB indisponível (systems):', e); }
  return NextResponse.json({ systems: FALLBACK_SYSTEMS });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, system, systemId, updates } = body;

    if (await tryMongo()) {
      if (action === 'create') {
        await SystemForRentModel.create(system);
        return NextResponse.json({ success: true });
      }

      if (action === 'update') {
        await SystemForRentModel.updateOne({ id: systemId }, { $set: updates });
        return NextResponse.json({ success: true });
      }

      if (action === 'delete') {
        await SystemForRentModel.deleteOne({ id: systemId });
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('Erro ao processar sistemas:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
