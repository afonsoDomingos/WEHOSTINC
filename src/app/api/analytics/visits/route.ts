import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import AnalyticsVisitModel from '@/lib/models/AnalyticsVisit';

let FALLBACK_VISITS: any[] = [];

async function tryMongo() {
  try { await connectDB(); return true; }
  catch { return false; }
}

// GET /api/analytics/visits — para o admin ver estatísticas
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'month'; // today | week | month | all

  try {
    if (await tryMongo()) {
      const now = new Date();
      let since: Date | null = null;

      if (period === 'today') {
        since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (period === 'week') {
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (period === 'month') {
        since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      // If period === 'all', since is null (fetch all history from MongoDB)

      const query = since ? { timestamp: { $gte: since.toISOString() } } : {};
      
      // Contagem exata total no MongoDB Atlas
      const totalCount = await AnalyticsVisitModel.countDocuments(query);
      const visits = await AnalyticsVisitModel.find(query).sort({ timestamp: -1 }).limit(1000).lean();

      // Sessões únicas
      const uniqueSessions = new Set(visits.map((v: any) => v.sessionId)).size;
      const uniquePages = visits.reduce((acc: Record<string, number>, v: any) => {
        acc[v.page] = (acc[v.page] || 0) + 1;
        return acc;
      }, {});

      return NextResponse.json({
        total: totalCount || visits.length,
        uniqueVisitors: uniqueSessions,
        visits: visits.slice(0, 100),
        topPages: Object.entries(uniquePages)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .slice(0, 5)
          .map(([page, count]) => ({ page, count })),
      });
    }
  } catch (e) { console.error('MongoDB error (analytics/visits):', e); }

  const fallbackSessions = new Set(FALLBACK_VISITS.map(v => v.sessionId)).size;
  return NextResponse.json({
    total: FALLBACK_VISITS.length,
    uniqueVisitors: fallbackSessions,
    visits: FALLBACK_VISITS.slice(0, 100),
    topPages: []
  });
}

// POST /api/analytics/visits — registar uma visita
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { page, sessionId, userEmail, referrer } = body;

    if (!page || !sessionId) {
      return NextResponse.json({ error: 'page e sessionId são obrigatórios' }, { status: 400 });
    }

    // Obter IP do cabeçalho
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || '';
    const now = new Date().toISOString();

    const visitData = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 8),
      page,
      ip,
      userAgent,
      country: 'MZ',
      referrer: referrer || '',
      userEmail: userEmail || '',
      sessionId,
      timestamp: now,
    };

    try {
      await connectDB();
      await AnalyticsVisitModel.create(visitData);
      return NextResponse.json({ success: true });
    } catch (dbErr) {
      console.error('Erro ao guardar visita no Mongo, guardando em fallback:', dbErr);
      FALLBACK_VISITS.unshift(visitData);
      if (FALLBACK_VISITS.length > 500) FALLBACK_VISITS = FALLBACK_VISITS.slice(0, 500);
      return NextResponse.json({ success: true });
    }

  } catch (e) {
    return NextResponse.json({ error: 'Erro ao registar visita' }, { status: 500 });
  }
}
