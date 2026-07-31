import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import SiteModel from '@/lib/models/Site';

let FALLBACK_SITES: any[] = [];

async function tryMongo() {
  try {
    await connectDB();
    return true;
  } catch (err) {
    console.warn('MongoDB connection issue (sites):', err);
    return false;
  }
}

export async function GET() {
  try {
    if (await tryMongo()) {
      const sites = await SiteModel.find({}).lean();
      return NextResponse.json({ sites });
    }
  } catch (e) { console.error('MongoDB indisponível (sites):', e); }
  return NextResponse.json({ sites: FALLBACK_SITES });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, site, siteId, status, domain, sites } = body;
    const useMongo = await tryMongo();

    if (action === 'sync_all' && Array.isArray(sites)) {
      if (useMongo) {
        for (const s of sites) {
          const key = (s.domain || s.id || '').toLowerCase();
          if (!key) continue;
          await SiteModel.findOneAndUpdate({ $or: [{ domain: key }, { id: s.id }] }, s, { upsert: true, new: true });
        }
        return NextResponse.json({ success: true, sites: await SiteModel.find({}).lean() });
      }
      const map = new Map<string, any>();
      FALLBACK_SITES.forEach(s => map.set(s.domain?.toLowerCase(), s));
      sites.forEach((s: any) => map.set((s.domain || s.id || '').toLowerCase(), { ...map.get((s.domain||s.id||'').toLowerCase()), ...s }));
      FALLBACK_SITES = Array.from(map.values());
      return NextResponse.json({ success: true, sites: FALLBACK_SITES });
    }

    if (action === 'delete') {
      const tId = (siteId || '').toLowerCase().trim();
      const tDomain = (domain || '').toLowerCase().trim();
      if (useMongo) {
        const deleteConditions: any[] = [];
        if (tId) {
          deleteConditions.push({ id: tId });
          deleteConditions.push({ domain: new RegExp(`^${tId}$`, 'i') });
        }
        if (tDomain) {
          deleteConditions.push({ id: tDomain });
          deleteConditions.push({ domain: new RegExp(`^${tDomain}$`, 'i') });
        }
        if (deleteConditions.length > 0) {
          await SiteModel.deleteMany({ $or: deleteConditions });
        }
        return NextResponse.json({ success: true, sites: await SiteModel.find({}).lean() });
      }
      FALLBACK_SITES = FALLBACK_SITES.filter(s => {
        if (tId && (s.id?.toLowerCase() === tId || s.domain?.toLowerCase() === tId)) return false;
        if (tDomain && (s.id?.toLowerCase() === tDomain || s.domain?.toLowerCase() === tDomain)) return false;
        return true;
      });
      return NextResponse.json({ success: true, sites: FALLBACK_SITES });
    }

    if (action === 'update_status') {
      const target = (siteId || domain || '').toLowerCase();
      const updateUserEmail = body.userEmail;
      const update: any = { status };
      if (updateUserEmail) update.userEmail = updateUserEmail;
      if (useMongo) {
        const result = await SiteModel.findOneAndUpdate({ $or: [{ id: target }, { domain: target }] }, update, { new: true });
        if (!result && (domain || siteId)) {
          const newDomain = domain || siteId;
          await SiteModel.create({ id: siteId || Date.now().toString(), name: newDomain, domain: newDomain, status: status || 'active', userEmail: updateUserEmail, createdAt: new Date().toISOString(), storage: 10, bandwidth: 100 });
        }
        return NextResponse.json({ success: true, sites: await SiteModel.find({}).lean() });
      }
      let found = false;
      FALLBACK_SITES = FALLBACK_SITES.map(s => {
        if (s.id?.toLowerCase() === target || s.domain?.toLowerCase() === target) { found = true; return { ...s, status, ...(updateUserEmail ? { userEmail: updateUserEmail } : {}) }; }
        return s;
      });
      if (!found && (domain || siteId)) FALLBACK_SITES.unshift({ id: siteId || Date.now().toString(), name: domain || siteId, domain: domain || siteId, status: status || 'active', userEmail: updateUserEmail, createdAt: new Date().toISOString() });
      return NextResponse.json({ success: true, sites: FALLBACK_SITES });
    }

    const siteData = site ? { ...site, userEmail: site.userEmail || body.userEmail } : { id: body.id || Date.now().toString(), name: body.name || body.domain, domain: body.domain, status: body.status || 'pending', userEmail: body.userEmail, createdAt: body.createdAt || new Date().toISOString(), storage: body.storage || 10, bandwidth: body.bandwidth || 100 };
    const targetKey = (siteData.domain || '').toLowerCase();

    if (useMongo) {
      await SiteModel.findOneAndUpdate({ $or: [{ id: siteData.id }, { domain: targetKey }] }, siteData, { upsert: true, new: true });
      return NextResponse.json({ success: true, site: siteData, sites: await SiteModel.find({}).lean() });
    }
    const idx = FALLBACK_SITES.findIndex(s => s.id === siteData.id || s.domain?.toLowerCase() === targetKey);
    if (idx >= 0) FALLBACK_SITES[idx] = { ...FALLBACK_SITES[idx], ...siteData };
    else FALLBACK_SITES.unshift(siteData);
    return NextResponse.json({ success: true, site: siteData, sites: FALLBACK_SITES });
  } catch (error) {
    console.error('Erro na API de Sites:', error);
    return NextResponse.json({ error: 'Erro ao processar sites' }, { status: 500 });
  }
}
