import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { DomainSearchLog } from '@/models/DomainSearchLog';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'));
    const filter = searchParams.get('filter') || 'all'; // all | available | taken | checkout
    const sortBy = searchParams.get('sortBy') || 'lastSearchedAt'; // lastSearchedAt | searchCount | domain
    const q = (searchParams.get('q') || '').trim().toLowerCase();

    const query: any = {};

    if (filter === 'available') query.isAvailable = true;
    if (filter === 'taken') query.isAvailable = false;
    if (filter === 'checkout') query.hasCheckoutAttempt = true;
    if (q) {
      query.$or = [
        { domain: { $regex: q, $options: 'i' } },
        { userEmail: { $regex: q, $options: 'i' } },
        { userName: { $regex: q, $options: 'i' } },
        { userPhone: { $regex: q, $options: 'i' } },
        { ip: { $regex: q, $options: 'i' } },
      ];
    }

    const sortOrder: any = { [sortBy]: -1 };
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      DomainSearchLog.find(query)
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .lean(),
      DomainSearchLog.countDocuments(query),
    ]);

    // Estatísticas gerais
    const [totalSearches, totalAvailable, totalTaken, totalCheckoutLeads, topSearched] = await Promise.all([
      DomainSearchLog.countDocuments(),
      DomainSearchLog.countDocuments({ isAvailable: true }),
      DomainSearchLog.countDocuments({ isAvailable: false }),
      DomainSearchLog.countDocuments({ hasCheckoutAttempt: true }),
      DomainSearchLog.find()
        .sort({ searchCount: -1 })
        .limit(5)
        .lean(),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalSearches,
        totalAvailable,
        totalTaken,
        totalCheckoutLeads,
        topSearched,
      },
    });
  } catch (err: any) {
    console.error('[AdminDomainSearchLogs] Erro:', err);
    return NextResponse.json({ error: 'Erro ao carregar logs de pesquisa.' }, { status: 500 });
  }
}

/**
 * POST — Registrar ou atualizar tentativa de checkout para um domínio pesquisado
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { domain, userName, userEmail, userPhone, checkoutStatus, checkoutOrderId } = body;

    if (!domain) {
      return NextResponse.json({ error: 'Domínio é obrigatório.' }, { status: 400 });
    }

    const updated = await DomainSearchLog.findOneAndUpdate(
      { domain: domain.trim().toLowerCase() },
      {
        $set: {
          userName: userName || undefined,
          userEmail: userEmail ? userEmail.trim().toLowerCase() : undefined,
          userPhone: userPhone ? userPhone.trim() : undefined,
          hasCheckoutAttempt: true,
          checkoutStatus: checkoutStatus || 'pending',
          checkoutOrderId: checkoutOrderId || undefined,
          lastSearchedAt: new Date()
        }
      },
      { new: true }
    );

    return NextResponse.json({ success: true, log: updated });
  } catch (err: any) {
    console.error('[AdminDomainSearchLogs] Erro ao registrar lead de checkout:', err);
    return NextResponse.json({ error: 'Erro interno ao registrar lead.' }, { status: 500 });
  }
}

/**
 * DELETE — Limpar todos os logs (apenas admin)
 */
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const result = await DomainSearchLog.deleteMany({});
    return NextResponse.json({ deleted: result.deletedCount });
  } catch (err: any) {
    console.error('[AdminDomainSearchLogs] Erro ao apagar logs:', err);
    return NextResponse.json({ error: 'Erro ao apagar logs.' }, { status: 500 });
  }
}
