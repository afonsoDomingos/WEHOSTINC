export interface WebmailAttachment {
  url: string;
  name: string;
  size?: number;
  type?: string;
}

export interface WebmailMessage {
  id: string;
  uid?: number;
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

// Limites de anexos
export const ATTACHMENT_MAX_SIZE = 10 * 1024 * 1024; // 10MB em bytes
export const ATTACHMENT_MAX_COUNT = 5; // Máximo de 5 anexos por email
export const ATTACHMENT_TOTAL_MAX_SIZE = 25 * 1024 * 1024; // 25MB total por email

const WEBMAIL_STORAGE_KEY = 'wehosthere_webmail_messages';

// Import Migadu IMAP/SMTP service
import { migaduImapSmtp } from './migaduImapSmtp';

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
  // Check if real IMAP/SMTP is available
  isRealEmailAvailable: (email: string, password: string): boolean => {
    // Check if email belongs to a domain managed by Migadu
    // This would check against our database in production
    return !!(email && password);
  },

  getMessages: async (accountEmail?: string, password?: string): Promise<WebmailMessage[]> => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // In production, require real credentials
    if (isProduction && (!accountEmail || !password)) {
      throw new Error('Credenciais de email são obrigatórias');
    }

    // If real credentials provided and available, use IMAP
    if (accountEmail && password && webmailManager.isRealEmailAvailable(accountEmail, password)) {
      try {
        const imapMessages = await migaduImapSmtp.listMessages(accountEmail, password, 'INBOX');
        
        // Convert IMAP messages to WebmailMessage format
        return imapMessages.map(msg => ({
          id: msg.id,
          uid: msg.uid,
          accountEmail,
          fromName: msg.from.name,
          fromEmail: msg.from.address,
          toEmail: msg.to[0]?.address || '',
          subject: msg.subject,
          body: msg.body,
          date: msg.date.toISOString(),
          isRead: msg.isRead,
          starred: msg.starred,
          folder: 'inbox' as const,
          avatarColor: 'bg-primary-600',
          attachments: msg.attachments?.map(att => ({
            url: '',
            name: att.filename,
            size: att.size,
            type: att.contentType
          }))
        }));
      } catch (error) {
        console.error('[Webmail] IMAP fetch failed:', error);
        // In production, throw error instead of falling back
        if (isProduction) {
          throw new Error('Não foi possível conectar ao servidor de email. Verifique as suas credenciais ou tente novamente.');
        }
        // In development, fall back to simulation
      }
    }

    // Fallback to localStorage simulation (only in development)
    if (isProduction) {
      throw new Error('Não foi possível conectar ao servidor de email. Verifique as suas credenciais ou tente novamente.');
    }
    
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

  sendMessage: async (accountEmail: string, password: string, toEmail: string, subject: string, body: string, attachments?: WebmailAttachment[]): Promise<WebmailMessage> => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // In production, require real credentials
    if (isProduction && (!accountEmail || !password)) {
      throw new Error('Credenciais de email são obrigatórias');
    }

    // If real credentials provided, use SMTP
    if (password && webmailManager.isRealEmailAvailable(accountEmail, password)) {
      try {
        // Fetch real attachment content if attachments are provided
        const attachmentContents = await Promise.all(
          (attachments || []).map(async (att) => {
            if (att.url && att.url.startsWith('data:')) {
              // If already has base64 content, decode it
              const base64Data = att.url.split(',')[1];
              return {
                filename: att.name,
                content: Buffer.from(base64Data, 'base64'),
                contentType: att.type
              };
            } else if (att.url) {
              // If URL is provided, fetch the content
              try {
                const res = await fetch(att.url);
                const buffer = await res.arrayBuffer();
                return {
                  filename: att.name,
                  content: Buffer.from(buffer),
                  contentType: att.type
                };
              } catch (err) {
                console.error('[Webmail] Failed to fetch attachment:', att.name);
                return null;
              }
            }
            return null;
          })
        );

        // Filter out failed attachments
        const validAttachments = attachmentContents.filter(a => a !== null);

        await migaduImapSmtp.sendEmail({
          from: accountEmail,
          to: [toEmail],
          subject,
          text: body,
          html: body,
          attachments: validAttachments
        }, password);

        // Return a sent message representation
        return {
          id: `smtp-${Date.now()}`,
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
      } catch (error) {
        console.error('[Webmail] SMTP send failed:', error);
        // In production, throw error instead of falling back
        if (isProduction) {
          throw new Error('Não foi possível enviar o email. O servidor de email não está disponível neste momento.');
        }
        // In development, fall back to simulation
      }
    }

    // Fallback to localStorage simulation (only in development)
    if (isProduction) {
      throw new Error('Não foi possível enviar o email. O servidor de email não está disponível neste momento.');
    }
    
    const messages = await webmailManager.getMessages();
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

  toggleStar: async (id: string, accountEmail?: string, password?: string): Promise<void> => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // In production, require real credentials
    if (isProduction && (!accountEmail || !password)) {
      throw new Error('Credenciais de email são obrigatórias');
    }

    // If real credentials provided, use IMAP
    if (accountEmail && password && webmailManager.isRealEmailAvailable(accountEmail, password)) {
      try {
        const messages = await webmailManager.getMessages(accountEmail, password);
        const msg = messages.find(m => m.id === id);
        if (msg && msg.uid) {
          // In production, you would update the flags on the IMAP server
          // For now, this is a placeholder
        }
      } catch (error) {
        console.error('[Webmail] IMAP toggle star failed:', error);
        // In production, throw error instead of falling back
        if (isProduction) {
          throw new Error('Não foi possível atualizar a mensagem. O servidor de email não está disponível.');
        }
        // In development, fall back to simulation
      }
    }

    // Fallback to localStorage simulation (only in development)
    if (isProduction) {
      throw new Error('Não foi possível atualizar a mensagem. O servidor de email não está disponível.');
    }
    
    const messages = await webmailManager.getMessages();
    const msg = messages.find(m => m.id === id);
    if (msg) {
      msg.starred = !msg.starred;
      if (typeof window !== 'undefined') {
        localStorage.setItem(WEBMAIL_STORAGE_KEY, JSON.stringify(messages));
      }
    }
  },

  markAsRead: async (id: string, isRead = true, accountEmail?: string, password?: string): Promise<void> => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // In production, require real credentials
    if (isProduction && (!accountEmail || !password)) {
      throw new Error('Credenciais de email são obrigatórias');
    }

    // If real credentials provided, use IMAP
    if (accountEmail && password && webmailManager.isRealEmailAvailable(accountEmail, password)) {
      try {
        const messages = await webmailManager.getMessages(accountEmail, password);
        const msg = messages.find(m => m.id === id);
        if (msg && msg.uid) {
          await migaduImapSmtp.markAsRead(accountEmail, password, msg.uid, isRead);
        }
      } catch (error) {
        console.error('[Webmail] IMAP mark as read failed:', error);
        // In production, throw error instead of falling back
        if (isProduction) {
          throw new Error('Não foi possível atualizar a mensagem. O servidor de email não está disponível.');
        }
        // In development, fall back to simulation
      }
    }

    // Fallback to localStorage simulation (only in development)
    if (isProduction) {
      throw new Error('Não foi possível atualizar a mensagem. O servidor de email não está disponível.');
    }
    
    const messages = await webmailManager.getMessages();
    const msg = messages.find(m => m.id === id);
    if (msg) {
      msg.isRead = isRead;
      if (typeof window !== 'undefined') {
        localStorage.setItem(WEBMAIL_STORAGE_KEY, JSON.stringify(messages));
      }
    }
  },

  moveFolder: async (id: string, newFolder: 'inbox' | 'sent' | 'drafts' | 'trash', accountEmail?: string, password?: string): Promise<void> => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // In production, require real credentials
    if (isProduction && (!accountEmail || !password)) {
      throw new Error('Credenciais de email são obrigatórias');
    }

    // If real credentials provided, use IMAP
    if (accountEmail && password && webmailManager.isRealEmailAvailable(accountEmail, password)) {
      try {
        const messages = await webmailManager.getMessages(accountEmail, password);
        const msg = messages.find(m => m.id === id);
        if (msg && msg.uid) {
          const folderMap = {
            'inbox': 'INBOX',
            'sent': 'Sent',
            'drafts': 'Drafts',
            'trash': 'Trash'
          };
          await migaduImapSmtp.moveMessage(accountEmail, password, msg.uid, msg.folder, folderMap[newFolder]);
        }
      } catch (error) {
        console.error('[Webmail] IMAP move folder failed:', error);
        // In production, throw error instead of falling back
        if (isProduction) {
          throw new Error('Não foi possível mover a mensagem. O servidor de email não está disponível.');
        }
        // In development, fall back to simulation
      }
    }

    // Fallback to localStorage simulation (only in development)
    if (isProduction) {
      throw new Error('Não foi possível mover a mensagem. O servidor de email não está disponível.');
    }
    
    const messages = await webmailManager.getMessages();
    const msg = messages.find(m => m.id === id);
    if (msg) {
      msg.folder = newFolder;
      if (typeof window !== 'undefined') {
        localStorage.setItem(WEBMAIL_STORAGE_KEY, JSON.stringify(messages));
      }
    }
  },

  deletePermanently: async (id: string, accountEmail?: string, password?: string): Promise<void> => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // In production, require real credentials
    if (isProduction && (!accountEmail || !password)) {
      throw new Error('Credenciais de email são obrigatórias');
    }

    // If real credentials provided, use IMAP
    if (accountEmail && password && webmailManager.isRealEmailAvailable(accountEmail, password)) {
      try {
        const messages = await webmailManager.getMessages(accountEmail, password);
        const msg = messages.find(m => m.id === id);
        if (msg && msg.uid) {
          await migaduImapSmtp.deleteMessage(accountEmail, password, msg.uid, msg.folder);
        }
      } catch (error) {
        console.error('[Webmail] IMAP delete failed:', error);
        // In production, throw error instead of falling back
        if (isProduction) {
          throw new Error('Não foi possível apagar a mensagem. O servidor de email não está disponível.');
        }
        // In development, fall back to simulation
      }
    }

    // Fallback to localStorage simulation (only in development)
    if (isProduction) {
      throw new Error('Não foi possível apagar a mensagem. O servidor de email não está disponível.');
    }
    
    const messages = await webmailManager.getMessages();
    const filtered = messages.filter(m => m.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(WEBMAIL_STORAGE_KEY, JSON.stringify(filtered));
    }
  },

  saveDraft: async (accountEmail: string, toEmail: string, subject: string, body: string, attachments?: WebmailAttachment[], password?: string): Promise<WebmailMessage> => {
    // For drafts, we always use localStorage for now
    // In production, you might want to save drafts on the IMAP server
    const messages = await webmailManager.getMessages();
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

  getDrafts: async (accountEmail?: string, password?: string): Promise<WebmailMessage[]> => {
    const messages = await webmailManager.getMessages(accountEmail, password);
    return messages.filter(m => m.folder === 'drafts');
  },

  // Get IMAP configuration for a mailbox
  getIMAPConfig: (email: string) => {
    return migaduImapSmtp.getIMAPConfig(email);
  },

  // Get SMTP configuration for a mailbox
  getSMTPConfig: (email: string) => {
    return migaduImapSmtp.getSMTPConfig(email);
  }
};
