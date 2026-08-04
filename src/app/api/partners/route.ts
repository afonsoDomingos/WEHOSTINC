import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import PartnerModel from '@/lib/models/Partner';

const DEFAULT_PARTNERS = [
  {
    id: 'PART-1001',
    name: 'Restartmedia',
    logoUrl: '/logo.png',
    websiteUrl: '',
    order: 1,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'PART-1002',
    name: 'Inscreva-se',
    logoUrl: '/logo.png',
    websiteUrl: 'https://inscreva-se.com/',
    order: 2,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

let FALLBACK_PARTNERS: any[] = [...DEFAULT_PARTNERS];

async function tryMongo() {
  try {
    await connectDB();
    return true;
  } catch (err) {
    console.warn('MongoDB connection issue (partners):', err);
    return false;
  }
}

export async function GET() {
  try {
    if (await tryMongo()) {
      let partners = await PartnerModel.find({}).sort({ order: 1 }).lean();
      if (!partners || partners.length === 0) {
        if (FALLBACK_PARTNERS.length > 0) {
          try {
            await PartnerModel.insertMany(FALLBACK_PARTNERS);
            partners = await PartnerModel.find({}).sort({ order: 1 }).lean();
          } catch (e) {
            console.error('Erro ao inserir parceiros default no MongoDB:', e);
          }
        }
      }
      if (partners && partners.length > 0) {
        FALLBACK_PARTNERS = partners;
        return NextResponse.json({ partners });
      }
    }
  } catch (e) {
    console.error('MongoDB indisponível (partners):', e);
  }
  return NextResponse.json({ partners: FALLBACK_PARTNERS });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, partner, partnerId, updates, partners } = body;
    const useMongo = await tryMongo();

    if (action === 'sync_all' && Array.isArray(partners)) {
      if (useMongo) {
        for (const p of partners) {
          if (!p.id) continue;
          await PartnerModel.findOneAndUpdate({ id: p.id }, p, { upsert: true, new: true });
        }
        const updated = await PartnerModel.find({}).sort({ order: 1 }).lean();
        FALLBACK_PARTNERS = updated;
        return NextResponse.json({ success: true, partners: updated });
      }
      const map = new Map<string, any>();
      FALLBACK_PARTNERS.forEach(p => map.set(p.id, p));
      partners.forEach((p: any) => map.set(p.id, { ...map.get(p.id), ...p }));
      FALLBACK_PARTNERS = Array.from(map.values()).sort((a, b) => a.order - b.order);
      return NextResponse.json({ success: true, partners: FALLBACK_PARTNERS });
    }

    if (action === 'create' && partner) {
      if (useMongo) {
        await PartnerModel.findOneAndUpdate({ id: partner.id }, partner, { upsert: true, new: true });
        const updated = await PartnerModel.find({}).sort({ order: 1 }).lean();
        FALLBACK_PARTNERS = updated;
        return NextResponse.json({ success: true, partner, partners: updated });
      }
      const idx = FALLBACK_PARTNERS.findIndex(p => p.id === partner.id);
      if (idx >= 0) FALLBACK_PARTNERS[idx] = partner;
      else FALLBACK_PARTNERS.push(partner);
      FALLBACK_PARTNERS.sort((a, b) => a.order - b.order);
      return NextResponse.json({ success: true, partner, partners: FALLBACK_PARTNERS });
    }

    if (action === 'update') {
      const targetId = partnerId || partner?.id;
      const patchData = updates || partner;
      if (!targetId) return NextResponse.json({ error: 'ID do parceiro não fornecido' }, { status: 400 });

      if (useMongo) {
        await PartnerModel.findOneAndUpdate({ id: targetId }, { $set: patchData }, { new: true });
        const updated = await PartnerModel.find({}).sort({ order: 1 }).lean();
        FALLBACK_PARTNERS = updated;
        return NextResponse.json({ success: true, partners: updated });
      }
      FALLBACK_PARTNERS = FALLBACK_PARTNERS.map(p => p.id === targetId ? { ...p, ...patchData } : p);
      FALLBACK_PARTNERS.sort((a, b) => a.order - b.order);
      return NextResponse.json({ success: true, partners: FALLBACK_PARTNERS });
    }

    if (action === 'delete') {
      const targetId = partnerId || partner?.id;
      if (!targetId) return NextResponse.json({ error: 'ID do parceiro não fornecido' }, { status: 400 });

      if (useMongo) {
        await PartnerModel.deleteOne({ id: targetId });
        const updated = await PartnerModel.find({}).sort({ order: 1 }).lean();
        FALLBACK_PARTNERS = updated;
        return NextResponse.json({ success: true, partners: updated });
      }
      FALLBACK_PARTNERS = FALLBACK_PARTNERS.filter(p => p.id !== targetId);
      return NextResponse.json({ success: true, partners: FALLBACK_PARTNERS });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('Erro na API de Parceiros:', error);
    return NextResponse.json({ error: 'Erro ao processar parceiros' }, { status: 500 });
  }
}
