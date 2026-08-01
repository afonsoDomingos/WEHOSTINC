export interface WebmailAttachment {
  url: string;
  name: string;
  size?: number;
  type?: string;
}

export interface WebmailMessage {
  id: string;
  accountEmail: string;
  fromName: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  body: string;
  date: string;
  isRead: boolean;
  starred: boolean;
  folder: 'inbox' | 'sent' | 'drafts' | 'trash';
  avatarColor?: string;
  attachments?: WebmailAttachment[];
}

const WEBMAIL_STORAGE_KEY = 'wehosthere_webmail_messages';

export const INITIAL_WEBMAIL_MESSAGES: WebmailMessage[] = [
  {
    id: 'wm-1',
    accountEmail: 'ericaguelume@msservices.co.mz',
    fromName: 'Equipa WEHOSTHERE',
    fromEmail: 'info@wehosthere.com',
    toEmail: 'ericaguelume@msservices.co.mz',
    subject: '🎉 Bem-vindo ao seu novo E-mail Corporativo WEHOSTHERE!',
    body: `Olá Erica Guelume,

A sua conta de e-mail corporativo (ericaguelume@msservices.co.mz) foi ativada com sucesso!

A partir de agora pode enviar e receber mensagens de forma profissional com os parâmetros SSL do seu próprio domínio.

Recursos incluídos na sua conta:
- 5 GB de Armazenamento Seguro
- Proteção Anti-Spam e Anti-Phishing Ativa
- Suporte IMAP, POP3 e SMTP para Outlook/Smartphone

Qualquer dúvida, a nossa equipa de suporte está 24/7 ao seu dispor.

Com os melhores cumprimentos,
Equipa de Engenharia WEHOSTHERE`,
    date: new Date(Date.now() - 3600000 * 2).toISOString(),
    isRead: false,
    starred: true,
    folder: 'inbox',
    avatarColor: 'bg-primary-600'
  },
  {
    id: 'wm-2',
    accountEmail: 'ericaguelume@msservices.co.mz',
    fromName: 'Carlos Tembe (Cliente)',
    fromEmail: 'carlos.tembe@empresa.co.mz',
    toEmail: 'ericaguelume@msservices.co.mz',
    subject: 'Pedido de Orçamento para Prestação de Serviços',
    body: `Boa tarde Senhora Erica,

Encontrei o contacto da MS Services e gostaria de solicitar uma cotação para a prestação de serviços de consultoria técnica para a nossa empresa em Maputo.

Agradeço se puder enviar o vosso portfólio e proposta financeira preliminar.

Atenciosamente,
Carlos Tembe
Director Geral - MozTech Services`,
    date: new Date(Date.now() - 3600000 * 18).toISOString(),
    isRead: true,
    starred: false,
    folder: 'inbox',
    avatarColor: 'bg-emerald-600'
  },
  {
    id: 'wm-3',
    accountEmail: 'anayagrachane@msservices.co.mz',
    fromName: 'WEHOSTHERE Cloud Services',
    fromEmail: 'info@wehosthere.com',
    toEmail: 'anayagrachane@msservices.co.mz',
    subject: 'Confirmada a Configuração de Segurança SSL/TLS',
    body: `Olá Anaya Grachane,

O certificado SSL para a sua caixa postal anayagrachane@msservices.co.mz foi renovado automaticamente com encriptação RSA 4096-bit.

O seu e-mail está 100% protegido contra acessos não autorizados.

WEHOSTHERE Security System`,
    date: new Date(Date.now() - 86400000).toISOString(),
    isRead: false,
    starred: true,
    folder: 'inbox',
    avatarColor: 'bg-indigo-600'
  }
];

export const webmailManager = {
  getMessages: (accountEmail?: string): WebmailMessage[] => {
    if (typeof window === 'undefined') return INITIAL_WEBMAIL_MESSAGES;
    const stored = localStorage.getItem(WEBMAIL_STORAGE_KEY);
    let messages: WebmailMessage[] = stored ? JSON.parse(stored) : INITIAL_WEBMAIL_MESSAGES;
    if (!stored) {
      localStorage.setItem(WEBMAIL_STORAGE_KEY, JSON.stringify(INITIAL_WEBMAIL_MESSAGES));
    }
    if (accountEmail) {
      return messages.filter(m => m.accountEmail.toLowerCase() === accountEmail.toLowerCase());
    }
    return messages;
  },

  sendMessage: (accountEmail: string, toEmail: string, subject: string, body: string, attachments?: WebmailAttachment[]): WebmailMessage => {
    const messages = webmailManager.getMessages();
    const newMsg: WebmailMessage = {
      id: `wm-${Date.now()}`,
      accountEmail,
      fromName: accountEmail.split('@')[0],
      fromEmail: accountEmail,
      toEmail,
      subject,
      body,
      date: new Date().toISOString(),
      isRead: true,
      starred: false,
      folder: 'sent',
      avatarColor: 'bg-primary-600',
      attachments: attachments && attachments.length > 0 ? attachments : undefined
    };
    messages.unshift(newMsg);
    if (typeof window !== 'undefined') {
      localStorage.setItem(WEBMAIL_STORAGE_KEY, JSON.stringify(messages));
    }
    return newMsg;
  },

  toggleStar: (id: string): void => {
    const messages = webmailManager.getMessages();
    const msg = messages.find(m => m.id === id);
    if (msg) {
      msg.starred = !msg.starred;
      if (typeof window !== 'undefined') {
        localStorage.setItem(WEBMAIL_STORAGE_KEY, JSON.stringify(messages));
      }
    }
  },

  markAsRead: (id: string, isRead = true): void => {
    const messages = webmailManager.getMessages();
    const msg = messages.find(m => m.id === id);
    if (msg) {
      msg.isRead = isRead;
      if (typeof window !== 'undefined') {
        localStorage.setItem(WEBMAIL_STORAGE_KEY, JSON.stringify(messages));
      }
    }
  },

  moveFolder: (id: string, newFolder: 'inbox' | 'sent' | 'drafts' | 'trash'): void => {
    const messages = webmailManager.getMessages();
    const msg = messages.find(m => m.id === id);
    if (msg) {
      msg.folder = newFolder;
      if (typeof window !== 'undefined') {
        localStorage.setItem(WEBMAIL_STORAGE_KEY, JSON.stringify(messages));
      }
    }
  },

  deletePermanently: (id: string): void => {
    const messages = webmailManager.getMessages();
    const filtered = messages.filter(m => m.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(WEBMAIL_STORAGE_KEY, JSON.stringify(filtered));
    }
  },

  saveDraft: (accountEmail: string, toEmail: string, subject: string, body: string, attachments?: WebmailAttachment[]): WebmailMessage => {
    const messages = webmailManager.getMessages();
    const existingDraftIndex = messages.findIndex(m => 
      m.folder === 'drafts' && 
      m.accountEmail.toLowerCase() === accountEmail.toLowerCase() &&
      m.toEmail.toLowerCase() === toEmail.toLowerCase() &&
      m.subject.toLowerCase() === subject.toLowerCase()
    );

    const draftData = {
      accountEmail,
      fromName: accountEmail.split('@')[0],
      fromEmail: accountEmail,
      toEmail,
      subject,
      body,
      date: new Date().toISOString(),
      isRead: true,
      starred: false,
      folder: 'drafts' as const,
      avatarColor: 'bg-gray-500',
      attachments: attachments && attachments.length > 0 ? attachments : undefined
    };

    if (existingDraftIndex !== -1) {
      // Atualiza rascunho existente
      messages[existingDraftIndex] = {
        ...messages[existingDraftIndex],
        ...draftData,
        id: messages[existingDraftIndex].id
      };
    } else {
      // Cria novo rascunho
      const newDraft: WebmailMessage = {
        id: `draft-${Date.now()}`,
        ...draftData
      };
      messages.unshift(newDraft);
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(WEBMAIL_STORAGE_KEY, JSON.stringify(messages));
    }

    return existingDraftIndex !== -1 ? messages[existingDraftIndex] : messages[0];
  },

  getDrafts: (accountEmail?: string): WebmailMessage[] => {
    const messages = webmailManager.getMessages(accountEmail);
    return messages.filter(m => m.folder === 'drafts');
  }
};
