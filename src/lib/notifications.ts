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
  },
  {
    id: 'payment-failed',
    name: 'Pagamento falhado',
    category: 'Pagamentos',
    subject: '❌ Problema no seu Pagamento - Pedido {{numero_pedido}}',
    body: `Olá {{nome_cliente}},

Informamos que o seu pagamento de {{valor}} referente ao pedido {{numero_pedido}} não pôde ser processado com sucesso em {{data}}.

Motivo possível: falha na transação, saldo insuficiente ou tempo esgotado.

O que fazer agora:
• Verifique o saldo da sua conta M-Pesa
• Tente novamente no seu painel de pagamentos
• Ou entre em contacto com o nosso suporte para assistência

Aceda ao seu painel: https://wehosthere.com/dashboard

Estamos aqui para ajudar!

Atenciosamente,
Equipa {{nome_empresa}}`,
    channel: 'email',
    isSystem: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'support-ticket-received',
    name: 'Ticket de suporte recebido',
    category: 'Suporte',
    subject: '🎫 Recebemos o seu pedido de suporte #{{numero_ticket}} - {{nome_empresa}}',
    body: `Olá {{nome_cliente}},

Confirmamos que recebemos o seu pedido de suporte e a nossa equipa técnica já está a analisar a situação.

Detalhes do Ticket:
• Número: #{{numero_ticket}}
• Assunto: {{assunto}}
• Prioridade: {{prioridade}}
• Data de Abertura: {{data}}
• Estado Atual: Em análise

O nosso objetivo é responder no prazo máximo de 24 horas úteis. Acompanhe o estado do seu ticket no seu painel de cliente.

Aceda ao suporte: https://wehosthere.com/dashboard

Obrigado pela sua paciência,
Equipa de Suporte {{nome_empresa}}`,
    channel: 'email',
    isSystem: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'abandoned-cart',
    name: 'Carrinho Abandonado',
    category: 'Vendas',
    subject: '🛍️ O seu domínio/hospedagem está à sua espera! - {{nome_empresa}}',
    body: `Olá {{nome_cliente}},

Notámos que iniciou o pedido {{numero_pedido}}, mas ainda não concluiu o pagamento.

Sabia que o seu domínio/hospedagem pode ser reservado por outra pessoa a qualquer momento? Não perca a oportunidade de colocar o seu projeto online hoje mesmo!

Se teve algum problema durante o pagamento via M-Pesa, pode aceder à sua conta e tentar novamente.

Aceda ao seu painel e conclua a compra: https://wehosthere.com/dashboard/billing

Estamos aqui para ajudar,
Equipa {{nome_empresa}}`,
    channel: 'email',
    isSystem: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'service-credentials',
    name: 'Credenciais de Acesso ao Serviço',
    category: 'Ativações',
    subject: '🔑 Os seus Dados de Acesso ao Serviço - {{nome_empresa}}',
    body: `Olá {{nome_cliente}},

O seu serviço atrelado ao pedido {{numero_pedido}} foi ativado com sucesso!

Abaixo encontram-se as suas credenciais privadas para gestão do seu alojamento, e-mails e domínios:

🔑 Dados de Acesso:
• Nome de Utilizador: {{utilizador}}
• Palavra-passe Temporária: {{palavra_passe}}
• Painel de Gestão: {{link_painel}}
• Webmail Corporativo: {{link_webmail}}

🌐 Servidores de Nome (DNS):
• NS1: {{servidor_dns1}}
• NS2: {{servidor_dns2}}

Recomendamos que guarde esta mensagem em local seguro ou altere a palavra-passe após o primeiro acesso no seu painel.

Se tiver qualquer questão na configuração dos seus e-mails corporativos, a nossa equipa de suporte está sempre disponível.

Atenciosamente,
Equipa Técnica {{nome_empresa}}`,
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
// NOTIFICAÇÕES DO ADMINISTRADOR (MongoDB & Helpers)
// -------------------------------------------------------------

export async function getAdminNotifications(): Promise<AdminNotification[]> {
  try {
    const AdminNotification = (await import('@/lib/models/AdminNotification')).default;
    const notifications = await AdminNotification.find({})
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    
    return notifications.map((n: any) => ({
      id: n._id?.toString() || n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      read: n.read,
      createdAt: n.createdAt,
      link: n.link,
      userEmail: n.userEmail,
      userName: n.userName,
      metadata: n.metadata
    }));
  } catch (error) {
    console.error('[Notifications] Erro ao buscar notificações do MongoDB:', error);
    // Fallback para localStorage
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}

export async function saveAdminNotifications(notifications: AdminNotification[]): Promise<void> {
  // Não usado mais - persistência é feita diretamente no MongoDB
  // Mantido para compatibilidade
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  } catch { /* ignore */ }
}

export async function addAdminNotification(
  notification: Omit<AdminNotification, 'id' | 'createdAt' | 'read'>
): Promise<AdminNotification> {
  try {
    const AdminNotification = (await import('@/lib/models/AdminNotification')).default;
    
    const newNotif = await AdminNotification.create({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      read: false,
      link: notification.link,
      userEmail: notification.userEmail,
      userName: notification.userName,
      metadata: notification.metadata || {}
    });

    const result: AdminNotification = {
      id: newNotif._id.toString(),
      title: newNotif.title,
      message: newNotif.message,
      type: newNotif.type,
      read: newNotif.read,
      createdAt: newNotif.createdAt,
      link: newNotif.link,
      userEmail: newNotif.userEmail,
      userName: newNotif.userName,
      metadata: newNotif.metadata
    };

    // Atualizar localStorage como cache
    if (typeof window !== 'undefined') {
      const current = await getAdminNotifications();
      const updated = [result, ...current].slice(0, 200);
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    }

    return result;
  } catch (error) {
    console.error('[Notifications] Erro ao adicionar notificação ao MongoDB:', error);
    
    // Fallback para localStorage
    const newNotif: AdminNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      read: false,
      createdAt: new Date().toISOString()
    };

    if (typeof window !== 'undefined') {
      const current = await getAdminNotifications();
      const updated = [newNotif, ...current].slice(0, 200);
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    }

    return newNotif;
  }
}

export async function markAdminNotificationRead(id: string): Promise<void> {
  try {
    const AdminNotification = (await import('@/lib/models/AdminNotification')).default;
    await AdminNotification.findByIdAndUpdate(id, { read: true });
  } catch (error) {
    console.error('[Notifications] Erro ao marcar notificação como lida no MongoDB:', error);
  }

  // Atualizar localStorage
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        const notifications = JSON.parse(stored);
        const updated = notifications.map((n: AdminNotification) => 
          n.id === id ? { ...n, read: true } : n
        );
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
      }
    } catch { /* ignore */ }
  }
}

export async function markAllAdminNotificationsRead(): Promise<void> {
  try {
    const AdminNotification = (await import('@/lib/models/AdminNotification')).default;
    await AdminNotification.updateMany({}, { read: true });
  } catch (error) {
    console.error('[Notifications] Erro ao marcar todas notificações como lidas no MongoDB:', error);
  }

  // Atualizar localStorage
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        const notifications = JSON.parse(stored);
        const updated = notifications.map((n: AdminNotification) => ({ ...n, read: true }));
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
      }
    } catch { /* ignore */ }
  }
}

export async function clearAdminNotifications(): Promise<void> {
  try {
    const AdminNotification = (await import('@/lib/models/AdminNotification')).default;
    await AdminNotification.deleteMany({});
  } catch (error) {
    console.error('[Notifications] Erro ao limpar notificações no MongoDB:', error);
  }

  // Limpar localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify([]));
  }
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

export async function addCommunicationLog(log: Omit<CommunicationLog, 'id' | 'sentAt'>): Promise<CommunicationLog> {
  const newLog: CommunicationLog = {
    ...log,
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    sentAt: new Date().toISOString()
  };

  try {
    const CommunicationLogModel = (await import('@/lib/models/CommunicationLog')).default;
    
    await CommunicationLogModel.create({
      recipientEmail: log.recipientEmail,
      recipientName: log.recipientName,
      subject: log.subject,
      body: log.body,
      templateId: log.templateId,
      templateName: log.templateName,
      channel: log.channel,
      status: log.status,
      isAutomatic: log.isAutomatic,
      eventType: log.eventType,
      sentAt: new Date(),
      error: log.error,
      retryCount: 0,
      nextRetryAt: null
    });
  } catch (error) {
    console.error('[Notifications] Erro ao salvar log no MongoDB:', error);
  }

  // Manter localStorage como cache
  const current = getCommunicationLogs();
  const updated = [newLog, ...current].slice(0, 500);
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
  attachments?: { filename: string; content: string }[];
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
              <img src="https://wehosthere.com/logo.png" alt="WEHOSTHERE" width="80" style="max-width:80px;height:auto;opacity:0.35;margin-bottom:10px;" />
              <p style="color:#64748b;font-size:12px;margin:0 0 12px;font-weight:600;">Siga-nos nas redes sociais</p>
              <div style="display:flex;justify-content:center;gap:16px;margin-bottom:14px;">
                <a href="https://www.facebook.com/profile.php?id=61592497206566" target="_blank" rel="noopener noreferrer"
                   style="display:inline-flex;align-items:center;gap:6px;background:#1877F2;color:white;text-decoration:none;font-size:12px;font-weight:700;padding:7px 14px;border-radius:8px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                  Facebook
                </a>
                <a href="https://www.linkedin.com/company/wehosthere" target="_blank" rel="noopener noreferrer"
                   style="display:inline-flex;align-items:center;gap:6px;background:#0A66C2;color:white;text-decoration:none;font-size:12px;font-weight:700;padding:7px 14px;border-radius:8px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                  LinkedIn
                </a>
              </div>
              <hr style="border:none;border-top:1px solid #f1f5f9;margin:0 0 10px;">
              <p style="color:#94a3b8;font-size:11px;margin:0;">WEHOSTHERE &mdash; Suporte &amp; Comunicação Automática</p>
              <p style="color:#cbd5e1;font-size:11px;margin:4px 0 0;"><a href="https://wehosthere.com" style="color:#3b82f6;text-decoration:none;">wehosthere.com</a></p>
            </div>
          </div>
        </div>`,
        attachments: payload.attachments
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
