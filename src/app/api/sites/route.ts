import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import SiteModel from '@/lib/models/Site';

// GET: Lista todos os sites
export async function GET() {
  try {
    await connectDB();
    const sites = await SiteModel.find({}).lean();
    return NextResponse.json({ sites });
  } catch (error) {
    console.error('Erro ao buscar sites:', error);
    return NextResponse.json({ sites: [] }, { status: 500 });
  }
}

// POST: Adicionar, atualizar status, sincronizar ou eliminar sites
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { action, site, siteId, status, domain, sites } = body;

    if (action === 'sync_all' && Array.isArray(sites)) {
      for (const s of sites) {
        const key = (s.domain || s.id || '').toLowerCase();
        if (!key) continue;
        await SiteModel.findOneAndUpdate(
          { $or: [{ domain: key }, { id: s.id }] },
          s,
          { upsert: true, new: true }
        );
      }
      const allSites = await SiteModel.find({}).lean();
      return NextResponse.json({ success: true, sites: allSites });
    }

    if (action === 'delete') {
      const tId = (siteId || '').toLowerCase();
      const tDomain = (domain || '').toLowerCase();
      await SiteModel.deleteOne({
        $or: [
          ...(tId ? [{ id: tId }, { domain: tId }] : []),
          ...(tDomain ? [{ id: tDomain }, { domain: tDomain }] : [])
        ]
      });
      const allSites = await SiteModel.find({}).lean();
      return NextResponse.json({ success: true, sites: allSites });
    }

    if (action === 'update_status') {
      const target = (siteId || domain || '').toLowerCase();
      const updateUserEmail = body.userEmail;
      const update: Record<string, unknown> = { status };
      if (updateUserEmail) update.userEmail = updateUserEmail;

      const result = await SiteModel.findOneAndUpdate(
        { $or: [{ id: target }, { domain: target }] },
        update,
        { new: true }
      );

      if (!result && (domain || siteId)) {
        const newDomain = domain || siteId;
        await SiteModel.create({
          id: siteId || Date.now().toString(),
          name: newDomain,
          domain: newDomain,
          status: status || 'active',
          userEmail: updateUserEmail,
          createdAt: new Date().toISOString(),
          storage: 10,
          bandwidth: 100
        });
      }

      const allSites = await SiteModel.find({}).lean();
      return NextResponse.json({ success: true, sites: allSites });
    }

    // Adicionar ou atualizar site individual
    const siteData = site ? {
      ...site,
      userEmail: site.userEmail || body.userEmail
    } : {
      id: body.id || Date.now().toString(),
      name: body.name || body.domain,
      domain: body.domain,
      status: body.status || 'pending',
      userEmail: body.userEmail,
      createdAt: body.createdAt || new Date().toISOString(),
      storage: body.storage || 10,
      bandwidth: body.bandwidth || 100
    };

    const targetKey = (siteData.domain || '').toLowerCase();
    await SiteModel.findOneAndUpdate(
      { $or: [{ id: siteData.id }, { domain: targetKey }] },
      siteData,
      { upsert: true, new: true }
    );

    const allSites = await SiteModel.find({}).lean();
    return NextResponse.json({ success: true, site: siteData, sites: allSites });
  } catch (error) {
    console.error('Erro na API de Sites:', error);
    return NextResponse.json({ error: 'Erro ao processar sites' }, { status: 500 });
  }
}
