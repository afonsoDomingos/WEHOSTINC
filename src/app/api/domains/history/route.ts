import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import DomainSearchLogModel from '@/lib/models/DomainSearchLog';

let FALLBACK_LOGS: any[] = [
  {
    id: 'demo-1',
    domain: 'empresaexemplo.co.mz',
    extension: '.co.mz',
    isAvailable: true,
    searchCount: 3,
    timestamp: new Date(Date.now() - 300000).toISOString()
  },
  {
    id: 'demo-2',
    domain: 'mcel.co.mz',
    extension: '.co.mz',
    isAvailable: false,
    searchCount: 1,
    timestamp: new Date(Date.now() - 900000).toISOString()
  },
  {
    id: 'demo-3',
    domain: 'vodafone.co.mz',
    extension: '.co.mz',
    isAvailable: false,
    searchCount: 2,
    timestamp: new Date(Date.now() - 1800000).toISOString()
  }
];

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
      console.log(`[Domain History GET] Retornando ${logs.length} logs do MongoDB`);
      
      // Se MongoDB estiver vazio, usar fallback
      if (logs.length === 0 && FALLBACK_LOGS.length > 0) {
        console.log(`[Domain History GET] MongoDB vazio, usando fallback com ${FALLBACK_LOGS.length} logs`);
        return NextResponse.json({
          totalSearches: FALLBACK_LOGS.length,
          availableSearches: FALLBACK_LOGS.filter(l => l.isAvailable).length,
          logs: FALLBACK_LOGS,
          source: 'fallback (mongodb empty)'
        });
      }
      
      return NextResponse.json({
        totalSearches: logs.length,
        availableSearches: logs.filter(l => l.isAvailable).length,
        logs,
        source: 'mongodb'
      });
    }
  } catch (e) { 
    console.error('MongoDB indisponível (domain history):', e); 
  }

  console.log(`[Domain History GET] Retornando ${FALLBACK_LOGS.length} logs do fallback`);
  return NextResponse.json({
    totalSearches: FALLBACK_LOGS.length,
    availableSearches: FALLBACK_LOGS.filter(l => l.isAvailable).length,
    logs: FALLBACK_LOGS,
    source: 'fallback'
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { domain, extension, isAvailable } = body;

    console.log(`[Domain History POST] Recebido: domain=${domain}, extension=${extension}, isAvailable=${isAvailable}`);

    if (!domain || !extension) {
      console.error('[Domain History POST] Parâmetros faltando');
      return NextResponse.json({ error: 'domain e extension são obrigatórios' }, { status: 400 });
    }

    const cleanDomain = (domain as string).toLowerCase().trim();
    const now = new Date().toISOString();

    // Tentar salvar no MongoDB primeiro
    if (await tryMongo()) {
      try {
        console.log(`[Domain History POST] Tentando salvar no MongoDB: ${cleanDomain}`);
        const existing = await DomainSearchLogModel.findOne({ domain: cleanDomain });
        let currentCount = 1;

        if (existing) {
          console.log(`[Domain History POST] Domínio já existe, atualizando: ${cleanDomain}`);
          existing.timestamp = now;
          existing.isAvailable = isAvailable;
          existing.searchCount = (existing.searchCount || 1) + 1;
          currentCount = existing.searchCount;
          await existing.save();
        } else {
          console.log(`[Domain History POST] Novo domínio, criando: ${cleanDomain}`);
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
        console.log(`[Domain History POST] Salvo no MongoDB com sucesso. Total logs: ${logs.length}, searchCount: ${currentCount}`);
        return NextResponse.json({ success: true, searchCount: currentCount, logs, source: 'mongodb' });
      } catch (mongoError) {
        console.error('[Domain History POST] Erro ao salvar no MongoDB, usando fallback:', mongoError);
        // Continua para fallback
      }
    } else {
      console.log('[Domain History POST] MongoDB indisponível, usando fallback');
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

    console.log(`[Domain History POST] Salvo no fallback: ${cleanDomain} (count: ${currentCount}, total logs: ${FALLBACK_LOGS.length})`);
    return NextResponse.json({ success: true, searchCount: currentCount, logs: FALLBACK_LOGS, source: 'fallback' });
  } catch (e) {
    console.error('[Domain History POST] Erro ao registar pesquisa de domínio:', e);
    return NextResponse.json({ error: 'Erro ao registar pesquisa' }, { status: 500 });
  }
}
