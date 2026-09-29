import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { SiteQuoteLead } from '@/models/SiteQuoteLead';
import { addAdminNotification } from '@/lib/notifications';
import { sendSiteQuoteAlertEmail } from '@/lib/sendgrid';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const {
      projectName,
      projectType,
      basePrice,
      domain,
      userName,
      userEmail,
      userPhone,
      channel = 'whatsapp_quote',
      notes,
    } = body;

    if (!projectName) {
      return NextResponse.json({ error: 'Nome do projeto é obrigatório' }, { status: 400 });
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = req.headers.get('user-agent') || '';

    // Create lead in MongoDB
    const lead = await SiteQuoteLead.create({
      projectName,
      projectType: projectType || 'generic',
      basePrice: Number(basePrice) || 0,
      domain: domain ? domain.trim().toLowerCase() : undefined,
      userName: userName ? userName.trim() : undefined,
      userEmail: userEmail ? userEmail.trim().toLowerCase() : undefined,
      userPhone: userPhone ? userPhone.trim() : undefined,
      channel,
      status: channel === 'checkout_completed' ? 'closed' : 'new',
      ip,
      userAgent,
      notes,
    });

    const priceText = lead.basePrice >= 100000 ? 'Sob orçamento' : `${lead.basePrice.toLocaleString('pt-MZ')} MT`;
    const channelDesc =
      channel === 'checkout_completed'
        ? 'pagamento aprovado no checkout'
        : channel === 'checkout_started'
        ? 'iniciou o checkout'
        : 'clicou para cotação no WhatsApp';

    // Disparar notificações em background sem bloquear a resposta da requisição
    (async () => {
      try {
        // 1. Notificação interna no painel Admin
        await addAdminNotification({
          title: `🚀 Novo Lead: Criação de Site (${lead.projectName})`,
          message: `${lead.userName || 'Cliente'} (${lead.userPhone || lead.userEmail || 'Visitante'}) ${channelDesc} para "${lead.projectName}" (${priceText}).`,
          type: 'order_new',
          link: '/admin/site-quotes',
          userEmail: lead.userEmail || undefined,
          metadata: {
            leadId: String(lead._id),
            projectName: lead.projectName,
            basePrice: lead.basePrice,
            domain: lead.domain,
            channel: lead.channel,
          },
        });
      } catch (err) {
        console.warn('[SiteQuotes] Falha ao registrar notificação admin interna:', err);
      }

      try {
        // 2. Notificação por e-mail para o Administrador
        const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'info@wehosthere.com';
        await sendSiteQuoteAlertEmail(adminEmail, {
          projectName: lead.projectName,
          projectType: lead.projectType,
          basePrice: lead.basePrice,
          domain: lead.domain,
          userName: lead.userName,
          userEmail: lead.userEmail,
          userPhone: lead.userPhone,
          channel: lead.channel,
          createdAt: lead.createdAt || new Date(),
        });
      } catch (err) {
        console.warn('[SiteQuotes] Falha ao enviar email de alerta admin:', err);
      }
    })().catch((err) => console.error('[SiteQuotes] Erro background notifications:', err));

    return NextResponse.json({
      success: true,
      leadId: lead._id,
      message: 'Cotação de site registada com sucesso.',
    });
  } catch (error: any) {
    console.error('[SiteQuotes] Erro ao registrar cotação:', error);
    return NextResponse.json({ error: 'Erro ao registar cotação' }, { status: 500 });
  }
}
