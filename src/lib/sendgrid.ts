import sgMail from '@sendgrid/mail';

// Inicializa o SDK com a chave da API (obrigatório definir SENDGRID_API_KEY no .env.local)
const API_KEY = process.env.SENDGRID_API_KEY || '';
if (API_KEY) {
  sgMail.setApiKey(API_KEY);
}

// Remetente padrão da plataforma
export const DEFAULT_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@wehosthere.com';
export const DEFAULT_FROM_NAME = 'WEHOSTHERE';

export interface SendEmailOptions {
  to: string;
  fromEmail?: string;
  fromName?: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Envia um e-mail via SendGrid.
 * Requer SENDGRID_API_KEY e SENDGRID_FROM_EMAIL no .env.local.
 */
export async function sendEmail(opts: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!API_KEY) {
    console.warn('[SendGrid] SENDGRID_API_KEY não configurado. E-mail não enviado.');
    return { success: false, error: 'SENDGRID_API_KEY não configurado no servidor.' };
  }

  const fromEmail = opts.fromEmail || DEFAULT_FROM_EMAIL;
  const fromName = opts.fromName || DEFAULT_FROM_NAME;

  const msg = {
    to: opts.to,
    from: { email: fromEmail, name: fromName },
    subject: opts.subject,
    text: opts.text || '',
    html: opts.html || opts.text?.replace(/\n/g, '<br>') || '',
  };

  try {
    await sgMail.send(msg);
    console.log(`[SendGrid] ✅ E-mail enviado para: ${opts.to} | Assunto: ${opts.subject}`);
    return { success: true };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[SendGrid] ❌ Erro ao enviar e-mail:', errMsg);
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
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
        <div style="background: linear-gradient(135deg, #1d4ed8, #3b82f6); padding: 40px 32px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800;">WEHOSTHERE</h1>
          <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">Plataforma de Hospedagem Profissional</p>
        </div>
        <div style="background: #f8fafc; padding: 40px 32px; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e3a8a; font-size: 22px; margin-top: 0;">👋 Bem-vindo, ${userName}!</h2>
          <p style="color: #475569; line-height: 1.7;">A sua conta foi criada com sucesso. Plano contratado: <strong>${planNames[plan] || plan}</strong>.</p>
          <p style="color: #475569; line-height: 1.7;">Aceda ao seu painel de controlo para gerir os seus sites, emails e serviços:</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="https://wehosthere.com/dashboard" style="background: #2563eb; color: white; font-weight: 700; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-size: 15px;">Aceder ao Painel →</a>
          </div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">Equipa WEHOSTHERE — Hospedagem Profissional em Moçambique</p>
        </div>
      </div>
    `,
  });
}

/** E-mail de confirmação de pagamento / fatura */
export async function sendInvoiceEmail(toEmail: string, userName: string, invoiceRef: string, amount: string, plan: string) {
  return sendEmail({
    to: toEmail,
    subject: `🧾 Pagamento Confirmado — Fatura ${invoiceRef} | WEHOSTHERE`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
        <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 40px 32px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 800;">✅ Pagamento Confirmado</h1>
          <p style="color: #d1fae5; margin: 8px 0 0; font-size: 13px;">WEHOSTHERE — Fatura ${invoiceRef}</p>
        </div>
        <div style="background: #f8fafc; padding: 40px 32px; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0;">
          <p style="color: #475569;">Olá <strong>${userName}</strong>, o seu pagamento foi recebido com sucesso.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #eff6ff;">
              <td style="padding: 12px; font-weight: 700; color: #1e3a8a; border-radius: 8px 0 0 8px;">Plano</td>
              <td style="padding: 12px; color: #111; font-weight: 600;">${plan}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: 700; color: #1e3a8a;">Valor Pago</td>
              <td style="padding: 12px; color: #111; font-weight: 600;">${amount}</td>
            </tr>
            <tr style="background: #eff6ff;">
              <td style="padding: 12px; font-weight: 700; color: #1e3a8a; border-radius: 0 0 0 8px;">Referência</td>
              <td style="padding: 12px; color: #111; font-weight: 600;">${invoiceRef}</td>
            </tr>
          </table>
          <div style="text-align: center; margin: 24px 0;">
            <a href="https://wehosthere.com/dashboard/billing" style="background: #2563eb; color: white; font-weight: 700; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-size: 15px;">Ver Faturamento →</a>
          </div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">Equipa WEHOSTHERE — suporte@wehosthere.com</p>
        </div>
      </div>
    `,
  });
}

/** E-mail enviado do Webmail corporativo (de cliente@dominio.com para qualquer destinatário) */
export async function sendWebmailMessage(fromEmail: string, toEmail: string, subject: string, body: string) {
  return sendEmail({
    to: toEmail,
    fromEmail: DEFAULT_FROM_EMAIL, // SendGrid exige remetente verificado
    fromName: `${fromEmail} via WEHOSTHERE Webmail`,
    subject,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: #1e3a8a; padding: 16px 24px; display: flex; align-items: center; gap: 12px;">
          <span style="color: #93c5fd; font-size: 13px; font-weight: 600;">✉️ Mensagem enviada via WEHOSTHERE Webmail</span>
        </div>
        <div style="padding: 32px 24px;">
          <p style="margin: 0 0 8px; color: #64748b; font-size: 12px;"><strong>De:</strong> ${fromEmail}</p>
          <p style="margin: 0 0 24px; color: #64748b; font-size: 12px;"><strong>Para:</strong> ${toEmail}</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin-bottom: 24px;">
          <div style="white-space: pre-line; line-height: 1.8; color: #1e293b; font-size: 15px;">${body}</div>
        </div>
        <div style="background: #f1f5f9; padding: 16px 24px; font-size: 11px; color: #94a3b8;">
          Esta mensagem foi enviada através do serviço de Webmail Corporativo WEHOSTHERE — wehosthere.com
        </div>
      </div>
    `,
  });
}

/** E-mail de suporte / ticket criado */
export async function sendSupportTicketEmail(toEmail: string, userName: string, ticketId: string, subject: string) {
  return sendEmail({
    to: toEmail,
    subject: `🎫 Ticket de Suporte Aberto — #${ticketId} | WEHOSTHERE`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
        <div style="background: linear-gradient(135deg, #7c3aed, #6d28d9); padding: 40px 32px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">🎫 Ticket de Suporte</h1>
          <p style="color: #ede9fe; margin: 8px 0 0; font-size: 13px;">Referência: #${ticketId}</p>
        </div>
        <div style="background: #f8fafc; padding: 40px 32px; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0;">
          <p>Olá <strong>${userName}</strong>,</p>
          <p style="color: #475569;">O seu pedido de suporte foi registado com sucesso:</p>
          <div style="background: #f3f0ff; border-left: 4px solid #7c3aed; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0; font-weight: 700; color: #5b21b6;">${subject}</p>
          </div>
          <p style="color: #475569;">A nossa equipa irá responder em breve. Pode acompanhar o estado do ticket no painel.</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="https://wehosthere.com/dashboard/tickets" style="background: #7c3aed; color: white; font-weight: 700; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-size: 15px;">Ver Ticket →</a>
          </div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">Equipa WEHOSTHERE — suporte@wehosthere.com</p>
        </div>
      </div>
    `,
  });
}
