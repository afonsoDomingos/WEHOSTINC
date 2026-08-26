import { SITE_URL } from '@/lib/siteConfig';

// Remetente padrão da plataforma
export const DEFAULT_FROM = process.env.EMAIL_USER || 'info@wehosthere.com';
export const DEFAULT_FROM_NAME = 'WEHOSTHERE';

export interface SendEmailOptions {
  to: string;
  fromEmail?: string;
  fromName?: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: { filename: string; content: string }[];
}

/**
 * Envia um e-mail via Resend API (HTTP direct call).
 * Requer RESEND_API_KEY no .env.local / variáveis de ambiente.
 */
export async function sendEmail(opts: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[Resend] RESEND_API_KEY não configurado ou inválido. E-mail não enviado.');
    return { success: false, error: 'RESEND_API_KEY não configurado no servidor.' };
  }

  const fromName = opts.fromName || DEFAULT_FROM_NAME;
  const fromEmail = opts.fromEmail || DEFAULT_FROM;
  const fromFormatted = `${fromName} <${fromEmail}>`;

  try {
    const bodyHtml = opts.html || (opts.text ? opts.text.replace(/\n/g, '<br>') : '<p></p>');
    const bodyText = opts.text || '';

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromFormatted,
        to: [opts.to],
        subject: opts.subject,
        html: bodyHtml,
        text: bodyText,
        ...(opts.attachments && opts.attachments.length > 0 ? { attachments: opts.attachments } : {})
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data?.message || data?.name || 'Erro ao enviar e-mail via Resend API';
      console.error('[Resend] ❌ Erro API Resend:', errorMsg, data);
      return { success: false, error: errorMsg };
    }

    console.log(`[Resend] ✅ E-mail enviado para: ${opts.to} | ID: ${data.id}`);
    return { success: true };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[Resend] ❌ Exceção ao enviar e-mail:', errMsg);
    return { success: false, error: errMsg };
  }
}

// ——————————————————————————————————————
// Templates de E-mails Transacionais
// ——————————————————————————————————————

/** E-mail de boas-vindas enviado após registo */
export async function sendWelcomeEmail(toEmail: string, userName: string, plan: string, confirmationCode?: string) {
  const planNames: Record<string, string> = {
    basic: 'Básico',
    pro: 'Profissional',
    enterprise: 'Empresarial',
  };

  console.log('[SendGrid] Enviando email de boas-vindas:', { 
    toEmail, 
    userName, 
    plan, 
    hasConfirmationCode: !!confirmationCode,
    codeLength: confirmationCode?.length 
  });

  const confirmPageLink = `${SITE_URL}/confirm-email?email=${encodeURIComponent(toEmail)}`;

  return sendEmail({
    to: toEmail,
    subject: `✅ Confirme sua conta WEHOSTHERE, ${userName}!`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
        <div style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);padding:40px 32px;border-radius:16px 16px 0 0;text-align:center;">
          <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE Logo" style="width:180px;height:auto;margin:0 auto 16px;display:block;" />
          <p style="color:#bfdbfe;margin:8px 0 0;font-size:14px;">Plataforma de Hospedagem Profissional</p>
        </div>
        <div style="background:#f8fafc;padding:40px 32px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;">
          <h2 style="color:#1e3a8a;font-size:22px;margin-top:0;">👋 Bem-vindo, ${userName}!</h2>
          <p style="color:#475569;line-height:1.7;">A sua conta foi criada com sucesso. Plano: <strong>${planNames[plan] || plan}</strong>.</p>
          <p style="color:#475569;line-height:1.7;">Para ativar sua conta, insira o código de 6 dígitos abaixo na página de confirmação:</p>
          <div style="background:#1e3a8a;color:white;font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;padding:20px;border-radius:10px;margin:24px 0;">
            ${confirmationCode || '------'}
          </div>
          <div style="text-align:center;margin:24px 0;">
            <a href="${confirmPageLink}" style="background:#2563eb;color:white;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:15px;display:inline-block;">Ir para página de confirmação →</a>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin:0;">Este código expira em 24 horas. Equipa WEHOSTHERE — Hospedagem Profissional em Moçambique</p>
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
          <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE Logo" style="width:180px;height:auto;margin:0 auto 16px;display:block;" />
          <p style="color:#d1fae5;margin:8px 0 0;font-size:13px;">Fatura ${invoiceRef}</p>
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
        <div style="background:#1e3a8a;padding:24px;text-align:center;">
          <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE Logo" style="width:120px;height:auto;margin:0 auto;display:block;" />
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
          <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE Logo" style="width:180px;height:auto;margin:0 auto 16px;display:block;" />
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

/** Email de recuperação de senha */
export async function sendPasswordResetEmail(toEmail: string, userName: string, resetToken: string) {
  const resetUrl = `${SITE_URL}/reset-password?token=${resetToken}`;
  
  return sendEmail({
    to: toEmail,
    subject: '🔐 Recuperação de Senha — WEHOSTHERE',
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
        <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:40px 32px;border-radius:16px 16px 0 0;text-align:center;">
          <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE Logo" style="width:180px;height:auto;margin:0 auto 16px;display:block;" />
          <p style="color:#fef3c7;margin:8px 0 0;font-size:13px;">Recuperação de Senha</p>
        </div>
        <div style="background:#f8fafc;padding:40px 32px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;">
          <p style="color:#475569;line-height:1.7;">Olá <strong>${userName}</strong>,</p>
          <p style="color:#475569;line-height:1.7;">Recebemos um pedido para redefinir a sua senha. Se não fez este pedido, pode ignorar este email.</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${resetUrl}" style="background:#f59e0b;color:white;font-weight:700;padding:16px 40px;border-radius:10px;text-decoration:none;font-size:16px;display:inline-block;">Redefinir Senha →</a>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin:0;">Este link expira em 1 hora por segurança.</p>
          <p style="color:#94a3b8;font-size:12px;margin:16px 0 0;">Equipa WEHOSTHERE — Hospedagem Profissional em Moçambique</p>
        </div>
      </div>`,
  });
}

/** Email de notificação de exclusão de conta */
export async function sendAccountDeletionEmail(toEmail: string, userName: string, reason?: string) {
  return sendEmail({
    to: toEmail,
    subject: '⚠️ Sua conta WEHOSTHERE foi eliminada',
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
        <div style="background:linear-gradient(135deg,#dc2626,#ef4444);padding:40px 32px;border-radius:16px 16px 0 0;text-align:center;">
          <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE Logo" style="width:180px;height:auto;margin:0 auto 16px;display:block;" />
          <p style="color:#fecaca;margin:8px 0 0;font-size:13px;">Conta Eliminada</p>
        </div>
        <div style="background:#f8fafc;padding:40px 32px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;">
          <p style="color:#475569;line-height:1.7;">Olá <strong>${userName}</strong>,</p>
          <p style="color:#475569;line-height:1.7;">Informamos que a sua conta na plataforma WEHOSTHERE foi eliminada pela administração.</p>
          ${reason ? `
          <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:16px;border-radius:8px;margin:16px 0;">
            <p style="margin:0;font-weight:700;color:#dc2626;">Motivo:</p>
            <p style="margin:8px 0 0;color:#475569;">${reason}</p>
          </div>
          ` : ''}
          <p style="color:#475569;line-height:1.7;">Todos os seus dados, serviços e informações associados a esta conta foram removidos permanentemente.</p>
          <p style="color:#475569;line-height:1.7;">Se acredita que esta ação foi um erro ou tem alguma dúvida, entre em contacto com o nosso suporte:</p>
          <div style="background:#eff6ff;padding:16px;border-radius:8px;margin:16px 0;">
            <p style="margin:0;color:#1e3a8a;font-weight:700;">Email:</p>
            <p style="margin:4px 0 0;color:#475569;">info@wehosthere.com</p>
            <p style="margin:8px 0 0;color:#1e3a8a;font-weight:700;">Telefone Principal:</p>
            <p style="margin:4px 0 0;color:#475569;">+258 84 833 5618</p>
            <p style="margin:8px 0 0;color:#1e3a8a;font-weight:700;">Telefone Secundário:</p>
            <p style="margin:4px 0 0;color:#475569;">+258 84 438 4702</p>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin:16px 0 0;">Equipa WEHOSTHERE — Hospedagem Profissional em Moçambique</p>
        </div>
      </div>`,
  });
}

/** Email de confirmação de ativação de conta */
export async function sendAccountActivatedEmail(toEmail: string, userName: string) {
  const loginUrl = `${SITE_URL}/login`;
  
  return sendEmail({
    to: toEmail,
    subject: '✅ Sua conta WEHOSTHERE foi ativada com sucesso!',
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
        <div style="background:linear-gradient(135deg,#059669,#10b981);padding:40px 32px;border-radius:16px 16px 0 0;text-align:center;">
          <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE Logo" style="width:180px;height:auto;margin:0 auto 16px;display:block;" />
          <p style="color:#d1fae5;margin:8px 0 0;font-size:13px;">Conta Ativada</p>
        </div>
        <div style="background:#f8fafc;padding:40px 32px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;">
          <p style="color:#475569;line-height:1.7;">Parabéns, <strong>${userName}</strong>!</p>
          <p style="color:#475569;line-height:1.7;">A sua conta na plataforma WEHOSTHERE foi ativada com sucesso. Você já pode começar a utilizar todos os nossos serviços.</p>
          <div style="background:#ecfdf5;border-left:4px solid #10b981;padding:16px;border-radius:8px;margin:16px 0;">
            <p style="margin:0;font-weight:700;color:#059669;">O que você pode fazer agora:</p>
            <ul style="margin:8px 0 0;padding-left:20px;color:#475569;">
              <li style="margin:4px 0;">Fazer login na sua conta</li>
              <li style="margin:4px 0;">Acessar o painel de controlo</li>
              <li style="margin:4px 0;">Configurar o seu site</li>
              <li style="margin:4px 0;">Gerenciar seus serviços</li>
            </ul>
          </div>
          <div style="text-align:center;margin:32px 0;">
            <a href="${loginUrl}" style="background:#10b981;color:white;font-weight:700;padding:16px 40px;border-radius:10px;text-decoration:none;font-size:16px;display:inline-block;">Fazer Login Agora →</a>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin:0;">Se tiver alguma dúvida, entre em contacto com o nosso suporte.</p>
          <p style="color:#94a3b8;font-size:12px;margin:16px 0 0;">Equipa WEHOSTHERE — Hospedagem Profissional em Moçambique</p>
        </div>
      </div>`,
  });
}

/** Email de notificação de login */
export async function sendLoginNotificationEmail(toEmail: string, userName: string, loginTime: string, ipAddress?: string, device?: string) {
  const dashboardUrl = `${SITE_URL}/dashboard`;
  
  return sendEmail({
    to: toEmail,
    subject: '🔐 Nova sessão iniciada na sua conta WEHOSTHERE',
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
        <div style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);padding:40px 32px;border-radius:16px 16px 0 0;text-align:center;">
          <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE Logo" style="width:180px;height:auto;margin:0 auto 16px;display:block;" />
          <p style="color:#bfdbfe;margin:8px 0 0;font-size:13px;">Notificação de Login</p>
        </div>
        <div style="background:#f8fafc;padding:40px 32px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;">
          <p style="color:#475569;line-height:1.7;">Olá, <strong>${userName}</strong>!</p>
          <p style="color:#475569;line-height:1.7;">Informamos que uma nova sessão foi iniciada na sua conta WEHOSTHERE.</p>
          
          <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:16px;border-radius:8px;margin:16px 0;">
            <p style="margin:0;font-weight:700;color:#1d4ed8;">Detalhes do login:</p>
            <ul style="margin:8px 0 0;padding-left:20px;color:#475569;">
              <li style="margin:4px 0;"><strong>Data e hora:</strong> ${loginTime}</li>
              ${ipAddress ? `<li style="margin:4px 0;"><strong>Endereço IP:</strong> ${ipAddress}</li>` : ''}
              ${device ? `<li style="margin:4px 0;"><strong>Dispositivo:</strong> ${device}</li>` : ''}
            </ul>
          </div>
          
          <p style="color:#475569;line-height:1.7;margin-top:16px;">Se você reconhece esta atividade, não é necessário tomar nenhuma ação.</p>
          <p style="color:#dc2626;line-height:1.7;margin-top:8px;">Se você não reconhece este login, por favor altere a sua senha imediatamente e entre em contacto com o nosso suporte.</p>
          
          <div style="text-align:center;margin:32px 0;">
            <a href="${dashboardUrl}" style="background:#3b82f6;color:white;font-weight:700;padding:16px 40px;border-radius:10px;text-decoration:none;font-size:16px;display:inline-block;">Acessar Painel →</a>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin:0;">Se tiver alguma dúvida, entre em contacto com o nosso suporte.</p>
          <p style="color:#94a3b8;font-size:12px;margin:16px 0 0;">Equipa WEHOSTHERE — Hospedagem Profissional em Moçambique</p>
        </div>
      </div>`,
  });
}

/** Email de newsletter */
export async function sendNewsletterEmail(toEmail: string, subject: string, content: string, unsubscribeUrl: string) {
  return sendEmail({
    to: toEmail,
    subject: subject,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
        <div style="background:linear-gradient(135deg,#8b5cf6,#6366f1);padding:40px 32px;border-radius:16px 16px 0 0;text-align:center;">
          <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE Logo" style="width:180px;height:auto;margin:0 auto 16px;display:block;" />
          <p style="color:#e9d5ff;margin:8px 0 0;font-size:13px;">Newsletter</p>
        </div>
        <div style="background:#f8fafc;padding:40px 32px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;">
          ${content}
          
          <div style="text-align:center;margin:32px 0;padding-top:24px;border-top:1px solid #e2e8f0;">
            <p style="color:#94a3b8;font-size:12px;margin:0;">
              Recebe este email porque subscreveu à newsletter WEHOSTHERE.
            </p>
            <a href="${unsubscribeUrl}" style="color:#64748b;font-size:12px;text-decoration:underline;margin-top:8px;display:inline-block;">
              Cancelar subscrição
            </a>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin:16px 0 0;">Equipa WEHOSTHERE — Hospedagem Profissional em Moçambique</p>
        </div>
      </div>`,
  });
}

/** Email de inscrição no curso (Boas-vindas à aula de introdução) */
export async function sendCourseEnrollmentEmail(toEmail: string, userName: string, courseTitle: string) {
  const academyUrl = `${SITE_URL}/dashboard/academy`;

  return sendEmail({
    to: toEmail,
    subject: `🎓 Bem-vindo ao curso: ${courseTitle}!`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
        <div style="background:linear-gradient(135deg,#2563eb,#4f46e5);padding:40px 32px;border-radius:16px 16px 0 0;text-align:center;">
          <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE Logo" style="width:180px;height:auto;margin:0 auto 16px;display:block;" />
          <p style="color:#e0e7ff;margin:8px 0 0;font-size:14px;font-weight:600;">Academia Web WEHOSTHERE</p>
        </div>
        <div style="background:#f8fafc;padding:40px 32px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;">
          <p style="color:#334155;font-size:16px;line-height:1.7;">Olá, <strong>${userName}</strong>!</p>
          <p style="color:#334155;font-size:15px;line-height:1.7;">
            A sua inscrição no curso <strong>${courseTitle}</strong> foi confirmada com sucesso!
          </p>
          
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px;margin:24px 0;">
            <p style="margin:0 0 8px;font-weight:800;color:#1d4ed8;font-size:15px;">🎁 O que está disponível para si agora:</p>
            <ul style="margin:0;padding-left:20px;color:#475569;font-size:14px;line-height:1.8;">
              <li>Acesso completo à <strong>Aula 1 (Introdução e Conceitos)</strong> gratuita.</li>
              <li>Estrutura passo a passo e visão geral dos 13 módulos.</li>
              <li>Acesso à comunidade e suporte da plataforma.</li>
            </ul>
          </div>
          
          <div style="text-align:center;margin:32px 0;">
            <a href="${academyUrl}" style="background:linear-gradient(135deg,#2563eb,#4f46e5);color:white;font-weight:700;padding:16px 36px;border-radius:10px;text-decoration:none;font-size:15px;display:inline-block;box-shadow:0 4px 12px rgba(37,99,235,0.25);">Começar a Assistir Agora →</a>
          </div>
          
          <p style="color:#94a3b8;font-size:12px;margin:24px 0 0;text-align:center;">Equipa WEHOSTHERE — Academia de Desenvolvimento Web</p>
        </div>
      </div>`,
  });
}

/** Email de confirmação de pagamento do curso completo */
export async function sendCoursePurchaseEmail(toEmail: string, userName: string, courseTitle: string, amount: number = 500) {
  const academyUrl = `${SITE_URL}/dashboard/academy`;

  return sendEmail({
    to: toEmail,
    subject: `🎉 Acesso Completo Liberado: ${courseTitle}!`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
        <div style="background:linear-gradient(135deg,#059669,#10b981);padding:40px 32px;border-radius:16px 16px 0 0;text-align:center;">
          <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE Logo" style="width:180px;height:auto;margin:0 auto 16px;display:block;" />
          <p style="color:#d1fae5;margin:8px 0 0;font-size:14px;font-weight:600;">Pagamento Confirmado</p>
        </div>
        <div style="background:#f8fafc;padding:40px 32px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;">
          <p style="color:#334155;font-size:16px;line-height:1.7;">Olá, <strong>${userName}</strong>!</p>
          <p style="color:#334155;font-size:15px;line-height:1.7;">
            Confirmamos a receção do seu pagamento de <strong>${amount} MT</strong> para o curso <strong>${courseTitle}</strong>.
          </p>
          
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin:24px 0;">
            <p style="margin:0 0 8px;font-weight:800;color:#15803d;font-size:15px;">✓ O seu curso completo está 100% desbloqueado:</p>
            <ul style="margin:0;padding-left:20px;color:#374151;font-size:14px;line-height:1.8;">
              <li>Acesso vitalício aos <strong>13 módulos práticos</strong>.</li>
              <li>Downloads de modelos de código e materiais em PDF.</li>
              <li>Direito à emissão do <strong>Certificado Oficial WEHOSTHERE</strong> ao concluir.</li>
            </ul>
          </div>
          
          <div style="text-align:center;margin:32px 0;">
            <a href="${academyUrl}" style="background:linear-gradient(135deg,#059669,#10b981);color:white;font-weight:700;padding:16px 36px;border-radius:10px;text-decoration:none;font-size:15px;display:inline-block;box-shadow:0 4px 12px rgba(16,185,129,0.25);">Acessar Todas as Aulas →</a>
          </div>
          
          <p style="color:#94a3b8;font-size:12px;margin:24px 0 0;text-align:center;">Equipa WEHOSTHERE — Academia de Desenvolvimento Web</p>
        </div>
      </div>`,
  });
}

/** Email de conclusão de curso e emissão de certificado */
export async function sendCourseCompletionEmail(toEmail: string, userName: string, courseTitle: string, certificateNumber: string, verificationUrl: string) {
  return sendEmail({
    to: toEmail,
    subject: `🏆 Parabéns! O seu Certificado de ${courseTitle} está pronto!`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
        <div style="background:linear-gradient(135deg,#7c3aed,#9333ea);padding:40px 32px;border-radius:16px 16px 0 0;text-align:center;">
          <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE Logo" style="width:180px;height:auto;margin:0 auto 16px;display:block;" />
          <p style="color:#ede9fe;margin:8px 0 0;font-size:14px;font-weight:600;">Certificado Oficial de Conclusão</p>
        </div>
        <div style="background:#f8fafc;padding:40px 32px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;">
          <p style="color:#334155;font-size:16px;line-height:1.7;">Parabéns, <strong>${userName}</strong>! 🎓</p>
          <p style="color:#334155;font-size:15px;line-height:1.7;">
            Você concluiu com distinção todas as lições e módulos do curso <strong>${courseTitle}</strong>.
          </p>
          
          <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:12px;padding:20px;margin:24px 0;text-align:center;">
            <p style="margin:0;font-size:13px;color:#6b21a8;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Código de Autenticidade do Certificado</p>
            <p style="margin:8px 0 0;font-family:monospace;font-size:22px;font-weight:900;color:#581c87;letter-spacing:2px;">${certificateNumber}</p>
          </div>
          
          <div style="text-align:center;margin:32px 0;">
            <a href="${verificationUrl}" style="background:linear-gradient(135deg,#7c3aed,#9333ea);color:white;font-weight:700;padding:16px 36px;border-radius:10px;text-decoration:none;font-size:15px;display:inline-block;box-shadow:0 4px 12px rgba(124,58,237,0.25);">Visualizar e Imprimir Certificado →</a>
          </div>
          
          <p style="color:#64748b;font-size:13px;line-height:1.6;margin:16px 0 0;">
            Pode adicionar este certificado ao seu currículo e perfil do LinkedIn através do link oficial de validação.
          </p>
          <p style="color:#94a3b8;font-size:12px;margin:24px 0 0;text-align:center;">Equipa WEHOSTHERE — Academia de Desenvolvimento Web</p>
        </div>
      </div>`,
  });
}

/** Email de notificação de promoção ou despromoção de Administrador */
export async function sendRoleChangeEmail(toEmail: string, userName: string, newRole: 'admin' | 'user') {
  const isAdmin = newRole === 'admin';
  const targetUrl = isAdmin ? `${SITE_URL}/admin` : `${SITE_URL}/dashboard`;

  return sendEmail({
    to: toEmail,
    subject: isAdmin 
      ? `👑 Acesso Concedido: Você foi promovido a Administrador da WEHOSTHERE!`
      : `ℹ️ Atualização de Permissões na sua conta WEHOSTHERE`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
        <div style="background:linear-gradient(135deg,${isAdmin ? '#6d28d9,#4f46e5' : '#475569,#334155'});padding:40px 32px;border-radius:16px 16px 0 0;text-align:center;">
          <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE Logo" style="width:180px;height:auto;margin:0 auto 16px;display:block;" />
          <p style="color:#ede9fe;margin:8px 0 0;font-size:14px;font-weight:600;">Gestão de Permissões</p>
        </div>
        <div style="background:#f8fafc;padding:40px 32px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;">
          <p style="color:#334155;font-size:16px;line-height:1.7;">Olá, <strong>${userName}</strong>,</p>
          
          ${isAdmin ? `
            <p style="color:#334155;font-size:15px;line-height:1.7;">
              Informamos que a sua conta foi promovida para <strong>Administrador da plataforma WEHOSTHERE 👑</strong>.
            </p>
            <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:12px;padding:20px;margin:24px 0;">
              <p style="margin:0 0 8px;font-weight:800;color:#5b21b6;font-size:15px;">Privilégios Administrativos Ativados:</p>
              <ul style="margin:0;padding-left:20px;color:#475569;font-size:14px;line-height:1.8;">
                <li>Acesso completo ao <strong>Painel Administrativo (/admin)</strong>.</li>
                <li>Gestão de clientes, pedidos, faturas e serviços ativos.</li>
                <li>Monitorização de uptime, tickets de suporte e configurações globais.</li>
              </ul>
            </div>
            <div style="text-align:center;margin:32px 0;">
              <a href="${targetUrl}" style="background:linear-gradient(135deg,#6d28d9,#4f46e5);color:white;font-weight:700;padding:16px 36px;border-radius:10px;text-decoration:none;font-size:15px;display:inline-block;box-shadow:0 4px 12px rgba(109,40,217,0.25);">Acessar Painel Administrativo →</a>
            </div>
          ` : `
            <p style="color:#334155;font-size:15px;line-height:1.7;">
              Informamos que as permissões de Administrador da sua conta foram desativadas. A sua conta funciona agora com a função de <strong>Utilizador / Cliente Comum</strong>.
            </p>
            <div style="text-align:center;margin:32px 0;">
              <a href="${targetUrl}" style="background:#334155;color:white;font-weight:700;padding:16px 36px;border-radius:10px;text-decoration:none;font-size:15px;display:inline-block;">Acessar Dashboard do Cliente →</a>
            </div>
          `}
          
          <p style="color:#94a3b8;font-size:12px;margin:24px 0 0;text-align:center;">Equipa de Segurança WEHOSTHERE — Gestão de Acessos</p>
        </div>
      </div>`,
  });
}

