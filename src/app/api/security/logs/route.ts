import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import SecurityLogModel from '@/lib/models/SecurityLog';

let FALLBACK_SECURITY_LOGS: any[] = [];

async function tryMongo() {
  try {
    await connectDB();
    return true;
  } catch (err) {
    console.warn('MongoDB connection issue (security logs):', err);
    return false;
  }
}

export async function GET() {
  try {
    if (await tryMongo()) {
      const logs = await SecurityLogModel.find({}).sort({ createdAt: -1 }).limit(50).lean();
      return NextResponse.json({ logs });
    }
  } catch (e) { console.error('MongoDB indisponível (security logs):', e); }
  return NextResponse.json({ logs: FALLBACK_SECURITY_LOGS });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { log } = body;
    if (!log) return NextResponse.json({ error: 'Log inválido' }, { status: 400 });

    if (await tryMongo()) {
      await SecurityLogModel.create(log);
      const logs = await SecurityLogModel.find({}).sort({ createdAt: -1 }).limit(50).lean();
      return NextResponse.json({ success: true, logs });
    }

    FALLBACK_SECURITY_LOGS.unshift(log);
    if (FALLBACK_SECURITY_LOGS.length > 50) FALLBACK_SECURITY_LOGS.pop();
    return NextResponse.json({ success: true, logs: FALLBACK_SECURITY_LOGS });
  } catch (error) {
    console.error('Erro na API de Security Logs:', error);
    return NextResponse.json({ error: 'Erro ao processar logs de segurança' }, { status: 500 });
  }
}
