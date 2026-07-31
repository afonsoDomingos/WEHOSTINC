import { NextResponse } from 'next/server';

export interface ServerSite {
  id: string;
  name?: string;
  domain: string;
  status: 'active' | 'pending' | 'suspended';
  plan?: string;
  createdAt?: string;
  ssl?: boolean;
  phpVersion?: string;
  storageUsed?: number;
  storage?: number;
  bandwidth?: number;
  userEmail?: string;
}

let GLOBAL_SITES: ServerSite[] = [
  {
    id: '1',
    name: 'MSServices',
    domain: 'mssservices.co.mz',
    status: 'pending',
    createdAt: '2026-07-29T10:00:00.000Z',
    storage: 10,
    bandwidth: 100
  },
  {
    id: '2',
    name: 'tattabas3.com',
    domain: 'tattabas3.com',
    status: 'pending',
    createdAt: '2026-07-31T09:00:00.000Z',
    storage: 10,
    bandwidth: 100
  },
  {
    id: '3',
    name: 'amvibe258.com',
    domain: 'amvibe258.com',
    status: 'active',
    createdAt: '2026-07-31T09:00:00.000Z',
    storage: 10,
    bandwidth: 100
  }
];

// GET: Lista todos os sites hospedados no servidor
export async function GET() {
  return NextResponse.json({ sites: GLOBAL_SITES });
}

// POST: Adicionar, atualizar status ou sincronizar sites
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, site, siteId, status, domain, sites } = body;

    if (action === 'sync_all' && Array.isArray(sites)) {
      // Merge sites array smoothly
      const map = new Map<string, ServerSite>();
      GLOBAL_SITES.forEach(s => map.set(s.domain.toLowerCase(), s));
      sites.forEach((s: ServerSite) => {
        const key = (s.domain || s.id || '').toLowerCase();
        if (key) {
          const existing = map.get(key);
          map.set(key, { ...existing, ...s });
        }
      });
      GLOBAL_SITES = Array.from(map.values());
      return NextResponse.json({ success: true, sites: GLOBAL_SITES });
    }

    if (action === 'delete') {
      const target = (siteId || domain || '').toLowerCase();
      GLOBAL_SITES = GLOBAL_SITES.filter(s => s.id.toLowerCase() !== target && s.domain.toLowerCase() !== target);
      return NextResponse.json({ success: true, sites: GLOBAL_SITES });
    }

    if (action === 'update_status') {
      const target = (siteId || domain || '').toLowerCase();
      let updated = false;

      GLOBAL_SITES = GLOBAL_SITES.map(s => {
        if (s.id.toLowerCase() === target || s.domain.toLowerCase() === target) {
          updated = true;
          return { ...s, status };
        }
        return s;
      });

      if (!updated && (domain || siteId)) {
        const newDomain = domain || siteId;
        GLOBAL_SITES.unshift({
          id: siteId || Date.now().toString(),
          name: newDomain,
          domain: newDomain,
          status: status || 'active',
          createdAt: new Date().toISOString(),
          storage: 10,
          bandwidth: 100
        });
      }

      return NextResponse.json({ success: true, sites: GLOBAL_SITES });
    }

    // Adicionar site individual
    const newSite: ServerSite = site || {
      id: body.id || Date.now().toString(),
      name: body.name || body.domain,
      domain: body.domain,
      status: body.status || 'pending',
      createdAt: body.createdAt || new Date().toISOString(),
      storage: body.storage || 10,
      bandwidth: body.bandwidth || 100
    };

    const targetKey = newSite.domain.toLowerCase();
    const index = GLOBAL_SITES.findIndex(s => s.id === newSite.id || s.domain.toLowerCase() === targetKey);
    if (index >= 0) {
      GLOBAL_SITES[index] = { ...GLOBAL_SITES[index], ...newSite };
    } else {
      GLOBAL_SITES.unshift(newSite);
    }

    return NextResponse.json({ success: true, site: newSite, sites: GLOBAL_SITES });
  } catch (error) {
    console.error('Erro na API de Sites:', error);
    return NextResponse.json({ error: 'Erro ao processar sites' }, { status: 500 });
  }
}
