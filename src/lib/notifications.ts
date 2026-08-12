import { sendEmail } from '@/lib/sendgrid';

export type CommunicationChannel = 'email' | 'whatsapp' | 'sms';

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: 
    | 'user_signup'
    | 'order_new'
    | 'order_updated'
    | 'order_approved'
    | 'order_rejected'
    | 'order_cancelled'
    | 'payment_success'
    | 'payment_failed'
    | 'payment_pending'
    | 'support_ticket'
    | 'system';
  read: boolean;
  createdAt: string;
  link?: string;
  userEmail?: string;
  userName?: string;
  metadata?: Record<string, any>;
}

export interface CommunicationTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  body: string;
  channel: CommunicationChannel;
  isSystem?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CommunicationLog {
  id: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  body: string;
  templateId?: string;
  templateName?: string;
  channel: CommunicationChannel;
  status: 'sent' | 'failed' | 'pending';
  isAutomatic: boolean;
  eventType?: string;
  sentAt: string;
  error?: string;
}

const NOTIFICATIONS_STORAGE_KEY = 'wehosthere_admin_notifications';
const TEMPLATES_STORAGE_KEY = 'wehosthere_communication_templates';
const LOGS_STORAGE_KEY = 'wehosthere_communication_logs';

export const DEFAULT_TEMPLATES: CommunicationTemplate[] = [
  {
    id: 'welcome',
    name: 'Conta criada com sucesso',
    category: 'Boas-Vindas',
    subject: '🎉 Bem-vindo à {{nome_empresa}}! A sua conta está pronta.',
    body: `Olá {{nome_cliente}},

Seja muito bem-vindo à {{nome_empresa}}! A sua conta foi criada com sucesso.

Os seus dados de acesso já estão ativos e pode começar a utilizar todos os nossos serviços de hospedagem, servidores e sistemas.

Dethes da Conta:
• Nome: {{nome_cliente}}
• E-mail: {{email}}
• Data de Registo: {{data}}

Se precisar de ajuda ou tiver alguma dúvida, a nossa equipa de suporte está sempre à disposição.

Com os melhores cumprimentos,
Equipa {{nome_empresa}}`,
    channel: 'email',
    isSystem: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'order-received',
    name: 'Pedido recebido',
    category: 'Pedidos',
    subject: '🧾 Recebemos o seu pedido {{numero_pedido}} - {{nome_empresa}}',
    body: `Olá {{nome_cliente}},

Recebemos o seu novo pedido {{numero_pedido}} com sucesso!

Resumo do Pedido:
• Número do Pedido: {{numero_pedido}}
• Valor: {{valor}}
• Data: {{data}}
• Estado: {{estado_pedido}}

A nossa equipa já está a processar a sua solicitação. Notificá-lo-emos assim que o seu serviço estiver 100% ativo.

Atenciosamente,
Equipa {{nome_empresa}}`,
    channel: 'email',
    isSystem: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'order-approved',
    name: 'Pedido aprovado',
    category: 'Pedidos',
    subject: '✅ O seu pedido {{numero_pedido}} foi APROVADO! - {{nome_empresa}}',
    body: `Olá {{nome_cliente}},

Temos o prazer de informar que o seu pedido {{numero_pedido}} foi APROVADO e ativado com sucesso!

Detalhes do Serviço:
• Número do Pedido: {{numero_pedido}}
• Estado Atual: Aprovado / Ativo
• Valor Liquidado: {{valor}}
• Data de Ativação: {{data}}

Pode agora aceder ao seu painel e desfrutar do seu serviço sem restrições.

Atenciosamente,
Equipa {{nome_empresa}}`,
    channel: 'email',
    isSystem: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'order-rejected',
    name: 'Pedido rejeitado',
    category: 'Pedidos',
    subject: '⚠️ Atualização sobre o seu pedido {{numero_pedido}} - {{nome_empresa}}',
    body: `Olá {{nome_cliente}},

Informamos que o seu pedido {{numero_pedido}} no valor de {{valor}} não pôde ser aprovado neste momento.

Motivo / Ação Recomendada:
Por favor, verifique os seus dados de pagamento ou entre em contacto com o nosso suporte técnico para resolver a situação e reativar o seu pedido.

Estamos à disposição para ajudar.

Atenciosamente,
Equipa {{nome_empresa}}`,
    channel: 'email',
    isSystem: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'order-cancelled',
    name: 'Pedido cancelado',
    category: 'Pedidos',
    subject: '❌ Confirmação de cancelamento do pedido {{numero_pedido}}',
    body: `Olá {{nome_cliente}},

Confirmamos que o seu pedido {{numero_pedido}} no valor de {{valor}} foi cancelado em {{data}}.

Se não solicitou este cancelamento ou se gostaria de reativar os seus serviços, entre em contacto imediatamente com o nosso centro de suporte.

Atenciosamente,
Equipa {{nome_empresa}}`,
    channel: 'email',
    isSystem: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'payment-confirmed',
    name: 'Pagamento confirmado',
    category: 'Pagamentos',
    subject: '💳 Pagamento Confirmado com Sucesso - Fatura {{numero_pedido}}',
    body: `Olá {{nome_cliente}},

O seu pagamento no valor de {{valor}} para o pedido {{numero_pedido}} foi confirmado com sucesso em {{data}}!

Resumo do Pagamento:
• Referência: {{numero_pedido}}
• Valor Recebido: {{valor}}
• Estado do Pagamento: Confirmado / Pago

Agradecemos a sua preferência e confiança nos serviços da {{nome_empresa}}.

Com os melhores cumprimentos,
Departamento Financeiro {{nome_empresa}}`,
    channel: 'email',
    isSystem: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'payment-pending',
    name: 'Pagamento pendente',
    category: 'Pagamentos',
    subject: '⏳ Pagamento Pendente - Pedido {{numero_pedido}}',
    body: `Olá {{nome_cliente}},

Recordamos que o pagamento relativo ao pedido {{numero_pedido}} no valor de {{valor}} encontra-se atualmente pendente.

Para evitar a interrupção dos seus serviços, por favor conclua o pagamento através do Vodacom M-Pesa ou Cartão no seu painel de faturamento.

Data da solicitação: {{data}}

Obrigado pela sua atenção,
Equipa {{nome_empresa}}`,
    channel: 'email',
    isSystem: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'order-status-changed',
    name: 'Alteração do estado do pedido',
    category: 'Pedidos',
    subject: '🔔 Alteração de Estado no seu Pedido {{numero_pedido}}',
    body: `Olá {{nome_cliente}},

O estado do seu pedido {{numero_pedido}} foi alterado para: {{estado_pedido}}.

Data da Atualização: {{data}}

Aceda ao seu painel de cliente em https://wehosthere.com/dashboard para consultar os detalhes completos.

Atenciosamente,
Equipa {{nome_empresa}}`,
    channel: 'email',
    isSystem: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'password-reset',
    name: 'Recuperação de palavra-passe',
    category: 'Segurança',
    subject: '🔐 Instruções para Recuperação de Palavra-passe',
    body: `Olá {{nome_cliente}},

Recebemos um pedido para redefinir a palavra-passe associada à sua conta {{email}} em {{data}}.

Se foi você quem fez esta solicitação, siga as instruções no seu painel para escolher uma nova palavra-passe segura.

Se não fez este pedido, pode ignorar esta mensagem ou comunicar à nossa equipa de segurança.

Atenciosamente,
Equipa de Segurança {{nome_empresa}}`,
    channel: 'email',
    isSystem: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'important-notice',
    name: 'Avisos importantes',
    category: 'Geral',
    subject: '📢 Comunicado Importante - {{nome_empresa}}',
    body: `Caro(a) {{nome_cliente}},

Gostaríamos de partilhar um aviso importante relativo à sua conta na {{nome_empresa}}.

Mensagem:
Estamos continuamente a realizar melhorias na nossa infraestrutura de servidores e rede para garantir a máxima velocidade e estabilidade para a sua hospedagem.

Data do Comunicado: {{data}}

Se precisar de qualquer assistência, estamos sempre disponíveis através do nosso canal de suporte.

Com os melhores cumprimentos,
Direção {{nome_empresa}}`,
    channel: 'email',
    isSystem: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'platform-update',
    name: 'Atualizações da plataforma',
    category: 'Geral',
    subject: '🚀 Novas Funcionalidades e Atualizações na {{nome_empresa}}',
    body: `Olá {{nome_cliente}},

Temos novidades incríveis para partilhar com você!

Lançámos novas atualizações e funcionalidades na plataforma {{nome_empresa}} para tornar a gestão dos seus sites, domínios e e-mails ainda mais simples e poderosa.

Aceda agora a https://wehosthere.com e descubra todas as novidades.

Obrigado por fazer parte da {{nome_empresa}}!

Atenciosamente,
Equipa {{nome_empresa}}`,
    channel: 'email',
    isSystem: true,
    createdAt: new Date().toISOString()
  }
];

// Helper para substituir variáveis nos templates
export function replaceTemplateVariables(
  content: string,
  variables: Record<string, string | number | undefined>
): string {
  let result = content;
  const defaultVars: Record<string, string> = {
    nome_empresa: 'WEHOSTHERE',
    data: new Date().toLocaleDateString('pt-MZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    ...Object.entries(variables).reduce((acc, [k, v]) => {
      acc[k] = v !== undefined && v !== null ? String(v) : '';
      return acc;
    }, {} as Record<string, string>)
  };

  Object.entries(defaultVars).forEach(([key, val]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
    result = result.replace(regex, val);
  });

  return result;
}

// -------------------------------------------------------------
// NOTIFICAÇÕES DO ADMINISTRADOR (Storage & Helpers)
// -------------------------------------------------------------

export function getAdminNotifications(): AdminNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveAdminNotifications(notifications: AdminNotification[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  } catch { /* ignore */ }
}

export function addAdminNotification(
  notification: Omit<AdminNotification, 'id' | 'createdAt' | 'read'>
): AdminNotification {
  const newNotif: AdminNotification = {
    ...notification,
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    read: false,
    createdAt: new Date().toISOString()
  };

  const current = getAdminNotifications();
  const updated = [newNotif, ...current].slice(0, 200); // Manter as últimas 200
  saveAdminNotifications(updated);

  // Opcional: enviar aviso também via API interna se estivermos no servidor ou navegador
  if (typeof window !== 'undefined') {
    fetch('/api/admin/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newNotif)
    }).catch(() => { /* ignore fallback */ });
  }

  return newNotif;
}

export function markAdminNotificationRead(id: string): void {
  const current = getAdminNotifications();
  const updated = current.map(n => n.id === id ? { ...n, read: true } : n);
  saveAdminNotifications(updated);
}

export function markAllAdminNotificationsRead(): void {
  const current = getAdminNotifications();
  const updated = current.map(n => ({ ...n, read: true }));
  saveAdminNotifications(updated);
}

export function clearAdminNotifications(): void {
  saveAdminNotifications([]);
}

// -------------------------------------------------------------
// GESTÃO DE TEMPLATES DE COMUNICAÇÃO
// -------------------------------------------------------------

export function getCommunicationTemplates(): CommunicationTemplate[] {
  if (typeof window === 'undefined') return DEFAULT_TEMPLATES;
  try {
    const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(DEFAULT_TEMPLATES));
      return DEFAULT_TEMPLATES;
    }
    const parsed: CommunicationTemplate[] = JSON.parse(stored);
    // Garantir que os templates padrão estejam sempre presentes
    const existingIds = new Set(parsed.map(t => t.id));
    const missingDefaults = DEFAULT_TEMPLATES.filter(d => !existingIds.has(d.id));
    if (missingDefaults.length > 0) {
      const merged = [...parsed, ...missingDefaults];
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(merged));
      return merged;
    }
    return parsed;
  } catch {
    return DEFAULT_TEMPLATES;
  }
}

export function saveCommunicationTemplate(template: Omit<CommunicationTemplate, 'createdAt'> & { createdAt?: string }): CommunicationTemplate {
  const templates = getCommunicationTemplates();
  const index = templates.findIndex(t => t.id === template.id);
  const now = new Date().toISOString();
  
  let saved: CommunicationTemplate;

  if (index >= 0) {
    saved = {
      ...templates[index],
      ...template,
      updatedAt: now
    };
    templates[index] = saved;
  } else {
    saved = {
      ...template,
      createdAt: template.createdAt || now,
      updatedAt: now
    };
    templates.push(saved);
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  }
  return saved;
}

export function deleteCommunicationTemplate(id: string): void {
  const templates = getCommunicationTemplates().filter(t => t.id !== id || t.isSystem);
  if (typeof window !== 'undefined') {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  }
}

// -------------------------------------------------------------
// HISTÓRICO DE MENSAGENS (LOGS)
// -------------------------------------------------------------

export function getCommunicationLogs(): CommunicationLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(LOGS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addCommunicationLog(log: Omit<CommunicationLog, 'id' | 'sentAt'>): CommunicationLog {
  const newLog: CommunicationLog = {
    ...log,
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    sentAt: new Date().toISOString()
  };

  const current = getCommunicationLogs();
  const updated = [newLog, ...current].slice(0, 500); // Guardar histórico das últimas 500 mensagens
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(updated));
  }
  return newLog;
}

// -------------------------------------------------------------
// SERVIÇO DE DISPARO DE MENSAGENS E AUTOMAÇÕES
// -------------------------------------------------------------

export interface SendMessagePayload {
  recipientEmail: string;
  recipientName: string;
  templateId?: string;
  subject?: string;
  body?: string;
  variables?: Record<string, string | number | undefined>;
  isAutomatic?: boolean;
  eventType?: string;
  channel?: CommunicationChannel;
}

export async function dispatchMessage(payload: SendMessagePayload): Promise<{ success: boolean; error?: string }> {
  const channel = payload.channel || 'email';
  let finalSubject = payload.subject || '';
  let finalBody = payload.body || '';
  let templateName = 'Personalizado';

  if (payload.templateId) {
    const templates = getCommunicationTemplates();
    const found = templates.find(t => t.id === payload.templateId);
    if (found) {
      templateName = found.name;
      if (!finalSubject) finalSubject = found.subject;
      if (!finalBody) finalBody = found.body;
    }
  }

  // Substituir variáveis dinâmicas
  const vars = {
    nome_cliente: payload.recipientName,
    email: payload.recipientEmail,
    ...payload.variables
  };

  finalSubject = replaceTemplateVariables(finalSubject, vars);
  finalBody = replaceTemplateVariables(finalBody, vars);

  try {
    let result: { success: boolean; error?: string } = { success: false };

    if (channel === 'email') {
      result = await sendEmail({
        to: payload.recipientEmail,
        subject: finalSubject,
        text: finalBody,
        html: `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b;line-height:1.7;">
          <div style="background:linear-gradient(135deg,#1d4ed8,#2563eb);padding:28px 24px 24px;border-radius:12px 12px 0 0;text-align:center;">
            <img
              src="https://wehosthere.com/logo.png"
              alt="WEHOSTHERE"
              width="160"
              style="max-width:160px;height:auto;display:block;margin:0 auto;"
              onerror="this.style.display='none';document.getElementById('wh-logo-text').style.display='block';"
            />
            <span id="wh-logo-text" style="display:none;color:white;font-size:22px;font-weight:800;letter-spacing:1px;">WEHOSTHERE</span>
            <p style="color:#bfdbfe;margin:10px 0 0;font-size:13px;">Hospedagem &amp; Serviços de Nuvem</p>
          </div>
          <div style="background:#ffffff;padding:32px 24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
            <div style="white-space:pre-line;font-size:15px;color:#334155;line-height:1.8;">${finalBody}</div>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 16px;">
            <div style="text-align:center;">
              <img src="https://wehosthere.com/logo.png" alt="WEHOSTHERE" width="80" style="max-width:80px;height:auto;opacity:0.4;margin-bottom:6px;" />
              <p style="color:#94a3b8;font-size:11px;margin:0;">WEHOSTHERE &mdash; Suporte &amp; Comunicação Automática</p>
              <p style="color:#cbd5e1;font-size:11px;margin:4px 0 0;"><a href="https://wehosthere.com" style="color:#93c5fd;text-decoration:none;">wehosthere.com</a></p>
            </div>
          </div>
        </div>`
      });
    } else {
      // Extensibilidade para WhatsApp / SMS (mock de entrega pronta para integração)
      console.log(`[Canal ${channel.toUpperCase()}] Mensagem enviada para ${payload.recipientEmail}:`, finalBody);
      result = { success: true };
    }

    addCommunicationLog({
      recipientEmail: payload.recipientEmail,
      recipientName: payload.recipientName,
      subject: finalSubject,
      body: finalBody,
      templateId: payload.templateId,
      templateName,
      channel,
      status: result.success ? 'sent' : 'failed',
      isAutomatic: !!payload.isAutomatic,
      eventType: payload.eventType,
      error: result.error
    });

    return result;
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    addCommunicationLog({
      recipientEmail: payload.recipientEmail,
      recipientName: payload.recipientName,
      subject: finalSubject,
      body: finalBody,
      templateId: payload.templateId,
      templateName,
      channel,
      status: 'failed',
      isAutomatic: !!payload.isAutomatic,
      eventType: payload.eventType,
      error: errorMsg
    });
    return { success: false, error: errorMsg };
  }
}
