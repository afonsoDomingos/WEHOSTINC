import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import DomainSearchLogModel from '@/lib/models/DomainSearchLog';

let FALLBACK_LOGS: any[] = [];

async function tryMongo() {
  try { 
    await connectDB(); 
    return true; 
  } catch { 
    return false; 
  }
}

export async function GET() {
  try {
    if (await tryMongo()) {
      const logs = await DomainSearchLogModel.find({}).sort({ timestamp: -1 }).limit(100).lean();
      return NextResponse.json({
        totalSearches: logs.length,
        availableSearches: logs.filter(l => l.isAvailable).length,
        logs
      });
    }
  } catch (e) { 
    console.error('MongoDB indisponível (domain history):', e); 
  }

  return NextResponse.json({
    totalSearches: FALLBACK_LOGS.length,
    availableSearches: FALLBACK_LOGS.filter(l => l.isAvailable).length,
    logs: FALLBACK_LOGS
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { domain, extension, isAvailable } = body;

    if (!domain || !extension) {
      return NextResponse.json({ error: 'domain e extension são obrigatórios' }, { status: 400 });
    }

    const cleanDomain = (domain as string).toLowerCase().trim();
    const now = new Date().toISOString();

    // Tentar salvar no MongoDB primeiro
    if (await tryMongo()) {
      try {
        const existing = await DomainSearchLogModel.findOne({ domain: cleanDomain });
        let currentCount = 1;

        if (existing) {
          existing.timestamp = now;
          existing.isAvailable = isAvailable;
          existing.searchCount = (existing.searchCount || 1) + 1;
          currentCount = existing.searchCount;
          await existing.save();
        } else {
          await DomainSearchLogModel.create({
            id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
            domain: cleanDomain,
            extension,
            isAvailable,
            searchCount: 1,
            timestamp: now
          });
        }

        const logs = await DomainSearchLogModel.find({}).sort({ timestamp: -1 }).limit(100).lean();
        return NextResponse.json({ success: true, searchCount: currentCount, logs, source: 'mongodb' });
      } catch (mongoError) {
        console.error('Erro ao salvar no MongoDB, usando fallback:', mongoError);
        // Continua para fallback
      }
    }

    // Fallback in-memory (sempre funciona)
    const existingIndex = FALLBACK_LOGS.findIndex(l => l.domain.toLowerCase() === cleanDomain);
    let currentCount = 1;
    if (existingIndex >= 0) {
      const existing = FALLBACK_LOGS[existingIndex];
      existing.timestamp = now;
      existing.isAvailable = isAvailable;
      existing.searchCount = (existing.searchCount || 1) + 1;
      currentCount = existing.searchCount;
      FALLBACK_LOGS.splice(existingIndex, 1);
      FALLBACK_LOGS.unshift(existing);
    } else {
      FALLBACK_LOGS.unshift({
        id: Date.now().toString(),
        domain: cleanDomain,
        extension,
        isAvailable,
        searchCount: 1,
        timestamp: now
      });
      if (FALLBACK_LOGS.length > 100) FALLBACK_LOGS.pop();
    }

    console.log(`[Domain History] Salvo no fallback: ${cleanDomain} (count: ${currentCount})`);
    return NextResponse.json({ success: true, searchCount: currentCount, logs: FALLBACK_LOGS, source: 'fallback' });
  } catch (e) {
    console.error('Erro ao registar pesquisa de domínio:', e);
    return NextResponse.json({ error: 'Erro ao registar pesquisa' }, { status: 500 });
  }
}
