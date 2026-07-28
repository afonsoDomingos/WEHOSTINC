import { NextResponse } from 'next/server';

export interface ServerSite {
  id: string;
  domain: string;
  status: 'active' | 'pending' | 'suspended';
  plan: 'basic' | 'pro' | 'enterprise';
  createdAt: string;
  ssl: boolean;
  phpVersion: string;
  storageUsed: number;
}

let GLOBAL_SITES: ServerSite[] = [];

// GET: Lista todos os sites hospedados no servidor
export async function GET() {
  return NextResponse.json({ sites: GLOBAL_SITES });
}

// POST: Adicionar ou remover site
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, site, siteId } = body;

    if (action === 'delete') {
      GLOBAL_SITES = GLOBAL_SITES.filter(s => s.id !== siteId);
      return NextResponse.json({ success: true, sites: GLOBAL_SITES });
    }

    if (action === 'update_status') {
      const { status } = body;
      GLOBAL_SITES = GLOBAL_SITES.map(s => s.id === siteId ? { ...s, status } : s);
      return NextResponse.json({ success: true, sites: GLOBAL_SITES });
    }

    const newSite: ServerSite = site || {
      id: body.id || Date.now().toString(),
      domain: body.domain,
      status: body.status || 'active',
      plan: body.plan || 'basic',
      createdAt: body.createdAt || new Date().toISOString(),
      ssl: body.ssl !== undefined ? body.ssl : true,
      phpVersion: body.phpVersion || '8.2',
      storageUsed: body.storageUsed || 1.2
    };

    const index = GLOBAL_SITES.findIndex(s => s.id === newSite.id || s.domain.toLowerCase() === newSite.domain.toLowerCase());
    if (index >= 0) {
      GLOBAL_SITES[index] = newSite;
    } else {
      GLOBAL_SITES.unshift(newSite);
    }

    return NextResponse.json({ success: true, site: newSite, sites: GLOBAL_SITES });
  } catch (error) {
    console.error('Erro na API de Sites:', error);
    return NextResponse.json({ error: 'Erro ao processar sites' }, { status: 500 });
  }
}
