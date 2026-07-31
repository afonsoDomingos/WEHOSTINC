import { Resend } from 'resend';
import { SITE_URL } from '@/lib/siteConfig';

// Remetente padrão da plataforma
export const DEFAULT_FROM = process.env.EMAIL_USER || 'karinganastudio23@gmail.com';
export const DEFAULT_FROM_NAME = 'WEHOSTHERE';

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  try {
    return new Resend(apiKey);
  } catch (err) {
    console.warn('[Resend] Erro ao instanciar cliente:', err);
    return null;
  }
};

export interface SendEmailOptions {
  to: string;
  fromEmail?: string;
  fromName?: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Envia um e-mail via Resend.
 * Requer RESEND_API_KEY no .env.local.
 */
export async function sendEmail(opts: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  const resend = getResendClient();
  if (!resend) {
    console.warn('[Resend] RESEND_API_KEY não configurado ou inválido. E-mail não enviado.');
    return { success: false, error: 'RESEND_API_KEY não configurado no servidor.' };
  }

  const fromName = opts.fromName || DEFAULT_FROM_NAME;
  const fromEmail = opts.fromEmail || DEFAULT_FROM;
  const fromFormatted = `${fromName} <${fromEmail}>`;

  try {
    const bodyHtml = opts.html || (opts.text ? opts.text.replace(/\n/g, '<br>') : '<p></p>');
    const bodyText = opts.text || '';

    const { error } = await resend.emails.send({
      from: fromFormatted,
      to: [opts.to],
      subject: opts.subject,
      html: bodyHtml,
      text: bodyText,
    });

    if (error) {
      console.error('[Resend] ❌ Erro:', error);
      return { success: false, error: error.message };
    }

    console.log(`[Resend] ✅ E-mail enviado para: ${opts.to} | Assunto: ${opts.subject}`);
    return { success: true };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[Resend] ❌ Exceção:', errMsg);
    return { success: false, error: errMsg };
  }
}

// ——————————————————————————————————————
// Templates de E-mails Transacionais
// ——————————————————————————————————————

/** E-mail de boas-vindas enviado após registo */
export async function sendWelcomeEmail(toEmail: string, userName: string, plan: string) {
  const planNames: Record<string, string> = {
    basic: 'Básico',
    pro: 'Profissional',
    enterprise: 'Empresarial',
  };

  return sendEmail({
    to: toEmail,
    subject: `✅ Bem-vindo à WEHOSTHERE, ${userName}!`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
        <div style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);padding:40px 32px;border-radius:16px 16px 0 0;text-align:center;">
          <h1 style="color:white;margin:0;font-size:28px;font-weight:800;">WEHOSTHERE</h1>
          <p style="color:#bfdbfe;margin:8px 0 0;font-size:14px;">Plataforma de Hospedagem Profissional</p>
        </div>
        <div style="background:#f8fafc;padding:40px 32px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;">
          <h2 style="color:#1e3a8a;font-size:22px;margin-top:0;">👋 Bem-vindo, ${userName}!</h2>
          <p style="color:#475569;line-height:1.7;">A sua conta foi criada com sucesso. Plano: <strong>${planNames[plan] || plan}</strong>.</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${SITE_URL}/dashboard" style="background:#2563eb;color:white;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:15px;">Aceder ao Painel →</a>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin:0;">Equipa WEHOSTHERE — Hospedagem Profissional em Moçambique</p>
        </div>
      </div>`,
  });
}

/** Confirmação de pagamento / fatura */
export async function sendInvoiceEmail(toEmail: string, userName: string, invoiceRef: string, amount: string, plan: string) {
  return sendEmail({
    to: toEmail,
    subject: `🧾 Pagamento Confirmado — Fatura ${invoiceRef} | WEHOSTHERE`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
        <div style="background:linear-gradient(135deg,#059669,#10b981);padding:40px 32px;border-radius:16px 16px 0 0;text-align:center;">
          <h1 style="color:white;margin:0;font-size:26px;font-weight:800;">✅ Pagamento Confirmado</h1>
          <p style="color:#d1fae5;margin:8px 0 0;font-size:13px;">WEHOSTHERE — Fatura ${invoiceRef}</p>
        </div>
        <div style="background:#f8fafc;padding:40px 32px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;">
          <p>Olá <strong>${userName}</strong>, o seu pagamento foi confirmado.</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <tr style="background:#eff6ff;"><td style="padding:12px;font-weight:700;color:#1e3a8a;">Plano</td><td style="padding:12px;">${plan}</td></tr>
            <tr><td style="padding:12px;font-weight:700;color:#1e3a8a;">Valor</td><td style="padding:12px;">${amount}</td></tr>
            <tr style="background:#eff6ff;"><td style="padding:12px;font-weight:700;color:#1e3a8a;">Referência</td><td style="padding:12px;">${invoiceRef}</td></tr>
          </table>
          <div style="text-align:center;margin:24px 0;">
            <a href="${SITE_URL}/dashboard/billing" style="background:#2563eb;color:white;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:15px;">Ver Faturamento →</a>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin:0;">WEHOSTHERE — info@wehosthere.com</p>
        </div>
      </div>`,
  });
}

/** E-mail enviado do Webmail corporativo */
export async function sendWebmailMessage(fromEmail: string, toEmail: string, subject: string, body: string) {
  return sendEmail({
    to: toEmail,
    fromEmail: DEFAULT_FROM,
    fromName: `${fromEmail} via WEHOSTHERE Webmail`,
    subject,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
        <div style="background:#1e3a8a;padding:16px 24px;">
          <span style="color:#93c5fd;font-size:13px;font-weight:600;">✉️ Mensagem enviada via WEHOSTHERE Webmail</span>
        </div>
        <div style="padding:32px 24px;">
          <p style="margin:0 0 6px;color:#64748b;font-size:12px;"><strong>De:</strong> ${fromEmail}</p>
          <p style="margin:0 0 24px;color:#64748b;font-size:12px;"><strong>Para:</strong> ${toEmail}</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin-bottom:24px;">
          <div style="white-space:pre-line;line-height:1.8;color:#1e293b;font-size:15px;">${body}</div>
        </div>
        <div style="background:#f1f5f9;padding:14px 24px;font-size:11px;color:#94a3b8;">
          Enviado via WEHOSTHERE Webmail Corporativo — ${SITE_URL.replace('https://', '')}
        </div>
      </div>`,
  });
}

/** Ticket de Suporte criado */
export async function sendSupportTicketEmail(toEmail: string, userName: string, ticketId: string, subject: string) {
  return sendEmail({
    to: toEmail,
    subject: `🎫 Ticket de Suporte Aberto — #${ticketId} | WEHOSTHERE`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:40px 32px;border-radius:16px 16px 0 0;text-align:center;">
          <h1 style="color:white;margin:0;font-size:24px;font-weight:800;">🎫 Ticket de Suporte</h1>
          <p style="color:#ede9fe;margin:8px 0 0;font-size:13px;">#${ticketId}</p>
        </div>
        <div style="background:#f8fafc;padding:40px 32px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;">
          <p>Olá <strong>${userName}</strong>, o seu pedido foi registado:</p>
          <div style="background:#f3f0ff;border-left:4px solid #7c3aed;padding:16px;border-radius:8px;margin:16px 0;">
            <p style="margin:0;font-weight:700;color:#5b21b6;">${subject}</p>
          </div>
          <div style="text-align:center;margin:24px 0;">
            <a href="${SITE_URL}/dashboard/tickets" style="background:#7c3aed;color:white;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:15px;">Ver Ticket →</a>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin:0;">WEHOSTHERE — info@wehosthere.com</p>
        </div>
      </div>`,
  });
}
