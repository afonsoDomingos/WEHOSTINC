import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import DomainSearchLogModel from '@/lib/models/DomainSearchLog';

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
    const useMongo = await tryMongo();
    
    if (useMongo) {
      const logs = await DomainSearchLogModel.find({}).sort({ timestamp: -1 }).limit(100).lean();
      console.log(`[Domain History GET] MongoDB: ${logs.length} logs`);
      
      // Se MongoDB estiver vazio, adicionar dados de demo
      if (logs.length === 0) {
        console.log('[Domain History GET] MongoDB vazio, adicionando dados de demo');
        const demoLogs = [
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
        
        // Salvar dados de demo no MongoDB
        await DomainSearchLogModel.insertMany(demoLogs);
        return NextResponse.json({
          totalSearches: demoLogs.length,
          availableSearches: demoLogs.filter(l => l.isAvailable).length,
          logs: demoLogs,
          source: 'mongodb (demo added)'
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

  return NextResponse.json({ error: 'MongoDB indisponível' }, { status: 500 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { domain, extension, isAvailable } = body;

    console.log(`[Domain History POST] Recebido: ${domain}, ${extension}, ${isAvailable}`);

    if (!domain || !extension) {
      return NextResponse.json({ error: 'domain e extension são obrigatórios' }, { status: 400 });
    }

    const cleanDomain = (domain as string).toLowerCase().trim();
    const now = new Date().toISOString();

    const useMongo = await tryMongo();
    
    if (useMongo) {
      const existing = await DomainSearchLogModel.findOne({ domain: cleanDomain });
      let currentCount = 1;

      if (existing) {
        existing.timestamp = now;
        existing.isAvailable = isAvailable;
        existing.searchCount = (existing.searchCount || 1) + 1;
        currentCount = existing.searchCount;
        await existing.save();
        console.log(`[Domain History POST] Atualizado: ${cleanDomain} (count: ${currentCount})`);
      } else {
        await DomainSearchLogModel.create({
          id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
          domain: cleanDomain,
          extension,
          isAvailable,
          searchCount: 1,
          timestamp: now
        });
        console.log(`[Domain History POST] Criado: ${cleanDomain}`);
      }

      const logs = await DomainSearchLogModel.find({}).sort({ timestamp: -1 }).limit(100).lean();
      return NextResponse.json({ success: true, searchCount: currentCount, logs, source: 'mongodb' });
    }
  } catch (e) {
    console.error('[Domain History POST] Erro:', e);
    return NextResponse.json({ error: 'Erro ao registar pesquisa' }, { status: 500 });
  }
}
