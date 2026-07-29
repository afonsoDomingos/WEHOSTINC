import { NextRequest, NextResponse } from 'next/server';
import { DomainSearchLog } from '@/lib/domains';

// Store global persistente em memória (shared across requests in same instance)
// Em produção com múltiplas instâncias, usar Redis/DB. Para MVP funciona bem.
let DOMAIN_LOG_STORE: DomainSearchLog[] = [
  {
    id: 'log-demo-1',
    domain: 'empresaexemplo.co.mz',
    extension: '.co.mz',
    isAvailable: true,
    searchCount: 1,
    timestamp: new Date(Date.now() - 300000).toISOString()
  },
  {
    id: 'log-demo-2',
    domain: 'mcel.co.mz',
    extension: '.co.mz',
    isAvailable: false,
    searchCount: 1,
    timestamp: new Date(Date.now() - 900000).toISOString()
  }
];

export async function GET() {
  return NextResponse.json({
    totalSearches: DOMAIN_LOG_STORE.length,
    availableSearches: DOMAIN_LOG_STORE.filter(l => l.isAvailable).length,
    logs: DOMAIN_LOG_STORE
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
    const existingIndex = DOMAIN_LOG_STORE.findIndex(
      l => l.domain.toLowerCase().trim() === cleanDomain
    );

    let currentCount = 1;
    if (existingIndex >= 0) {
      const existing = DOMAIN_LOG_STORE[existingIndex];
      existing.timestamp = new Date().toISOString();
      existing.isAvailable = isAvailable;
      existing.searchCount = (existing.searchCount || 1) + 1;
      currentCount = existing.searchCount;
      DOMAIN_LOG_STORE.splice(existingIndex, 1);
      DOMAIN_LOG_STORE.unshift(existing);
    } else {
      const newLog: DomainSearchLog = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
        domain: cleanDomain,
        extension,
        isAvailable,
        searchCount: 1,
        timestamp: new Date().toISOString()
      };
      DOMAIN_LOG_STORE.unshift(newLog);
    }

    if (DOMAIN_LOG_STORE.length > 100) {
      DOMAIN_LOG_STORE.pop();
    }

    return NextResponse.json({ success: true, searchCount: currentCount, logs: DOMAIN_LOG_STORE });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao registar pesquisa' }, { status: 500 });
  }
}
