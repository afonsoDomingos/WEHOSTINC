import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import UserPresenceModel from '@/lib/models/UserPresence';

let FALLBACK_PRESENCE: any[] = [];
const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutos = "online"

async function tryMongo() {
  try { await connectDB(); return true; }
  catch { return false; }
}

// GET /api/analytics/presence — lista quem está online agora
export async function GET() {
  const cutoff = new Date(Date.now() - ONLINE_THRESHOLD_MS).toISOString();

  try {
    if (await tryMongo()) {
      const allPresence = await UserPresenceModel.find({}).sort({ lastSeen: -1 }).lean();
      const online = allPresence.filter((p: any) => p.lastSeen >= cutoff);
      const recent = allPresence.slice(0, 50); // últimas 50 sessões

      return NextResponse.json({ online, recent, onlineCount: online.length });
    }
  } catch (e) { console.error('MongoDB error (analytics/presence):', e); }

  const online = FALLBACK_PRESENCE.filter(p => p.lastSeen >= cutoff);
  return NextResponse.json({ online, recent: FALLBACK_PRESENCE.slice(0, 50), onlineCount: online.length });
}

// POST /api/analytics/presence — actualizar presença de um utilizador
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userEmail, userName, currentPage, sessionId } = body;

    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail é obrigatório' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const presenceData = {
      userEmail: userEmail.toLowerCase().trim(),
      userName: userName || userEmail,
      lastSeen: now,
      currentPage: currentPage || '/',
      sessionId: sessionId || '',
      isOnline: true,
    };

    if (await tryMongo()) {
      await UserPresenceModel.findOneAndUpdate(
        { userEmail: presenceData.userEmail },
        presenceData,
        { upsert: true, new: true }
      );
      return NextResponse.json({ success: true });
    }

    // Fallback
    const idx = FALLBACK_PRESENCE.findIndex(p => p.userEmail === presenceData.userEmail);
    if (idx >= 0) {
      FALLBACK_PRESENCE[idx] = presenceData;
    } else {
      FALLBACK_PRESENCE.unshift(presenceData);
    }
    return NextResponse.json({ success: true });

  } catch (e) {
    return NextResponse.json({ error: 'Erro ao actualizar presença' }, { status: 500 });
  }
}
