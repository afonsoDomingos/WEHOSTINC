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

    const baseCondition: any = {
      domain: { $regex: '^[a-z0-9]', $options: 'i' },
    };

    const query: any = { ...baseCondition };

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
      DomainSearchLog.countDocuments(baseCondition),
      DomainSearchLog.countDocuments({ ...baseCondition, isAvailable: true }),
      DomainSearchLog.countDocuments({ ...baseCondition, isAvailable: false }),
      DomainSearchLog.countDocuments({ ...baseCondition, hasCheckoutAttempt: true }),
      DomainSearchLog.find(baseCondition)
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

import { addAdminNotification } from '@/lib/notifications';
import { sendDomainLeadAlertEmail, DomainLeadAlertData } from '@/lib/sendgrid';

/**
 * Dispara notificações (email + painel admin) para lead de checkout em background
 */
function fireLeadNotificationsAsync(data: DomainLeadAlertData) {
  (async () => {
    try {
      // 1. Notificação no painel administrativo
      try {
        await addAdminNotification({
          title: `🔥 Lead Quente: Tentativa de Compra (${data.domain})`,
          message: `${data.userName || 'Cliente'} (${data.userPhone || data.userEmail || 'Contacto não informado'}) iniciou o checkout do domínio "${data.domain}".`,
          type: 'order_new',
          link: '/admin/domain-search-logs?filter=checkout',
          userEmail: data.userEmail || undefined,
          metadata: {
            domain: data.domain,
            userName: data.userName,
            userPhone: data.userPhone,
            checkoutOrderId: data.checkoutOrderId,
            checkoutStatus: data.checkoutStatus,
          },
        });
      } catch (notifErr) {
        console.warn('[DomainLead] Falha na notificação admin interna:', notifErr);
      }

      // 2. Coletar emails dos administradores
      const recipientEmails = new Set<string>();
      try {
        const UserModel = (await import('@/lib/models/User')).default;
        const adminUsers = await UserModel.find(
          { role: { $in: ['admin', 'super_admin'] }, status: { $ne: 'suspended' } },
          { email: 1 }
        ).lean();
        adminUsers.forEach((u: any) => {
          if (u.email && typeof u.email === 'string') {
            recipientEmails.add(u.email.toLowerCase().trim());
          }
        });
      } catch {}

      if (process.env.ADMIN_EMAIL) recipientEmails.add(process.env.ADMIN_EMAIL.toLowerCase().trim());
      if (process.env.EMAIL_USER?.includes('@')) recipientEmails.add(process.env.EMAIL_USER.toLowerCase().trim());
      if (recipientEmails.size === 0) recipientEmails.add('info@wehosthere.com');

      // 3. Enviar e-mail de alerta de lead
      await Promise.allSettled(
        Array.from(recipientEmails).map(adminEmail =>
          sendDomainLeadAlertEmail(adminEmail, data)
        )
      );
    } catch (err) {
      console.warn('[DomainLead] Falha ao enviar notificações de lead:', err);
    }
  })();
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

    const cleanDomain = String(domain).trim().toLowerCase();
    const parts = cleanDomain.split('.');
    const sld = parts[0];
    const extension = '.' + parts.slice(1).join('.');

    const updated = await DomainSearchLog.findOneAndUpdate(
      { domain: cleanDomain },
      {
        $set: {
          userName: userName ? String(userName).trim() : undefined,
          userEmail: userEmail ? String(userEmail).trim().toLowerCase() : undefined,
          userPhone: userPhone ? String(userPhone).trim() : undefined,
          hasCheckoutAttempt: true,
          checkoutStatus: checkoutStatus || 'pending',
          checkoutOrderId: checkoutOrderId || undefined,
          lastSearchedAt: new Date(),
        },
        $setOnInsert: {
          domain: cleanDomain,
          sld,
          extension,
          isAvailable: true,
          searchCount: 1,
          firstSearchedAt: new Date(),
        }
      },
      { new: true, upsert: true }
    );

    // Disparar notificações de lead apenas quando for tentativa inicial/pendente
    if (checkoutStatus !== 'completed') {
      fireLeadNotificationsAsync({
        domain: cleanDomain,
        userName: userName ? String(userName).trim() : undefined,
        userEmail: userEmail ? String(userEmail).trim().toLowerCase() : undefined,
        userPhone: userPhone ? String(userPhone).trim() : undefined,
        checkoutStatus: checkoutStatus || 'pending',
        checkoutOrderId: checkoutOrderId || undefined,
        attemptedAt: new Date(),
      });
    }

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
